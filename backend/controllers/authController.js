
// --- Auth Controller: Header-based JWT Authentication (No Cookies) ---
import express from "express";
import { createUser, findUserbyEmail, createSession, invalidateAllUserSessions, findOrCreateGoogleUser, findUserById, findSessionByToken } from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import crypto from 'crypto';
import { verifyGoogleToken } from "../config/google.js";
dotenv.config();

// Token expiry durations
const ACCESS_TOKEN_EXPIRE = '45m'; // Short-lived access token
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
        if (!email || !password) {
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
        // Return tokens in response body for header-based auth
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
        const { credential } = req.body;
        // Verify the Google token
        const payload = await verifyGoogleToken(credential);
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
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Refresh token missing' });
        }

        const incomingRefresh = authHeader.split(' ')[1];

        // Verify refresh token signature
        let decoded;
        try {
            decoded = jwt.verify(incomingRefresh, process.env.REFRESH_TOKEN_SECRET);
        } catch (err) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        // Validate session exists and not expired
        const session = await findSessionByToken(incomingRefresh);
        if (!session) {
            return res.status(401).json({ error: 'Session not found or rotated' });
        }

        if (new Date(session.expires_at).getTime() <= Date.now()) {
            return res.status(401).json({ error: 'Refresh session expired' });
        }

        // Issue new access token and rotate refresh token
        const tokenId = session.token_id; // keep same token id to maintain continuity

        const newAccessToken = jwt.sign(
            { id: session.user_id, tokenId },
            process.env.JWT_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRE }
        );

        const newRefreshToken = jwt.sign(
            { id: session.user_id, tokenId },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRE }
        );

        const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Update the session with the new refresh token
        await import('../config/db.js').then(async ({ default: pool }) => {
            await pool.query(
                `UPDATE user_sessions SET refresh_token = $1, expires_at = $2 WHERE token_id = $3`,
                [newRefreshToken, newExpiresAt, tokenId]
            );
        });

        return res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(500).json({ error: 'Failed to refresh tokens' });
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