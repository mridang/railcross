import crypto from 'node:crypto';

/**
 * Computes HMAC SHA256 signature of a given input using a secret key.
 * @param key - The secret key for HMAC.
 * @param input - The input string to sign.
 * @returns The HMAC SHA256 signature as a hexadecimal string.
 */
export function hmacSha256(key: string, input: string): string {
  return crypto.createHmac('sha256', key).update(input).digest('hex');
}
