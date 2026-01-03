import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Octokit } from '@octokit/rest';
import { scheduleSchema } from '@/lib/schemas/schedule';
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

  const formData = await request.formData();

  const rawData: Record<string, unknown> = {};
  rawData.lock_time = formData.get('lock_time');
  rawData.unlock_time = formData.get('unlock_time');
  rawData.timezone = formData.get('timezone');
  rawData.repo_ids = formData.getAll('repo_ids');

  const parseResult = scheduleSchema.safeParse(rawData);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid schedule data', details: parseResult.error.errors },
      { status: 400 },
    );
  }

  const { lock_time, unlock_time, timezone, repo_ids } = parseResult.data;

  try {
    const cfEnv = getCloudflareEnv();
    if (cfEnv?.SCHEDULER_WORKER) {
      const schedulerService = new SchedulerService(cfEnv);
      const railcrossService = new RailcrossService(schedulerService);
      const octokit = new Octokit({ auth: accessToken });

      await railcrossService.updateSchedules(
        octokit,
        repo_ids,
        lock_time,
        unlock_time,
        timezone,
      );
    } else {
      logger.debug('Scheduler service not available in development mode', {
        repo_ids,
        lock_time,
        unlock_time,
        timezone,
      });
    }

    return NextResponse.redirect(new URL('/app', request.url));
  } catch (error) {
    logger.error('Failed to update schedules', error);
    return NextResponse.json(
      { error: 'Failed to update schedules' },
      { status: 500 },
    );
  }
}
