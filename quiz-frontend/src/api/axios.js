import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL =  import.meta.env.VITE_API_URL 

const navigate = useNavigate();
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check for 401 error and ensure it's not a retry request
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark request to prevent looping
      
      // ✅ CRITICAL FIX: If the failed request was already for a refresh token, give up.
      if (originalRequest.url === '/auth/refresh-token') {
        console.error("Refresh token is invalid or expired. Redirecting to login.");
        navigate('/login'); // Use your routing method here
        return Promise.reject(error);
      }
      
      try {
        // Attempt to get a new access token
        await api.post('/auth/refresh-token');
        console.log('Access token refreshed successfully.');
        
        // Retry the original request
        return api(originalRequest);

      } catch (refreshError) {
        console.error('Unable to refresh token:', refreshError);
        navigate('/login');
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;