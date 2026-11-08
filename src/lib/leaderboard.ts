/**
 * Leaderboard score formula (documented in README):
 * score = reviewsThisWeek * 1
 *       + currentStreak * 5
 *       + approvedContributions * 10
 *       + round(accuracy * 20)
 *
 * accuracy = goodOrEasy / totalReviews (0–1), 0 if no reviews
 */
export function computeLeaderboardScore(input: {
  reviewsThisWeek: number;
  currentStreak: number;
  approvedContributions: number;
  goodOrEasy: number;
  totalReviews: number;
}): number {
  const accuracy = input.totalReviews > 0 ? input.goodOrEasy / input.totalReviews : 0;
  return (
    input.reviewsThisWeek * 1 +
    input.currentStreak * 5 +
    input.approvedContributions * 10 +
    Math.round(accuracy * 20)
  );
}
