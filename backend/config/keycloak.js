import dotenv from 'dotenv';
dotenv.config();

export const keycloakConfig = {
  realm: process.env.KEYCLOAK_REALM || 'sleepmaitrix',
  'auth-server-url': process.env.KEYCLOAK_URL || 'https://sleepmaitrix.com/keycloak',
  'ssl-required': 'external',
  resource: process.env.KEYCLOAK_CLIENT_ID || 'sleep-backend',
  credentials: {
    secret: process.env.KEYCLOAK_CLIENT_SECRET
  },
  'confidential-port': 0,
  'bearer-only': true // Backend only validates tokens, doesn't redirect
};

export const keycloakAdminConfig = {
  baseUrl: process.env.KEYCLOAK_URL || 'https://sleepmaitrix.com/keycloak',
  realmName: 'master', // Admin user is always in master realm
  credentials: {
    grantType: 'password',
    clientId: 'admin-cli',
    username: process.env.KEYCLOAK_ADMIN_USERNAME || 'admin',
    password: process.env.KEYCLOAK_ADMIN_PASSWORD
  }
};
