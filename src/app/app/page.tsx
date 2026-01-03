import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Octokit } from '@octokit/rest';
import { jwtVerify } from 'jose';
import {
  RailcrossService,
  type RepoSchedule,
} from '@/lib/services/railcross.service';
import {
  SchedulerService,
  type SchedulerEnv,
} from '@/lib/services/scheduler.service';
import { logger } from '@/lib/utils/logger';
import { SelectAllToggle } from './SelectAllToggle';

export const metadata: Metadata = {
  title: 'Setup - Railcross',
  robots: 'noindex, nofollow',
};

// Force this route to run in the Node.js runtime (Octokit + JWT verification
// depend on Node APIs in the Cloudflare worker build).
export const runtime = 'nodejs';

// Force dynamic rendering so this page is never cached (prevents redirect loops
// caused by stale prerendered responses).
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function getCloudflareEnv(): SchedulerEnv | undefined {
  const contextKey = Symbol.for('__cloudflare-context__');
  const context = (globalThis as Record<string | symbol, unknown>)[contextKey];
  return (context as { env?: SchedulerEnv } | undefined)?.env;
}

async function getAccessTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const jwtCookie = cookieStore.get('jwt');
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtCookie?.value || !jwtSecret) {
    return null;
  }

  try {
    const secretKey = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(jwtCookie.value, secretKey);
    return (payload as { accessToken?: string }).accessToken || null;
  } catch {
    return null;
  }
}

async function getSchedulerService(): Promise<RailcrossService | null> {
  const cfEnv = getCloudflareEnv();
  if (cfEnv?.SCHEDULER_WORKER) {
    const schedulerService = new SchedulerService(cfEnv);
    return new RailcrossService(schedulerService);
  }
  return null;
}

async function listReposWithoutSchedules(
  octokit: Octokit,
): Promise<RepoSchedule[]> {
  const installations =
    await octokit.rest.apps.listInstallationsForAuthenticatedUser({
      per_page: 100,
    });

  const schedules: RepoSchedule[] = [];
  for (const installation of installations.data.installations) {
    const repos =
      await octokit.rest.apps.listInstallationReposForAuthenticatedUser({
        installation_id: installation.id,
        per_page: 100,
      });

    for (const repo of repos.data.repositories) {
      schedules.push({
        installationId: installation.id,
        repoId: repo.id,
        repoName: repo.full_name,
        lockTime: undefined,
        unlockTime: undefined,
      });
    }
  }

  return schedules.sort((a, b) => a.repoName.localeCompare(b.repoName));
}

async function getSchedules(accessToken: string): Promise<RepoSchedule[]> {
  const octokit = new Octokit({ auth: accessToken });
  const railcrossService = await getSchedulerService();

  if (railcrossService) {
    try {
      return await railcrossService.listSchedules(octokit);
    } catch (e) {
      logger.error('Failed to fetch schedules from scheduler service', e);
    }
  }

  return listReposWithoutSchedules(octokit);
}

export default async function SetupPage() {
  try {
    const accessToken = await getAccessTokenFromCookie();

    if (!accessToken) {
      redirect('/auth/reauthenticate');
    }

    let schedules: RepoSchedule[] = [];
    let error: string | null = null;

    try {
      schedules = await getSchedules(accessToken);
    } catch (e) {
      logger.error('Failed to fetch schedules', e);
      error = 'Failed to fetch repository schedules';
    }

    const timezones =
      typeof Intl.supportedValuesOf === 'function'
        ? Intl.supportedValuesOf('timeZone')
        : ['UTC'];

    return (
      <html lang="en">
        <head>
          <link rel="icon" type="image/x-icon" href="/favicon.ico" />
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <script src="/js/tailwind.3.4.5.js" />
        </head>
        <body>
          <div className="min-h-screen w-screen bg-gray-400 p-8">
            <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow-md">
              <h1 className="mb-6 text-2xl font-bold">
                Railcross Schedule Setup
              </h1>

              {error && (
                <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
                  {error}
                </div>
              )}

              <form action="/app/setup" method="POST" className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label
                      htmlFor="lock-time"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Lock Time
                    </label>
                    <select
                      name="lock_time"
                      id="lock-time"
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      {Array.from({ length: 24 }, (_, hour) => (
                        <option key={hour} value={hour}>
                          {hour.toString().padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="unlock-time"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Unlock Time
                    </label>
                    <select
                      name="unlock_time"
                      id="unlock-time"
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      {Array.from({ length: 24 }, (_, hour) => (
                        <option key={hour} value={hour}>
                          {hour.toString().padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="timezone"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Timezone
                    </label>
                    <select
                      name="timezone"
                      id="timezone"
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      {timezones.map((timezone) => (
                        <option key={timezone} value={timezone}>
                          {timezone}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <h2 className="mb-2 text-lg font-semibold">Repositories</h2>
                  <div className="overflow-hidden rounded-md border border-gray-300">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="w-10 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            <SelectAllToggle targetName="repo_ids" />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Repository Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Lock Time
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Unlock Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {schedules.map((schedule) => (
                          <tr
                            key={schedule.repoId}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-4 py-3">
                              <input
                                name="repo_ids"
                                id={schedule.repoId.toString()}
                                type="checkbox"
                                value={schedule.repoId}
                                className="rounded"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {schedule.repoName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {schedule.lockTime || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {schedule.unlockTime || '-'}
                            </td>
                          </tr>
                        ))}
                        {schedules.length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-3 text-center text-sm text-gray-500"
                            >
                              No repositories found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                  >
                    Update Schedules
                  </button>
                </div>
              </form>

              <form action="/app/reset" method="POST" className="mt-4">
                <button
                  type="submit"
                  className="rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
                >
                  Reset All Schedules
                </button>
              </form>

              <div className="mt-6 border-t border-gray-200 pt-6">
                <a
                  href="/auth/logout"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Log out
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
    );
  } catch (err) {
    logger.error('Render failed in SetupPage', err);
    return (
      <html lang="en">
        <body>
          <pre>
            Render error: {err instanceof Error ? err.message : String(err)}
          </pre>
        </body>
      </html>
    );
  }
}
