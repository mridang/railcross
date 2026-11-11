/**
 * @file Locale-aware text, number, date and list formatting built on the standard Intl APIs.
 *
 * Everything here uses one fixed locale, English. The interface text around
 * these values is English, so mixing in the visitor's locale would produce
 * half-translated sentences, and a fixed locale keeps server and browser output
 * identical (no hydration mismatches, stable API messages). Changing
 * {@link LOCALE} is the single switch if the app is ever translated.
 * @packageDocumentation
 */

/** The locale used for all formatting. */
const LOCALE = 'en';

const collator = new Intl.Collator(LOCALE, {
  // "Apple" = "apple" = "Äpple" for ordering purposes; ties fall to the caller.
  sensitivity: 'base',
  // "Recipe 2" before "Recipe 10".
  numeric: true,
});

/**
 * Compares two strings the way a person would alphabetise them.
 *
 * Accents and case are ignored, and runs of digits compare as numbers. Returns 0
 * for strings that differ only by accent or case, so callers should break ties
 * themselves.
 * @param a - The first string to compare.
 * @param b - The second string to compare.
 * @returns A negative number when `a` sorts first, a positive one when `b` does, otherwise 0.
 * @example
 * ```ts
 * ['Recipe 10', 'Éclair', 'Recipe 2'].sort(compareText);
 * // ['Éclair', 'Recipe 2', 'Recipe 10']
 * ```
 */
export function compareText(a: string, b: string): number {
  return collator.compare(a, b);
}

/**
 * Folds text for searching: lower case with accents removed.
 *
 * Intl can compare whole strings but has no substring search, so matching uses
 * this folded form with `includes`.
 * @param text - The text to fold.
 * @returns The lower-cased text with combining marks removed.
 * @example
 * ```ts
 * foldText('Crème brûlée').includes(foldText('creme'));
 * // true
 * ```
 */
export function foldText(text: string): string {
  return text
    .normalize('NFD')
    .replaceAll(/\p{M}+/gu, '')
    .toLowerCase();
}

const plurals = new Intl.PluralRules(LOCALE);
const counts = new Intl.NumberFormat(LOCALE);

/**
 * Formats a count with its noun in the right plural form.
 * @param n - The number of items being counted.
 * @param one - The singular noun, used when `n` is one.
 * @param many - The plural noun, used for every other count. Defaults to `one` with an "s".
 * @returns The count and the noun, such as "2 recipes".
 * @example
 * ```ts
 * countOf(1, 'recipe'); // '1 recipe'
 * countOf(2, 'recipe'); // '2 recipes'
 * countOf(2, 'child', 'children'); // '2 children'
 * ```
 */
export function countOf(n: number, one: string, many = `${one}s`): string {
  return `${counts.format(n)} ${plurals.select(n) === 'one' ? one : many}`;
}

/**
 * Builds a number formatter that keeps at most the given decimal places.
 * @param maxFractionDigits - The most decimal places the formatter may print.
 * @returns A formatter with no thousands separators.
 * @example
 * ```ts
 * decimalFormat(1).format(1.25); // '1.3'
 * ```
 */
const decimalFormat = (maxFractionDigits: number): Intl.NumberFormat =>
  new Intl.NumberFormat(LOCALE, {
    maximumFractionDigits: maxFractionDigits,
    useGrouping: false,
  });

/** Formatters built once for the precisions in common use (0 to 6 places). */
const COMMON_DECIMALS = Array.from({ length: 7 }, (_, places) =>
  decimalFormat(places),
);

/**
 * Formats a plain decimal for a quantity.
 *
 * The result has at most `maxFractionDigits` places, no trailing zeros and no
 * thousands separators.
 * @param value - The number to format.
 * @param maxFractionDigits - The most decimal places to print. Defaults to 2.
 * @returns The formatted number, such as "0.5", "250" or "1.25".
 * @example
 * ```ts
 * formatQuantityNumber(0.5); // '0.5'
 * formatQuantityNumber(1234.5); // '1234.5'
 * formatQuantityNumber(1.256, 1); // '1.3'
 * ```
 */
export function formatQuantityNumber(
  value: number,
  maxFractionDigits = 2,
): string {
  const format =
    COMMON_DECIMALS[maxFractionDigits] ?? decimalFormat(maxFractionDigits);
  return format.format(value);
}

/** Says a gap in time in words ("yesterday", "in 2 hours"). */
const relative = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });

/** Seconds in each unit, largest first, for choosing how to say an age. */
const UNITS: readonly (readonly [Intl.RelativeTimeFormatUnit, number])[] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/**
 * Describes how long ago, or how far from now, a moment is, in words.
 *
 * Anything within a minute is "now".
 * @param when - The moment to describe, as a `Date` or a parseable date string.
 * @param now - The reference moment to measure from. Defaults to the current time.
 * @returns A phrase such as "yesterday", "3 days ago" or "in 2 hours".
 * @example
 * ```ts
 * relativeTime('2026-11-10T12:00:00Z', new Date('2026-11-11T12:00:00Z'));
 * // 'yesterday'
 * ```
 */
export function relativeTime(
  when: Date | string,
  now: Date = new Date(),
): string {
  const seconds = (new Date(when).getTime() - now.getTime()) / 1000;
  const magnitude = Math.abs(seconds);
  for (const [unit, size] of UNITS) {
    if (magnitude >= size) {
      return relative.format(Math.round(seconds / size), unit);
    }
  }
  return relative.format(0, 'second');
}

/** Joins items with "and". */
const andList = new Intl.ListFormat(LOCALE, {
  style: 'long',
  type: 'conjunction',
});
/** Joins items with "or". */
const orList = new Intl.ListFormat(LOCALE, {
  style: 'long',
  type: 'disjunction',
});

/**
 * Joins items into a list with "and" before the last one.
 * @param items - The items to join, in display order.
 * @returns The joined text, such as "a, b and c".
 * @example
 * ```ts
 * listAnd(['eggs', 'milk', 'flour']); // 'eggs, milk and flour'
 * ```
 */
export function listAnd(items: readonly string[]): string {
  return andList.format(items);
}

/**
 * Joins items into a list with "or" before the last one.
 * @param items - The items to join, in display order.
 * @returns The joined text, such as "a, b or c".
 * @example
 * ```ts
 * listOr(['tea', 'coffee']); // 'tea or coffee'
 * ```
 */
export function listOr(items: readonly string[]): string {
  return orList.format(items);
}

/** A rating or score, always with one decimal place: "8.0", "7.4". */
const ratings = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** A size in gigabytes, one decimal place at most: "1.5 GB". */
const gigabytes = new Intl.NumberFormat(LOCALE, {
  style: 'unit',
  unit: 'gigabyte',
  unitDisplay: 'short',
  maximumFractionDigits: 1,
});

/** A size in whole megabytes: "640 MB". */
const megabytes = new Intl.NumberFormat(LOCALE, {
  style: 'unit',
  unit: 'megabyte',
  unitDisplay: 'short',
  maximumFractionDigits: 0,
});

/** A share of a whole (0.25) as a percentage with no decimals. */
const percents = new Intl.NumberFormat(LOCALE, {
  style: 'percent',
  maximumFractionDigits: 0,
});

/**
 * Formats a rating or score with exactly one decimal place.
 * @param value - The rating to format.
 * @returns The rating with one decimal place, such as "8.0".
 * @example
 * ```ts
 * formatRating(8); // '8.0'
 * ```
 */
export function formatRating(value: number): string {
  return ratings.format(value);
}

/**
 * Formats a size in gigabytes, with one decimal place at most.
 * @param gigabyteCount - The size in gigabytes.
 * @returns The size with its unit, such as "1.5 GB".
 * @example
 * ```ts
 * formatGigabytes(1.54); // '1.5 GB'
 * ```
 */
export function formatGigabytes(gigabyteCount: number): string {
  return gigabytes.format(gigabyteCount);
}

/**
 * Formats a file size in bytes, in gigabytes from 1 GB up and megabytes below.
 * @param bytes - The file size as a raw count of bytes.
 * @returns The size with its unit, such as "640 MB".
 * @example
 * ```ts
 * formatSize(640_000_000); // '640 MB'
 * formatSize(2_500_000_000); // '2.5 GB'
 * ```
 */
export function formatSize(bytes: number): string {
  return bytes >= 1_000_000_000
    ? gigabytes.format(bytes / 1_000_000_000)
    : megabytes.format(bytes / 1_000_000);
}

/**
 * Formats a fraction as a whole-number percentage.
 * @param fraction - The fraction to format, where 1 is the whole.
 * @returns The percentage with a percent sign.
 * @example
 * ```ts
 * formatPercent(0.256); // '26%'
 * ```
 */
export function formatPercent(fraction: number): string {
  return percents.format(fraction);
}

/** Writes an hour of the day (0 to 23) as a clock time: "07:00". */
const hours = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'UTC',
});

/**
 * Formats an hour of the day as a 24-hour clock time.
 * @param hour - The hour of the day, from 0 to 23.
 * @returns The clock time in UTC, such as "07:00".
 * @example
 * ```ts
 * formatHour(7); // '07:00'
 * ```
 */
export function formatHour(hour: number): string {
  return hours.format(Date.UTC(1970, 0, 1, hour));
}

/**
 * The locale for dates and times: English with the day before the month ("1
 * November 2026"), the order the interface already uses. It is separate from
 * {@link LOCALE} only for that reason.
 */
const DATE_LOCALE = 'en-GB';

const day = new Intl.DateTimeFormat(DATE_LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const timestamp = new Intl.DateTimeFormat(DATE_LOCALE, {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

/**
 * Formats a day written out in full, in UTC so it reads the same in every time zone.
 * @param when - An ISO date, an ISO timestamp, a number of milliseconds or a `Date`.
 * @returns The day in words, such as "1 November 2026".
 * @example
 * ```ts
 * formatDay('2026-11-01'); // '1 November 2026'
 * ```
 */
export function formatDay(when: Date | string | number): string {
  const date =
    typeof when === 'string' && when.length === 10 ? `${when}T00:00:00Z` : when;
  return day.format(new Date(date));
}

/**
 * Formats a moment as a short date and time in UTC.
 * @param when - An ISO timestamp, a number of milliseconds or a `Date`.
 * @returns The date and time, such as "1 Nov 2026, 10:00".
 * @example
 * ```ts
 * formatTimestamp('2026-11-01T10:00:00Z'); // '1 Nov 2026, 10:00'
 * ```
 */
export function formatTimestamp(when: Date | string | number): string {
  return timestamp.format(new Date(when));
}

const durations = new Intl.DurationFormat(LOCALE, { style: 'narrow' });

/**
 * Formats a length of time in prose, from its parts.
 * @param parts - The duration broken into named units, such as `{ hours: 1, minutes: 30 }`.
 * @returns The duration as text, such as "1h 30m".
 * @example
 * ```ts
 * formatDuration({ hours: 1, minutes: 30 }); // '1h 30m'
 * ```
 */
export function formatDuration(
  parts: Partial<Record<Intl.DurationFormatUnit, number>>,
): string {
  return durations.format(parts);
}

const languages = new Intl.DisplayNames(LOCALE, { type: 'language' });

/**
 * Looks up the name of a language from its code.
 *
 * A code that is not a language tag (such as "?") comes back unchanged.
 * @param code - The language code, such as "ja".
 * @returns The English name of the language, such as "Japanese".
 * @example
 * ```ts
 * languageName('ja'); // 'Japanese'
 * ```
 */
export function languageName(code: string): string {
  try {
    return languages.of(code) ?? code;
  } catch {
    return code;
  }
}

const words = new Intl.Segmenter(LOCALE, { granularity: 'word' });
const graphemes = new Intl.Segmenter(LOCALE, { granularity: 'grapheme' });

/**
 * Counts the characters a person sees in a text.
 *
 * An emoji made of several code points counts as one character, where `length`
 * would count each code point.
 * @param text - The text to measure.
 * @returns The number of visible characters.
 * @example
 * ```ts
 * characterCount('👨‍👩‍👧'); // 1
 * ```
 */
export function characterCount(text: string): number {
  return [...graphemes.segment(text)].length;
}

/**
 * Cuts a text to at most a number of visible characters, ending on a whole word.
 *
 * An ellipsis is added if anything was left off. Counts what a person sees, so
 * an emoji or an accented letter is never cut in half.
 * @param text - The text to shorten.
 * @param limit - The most visible characters to keep before the ellipsis.
 * @returns The original text if it fits, otherwise the shortened text with an ellipsis.
 * @example
 * ```ts
 * truncate('Slow-roasted tomatoes with basil', 20); // 'Slow-roasted…'
 * ```
 */
export function truncate(text: string, limit: number): string {
  if (characterCount(text) <= limit) {
    return text;
  }
  let kept = '';
  let used = 0;
  for (const { segment } of words.segment(text)) {
    used += characterCount(segment);
    if (used > limit) {
      break;
    }
    kept += segment;
  }
  return `${kept.trimEnd()}…`;
}
