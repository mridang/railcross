import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/app')) {
    const token = request.cookies.get('jwt')?.value;
    const jwtSecret = process.env.JWT_SECRET;

    // Debug info
    const debugInfo = {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      hasSecret: !!jwtSecret,
      secretLength: jwtSecret?.length || 0,
      verified: false,
      error: null as string | null,
    };

    if (!token) {
      return NextResponse.redirect(
        new URL('/auth/reauthenticate', request.url),
      );
    }

    if (!jwtSecret) {
      return NextResponse.redirect(
        new URL('/auth/reauthenticate', request.url),
      );
    }

    try {
      const secretKey = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify(token, secretKey);
      debugInfo.verified = true;

      const requestHeaders = new Headers(request.headers);
      requestHeaders.set(
        'x-user-access-token',
        (payload as { accessToken?: string }).accessToken || '',
      );
      requestHeaders.set(
        'x-user-installation-ids',
        JSON.stringify(
          (payload as { installationIds?: number[] }).installationIds || [],
        ),
      );

      // Pass debug info as header so route can see it
      requestHeaders.set('x-middleware-debug', JSON.stringify(debugInfo));

      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    } catch (e) {
      debugInfo.error = e instanceof Error ? e.message : String(e);
      return NextResponse.redirect(
        new URL('/auth/reauthenticate', request.url),
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app', '/app/:path*'],
};
