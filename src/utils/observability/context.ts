/**
 * @file Best-effort application context attached to the Workers invocation span for error reporting.
 *
 * Cloudflare shows the attributes set on the invocation's root span next to an
 * error, so an error can say who and what it affected. Everything here is best
 * effort: where there is no Workers runtime (plain Node, tests) or no active
 * span, it does nothing, and it never throws.
 *
 * Only plain facts go in: a webhook event name, a delivery id, numeric GitHub
 * ids, a fixed job name. Never a payload, a signature, a token, an installation
 * token, repository contents, an email address or a name.
 * @packageDocumentation
 */

/** What a span attribute may hold. */
type ContextValue = string | number | boolean;

/** Attributes to set; those left undefined are dropped. */
export type ContextAttributes = Readonly<
  Record<string, ContextValue | undefined>
>;

/** The part of a Workers span this file uses. */
interface ContextSpan {
  setAttribute(key: string, value: ContextValue): unknown;
  recordException(exception: { name: string; message: string }): unknown;
}

/** The part of `tracing` from `cloudflare:workers` this file uses. */
interface ContextTracing {
  getActiveSpan(): ContextSpan | undefined;
}

/**
 * Picks the tracing API out of a loaded `cloudflare:workers` module.
 * @param workers - The loaded module.
 * @returns The tracing API, or `undefined` when the module has none.
 */
function tracingOf(workers: object): ContextTracing | undefined {
  const tracing: unknown = Reflect.get(workers, 'tracing');
  if (typeof tracing !== 'object' || tracing === null) {
    return undefined;
  }
  return 'getActiveSpan' in tracing &&
    typeof tracing.getActiveSpan === 'function'
    ? (tracing as ContextTracing)
    : undefined;
}

/** Longest text kept in one attribute; the rest is cut off. */
const MAX_TEXT = 256;

/** The tracing API once loaded; `null` where there is none. */
let loaded: ContextTracing | null | undefined;

/**
 * Loads `cloudflare:workers` and remembers the tracing API it exposes.
 *
 * Only the loaded module is remembered, never the promise: a promise started in
 * one request must not be waited on in another, which the Workers runtime may
 * never settle. The module is lazy because it exists only in the Workers
 * runtime, and a failure is remembered. Wrangler's bundler treats `cloudflare:*`
 * as external, so it survives bundling as is. The types do not declare
 * `getActiveSpan`, hence the cast.
 * @returns A promise for the tracing API, or `null` when the runtime has none. It never rejects.
 * @example
 * ```ts
 * const tracing = await load();
 * tracing?.getActiveSpan();
 * ```
 */
function load(): Promise<ContextTracing | null | undefined> {
  return import('cloudflare:workers')
    .then((workers) => (loaded = tracingOf(workers)))
    .catch(() => (loaded = null));
}

/**
 * Runs `apply` on the invocation's root span, if there is one.
 *
 * Once the runtime module has loaded this happens at once, before the call
 * returns, so that context set in a handler that does not wait is still on the
 * span when the invocation ends. Never rejects.
 * @param apply - The callback that writes to the span.
 * @returns A promise that resolves once `apply` has run, or been skipped.
 * @example
 * ```ts
 * await withActiveSpan((span) => span.setAttribute('job.name', 'schedule.reregister'));
 * ```
 */
function withActiveSpan(apply: (span: ContextSpan) => void): Promise<void> {
  const run = (tracing: ContextTracing | null | undefined): void => {
    try {
      const span = tracing?.getActiveSpan();
      if (span) {
        apply(span);
      }
    } catch {
      // Context is a convenience: it must never fail a request.
    }
  };
  if (loaded !== undefined) {
    run(loaded);
    return Promise.resolve();
  }
  return load()
    .then(run)
    .catch(() => undefined);
}

/**
 * Selects the attributes worth keeping and trims long text.
 *
 * Undefined values, non-finite numbers and other kinds of value are dropped.
 * @param attributes - The attributes the caller wants to attach.
 * @returns The kept attributes as key and value pairs, with text cut to the maximum length.
 * @example
 * ```ts
 * accepted({ 'webhook.event': 'push', 'github.repository_id': undefined });
 * // [['webhook.event', 'push']]
 * ```
 */
function accepted(attributes: ContextAttributes): [string, ContextValue][] {
  const kept: [string, ContextValue][] = [];
  for (const [key, value] of Object.entries(attributes)) {
    if (typeof value === 'string') {
      kept.push([key, value.slice(0, MAX_TEXT)]);
    } else if (
      typeof value === 'boolean' ||
      (typeof value === 'number' && Number.isFinite(value))
    ) {
      kept.push([key, value]);
    } else {
      // Undefined, non-finite numbers and other kinds of value are dropped.
    }
  }
  return kept;
}

/**
 * Attaches attributes to the current invocation so an error in it shows them.
 *
 * Safe to call anywhere, any number of times: a later call for the same key
 * replaces the earlier value. The first call has to load the runtime module, so
 * where the caller is async it should wait for the result. The returned promise
 * never rejects.
 * @param attributes - The attributes to set on the root span.
 * @returns A promise that resolves once the attributes are set, or skipped.
 * @example
 * ```ts
 * await setErrorContext({ 'webhook.event': 'push', 'github.installation_id': 42 });
 * ```
 */
export function setErrorContext(attributes: ContextAttributes): Promise<void> {
  try {
    const kept = accepted(attributes);
    if (kept.length === 0) {
      return Promise.resolve();
    }
    return withActiveSpan((span) => {
      for (const [key, value] of kept) {
        span.setAttribute(key, value);
      }
    });
  } catch {
    return Promise.resolve();
  }
}

/**
 * Records an error on the current invocation's span so Issues groups it by `name`.
 *
 * Only the two fixed words are sent, never text that came from a request, a
 * person or a provider.
 * @param name - The error name that Issues groups by, such as "ScheduleError".
 * @param message - A fixed description of the error.
 * @returns A promise that resolves once the exception is recorded, or skipped.
 * @example
 * ```ts
 * await recordErrorOnSpan('ScheduleError', 'Alarm could not be armed');
 * ```
 */
export function recordErrorOnSpan(
  name: string,
  message: string,
): Promise<void> {
  return withActiveSpan((span) =>
    span.recordException({
      name: name.slice(0, MAX_TEXT),
      message: message.slice(0, MAX_TEXT),
    }),
  );
}
