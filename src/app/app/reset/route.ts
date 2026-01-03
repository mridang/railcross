import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Octokit } from '@octokit/rest';
import { RailcrossService } from '@/lib/services/railcross.service';
import {
  SchedulerService,
  type SchedulerEnv,
} from '@/lib/services/scheduler.service';
import { logger } from '@/lib/utils/logger';

function getCloudflareEnv(): SchedulerEnv | undefined {
  const contextKey = Symbol.for('__cloudflare-context__');
  const context = (globalThis as Record<string | symbol, unknown>)[contextKey];
  return (context as { env?: SchedulerEnv } | undefined)?.env;
}

export async function POST(request: NextRequest) {
  const headersList = await headers();
  const accessToken = headersList.get('x-user-access-token');

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Unable to deduce allowed installations' },
      { status: 401 },
    );
  }

  try {
    const cfEnv = getCloudflareEnv();
    if (cfEnv?.SCHEDULER_WORKER) {
      const schedulerService = new SchedulerService(cfEnv);
      const railcrossService = new RailcrossService(schedulerService);
      const octokit = new Octokit({ auth: accessToken });

      await railcrossService.resetSchedules(octokit);
    } else {
      logger.debug('Scheduler service not available in development mode');
    }

    return NextResponse.redirect(new URL('/app', request.url));
  } catch (error) {
    logger.error('Failed to reset schedules', error);
    return NextResponse.json(
      { error: 'Failed to reset schedules' },
      { status: 500 },
    );
  }
}
