import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { clearUserCache } from "../service/quizCacheService";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const API_URL =  import.meta.env.VITE_API_URL

// Channels for cross-tab communication
const authChannel = new BroadcastChannel('auth_sync');

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ---------------- CHECK LOGIN STATUS ----------------
  useEffect(() => {
    // Function to handle auth messages from other tabs
    const handleAuthMessage = (event) => {
      console.log('Received auth message:', event.data);
      const { type, data } = event.data;
      
      if (type === 'logout') {
        console.log('Handling logout in other tab');
        handleLogout();
      } else if (type === 'login') {
        console.log('Handling login in other tab');
        setCurrentUser(data);
        // Refresh the page to ensure proper state
        window.location.reload();
      }
    };

    // Listen for auth events from other tabs
    authChannel.addEventListener('message', handleAuthMessage);

    const checkUserSession = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/profile`, {
          method: "GET",
          credentials: "include",
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            const data = await response.json();
            // If the session was explicitly expired (not just missing)
            if (data.sessionExpired) {
              setError("Session expired. Logging out.");
              handleLogout();
              authChannel.postMessage({ type: 'logout' });
            } else {
              setCurrentUser(null);
            }
            return;
          }
          setError("Failed to check session");
          throw new Error("Failed to check session");
        }

        const data = await response.json();
        setCurrentUser(data);
      } catch (err) {
        setCurrentUser(null);
        setError(err.message || "Session check failed");
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();

    // Cleanup broadcast channel listener when component unmounts
    return () => {
      authChannel.removeEventListener('message', handleAuthMessage);
    };
  }, []);

  // ---------------- LOGIN ----------------
  const login = async (email, password) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Login failed");
        throw new Error(data.error || "Login failed");
      }

      // Wait a short time to ensure cookies are set (helps in incognito/Safari)
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Retry profile fetch up to 3 times if it fails
      let profileData = null;
      let success = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const profileRes = await fetch(`${API_URL}/auth/profile`, {
            method: "GET",
            credentials: "include",
          });
          if (profileRes.ok) {
            profileData = await profileRes.json();
            success = true;
            break;
          }
        } catch (e) {
          // ignore and retry
        }
        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      if (!success) {
        setError("Session verification failed after login. Please try again.");
        setCurrentUser(null);
        throw new Error("Session verification failed after login");
      }
      setCurrentUser(profileData);

      // Broadcast login success to other tabs
      authChannel.postMessage({ 
        type: 'login',
        data: profileData
      });

      // Use router navigation instead of hard reload
      navigate('/home', { replace: true });
    } catch (error) {
      setCurrentUser(null);
      setError(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- LOGOUT ----------------
  const handleLogout = () => {
    console.log('Handling logout: clearing state and cache');
    setCurrentUser(null);
    clearUserCache();
    // Clear any other local storage items that might contain user data
    localStorage.removeItem('lastRoute');
    sessionStorage.clear();
  };

  // ---------------- LOGOUT ----------------
  const logout = async () => {
    setLoading(true);
    setError("");
    try {
      // First inform the server
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        setError('Logout request failed');
        throw new Error('Logout request failed');
      }

      // Then broadcast to other tabs
      authChannel.postMessage({ type: 'logout' });
      
      // Finally perform local logout and redirect
      handleLogout();
      
      // Use router navigation instead of hard reload
      navigate('/login', { replace: true });
      
    } catch (error) {
      setError(error.message || "Logout failed");
      // Even if server logout fails, clear local state
      handleLogout();
      navigate('/login', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  // Verify user's session is still valid
  const verifySession = React.useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: "GET",
        credentials: "include",
      });
      
      if (!response.ok) {
        handleLogout();
        authChannel.postMessage({ type: 'logout' });
        setError("Session verification failed");
        return false;
      }

      const data = await response.json();
      if (!data || !data.user) {
        handleLogout();
        setError("No user data in response");
        return false;
      }

      setCurrentUser(data);
      return true;
    } catch (error) {
      handleLogout();
      authChannel.postMessage({ type: 'logout' });
      setError(error.message || "Session verification failed");
      return false;
    }
  }, []);

  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    verifySession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
