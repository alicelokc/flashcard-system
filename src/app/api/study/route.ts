import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applySm2, Rating } from "@/lib/sm2";
import { hkDateString, updateStreakOnGoalMet, resetIfBroken } from "@/lib/streak";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deckId = req.nextUrl.searchParams.get("deckId");
  const practiceAll = req.nextUrl.searchParams.get("practiceAll") === "1";

  const assignments = await prisma.deckAssignment.findMany({
    where: { studentId: session.user.id, ...(deckId ? { deckId } : {}) },
    select: { deckId: true },
  });
  const deckIds = assignments.map((a) => a.deckId);
  if (!deckIds.length) return NextResponse.json({ cards: [], dueCount: 0 });

  const approvedCards = await prisma.card.findMany({
    where: { deckId: { in: deckIds }, status: "APPROVED", archived: false },
    include: {
      submittedBy: { select: { name: true } },
      unfamiliar: { where: { studentId: session.user.id }, select: { id: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  // Lazy-create missing card states
  const existingStates = await prisma.cardState.findMany({
    where: { studentId: session.user.id, cardId: { in: approvedCards.map((c) => c.id) } },
  });
  const stateMap = new Map(existingStates.map((s) => [s.cardId, s]));
  const missing = approvedCards.filter((c) => !stateMap.has(c.id));
  if (missing.length) {
    await prisma.cardState.createMany({
      data: missing.map((c) => ({
        cardId: c.id,
        studentId: session.user.id,
        nextReview: new Date(),
      })),
    });
    const refreshed = await prisma.cardState.findMany({
      where: { studentId: session.user.id, cardId: { in: approvedCards.map((c) => c.id) } },
    });
    refreshed.forEach((s) => stateMap.set(s.cardId, s));
  }

  const now = new Date();
  const withState = approvedCards.map((c) => ({
    ...c,
    state: stateMap.get(c.id)!,
    isUnfamiliar: c.unfamiliar.length > 0,
  }));

  const due = practiceAll
    ? withState
    : withState
        .filter((c) => c.state.nextReview.getTime() <= now.getTime())
        .sort((a, b) => a.state.nextReview.getTime() - b.state.nextReview.getTime());

  return NextResponse.json({
    cards: due.map((c) => ({
      id: c.id,
      deckId: c.deckId,
      frontText: c.frontText,
      backText: c.backText,
      frontImage: c.frontImage,
      backImage: c.backImage,
      contributor: c.submittedBy?.name || null,
      isUnfamiliar: c.isUnfamiliar,
      nextReview: c.state.nextReview,
    })),
    dueCount: withState.filter((c) => c.state.nextReview.getTime() <= now.getTime()).length,
    totalApproved: approvedCards.length,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { cardId, rating } = await req.json();
  if (!cardId || ![1, 2, 3, 4].includes(rating)) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card || card.status !== "APPROVED") {
    return NextResponse.json({ error: "Card not studyable" }, { status: 400 });
  }

  let state = await prisma.cardState.findUnique({
    where: { cardId_studentId: { cardId, studentId: session.user.id } },
  });
  if (!state) {
    state = await prisma.cardState.create({
      data: { cardId, studentId: session.user.id, nextReview: new Date() },
    });
  }

  const result = applySm2(
    {
      easeFactor: state.easeFactor,
      interval: state.interval,
      repetitions: state.repetitions,
    },
    rating as Rating
  );

  await prisma.cardState.update({
    where: { id: state.id },
    data: {
      easeFactor: result.easeFactor,
      interval: result.interval,
      repetitions: result.repetitions,
      nextReview: result.nextReview,
      lastResult: rating,
    },
  });

  await prisma.reviewLog.create({
    data: { cardId, studentId: session.user.id, rating },
  });

  // Streak: check daily goal
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user) {
    const today = hkDateString();
    const startOfDay = new Date(`${today}T00:00:00+08:00`);
    const reviewsToday = await prisma.reviewLog.count({
      where: { studentId: session.user.id, reviewedAt: { gte: startOfDay } },
    });

    let streakFields = resetIfBroken({
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastStudyDate: user.lastStudyDate,
    });

    if (reviewsToday >= user.dailyGoal) {
      streakFields = updateStreakOnGoalMet(streakFields, today);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        currentStreak: streakFields.currentStreak,
        longestStreak: streakFields.longestStreak,
        lastStudyDate: streakFields.lastStudyDate,
      },
    });
  }

  return NextResponse.json({ ok: true, nextReview: result.nextReview });
}
