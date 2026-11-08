import { describe, it, expect } from "vitest";
import { applySm2, isDue, masteryPercent } from "../src/lib/sm2";

describe("SM-2 scheduling", () => {
  const base = { easeFactor: 2.5, interval: 0, repetitions: 0 };

  it("Again resets repetitions and schedules soon", () => {
    const now = new Date("2026-11-09T04:00:00Z");
    const r = applySm2(base, 1, now);
    expect(r.repetitions).toBe(0);
    expect(r.interval).toBe(0);
    expect(r.nextReview.getTime()).toBeGreaterThan(now.getTime());
    expect(r.nextReview.getTime() - now.getTime()).toBeLessThanOrEqual(10 * 60 * 1000);
    expect(r.easeFactor).toBeLessThan(2.5);
  });

  it("Good on first review sets interval to 1 day", () => {
    const now = new Date("2026-11-09T04:00:00Z");
    const r = applySm2(base, 3, now);
    expect(r.repetitions).toBe(1);
    expect(r.interval).toBe(1);
    expect(isDue(r.nextReview, now)).toBe(false);
  });

  it("Easy grows interval faster than Good on later reps", () => {
    const state = { easeFactor: 2.5, interval: 6, repetitions: 2 };
    const good = applySm2(state, 3, new Date());
    const easy = applySm2(state, 4, new Date());
    expect(easy.interval).toBeGreaterThan(good.interval);
  });

  it("masteryPercent counts learned cards", () => {
    expect(masteryPercent([])).toBe(0);
    expect(
      masteryPercent([
        { interval: 10, repetitions: 3 },
        { interval: 0, repetitions: 0 },
      ])
    ).toBe(50);
  });
});
