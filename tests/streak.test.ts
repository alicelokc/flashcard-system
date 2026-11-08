import { describe, it, expect } from "vitest";
import {
  updateStreakOnGoalMet,
  effectiveCurrentStreak,
  resetIfBroken,
} from "../src/lib/streak";

describe("儲火 streak", () => {
  it("increments on consecutive days", () => {
    const s = updateStreakOnGoalMet(
      { currentStreak: 2, longestStreak: 5, lastStudyDate: "2026-11-08" },
      "2026-11-09"
    );
    expect(s.currentStreak).toBe(3);
    expect(s.longestStreak).toBe(5);
    expect(s.lastStudyDate).toBe("2026-11-09");
  });

  it("resets to 1 after a missed day", () => {
    const s = updateStreakOnGoalMet(
      { currentStreak: 4, longestStreak: 4, lastStudyDate: "2026-11-06" },
      "2026-11-09"
    );
    expect(s.currentStreak).toBe(1);
  });

  it("does not double-count same day", () => {
    const s = updateStreakOnGoalMet(
      { currentStreak: 3, longestStreak: 3, lastStudyDate: "2026-11-09" },
      "2026-11-09"
    );
    expect(s.currentStreak).toBe(3);
  });

  it("effectiveCurrentStreak is 0 when last study was before yesterday", () => {
    expect(
      effectiveCurrentStreak(
        { currentStreak: 5, longestStreak: 5, lastStudyDate: "2026-11-01" },
        "2026-11-09"
      )
    ).toBe(0);
  });

  it("resetIfBroken zeroes current streak when broken", () => {
    const s = resetIfBroken(
      { currentStreak: 5, longestStreak: 5, lastStudyDate: "2026-11-01" },
      "2026-11-09"
    );
    expect(s.currentStreak).toBe(0);
    expect(s.longestStreak).toBe(5);
  });
});
