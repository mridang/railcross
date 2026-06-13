/// <reference types="@cloudflare/workers-types" />
import type {
  KVNamespace,
  DurableObjectNamespace,
} from '@cloudflare/workers-types';
import type { ScheduleAlarm } from './scheduler/schedule-alarm.js';

declare global {
  namespace Cloudflare {
    /**
     * The Worker bindings available to railcross, surfaced through the
     * `cloudflare:workers` `env` import.
     */
    interface Env {
      /** Stores one {@link ScheduleConfig} per schedule key. */
      SCHEDULES: KVNamespace;
      /** One Durable Object alarm per `${installationId}.${repoId}.${task}`. */
      SCHEDULE_ALARMS: DurableObjectNamespace<ScheduleAlarm>;
    }
  }
}

export {};
