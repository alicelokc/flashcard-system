import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeLeaderboardScore } from "@/lib/leaderboard";
import { effectiveCurrentStreak, hkDateString, resetIfBroken } from "@/lib/streak";
import { subDays } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { name: "asc" },
  });

  const weekAgo = subDays(new Date(), 7);
  const today = hkDateString();

  const rows = await Promise.all(
    students.map(async (s) => {
      const streak = resetIfBroken({
        currentStreak: s.currentStreak,
        longestStreak: s.longestStreak,
        lastStudyDate: s.lastStudyDate,
      });
      const currentStreak = effectiveCurrentStreak(streak, today);

      const reviewsThisWeek = await prisma.reviewLog.count({
        where: { studentId: s.id, reviewedAt: { gte: weekAgo } },
      });
      const allReviews = await prisma.reviewLog.findMany({
        where: { studentId: s.id },
        select: { rating: true },
      });
      const goodOrEasy = allReviews.filter((r) => r.rating >= 3).length;
      const approvedContributions = await prisma.card.count({
        where: { submittedById: s.id, status: "APPROVED" },
      });

      const score = computeLeaderboardScore({
        reviewsThisWeek,
        currentStreak,
        approvedContributions,
        goodOrEasy,
        totalReviews: allReviews.length,
      });

      const accuracy = allReviews.length ? goodOrEasy / allReviews.length : 0;

      return {
        userId: s.id,
        name: s.name,
        score,
        currentStreak,
        longestStreak: s.longestStreak,
        reviewsThisWeek,
        approvedContributions,
        accuracy,
        isCurrentUser: s.id === session.user.id,
      };
    })
  );

  rows.sort((a, b) => b.score - a.score || b.currentStreak - a.currentStreak);
  const ranked = rows.map((r, i) => ({ ...r, rank: i + 1 }));

  return NextResponse.json({
    formula: "reviewsThisWeek*1 + currentStreak*5 + approvedContributions*10 + round(accuracy*20)",
    entries: ranked,
  });
}
