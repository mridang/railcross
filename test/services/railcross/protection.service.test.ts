import { Octokit } from '@octokit/rest';
import ProtectionService from '../../../src/services/railcross/protection.service.js';
import nock from 'nock';
import { HttpStatus } from '@nestjs/common';

describe('protection.service test', () => {
  beforeEach(() => {
    nock('https://api.github.com')
      .persist()
      .get('/repos/mridang/testing')
      .reply(HttpStatus.OK, {
        id: 748500999,
        node_id: 'R_kgDOLJ04Bw',
        name: 'testing',
        full_name: 'mridang/testing',
        private: false,
        owner: {
          login: 'mridang',
          id: 327432,
          node_id: 'MDQ6VXNlcjMyNzQzMg==',
          avatar_url: 'https://avatars.githubusercontent.com/u/327432?v=4',
          gravatar_id: '',
          url: 'https://api.github.com/users/mridang',
          html_url: 'https://github.com/mridang',
          followers_url: 'https://api.github.com/users/mridang/followers',
          following_url:
            'https://api.github.com/users/mridang/following{/other_user}',
          gists_url: 'https://api.github.com/users/mridang/gists{/gist_id}',
          starred_url:
            'https://api.github.com/users/mridang/starred{/owner}{/repo}',
          subscriptions_url:
            'https://api.github.com/users/mridang/subscriptions',
          organizations_url: 'https://api.github.com/users/mridang/orgs',
          repos_url: 'https://api.github.com/users/mridang/repos',
          events_url: 'https://api.github.com/users/mridang/events{/privacy}',
          received_events_url:
            'https://api.github.com/users/mridang/received_events',
          type: 'User',
          site_admin: false,
        },
        html_url: 'https://github.com/mridang/testing',
        description: 'A test repository to run integration tests against',
        fork: false,
        url: 'https://api.github.com/repos/mridang/testing',
        forks_url: 'https://api.github.com/repos/mridang/testing/forks',
        keys_url: 'https://api.github.com/repos/mridang/testing/keys{/key_id}',
        collaborators_url:
          'https://api.github.com/repos/mridang/testing/collaborators{/collaborator}',
        teams_url: 'https://api.github.com/repos/mridang/testing/teams',
        hooks_url: 'https://api.github.com/repos/mridang/testing/hooks',
        issue_events_url:
          'https://api.github.com/repos/mridang/testing/issues/events{/number}',
        events_url: 'https://api.github.com/repos/mridang/testing/events',
        assignees_url:
          'https://api.github.com/repos/mridang/testing/assignees{/user}',
        branches_url:
          'https://api.github.com/repos/mridang/testing/branches{/branch}',
        tags_url: 'https://api.github.com/repos/mridang/testing/tags',
        blobs_url:
          'https://api.github.com/repos/mridang/testing/git/blobs{/sha}',
        git_tags_url:
          'https://api.github.com/repos/mridang/testing/git/tags{/sha}',
        git_refs_url:
          'https://api.github.com/repos/mridang/testing/git/refs{/sha}',
        trees_url:
          'https://api.github.com/repos/mridang/testing/git/trees{/sha}',
        statuses_url:
          'https://api.github.com/repos/mridang/testing/statuses/{sha}',
        languages_url: 'https://api.github.com/repos/mridang/testing/languages',
        stargazers_url:
          'https://api.github.com/repos/mridang/testing/stargazers',
        contributors_url:
          'https://api.github.com/repos/mridang/testing/contributors',
        subscribers_url:
          'https://api.github.com/repos/mridang/testing/subscribers',
        subscription_url:
          'https://api.github.com/repos/mridang/testing/subscription',
        commits_url:
          'https://api.github.com/repos/mridang/testing/commits{/sha}',
        git_commits_url:
          'https://api.github.com/repos/mridang/testing/git/commits{/sha}',
        comments_url:
          'https://api.github.com/repos/mridang/testing/comments{/number}',
        issue_comment_url:
          'https://api.github.com/repos/mridang/testing/issues/comments{/number}',
        contents_url:
          'https://api.github.com/repos/mridang/testing/contents/{+path}',
        compare_url:
          'https://api.github.com/repos/mridang/testing/compare/{base}...{head}',
        merges_url: 'https://api.github.com/repos/mridang/testing/merges',
        archive_url:
          'https://api.github.com/repos/mridang/testing/{archive_format}{/ref}',
        downloads_url: 'https://api.github.com/repos/mridang/testing/downloads',
        issues_url:
          'https://api.github.com/repos/mridang/testing/issues{/number}',
        pulls_url:
          'https://api.github.com/repos/mridang/testing/pulls{/number}',
        milestones_url:
          'https://api.github.com/repos/mridang/testing/milestones{/number}',
        notifications_url:
          'https://api.github.com/repos/mridang/testing/notifications{?since,all,participating}',
        labels_url:
          'https://api.github.com/repos/mridang/testing/labels{/name}',
        releases_url:
          'https://api.github.com/repos/mridang/testing/releases{/id}',
        deployments_url:
          'https://api.github.com/repos/mridang/testing/deployments',
        created_at: '2024-01-26T05:28:39Z',
        updated_at: '2024-02-20T08:44:58Z',
        pushed_at: '2024-02-23T08:28:13Z',
        git_url: 'git://github.com/mridang/testing.git',
        ssh_url: 'git@github.com:mridang/testing.git',
        clone_url: 'https://github.com/mridang/testing.git',
        svn_url: 'https://github.com/mridang/testing',
        homepage: null,
        size: 34,
        stargazers_count: 0,
        watchers_count: 0,
        language: 'JavaScript',
        has_issues: false,
        has_projects: false,
        has_downloads: true,
        has_wiki: false,
        has_pages: false,
        has_discussions: false,
        forks_count: 0,
        mirror_url: null,
        archived: false,
        disabled: false,
        open_issues_count: 6,
        license: null,
        allow_forking: true,
        is_template: false,
        web_commit_signoff_required: false,
        topics: [],
        visibility: 'public',
        forks: 0,
        open_issues: 6,
        watchers: 0,
        default_branch: 'master',
        permissions: {
          admin: true,
          maintain: true,
          push: true,
          triage: true,
          pull: true,
        },
        security_and_analysis: {
          secret_scanning: {
            status: 'disabled',
          },
          secret_scanning_push_protection: {
            status: 'disabled',
          },
          dependabot_security_updates: {
            status: 'enabled',
          },
          secret_scanning_validity_checks: {
            status: 'disabled',
          },
        },
        network_count: 0,
        subscribers_count: 0,
      })
      .get('/repos/mridang/testing/branches/master/protection')
      .reply(HttpStatus.NOT_FOUND)
      .put('/repos/mridang/testing/branches/master/protection', {
        enforce_admins: null,
        required_pull_request_reviews: null,
        required_status_checks: null,
        restrictions: null,
        lock_branch: true,
      })
      .reply(HttpStatus.OK, {})
      .get('/repos/mridang/foobar')
      .reply(HttpStatus.OK, {
        id: 748500999,
        node_id: 'R_kgDOLJ04Bw',
        name: 'foobar',
        full_name: 'mridang/foobar',
        private: false,
        owner: {
          login: 'mridang',
          id: 327432,
          node_id: 'MDQ6VXNlcjMyNzQzMg==',
          avatar_url: 'https://avatars.githubusercontent.com/u/327432?v=4',
          gravatar_id: '',
          url: 'https://api.github.com/users/mridang',
          html_url: 'https://github.com/mridang',
          followers_url: 'https://api.github.com/users/mridang/followers',
          following_url:
            'https://api.github.com/users/mridang/following{/other_user}',
          gists_url: 'https://api.github.com/users/mridang/gists{/gist_id}',
          starred_url:
            'https://api.github.com/users/mridang/starred{/owner}{/repo}',
          subscriptions_url:
            'https://api.github.com/users/mridang/subscriptions',
          organizations_url: 'https://api.github.com/users/mridang/orgs',
          repos_url: 'https://api.github.com/users/mridang/repos',
          events_url: 'https://api.github.com/users/mridang/events{/privacy}',
          received_events_url:
            'https://api.github.com/users/mridang/received_events',
          type: 'User',
          site_admin: false,
        },
        html_url: 'https://github.com/mridang/foobar',
        description: 'A test repository to run integration tests against',
        fork: false,
        url: 'https://api.github.com/repos/mridang/foobar',
        forks_url: 'https://api.github.com/repos/mridang/foobar/forks',
        keys_url: 'https://api.github.com/repos/mridang/foobar/keys{/key_id}',
        collaborators_url:
          'https://api.github.com/repos/mridang/foobar/collaborators{/collaborator}',
        teams_url: 'https://api.github.com/repos/mridang/foobar/teams',
        hooks_url: 'https://api.github.com/repos/mridang/foobar/hooks',
        issue_events_url:
          'https://api.github.com/repos/mridang/foobar/issues/events{/number}',
        events_url: 'https://api.github.com/repos/mridang/foobar/events',
        assignees_url:
          'https://api.github.com/repos/mridang/foobar/assignees{/user}',
        branches_url:
          'https://api.github.com/repos/mridang/foobar/branches{/branch}',
        tags_url: 'https://api.github.com/repos/mridang/foobar/tags',
        blobs_url:
          'https://api.github.com/repos/mridang/foobar/git/blobs{/sha}',
        git_tags_url:
          'https://api.github.com/repos/mridang/foobar/git/tags{/sha}',
        git_refs_url:
          'https://api.github.com/repos/mridang/foobar/git/refs{/sha}',
        trees_url:
          'https://api.github.com/repos/mridang/foobar/git/trees{/sha}',
        statuses_url:
          'https://api.github.com/repos/mridang/foobar/statuses/{sha}',
        languages_url: 'https://api.github.com/repos/mridang/foobar/languages',
        stargazers_url:
          'https://api.github.com/repos/mridang/foobar/stargazers',
        contributors_url:
          'https://api.github.com/repos/mridang/foobar/contributors',
        subscribers_url:
          'https://api.github.com/repos/mridang/foobar/subscribers',
        subscription_url:
          'https://api.github.com/repos/mridang/foobar/subscription',
        commits_url:
          'https://api.github.com/repos/mridang/foobar/commits{/sha}',
        git_commits_url:
          'https://api.github.com/repos/mridang/foobar/git/commits{/sha}',
        comments_url:
          'https://api.github.com/repos/mridang/foobar/comments{/number}',
        issue_comment_url:
          'https://api.github.com/repos/mridang/foobar/issues/comments{/number}',
        contents_url:
          'https://api.github.com/repos/mridang/foobar/contents/{+path}',
        compare_url:
          'https://api.github.com/repos/mridang/foobar/compare/{base}...{head}',
        merges_url: 'https://api.github.com/repos/mridang/foobar/merges',
        archive_url:
          'https://api.github.com/repos/mridang/foobar/{archive_format}{/ref}',
        downloads_url: 'https://api.github.com/repos/mridang/foobar/downloads',
        issues_url:
          'https://api.github.com/repos/mridang/foobar/issues{/number}',
        pulls_url: 'https://api.github.com/repos/mridang/foobar/pulls{/number}',
        milestones_url:
          'https://api.github.com/repos/mridang/foobar/milestones{/number}',
        notifications_url:
          'https://api.github.com/repos/mridang/foobar/notifications{?since,all,participating}',
        labels_url: 'https://api.github.com/repos/mridang/foobar/labels{/name}',
        releases_url:
          'https://api.github.com/repos/mridang/foobar/releases{/id}',
        deployments_url:
          'https://api.github.com/repos/mridang/foobar/deployments',
        created_at: '2024-01-26T05:28:39Z',
        updated_at: '2024-02-20T08:44:58Z',
        pushed_at: '2024-02-23T08:28:13Z',
        git_url: 'git://github.com/mridang/foobar.git',
        ssh_url: 'git@github.com:mridang/foobar.git',
        clone_url: 'https://github.com/mridang/foobar.git',
        svn_url: 'https://github.com/mridang/foobar',
        homepage: null,
        size: 34,
        stargazers_count: 0,
        watchers_count: 0,
        language: 'JavaScript',
        has_issues: false,
        has_projects: false,
        has_downloads: true,
        has_wiki: false,
        has_pages: false,
        has_discussions: false,
        forks_count: 0,
        mirror_url: null,
        archived: false,
        disabled: false,
        open_issues_count: 6,
        license: null,
        allow_forking: true,
        is_template: false,
        web_commit_signoff_required: false,
        topics: [],
        visibility: 'public',
        forks: 0,
        open_issues: 6,
        watchers: 0,
        default_branch: 'main',
        permissions: {
          admin: true,
          maintain: true,
          push: true,
          triage: true,
          pull: true,
        },
        security_and_analysis: {
          secret_scanning: {
            status: 'disabled',
          },
          secret_scanning_push_protection: {
            status: 'disabled',
          },
          dependabot_security_updates: {
            status: 'enabled',
          },
          secret_scanning_validity_checks: {
            status: 'disabled',
          },
        },
        network_count: 0,
        subscribers_count: 0,
      })
      .get('/repos/mridang/foobar/branches/main/protection')
      .reply(HttpStatus.OK, {
        url: 'https://api.github.com/repos/mridang/foobar/branches/main/protection',
        required_status_checks: {
          url: 'https://api.github.com/repos/mridang/foobar/branches/main/protection/required_status_checks',
          strict: true,
          contexts: ['run-canary'],
          contexts_url:
            'https://api.github.com/repos/mridang/foobar/branches/main/protection/required_status_checks/contexts',
          checks: [
            {
              context: 'run-canary',
              app_id: 15368,
            },
          ],
        },
        required_pull_request_reviews: {
          url: 'https://api.github.com/repos/mridang/foobar/branches/main/protection/required_pull_request_reviews',
          dismiss_stale_reviews: true,
          require_code_owner_reviews: true,
          require_last_push_approval: true,
          required_approving_review_count: 2,
        },
        required_signatures: {
          url: 'https://api.github.com/repos/mridang/foobar/branches/main/protection/required_signatures',
          enabled: true,
        },
        enforce_admins: {
          url: 'https://api.github.com/repos/mridang/foobar/branches/main/protection/enforce_admins',
          enabled: true,
        },
        required_linear_history: {
          enabled: true,
        },
        allow_force_pushes: {
          enabled: false,
        },
        allow_deletions: {
          enabled: false,
        },
        block_creations: {
          enabled: false,
        },
        required_conversation_resolution: {
          enabled: true,
        },
        lock_branch: {
          enabled: false,
        },
        allow_fork_syncing: {
          enabled: false,
        },
      })
      .put('/repos/mridang/foobar/branches/main/protection', {
        allow_deletions: false,
        allow_force_pushes: false,
        block_creations: false,
        enforce_admins: true,
        required_conversation_resolution: true,
        required_linear_history: true,
        required_pull_request_reviews: {
          dismiss_stale_reviews: true,
          require_code_owner_reviews: true,
          required_approving_review_count: 2,
        },
        required_status_checks: {
          strict: true,
          contexts: ['run-canary'],
          checks: [],
        },
        restrictions: null,
        lock_branch: false,
      })
      .reply(HttpStatus.OK, {});
  });

  afterEach(() => {
    nock.cleanAll();
  });

  test('that branches without existing rules get protected"', async () => {
    const protectionService = new ProtectionService(() => {
      return new Octokit({
        auth: 'no',
        request: {
          fetch: globalThis.fetch,
        },
      });
    });

    await protectionService.toggleProtection('mridang/testing', 0, true);
  });

  test('that branches with existing rules get protected"', async () => {
    const protectionService = new ProtectionService(() => {
      return new Octokit({
        auth: 'no',
        request: {
          fetch: globalThis.fetch,
        },
      });
    });

    await protectionService.toggleProtection('mridang/foobar', 0, false);
  });
});
