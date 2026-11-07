import { NestFactory } from '@nestjs/core';
import { CloudflareAdapter } from '@mridang/nestjs-platform-cloudflare';
import { AppModule } from './dist/app.module.js';
import SchedulerService from './dist/services/railcross/scheduler.service.js';
import { configure } from '@mridang/nestjs-defaults';
import * as Sentry from '@sentry/cloudflare';
import { corsOptions } from './dist/utils/cors.js';
import { permissionsPolicy } from './dist/utils/permissions-policy.js';

// Boot once at top level on the fetch-native Cloudflare adapter — no Express,
// no node:http, no port. init() runs first with the no-op logger so Nest's
// route-resolution logging stays silent during the forbidden global scope.
// configure() (the structured BetterLogger + Express-compat middleware) is
// applied AFTER init: the adapter reads its middleware list per-request in
// handle(), so middleware registered post-init still runs.
const adapter = new CloudflareAdapter();
const app = await NestFactory.create(AppModule, adapter, {
  rawBody: true,
  logger: false,
});
await app.init();
configure(app);
// configure() reflects any origin with credentials; replace it with the app's own policy.
app.enableCors(corsOptions);
// The defaults library sends a six-feature Permissions-Policy; send the full one. It is
// mounted last so its header wins.
adapter.useExpressMiddleware(permissionsPolicy);

// Wrap the worker entry with Sentry so both the fetch and the scheduled (cron)
// handlers run inside a request scope: unhandled errors are captured, exceptions
// reported by the app carry context, and traces are linked. Sentry self-disables
// when SENTRY_DSN is unset (`wrangler secret put SENTRY_DSN`).
export default Sentry.withSentry(
  (env) => ({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    release: env.SERVICE_VERSION,
    enabled: Boolean(env.SENTRY_DSN),
    tracesSampleRate: 1.0,
  }),
  {
    fetch: (request) => adapter.handle(request),
    // Daily cron: re-arm every schedule's Durable Object alarm from KV so
    // alarms always reflect the current configuration.
    scheduled(event, env, ctx) {
      ctx.waitUntil(app.get(SchedulerService).reRegisterAll());
    },
  },
);

export { ScheduleAlarm } from './dist/scheduler/schedule-alarm.js';
