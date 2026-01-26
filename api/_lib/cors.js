// Shared CORS configuration for all API endpoints
// This prevents code duplication across serverless functions

/**
 * Sets standard CORS headers on a response
 * @param {Object} res - The response object
 */
export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Handles OPTIONS preflight requests
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {boolean} True if this was an OPTIONS request (handled), false otherwise
 */
export function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.status(200).end();
    return true;
  }
  return false;
}
