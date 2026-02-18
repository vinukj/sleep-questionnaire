
// --- Auth Controller: Keycloak Authentication ---
import express from "express";
import { findUserbyEmail } from "../models/userModel.js";
import dotenv from "dotenv";
import { verifyGoogleToken } from "../config/google.js";
import keycloakService from "../services/keycloakService.js";
dotenv.config();
import pool from "../config/db.js";

// ---------------- SIGNUP ----------------
export const signup = async (req, res) => {
    console.log(`[AUTH] Signup request:`, { method: req.method, path: req.originalUrl });
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // Check if user already exists in Keycloak
        const existingKeycloakUser = await keycloakService.findUserByEmail(email);
        if (existingKeycloakUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Create user in Keycloak with default 'user' role
        const keycloakUser = await keycloakService.createUser(email, password, name, ['user']);

        // Generate unique session token
        const crypto = await import('crypto');
        const sessionToken = crypto.randomBytes(32).toString('hex');

        // Create user in local database
        const localUser = await pool.query(
            'INSERT INTO users (email, name, keycloak_id, role, session_token, session_updated_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING id, email, name, role',
            [email, name || email.split('@')[0], keycloakUser.id, 'user', sessionToken]
        );

        console.log(`[AUTH] User created: ${email}`);
        
        // Auto-login after signup
        const tokens = await keycloakService.loginUser(email, password);
        
        res.status(201).json({ 
            message: "User created successfully",
            user: localUser.rows[0],
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            sessionToken: sessionToken
        });
    } catch (err) {
        console.error('[AUTH] Signup error:', err);
        res.status(500).json({ error: "Failed to create user" });
    }
};

// ---------------- LOGIN (HYBRID MODE) ----------------
export const login = async (req, res) => {
    console.log(`[AUTH] Hybrid login request`, { method: req.method, path: req.originalUrl });
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // Import bcrypt for old password verification
        const bcrypt = await import('bcryptjs');

        // Get user from local DB
        const userResult = await pool.query(
            'SELECT id, email, name, password, keycloak_id, role FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = userResult.rows[0];

        // CASE 1: User already migrated to Keycloak
        if (user.keycloak_id) {
            try {
                // Generate unique session token
                const crypto = await import('crypto');
                const sessionToken = crypto.randomBytes(32).toString('hex');

                // Update user's session token in database (invalidates old sessions)
                await pool.query(
                    'UPDATE users SET session_token = $1, session_updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                    [sessionToken, user.id]
                );

                // Revoke all existing Keycloak sessions
                const revokedCount = await keycloakService.revokeAllUserSessions(user.keycloak_id);
                console.log(`[AUTH] Revoked ${revokedCount} previous session(s) for: ${email}`);

                // Now login and get new tokens
                const tokens = await keycloakService.loginUser(email, password);
                console.log(`[AUTH] Keycloak login successful for: ${email}`);
                
                return res.json({
                    message: "Login successful",
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    sessionToken: sessionToken // Send to client to store in localStorage
                });
            } catch (err) {
                console.error('[AUTH] Keycloak login failed:', err.message);
                return res.status(401).json({ error: "Invalid credentials" });
            }
        }

        // CASE 2: User NOT migrated yet - use old auth + auto-migrate
        if (!user.password) {
            return res.status(401).json({ error: "Please use Google Sign-In or reset your password" });
        }

        // Verify password using bcrypt (old system)
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        console.log(`[AUTH] Old auth successful for ${email}, auto-migrating to Keycloak...`);

        // AUTO-MIGRATE: Create user in Keycloak with their ACTUAL password
        try {
            const keycloakUser = await keycloakService.createUser(
                email,
                password, // Use the actual password they just entered!
                user.name,
                [user.role || 'user']
            );

            // Update local DB with keycloak_id
            await pool.query(
                'UPDATE users SET keycloak_id = $1 WHERE id = $2',
                [keycloakUser.id, user.id]
            );

            console.log(`[AUTH] ✓ User ${email} auto-migrated to Keycloak on login`);

            // Generate unique session token
            const crypto = await import('crypto');
            const sessionToken = crypto.randomBytes(32).toString('hex');

            // Update user's session token in database
            await pool.query(
                'UPDATE users SET session_token = $1, session_updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [sessionToken, user.id]
            );

            // Revoke any existing sessions (shouldn't be any on first migration, but be safe)
            await keycloakService.revokeAllUserSessions(keycloakUser.id);

            // Now login with Keycloak
            const tokens = await keycloakService.loginUser(email, password);

            return res.json({
                message: "Login successful",
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                sessionToken: sessionToken
            });
        } catch (migrateErr) {
            console.error('[AUTH] Auto-migration failed:', migrateErr);
            return res.status(500).json({ 
                error: "Migration in progress. Please try again in a moment." 
            });
        }

    } catch (err) {
        console.error('[AUTH] Login error:', err);
        res.status(500).json({ error: "Login failed" });
    }
};

// ---------------- LOGOUT ----------------
export const logout = async (req, res) => {
    console.log(`[AUTH] Logout request`, { method: req.method, path: req.originalUrl });
    try {
        const refreshToken = req.body.refreshToken;
        
        if (refreshToken) {
            // Revoke refresh token in Keycloak
            await keycloakService.logoutUser(refreshToken);
        }

        res.json({ 
            message: "Logged out successfully",
            clearCache: true,
            broadcastLogout: true
        });
    } catch (error) {
        console.error('Logout error:', error);
        // Still return success even if logout fails
        res.json({ 
            message: "Logged out successfully",
            clearCache: true,
            broadcastLogout: true
        });
    }
};

// ---------------- GOOGLE LOGIN ----------------
export const googleLogin = async (req, res) => {
    console.log(`[AUTH] Google login request`, { method: req.method, path: req.originalUrl });
    try {
        const token = req.body?.credential || req.body?.id_token || req.body?.token || req.body?.google_token;
        if (!token) {
            console.warn('[AUTH] No Google token provided in request body');
            return res.status(400).json({ error: 'Missing Google token' });
        }

        // Verify the Google token
        let payload;
        try {
            payload = await verifyGoogleToken(token);
        } catch (verifyErr) {
            console.error('Google token verification failed:', verifyErr);
            return res.status(401).json({ error: 'Invalid Google token', details: verifyErr.message });
        }

        // Check if user exists in Keycloak
        let keycloakUser = await keycloakService.findUserByEmail(payload.email);
        
        if (!keycloakUser) {
            // Create user in Keycloak (without password - Google OAuth)
            keycloakUser = await keycloakService.createUser(
                payload.email, 
                null, // No password for Google users
                payload.name, 
                ['user']
            );
        }

        // Find or create user in local database
        let localUser = await findUserbyEmail(payload.email);
        
        if (!localUser) {
            const result = await pool.query(
                'INSERT INTO users (email, name, google_id, picture, keycloak_id, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, name, role',
                [payload.email, payload.name, payload.sub, payload.picture, keycloakUser.id, 'user']
            );
            localUser = result.rows[0];
        } else if (!localUser.keycloak_id) {
            // Update existing user with keycloak_id
            await pool.query(
                'UPDATE users SET keycloak_id = $1, google_id = $2, picture = $3 WHERE id = $4',
                [keycloakUser.id, payload.sub, payload.picture, localUser.id]
            );
        }

        // Revoke all existing sessions for this user before creating new one
        const revokedCount = await keycloakService.revokeAllUserSessions(keycloakUser.id);
        console.log(`[AUTH] Revoked ${revokedCount} previous session(s) for Google user: ${payload.email}`);

        // For Google OAuth, we need to generate a temporary password or use a service account
        // For simplicity, we'll return a message asking user to set password via Keycloak
        // Or implement a custom token exchange flow
        
        console.log(`[AUTH] Google login successful for: ${payload.email}`);
        
        // TODO: Implement proper Google OAuth federation in Keycloak
        // For now, return success but inform that Keycloak setup needed
        res.json({
            message: "Google user verified. Please set up password or use federated login.",
            user: localUser,
            requiresKeycloakSetup: true
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(401).json({ error: error.message || "Google authentication failed" });
    }
};

// ---------------- REFRESH TOKENS ----------------
export const refreshTokens = async (req, res) => {
    console.log(`[AUTH] Refresh token request`, { method: req.method, path: req.originalUrl });
    
    // Try to get refresh token from body first, then from Authorization header
    let refreshToken = req.body.refreshToken;
    
    if (!refreshToken) {
        const authHeader = req.headers["authorization"];
        if (authHeader?.startsWith("Bearer ")) {
            refreshToken = authHeader.split(" ")[1];
        }
    }

    if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token missing" });
    }

    try {
        // Use Keycloak to refresh the token
        const newTokens = await keycloakService.refreshAccessToken(refreshToken);

        console.log(`[AUTH] Token refresh successful`);
        res.json({
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken
        });
    } catch (err) {
        console.error("[AUTH] Refresh token error:", err);
        res.status(401).json({ 
            error: "Invalid or expired refresh token",
            sessionExpired: true
        });
    }
};

// ---------------- GET PROFILE ----------------
export const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    res.json({
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture,
      role: req.user.role,
      isAdmin: req.user.role === 'admin'
    });
  } catch (err) {
    console.error('[AUTH] Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// ---------------- ADMIN: UPDATE USER ROLE ----------------
export const updateUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ error: 'User ID and role are required' });
    }

    // Validate role
    const validRoles = ['user', 'physician', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be: user, physician, or admin' });
    }

    // Get user from local database
    const userResult = await pool.query(
      'SELECT id, email, name, role, keycloak_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Update role in Keycloak
    if (user.keycloak_id) {
      await keycloakService.updateUserRoles(user.keycloak_id, [role]);
    }

    // Update role in local database
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, name, role',
      [role, userId]
    );

    console.log(`[AUTH] Admin ${req.user.email} updated user ${result.rows[0].email} role to ${role}`);

    res.json({
      message: 'User role updated successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('[AUTH] Update user role error:', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

// ---------------- ADMIN: GET ALL USERS ----------------
export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, keycloak_id, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      users: result.rows
    });
  } catch (err) {
    console.error('[AUTH] Get all users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// ---------------- DEBUG ENDPOINTS ----------------
export const forceExpireAccess = async (req, res) => {
  return res.status(401).json({ accessExpired: true });
};

export const forceExpireRefresh = async (req, res) => {
  return res.status(401).json({ sessionExpired: true });
};
