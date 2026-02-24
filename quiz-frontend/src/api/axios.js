import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Create a custom event for handling auth redirects
const authEvents = new EventTarget();
export const AUTH_EVENTS = {
  UNAUTHORIZED: 'unauthorized',
  TOKEN_EXPIRED: 'token_expired'
};

// Helper to get tokens from localStorage
const getStoredTokens = () => {
  try {
    const tokens = JSON.parse(localStorage.getItem("auth_tokens"));
    return tokens || { accessToken: null, refreshToken: null, sessionToken: null };
  } catch {
    return { accessToken: null, refreshToken: null, sessionToken: null };
  }
};

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// REQUEST interceptor: Inject tokens automatically on every request
api.interceptors.request.use(
  (config) => {
    const tokens = getStoredTokens();
    
    // Add Authorization header if access token exists
    if (tokens.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    
    // Add session token header if it exists
    if (tokens.sessionToken) {
      config.headers['X-Session-Token'] = tokens.sessionToken;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// RESPONSE interceptor: Handle 401 errors and refresh tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check for 401 error and ensure it's not a retry request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark request to prevent looping
      
      // If the failed request was already for a refresh token, give up
      if (originalRequest.url === '/auth/refresh') {
        console.error("Refresh token is invalid or expired.");
        // Dispatch token expired event
        authEvents.dispatchEvent(new Event(AUTH_EVENTS.TOKEN_EXPIRED));
        return Promise.reject(error);
      }
      
      try {
        const tokens = getStoredTokens();
        
        if (!tokens.refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Attempt to get a new access token using correct endpoint
        const response = await api.post('/auth/refresh', {
          refreshToken: tokens.refreshToken,
          sessionToken: tokens.sessionToken
        }, {
          headers: {
            'Authorization': `Bearer ${tokens.refreshToken}`,
            'X-Session-Token': tokens.sessionToken,
          }
        });
        
        // Update stored tokens
        if (response.data?.accessToken && response.data?.refreshToken) {
          const newTokens = {
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            sessionToken: response.data.sessionToken || tokens.sessionToken
          };
          localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
        }
        
        console.log('Access token refreshed successfully.');
        
        // Retry the original request with new token
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Unable to refresh token:', refreshError);
        // Dispatch unauthorized event
        authEvents.dispatchEvent(new Event(AUTH_EVENTS.UNAUTHORIZED));
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;