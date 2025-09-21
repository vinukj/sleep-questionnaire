import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { GoogleLogin } from "@react-oauth/google";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";

const API_URL =  import.meta.env.VITE_API_URL

export default function AuthScreen() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { currentUser, login, error: contextError } = useAuth();

  useEffect(() => {
    if (currentUser) {
      navigate("/home", { replace: true });
    }
  }, [currentUser, navigate]);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLocalError("");
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Google login failed");
      window.location.href = "/home";
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError("");
    try {
      await login(email, password);
    } catch (err) {
      setLocalError(err.message || "Login failed");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLocalError("");
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
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={6} sx={{ p: 4, mt: 8, borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom align="center" fontWeight={600}>
          {isLoginView ? "Login" : "Sign Up"}
        </Typography>

        {/* Google Login */}
        <Box display="flex" justifyContent="center" mb={2}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setLocalError("Google login failed")}
            disabled={isLoading}
          />
        </Box>

        <Divider sx={{ my: 2 }}>or</Divider>

        <Box component="form" onSubmit={isLoginView ? handleLogin : handleSignup}>
          {!isLoginView && (
            <TextField
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              margin="normal"
              required
            />
          )}

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            required
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
          />

          {localError || contextError ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {localError || contextError}
            </Alert>
          ) : null}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3, py: 1.2, borderRadius: 2 }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : isLoginView ? "Login" : "Sign Up"}
          </Button>
        </Box>

        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          {isLoginView ? "Need an account?" : "Already have an account?"}{" "}
          <Button
            variant="text"
            onClick={() => setIsLoginView(!isLoginView)}
            sx={{ textTransform: "none" }}
          >
            {isLoginView ? "Sign Up" : "Login"}
          </Button>
        </Typography>
      </Paper>
    </Container>
  );
}
