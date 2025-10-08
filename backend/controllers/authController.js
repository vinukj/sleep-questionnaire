
// --- Auth Controller: Header-based JWT Authentication (No Cookies) ---
import express from "express";
import { createUser, findUserbyEmail, createSession, invalidateAllUserSessions, findOrCreateGoogleUser, findUserById, findSessionByToken } from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import crypto from 'crypto';
import { verifyGoogleToken } from "../config/google.js";
dotenv.config();
import pool from "../config/db.js";

// Token expiry durations
const ACCESS_TOKEN_EXPIRE = '60s'; // Short-lived access token
const REFRESH_TOKEN_EXPIRE = '7d'; // Refresh token lifespan

// ---------------- SIGNUP ----------------
export const signup = async (req, res) => {
    // Signup endpoint: create a new user with hashed password
    console.log(`[AUTH] Signup request:`, { method: req.method, path: req.originalUrl, body: req.body });
    const { email, password } = req.body;
    const existingUser = await findUserbyEmail(email);
    if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
    }
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser(email, hashedPassword);
    res.json({ user });
};

// ---------------- LOGIN ----------------
export const login = async (req, res) => {
    // Login endpoint: issues JWT tokens in response body (not cookies)
    console.log(`[AUTH] Login request`, { method: req.method, path: req.originalUrl });
    try {
        const { email, password } = req.body;
        if (!(email || password)) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        // Find user by email
        const user = await findUserbyEmail(email);
        if (!user) {
            return res.status(400).json({ error: "Invalid credentials" });
        }
        // Block login if user registered with Google
        if (user.google_id) {
            return res.status(401).json({ error: "This account uses Google Sign-In. Please use the Google Sign-In button." });
        }
        if (!user.password) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        // Compare password
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        // Generate unique token ID for session tracking
        const tokenId = crypto.randomBytes(16).toString('hex');
        // Create access and refresh tokens
        const accessToken = jwt.sign(
            { id: user.id, tokenId },
            process.env.JWT_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRE }
        );
        const refreshToken = jwt.sign(
            { id: user.id, tokenId },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRE }
        );
        // Store refresh session in DB
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await createSession(user.id, refreshToken, tokenId, expiresAt);
        res.json({
            message: "Login successful",
            accessToken,
            refreshToken
        });
    } catch (err) {
        console.error('[AUTH] Login error:', err);
        res.status(500).json({ error: "Internal server error during login" });
    }
};

// ---------------- LOGOUT ----------------
export const logout = async (req, res) => {
    // Logout endpoint: invalidates all user sessions for the given access token
    console.log(`[AUTH] Logout request`, { method: req.method, path: req.originalUrl });
    try {
        // Get the user ID from the Authorization header (Bearer token)
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                await invalidateAllUserSessions(decoded.id);
            } catch (err) {
                // Ignore invalid token
            }
        }
        // Send instruction to clear cache and broadcast logout
        res.json({ 
            message: "Logged out successfully",
            clearCache: true,
            broadcastLogout: true
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: "Error during logout" });
    }
};


// ---------------- GOOGLE LOGIN ----------------
export const googleLogin = async (req, res) => {
    // Google login endpoint: verifies Google token, issues JWTs, returns in response body
    console.log(`[AUTH] Google login request`, { method: req.method, path: req.originalUrl });
    try {
        // Accept multiple field names for the incoming Google token to be tolerant
        const token = req.body?.credential || req.body?.id_token || req.body?.token || req.body?.google_token;
        if (!token) {
            console.warn('[AUTH] No Google token provided in request body');
            return res.status(400).json({ error: 'Missing Google token' });
        }

        // Verify the Google token (verifyIdToken will check audience)
        let payload;
        try {
            payload = await verifyGoogleToken(token);
        } catch (verifyErr) {
            console.error('Google token verification failed:', verifyErr);
            return res.status(401).json({ error: 'Invalid Google token', details: verifyErr.message });
        }
        // Find or create user with Google data
        const user = await findOrCreateGoogleUser({
            email: payload.email,
            name: payload.name,
            googleId: payload.sub,
            picture: payload.picture
        });
        // Generate a unique token ID for this session
        const tokenId = crypto.randomBytes(16).toString('hex');
        // Create access token (short-lived)
        const accessToken = jwt.sign(
            { id: user.id, tokenId },
            process.env.JWT_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRE }
        );
        // Create refresh token (long-lived)
        const refreshToken = jwt.sign(
            { id: user.id, tokenId },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRE }
        );
        // Calculate expiration time for the session
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        // Store the session in the database
        await createSession(user.id, refreshToken, tokenId, expiresAt);
        // Return tokens in response body for header-based auth
        res.json({
            message: "Google login successful",
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(401).json({ error: error.message || "Google authentication failed" });
    }
};

// ---------------- REFRESH TOKENS ----------------



export const refreshTokens = async (req, res) => {
    const REFRESH_TOKEN_EXPIRE_DAYS = 7;

    const authHeader = req.headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Refresh token missing" });
    }

    const incomingRefresh = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(incomingRefresh, process.env.REFRESH_TOKEN_SECRET);

        const client = await pool.connect();
        let transactionStarted = false;

        try {
            await client.query('BEGIN');
            transactionStarted = true;

            // Lock the session row to avoid concurrent refresh collisions
            const { rows } = await client.query(
                `SELECT * FROM user_sessions WHERE refresh_token = $1 FOR UPDATE`,
                [incomingRefresh]
            );

            if (!rows.length) {
                await client.query('ROLLBACK');
                transactionStarted = false;
                return res.status(401).json({ error: "Session not found or already rotated", sessionExpired: true });
            }

            const session = rows[0];

            if (session.user_id !== decoded.id) {
                await client.query('ROLLBACK');
                transactionStarted = false;
                return res.status(401).json({ error: "Session does not match user", sessionExpired: true });
            }

            if (new Date(session.expires_at).getTime() <= Date.now()) {
                await client.query('ROLLBACK');
                transactionStarted = false;
                return res.status(401).json({ error: "Refresh session expired", sessionExpired: true });
            }

            const newTokenId = crypto.randomUUID();
            const newAccessToken = jwt.sign(
                { id: session.user_id, tokenId: newTokenId },
                process.env.JWT_SECRET,
                { expiresIn: ACCESS_TOKEN_EXPIRE }
            );

            const newRefreshToken = jwt.sign(
                { id: session.user_id, tokenId: newTokenId },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: `${REFRESH_TOKEN_EXPIRE_DAYS}d` }
            );

            const newExpiresAt = new Date(
                Date.now() + REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60 * 1000
            );

            const updateResult = await client.query(
                `UPDATE user_sessions
                 SET refresh_token = $1, token_id = $2, expires_at = $3, created_at = NOW()
                 WHERE token_id = $4`,
                [newRefreshToken, newTokenId, newExpiresAt, session.token_id]
            );

            if (updateResult.rowCount !== 1) {
                await client.query('ROLLBACK');
                transactionStarted = false;
                return res.status(409).json({ error: "Refresh token rotation conflict", sessionExpired: true });
            }

            await client.query('COMMIT');
            transactionStarted = false;

            return res.json({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            });
        } catch (error) {
            if (transactionStarted) {
                try {
                    await client.query('ROLLBACK');
                } catch (rollbackError) {
                    console.error('Refresh token rollback failed:', rollbackError);
                }
            }
            console.error("Refresh token error:", error);
            return res.status(500).json({ error: "Failed to refresh tokens" });
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Refresh token verification failed:", err);
        return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
};


// ---------------- GET PROFILE ----------------
export const getProfile = async (req, res) => {
    // Get profile endpoint: requires Authorization header with Bearer token
    console.log(`[AUTH] Get profile request:`, { method: req.method, path: req.originalUrl, cookies: req.cookies });
    try {
        // Get token from Authorization header
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const token = authHeader.split(' ')[1];
        // Verify and decode token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Find user by ID
        const user = await findUserById(decoded.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if user's email is in the admin list
        const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
        const isAdmin = adminEmails.includes(user.email);

        // Return user profile with admin status
        res.json({ 
            id: user.id, 
            email: user.email, 
            name: user.name, 
            picture: user.picture,
            isAdmin 
        });
    } catch (err) {
        console.error('[AUTH] Get profile error:', err);
        res.status(401).json({ error: "Invalid or expired token" });
    }
};