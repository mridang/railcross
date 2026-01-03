import { config } from 'dotenv';

config();

/**
 * Global setup for Jest tests.
 * Sets up environment variables needed for testing.
 */
export default async function setup(): Promise<void> {
  console.info('Setting up test environment...');

  // Set default environment variables for testing
  // NODE_ENV is set by Jest automatically
  process.env.SERVICE_NAME = 'railcross';
  process.env.DOMAIN_NAME = 'test.railcross.app';

  // Set mock GitHub credentials for testing
  // These are fake values used only for testing
  process.env.GITHUB_APP_ID = process.env.GITHUB_APP_ID || '12345';
  process.env.GITHUB_CLIENT_ID =
    process.env.GITHUB_CLIENT_ID || 'test_client_id';
  process.env.GITHUB_CLIENT_SECRET =
    process.env.GITHUB_CLIENT_SECRET || 'test_client_secret';
  process.env.GITHUB_WEBHOOK_SECRET =
    process.env.GITHUB_WEBHOOK_SECRET || 'test_webhook_secret';
  process.env.GITHUB_PRIVATE_KEY =
    process.env.GITHUB_PRIVATE_KEY ||
    '-----BEGIN RSA PRIVATE KEY-----&MIIEpAIBAAKCAQEA...test...&-----END RSA PRIVATE KEY-----';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key';

  console.info('Test environment setup complete');
}
