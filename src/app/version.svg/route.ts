import { NextResponse } from 'next/server';
import { makeBadge } from 'badge-maker';

function getBadgeColor(nodeEnv: string | undefined): string {
  switch (nodeEnv?.toLowerCase()) {
    case 'prod':
    case 'production':
      return 'brightgreen';
    case undefined:
    case '':
      return 'gray';
    default:
      return 'blue';
  }
}

export async function GET() {
  const nodeEnv = process.env.NODE_ENV?.toLowerCase() || 'unknown';
  const serviceVersion =
    process.env.SERVICE_VERSION?.toLowerCase().substring(0, 7) || 'unknown';

  const svg = makeBadge({
    label: nodeEnv,
    message: serviceVersion,
    color: getBadgeColor(process.env.NODE_ENV),
  });

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
