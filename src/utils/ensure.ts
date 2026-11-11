/**
 * @file Narrows a nullable value to its non-null type or throws.
 */

/**
 * Returns the value with `null` and `undefined` removed from its type.
 * @template T - The type of the value once it is known to be present.
 * @param value - The value that may be missing.
 * @returns The same value, typed as present.
 * @throws {Error} When the value is `null` or `undefined`.
 * @example
 * ```ts
 * const token = ensure(process.env['TOKEN']);
 * ```
 */
export function ensure<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw new Error('Value is null or undefined');
  }
  return value;
}
