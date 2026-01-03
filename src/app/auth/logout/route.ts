import { NextRequest, NextResponse } from 'next/server';

/**
 * Log out by clearing the JWT cookie.
 * GET /auth/logout
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/app', request.url));

  response.cookies.delete({
    name: 'jwt',
    path: '/',
  });

  return response;
}
