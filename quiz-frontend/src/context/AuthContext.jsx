import React, { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const API_URL = "http://localhost:5000";

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---------------- CHECK LOGIN STATUS ----------------
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/profile`, {
          method: "GET",
          credentials: "include",
        });
         if (!response.ok) {
        // silently ignore 401 on first mount
        if (response.status === 401) {
          setCurrentUser(null);
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
    } catch (error) {
      console.error("Login error:", error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- LOGOUT ----------------
  const logout = async () => {
    setLoading(true);
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      setCurrentUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const value = { currentUser, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
