import dotenv from 'dotenv';
dotenv.config();

import pool from '../config/db.js';
import keycloakService from '../services/keycloakService.js';
import bcrypt from 'bcryptjs';

/**
 * Hybrid Auth Controller for Gradual Migration
 * 
 * On login:
 * 1. Check if user has keycloak_id (already migrated)
 * 2. If yes: use Keycloak auth
 * 3. If no: use old auth, then migrate user to Keycloak with same password
 */

export const hybridLogin = async (req, res) => {
    console.log(`[AUTH] Hybrid login request`, { method: req.method, path: req.originalUrl });
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

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
                const tokens = await keycloakService.loginUser(email, password);
                console.log(`[AUTH] Keycloak login successful for: ${email}`);
                
                return res.json({
                    message: "Login successful",
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    migrated: true
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

        console.log(`[AUTH] Old auth successful for ${email}, migrating to Keycloak...`);

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

            console.log(`[AUTH] ✓ User ${email} auto-migrated to Keycloak`);

            // Now login with Keycloak
            const tokens = await keycloakService.loginUser(email, password);

            return res.json({
                message: "Login successful (account migrated)",
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                migrated: true,
                justMigrated: true
            });
        } catch (migrateErr) {
            console.error('[AUTH] Auto-migration failed:', migrateErr);
            // Fall back to old JWT system temporarily
            return res.status(500).json({ 
                error: "Migration in progress. Please try again in a moment." 
            });
        }

    } catch (err) {
        console.error('[AUTH] Hybrid login error:', err);
        res.status(500).json({ error: "Login failed" });
    }
};
