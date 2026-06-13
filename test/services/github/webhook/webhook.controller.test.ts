import { expect } from '@jest/globals';
import request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { End2EndModule } from '../../../e2e.module.js';
import { AppModule } from '../../../../src/app.module.js';
import { hmacSha256 } from '../../../../src/utils/crypto.js';

const testModule = new End2EndModule({
  imports: [
    {
      module: AppModule,
      providers: [],
    },
  ],
});

describe('webhook.controller tests', () => {
  beforeAll(async () => {
    await testModule.beforeAll();
  });

  afterAll(async () => {
    await testModule.afterAll();
  });

  test('should return 201 when the headers all valid', async () => {
    const webhookSecret = await testModule.app
      .get(ConfigService)
      .getOrThrow('GITHUB_WEBHOOK_SECRET');

    const payload = {
      action: 'opened',
      issue: {
        number: 1,
      },
      repository: {
        id: 123,
        name: 'Hello-World',
        full_name: 'octocat/Hello-World',
      },
      sender: {
        login: 'octocat',
      },
    };
    const signature = hmacSha256(webhookSecret, JSON.stringify(payload));

    return request(testModule.app.getHttpServer())
      .post('/hook')
      .set({
        'x-github-delivery': '72d3162e-cc78-11e3-81ab-4c9367dc0958',
        'x-github-event': 'installation',
        'x-hub-signature-256': `sha256=${signature}`,
        'Content-Type': 'application/json',
      })
      .send(JSON.stringify(payload))
      .expect(HttpStatus.CREATED)
      .expect((res) => {
        expect(res.body).toEqual({
          //
        });
      });
  });

  test('should return 400 without x-github-delivery header', async () => {
    const webhookSecret = await testModule.app
      .get(ConfigService)
      .getOrThrow('GITHUB_WEBHOOK_SECRET');
    const payload = {
      action: 'opened',
      issue: { number: 1 },
      repository: {
        id: 123,
        name: 'Hello-World',
        full_name: 'octocat/Hello-World',
      },
      sender: { login: 'octocat' },
    };
    const signature = hmacSha256(webhookSecret, JSON.stringify(payload));

    return request(testModule.app.getHttpServer())
      .post('/hook')
      .set({
        'x-github-event': 'installation',
        'x-hub-signature-256': `sha256=${signature}`,
        'Content-Type': 'application/json',
      })
      .send(JSON.stringify(payload))
      .expect(HttpStatus.BAD_REQUEST);
  });

  test('should return 400 without x-github-event header', async () => {
    const webhookSecret = await testModule.app
      .get(ConfigService)
      .getOrThrow('GITHUB_WEBHOOK_SECRET');
    const payload = {
      action: 'opened',
      issue: { number: 1 },
      repository: {
        id: 123,
        name: 'Hello-World',
        full_name: 'octocat/Hello-World',
      },
      sender: { login: 'octocat' },
    };
    const signature = hmacSha256(webhookSecret, JSON.stringify(payload));

    return request(testModule.app.getHttpServer())
      .post('/hook')
      .set({
        'x-github-delivery': '72d3162e-cc78-11e3-81ab-4c9367dc0958',
        'x-hub-signature-256': `sha256=${signature}`,
        'Content-Type': 'application/json',
      })
      .send(JSON.stringify(payload))
      .expect(HttpStatus.BAD_REQUEST);
  });

  test('should return 400 without x-hub-signature-256 header', async () => {
    const webhookSecret = await testModule.app
      .get(ConfigService)
      .getOrThrow('GITHUB_WEBHOOK_SECRET');
    const payload = {
      action: 'opened',
      issue: { number: 1 },
      repository: {
        id: 123,
        name: 'Hello-World',
        full_name: 'octocat/Hello-World',
      },
      sender: { login: 'octocat' },
    };
    const signature = hmacSha256(webhookSecret, JSON.stringify(payload));

    return request(testModule.app.getHttpServer())
      .post('/hook')
      .set({
        'x-github-delivery': '72d3162e-cc78-11e3-81ab-4c9367dc0958',
        'x-github-event': 'installation',
        'Content-Type': 'application/json',
        'x-hub-signature-512': `sha256=${signature}`,
      })
      .send(JSON.stringify(payload))
      .expect(HttpStatus.BAD_REQUEST);
  });

  test('that pull_request.closed event are handled', async () => {
    const webhookSecret = await testModule.app
      .get(ConfigService)
      .getOrThrow('GITHUB_WEBHOOK_SECRET');
    const payload = {
      action: 'closed',
      number: 1347,
      pull_request: {
        url: 'https://api.github.com/repos/octocat/Hello-World/pulls/1347',
        id: 1,
        node_id: 'MDExOlB1bGxSZXF1ZXN0MQ==',
        html_url: 'https://github.com/octocat/Hello-World/pull/1347',
        diff_url: 'https://github.com/octocat/Hello-World/pull/1347.diff',
        patch_url: 'https://github.com/octocat/Hello-World/pull/1347.patch',
        issue_url:
          'https://api.github.com/repos/octocat/Hello-World/issues/1347',
        number: 1347,
        state: 'closed',
        locked: false,
        title: 'Amazing new feature',
        user: {
          login: 'octocat',
          id: 1,
          avatar_url: 'https://github.com/images/error/octocat_happy.gif',
          html_url: 'https://github.com/octocat',
          type: 'User',
          site_admin: false,
        },
        body: 'Please pull these awesome changes',
        created_at: '2020-01-01T00:00:00Z',
        updated_at: '2020-01-02T00:00:00Z',
        closed_at: '2020-01-02T00:00:00Z',
        merged_at: null,
        merge_commit_sha: 'e5bd3914e2e596debea16f433f57875b5b90bcd6',
        assignee: null,
        assignees: [],
        requested_reviewers: [],
        requested_teams: [],
        labels: [],
        milestone: null,
        draft: false,
        commits_url:
          'https://api.github.com/repos/octocat/Hello-World/pulls/1347/commits',
        review_comments_url:
          'https://api.github.com/repos/octocat/Hello-World/pulls/1347/comments',
        review_comment_url:
          'https://api.github.com/repos/octocat/Hello-World/pulls/comments{/number}',
        comments_url:
          'https://api.github.com/repos/octocat/Hello-World/issues/1347/comments',
        statuses_url:
          'https://api.github.com/repos/octocat/Hello-World/statuses/e5bd3914e2e596debea16f433f57875b5b90bcd6',
        head: {
          label: 'octocat:new-feature',
          ref: 'new-feature',
          sha: '6dcb09b5b57875f334f61aebed695e2e4193db5e',
          user: {
            login: 'octocat',
            id: 1,
            avatar_url: 'https://github.com/images/error/octocat_happy.gif',
            html_url: 'https://github.com/octocat',
            type: 'User',
            site_admin: false,
          },
          repo: {
            id: 1296269,
            name: 'Hello-World',
            full_name: 'octocat/Hello-World',
            owner: {
              login: 'octocat',
              id: 1,
              avatar_url: 'https://github.com/images/error/octocat_happy.gif',
              html_url: 'https://github.com/octocat',
              type: 'User',
              site_admin: false,
            },
            private: false,
            html_url: 'https://github.com/octocat/Hello-World',
            description: 'This your first repo!',
            fork: false,
            url: 'https://api.github.com/repos/octocat/Hello-World',
            created_at: '2020-01-01T00:00:00Z',
            updated_at: '2020-01-02T00:00:00Z',
            pushed_at: '2020-01-02T00:00:00Z',
            git_url: 'git://github.com/octocat/Hello-World.git',
            ssh_url: 'git@github.com:octocat/Hello-World.git',
            clone_url: 'https://github.com/octocat/Hello-World.git',
            svn_url: 'https://svn.github.com/octocat/Hello-World',
            homepage: null,
            size: 0,
            stargazers_count: 0,
            watchers_count: 0,
            language: 'English',
            has_issues: true,
            has_projects: true,
            has_downloads: true,
            has_wiki: true,
            has_pages: false,
            forks_count: 1,
            mirror_url: null,
            archived: false,
            disabled: false,
            open_issues_count: 1,
            license: null,
            forks: 1,
            open_issues: 1,
            watchers: 1,
            default_branch: 'master',
          },
        },
        base: {
          label: 'octocat:master',
          ref: 'master',
          sha: '6dcb09b5b57875f334f61aebed695e2e4193db5e',
          user: {
            login: 'octocat',
            id: 1,
            avatar_url: 'https://github.com/images/error/octocat_happy.gif',
            html_url: 'https://github.com/octocat',
            type: 'User',
            site_admin: false,
          },
          repo: {
            id: 1296269,
            name: 'Hello-World',
            full_name: 'octocat/Hello-World',
            html_url: 'https://github.com/octocat/Hello-World',
            description: 'This your first repo!',
            fork: false,
            url: 'https://api.github.com/repos/octocat/Hello-World',
          },
        },
        merged: false,
        mergeable: null,
        rebaseable: null,
        mergeable_state: 'unknown',
        merged_by: null,
        comments: 0,
        review_comments: 0,
        maintainer_can_modify: false,
        commits: 1,
        additions: 5,
        deletions: 3,
        changed_files: 1,
      },
      repository: {
        id: 1296269,
        node_id: 'MDEwOlJlcG9zaXRvcnkxMjk2MjY5',
        name: 'Hello-World',
        full_name: 'octocat/Hello-World',
        private: false,
        owner: {
          login: 'octocat',
          id: 1,
          avatar_url: 'https://github.com/images/error/octocat_happy.gif',
          html_url: 'https://github.com/octocat',
          type: 'User',
          site_admin: false,
        },
      },
      sender: {
        login: 'octocat',
        id: 1,
        avatar_url: 'https://github.com/images/error/octocat_happy.gif',
        html_url: 'https://github.com/octocat',
        type: 'User',
        site_admin: false,
      },
    };
    const signature = hmacSha256(webhookSecret, JSON.stringify(payload));

    await request(testModule.app.getHttpServer())
      .post('/hook')
      .set({
        'x-github-delivery': '72d3162e-cc78-11e3-81ab-4c9367dc0958',
        'x-github-event': 'pull_request',
        'Content-Type': 'application/json',
        'x-hub-signature-256': `sha256=${signature}`,
      })
      .send(payload)
      .expect(HttpStatus.CREATED)
      .expect('');
  });

  test('that installation.created events are handled', async () => {
    const webhookSecret = await testModule.app
      .get(ConfigService)
      .getOrThrow('GITHUB_WEBHOOK_SECRET');
    const payload = {
      action: 'created',
      installation: {
        id: 47071570,
        account: {
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
        repository_selection: 'all',
        access_tokens_url:
          'https://api.github.com/app/installations/47071570/access_tokens',
        repositories_url: 'https://api.github.com/installation/repositories',
        html_url: 'https://github.com/settings/installations/47071570',
        app_id: 712568,
        app_slug: 'marshallapp',
        target_id: 327432,
        target_type: 'User',
        permissions: {
          checks: 'read',
          actions: 'read',
          metadata: 'read',
          deployments: 'write',
          environments: 'read',
          pull_requests: 'read',
        },
        events: ['check_suite', 'deployment', 'pull_request'],
        created_at: '2024-02-08T12:08:18.000+02:00',
        updated_at: '2024-02-08T12:08:18.000+02:00',
        single_file_name: null,
        has_multiple_single_files: false,
        single_file_paths: [],
        suspended_by: null,
        suspended_at: null,
      },
      repositories: [
        {
          id: 1216277,
          node_id: 'MDEwOlJlcG9zaXRvcnkxMjE2Mjc3',
          name: 'JIMDB',
          full_name: 'mridang/JIMDB',
          private: false,
        },
      ],
      requester: null,
      sender: {
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
        subscriptions_url: 'https://api.github.com/users/mridang/subscriptions',
        organizations_url: 'https://api.github.com/users/mridang/orgs',
        repos_url: 'https://api.github.com/users/mridang/repos',
        events_url: 'https://api.github.com/users/mridang/events{/privacy}',
        received_events_url:
          'https://api.github.com/users/mridang/received_events',
        type: 'User',
        site_admin: false,
      },
    };
    const signature = hmacSha256(webhookSecret, JSON.stringify(payload));

    await request(testModule.app.getHttpServer())
      .post('/hook')
      .set({
        'x-github-delivery': '72d3162e-cc78-11e3-81ab-4c9367dc0958',
        'x-github-event': 'installation',
        'Content-Type': 'application/json',
        'x-hub-signature-256': `sha256=${signature}`,
      })
      .send(payload)
      .expect(HttpStatus.CREATED)
      .expect('');
  });

  test('that installation_repositories.added event are handled', async () => {
    const webhookSecret = await testModule.app
      .get(ConfigService)
      .getOrThrow('GITHUB_WEBHOOK_SECRET');
    const payload = {
      action: 'added',
      installation: {
        id: 47071570,
        account: {
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
        repository_selection: 'selected',
        access_tokens_url:
          'https://api.github.com/app/installations/47071570/access_tokens',
        repositories_url: 'https://api.github.com/installation/repositories',
        html_url: 'https://github.com/settings/installations/47071570',
        app_id: 712568,
        app_slug: 'marshallapp',
        target_id: 327432,
        target_type: 'User',
        permissions: {
          checks: 'read',
          actions: 'read',
          metadata: 'read',
          deployments: 'write',
          environments: 'read',
          pull_requests: 'read',
        },
        events: ['check_suite', 'deployment', 'pull_request'],
        created_at: '2024-02-08T12:08:18.000+02:00',
        updated_at: '2024-02-08T12:09:49.000+02:00',
        single_file_name: null,
        has_multiple_single_files: false,
        single_file_paths: [],
        suspended_by: null,
        suspended_at: null,
      },
      repository_selection: 'selected',
      repositories_added: [
        {
          id: 214675095,
          node_id: 'MDEwOlJlcG9zaXRvcnkyMTQ2NzUwOTU=',
          name: 'action-intellij',
          full_name: 'mridang/action-intellij',
          private: false,
        },
      ],
      repositories_removed: [],
      requester: null,
      sender: {
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
        subscriptions_url: 'https://api.github.com/users/mridang/subscriptions',
        organizations_url: 'https://api.github.com/users/mridang/orgs',
        repos_url: 'https://api.github.com/users/mridang/repos',
        events_url: 'https://api.github.com/users/mridang/events{/privacy}',
        received_events_url:
          'https://api.github.com/users/mridang/received_events',
        type: 'User',
        site_admin: false,
      },
    };
    const signature = hmacSha256(webhookSecret, JSON.stringify(payload));

    await request(testModule.app.getHttpServer())
      .post('/hook')
      .set({
        'x-github-delivery': '72d3162e-cc78-11e3-81ab-4c9367dc0958',
        'x-github-event': 'installation_repositories',
        'Content-Type': 'application/json',
        'x-hub-signature-256': `sha256=${signature}`,
      })
      .send(payload)
      .expect(HttpStatus.CREATED)
      .expect('');
  });

  test('that installation_repositories.removed event are handled', async () => {
    const webhookSecret = await testModule.app
      .get(ConfigService)
      .getOrThrow('GITHUB_WEBHOOK_SECRET');
    const payload = {
      action: 'removed',
      installation: {
        id: 47071570,
        account: {
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
        repository_selection: 'selected',
        access_tokens_url:
          'https://api.github.com/app/installations/47071570/access_tokens',
        repositories_url: 'https://api.github.com/installation/repositories',
        html_url: 'https://github.com/settings/installations/47071570',
        app_id: 712568,
        app_slug: 'marshallapp',
        target_id: 327432,
        target_type: 'User',
        permissions: {
          checks: 'read',
          actions: 'read',
          metadata: 'read',
          deployments: 'write',
          environments: 'read',
          pull_requests: 'read',
        },
        events: ['check_suite', 'deployment', 'pull_request'],
        created_at: '2024-02-08T12:08:18.000+02:00',
        updated_at: '2024-02-08T12:09:49.000+02:00',
        single_file_name: null,
        has_multiple_single_files: false,
        single_file_paths: [],
        suspended_by: null,
        suspended_at: null,
      },
      repository_selection: 'selected',
      repositories_added: [],
      repositories_removed: [
        {
          id: 1216277,
          node_id: 'MDEwOlJlcG9zaXRvcnkxMjE2Mjc3',
          name: 'JIMDB',
          full_name: 'mridang/JIMDB',
          private: false,
        },
      ],
      requester: null,
      sender: {
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
        subscriptions_url: 'https://api.github.com/users/mridang/subscriptions',
        organizations_url: 'https://api.github.com/users/mridang/orgs',
        repos_url: 'https://api.github.com/users/mridang/repos',
        events_url: 'https://api.github.com/users/mridang/events{/privacy}',
        received_events_url:
          'https://api.github.com/users/mridang/received_events',
        type: 'User',
        site_admin: false,
      },
    };
    const signature = hmacSha256(webhookSecret, JSON.stringify(payload));

    await request(testModule.app.getHttpServer())
      .post('/hook')
      .set({
        'x-github-delivery': '72d3162e-cc78-11e3-81ab-4c9367dc0958',
        'x-github-event': 'installation_repositories',
        'Content-Type': 'application/json',
        'x-hub-signature-256': `sha256=${signature}`,
      })
      .send(payload)
      .expect(HttpStatus.CREATED)
      .expect('');
  });
});
