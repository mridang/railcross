import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: {
        domainName: process.env.DOMAIN_NAME ?? 'NOT SET',
        clientId: process.env.GITHUB_CLIENT_ID ?? 'NOT SET',
        hasClientSecret: !!process.env.GITHUB_CLIENT_SECRET,
        hasJwtSecret: !!process.env.JWT_SECRET,
      },
    },
    { status: 200 },
  );
}
