import { describe, it, expect } from "vitest";
import { computeLeaderboardScore } from "../src/lib/leaderboard";

describe("leaderboard score", () => {
  it("matches documented formula", () => {
    // reviewsThisWeek*1 + streak*5 + contributions*10 + round(accuracy*20)
    const score = computeLeaderboardScore({
      reviewsThisWeek: 20,
      currentStreak: 3,
      approvedContributions: 2,
      goodOrEasy: 8,
      totalReviews: 10, // accuracy 0.8 → 16
    });
    expect(score).toBe(20 + 15 + 20 + 16);
  });

  it("handles zero reviews", () => {
    expect(
      computeLeaderboardScore({
        reviewsThisWeek: 0,
        currentStreak: 0,
        approvedContributions: 0,
        goodOrEasy: 0,
        totalReviews: 0,
      })
    ).toBe(0);
  });
});
