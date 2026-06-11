import { NestFactory } from '@nestjs/core';
import { CloudflareAdapter } from '@mridang/nestjs-platform-cloudflare';
import { AppModule } from './dist/app.module.js';
import SchedulerService from './dist/services/railcross/scheduler.service.js';
import { configure } from '@mridang/nestjs-defaults';

// Boot once at top level on the fetch-native Cloudflare adapter — no Express,
// no node:http, no port. init() runs first with the no-op logger so Nest's
// route-resolution logging never hits winston during the forbidden global
// scope (winston transports do I/O, which Workers disallow at top level).
// configure() (winston logger + Express-compat middleware) is applied AFTER
// init: the adapter reads its middleware list per-request in handle(), so
// middleware registered post-init still runs.
const adapter = new CloudflareAdapter();
const app = await NestFactory.create(AppModule, adapter, {
  rawBody: true,
  logger: false,
});
await app.init();
configure(app);

export default {
  fetch: (request) => adapter.handle(request),
  // Daily cron: re-arm every schedule's Durable Object alarm from KV so alarms
  // always reflect the current configuration.
  scheduled(event, env, ctx) {
    ctx.waitUntil(app.get(SchedulerService).reRegisterAll());
  },
};

export { ScheduleAlarm } from './dist/scheduler/schedule-alarm.js';
