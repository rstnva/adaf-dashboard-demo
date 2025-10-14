export interface LoggerOptions {
  readonly service: string;
  readonly level?: LogLevel;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface StructuredLog {
  readonly level: LogLevel;
  readonly timestamp: string;
  readonly service: string;
  readonly message: string;
  readonly context?: Record<string, unknown>;
}

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export function createLogger(options: LoggerOptions): Logger {
  const threshold = options.level ?? 'info';

  const log = (
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ) => {
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[threshold]) {
      return;
    }
    const entry: StructuredLog = {
      level,
      timestamp: new Date().toISOString(),
      service: options.service,
      message,
      context,
    };
    if (level === 'error') {
      console.error(JSON.stringify(entry));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  };

  return {
    debug: (message, context) => log('debug', message, context),
    info: (message, context) => log('info', message, context),
    warn: (message, context) => log('warn', message, context),
    error: (message, context) => log('error', message, context),
  };
}
