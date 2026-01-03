import {
  exchangeCodeForAccessToken,
  getAuthConfigFromEnv,
} from '@/lib/services/auth.service';

describe('auth.service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('exchangeCodeForAccessToken', () => {
    const authConfig = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    };

    it('should return access token on successful exchange', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: 'gho_test_token_123' }),
      });

      const token = await exchangeCodeForAccessToken(authConfig, 'auth-code');

      expect(token).toBe('gho_test_token_123');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            client_id: 'test-client-id',
            client_secret: 'test-client-secret',
            code: 'auth-code',
          }),
        },
      );
    });

    it('should throw error when response is ok but access_token is missing', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          error: 'bad_verification_code',
          error_description: 'The code passed is incorrect or expired.',
        }),
      });

      await expect(
        exchangeCodeForAccessToken(authConfig, 'invalid-code'),
      ).rejects.toThrow(
        'Response received, but access token is missing or invalid. Error: bad_verification_code - The code passed is incorrect or expired.',
      );
    });

    it('should throw error when response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid credentials',
      });

      await expect(
        exchangeCodeForAccessToken(authConfig, 'auth-code'),
      ).rejects.toThrow(
        'Failed to obtain access token. Status: 401 - Unauthorized. Details: Invalid credentials',
      );
    });
  });

  describe('getAuthConfigFromEnv', () => {
    it('should return config when both env vars are set', () => {
      process.env.GITHUB_CLIENT_ID = 'my-client-id';
      process.env.GITHUB_CLIENT_SECRET = 'my-client-secret';

      const config = getAuthConfigFromEnv();

      expect(config).toEqual({
        clientId: 'my-client-id',
        clientSecret: 'my-client-secret',
      });
    });

    it('should throw error when GITHUB_CLIENT_ID is missing', () => {
      delete process.env.GITHUB_CLIENT_ID;
      process.env.GITHUB_CLIENT_SECRET = 'my-client-secret';

      expect(() => getAuthConfigFromEnv()).toThrow(
        'GITHUB_CLIENT_ID environment variable is required',
      );
    });

    it('should throw error when GITHUB_CLIENT_SECRET is missing', () => {
      process.env.GITHUB_CLIENT_ID = 'my-client-id';
      delete process.env.GITHUB_CLIENT_SECRET;

      expect(() => getAuthConfigFromEnv()).toThrow(
        'GITHUB_CLIENT_SECRET environment variable is required',
      );
    });
  });
});
