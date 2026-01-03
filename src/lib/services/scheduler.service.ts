import type { ScheduleData } from '@/workers/scheduler';

interface ServiceWorker {
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}

export interface SchedulerEnv {
  SCHEDULER_WORKER?: ServiceWorker;
}

export class SchedulerService {
  constructor(private readonly env: SchedulerEnv) {}

  isAvailable(): boolean {
    return !!this.env.SCHEDULER_WORKER;
  }

  async createSchedule(
    installationId: number,
    repoId: number,
    repoName: string,
    lockTime: number,
    unlockTime: number,
    timezone: string,
  ): Promise<void> {
    if (!this.env.SCHEDULER_WORKER) {
      return;
    }

    const data: ScheduleData = {
      installationId,
      repoId,
      repoName,
      lockTime,
      unlockTime,
      timezone,
    };

    await this.env.SCHEDULER_WORKER.fetch(
      `https://scheduler/do/${installationId}/${repoId}/schedule`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
    );
  }

  async getSchedule(
    installationId: number,
    repoId: number,
  ): Promise<ScheduleData | null> {
    if (!this.env.SCHEDULER_WORKER) {
      return null;
    }

    try {
      const response = await this.env.SCHEDULER_WORKER.fetch(
        `https://scheduler/do/${installationId}/${repoId}/schedule`,
        { method: 'GET' },
      );

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Failed to fetch schedule', { error });
      return null;
    }
  }

  async deleteSchedule(installationId: number, repoId: number): Promise<void> {
    if (!this.env.SCHEDULER_WORKER) {
      return;
    }

    await this.env.SCHEDULER_WORKER.fetch(
      `https://scheduler/do/${installationId}/${repoId}/schedule`,
      { method: 'DELETE' },
    );
  }

  async deleteSchedulesForInstallation(
    installationId: number,
    repoIds: number[],
  ): Promise<void> {
    await Promise.all(
      repoIds.map((repoId) => this.deleteSchedule(installationId, repoId)),
    );
  }
}

export function formatScheduleDisplay(schedule: ScheduleData | null): {
  lockTime?: string;
  unlockTime?: string;
} {
  if (!schedule) {
    return {};
  }

  return {
    lockTime: `${schedule.lockTime.toString().padStart(2, '0')}:00 ${schedule.timezone}`,
    unlockTime: `${schedule.unlockTime.toString().padStart(2, '0')}:00 ${schedule.timezone}`,
  };
}
