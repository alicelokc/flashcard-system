/**
 * SM-2 spaced repetition algorithm (simplified).
 * Ratings: 1=Again, 2=Hard, 3=Good, 4=Easy
 */
export type Rating = 1 | 2 | 3 | 4;

export interface Sm2State {
  easeFactor: number;
  interval: number; // days
  repetitions: number;
}

export interface Sm2Result extends Sm2State {
  nextReview: Date;
}

export function applySm2(state: Sm2State, rating: Rating, now = new Date()): Sm2Result {
  let { easeFactor, interval, repetitions } = state;

  if (rating === 1) {
    // Again — reset
    repetitions = 0;
    interval = 0;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    if (repetitions === 0) {
      interval = rating === 2 ? 1 : rating === 3 ? 1 : 2;
    } else if (repetitions === 1) {
      interval = rating === 2 ? 3 : rating === 3 ? 6 : 8;
    } else {
      const hardMod = rating === 2 ? 1.2 : rating === 3 ? 1.0 : 1.3;
      interval = Math.max(1, Math.round(interval * easeFactor * hardMod));
    }
    repetitions += 1;

    // Ease factor adjustment (SM-2 style mapped from 1–4)
    // q = rating + 1 maps roughly to classic 0–5 scale quality when rating is 1–4 → 2–5
    const q = rating + 1;
    easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    easeFactor = Math.max(1.3, easeFactor);
  }

  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + interval);
  // If Again, due again soon (same day / next few minutes → treat as due now + 10 min for UX)
  if (rating === 1) {
    nextReview.setTime(now.getTime() + 10 * 60 * 1000);
  }

  return { easeFactor, interval, repetitions, nextReview };
}

export function isDue(nextReview: Date, now = new Date()): boolean {
  return nextReview.getTime() <= now.getTime();
}

export function masteryPercent(
  states: { interval: number; repetitions: number }[],
  learnedIntervalDays = 7
): number {
  if (states.length === 0) return 0;
  const learned = states.filter((s) => s.interval >= learnedIntervalDays || s.repetitions >= 3).length;
  return Math.round((learned / states.length) * 100);
}
