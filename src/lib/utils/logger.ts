type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLevel(): number {
  const envLevel =
    typeof process !== 'undefined'
      ? (process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined)
      : undefined;
  return LOG_LEVELS[envLevel ?? 'info'] ?? LOG_LEVELS.info;
}

function formatMessage(
  level: LogLevel,
  message: string,
  context?: LogContext,
): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= getMinLevel();
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message, context));
    }
  },

  info(message: string, context?: LogContext): void {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message, context));
    }
  },

  warn(message: string, context?: LogContext): void {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, context));
    }
  },

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (shouldLog('error')) {
      const errorContext = {
        ...context,
        ...(error instanceof Error
          ? { errorMessage: error.message, stack: error.stack }
          : { error }),
      };
      console.error(formatMessage('error', message, errorContext));
    }
  },
};
