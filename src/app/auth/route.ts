import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Octokit } from '@octokit/rest';
import murmurhash from 'murmurhash';
import {
  exchangeCodeForAccessToken,
  getAuthConfigFromEnv,
} from '@/lib/services/auth.service';
import { signJwt, getJwtSecretFromEnv } from '@/lib/utils/jwt';
import { callbackSchema } from '@/lib/schemas/auth';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const parseResult = callbackSchema.safeParse({
    code: searchParams.get('code'),
    state: searchParams.get('state'),
    installation_id: searchParams.get('installation_id'),
    setup_action: searchParams.get('setup_action'),
  });

  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: 'Invalid callback parameters',
        details: parseResult.error.errors,
        received: {
          code: searchParams.get('code'),
          state: searchParams.get('state'),
          installation_id: searchParams.get('installation_id'),
          setup_action: searchParams.get('setup_action'),
        },
      },
      { status: 400 },
    );
  }

  const { code, state, installation_id } = parseResult.data;

  // For GitHub App installation flow, skip nonce validation
  // (GitHub doesn't pass back the state parameter during installation)
  const isInstallationFlow = !!installation_id;

  if (!isInstallationFlow) {
    const cookieStore = await cookies();
    const nonceCookie = cookieStore.get('nonce');
    if (!nonceCookie || nonceCookie.value !== state) {
      return NextResponse.json(
        { error: 'Invalid state parameter or nonce' },
        { status: 401 },
      );
    }
  }

  try {
    const authConfig = getAuthConfigFromEnv();
    const accessToken = await exchangeCodeForAccessToken(authConfig, code);

    const octokit = new Octokit({ auth: accessToken });

    const [userResponse, reposResponse, installationsResponse] =
      await Promise.all([
        octokit.rest.users.getAuthenticated(),
        octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
          per_page: 100,
        }),
        octokit.rest.apps.listInstallationsForAuthenticatedUser({
          per_page: 100,
        }),
      ]);

    const user = userResponse.data;
    const repositories = reposResponse;
    const installations = installationsResponse.data.installations;

    const jwtSecret = getJwtSecretFromEnv();
    const serviceName = process.env.SERVICE_NAME || 'railcross';

    const sessionToken = await signJwt(
      {
        accessToken,
        installationIds: installations.map((item) => item.id),
      },
      jwtSecret,
      {
        subject: user.login,
        issuer: serviceName,
        audience: repositories
          .filter((repo) => !repo.archived)
          .map((repo) => murmurhash.v3(repo.full_name).toString()),
        expiresIn: '1h',
      },
    );

    const response = NextResponse.redirect(new URL('/app', request.url));

    response.cookies.delete('nonce');

    response.cookies.set('jwt', sessionToken, {
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
    });

    return response;
  } catch (error) {
    logger.error('OAuth callback error', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 },
    );
  }
}
