/**
 * Safe logger that only outputs in development.
 * Use instead of console.log/error/warn in production code.
 */

const isDev = process.env.NODE_ENV === "development";

export const logger = {
  log: (...args: unknown[]) => { if (isDev) console.log(...args); },
  warn: (...args: unknown[]) => { if (isDev) console.warn(...args); },
  error: (...args: unknown[]) => { if (isDev) console.error(...args); },
  info: (...args: unknown[]) => { if (isDev) console.info(...args); },
};
