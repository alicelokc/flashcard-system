import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { subDays, parseISO, differenceInCalendarDays } from "date-fns";

export const HK_TZ = "Asia/Hong_Kong";

/** Calendar date string YYYY-MM-DD in Asia/Hong_Kong */
export function hkDateString(date = new Date()): string {
  return formatInTimeZone(date, HK_TZ, "yyyy-MM-dd");
}

export function hkYesterday(date = new Date()): string {
  const zoned = toZonedTime(date, HK_TZ);
  return formatInTimeZone(subDays(zoned, 1), HK_TZ, "yyyy-MM-dd");
}

export interface StreakFields {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
}

/**
 * After a student meets the daily goal on `studyDate` (HK YYYY-MM-DD):
 * - If lastStudyDate is today → no change
 * - If lastStudyDate is yesterday → currentStreak += 1
 * - Else → currentStreak = 1 (broken or first day)
 * longestStreak = max(longest, current)
 */
export function updateStreakOnGoalMet(
  fields: StreakFields,
  studyDate: string
): StreakFields {
  if (fields.lastStudyDate === studyDate) {
    return { ...fields };
  }

  let currentStreak: number;
  if (fields.lastStudyDate) {
    const last = parseISO(fields.lastStudyDate);
    const today = parseISO(studyDate);
    const gap = differenceInCalendarDays(today, last);
    if (gap === 1) {
      currentStreak = fields.currentStreak + 1;
    } else {
      currentStreak = 1;
    }
  } else {
    currentStreak = 1;
  }

  return {
    currentStreak,
    longestStreak: Math.max(fields.longestStreak, currentStreak),
    lastStudyDate: studyDate,
  };
}

/**
 * If lastStudyDate is before yesterday (HK), current streak should display as 0.
 * Call this when reading streak for display (does not persist unless you save).
 */
export function effectiveCurrentStreak(fields: StreakFields, today = hkDateString()): number {
  if (!fields.lastStudyDate) return 0;
  if (fields.lastStudyDate === today) return fields.currentStreak;
  if (fields.lastStudyDate === hkYesterday()) return fields.currentStreak;
  return 0;
}

/**
 * Persist reset if streak is broken (missed a full day).
 */
export function resetIfBroken(fields: StreakFields, today = hkDateString()): StreakFields {
  const effective = effectiveCurrentStreak(fields, today);
  if (effective === 0 && fields.currentStreak !== 0) {
    return { ...fields, currentStreak: 0 };
  }
  return fields;
}
