/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/app/setup/route';

// Mock headers - the route uses headers() to get x-user-access-token
const mockHeadersGet = jest.fn();
jest.mock('next/headers', () => ({
  headers: jest.fn().mockImplementation(() =>
    Promise.resolve({
      get: mockHeadersGet,
    }),
  ),
}));

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    rest: {
      apps: {
        listInstallationsForAuthenticatedUser: jest.fn().mockResolvedValue({
          data: {
            total_count: 1,
            installations: [{ id: 123, account: { login: 'owner' } }],
          },
        }),
        listInstallationReposForAuthenticatedUser: jest.fn().mockResolvedValue({
          data: {
            total_count: 1,
            repositories: [{ id: 456, full_name: 'owner/repo1' }],
          },
        }),
      },
    },
  })),
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock the services for scheduler integration tests
const mockUpdateSchedules = jest.fn();
jest.mock('@/lib/services/railcross.service', () => ({
  RailcrossService: jest.fn().mockImplementation(() => ({
    updateSchedules: mockUpdateSchedules,
  })),
}));

jest.mock('@/lib/services/scheduler.service', () => ({
  SchedulerService: jest.fn().mockImplementation(() => ({})),
}));

describe('POST /app/setup', () => {
  const contextKey = Symbol.for('__cloudflare-context__');

  beforeEach(() => {
    jest.clearAllMocks();
    mockHeadersGet.mockReset();
    mockUpdateSchedules.mockReset();
    // Clear Cloudflare context
    delete (globalThis as Record<string | symbol, unknown>)[contextKey];
  });

  afterEach(() => {
    delete (globalThis as Record<string | symbol, unknown>)[contextKey];
  });

  function createFormData(data: Record<string, string | string[]>): FormData {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        value.forEach((v) => formData.append(key, v));
      } else {
        formData.append(key, value);
      }
    }
    return formData;
  }

  describe('authentication', () => {
    it('should return 401 when no access token header is present', async () => {
      // Mock headers to return null for x-user-access-token
      mockHeadersGet.mockReturnValue(null);

      const formData = createFormData({
        lock_time: '9',
        unlock_time: '17',
        timezone: 'UTC',
        repo_ids: ['456'],
      });

      const request = new NextRequest('https://example.com/app/setup', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.error).toContain('installations');
    });
  });

  describe('schema validation', () => {
    it('should return 400 for invalid lock_time', async () => {
      // Mock headers to return a valid access token
      mockHeadersGet.mockImplementation((name: string) => {
        if (name === 'x-user-access-token') return 'ghu_testtoken123';
        return null;
      });

      const formData = createFormData({
        lock_time: '25', // Invalid: must be 0-23
        unlock_time: '17',
        timezone: 'UTC',
        repo_ids: ['456'],
      });

      const request = new NextRequest('https://example.com/app/setup', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toBe('Invalid schedule data');
    });

    it('should return 400 for invalid timezone', async () => {
      mockHeadersGet.mockImplementation((name: string) => {
        if (name === 'x-user-access-token') return 'ghu_testtoken123';
        return null;
      });

      const formData = createFormData({
        lock_time: '9',
        unlock_time: '17',
        timezone: 'Invalid/Timezone',
        repo_ids: ['456'],
      });

      const request = new NextRequest('https://example.com/app/setup', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toBe('Invalid schedule data');
    });

    it('should return 400 for negative unlock_time', async () => {
      mockHeadersGet.mockImplementation((name: string) => {
        if (name === 'x-user-access-token') return 'ghu_testtoken123';
        return null;
      });

      const formData = createFormData({
        lock_time: '9',
        unlock_time: '-1',
        timezone: 'UTC',
        repo_ids: ['456'],
      });

      const request = new NextRequest('https://example.com/app/setup', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for non-numeric lock_time', async () => {
      mockHeadersGet.mockImplementation((name: string) => {
        if (name === 'x-user-access-token') return 'ghu_testtoken123';
        return null;
      });

      const formData = createFormData({
        lock_time: 'abc',
        unlock_time: '17',
        timezone: 'UTC',
        repo_ids: ['456'],
      });

      const request = new NextRequest('https://example.com/app/setup', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for missing timezone', async () => {
      mockHeadersGet.mockImplementation((name: string) => {
        if (name === 'x-user-access-token') return 'ghu_testtoken123';
        return null;
      });

      const formData = createFormData({
        lock_time: '9',
        unlock_time: '17',
        repo_ids: ['456'],
      });

      const request = new NextRequest('https://example.com/app/setup', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('successful update', () => {
    it('should redirect to /app on successful update without scheduler', async () => {
      mockHeadersGet.mockImplementation((name: string) => {
        if (name === 'x-user-access-token') return 'ghu_testtoken123';
        return null;
      });

      const formData = createFormData({
        lock_time: '9',
        unlock_time: '17',
        timezone: 'UTC',
        repo_ids: ['456'],
      });

      const request = new NextRequest('https://example.com/app/setup', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);

      // Should redirect to /app (status 307 or 308 for NextResponse.redirect)
      expect([301, 302, 303, 307, 308]).toContain(response.status);
      expect(response.headers.get('location')).toContain('/app');
    });

    it('should accept empty repo_ids', async () => {
      mockHeadersGet.mockImplementation((name: string) => {
        if (name === 'x-user-access-token') return 'ghu_testtoken123';
        return null;
      });

      const formData = createFormData({
        lock_time: '9',
        unlock_time: '17',
        timezone: 'UTC',
        // No repo_ids
      });

      const request = new NextRequest('https://example.com/app/setup', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect([301, 302, 303, 307, 308]).toContain(response.status);
    });

    it('should accept multiple repo_ids', async () => {
      mockHeadersGet.mockImplementation((name: string) => {
        if (name === 'x-user-access-token') return 'ghu_testtoken123';
        return null;
      });

      const formData = createFormData({
        lock_time: '9',
        unlock_time: '17',
        timezone: 'America/New_York',
        repo_ids: ['123', '456', '789'],
      });

      const request = new NextRequest('https://example.com/app/setup', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect([301, 302, 303, 307, 308]).toContain(response.status);
    });

    it('should accept edge case hour values (0 and 23)', async () => {
      mockHeadersGet.mockImplementation((name: string) => {
        if (name === 'x-user-access-token') return 'ghu_testtoken123';
        return null;
      });

      const formData = createFormData({
        lock_time: '0',
        unlock_time: '23',
        timezone: 'UTC',
        repo_ids: ['456'],
      });

      const request = new NextRequest('https://example.com/app/setup', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect([301, 302, 303, 307, 308]).toContain(response.status);
    });
  });

  describe('scheduler integration', () => {
    it('should call updateSchedules when Cloudflare env is available', async () => {
      // Set up Cloudflare context with scheduler worker
      (globalThis as Record<string | symbol, unknown>)[contextKey] = {
        env: {
          SCHEDULER_WORKER: { fetch: jest.fn() },
        },
      };

      mockUpdateSchedules.mockResolvedValue(undefined);
      mockHeadersGet.mockImplementation((name: string) => {
        if (name === 'x-user-access-token') return 'ghu_testtoken123';
        return null;
      });

      const formData = createFormData({
        lock_time: '9',
        unlock_time: '17',
        timezone: 'UTC',
        repo_ids: ['456', '789'],
      });

      const request = new NextRequest('https://example.com/app/setup', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect([301, 302, 303, 307, 308]).toContain(response.status);
      expect(mockUpdateSchedules).toHaveBeenCalledWith(
        expect.anything(), // Octokit instance
        [456, 789], // repo_ids as numbers
        9, // lock_time
        17, // unlock_time
        'UTC', // timezone
      );
    });

    it('should return 500 when scheduler update fails', async () => {
      // Set up Cloudflare context
      (globalThis as Record<string | symbol, unknown>)[contextKey] = {
        env: {
          SCHEDULER_WORKER: { fetch: jest.fn() },
        },
      };

      mockUpdateSchedules.mockRejectedValue(new Error('Scheduler unavailable'));
      mockHeadersGet.mockImplementation((name: string) => {
        if (name === 'x-user-access-token') return 'ghu_testtoken123';
        return null;
      });

      const formData = createFormData({
        lock_time: '9',
        unlock_time: '17',
        timezone: 'UTC',
        repo_ids: ['456'],
      });

      const request = new NextRequest('https://example.com/app/setup', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body.error).toBe('Failed to update schedules');
    });

    it('should not call scheduler when Cloudflare env is not available', async () => {
      // No Cloudflare context set up
      mockHeadersGet.mockImplementation((name: string) => {
        if (name === 'x-user-access-token') return 'ghu_testtoken123';
        return null;
      });

      const formData = createFormData({
        lock_time: '9',
        unlock_time: '17',
        timezone: 'UTC',
        repo_ids: ['456'],
      });

      const request = new NextRequest('https://example.com/app/setup', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect([301, 302, 303, 307, 308]).toContain(response.status);
      expect(mockUpdateSchedules).not.toHaveBeenCalled();
    });
  });
});
