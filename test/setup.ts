import { config } from 'dotenv';

config();

// noinspection JSUnusedGlobalSymbols
export default async function setup(): Promise<void> {
  // No external services are required for the test suite. Configuration is
  // loaded from `.env` above; the application reads all secrets from the
  // environment, so the tests run entirely in-process.
}
