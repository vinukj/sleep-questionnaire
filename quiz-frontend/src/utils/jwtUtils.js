/**
 * JWT Utility Functions
 * Helpers for decoding and checking JWT token expiration
 */

/**
 * Decode a JWT token without verification
 * @param {string} token - The JWT token to decode
 * @returns {object|null} Decoded payload or null if invalid
 */
export const decodeJWT = (token) => {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    // JWT has 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid JWT format');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Base64 decode (handle URL-safe base64)
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

/**
 * Check if a JWT token is expired
 * @param {string} token - The JWT token to check
 * @returns {boolean} True if expired, false if still valid
 */
export const isTokenExpired = (token) => {
  const decoded = decodeJWT(token);
  
  if (!decoded || !decoded.exp) {
    return true; // Treat invalid tokens as expired
  }

  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = decoded.exp * 1000;
  const now = Date.now();
  
  return now >= expirationTime;
};

/**
 * Get seconds until token expires
 * @param {string} token - The JWT token to check
 * @returns {number} Seconds until expiration, or 0 if expired/invalid
 */
export const getSecondsUntilExpiry = (token) => {
  const decoded = decodeJWT(token);
  
  if (!decoded || !decoded.exp) {
    return 0;
  }

  const expirationTime = decoded.exp * 1000;
  const now = Date.now();
  const secondsRemaining = Math.floor((expirationTime - now) / 1000);
  
  return Math.max(0, secondsRemaining);
};

/**
 * Check if token should be refreshed (less than threshold seconds remaining)
 * @param {string} token - The JWT token to check
 * @param {number} thresholdSeconds - Refresh if less than this many seconds remain (default: 120)
 * @returns {boolean} True if should refresh
 */
export const shouldRefreshToken = (token, thresholdSeconds = 120) => {
  const secondsRemaining = getSecondsUntilExpiry(token);
  return secondsRemaining > 0 && secondsRemaining < thresholdSeconds;
};
