import { NestFactory } from '@nestjs/core';
import { AppModule } from './dist/app.module.js';
import SchedulerService from './dist/services/railcross/scheduler.service.js';
import { configure } from '@mridang/nestjs-defaults';
import { httpServerHandler } from 'cloudflare:node';

// Boot once at top level; configure() (winston logger + middleware) runs AFTER
// listen so winston never writes during the forbidden global scope.
const app = await NestFactory.create(AppModule, {
  rawBody: true,
  logger: false,
});
await app.listen(3000);
configure(app);

const http = httpServerHandler({ port: 3000 });

export default {
  fetch: http.fetch,
  // Daily cron: re-arm every schedule's Durable Object alarm from KV so alarms
  // always reflect the current configuration.
  scheduled(event, env, ctx) {
    ctx.waitUntil(app.get(SchedulerService).reRegisterAll());
  },
};

export { ScheduleAlarm } from './dist/scheduler/schedule-alarm.js';
