export interface ScheduleData {
  installationId: number;
  repoId: number;
  repoName: string;
  lockTime: number;
  unlockTime: number;
  timezone: string;
}

export interface Env {
  SCHEDULER: DurableObjectNamespace;
  GITHUB_APP_ID: string;
  GITHUB_PRIVATE_KEY: string;
}

function getNextAlarmTime(
  hour: number,
  timezone: string,
): { timestamp: number; isToday: boolean } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  });
  const currentHour = parseInt(formatter.format(now), 10);

  const target = new Date(now);
  target.setMinutes(0, 0, 0);

  if (hour > currentHour) {
    target.setHours(target.getHours() + (hour - currentHour));
    return { timestamp: target.getTime(), isToday: true };
  } else {
    target.setHours(target.getHours() + (24 - currentHour + hour));
    return { timestamp: target.getTime(), isToday: false };
  }
}

function determineNextAction(
  lockTime: number,
  unlockTime: number,
  timezone: string,
): { action: 'lock' | 'unlock'; timestamp: number } {
  const lockAlarm = getNextAlarmTime(lockTime, timezone);
  const unlockAlarm = getNextAlarmTime(unlockTime, timezone);

  if (lockAlarm.timestamp < unlockAlarm.timestamp) {
    return { action: 'lock', timestamp: lockAlarm.timestamp };
  }
  return { action: 'unlock', timestamp: unlockAlarm.timestamp };
}

export class SchedulerDurableObject {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'POST' && path === '/schedule') {
      const data = (await request.json()) as ScheduleData;
      await this.createSchedule(data);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'GET' && path === '/schedule') {
      const schedule = await this.getSchedule();
      return new Response(JSON.stringify(schedule), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'DELETE' && path === '/schedule') {
      await this.deleteSchedule();
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  }

  private async createSchedule(data: ScheduleData): Promise<void> {
    await this.state.storage.put('schedule', data);
    await this.scheduleNextAlarm(data);
  }

  private async getSchedule(): Promise<ScheduleData | null> {
    return (await this.state.storage.get<ScheduleData>('schedule')) || null;
  }

  private async deleteSchedule(): Promise<void> {
    await this.state.storage.delete('schedule');
    await this.state.storage.deleteAlarm();
  }

  private async scheduleNextAlarm(data: ScheduleData): Promise<void> {
    const next = determineNextAction(
      data.lockTime,
      data.unlockTime,
      data.timezone,
    );
    await this.state.storage.put('nextAction', next.action);
    await this.state.storage.setAlarm(next.timestamp);
  }

  async alarm(): Promise<void> {
    const schedule = await this.getSchedule();
    if (!schedule) {
      return;
    }

    const action = await this.state.storage.get<'lock' | 'unlock'>(
      'nextAction',
    );
    if (!action) {
      return;
    }

    try {
      await this.executeProtectionToggle(schedule, action === 'lock');
    } catch (error) {
      console.error('Failed to toggle protection:', error);
    }

    await this.scheduleNextAlarm(schedule);
  }

  private async executeProtectionToggle(
    schedule: ScheduleData,
    lockState: boolean,
  ): Promise<void> {
    const { createAppAuth } = await import('@octokit/auth-app');
    const { Octokit } = await import('@octokit/rest');

    const auth = createAppAuth({
      appId: this.env.GITHUB_APP_ID,
      privateKey: this.env.GITHUB_PRIVATE_KEY,
      installationId: schedule.installationId,
    });

    const installationAuth = await auth({ type: 'installation' });
    const octokit = new Octokit({ auth: installationAuth.token });

    const [owner, repo] = schedule.repoName.split('/');

    const { data: repository } = await octokit.repos.get({ owner, repo });

    try {
      const { data: protection } = await octokit.repos.getBranchProtection({
        owner,
        repo: repository.name,
        branch: repository.default_branch,
      });

      await octokit.repos.updateBranchProtection({
        owner,
        repo: repository.name,
        branch: repository.default_branch,
        lock_branch: lockState,
        enforce_admins: protection.enforce_admins?.enabled || null,
        required_pull_request_reviews: protection.required_pull_request_reviews
          ? {
              dismiss_stale_reviews:
                protection.required_pull_request_reviews.dismiss_stale_reviews,
              require_code_owner_reviews:
                protection.required_pull_request_reviews
                  .require_code_owner_reviews,
              required_approving_review_count:
                protection.required_pull_request_reviews
                  .required_approving_review_count,
            }
          : null,
        required_status_checks: protection.required_status_checks
          ? {
              strict: protection.required_status_checks.strict ?? false,
              contexts: protection.required_status_checks.contexts,
            }
          : null,
        restrictions: protection.restrictions
          ? {
              users:
                protection.restrictions.users
                  ?.map((u) => u.login)
                  .filter((x): x is string => !!x) || [],
              teams:
                protection.restrictions.teams
                  ?.map((t) => t.slug)
                  .filter((x): x is string => !!x) || [],
              apps:
                protection.restrictions.apps
                  ?.map((a) => a.slug)
                  .filter((x): x is string => !!x) || [],
            }
          : null,
      });
    } catch {
      await octokit.repos.updateBranchProtection({
        owner,
        repo: repository.name,
        branch: repository.default_branch,
        lock_branch: lockState,
        enforce_admins: null,
        required_pull_request_reviews: null,
        required_status_checks: null,
        restrictions: null,
      });
    }
  }
}
