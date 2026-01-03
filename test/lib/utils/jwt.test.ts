import { expect } from '@jest/globals';
import { signJwt, verifyJwt } from '@/lib/utils/jwt';

describe('JWT utility tests', () => {
  const testSecret = 'test_secret_key_for_jwt_signing';

  test('should sign and verify a JWT token', async () => {
    const payload = {
      accessToken: 'test_access_token',
      installationIds: [1, 2, 3],
    };

    const token = await signJwt(payload, testSecret, {
      subject: 'testuser',
      issuer: 'railcross',
      expiresIn: '1h',
    });

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const verified = await verifyJwt(token, testSecret);

    expect(verified).toBeDefined();
    expect(verified?.accessToken).toBe(payload.accessToken);
    expect(verified?.installationIds).toEqual(payload.installationIds);
  });

  test('should return null for invalid token', async () => {
    const result = await verifyJwt('invalid_token', testSecret);
    expect(result).toBeNull();
  });

  test('should return null for token signed with different secret', async () => {
    const payload = {
      accessToken: 'test_access_token',
      installationIds: [1],
    };

    const token = await signJwt(payload, testSecret);
    const result = await verifyJwt(token, 'different_secret');

    expect(result).toBeNull();
  });

  test('should sign token with all options', async () => {
    const payload = {
      accessToken: 'test_access_token',
      installationIds: [1],
    };

    const token = await signJwt(payload, testSecret, {
      subject: 'testuser',
      issuer: 'railcross',
      audience: ['repo1', 'repo2'],
      expiresIn: '1h',
    });

    expect(token).toBeDefined();

    const verified = await verifyJwt(token, testSecret);
    expect(verified).toBeDefined();
  });
});
