# Keycloak Migration - Deployment Checklist

## Pre-Deployment Tests

### 1. Run Complete Test Suite
```bash
cd backend
node test-keycloak-complete.js
```

All tests must pass before deployment.

---

## Backend Deployment Checklist

### 1. Environment Variables on VPS
Verify these are set in production `.env`:

```bash
# Database
DB_URL=postgresql://myuser:admin01@sleepmaitrix.com:5432/sleep_app_db

# Keycloak
KEYCLOAK_URL=https://sleepmaitrix.com/keycloak
KEYCLOAK_REALM=sleepmaitrix
KEYCLOAK_CLIENT_ID=sleep-backend
KEYCLOAK_CLIENT_SECRET=<your-secret>

# Keycloak Admin
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=<your-password>

# App
JWT_SECRET=<your-secret>
PORT=5000
NODE_ENV=production
```

### 2. Database Migration Status
```bash
# SSH into VPS
ssh user@sleepmaitrix.com

# Check migration status
cd /path/to/backend
node -e "
import pool from './config/db.js';
(async () => {
  const result = await pool.query(\`
    SELECT COUNT(*) as total, 
           COUNT(keycloak_id) as migrated 
    FROM users
  \`);
  console.log('Total users:', result.rows[0].total);
  console.log('Migrated:', result.rows[0].migrated);
  await pool.end();
})();
"
```

### 3. Keycloak Configuration
- [ ] Realm `sleepmaitrix` exists
- [ ] Client `sleep-backend` configured (confidential)
- [ ] Client `stjohn-frontend` configured (public)
- [ ] Realm roles created: `user`, `physician`, `admin`
- [ ] Valid Redirect URIs set for frontend client
- [ ] CORS settings configured

### 4. Package Dependencies
```bash
npm install
```

### 5. Restart Backend Service
```bash
# If using PM2
pm2 restart backend

# If using systemd
sudo systemctl restart sleep-backend

# Check logs
pm2 logs backend
# or
sudo journalctl -u sleep-backend -f
```

---

## Frontend Deployment Checklist

### 1. Environment Variables
Update frontend `.env`:

```bash
VITE_API_URL=https://sleepmaitrix.com/api
VITE_KEYCLOAK_URL=https://sleepmaitrix.com/keycloak
VITE_KEYCLOAK_REALM=sleepmaitrix
VITE_KEYCLOAK_CLIENT_ID=stjohn-frontend
```

### 2. Build and Deploy
```bash
cd quiz-frontend
npm install
npm run build
```

Upload `dist/` folder to your hosting (Vercel, etc.)

---

## Post-Deployment Verification

### 1. Test Login Flow
```bash
# Test from production URL
curl -X POST https://sleepmaitrix.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sleepadmin@gmail.com","password":"admin01"}'
```

### 2. Test Frontend
- Visit production URL
- Try login with existing user
- Try signup with new user
- Verify protected routes work
- Check admin features (if admin user)

### 3. Monitor Logs
```bash
# Backend logs
pm2 logs backend --lines 100

# Look for:
# - "[AUTH] Keycloak login successful"
# - No "[AUTH] Old auth successful" (means users are migrated)
# - No Keycloak connection errors
```

### 4. Test Auto-Migration (if applicable)
If some users not migrated:
- Login with old user credentials
- Verify auto-migration happens
- Check logs for: "[AUTH] ✓ User X auto-migrated to Keycloak on login"

---

## Rollback Plan (If Issues)

### Option 1: Revert Auth Controller
```bash
# Replace authController with old JWT version
git checkout <previous-commit> backend/controllers/authController.js
git checkout <previous-commit> backend/middleware/authMiddleware.js
pm2 restart backend
```

### Option 2: Enable Hybrid Mode Longer
Keep hybrid authentication active longer if migration issues occur.

### Option 3: Database Rollback
```sql
-- Clear keycloak_id to force re-migration
UPDATE users SET keycloak_id = NULL;
```

---

## Success Criteria

✅ All backend tests pass  
✅ Users can login with existing passwords  
✅ New signups work  
✅ Protected routes validate tokens  
✅ Token refresh works  
✅ Logout invalidates tokens  
✅ RBAC enforces role restrictions  
✅ No errors in production logs  
✅ Frontend login flow works  
✅ All users eventually migrated (keycloak_id populated)

---

## Monitoring Post-Deployment

### Week 1: Monitor closely
- Check error logs daily
- Monitor user login success rate
- Watch for Keycloak connection issues

### Ongoing:
- Monitor migration progress: `SELECT COUNT(keycloak_id) FROM users`
- Once 100% migrated, remove hybrid logic
- Archive old bcrypt password column (optional)

---

## Support Commands

### Check Keycloak Service
```bash
docker ps | grep keycloak
curl https://sleepmaitrix.com/keycloak/health
```

### Reset User Password (Emergency)
```bash
node reset-password.js
# Edit the script with correct email/password
```

### Check Database Connection
```bash
psql postgresql://myuser:admin01@sleepmaitrix.com:5432/sleep_app_db -c "SELECT COUNT(*) FROM users;"
```
