/**
 * Structured logging utility for API endpoints
 * Provides consistent logging format across all serverless functions
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

/**
 * Formats log message with timestamp and level
 */
function formatLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const logObject = {
    timestamp,
    level,
    message,
    ...meta
  };

  return JSON.stringify(logObject);
}

/**
 * Log an error
 * @param {string} message - Error message
 * @param {Error|Object} error - Error object or metadata
 */
export function logError(message, error = {}) {
  const meta = error instanceof Error
    ? { error: error.message, stack: error.stack }
    : error;

  console.error(formatLog(LOG_LEVELS.ERROR, message, meta));
}

/**
 * Log a warning
 * @param {string} message - Warning message
 * @param {Object} meta - Additional metadata
 */
export function logWarn(message, meta = {}) {
  console.warn(formatLog(LOG_LEVELS.WARN, message, meta));
}

/**
 * Log info
 * @param {string} message - Info message
 * @param {Object} meta - Additional metadata
 */
export function logInfo(message, meta = {}) {
  console.log(formatLog(LOG_LEVELS.INFO, message, meta));
}

/**
 * Log debug info (only in development)
 * @param {string} message - Debug message
 * @param {Object} meta - Additional metadata
 */
export function logDebug(message, meta = {}) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(formatLog(LOG_LEVELS.DEBUG, message, meta));
  }
}

/**
 * Create a request logger with context
 * @param {Object} req - Request object
 * @returns {Object} Logger instance with request context
 */
export function createRequestLogger(req) {
  const requestId = req.headers['x-vercel-id'] || 'local';
  const requestMeta = {
    requestId,
    method: req.method,
    path: req.url
  };

  return {
    error: (message, error) => logError(message, { ...requestMeta, ...error }),
    warn: (message, meta) => logWarn(message, { ...requestMeta, ...meta }),
    info: (message, meta) => logInfo(message, { ...requestMeta, ...meta }),
    debug: (message, meta) => logDebug(message, { ...requestMeta, ...meta })
  };
}
