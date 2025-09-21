import express from "express";
import { createUser, findUserbyEmail, createSession, invalidateAllUserSessions, findOrCreateGoogleUser, findUserById } from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import crypto from 'crypto';
import { verifyGoogleToken } from "../config/google.js";
dotenv.config();

const ACCESS_TOKEN_EXPIRE = '15m'; // short-lived access token
const REFRESH_TOKEN_EXPIRE = '7d'; // refresh token lifespan

// ---------------- SIGNUP ----------------
export const signup = async (req, res) => {
    console.log(`[AUTH] Signup request:`, { method: req.method, path: req.originalUrl, body: req.body });
    const { email, password } = req.body;
    const existingUser = await findUserbyEmail(email);
    if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser(email, hashedPassword);
    res.json({ user });
};

// ---------------- LOGIN ----------------
export const login = async (req, res) => {
    console.log(`[AUTH] Login request:`, { method: req.method, path: req.originalUrl, body: req.body });
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        const user = await findUserbyEmail(email);
        if (!user) {
            return res.status(400).json({ error: "Invalid credentials" });
        }
        if (user.google_id) {
            return res.status(401).json({ error: "This account uses Google Sign-In. Please use the Google Sign-In button." });
        }
        if (!user.password) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const tokenId = crypto.randomBytes(16).toString('hex');
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
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await createSession(user.id, refreshToken, tokenId, expiresAt);
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: '/'
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'None' : 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        });
        res.json({ message: "Login successful" });
    } catch (err) {
        console.error('[AUTH] Login error:', err);
        res.status(500).json({ error: "Internal server error during login" });
    }
};

// ---------------- LOGOUT ----------------
export const logout = async (req, res) => {
    console.log(`[AUTH] Logout request:`, { method: req.method, path: req.originalUrl, cookies: req.cookies });
    try {
        // Get the user ID from the token
        const token = req.cookies.accessToken;
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Invalidate all sessions for this user
            await invalidateAllUserSessions(decoded.id);
        }

        // Clear auth cookies
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        
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
    console.log(`[AUTH] Google login request:`, { method: req.method, path: req.originalUrl, body: req.body });
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

        // Send tokens as HttpOnly cookies
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'None' : 'Lax',
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: '/'
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'None' : 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        });

        res.json({ message: "Google login successful" });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(401).json({ error: error.message || "Google authentication failed" });
    }
};

// ---------------- GET PROFILE ----------------
export const getProfile = async (req, res) => {
    console.log(`[AUTH] Get profile request:`, { method: req.method, path: req.originalUrl, cookies: req.cookies });
    try {
        const token = req.cookies.accessToken;
        if (!token) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Find user by ID
    const user = await findUserById(decoded.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({ user: { id: user.id, email: user.email, name: user.name, picture: user.picture } });
    } catch (err) {
        console.error('[AUTH] Get profile error:', err);
        res.status(401).json({ error: "Invalid or expired token" });
    }
};