import express from "express";
import { createUser, findUserbyEmail } from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const ACCESS_TOKEN_EXPIRE = '15m'; // short-lived access token
const REFRESH_TOKEN_EXPIRE = '7d'; // refresh token lifespan

// ---------------- SIGNUP ----------------
export const signup = async (req, res) => {
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
    const { email, password } = req.body;
    const user = await findUserbyEmail(email);
    if (!user) {
        return res.status(400).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
        return res.status(400).json({ error: "Invalid credentials" });
    }

    // Create access token (short-lived)
    const accessToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRE }
    );

    // Create refresh token (long-lived)
    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRE }
    );

    // Send tokens as HttpOnly cookies
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // only HTTPS in prod
        sameSite: 'Strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ message: "Login successful" });
};

// ---------------- LOGOUT ----------------
export const logout = (req, res) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
};


export const getProfile = async (req, res) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await findUserbyEmail(decoded.id); // or findUserById if available

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};