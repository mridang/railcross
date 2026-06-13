/**
 * Test stub for the `cloudflare:workers` runtime module, which only exists
 * inside the Workers runtime. It provides an in-memory KV namespace and a
 * no-op Durable Object namespace so code that touches the schedule bindings
 * runs under Jest without a live Worker.
 */

const kvStore = new Map<string, string>();

const SCHEDULES = {
  async get(key: string, type?: string): Promise<unknown> {
    const value = kvStore.get(key);
    if (value === undefined) {
      return null;
    }
    return type === 'json' ? JSON.parse(value) : value;
  },
  async put(key: string, value: string): Promise<void> {
    kvStore.set(key, value);
  },
  async delete(key: string): Promise<void> {
    kvStore.delete(key);
  },
  async list({ prefix }: { prefix?: string } = {}): Promise<{
    keys: { name: string }[];
    list_complete: true;
  }> {
    const keys = [...kvStore.keys()]
      .filter((key) => !prefix || key.startsWith(prefix))
      .map((name) => ({ name }));
    return { keys, list_complete: true };
  },
};

const SCHEDULE_ALARMS = {
  idFromName: (name: string) => name,
  get: () => ({
    async arm(): Promise<void> {},
    async disarm(): Promise<void> {},
  }),
};

export const env: Record<string, unknown> = { SCHEDULES, SCHEDULE_ALARMS };

export class DurableObject {
  constructor(
    protected ctx: unknown,
    protected env: unknown,
  ) {}
}
