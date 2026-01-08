import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

// export const verifyTokens = async (req, res, next) => {
//     const authHeader = req.headers['authorization'];
//     if (!authHeader) return res.status(401).json({ message: "Token missing" });
//     const token = authHeader.split(' ')[1];
//     if (!token) return res.status(401).json({ message: "Access Denied" });
//     try {
//          console.log("SECRET AT VERIFICATION:", `"${process.env.JWT_SECRET}"`);
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         // Fetch user info from DB
//         const userResult = await pool.query(
//             "SELECT id,email FROM users WHERE id=$1",
//             [decoded.id]
//         );
//         if (!userResult.rows.length) {
//             return res.status(404).json({ message: "User not found" });
//         }
//         req.user = userResult.rows[0];
//         next();
//     } catch (err) {
//     // MODIFIED PART: Log the full error to see the exact reason for failure
//     console.error("JWT Verification Failed:", err);

//     // Optionally, send more specific error info in the response
//     return res.status(403).json({
//         message: "Invalid or expired token",
//         errorName: err.name,
//         errorMessage: err.message
//     });
// }
// };



export const verifyTokens = async (req, res, next) => {
  // Look for token in Authorization header (Bearer <token>)
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Token missing" });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if this session is still valid in the database
    const sessionResult = await pool.query(
      "SELECT * FROM user_sessions WHERE token_id = $1 AND expires_at > NOW()",
      [decoded.tokenId]
    );

    if (!sessionResult.rows.length) {
      return res.status(401).json({ 
        message: "Session expired or invalidated",
        sessionExpired: true
      });
    }

    // Fetch user info from DB
    const userResult = await pool.query(
      "SELECT id, email FROM users WHERE id=$1",
      [decoded.id]
    );

    if (!userResult.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = userResult.rows[0];
    next();
  } catch (err) {
    console.error("JWT Verification Failed:", err);

    // Special handling for expired tokens
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        message: "Access token expired",
        accessExpired: true
      });
    }

    // All other JWT errors
    return res.status(403).json({
      message: "Invalid token",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};



export const verifyTokenBasic = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "Token missing" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access Denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // attach user info from token (without DB check)
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT Verification Failed:", err);
    return res.status(403).json({
      message: "Invalid or expired token",
      errorName: err.name,
      errorMessage: err.message,
    });
  }
};


// Simple admin guard using a list of admin emails in env var ADMIN_EMAILS (comma-separated)
export const requireAdmin = (req, res, next) => {
  try {
    const adminList = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const userEmail = String(req.user?.email || '').toLowerCase();

    if (adminList.length > 0 && adminList.includes(userEmail)) {
      return next();
    }

    // If no admin list configured, block by default in production
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // In non-production, allow if list is empty (to avoid local lockout)
    return next();
  } catch (err) {
    console.error('Admin check failed:', err);
    return res.status(403).json({ message: 'Admin access required' });
  }
};


 
