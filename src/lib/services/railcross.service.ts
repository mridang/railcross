import { Octokit } from '@octokit/rest';
import { mergeMap, from, toArray, filter } from 'rxjs';
import { doPaginate } from '../github/paginate';
import { SchedulerService, formatScheduleDisplay } from './scheduler.service';

export interface RepoSchedule {
  installationId: number;
  repoId: number;
  repoName: string;
  lockTime?: string;
  unlockTime?: string;
}

type InstallationSummary = {
  id: number;
};

type RepositorySummary = {
  id: number;
  full_name: string;
};

export class RailcrossService {
  private static readonly MAX_SCHEDULE_FETCHES = 40;

  constructor(private readonly schedulerService: SchedulerService) {}

  async listSchedules(userOctokit: Octokit): Promise<RepoSchedule[]> {
    const installations = await this.fetchAllInstallations(userOctokit);
    const schedules: RepoSchedule[] = [];
    let scheduleFetches = 0;

    for (const installation of installations) {
      const repos = await this.fetchAllReposForInstallation(
        userOctokit,
        installation.id,
      );

      for (const repo of repos) {
        let lockTime: string | undefined;
        let unlockTime: string | undefined;

        if (
          this.schedulerService.isAvailable() &&
          scheduleFetches < RailcrossService.MAX_SCHEDULE_FETCHES
        ) {
          const schedule = await this.schedulerService.getSchedule(
            installation.id,
            repo.id,
          );
          const formatted = formatScheduleDisplay(schedule);
          lockTime = formatted.lockTime;
          unlockTime = formatted.unlockTime;
          scheduleFetches += 1;
        }

        schedules.push({
          installationId: installation.id,
          repoId: repo.id,
          repoName: repo.full_name,
          lockTime,
          unlockTime,
        });
      }
    }

    return schedules.sort((a, b) => a.repoName.localeCompare(b.repoName));
  }

  async resetSchedules(userOctokit: Octokit): Promise<void> {
    await doPaginate(async (page: number) => {
      const response =
        await userOctokit.rest.apps.listInstallationsForAuthenticatedUser({
          per_page: 100,
          page,
        });
      return {
        totalRows: response.data.total_count,
        resultItems: response.data.installations,
      };
    })
      .pipe(
        mergeMap((installation) =>
          doPaginate(async (page: number) => {
            const response =
              await userOctokit.rest.apps.listInstallationReposForAuthenticatedUser(
                {
                  installation_id: installation.id,
                  per_page: 100,
                  page,
                },
              );
            return {
              totalRows: response.data.total_count,
              resultItems: response.data.repositories,
            };
          }).pipe(
            mergeMap((repository) =>
              from(
                this.schedulerService.deleteSchedule(
                  installation.id,
                  repository.id,
                ),
              ),
            ),
          ),
        ),
      )
      .forEach(() => {});
  }

  async updateSchedules(
    userOctokit: Octokit,
    repoIds: number[],
    lockTime: number,
    unlockTime: number,
    timeZone: string,
  ): Promise<void> {
    await doPaginate(async (page: number) => {
      const response =
        await userOctokit.rest.apps.listInstallationsForAuthenticatedUser({
          per_page: 100,
          page,
        });
      return {
        totalRows: response.data.total_count,
        resultItems: response.data.installations,
      };
    })
      .pipe(
        mergeMap((installation) =>
          doPaginate(async (page: number) => {
            const response =
              await userOctokit.rest.apps.listInstallationReposForAuthenticatedUser(
                {
                  installation_id: installation.id,
                  per_page: 100,
                  page,
                },
              );
            return {
              totalRows: response.data.total_count,
              resultItems: response.data.repositories,
            };
          }).pipe(
            filter((repository) => {
              return !repoIds.length || repoIds.includes(repository.id);
            }),
            mergeMap((repository) =>
              from(
                this.schedulerService.deleteSchedule(
                  installation.id,
                  repository.id,
                ),
              ).pipe(
                mergeMap(() =>
                  from(
                    this.schedulerService.createSchedule(
                      installation.id,
                      repository.id,
                      repository.full_name,
                      lockTime,
                      unlockTime,
                      timeZone,
                    ),
                  ),
                ),
              ),
            ),
            toArray(),
          ),
        ),
      )
      .forEach(() => {});
  }

  async deleteSchedulesForRepos(
    installationId: number,
    repoIds: number[],
  ): Promise<void> {
    await Promise.all(
      repoIds.map((repoId) =>
        this.schedulerService.deleteSchedule(installationId, repoId),
      ),
    );
  }

  private async fetchAllInstallations(
    octokit: Octokit,
  ): Promise<InstallationSummary[]> {
    return this.fetchAllPages((page) => fetchInstallations(octokit, page));
  }

  private async fetchAllReposForInstallation(
    octokit: Octokit,
    installationId: number,
  ): Promise<RepositorySummary[]> {
    return this.fetchAllPages((page) =>
      fetchRepos(octokit, installationId, page),
    );
  }

  private async fetchAllPages<T>(
    fetchPage: (page: number) => Promise<{ items: T[]; totalCount: number }>,
  ): Promise<T[]> {
    const items: T[] = [];
    let page = 1;

    while (true) {
      const { items: pageItems, totalCount } = await fetchPage(page);
      items.push(...pageItems);

      if (pageItems.length === 0 || items.length >= totalCount) {
        break;
      }

      page += 1;
    }

    return items;
  }
}

async function fetchInstallations(
  octokit: Octokit,
  page: number,
): Promise<{ items: InstallationSummary[]; totalCount: number }> {
  const response =
    await octokit.rest.apps.listInstallationsForAuthenticatedUser({
      per_page: 100,
      page,
    });

  return {
    items: response.data.installations.map((installation) => ({
      id: installation.id,
    })),
    totalCount: response.data.total_count,
  };
}

async function fetchRepos(
  octokit: Octokit,
  installationId: number,
  page: number,
): Promise<{ items: RepositorySummary[]; totalCount: number }> {
  const response =
    await octokit.rest.apps.listInstallationReposForAuthenticatedUser({
      installation_id: installationId,
      per_page: 100,
      page,
    });

  return {
    items: response.data.repositories.map((repo) => ({
      id: repo.id,
      full_name: repo.full_name,
    })),
    totalCount: response.data.total_count,
  };
}
