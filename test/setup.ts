import { config } from 'dotenv';

config();

// noinspection JSUnusedGlobalSymbols
export default async function setup(): Promise<void> {
  // No external services are required for the test suite. Configuration is
  // loaded from `.env` above; on Workers the scheduler is backed by Cloudflare
  // KV, so the tests run entirely in-process.
}
