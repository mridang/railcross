/**
 * @file Jest global teardown that runs once after the suite finishes.
 */

/**
 * Runs once after the whole suite. Nothing needs tearing down, because the suite starts no external services.
 * @returns A promise that resolves immediately.
 * @example
 * ```ts
 * // Registered in the Jest configuration as globalTeardown.
 * ```
 */
export default async function teardown(): Promise<void> {
  // Nothing to tear down.
}
