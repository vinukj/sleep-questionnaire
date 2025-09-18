import React, { createContext, useState, useEffect, useContext } from "react";
import { clearUserCache } from "../service/quizCacheService";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const API_URL = "http://localhost:5000";

// Channels for cross-tab communication
const authChannel = new BroadcastChannel('auth_sync');

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
              console.log('Session expired, logging out');
              handleLogout();
              authChannel.postMessage({ type: 'logout' });
            } else {
              setCurrentUser(null);
            }
            return;
          }
          throw new Error("Failed to check session");
        }

        const data = await response.json();
        setCurrentUser(data);
      } catch {
        setCurrentUser(null);
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
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed");

      // fetch profile after successful login
      const profileRes = await fetch(`${API_URL}/auth/profile`, {
        method: "GET",
        credentials: "include",
      });
      const profileData = await profileRes.json();
      setCurrentUser(profileData);
      
      // Broadcast login success to other tabs
      console.log('Broadcasting login message');
      authChannel.postMessage({ 
        type: 'login',
        data: profileData
      });
      
      // Navigate to home page
      window.location.href = '/home';
    } catch (error) {
      console.error("Login error:", error);
      setCurrentUser(null);
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
    try {
      // First inform the server
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error('Logout request failed');
      }

      // Then broadcast to other tabs
      console.log('Broadcasting logout message');
      authChannel.postMessage({ type: 'logout' });
      
      // Finally perform local logout and redirect
      handleLogout();
      
      // Force navigation to login page
      window.location.href = '/login';
      
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if server logout fails, clear local state
      handleLogout();
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  // Verify user's session is still valid
  const verifySession = React.useCallback(async () => {
    try {
      console.log('Verifying session...');
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: "GET",
        credentials: "include",
      });
      
      if (!response.ok) {
        console.log('Session verification failed:', response.status);
        // Always clean up on any non-200 response
        handleLogout();
        logoutChannel.postMessage('logout');
        return false;
      }

      const data = await response.json();
      if (!data || !data.user) {
        console.log('No user data in response');
        handleLogout();
        return false;
      }

      console.log('Session verified successfully');
      setCurrentUser(data);
      return true;
    } catch (error) {
      console.error("Session verification failed:", error);
      handleLogout();
      authChannel.postMessage({ type: 'logout' });
      return false;
    }
  }, []);

  const value = {
    currentUser,
    loading,
    login,
    logout,
    verifySession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
