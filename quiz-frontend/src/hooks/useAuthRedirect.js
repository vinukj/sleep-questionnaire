import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AUTH_EVENTS } from '../api/axios';

export const useAuthRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleUnauthorized = () => {
      navigate('/login');
    };

    const handleTokenExpired = () => {
      navigate('/login');
    };

    // Add event listeners
    window.addEventListener(AUTH_EVENTS.UNAUTHORIZED, handleUnauthorized);
    window.addEventListener(AUTH_EVENTS.TOKEN_EXPIRED, handleTokenExpired);

    // Cleanup
    return () => {
      window.removeEventListener(AUTH_EVENTS.UNAUTHORIZED, handleUnauthorized);
      window.removeEventListener(AUTH_EVENTS.TOKEN_EXPIRED, handleTokenExpired);
    };
  }, [navigate]);
};