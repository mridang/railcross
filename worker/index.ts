/// <reference types="@cloudflare/workers-types" />

export { SchedulerDurableObject } from './scheduler';

interface Env {
  SCHEDULER: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/do\/(\d+)\/(\d+)\/(.+)$/);

    if (!match) {
      return new Response('Not Found', { status: 404 });
    }

    const [, installationId, repoId, action] = match;
    const id = env.SCHEDULER.idFromName(`${installationId}.${repoId}`);
    const stub = env.SCHEDULER.get(id);

    const doUrl = new URL(request.url);
    doUrl.pathname = `/${action}`;

    return stub.fetch(
      new Request(doUrl.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body,
      }),
    );
  },
};
