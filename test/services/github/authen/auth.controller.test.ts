import { End2EndModule } from '../../../e2e.module.js';
import { AppModule } from '../../../../src/app.module.js';
import nock from 'nock';
import request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { buildAxiosFetch } from '@lifeomic/axios-fetch';
import axios from 'axios';
import { CryptoImpl, FetchImpl } from '@mridang/nestjs-defaults';

const testModule = new End2EndModule({
  imports: [
    {
      module: AppModule,
      providers: [],
    },
  ],
});

describe('auth.controller tests', () => {
  beforeAll(async () => {
    await testModule.beforeAll((testModule) => {
      testModule
        .overrideProvider(CryptoImpl)
        .useValue({
          randomUUID: () => '00000000-0000-0000-0000-000000000000',
          getRandomValues: crypto.getRandomValues,
        })
        .overrideProvider(FetchImpl)
        .useValue(buildAxiosFetch(axios.create()));

      return testModule;
    });
  });

  afterAll(async () => {
    await testModule.afterAll();
  });

  beforeEach(() => {
    nock('https://api.github.com')
      .persist()
      .get('/user/installations?per_page=100&page=1')
      .reply(HttpStatus.OK, {
        total_count: 2,
        installations: [
          {
            id: 1,
            account: {
              login: 'octocat',
              id: 1,
              node_id: 'MDQ6VXNlcjE=',
              avatar_url: 'https://github.com/images/error/octocat_happy.gif',
              gravatar_id: '',
              url: 'https://api.github.com/users/octocat',
              html_url: 'https://github.com/octocat',
              followers_url: 'https://api.github.com/users/octocat/followers',
              following_url:
                'https://api.github.com/users/octocat/following{/other_user}',
              gists_url: 'https://api.github.com/users/octocat/gists{/gist_id}',
              starred_url:
                'https://api.github.com/users/octocat/starred{/owner}{/repo}',
              subscriptions_url:
                'https://api.github.com/users/octocat/subscriptions',
              organizations_url: 'https://api.github.com/users/octocat/orgs',
              repos_url: 'https://api.github.com/users/octocat/repos',
              events_url:
                'https://api.github.com/users/octocat/events{/privacy}',
              received_events_url:
                'https://api.github.com/users/octocat/received_events',
              type: 'User',
              site_admin: false,
            },
            access_tokens_url:
              'https://api.github.com/app/installations/1/access_tokens',
            repositories_url:
              'https://api.github.com/installation/repositories',
            html_url:
              'https://github.com/organizations/github/settings/installations/1',
            app_id: 1,
            target_id: 1,
            target_type: 'Organization',
            permissions: {
              checks: 'write',
              metadata: 'read',
              contents: 'read',
            },
            events: ['push', 'pull_request'],
            single_file_name: 'config.yaml',
            has_multiple_single_files: true,
            single_file_paths: ['config.yml', '.github/issue_TEMPLATE.md'],
            repository_selection: 'all',
            created_at: '2017-07-08T16:18:44-04:00',
            updated_at: '2017-07-08T16:18:44-04:00',
            app_slug: 'github-actions',
            suspended_at: null,
            suspended_by: null,
          },
          {
            id: 3,
            account: {
              login: 'octocat',
              id: 2,
              node_id: 'MDQ6VXNlcjE=',
              avatar_url: 'https://github.com/images/error/octocat_happy.gif',
              gravatar_id: '',
              url: 'https://api.github.com/users/octocat',
              html_url: 'https://github.com/octocat',
              followers_url: 'https://api.github.com/users/octocat/followers',
              following_url:
                'https://api.github.com/users/octocat/following{/other_user}',
              gists_url: 'https://api.github.com/users/octocat/gists{/gist_id}',
              starred_url:
                'https://api.github.com/users/octocat/starred{/owner}{/repo}',
              subscriptions_url:
                'https://api.github.com/users/octocat/subscriptions',
              organizations_url: 'https://api.github.com/users/octocat/orgs',
              repos_url: 'https://api.github.com/users/octocat/repos',
              events_url:
                'https://api.github.com/users/octocat/events{/privacy}',
              received_events_url:
                'https://api.github.com/users/octocat/received_events',
              type: 'User',
              site_admin: false,
            },
            access_tokens_url:
              'https://api.github.com/app/installations/1/access_tokens',
            repositories_url:
              'https://api.github.com/installation/repositories',
            html_url:
              'https://github.com/organizations/github/settings/installations/1',
            app_id: 1,
            target_id: 1,
            target_type: 'Organization',
            permissions: {
              checks: 'write',
              metadata: 'read',
              contents: 'read',
            },
            events: ['push', 'pull_request'],
            single_file_name: 'config.yaml',
            has_multiple_single_files: true,
            single_file_paths: ['config.yml', '.github/issue_TEMPLATE.md'],
            repository_selection: 'all',
            created_at: '2017-07-08T16:18:44-04:00',
            updated_at: '2017-07-08T16:18:44-04:00',
            app_slug: 'github-actions',
            suspended_at: null,
            suspended_by: null,
          },
        ],
      })
      .get('/user')
      .reply(HttpStatus.OK, {
        login: 'testuser',
      })
      .get('/user/repos?per_page=100')
      .reply(HttpStatus.OK, [
        {
          id: 1296269,
          node_id: 'MDEwOlJlcG9zaXRvcnkxMjk2MjY5',
          name: 'hello-world',
          full_name: 'octocat/hello-world',
          owner: {
            login: 'octocat',
            id: 1,
            node_id: 'MDQ6VXNlcjE=',
            avatar_url: 'https://github.com/images/error/octocat_happy.gif',
            gravatar_id: '',
            url: 'https://api.github.com/users/octocat',
            html_url: 'https://github.com/octocat',
            followers_url: 'https://api.github.com/users/octocat/followers',
            following_url:
              'https://api.github.com/users/octocat/following{/other_user}',
            gists_url: 'https://api.github.com/users/octocat/gists{/gist_id}',
            starred_url:
              'https://api.github.com/users/octocat/starred{/owner}{/repo}',
            subscriptions_url:
              'https://api.github.com/users/octocat/subscriptions',
            organizations_url: 'https://api.github.com/users/octocat/orgs',
            repos_url: 'https://api.github.com/users/octocat/repos',
            events_url: 'https://api.github.com/users/octocat/events{/privacy}',
            received_events_url:
              'https://api.github.com/users/octocat/received_events',
            type: 'User',
            site_admin: false,
          },
          private: false,
          html_url: 'https://github.com/octocat/hello-world',
          description: 'This your first repo!',
          fork: false,
          url: 'https://api.github.com/repos/octocat/hello-world',
          archive_url:
            'https://api.github.com/repos/octocat/hello-world/{archive_format}{/ref}',
          assignees_url:
            'https://api.github.com/repos/octocat/hello-world/assignees{/user}',
          blobs_url:
            'https://api.github.com/repos/octocat/hello-world/git/blobs{/sha}',
          branches_url:
            'https://api.github.com/repos/octocat/hello-world/branches{/branch}',
          collaborators_url:
            'https://api.github.com/repos/octocat/hello-world/collaborators{/collaborator}',
          comments_url:
            'https://api.github.com/repos/octocat/hello-world/comments{/number}',
          commits_url:
            'https://api.github.com/repos/octocat/hello-world/commits{/sha}',
          compare_url:
            'https://api.github.com/repos/octocat/hello-world/compare/{base}...{head}',
          contents_url:
            'https://api.github.com/repos/octocat/hello-world/contents/{+path}',
          contributors_url:
            'https://api.github.com/repos/octocat/hello-world/contributors',
          deployments_url:
            'https://api.github.com/repos/octocat/hello-world/deployments',
          downloads_url:
            'https://api.github.com/repos/octocat/hello-world/downloads',
          events_url: 'https://api.github.com/repos/octocat/hello-world/events',
          forks_url: 'https://api.github.com/repos/octocat/hello-world/forks',
          git_commits_url:
            'https://api.github.com/repos/octocat/hello-world/git/commits{/sha}',
          git_refs_url:
            'https://api.github.com/repos/octocat/hello-world/git/refs{/sha}',
          git_tags_url:
            'https://api.github.com/repos/octocat/hello-world/git/tags{/sha}',
          git_url: 'git:github.com/octocat/hello-world.git',
          issue_comment_url:
            'https://api.github.com/repos/octocat/hello-world/issues/comments{/number}',
          issue_events_url:
            'https://api.github.com/repos/octocat/hello-world/issues/events{/number}',
          issues_url:
            'https://api.github.com/repos/octocat/hello-world/issues{/number}',
          keys_url:
            'https://api.github.com/repos/octocat/hello-world/keys{/key_id}',
          labels_url:
            'https://api.github.com/repos/octocat/hello-world/labels{/name}',
          languages_url:
            'https://api.github.com/repos/octocat/hello-world/languages',
          merges_url: 'https://api.github.com/repos/octocat/hello-world/merges',
          milestones_url:
            'https://api.github.com/repos/octocat/hello-world/milestones{/number}',
          notifications_url:
            'https://api.github.com/repos/octocat/hello-world/notifications{?since,all,participating}',
          pulls_url:
            'https://api.github.com/repos/octocat/hello-world/pulls{/number}',
          releases_url:
            'https://api.github.com/repos/octocat/hello-world/releases{/id}',
          ssh_url: 'git@github.com:octocat/hello-world.git',
          stargazers_url:
            'https://api.github.com/repos/octocat/hello-world/stargazers',
          statuses_url:
            'https://api.github.com/repos/octocat/hello-world/statuses/{sha}',
          subscribers_url:
            'https://api.github.com/repos/octocat/hello-world/subscribers',
          subscription_url:
            'https://api.github.com/repos/octocat/hello-world/subscription',
          tags_url: 'https://api.github.com/repos/octocat/hello-world/tags',
          teams_url: 'https://api.github.com/repos/octocat/hello-world/teams',
          trees_url:
            'https://api.github.com/repos/octocat/hello-world/git/trees{/sha}',
          clone_url: 'https://github.com/octocat/hello-world.git',
          mirror_url: 'git:git.example.com/octocat/hello-world',
          hooks_url: 'https://api.github.com/repos/octocat/hello-world/hooks',
          svn_url: 'https://svn.github.com/octocat/hello-world',
          homepage: 'https://github.com',
          language: null,
          forks_count: 9,
          stargazers_count: 80,
          watchers_count: 80,
          size: 108,
          default_branch: 'master',
          open_issues_count: 0,
          is_template: true,
          topics: ['octocat', 'atom', 'electron', 'api'],
          has_issues: true,
          has_projects: true,
          has_wiki: true,
          has_pages: false,
          has_downloads: true,
          archived: false,
          disabled: false,
          visibility: 'public',
          pushed_at: '2011-01-26T19:06:43Z',
          created_at: '2011-01-26T19:01:12Z',
          updated_at: '2011-01-26T19:14:43Z',
          permissions: {
            admin: false,
            push: false,
            pull: true,
          },
          allow_rebase_merge: true,
          template_repository: null,
          temp_clone_token: 'ABTLWHOULUVAXGTRYU7OC2876QJ2O',
          allow_squash_merge: true,
          allow_auto_merge: false,
          delete_branch_on_merge: true,
          allow_merge_commit: true,
          subscribers_count: 42,
          network_count: 0,
          license: {
            key: 'mit',
            name: 'MIT License',
            url: 'https://api.github.com/licenses/mit',
            spdx_id: 'MIT',
            node_id: 'MDc6TGljZW5zZW1pdA==',
            html_url: 'https://github.com/licenses/mit',
          },
          forks: 1,
          open_issues: 1,
          watchers: 1,
        },
      ]);

    nock('https://github.com')
      .persist()
      .post('/login/oauth/access_token')
      .reply(HttpStatus.OK, {
        access_token: 'test_access_token',
      });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  test('responds with 400 Bad Request when `code` query parameter is missing', () => {
    return request(testModule.app.getHttpServer())
      .get('/auth')
      .expect(HttpStatus.BAD_REQUEST);
  });

  test('responds with 400 Bad Request when `code` query parameter is invalid', () => {
    return request(testModule.app.getHttpServer())
      .get('/auth?code=invalidCode')
      .expect(HttpStatus.BAD_REQUEST);
  });

  test('handles GitHub OAuth callback successfully', () => {
    return request(testModule.app.getHttpServer())
      .get('/auth?code=foofoofoofoofoofoofoo&state=barbarbarbarbarbarbar')
      .set('Cookie', 'nonce=barbarbarbarbarbarbar')
      .expect(HttpStatus.FOUND)
      .expect(
        'Set-Cookie',
        /^nonce=; Path=\/; Expires=.* GMT,jwt=.*\..*\..*; Max-Age=3600; Path=\/; Expires=.* GMT; HttpOnly; Secure; SameSite=Strict$/,
      );
  });

  test('clears jwt cookie and redirects on logout', () => {
    return request(testModule.app.getHttpServer())
      .get('/auth/logout')
      .expect(HttpStatus.FOUND)
      .expect('Set-Cookie', /jwt=;/);
  });
});
