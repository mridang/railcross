import { Octokit } from '@octokit/rest';
import { toggleProtection } from '@/lib/services/protection.service';
import nock from 'nock';

describe('protection.service', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should lock unprotected branch', async () => {
    nock('https://api.github.com')
      .get('/repos/owner/repo')
      .reply(200, {
        name: 'repo',
        full_name: 'owner/repo',
        default_branch: 'main',
      })
      .get('/repos/owner/repo/branches/main/protection')
      .reply(404)
      .put('/repos/owner/repo/branches/main/protection', {
        enforce_admins: null,
        required_pull_request_reviews: null,
        required_status_checks: null,
        restrictions: null,
        lock_branch: true,
      })
      .reply(200, {});

    const octokit = new Octokit({ auth: 'token' });
    await toggleProtection(octokit, 'owner/repo', true);
  });

  it('should unlock unprotected branch', async () => {
    nock('https://api.github.com')
      .get('/repos/owner/repo')
      .reply(200, {
        name: 'repo',
        full_name: 'owner/repo',
        default_branch: 'main',
      })
      .get('/repos/owner/repo/branches/main/protection')
      .reply(404)
      .put('/repos/owner/repo/branches/main/protection', {
        enforce_admins: null,
        required_pull_request_reviews: null,
        required_status_checks: null,
        restrictions: null,
        lock_branch: false,
      })
      .reply(200, {});

    const octokit = new Octokit({ auth: 'token' });
    await toggleProtection(octokit, 'owner/repo', false);
  });

  it('should preserve protection rules when locking protected branch', async () => {
    nock('https://api.github.com')
      .get('/repos/owner/repo')
      .reply(200, {
        name: 'repo',
        full_name: 'owner/repo',
        default_branch: 'main',
      })
      .get('/repos/owner/repo/branches/main/protection')
      .reply(200, {
        required_status_checks: {
          strict: true,
          contexts: ['ci'],
        },
        required_pull_request_reviews: {
          dismiss_stale_reviews: true,
          require_code_owner_reviews: true,
          required_approving_review_count: 1,
        },
        enforce_admins: { enabled: true },
        required_linear_history: { enabled: true },
        allow_force_pushes: { enabled: false },
        allow_deletions: { enabled: false },
        block_creations: { enabled: true },
        required_conversation_resolution: { enabled: true },
      })
      .put('/repos/owner/repo/branches/main/protection')
      .reply(200, {});

    const octokit = new Octokit({ auth: 'token' });
    await toggleProtection(octokit, 'owner/repo', true);
  });

  it('should handle dismissal_restrictions with users, teams, apps', async () => {
    nock('https://api.github.com')
      .get('/repos/owner/repo')
      .reply(200, {
        name: 'repo',
        full_name: 'owner/repo',
        default_branch: 'main',
      })
      .get('/repos/owner/repo/branches/main/protection')
      .reply(200, {
        required_pull_request_reviews: {
          dismiss_stale_reviews: true,
          dismissal_restrictions: {
            users: [{ name: 'user1' }],
            teams: [{ name: 'team1' }],
            apps: [{ name: 'app1' }],
          },
        },
        enforce_admins: { enabled: false },
      })
      .put('/repos/owner/repo/branches/main/protection')
      .reply(200, {});

    const octokit = new Octokit({ auth: 'token' });
    await toggleProtection(octokit, 'owner/repo', true);
  });

  it('should handle bypass_pull_request_allowances with users, teams, apps', async () => {
    nock('https://api.github.com')
      .get('/repos/owner/repo')
      .reply(200, {
        name: 'repo',
        full_name: 'owner/repo',
        default_branch: 'main',
      })
      .get('/repos/owner/repo/branches/main/protection')
      .reply(200, {
        required_pull_request_reviews: {
          bypass_pull_request_allowances: {
            users: [{ name: 'admin1' }],
            teams: [{ name: 'admins' }],
            apps: [{ name: 'bot1' }],
          },
        },
        enforce_admins: { enabled: false },
      })
      .put('/repos/owner/repo/branches/main/protection')
      .reply(200, {});

    const octokit = new Octokit({ auth: 'token' });
    await toggleProtection(octokit, 'owner/repo', false);
  });

  it('should handle restrictions with users, teams, apps', async () => {
    nock('https://api.github.com')
      .get('/repos/owner/repo')
      .reply(200, {
        name: 'repo',
        full_name: 'owner/repo',
        default_branch: 'main',
      })
      .get('/repos/owner/repo/branches/main/protection')
      .reply(200, {
        restrictions: {
          users: [{ login: 'user1' }],
          teams: [{ name: 'team1' }],
          apps: [{ name: 'app1' }],
        },
        enforce_admins: { enabled: false },
      })
      .put('/repos/owner/repo/branches/main/protection')
      .reply(200, {});

    const octokit = new Octokit({ auth: 'token' });
    await toggleProtection(octokit, 'owner/repo', true);
  });

  it('should handle null status checks', async () => {
    nock('https://api.github.com')
      .get('/repos/owner/repo')
      .reply(200, {
        name: 'repo',
        full_name: 'owner/repo',
        default_branch: 'main',
      })
      .get('/repos/owner/repo/branches/main/protection')
      .reply(200, {
        required_status_checks: null,
        enforce_admins: { enabled: false },
      })
      .put('/repos/owner/repo/branches/main/protection')
      .reply(200, {});

    const octokit = new Octokit({ auth: 'token' });
    await toggleProtection(octokit, 'owner/repo', true);
  });

  it('should handle missing optional fields in protection', async () => {
    nock('https://api.github.com')
      .get('/repos/owner/repo')
      .reply(200, {
        name: 'repo',
        full_name: 'owner/repo',
        default_branch: 'main',
      })
      .get('/repos/owner/repo/branches/main/protection')
      .reply(200, {
        enforce_admins: { enabled: false },
        allow_deletions: undefined,
        allow_force_pushes: undefined,
        block_creations: undefined,
        required_conversation_resolution: undefined,
        required_linear_history: undefined,
        required_pull_request_reviews: undefined,
        required_status_checks: undefined,
        restrictions: undefined,
      })
      .put('/repos/owner/repo/branches/main/protection')
      .reply(200, {});

    const octokit = new Octokit({ auth: 'token' });
    await toggleProtection(octokit, 'owner/repo', true);
  });
});
