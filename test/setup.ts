import { config } from 'dotenv';
import { generateKeyPairSync } from 'node:crypto';

config();

// Hermetic configuration for the test suite. The app reads all secrets from the
// environment; CI has no .env, so these deterministic values let the modules
// boot without real credentials. SENTRY_DSN is blanked so the reporter is a
// no-op and never loads a runtime Sentry SDK. The private key is generated at
// runtime so no key material is committed to the repository.
const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

process.env.SERVICE_NAME = process.env.SERVICE_NAME || 'railcross';
process.env.GITHUB_APP_ID = process.env.GITHUB_APP_ID || '1';
process.env.GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'test-client-id';
process.env.GITHUB_CLIENT_SECRET =
  process.env.GITHUB_CLIENT_SECRET || 'test-client-secret';
process.env.GITHUB_WEBHOOK_SECRET =
  process.env.GITHUB_WEBHOOK_SECRET || 'test-webhook-secret';
process.env.DOMAIN_NAME = process.env.DOMAIN_NAME || 'railcross.example.com';
process.env.GITHUB_PRIVATE_KEY = process.env.GITHUB_PRIVATE_KEY || privateKey;
process.env.SENTRY_DSN = process.env.SENTRY_DSN ?? '';

// noinspection JSUnusedGlobalSymbols
export default async function setup(): Promise<void> {
  // No external services are required for the test suite. Configuration is
  // loaded from `.env` above and from inline defaults; the application reads
  // all secrets from the environment, so the tests run entirely in-process.
}
