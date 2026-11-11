/**
 * @file Jest setup file that prepares environment variables and keys before the suite runs.
 */
import { config } from 'dotenv';
import { generateKeyPairSync } from 'node:crypto';

// Load any local .env first so real values take precedence over the defaults.
config();

// Hermetic defaults so the app boots in tests (and in CI, which has no .env)
// without real credentials. The private key is generated at runtime, so no key
// material is committed to the repository.
// eslint-disable-next-line n/no-sync -- jest globalSetup is loaded by native Node TS stripping, which cannot resolve a shared async helper (.js maps to no file, .ts import fails tsc TS5097 without allowImportingTsExtensions)
const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

process.env.GITHUB_APP_ID ||= '1';
process.env.GITHUB_WEBHOOK_SECRET ||= 'test-webhook-secret';
process.env.GITHUB_PRIVATE_KEY ||= privateKey;
// railcross also has OAuth login and scheduled jobs.
process.env.GITHUB_CLIENT_ID ||= 'test-client-id';
process.env.GITHUB_CLIENT_SECRET ||= 'test-client-secret';
process.env.SERVICE_NAME ||= 'railcross';
process.env.DOMAIN_NAME ||= 'railcross.example.com';

// Disable Sentry in tests: with a DSN set, the nestjs-defaults reporter
// dynamically imports a runtime SDK that is not installed here. Blanking the
// DSN forces the no-op reporter.
process.env.SENTRY_DSN = '';

/**
 * Runs once before the whole suite.
 *
 * No external services are required, because configuration is read from the
 * environment and the tests run entirely in-process.
 * @returns A promise that resolves once setup is complete.
 * @example
 * ```ts
 * // Registered in the Jest configuration as globalSetup.
 * ```
 */
export default async function setup(): Promise<void> {
  // Nothing to start.
}
