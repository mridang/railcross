import { NextResponse } from 'next/server';
import { getAuthConfigFromEnv } from '@/lib/services/auth.service';
import { logger } from '@/lib/utils/logger';

export async function GET() {
  const authConfig = getAuthConfigFromEnv();
  const domainName = process.env.DOMAIN_NAME;
  const redirectUri = `https://${domainName}/auth`;

  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubAuthUrl.searchParams.set('client_id', authConfig.clientId);
  githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
  githubAuthUrl.searchParams.set('state', 'test-state');
  githubAuthUrl.searchParams.set('scope', 'repo');

  return NextResponse.json({
    wouldRedirectTo: githubAuthUrl.toString(),
    clientId: authConfig.clientId,
    redirectUri,
  });
}

export async function POST() {
  const authConfig = getAuthConfigFromEnv();
  const domainName = process.env.DOMAIN_NAME;

  if (!domainName) {
    return NextResponse.json(
      { error: 'DOMAIN_NAME not configured' },
      { status: 500 },
    );
  }

  const state = crypto.randomUUID();
  const redirectUri = `https://${domainName}/auth`;

  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubAuthUrl.searchParams.set('client_id', authConfig.clientId);
  githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
  githubAuthUrl.searchParams.set('state', state);
  githubAuthUrl.searchParams.set('scope', 'repo');

  logger.info('Redirecting to GitHub OAuth', {
    url: githubAuthUrl.toString(),
  });

  const response = NextResponse.redirect(githubAuthUrl.toString(), 303);

  response.cookies.set('nonce', state, {
    maxAge: 2 * 60,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });

  return response;
}
