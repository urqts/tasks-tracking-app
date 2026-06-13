import { addDays, addWeeks, addMonths, addYears } from "date-fns";
import type { RecurrenceFrequency } from "@prisma/client";

/**
 * Given the last occurrence date and a recurrence rule, compute the next due
 * date. For WEEKLY with `byWeekday`, advances to the next matching weekday.
 */
export function computeNextOccurrence(
  from: Date,
  frequency: RecurrenceFrequency,
  interval: number,
  byWeekday?: string | null,
  byMonthDay?: number | null,
): Date {
  switch (frequency) {
    case "DAILY":
      return addDays(from, interval);
    case "WEEKLY": {
      if (byWeekday) {
        const days = byWeekday
          .split(",")
          .map((d) => parseInt(d.trim(), 10))
          .filter((n) => !Number.isNaN(n))
          .sort((a, b) => a - b);
        if (days.length) {
          for (let i = 1; i <= 7 * interval; i++) {
            const candidate = addDays(from, i);
            if (days.includes(candidate.getDay())) return candidate;
          }
        }
      }
      return addWeeks(from, interval);
    }
    case "MONTHLY": {
      const next = addMonths(from, interval);
      if (byMonthDay) next.setDate(Math.min(byMonthDay, daysInMonth(next)));
      return next;
    }
    case "YEARLY":
      return addYears(from, interval);
    case "CUSTOM":
    default:
      return addDays(from, interval);
  }
}

function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}
