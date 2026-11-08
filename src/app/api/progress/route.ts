import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { masteryPercent } from "@/lib/sm2";
import { effectiveCurrentStreak, hkDateString, resetIfBroken } from "@/lib/streak";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role === "TEACHER") {
    const pending = await prisma.card.count({ where: { status: "PENDING" } });
    const students = await prisma.user.findMany({ where: { role: "STUDENT" } });
    const today = hkDateString();
    const stats = await Promise.all(
      students.map(async (s) => {
        const streak = resetIfBroken({
          currentStreak: s.currentStreak,
          longestStreak: s.longestStreak,
          lastStudyDate: s.lastStudyDate,
        });
        const reviews = await prisma.reviewLog.findMany({
          where: { studentId: s.id },
          select: { rating: true },
        });
        const good = reviews.filter((r) => r.rating >= 3).length;
        const states = await prisma.cardState.findMany({ where: { studentId: s.id } });
        const backlog = states.filter((st) => st.nextReview.getTime() <= Date.now()).length;
        const unfamiliar = await prisma.unfamiliarFlag.count({ where: { studentId: s.id } });
        const submitted = await prisma.card.count({ where: { submittedById: s.id } });
        const approved = await prisma.card.count({
          where: { submittedById: s.id, status: "APPROVED" },
        });
        return {
          id: s.id,
          name: s.name,
          email: s.email,
          studied: reviews.length,
          accuracy: reviews.length ? Math.round((good / reviews.length) * 100) : 0,
          currentStreak: effectiveCurrentStreak(streak, today),
          longestStreak: s.longestStreak,
          backlog,
          unfamiliar,
          submitted,
          approved,
          lastStudyDate: s.lastStudyDate,
        };
      })
    );
    return NextResponse.json({ role: "TEACHER", pending, students: stats });
  }

  // Student progress — chapter decks with mastery + due (forgetting-curve push)
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const today = hkDateString();
  const startOfDay = new Date(`${today}T00:00:00+08:00`);
  const reviewsToday = await prisma.reviewLog.count({
    where: { studentId: user.id, reviewedAt: { gte: startOfDay } },
  });

  const assignments = await prisma.deckAssignment.findMany({
    where: { studentId: user.id },
    include: {
      deck: {
        include: {
          cards: { where: { status: "APPROVED", archived: false }, select: { id: true } },
        },
      },
    },
    orderBy: { deck: { title: "asc" } },
  });

  const now = Date.now();
  const decks = await Promise.all(
    assignments.map(async (a) => {
      const cardIds = a.deck.cards.map((c) => c.id);
      const states = await prisma.cardState.findMany({
        where: { studentId: user.id, cardId: { in: cardIds } },
      });
      const stateByCard = new Map(states.map((s) => [s.cardId, s]));
      // No state yet = new card = due now (SM-2 will create state on study)
      const due = cardIds.filter((id) => {
        const s = stateByCard.get(id);
        return !s || s.nextReview.getTime() <= now;
      }).length;
      const newCount = cardIds.filter((id) => !stateByCard.has(id)).length;
      return {
        id: a.deck.id,
        title: a.deck.title,
        subject: a.deck.subject,
        description: a.deck.description,
        totalCards: cardIds.length,
        mastery: masteryPercent(states),
        due,
        newCount,
      };
    })
  );

  // Due chapters first, then chapter title order
  decks.sort((a, b) => {
    if (b.due !== a.due) return b.due - a.due;
    return a.title.localeCompare(b.title, undefined, { numeric: true });
  });

  const totalDue = decks.reduce((sum, d) => sum + d.due, 0);

  const streak = resetIfBroken({
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    lastStudyDate: user.lastStudyDate,
  });
  if (streak.currentStreak !== user.currentStreak) {
    await prisma.user.update({
      where: { id: user.id },
      data: { currentStreak: streak.currentStreak },
    });
  }

  const approvedMine = await prisma.card.count({
    where: { submittedById: user.id, status: "APPROVED" },
  });

  return NextResponse.json({
    role: "STUDENT",
    name: user.name,
    dailyGoal: user.dailyGoal,
    reviewsToday,
    currentStreak: effectiveCurrentStreak(streak, today),
    longestStreak: user.longestStreak,
    approvedContributions: approvedMine,
    totalDue,
    decks,
  });
}
