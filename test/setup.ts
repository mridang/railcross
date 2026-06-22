import { config } from 'dotenv';
import { generateKeyPairSync } from 'node:crypto';

// Load any local .env first so real values take precedence over the defaults.
config();

// Hermetic defaults so the app boots in tests (and in CI, which has no .env)
// without real credentials. The private key is generated at runtime, so no key
// material is committed to the repository.
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

// noinspection JSUnusedGlobalSymbols
export default async function setup(): Promise<void> {
  // No external services are required; configuration is read from the
  // environment, so the tests run entirely in-process.
}
