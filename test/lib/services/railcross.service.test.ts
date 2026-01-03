import { Octokit } from '@octokit/rest';
import nock from 'nock';
import { RailcrossService } from '@/lib/services/railcross.service';
import { SchedulerService } from '@/lib/services/scheduler.service';

describe('railcross.service', () => {
  let mockSchedulerService: jest.Mocked<SchedulerService>;
  let octokit: Octokit;
  let service: RailcrossService;

  beforeEach(() => {
    mockSchedulerService = {
      isAvailable: jest.fn().mockReturnValue(true),
      createSchedule: jest.fn().mockResolvedValue(undefined),
      getSchedule: jest.fn().mockResolvedValue(null),
      deleteSchedule: jest.fn().mockResolvedValue(undefined),
      deleteSchedulesForInstallation: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<SchedulerService>;

    octokit = new Octokit({ auth: 'test-token' });
    service = new RailcrossService(mockSchedulerService);

    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
    jest.clearAllMocks();
  });

  describe('listSchedules', () => {
    it('should list schedules for all repositories', async () => {
      nock('https://api.github.com')
        .get('/user/installations')
        .query({ per_page: 100, page: 1 })
        .reply(200, {
          total_count: 1,
          installations: [{ id: 123, account: { login: 'owner' } }],
        });

      nock('https://api.github.com')
        .get('/user/installations/123/repositories')
        .query({ per_page: 100, page: 1 })
        .reply(200, {
          total_count: 2,
          repositories: [
            {
              id: 1,
              full_name: 'owner/repo1',
              updated_at: '2024-01-02T00:00:00Z',
            },
            {
              id: 2,
              full_name: 'owner/repo2',
              updated_at: '2024-01-01T00:00:00Z',
            },
          ],
        });

      mockSchedulerService.getSchedule
        .mockResolvedValueOnce({
          installationId: 123,
          repoId: 1,
          repoName: 'owner/repo1',
          lockTime: 18,
          unlockTime: 9,
          timezone: 'UTC',
        })
        .mockResolvedValueOnce(null);

      const result = await service.listSchedules(octokit);

      expect(result).toHaveLength(2);
      expect(result[0].repoName).toBe('owner/repo1');
      expect(result[0].lockTime).toBe('18:00 UTC');
      expect(result[1].repoName).toBe('owner/repo2');
      expect(result[1].lockTime).toBeUndefined();
    });

    it('should return empty array when no installations', async () => {
      nock('https://api.github.com')
        .get('/user/installations')
        .query({ per_page: 100, page: 1 })
        .reply(200, {
          total_count: 0,
          installations: [],
        });

      const result = await service.listSchedules(octokit);

      expect(result).toEqual([]);
    });
  });

  describe('resetSchedules', () => {
    it('should delete all schedules', async () => {
      nock('https://api.github.com')
        .get('/user/installations')
        .query({ per_page: 100, page: 1 })
        .reply(200, {
          total_count: 1,
          installations: [{ id: 123, account: { login: 'owner' } }],
        });

      nock('https://api.github.com')
        .get('/user/installations/123/repositories')
        .query({ per_page: 100, page: 1 })
        .reply(200, {
          total_count: 2,
          repositories: [
            { id: 1, full_name: 'owner/repo1' },
            { id: 2, full_name: 'owner/repo2' },
          ],
        });

      await service.resetSchedules(octokit);

      expect(mockSchedulerService.deleteSchedule).toHaveBeenCalledTimes(2);
      expect(mockSchedulerService.deleteSchedule).toHaveBeenCalledWith(123, 1);
      expect(mockSchedulerService.deleteSchedule).toHaveBeenCalledWith(123, 2);
    });
  });

  describe('updateSchedules', () => {
    it('should update schedules for selected repositories', async () => {
      nock('https://api.github.com')
        .get('/user/installations')
        .query({ per_page: 100, page: 1 })
        .reply(200, {
          total_count: 1,
          installations: [{ id: 123, account: { login: 'owner' } }],
        });

      nock('https://api.github.com')
        .get('/user/installations/123/repositories')
        .query({ per_page: 100, page: 1 })
        .reply(200, {
          total_count: 2,
          repositories: [
            { id: 1, full_name: 'owner/repo1' },
            { id: 2, full_name: 'owner/repo2' },
          ],
        });

      await service.updateSchedules(octokit, [1], 18, 9, 'UTC');

      expect(mockSchedulerService.deleteSchedule).toHaveBeenCalledWith(123, 1);
      expect(mockSchedulerService.createSchedule).toHaveBeenCalledWith(
        123,
        1,
        'owner/repo1',
        18,
        9,
        'UTC',
      );
      expect(mockSchedulerService.createSchedule).toHaveBeenCalledTimes(1);
    });

    it('should update all repositories when repoIds is empty', async () => {
      nock('https://api.github.com')
        .get('/user/installations')
        .query({ per_page: 100, page: 1 })
        .reply(200, {
          total_count: 1,
          installations: [{ id: 123, account: { login: 'owner' } }],
        });

      nock('https://api.github.com')
        .get('/user/installations/123/repositories')
        .query({ per_page: 100, page: 1 })
        .reply(200, {
          total_count: 2,
          repositories: [
            { id: 1, full_name: 'owner/repo1' },
            { id: 2, full_name: 'owner/repo2' },
          ],
        });

      await service.updateSchedules(octokit, [], 18, 9, 'UTC');

      expect(mockSchedulerService.createSchedule).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteSchedulesForRepos', () => {
    it('should delete schedules for specified repos', async () => {
      await service.deleteSchedulesForRepos(123, [1, 2, 3]);

      expect(mockSchedulerService.deleteSchedule).toHaveBeenCalledTimes(3);
      expect(mockSchedulerService.deleteSchedule).toHaveBeenCalledWith(123, 1);
      expect(mockSchedulerService.deleteSchedule).toHaveBeenCalledWith(123, 2);
      expect(mockSchedulerService.deleteSchedule).toHaveBeenCalledWith(123, 3);
    });

    it('should handle empty repo IDs', async () => {
      await service.deleteSchedulesForRepos(123, []);

      expect(mockSchedulerService.deleteSchedule).not.toHaveBeenCalled();
    });
  });
});
