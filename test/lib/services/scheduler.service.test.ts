import {
  SchedulerService,
  formatScheduleDisplay,
  type SchedulerEnv,
} from '@/lib/services/scheduler.service';

describe('scheduler.service', () => {
  describe('SchedulerService', () => {
    const mockScheduleData = {
      installationId: 123,
      repoId: 456,
      repoName: 'owner/repo',
      lockTime: 18,
      unlockTime: 9,
      timezone: 'America/New_York',
    };

    const createMockWorker = () => ({
      fetch: jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockScheduleData),
      }),
    });

    const createMockEnv = (
      worker: ReturnType<typeof createMockWorker>,
    ): SchedulerEnv => ({
      SCHEDULER_WORKER: worker,
    });

    describe('isAvailable', () => {
      it('should return true when SCHEDULER_WORKER is available', () => {
        const env: SchedulerEnv = { SCHEDULER_WORKER: {} as never };
        const service = new SchedulerService(env);
        expect(service.isAvailable()).toBe(true);
      });

      it('should return false when SCHEDULER_WORKER is not available', () => {
        const env: SchedulerEnv = {};
        const service = new SchedulerService(env);
        expect(service.isAvailable()).toBe(false);
      });
    });

    describe('createSchedule', () => {
      it('should create schedule when SCHEDULER_WORKER is available', async () => {
        const mockWorker = createMockWorker();
        const env = createMockEnv(mockWorker);
        const service = new SchedulerService(env);

        await service.createSchedule(123, 456, 'owner/repo', 18, 9, 'UTC');

        expect(mockWorker.fetch).toHaveBeenCalledWith(
          'https://scheduler/do/123/456/schedule',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              installationId: 123,
              repoId: 456,
              repoName: 'owner/repo',
              lockTime: 18,
              unlockTime: 9,
              timezone: 'UTC',
            }),
          },
        );
      });

      it('should do nothing when SCHEDULER_WORKER is not available', async () => {
        const env: SchedulerEnv = {};
        const service = new SchedulerService(env);

        await expect(
          service.createSchedule(123, 456, 'owner/repo', 18, 9, 'UTC'),
        ).resolves.toBeUndefined();
      });
    });

    describe('getSchedule', () => {
      it('should return schedule when SCHEDULER_WORKER is available', async () => {
        const mockWorker = createMockWorker();
        const env = createMockEnv(mockWorker);
        const service = new SchedulerService(env);

        const result = await service.getSchedule(123, 456);

        expect(result).toEqual(mockScheduleData);
        expect(mockWorker.fetch).toHaveBeenCalledWith(
          'https://scheduler/do/123/456/schedule',
          { method: 'GET' },
        );
      });

      it('should return null when SCHEDULER_WORKER is not available', async () => {
        const env: SchedulerEnv = {};
        const service = new SchedulerService(env);

        const result = await service.getSchedule(123, 456);

        expect(result).toBeNull();
      });
    });

    describe('deleteSchedule', () => {
      it('should delete schedule when SCHEDULER_WORKER is available', async () => {
        const mockWorker = createMockWorker();
        const env = createMockEnv(mockWorker);
        const service = new SchedulerService(env);

        await service.deleteSchedule(123, 456);

        expect(mockWorker.fetch).toHaveBeenCalledWith(
          'https://scheduler/do/123/456/schedule',
          { method: 'DELETE' },
        );
      });

      it('should do nothing when SCHEDULER_WORKER is not available', async () => {
        const env: SchedulerEnv = {};
        const service = new SchedulerService(env);

        await expect(service.deleteSchedule(123, 456)).resolves.toBeUndefined();
      });
    });

    describe('deleteSchedulesForInstallation', () => {
      it('should delete all schedules for given repo IDs', async () => {
        const mockWorker = createMockWorker();
        const env = createMockEnv(mockWorker);
        const service = new SchedulerService(env);

        await service.deleteSchedulesForInstallation(123, [456, 789, 101]);

        expect(mockWorker.fetch).toHaveBeenCalledTimes(3);
      });

      it('should handle empty repo IDs array', async () => {
        const mockWorker = createMockWorker();
        const env = createMockEnv(mockWorker);
        const service = new SchedulerService(env);

        await service.deleteSchedulesForInstallation(123, []);

        expect(mockWorker.fetch).not.toHaveBeenCalled();
      });
    });
  });

  describe('formatScheduleDisplay', () => {
    it('should return empty object for null schedule', () => {
      const result = formatScheduleDisplay(null);
      expect(result).toEqual({});
    });

    it('should format schedule data correctly', () => {
      const schedule = {
        installationId: 123,
        repoId: 456,
        repoName: 'owner/repo',
        lockTime: 18,
        unlockTime: 9,
        timezone: 'America/New_York',
      };

      const result = formatScheduleDisplay(schedule);

      expect(result).toEqual({
        lockTime: '18:00 America/New_York',
        unlockTime: '09:00 America/New_York',
      });
    });

    it('should handle midnight times', () => {
      const schedule = {
        installationId: 123,
        repoId: 456,
        repoName: 'owner/repo',
        lockTime: 0,
        unlockTime: 0,
        timezone: 'UTC',
      };

      const result = formatScheduleDisplay(schedule);

      expect(result).toEqual({
        lockTime: '00:00 UTC',
        unlockTime: '00:00 UTC',
      });
    });
  });
});
