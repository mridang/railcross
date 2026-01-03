import { z } from 'zod';

/**
 * Check if a timezone is valid using Intl API.
 */
function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Schema for schedule update request.
 */
export const scheduleSchema = z.object({
  lock_time: z.coerce.number().int().min(0).max(23),
  unlock_time: z.coerce.number().int().min(0).max(23),
  timezone: z.string().refine(isValidTimezone, {
    message: 'Invalid timezone',
  }),
  repo_ids: z
    .union([
      z.array(z.coerce.number().int()),
      z.coerce
        .number()
        .int()
        .transform((n) => [n]),
      z.string().transform(() => []),
    ])
    .optional()
    .default([]),
});
