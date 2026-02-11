import KcAdminClient from '@keycloak/keycloak-admin-client';
import { keycloakAdminConfig } from '../config/keycloak.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

class KeycloakService {
  constructor() {
    this.adminClient = null;
    this.initialized = false;
  }

  // Initialize admin client
  async initialize() {
    if (this.initialized) return;
    
    try {
      this.adminClient = new KcAdminClient({
        baseUrl: keycloakAdminConfig.baseUrl,
        realmName: keycloakAdminConfig.realmName,
      });

      await this.adminClient.auth(keycloakAdminConfig.credentials);
      
      // Set up token refresh
      setInterval(async () => {
        try {
          await this.adminClient.auth(keycloakAdminConfig.credentials);
        } catch (error) {
          console.error('Failed to refresh Keycloak admin token:', error);
        }
      }, 58 * 1000); // Refresh every 58 seconds

      this.initialized = true;
      console.log('Keycloak admin client initialized');
    } catch (error) {
      console.error('Failed to initialize Keycloak admin client:', error);
      throw error;
    }
  }

  // Verify token using Keycloak introspection endpoint
  async verifyToken(token) {
    try {
      const response = await axios.post(
        `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token/introspect`,
        new URLSearchParams({
          token: token,
          client_id: process.env.KEYCLOAK_CLIENT_ID,
          client_secret: process.env.KEYCLOAK_CLIENT_SECRET
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      if (!response.data.active) {
        return null;
      }

      return {
        active: response.data.active,
        userId: response.data.sub,
        email: response.data.email,
        username: response.data.preferred_username,
        roles: response.data.realm_access?.roles || [],
        clientRoles: response.data.resource_access?.[process.env.KEYCLOAK_CLIENT_ID]?.roles || []
      };
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return null;
    }
  }

  // Get user info from token
  async getUserInfo(token) {
    try {
      const response = await axios.get(
        `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get user info:', error.message);
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
        credentials: password ? [{
          type: 'password',
          value: password,
          temporary: false
        }] : []
      });

      // Assign roles to user
      if (roles && roles.length > 0) {
        await this.assignRolesToUser(newUser.id, roles);
      }

      return newUser;
    } catch (error) {
      console.error('Failed to create user in Keycloak:', error.response?.data || error.message);
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
        exact: true
      });

      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('Failed to find user:', error.message);
      return null;
    }
  }

  // Assign roles to user
  async assignRolesToUser(userId, roleNames) {
    await this.initialize();

    try {
      // Get all realm roles
      const realmRoles = await this.adminClient.roles.find({
        realm: process.env.KEYCLOAK_REALM
      });

      // Filter roles that match the role names
      const rolesToAssign = realmRoles.filter(role => 
        roleNames.includes(role.name)
      );

      if (rolesToAssign.length > 0) {
        await this.adminClient.users.addRealmRoleMappings({
          id: userId,
          realm: process.env.KEYCLOAK_REALM,
          roles: rolesToAssign
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to assign roles:', error.message);
      throw error;
    }
  }

  // Update user roles
  async updateUserRoles(userId, newRoles) {
    await this.initialize();

    try {
      // Get current user roles
      const currentRoles = await this.adminClient.users.listRealmRoleMappings({
        id: userId,
        realm: process.env.KEYCLOAK_REALM
      });

      // Remove all current roles (except default ones)
      const rolesToRemove = currentRoles.filter(role => 
        ['user', 'physician', 'admin'].includes(role.name)
      );

      if (rolesToRemove.length > 0) {
        await this.adminClient.users.delRealmRoleMappings({
          id: userId,
          realm: process.env.KEYCLOAK_REALM,
          roles: rolesToRemove
        });
      }

      // Assign new roles
      await this.assignRolesToUser(userId, newRoles);

      return true;
    } catch (error) {
      console.error('Failed to update user roles:', error.message);
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
          scope: 'openid email profile'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        refreshExpiresIn: response.data.refresh_expires_in
      };
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
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
          refresh_token: refreshToken
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      console.error('Token refresh failed:', error.response?.data || error.message);
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
          refresh_token: refreshToken
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return true;
    } catch (error) {
      console.error('Logout failed:', error.response?.data || error.message);
      return false;
    }
  }

  // Get user's roles
  async getUserRoles(userId) {
    await this.initialize();

    try {
      const roles = await this.adminClient.users.listRealmRoleMappings({
        id: userId,
        realm: process.env.KEYCLOAK_REALM
      });

      return roles.map(role => role.name);
    } catch (error) {
      console.error('Failed to get user roles:', error.message);
      return [];
    }
  }
}

// Export singleton instance
export default new KeycloakService();
