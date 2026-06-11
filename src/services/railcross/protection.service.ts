import { Octokit } from '@octokit/rest';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ensure } from '../../utils/ensure.js';
import { OctokitImpl } from '../github/octokit/types.js';

@Injectable()
export default class ProtectionService {
  private readonly logger = new Logger(ProtectionService.name);

  constructor(
    @Inject(OctokitImpl)
    private readonly octokitFn: (installationId: number) => Octokit,
  ) {
    //
  }

  async toggleProtection(
    repositoryName: string,
    installationId: number,
    lockState: boolean,
  ) {
    const owner = repositoryName.split('/')[0];
    const repo = repositoryName.split('/')[1];
    const octokit = this.octokitFn(installationId);
    const { data: repository } = await octokit.repos.get({
      owner: owner,
      repo: repo,
    });

    this.logger.log(`Updating branch-protection for ${repositoryName}`);

    try {
      const {
        data: {
          allow_deletions,
          allow_force_pushes,
          block_creations,
          enforce_admins,
          required_conversation_resolution,
          required_linear_history,
          required_pull_request_reviews,
          required_status_checks,
          restrictions,
        },
      } = await octokit.repos.getBranchProtection({
        owner,
        repo: repository.name,
        branch: repository.default_branch,
      });

      this.logger.log(
        `The ${repository.default_branch} is currently protected`,
      );

      await octokit.repos.updateBranchProtection({
        allow_deletions: allow_deletions?.enabled,
        allow_force_pushes: allow_force_pushes?.enabled,
        block_creations: block_creations?.enabled,
        enforce_admins: enforce_admins?.enabled || null,
        required_conversation_resolution:
          required_conversation_resolution?.enabled,
        required_linear_history: required_linear_history?.enabled,
        required_pull_request_reviews: {
          dismissal_restrictions:
            required_pull_request_reviews?.dismissal_restrictions
              ? {
                  users:
                    required_pull_request_reviews?.dismissal_restrictions?.users?.map(
                      (user) => user.name as string,
                    ) || [],
                  teams:
                    required_pull_request_reviews?.dismissal_restrictions?.teams?.map(
                      (team) => team.name,
                    ) || [],
                  apps:
                    required_pull_request_reviews?.dismissal_restrictions?.apps?.map(
                      (app) => ensure(app?.name),
                    ) || [],
                }
              : undefined,
          dismiss_stale_reviews:
            required_pull_request_reviews?.dismiss_stale_reviews,
          require_code_owner_reviews:
            required_pull_request_reviews?.require_code_owner_reviews,
          required_approving_review_count:
            required_pull_request_reviews?.required_approving_review_count,
          bypass_pull_request_allowances:
            required_pull_request_reviews?.bypass_pull_request_allowances
              ? {
                  users:
                    required_pull_request_reviews?.bypass_pull_request_allowances?.users?.map(
                      (user) => user.name as string,
                    ) || [],
                  teams:
                    required_pull_request_reviews?.bypass_pull_request_allowances?.teams?.map(
                      (team) => team.name,
                    ) || [],
                  apps:
                    required_pull_request_reviews?.bypass_pull_request_allowances?.apps?.map(
                      (app) => ensure(app?.name),
                    ) || [],
                }
              : undefined,
        },
        required_status_checks: required_status_checks
          ? {
              strict: required_status_checks?.strict || false,
              contexts: required_status_checks?.contexts || [],
              checks: [],
            }
          : null,
        restrictions: restrictions
          ? {
              users: restrictions?.users.map((u) => u.login as string) || [],
              teams: restrictions?.teams.map((u) => u.name as string) || [],
              apps: restrictions?.apps.map((u) => u.name as string) || [],
            }
          : null,
        owner: owner,
        repo: repository.name,
        branch: repository.default_branch,
        lock_branch: lockState,
      });
    } catch {
      this.logger.log(`The ${repository.default_branch} isn't protected.`);

      await octokit.repos.updateBranchProtection({
        enforce_admins: null,
        required_pull_request_reviews: null,
        required_status_checks: null,
        restrictions: null,
        owner: owner,
        repo: repository.name,
        branch: repository.default_branch,
        lock_branch: lockState,
      });
    }

    this.logger.log(`The ${repository.default_branch} has been locked.`);
  }
}
