/**
 * Global teardown for Jest tests.
 * Cleans up any resources created during testing.
 */
export default async function teardown(): Promise<void> {
  console.info('Test teardown complete');
}
