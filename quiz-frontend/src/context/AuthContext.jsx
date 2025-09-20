import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { clearUserCache } from "../service/quizCacheService";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const API_URL =  import.meta.env.VITE_API_URL||"http://localhost:5000";

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
      // Validate inputs
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      console.log('Attempting login to:', `${API_URL}/auth/login`);
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response JSON:', parseError);
        throw new Error("Server response was invalid. Please check if the server is running.");
      }

      if (!response.ok) {
        const errorMessage = data?.error || `Login failed with status ${response.status}`;
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      // fetch profile after successful login
      console.log('Login successful, fetching profile...');
      const profileRes = await fetch(`${API_URL}/auth/profile`, {
        method: "GET",
        credentials: "include",
      });
      
      if (!profileRes.ok) {
        throw new Error("Failed to fetch user profile after login");
      }

      const profileData = await profileRes.json();
      setCurrentUser(profileData);
      
      // Broadcast login success to other tabs
      authChannel.postMessage({ 
        type: 'login',
        data: profileData
      });
      
      console.log('Login completed successfully');
      
      // Use router navigation instead of hard reload
      navigate('/home', { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      setCurrentUser(null);
      
      // Handle specific error types
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError(`🔌 Cannot connect to server at ${API_URL}. Please start the backend server by running 'npm run dev' in the backend directory.`);
      } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        setError(`🌐 Network error: Please check your internet connection and ensure the backend server is running at ${API_URL}`);
      } else {
        setError(error.message || "Login failed");
      }
      
      // Re-throw the error so the calling component can handle it
      throw error;
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
