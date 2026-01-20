/**
 * Centralized logging utility
 * Only logs in development environment to reduce production bundle size
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Log debug information (only in development)
 */
export function debug(...args: unknown[]): void {
  if (isDevelopment) {
    console.log('[DEBUG]', ...args);
  }
}

/**
 * Log informational messages (only in development)
 */
export function info(...args: unknown[]): void {
  if (isDevelopment) {
    console.info('[INFO]', ...args);
  }
}

/**
 * Log warnings (only in development)
 */
export function warn(...args: unknown[]): void {
  if (isDevelopment) {
    console.warn('[WARN]', ...args);
  }
}

/**
 * Log errors (always logged)
 */
export function error(...args: unknown[]): void {
  console.error('[ERROR]', ...args);
}

/**
 * Create a context-specific logger
 * Useful for logging with consistent prefixes
 */
export function createLogger(context: string) {
  return {
    debug: (...args: unknown[]) => debug(`[${context}]`, ...args),
    info: (...args: unknown[]) => info(`[${context}]`, ...args),
    warn: (...args: unknown[]) => warn(`[${context}]`, ...args),
    error: (...args: unknown[]) => error(`[${context}]`, ...args),
  };
}

// Named exports for convenience
export const logger = {
  debug,
  info,
  warn,
  error,
  createLogger,
};
