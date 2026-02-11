# 🔐 Keycloak Migration - Complete Overview

## 📊 **Architecture: Before vs After**

### **BEFORE (Old System)**
```
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ POST /auth/login {email, password}
       ↓
┌─────────────────────────────────────┐
│  Node.js Backend                    │
│  ┌──────────────────────────────┐  │
│  │ 1. bcrypt.compare(password)  │  │
│  │ 2. jwt.sign() - creates JWT  │  │
│  │ 3. Store session in DB       │  │
│  └──────────────────────────────┘  │
└──────────────┬──────────────────────┘
               ↓
       ┌──────────────┐
       │ PostgreSQL   │
       │ - users      │
       │ - sessions   │
       │ - passwords  │
       └──────────────┘
```

### **AFTER (Keycloak System)**
```
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ POST /auth/login {email, password}
       ↓
┌─────────────────────────────────────────────┐
│  Node.js Backend                            │
│  ┌────────────────────────────────────┐    │
│  │ 1. Forward to Keycloak             │    │
│  │ 2. Keycloak validates credentials  │    │
│  │ 3. Return Keycloak JWT tokens      │    │
│  └──────────────┬─────────────────────┘    │
└─────────────────┼──────────────────────────┘
                  │
                  ↓
          ┌──────────────────┐
          │   Keycloak       │
          │  ┌────────────┐  │
          │  │ - Users    │  │
          │  │ - Passwords│  │
          │  │ - Roles    │  │
          │  │ - Sessions │  │
          │  │ - Tokens   │  │
          │  └────────────┘  │
          └────────┬─────────┘
                   ↓
          ┌──────────────────┐
          │ Keycloak's       │
          │ PostgreSQL DB    │
          │ (Inside Docker)  │
          └──────────────────┘

       ┌──────────────────────┐
       │ Your PostgreSQL      │
       │ - users (with link)  │
       │ - questionnaires     │
       │ - responses          │
       │ - NO passwords       │
       │ - NO sessions        │
       └──────────────────────┘
```

---

## 🔄 **What Happens Now: Request Flow**

### **1. SIGNUP (New User)**
```
Frontend                Node Backend              Keycloak
   │                         │                        │
   │ POST /auth/signup       │                        │
   ├────────────────────────>│                        │
   │ {email, password, name} │                        │
   │                         │                        │
   │                         │ Create User            │
   │                         ├───────────────────────>│
   │                         │ POST /admin/realms/    │
   │                         │   stjohn/users         │
   │                         │                        │
   │                         │<───────────────────────┤
   │                         │ {id: "keycloak-uuid"}  │
   │                         │                        │
   │                         │ INSERT INTO users      │
   │                         │ (email, keycloak_id)   │
   │                         │          ↓             │
   │                         │    PostgreSQL          │
   │                         │                        │
   │<────────────────────────┤                        │
   │ 200 OK                  │                        │
   │ {user: {...}}           │                        │
```

### **2. LOGIN (Authentication)**
```
Frontend                Node Backend              Keycloak
   │                         │                        │
   │ POST /auth/login        │                        │
   ├────────────────────────>│                        │
   │ {email, password}       │                        │
   │                         │                        │
   │                         │ Token Request          │
   │                         ├───────────────────────>│
   │                         │ POST /realms/stjohn/   │
   │                         │   protocol/openid-     │
   │                         │   connect/token        │
   │                         │                        │
   │                         │ ✓ Validates password   │
   │                         │ ✓ Checks roles         │
   │                         │ ✓ Creates JWT          │
   │                         │ ✓ Stores session       │
   │                         │                        │
   │                         │<───────────────────────┤
   │                         │ {accessToken,          │
   │                         │  refreshToken}         │
   │                         │                        │
   │<────────────────────────┤                        │
   │ 200 OK                  │                        │
   │ {accessToken,           │                        │
   │  refreshToken}          │                        │
```

### **3. PROTECTED REQUEST**
```
Frontend                Node Backend              Keycloak
   │                         │                        │
   │ GET /auth/profile       │                        │
   ├────────────────────────>│                        │
   │ Bearer <accessToken>    │                        │
   │                         │                        │
   │                         │ Introspect Token       │
   │                         ├───────────────────────>│
   │                         │ POST /realms/stjohn/   │
   │                         │   protocol/openid-     │
   │                         │   connect/token/       │
   │                         │   introspect           │
   │                         │                        │
   │                         │ ✓ Validates signature  │
   │                         │ ✓ Checks expiration    │
   │                         │ ✓ Returns user info    │
   │                         │                        │
   │                         │<───────────────────────┤
   │                         │ {active: true,         │
   │                         │  userId, roles, ...}   │
   │                         │                        │
   │                         │ SELECT * FROM users    │
   │                         │ WHERE keycloak_id=...  │
   │                         │          ↓             │
   │                         │    PostgreSQL          │
   │                         │                        │
   │<────────────────────────┤                        │
   │ 200 OK                  │                        │
   │ {id, email, role, ...}  │                        │
```

### **4. REFRESH TOKEN**
```
Frontend                Node Backend              Keycloak
   │                         │                        │
   │ POST /auth/refresh      │                        │
   ├────────────────────────>│                        │
   │ Bearer <refreshToken>   │                        │
   │                         │                        │
   │                         │ Refresh Request        │
   │                         ├───────────────────────>│
   │                         │ POST /realms/stjohn/   │
   │                         │   protocol/openid-     │
   │                         │   connect/token        │
   │                         │ grant_type=            │
   │                         │   refresh_token        │
   │                         │                        │
   │                         │ ✓ Validates refresh    │
   │                         │ ✓ Issues new tokens    │
   │                         │ ✓ Rotates refresh      │
   │                         │                        │
   │                         │<───────────────────────┤
   │                         │ {accessToken,          │
   │                         │  refreshToken}         │
   │                         │                        │
   │<────────────────────────┤                        │
   │ New tokens              │                        │
```

---

## 💾 **Data Storage: Where Everything Lives**

### **1. Keycloak's PostgreSQL Database (Inside Docker)**
```
Location: Docker container "keycloak-db"
Access: Not directly accessible

Stores:
✓ User credentials (hashed passwords)
✓ User attributes (email, name, etc.)
✓ Roles and permissions
✓ Active sessions
✓ Token metadata
✓ Client configurations
✓ Realm settings
```

### **2. Your Application PostgreSQL Database**
```
Location: Render.com (dpg-d5fm9f7gi27c73du7nf0-a.oregon-postgres.render.com)

Stores:
✓ users table:
  - id (local ID)
  - email
  - name
  - role (redundant, synced from Keycloak)
  - keycloak_id (LINK to Keycloak user)
  - google_id
  - picture
  - created_at
  
✓ questionnaire_responses table
✓ questionnaire_schemas table
✓ Other application data

✗ NO passwords anymore
✗ NO user_sessions table (Keycloak handles this)
```

### **3. Data Redundancy Strategy**
```
┌─────────────────────────────────┐
│ Your PostgreSQL                 │
│ ┌─────────────────────────────┐ │
│ │ users                       │ │
│ │ - id: 1                     │ │
│ │ - email: "user@example.com" │ │
│ │ - role: "admin"             │ │
│ │ - keycloak_id: "uuid-123"   │◄├─┐
│ │ - questionnaire_data: {...} │ │ │ LINK
│ └─────────────────────────────┘ │ │
└─────────────────────────────────┘ │
                                     │
┌─────────────────────────────────┐ │
│ Keycloak PostgreSQL             │ │
│ ┌─────────────────────────────┐ │ │
│ │ users                       │ │ │
│ │ - id: "uuid-123"            │◄├─┘
│ │ - username: "user@email"    │ │
│ │ - password_hash: "..."      │ │
│ │ - realm_roles: ["admin"]    │ │
│ │ - sessions: [...]           │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## 🎯 **What Changed: Summary**

### **Backend Changes**

#### ✅ **NEW Files Created**
1. `config/keycloak.js` - Keycloak configuration
2. `services/keycloakService.js` - Full Keycloak integration
3. `scripts/migrateUsersToKeycloak.js` - Migration script
4. `scripts/syncRolesToKeycloak.js` - Role sync script

#### ♻️ **Modified Files**
1. `middleware/authMiddleware.js`
   - **Before:** JWT verification with `jwt.verify()`
   - **After:** Keycloak token introspection
   
2. `controllers/authController.js`
   - **Signup:** Now creates user in Keycloak first, then local DB
   - **Login:** Calls Keycloak, returns Keycloak tokens
   - **Logout:** Revokes Keycloak refresh token
   - **Refresh:** Uses Keycloak refresh endpoint
   - **UpdateRole:** Updates both Keycloak AND local DB

3. `models/userModel.js`
   - Added `keycloak_id` column to users table

#### ❌ **What's NO LONGER Used**
- `bcrypt` password hashing
- `jwt.sign()` for creating tokens
- `user_sessions` table for session management
- Local password validation

### **Frontend Changes**

#### ♻️ **Modified Files**
1. `context/AuthContext.jsx`
   - **Logout:** Now sends refreshToken in body (minimal change)
   - Everything else unchanged (same API contract!)

---

## 🔐 **Security Model**

### **Token Structure**

**Access Token (Short-lived: ~5 minutes)**
```json
{
  "sub": "keycloak-user-id",
  "email": "user@example.com",
  "realm_access": {
    "roles": ["admin", "user"]
  },
  "exp": 1234567890,
  "iat": 1234567800
}
```

**Refresh Token (Long-lived: 7 days)**
- Opaque token stored in Keycloak
- Used to get new access tokens
- Can be revoked on logout

### **Authentication Flow**
1. User logs in → Keycloak validates credentials
2. Keycloak returns JWT tokens
3. Frontend stores tokens in localStorage
4. Every API request includes: `Authorization: Bearer <accessToken>`
5. Backend validates with Keycloak introspection
6. Backend fetches user data from local DB (questionnaires, etc.)
7. When access token expires → use refresh token
8. On logout → revoke refresh token in Keycloak

---

## 🚀 **Benefits of This Architecture**

### **1. Separation of Concerns**
- **Keycloak:** Authentication, authorization, user credentials
- **Your DB:** Application data, business logic
- **Node Backend:** Business logic, data orchestration

### **2. Enhanced Security**
✓ Passwords never touch your application code
✓ Industry-standard OAuth2/OIDC protocols
✓ Token introspection for validation
✓ Centralized session management
✓ Easy to add MFA, SSO, etc.

### **3. Scalability**
✓ Keycloak handles auth load
✓ Your backend focuses on business logic
✓ Can scale auth independently

### **4. Flexibility**
✓ Easy to add social login (Google, GitHub, etc.)
✓ Can add SAML, LDAP integration
✓ Multi-tenancy support
✓ Role-based access control (RBAC) in Keycloak UI

---

## 📝 **Testing Checklist**

- [ ] Update .env with Keycloak credentials
- [ ] Run user migration: `npm run migrate:keycloak`
- [ ] Test signup: New user should appear in both DBs
- [ ] Test login: Should receive Keycloak tokens
- [ ] Test protected routes: Token validation works
- [ ] Test refresh: Token rotation works
- [ ] Test logout: Tokens revoked properly
- [ ] Test role changes: Admin can update roles
- [ ] Verify local DB has keycloak_id links
- [ ] Verify questionnaire data intact

