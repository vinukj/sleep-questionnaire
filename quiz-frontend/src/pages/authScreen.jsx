import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AuthScreen.css";
import { useAuth } from "../context/AuthContext.jsx"; // import context

export default function AuthScreen() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const { currentUser, login } = useAuth();

  useEffect(() => {
    if (currentUser) {
      navigate("/home", { replace: true }); // redirect automatically when logged in
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      // no navigate here, context effect handles it
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch("http://localhost:5000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Signup failed");
      // after signup, the server can auto-login, or you can call context login
      await login(email, password);
    } catch (err) {
      setError(err.message || "Signup failed");
    }
  };

  return (
    <div className="auth-safe-area">
      <div className="auth-container">
        {isLoginView ? (
          <>
            <h1 className="auth-title">Login</h1>
            <form onSubmit={handleLogin} className="auth-form">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                required
              />
              <button type="submit" className="auth-submit-button">
                Login
              </button>
            </form>
            <p className="auth-toggle-text">
              Need an account?{" "}
              <button
                onClick={() => setIsLoginView(false)}
                className="auth-toggle-button"
              >
                Sign Up
              </button>
            </p>
          </>
        ) : (
          <>
            <h1 className="auth-title">Sign Up</h1>
            <form onSubmit={handleSignup} className="auth-form">
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="auth-input"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                required
              />
              <button type="submit" className="auth-submit-button">
                Sign Up
              </button>
            </form>
            <p className="auth-toggle-text">
              Already have an account?{" "}
              <button
                onClick={() => setIsLoginView(true)}
                className="auth-toggle-button"
              >
                Login
              </button>
            </p>
          </>
        )}
        {error && <p className="auth-error-message">{error}</p>}
      </div>
    </div>
  );
}
