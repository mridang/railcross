/**
 * @file Schedule configuration type and helpers that compute when a schedule next fires.
 */

/**
 * The persisted configuration for a single lock or unlock schedule.
 *
 * One of these is stored in KV per `${installationId}.${repoId}.${taskName}`
 * key and is also handed to the Durable Object alarm as its payload.
 */
export interface ScheduleConfig {
  installationId: number;
  repoId: number;
  repoName: string;
  /** The local hour-of-day (0–23) at which the task fires, minute zero. */
  hour: number;
  /** The IANA timezone the {@link hour} is expressed in. */
  timeZone: string;
  /** Either `locker` or `unlocker`. */
  taskName: string;
}

/**
 * Extract the wall-clock parts of an instant as observed in a timezone.
 * @param timeZone - The IANA timezone to read the instant in.
 * @param epochMs - The instant, in milliseconds since the Unix epoch.
 * @returns The year, month (1–12), day and hour (0–23) seen in the time zone.
 * @example
 * ```ts
 * wallClockParts('Europe/London', Date.UTC(2026, 10, 11, 12)); // { year: 2026, month: 11, day: 11, hour: 12 }
 * ```
 */
function wallClockParts(
  timeZone: string,
  epochMs: number,
): { year: number; month: number; day: number; hour: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const part of formatter.formatToParts(new Date(epochMs))) {
    parts[part.type] = part.value;
  }
  const hour = Number(parts.hour);
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: hour === 24 ? 0 : hour,
  };
}

/**
 * Resolve the epoch instant for a given wall-clock time in a timezone.
 *
 * This inverts {@link Intl.DateTimeFormat}: it guesses the instant as if the
 * wall clock were UTC, measures how far the timezone is from UTC at that guess,
 * and corrects for it — which is DST-safe because the offset is read at the
 * candidate instant itself.
 * @param timeZone - The IANA timezone the wall clock is expressed in.
 * @param year - The four-digit year.
 * @param month - The month, 1–12.
 * @param day - The day of the month.
 * @param hour - The hour of day, 0–23 (minute and second are taken as zero).
 * @returns The corresponding instant in milliseconds since the Unix epoch.
 * @example
 * ```ts
 * epochForWallClock('Europe/London', 2026, 11, 11, 7); // the epoch for 07:00 London time
 * ```
 */
function epochForWallClock(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
): number {
  const guess = Date.UTC(year, month - 1, day, hour, 0, 0);
  const seenAt = wallClockParts(timeZone, guess);
  const seenAsUtc = Date.UTC(
    seenAt.year,
    seenAt.month - 1,
    seenAt.day,
    seenAt.hour,
    0,
    0,
  );
  const offset = seenAsUtc - guess;
  return guess - offset;
}

/**
 * Compute the next instant at which a schedule should fire.
 *
 * Finds the soonest future moment when the local time in `timeZone` is
 * `hour:00`, scanning today and the following days so it always returns an
 * instant strictly after `nowMs`.
 * @param hour - The local hour-of-day (0–23) the schedule fires at.
 * @param timeZone - The IANA timezone the hour is expressed in.
 * @param nowMs - The current instant in milliseconds since the Unix epoch.
 * @returns The next firing instant in milliseconds since the Unix epoch.
 * @throws {Error} When no occurrence is found within the next few days.
 * @example
 * ```ts
 * const fireAt = nextOccurrence(7, 'Europe/London', Date.now());
 * ```
 */
export function nextOccurrence(
  hour: number,
  timeZone: string,
  nowMs: number,
): number {
  const today = wallClockParts(timeZone, nowMs);
  const base = Date.UTC(today.year, today.month - 1, today.day);
  for (let dayOffset = 0; dayOffset <= 2; dayOffset++) {
    const day = new Date(base);
    day.setUTCDate(day.getUTCDate() + dayOffset);
    const candidate = epochForWallClock(
      timeZone,
      day.getUTCFullYear(),
      day.getUTCMonth() + 1,
      day.getUTCDate(),
      hour,
    );
    if (candidate > nowMs) {
      return candidate;
    }
  }
  throw new Error(`Unable to compute next occurrence for hour ${hour}`);
}
