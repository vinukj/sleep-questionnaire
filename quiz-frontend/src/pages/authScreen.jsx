import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { GoogleLogin } from "@react-oauth/google";
import { clearQuestionnaireCache } from "../service/quizCacheService.js";
import logger from "../utils/logger";
import "../styles/variables.css";
import "../styles/components.css";
import "../styles/AuthScreen.css";

const API_URL = import.meta.env.VITE_API_URL;

// Icons as React components
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);

const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

// Logo component with brain/sleep icon
const Logo = () => (
  <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Brain outline */}
    <path d="M50 15C35 15 25 25 25 40C25 50 30 58 38 62V75C38 80 42 85 50 85C58 85 62 80 62 75V62C70 58 75 50 75 40C75 25 65 15 50 15Z" 
      stroke="#3b82f6" strokeWidth="3" fill="none"/>
    {/* Brain details */}
    <path d="M40 35C40 35 45 30 50 35C55 40 60 35 60 35" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
    <path d="M35 45C35 45 42 40 50 45C58 50 65 45 65 45" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
    {/* Zzz sleep symbols */}
    <text x="68" y="20" fill="#3b82f6" fontSize="10" fontWeight="bold">z</text>
    <text x="75" y="15" fill="#3b82f6" fontSize="8" fontWeight="bold">z</text>
    <text x="80" y="10" fill="#60a5fa" fontSize="6" fontWeight="bold">z</text>
  </svg>
);

export default function AuthScreen() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [localError, setLocalError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();

  const { currentUser, login, error: contextError, verifySession } = useAuth();

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDarkMode(shouldBeDark);
    document.documentElement.setAttribute('data-theme', shouldBeDark ? 'dark' : 'light');
  }, []);

  // Toggle dark mode
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  useEffect(() => {
    if (currentUser) {
      navigate("/home", { replace: true });
      logger.info("User is already logged in:", currentUser);
    }
  }, [currentUser, navigate]);

  const handleGoogleSuccess = async (credentialResponse) => {
    logger.debug("Google credential response:", credentialResponse);
    try {
      const googleToken = credentialResponse?.credential;
      if (!googleToken) {
        setLocalError("No credential returned by Google");
        return;
      }

      setIsLoading(true);
      const response = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: googleToken }),
        credentials: "include",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const msg = data.error || data.message || `Google login failed (${response.status})`;
        console.error("Google login failed response:", data);
        setLocalError(msg);
        return;
      }

      const { accessToken, refreshToken } = data;
      if (!accessToken || !refreshToken) {
        logger.warn('Google login did not return tokens:', data);
      }

      try {
        localStorage.setItem('auth_tokens', JSON.stringify({ accessToken, refreshToken }));
        clearQuestionnaireCache(currentUser?.user?.id || currentUser?.id);
      } catch (e) {
        logger.warn('Failed to store auth tokens in localStorage:', e);
      }

      try {
        await verifySession();
        logger.debug(currentUser);
        clearQuestionnaireCache(currentUser?.user?.id || currentUser?.id);
      } catch (e) {
        logger.warn('verifySession after Google login failed:', e);
      }

      navigate("/home", { replace: true });
    } catch (error) {
      console.error("Google login error:", error);
      setLocalError(error.message || "Google login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError("");
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setLocalError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLocalError("");
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Signup failed");
      await login(email, password);
    } catch (err) {
      setLocalError(err.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || contextError;

  return (
    <div className="auth-page">
      {/* Theme Toggle Button */}
      <button 
        className="theme-toggle btn--icon" 
        onClick={toggleTheme}
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? <SunIcon /> : <MoonIcon />}
      </button>

      <main className="auth-main">
        <div className="auth-card card">
          {/* Logo and Brand */}
          <div className="auth-logo">
            <Logo />
            <div className="auth-brand">
              Sleep<span className="auth-brand-accent">Maitrix</span>
            </div>
          </div>

          {/* Subtitle */}
          <p className="auth-subtitle">
            {isLoginView 
              ? "Login to access your sleep analysis dashboard" 
              : "Create an account to get started"}
          </p>

          {/* Error Alert */}
          {displayError && (
            <div className="alert alert--error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {displayError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={isLoginView ? handleLogin : handleSignup} className="auth-form">
            {/* Name field (signup only) */}
            {!isLoginView && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-wrapper">
                  <UserIcon />
                  <input
                    type="text"
                    className="input input--with-icon"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-wrapper">
                <MailIcon />
                <input
                  type="email"
                  className="input input--with-icon"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <LockIcon />
                <input
                  type="password"
                  className="input input--with-icon"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password (login only) */}
            {isLoginView && (
              <div className="auth-options">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    className="checkbox__input"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkbox__box"></span>
                  <span className="checkbox__label">Remember me</span>
                </label>
                <a href="#" className="link auth-forgot-link">Forgot Password?</a>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn btn--primary auth-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="spinner"></span>
              ) : (
                isLoginView ? "Login" : "Sign Up"
              )}
            </button>

            {/* Divider */}
            <div className="divider">or</div>

            {/* Google Login */}
            {/* <div className="auth-google">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setLocalError("Google login failed")}
                disabled={isLoading}
                theme={isDarkMode ? "filled_black" : "outline"}
                size="large"
                width="100%"
              />
            </div> */}

            {/* Toggle View */}
            <div className="auth-toggle">
              {isLoginView ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                className="link auth-toggle-btn"
                onClick={() => {
                  setIsLoginView(!isLoginView);
                  setLocalError("");
                }}
              >
                {isLoginView ? "Request Access" : "Login"}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="auth-footer">
        <div className="auth-footer-content">
          <span>&copy; 2024 SleepMaitrix</span>
          <a href="#" className="auth-footer-link">Privacy</a>
          <a href="#" className="auth-footer-link">Terms</a>
          <a href="#" className="auth-footer-link">Help</a>
        </div>
      </footer>
    </div>
  );
}
