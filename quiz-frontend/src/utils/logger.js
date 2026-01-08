/**
 * Development-only logging utility
 * Logs will only appear in development mode, not in production
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

const logger = {
  /**
   * Log informational messages (only in development)
   */
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log informational messages with a prefix (only in development)
   */
  info: (...args) => {
    if (isDevelopment) {
      console.info('ℹ️', ...args);
    }
  },

  /**
   * Log warning messages (only in development)
   */
  warn: (...args) => {
    if (isDevelopment) {
      console.warn('⚠️', ...args);
    }
  },

  /**
   * Log error messages (always logged, even in production)
   */
  error: (...args) => {
    console.error('❌', ...args);
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.debug('🐛', ...args);
    }
  },

  /**
   * Log success messages (only in development)
   */
  success: (...args) => {
    if (isDevelopment) {
      console.log('✅', ...args);
    }
  },

  /**
   * Group logs together (only in development)
   */
  group: (label, callback) => {
    if (isDevelopment) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  },

  /**
   * Log a table (only in development)
   */
  table: (data) => {
    if (isDevelopment) {
      console.table(data);
    }
  }
};

export default logger;
