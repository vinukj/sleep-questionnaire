import KcAdminClient from '@keycloak/keycloak-admin-client';
import { keycloakAdminConfig } from '../config/keycloak.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import dotenv from 'dotenv';
dotenv.config();

// ─────────────────────────────────────────────
// JWKS client for local JWT verification
// Caches public keys for 10 minutes to avoid
// hammering Keycloak on every request.
// ─────────────────────────────────────────────
const jwks = jwksClient({
  jwksUri: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxAge: 10 * 60 * 1000, // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

function getSigningKey(kid) {
  return new Promise((resolve, reject) => {
    jwks.getSigningKey(kid, (err, key) => {
      if (err) return reject(err);
      resolve(key.getPublicKey());
    });
  });
}

class KeycloakService {
  constructor() {
    this.adminClient = null;
    this.initialized = false;
    // Fix #5: Use a promise to prevent race-condition double-init
    this._initPromise = null;
    this.adminTokenBroken = false;
  }

  // ─────────────────────────────────────────────
  // Fix #5: Singleton init with promise-lock so
  // concurrent calls wait on the same init rather
  // than racing.
  // ─────────────────────────────────────────────
  async initialize() {
    if (this.initialized && !this.adminTokenBroken) return;

    if (this._initPromise) {
      // Another call is already initializing — wait for it
      return this._initPromise;
    }

    this._initPromise = this._doInitialize();
    try {
      await this._initPromise;
    } finally {
      this._initPromise = null;
    }
  }

  async _doInitialize() {
    try {
      this.adminClient = new KcAdminClient({
        baseUrl: keycloakAdminConfig.baseUrl,
        realmName: keycloakAdminConfig.realmName,
      });

      await this.adminClient.auth(keycloakAdminConfig.credentials);

      // ─────────────────────────────────────────
      // Fix #4: On refresh failure, mark the admin
      // client as broken so the next request will
      // re-initialize instead of silently failing.
      // ─────────────────────────────────────────
      setInterval(async () => {
        try {
          await this.adminClient.auth(keycloakAdminConfig.credentials);
          this.adminTokenBroken = false;
          console.log('[KEYCLOAK] Admin token refreshed successfully');
        } catch (error) {
          console.error('[KEYCLOAK] Failed to refresh admin token — marking as broken:', error.message);
          this.adminTokenBroken = true;
          this.initialized = false; // Force re-init on next call
        }
      }, 480 * 1000);

      this.initialized = true;
      this.adminTokenBroken = false;
      console.log('[KEYCLOAK] Admin client initialized');
    } catch (error) {
      this.initialized = false;
      console.error('[KEYCLOAK] Failed to initialize admin client:', error.message);
      throw error;
    }
  }

  // ─────────────────────────────────────────────
  // Fix #1 & #2: Verify token LOCALLY using the
  // JWKS public key. No network call to Keycloak
  // on every request. Also pre-checks expiry
  // before attempting anything.
  // ─────────────────────────────────────────────
  async verifyToken(token) {
    try {
      // Decode header first to get key ID (kid)
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded || !decoded.header?.kid) {
        console.warn('[KEYCLOAK] Token missing kid in header');
        return null;
      }

      // Fix #2: Check expiry locally before doing anything else
      const now = Math.floor(Date.now() / 1000);
      if (decoded.payload?.exp && decoded.payload.exp < now) {
        console.warn('[KEYCLOAK] Token is already expired locally — skipping verification');
        return null;
      }

      // Fetch the public key (cached by jwks-rsa)
      const publicKey = await getSigningKey(decoded.header.kid);

      // Verify signature and claims locally
      const verified = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
        issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
        // FIX: Remove strict audience check here if you want to handle it manually,
        // or ensure your Client in Keycloak is configured to add itself to the 'aud' claim.
      });

      // Manual Audience Check (More reliable with Keycloak)
      const audience = verified.aud;
      const isValidAudience = Array.isArray(audience)
        ? audience.includes(process.env.KEYCLOAK_CLIENT_ID)
        : audience === process.env.KEYCLOAK_CLIENT_ID;

      // Keycloak also puts the client ID in 'azp' (Authorized Party)
      if (!isValidAudience && verified.azp !== process.env.KEYCLOAK_CLIENT_ID) {
        console.warn('[KEYCLOAK] Token audience mismatch');
        return null;
      }

      return {
        active: true,
        userId: verified.sub,
        email: verified.email,
        username: verified.preferred_username,
        roles: verified.realm_access?.roles || [],
        clientRoles: verified.resource_access?.[process.env.KEYCLOAK_CLIENT_ID]?.roles || [],
        sessionState: verified.session_state || verified.sid,
      };
    } catch (error) {
      // Distinguish between expired and other errors for clearer logging
      if (error.name === 'TokenExpiredError') {
        console.warn('[KEYCLOAK] Token expired');
      } else {
        console.error('[KEYCLOAK] Token verification failed:', error.message);
      }
      return null;
    }
  }

  // Get user info from token (unchanged — useful for profile fetch)
  async getUserInfo(token) {
    try {
      const response = await axios.get(
        `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error('[KEYCLOAK] Failed to get user info:', error.message);
      return null;
    }
  }

  // Create user in Keycloak
  async createUser(email, password, name, roles = ['user']) {
    await this.initialize();

    try {
      const newUser = await this.adminClient.users.create({
        realm: process.env.KEYCLOAK_REALM,
        username: email,
        email: email,
        emailVerified: true,
        enabled: true,
        firstName: name?.split(' ')[0] || '',
        lastName: name?.split(' ').slice(1).join(' ') || '',
        credentials: password
          ? [{ type: 'password', value: password, temporary: false }]
          : [],
      });

      if (roles && roles.length > 0) {
        await this.assignRolesToUser(newUser.id, roles);
      }

      return newUser;
    } catch (error) {
      console.error('[KEYCLOAK] Failed to create user:', error.response?.data || error.message);
      throw error;
    }
  }

  // Find user by email
  async findUserByEmail(email) {
    await this.initialize();

    try {
      const users = await this.adminClient.users.find({
        realm: process.env.KEYCLOAK_REALM,
        email: email,
        exact: true,
      });
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      // Fix #8: Throw instead of returning null so callers know something went wrong
      console.error('[KEYCLOAK] Failed to find user by email:', error.message);
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  // Assign roles to user
  async assignRolesToUser(userId, roleNames) {
    await this.initialize();

    try {
      const realmRoles = await this.adminClient.roles.find({
        realm: process.env.KEYCLOAK_REALM,
      });

      const rolesToAssign = realmRoles.filter((role) => roleNames.includes(role.name));

      if (rolesToAssign.length === 0) {
        console.warn(`[KEYCLOAK] None of the requested roles found: ${roleNames.join(', ')}`);
        return false;
      }

      await this.adminClient.users.addRealmRoleMappings({
        id: userId,
        realm: process.env.KEYCLOAK_REALM,
        roles: rolesToAssign,
      });

      return true;
    } catch (error) {
      console.error('[KEYCLOAK] Failed to assign roles:', error.message);
      throw error;
    }
  }

  // ─────────────────────────────────────────────
  // Fix #7: updateUserRoles no longer hardcodes
  // role names. It removes ALL current app roles
  // dynamically and assigns only the new ones.
  // ─────────────────────────────────────────────
  async updateUserRoles(userId, newRoles) {
    await this.initialize();

    try {
      const currentRoles = await this.adminClient.users.listRealmRoleMappings({
        id: userId,
        realm: process.env.KEYCLOAK_REALM,
      });

      // Get the full list of realm roles so we know which are "app roles"
      const allRealmRoles = await this.adminClient.roles.find({
        realm: process.env.KEYCLOAK_REALM,
      });
      const allRealmRoleNames = new Set(allRealmRoles.map((r) => r.name));

      // Remove all roles that exist in the realm (i.e., app-managed roles)
      // Exclude Keycloak internal roles like "default-roles-*", "offline_access", "uma_authorization"
      const KEYCLOAK_INTERNAL_ROLES = new Set([
        'offline_access',
        'uma_authorization',
        `default-roles-${process.env.KEYCLOAK_REALM}`,
      ]);

      const rolesToRemove = currentRoles.filter(
        (role) => allRealmRoleNames.has(role.name) && !KEYCLOAK_INTERNAL_ROLES.has(role.name)
      );

      if (rolesToRemove.length > 0) {
        await this.adminClient.users.delRealmRoleMappings({
          id: userId,
          realm: process.env.KEYCLOAK_REALM,
          roles: rolesToRemove,
        });
      }

      await this.assignRolesToUser(userId, newRoles);
      return true;
    } catch (error) {
      console.error('[KEYCLOAK] Failed to update user roles:', error.message);
      throw error;
    }
  }

  // Login user and get tokens
  async loginUser(email, password) {
    try {
      const response = await axios.post(
        `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'password',
          client_id: process.env.KEYCLOAK_CLIENT_ID,
          client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
          username: email,
          password: password,
          scope: 'openid email profile',
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        refreshExpiresIn: response.data.refresh_expires_in,
      };
    } catch (error) {
      console.error('[KEYCLOAK] Login failed:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error_description || 'Login failed');
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken) {
    try {
      const response = await axios.post(
        `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: process.env.KEYCLOAK_CLIENT_ID,
          client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
          refresh_token: refreshToken,
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error) {
      console.error('[KEYCLOAK] Token refresh failed:', error.response?.data || error.message);
      throw new Error('Token refresh failed');
    }
  }

  // Logout user (revoke refresh token)
  async logoutUser(refreshToken) {
    try {
      await axios.post(
        `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/logout`,
        new URLSearchParams({
          client_id: process.env.KEYCLOAK_CLIENT_ID,
          client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
          refresh_token: refreshToken,
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      return true;
    } catch (error) {
      console.error('[KEYCLOAK] Logout failed:', error.response?.data || error.message);
      return false;
    }
  }

  // ─────────────────────────────────────────────
  // Fix #8: getUserRoles now throws on failure
  // so callers can distinguish "no roles" from
  // "call failed".
  // ─────────────────────────────────────────────
  async getUserRoles(userId) {
    await this.initialize();

    try {
      const roles = await this.adminClient.users.listRealmRoleMappings({
        id: userId,
        realm: process.env.KEYCLOAK_REALM,
      });
      return roles.map((role) => role.name);
    } catch (error) {
      console.error('[KEYCLOAK] Failed to get user roles:', error.message);
      throw new Error(`Failed to get roles for user ${userId}: ${error.message}`);
    }
  }

  // ─────────────────────────────────────────────
  // Fix #3: revokeAllUserSessions now returns a
  // structured result including a `forceLogout`
  // flag. Callers should send this flag to the
  // frontend so it clears tokens immediately.
  //
  // Usage in your route:
  //   const result = await keycloakService.revokeAllUserSessions(id);
  //   if (result.forceLogout) {
  //     res.json({ success: true, forceLogout: true });
  //     // Frontend should clear tokens and redirect to /login
  //   }
  // ─────────────────────────────────────────────
  async revokeAllUserSessions(keycloakUserId) {
    await this.initialize();

    try {
      const sessions = await this.adminClient.users.listSessions({
        id: keycloakUserId,
        realm: process.env.KEYCLOAK_REALM,
      });

      console.log(`[KEYCLOAK] Found ${sessions.length} active session(s) for user ${keycloakUserId}`);

      let revokedCount = 0;
      for (const session of sessions) {
        try {
          await this.adminClient.realms.deleteSession({
            realm: process.env.KEYCLOAK_REALM,
            session: session.id,
          });
          console.log(`[KEYCLOAK] Revoked session: ${session.id}`);
          revokedCount++;
        } catch (sessionErr) {
          console.error(`[KEYCLOAK] Failed to revoke session ${session.id}:`, sessionErr.message);
        }
      }

      return {
        revokedCount,
        totalSessions: sessions.length,
        // Callers must propagate this to the frontend
        forceLogout: revokedCount > 0,
      };
    } catch (error) {
      console.error('[KEYCLOAK] Failed to revoke user sessions:', error.message);
      throw new Error(`Failed to revoke sessions: ${error.message}`);
    }
  }

  // ─────────────────────────────────────────────
  // Fix #6: Back-channel logout handler.
  // Wire this up in your Express app:
  //
  //   app.post('/auth/logout/backchannel',
  //     express.urlencoded({ extended: true }),
  //     async (req, res) => {
  //       await keycloakService.handleBackchannelLogout(req, res);
  //     }
  //   );
  //
  // Then in Keycloak Admin Console:
  //   Clients → sleep-backend → Settings →
  //   Backchannel Logout URL:
  //   https://yourbackend.com/auth/logout/backchannel
  // ─────────────────────────────────────────────
  async handleBackchannelLogout(req, res) {
    try {
      const logoutToken = req.body?.logout_token;

      if (!logoutToken) {
        console.warn('[KEYCLOAK] Back-channel logout received with no logout_token');
        return res.status(400).json({ error: 'Missing logout_token' });
      }

      // Verify the logout token locally (same JWKS approach)
      const decoded = jwt.decode(logoutToken, { complete: true });

      if (!decoded?.header?.kid) {
        return res.status(400).json({ error: 'Invalid logout token' });
      }

      const publicKey = await getSigningKey(decoded.header.kid);

      const verified = jwt.verify(logoutToken, publicKey, {
        algorithms: ['RS256'],
        issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
      });

      const sessionId = verified.sid;
      const userId = verified.sub;

      console.log(`[KEYCLOAK] Back-channel logout received for user ${userId}, session ${sessionId}`);

      // ── YOUR APP-SPECIFIC CLEANUP GOES HERE ──
      // Examples:
      //   await invalidateSessionInYourDB(sessionId);
      //   await clearUserCacheEntry(userId);
      // ─────────────────────────────────────────

      return res.status(200).send('OK');
    } catch (error) {
      console.error('[KEYCLOAK] Back-channel logout handling failed:', error.message);
      // Always return 200 to Keycloak — returning an error causes it to retry endlessly
      return res.status(200).send('OK');
    }
  }
}

// Export singleton instance
export default new KeycloakService();