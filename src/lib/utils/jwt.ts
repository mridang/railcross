import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

interface SessionPayload extends JWTPayload {
  accessToken: string;
  installationIds: number[];
}

/**
 * Sign a JWT token with the given payload.
 */
export async function signJwt(
  payload: SessionPayload,
  secret: string,
  options: {
    subject?: string;
    issuer?: string;
    audience?: string[];
    expiresIn?: string;
  } = {},
): Promise<string> {
  const secretKey = new TextEncoder().encode(secret);

  let jwt = new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt();

  if (options.subject) {
    jwt = jwt.setSubject(options.subject);
  }
  if (options.issuer) {
    jwt = jwt.setIssuer(options.issuer);
  }
  if (options.audience) {
    jwt = jwt.setAudience(options.audience);
  }
  if (options.expiresIn) {
    jwt = jwt.setExpirationTime(options.expiresIn);
  }

  return jwt.sign(secretKey);
}

/**
 * Verify and decode a JWT token.
 */
export async function verifyJwt(
  token: string,
  secret: string,
): Promise<SessionPayload | null> {
  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Get the JWT secret from environment variables.
 */
export function getJwtSecretFromEnv(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}
