import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";

// ---------------- VERIFY SESSION ----------------
// Checks if the current access token is valid by calling /auth/profile
// (moved to correct place below)
import {
  clearUserCache,
  clearQuestionnaireCache,
} from "../service/quizCacheService";

const AuthContext = createContext(null);

// Export the context for components that need direct access
export { AuthContext };

// Exported hook - keep as a stable named export for Fast Refresh
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

const API_URL = import.meta.env.VITE_API_URL;

// Channels for cross-tab communication
const authChannel = new BroadcastChannel("auth_sync");

// Deduplicate refresh calls across concurrent requests
let refreshRequestPromise = null;

// Token management using localStorage so tokens are visible across tabs
const getStoredTokens = () => {
  try {
    const tokens = JSON.parse(localStorage.getItem("auth_tokens"));
    
    return tokens || { accessToken: null, refreshToken: null };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
};

const setStoredTokens = (tokens) => {
  if (tokens) {
    localStorage.setItem("auth_tokens", JSON.stringify(tokens));
  } else {
    localStorage.removeItem("auth_tokens");
  }
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [authReady, setAuthReady] = useState(false);

  // ---------------- HANDLE LOGOUT ----------------
  const handleLogout = useCallback(() => {
    // Clear auth-related state (do not clear entire sessionStorage/localStorage)
    // Clear per-user caches if present
    try {
      const storedUser = currentUser?.user?.id || currentUser?.id;
      if (storedUser) {
        clearUserCache(storedUser);
        clearQuestionnaireCache(storedUser);
      }
    } catch (e) {
      console.warn("Failed to clear caches during logout handler:", e);
    }

    setCurrentUser(null);
    setStoredTokens(null);
    localStorage.removeItem("lastRoute");
    // mark auth as ready (we know user is logged out) and stop loading
    setAuthReady(true);
    setLoading(false);
  }, [currentUser?.user?.id, currentUser?.id]);

  // ---------------- LOGIN ----------------
  const login = async (email, password) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Login failed");
      }

      const data = await res.json();
      const newTokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };

      // Store tokens
      setStoredTokens(newTokens);

      // Fetch profile with new access token
      const profileRes = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${newTokens.accessToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!profileRes.ok) {
        throw new Error("Failed to fetch profile");
      }

      const profileData = await profileRes.json();
      console.log("Fetched profile data:", profileData);

      // Set user data first
      setCurrentUser(profileData);
      setAuthReady(true);
      setLoading(false); // Set loading to false before navigation

      // Broadcast login to other tabs (include tokens and user)
      authChannel.postMessage({
        type: "login",
        data: { user: profileData, tokens: newTokens },
      });

      // Navigate to intended destination or home
      const intendedPath = sessionStorage.getItem("intendedPath") || "/home";
      sessionStorage.removeItem("intendedPath");
      navigate(intendedPath, { replace: true });
    } catch (err) {
      handleLogout();
      setError(err.message || "Login failed");
      setLoading(false);
    }
  };

  // ---------------- LOGOUT ----------------
  const logout = async () => {
    setLoading(true);
    setError("");
    try {
      const currentTokens = getStoredTokens();
      if (currentTokens.accessToken) {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${currentTokens.accessToken}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
      }

      // Broadcast to other tabs
      authChannel.postMessage({ type: "logout" });

      // clear cache for current user if known
      try {
        const storedUser = currentUser?.user?.id || currentUser?.id;
        
        if (storedUser) {
          clearUserCache(storedUser);
          clearQuestionnaireCache(storedUser);
        }
      } catch (e) {
        console.warn("Could not clear user cache on logout:", e);
      }

      handleLogout();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
      handleLogout();
      setError(err.message || "Logout failed");
      navigate("/login", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  // ---------------- REFRESH TOKEN ----------------
  const refreshTokens = useCallback(async () => {
    if (refreshRequestPromise) {
      try {
        return await refreshRequestPromise;
      } catch (err) {
        console.error("Token refresh waiter failed:", err);
        return false;
      }
    }

    const queuedRefresh = async () => {
      const startingTokens = getStoredTokens();
      if (!startingTokens.refreshToken) {
        console.warn('No refresh token available');
        return false;
      }

      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${startingTokens.refreshToken}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!res.ok) {
          // Try to read JSON response first to check for sessionExpired flag
          const errorData = await res.json().catch(() => null);
          if (errorData?.sessionExpired) {
            handleLogout();
            return false;
          }

          if (res.status === 401 || res.status === 409) {
            const latestTokens = getStoredTokens();
            if (
              latestTokens.refreshToken &&
              latestTokens.refreshToken !== startingTokens.refreshToken
            ) {
              // Another refresh succeeded while this one was in flight
              return true;
            }
          }

          throw new Error(`Failed to refresh token (status ${res.status})`);
        }

        const data = await res.json();
        if (!data?.accessToken || !data?.refreshToken) {
          throw new Error("Refresh response missing tokens");
        }

        const newTokens = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };

        setStoredTokens(newTokens);

        authChannel.postMessage({
          type: "login",
          data: { tokens: newTokens },
        });

        return true;
      } catch (err) {
        console.error("Token refresh failed:", err);

        const latestTokens = getStoredTokens();
        if (
          latestTokens.refreshToken &&
          latestTokens.refreshToken !== startingTokens.refreshToken &&
          latestTokens.accessToken &&
          latestTokens.accessToken !== startingTokens.accessToken
        ) {
          // Another refresh already populated newer tokens
          return true;
        }

        handleLogout();
        return false;
      } finally {
        refreshRequestPromise = null;
      }
    };

    refreshRequestPromise = queuedRefresh();
    return refreshRequestPromise;
  }, [handleLogout]);

  // ---------------- CHECK LOGIN STATUS ----------------
  const checkUserSession = useCallback(async () => {
    try {
      const storedTokens = getStoredTokens();
      if (!storedTokens.accessToken) {
        // No token: user is not logged in. Mark auth as ready and stop loading.
        setAuthReady(true);
        setLoading(false);
        return;
      }

      // Try to use current access token
      let res = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${storedTokens.accessToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      // If token expired, try to refresh
      if (res.status === 401 && storedTokens.refreshToken) {
        const refreshed = await refreshTokens();
        if (!refreshed) {
          throw new Error("Failed to refresh session");
        }

        // Retry with new access token
        res = await fetch(`${API_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${getStoredTokens().accessToken}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
      }

      if (!res.ok) {
        throw new Error("Failed to verify session");
      }

      const data = await res.json();
      setCurrentUser(data);
    } catch (err) {
      console.error("Session check failed:", err);
      handleLogout();
    } finally {
      setAuthReady(true);
      setLoading(false);
    }
  }, [handleLogout, refreshTokens]);

  useEffect(() => {
    // Listen for auth events from other tabs
    const handleAuthMessage = (event) => {
      const { type, data } = event.data;
      if (type === "logout") {
        handleLogout();
      }

      if (type === "login") {
        // Expecting { user, tokens } from the broadcasting tab
        const incomingUser = data?.user;
        const incomingTokens = data?.tokens;
        if (incomingTokens) {
          setStoredTokens(incomingTokens);
        } else {
          // If no tokens provided, ignore the login broadcast to avoid mixing users without tokens
          console.warn(
            "Received login broadcast without tokens — ignoring to avoid inconsistent auth state"
          );
          return;
        }

        if (incomingUser) {
          setCurrentUser(incomingUser);
        }
        setAuthReady(true);
        setLoading(false);
      }
    };
    authChannel.addEventListener("message", handleAuthMessage);

    // Storage event for cross-tab sync (covers new tabs and tabs without BroadcastChannel support)
    const handleStorage = (e) => {
      if (e.key === "auth_tokens") {
        // If tokens were added in another tab, re-run session check
        console.log("storage event: auth_tokens changed, re-checking session");
        checkUserSession();
      }
    };
    window.addEventListener("storage", handleStorage);

    // Run initial session check
    checkUserSession();

    return () => {
      authChannel.removeEventListener("message", handleAuthMessage);
      window.removeEventListener("storage", handleStorage);
    };
  }, [checkUserSession, handleLogout]);

  const authFetch = async (url, options = {}, retry = true) => {
    const currentTokens = getStoredTokens();
    if (!currentTokens.accessToken) throw new Error("Not authenticated");

    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${currentTokens.accessToken}`,
      "Content-Type": "application/json",
    };

    const res = await fetch(`${API_URL}${url}`, {
      ...options,
      headers,
      credentials: "include",
    });

    // Try to read response body to check for accessExpired flag
    const clone = res.clone();
    let body = null;
    try { body = await clone.json(); } catch {}
    
    if (body?.accessExpired === true && retry) {
      const refreshed = await refreshTokens();
      if (refreshed) return authFetch(url, options, false);
      handleLogout();
      navigate("/login", { replace: true });
    }

    if ((res.status === 403 || res.status === 401) && retry) {
      const refreshed = await refreshTokens();
      if (refreshed) return authFetch(url, options, false);
      handleLogout();
      navigate("/login", { replace: true });
    }

    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        authReady,
        error,
        login,
        logout,
        authFetch,
        refreshTokens,
        verifySession: checkUserSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
