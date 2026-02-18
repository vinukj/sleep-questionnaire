import keycloakService from '../services/keycloakService.js';
import pool from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

// ============================================
// KEYCLOAK AUTHENTICATION MIDDLEWARE
// ============================================

/**
 * Main authentication middleware using Keycloak
 * Verifies Bearer token and attaches user info to req.user
 */
export const verifyTokens = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Token missing" });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify token with Keycloak
    const tokenData = await keycloakService.verifyToken(token);

    if (!tokenData || !tokenData.active) {
      return res.status(401).json({ 
        message: "Invalid or expired token",
        sessionExpired: true
      });
    }

    // Try to find user in local database by keycloak ID or email
    let userResult = await pool.query(
      "SELECT id, email, role, name, keycloak_id FROM users WHERE keycloak_id = $1",
      [tokenData.userId]
    );

    // Fallback: find by email if keycloak_id not set
    if (!userResult.rows.length) {
      userResult = await pool.query(
        "SELECT id, email, role, name, keycloak_id FROM users WHERE email = $1",
        [tokenData.email]
      );
    }

    let user;
    if (userResult.rows.length) {
      user = userResult.rows[0];
      
      // CRITICAL: Validate session token to prevent multi-device access
      const clientSessionToken = req.headers['x-session-token'];
      
      if (!clientSessionToken) {
        return res.status(401).json({ 
          message: "Session token missing",
          sessionExpired: true,
          reason: "missing_session_token"
        });
      }
      
      if (user.session_token !== clientSessionToken) {
        return res.status(401).json({ 
          message: "Session invalidated - user logged in from another device",
          sessionExpired: true,
          reason: "session_token_mismatch"
        });
      }
      
      // Update keycloak_id if not set
      if (!user.keycloak_id) {
        await pool.query(
          "UPDATE users SET keycloak_id = $1 WHERE id = $2",
          [tokenData.userId, user.id]
        );
        user.keycloak_id = tokenData.userId;
      }
    } else {
      // User not in local DB - this shouldn't happen but handle gracefully
      user = {
        keycloak_id: tokenData.userId,
        email: tokenData.email,
        name: tokenData.username,
        role: null // Will be determined from Keycloak roles
      };
    }

    // Determine primary role from Keycloak roles (priority: admin > physician > user)
    const keycloakRoles = tokenData.roles || [];
    let primaryRole = 'user'; // default
    if (keycloakRoles.includes('admin')) {
      primaryRole = 'admin';
    } else if (keycloakRoles.includes('physician')) {
      primaryRole = 'physician';
    }

    // Attach user info with Keycloak data
    req.user = {
      ...user,
      role: primaryRole,
      keycloak_id: tokenData.userId,
      roles: keycloakRoles, // All Keycloak roles
      email: tokenData.email
    };

    next();
  } catch (err) {
    console.error("Keycloak token verification failed:", err);
    return res.status(403).json({
      message: "Invalid token",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Basic token verification without database lookup
 * Useful for lightweight endpoints
 */
export const verifyTokenBasic = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const tokenData = await keycloakService.verifyToken(token);

    if (!tokenData || !tokenData.active) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Determine primary role
    const keycloakRoles = tokenData.roles || [];
    let primaryRole = 'user';
    if (keycloakRoles.includes('admin')) {
      primaryRole = 'admin';
    } else if (keycloakRoles.includes('physician')) {
      primaryRole = 'physician';
    }

    req.user = {
      keycloak_id: tokenData.userId,
      email: tokenData.email,
      role: primaryRole,
      roles: keycloakRoles
    };

    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(403).json({
      message: "Invalid or expired token",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};


// Admin guard - allows admin and physician roles to access admin routes
export const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const allowedRoles = ['admin', 'physician'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    next();
  } catch (err) {
    console.error('Admin check failed:', err);
    return res.status(403).json({ message: 'Admin access required' });
  }
};

// Super admin guard - only allows admin role (for user management)
export const requireSuperAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Super admin access required' });
    }

    next();
  } catch (err) {
    console.error('Super admin check failed:', err);
    return res.status(403).json({ message: 'Super admin access required' });
  }
};



 
