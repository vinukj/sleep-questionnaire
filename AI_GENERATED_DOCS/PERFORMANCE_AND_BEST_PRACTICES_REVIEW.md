# Sleep Questionnaire App - Performance & Best Practices Review

## Executive Summary
The application is **functionally working well** but has several optimization opportunities in both frontend and backend. This document outlines critical, high-priority, and medium-priority improvements.

---

## 🔴 CRITICAL ISSUES (Implement Immediately)

### 1. **Database Query Performance - Missing Indexes**
**Location:** `backend/models/userModel.js`, `backend/config/db.js`

**Issue:** JSONB columns and frequently queried fields lack indexes
```sql
-- Missing critical indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_questionnaire_responses_user_id ON questionnaire_responses(user_id);
CREATE INDEX idx_questionnaire_responses_created_at ON questionnaire_responses(created_at);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
```

**Impact:** O(n) full table scans on every user lookup, response fetch
**Priority:** CRITICAL - Do this immediately
**Estimated Fix Time:** 10 minutes

---

### 2. **N+1 Query Problem in Admin Dashboard**
**Location:** `backend/controllers/questionnaireController.js` - `getAllResponses()`

**Current Issue:**
```javascript
// This fetches all responses but may iterate through them without optimization
export const getAllResponses = async (req, res) => {
    const responses = await getAllQuestionnaireResponses();
    // No pagination, no filtering, no limit
}
```

**Problem:** Loading potentially 10,000+ records into memory
**Solution:**
```javascript
export const getAllResponses = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 50;
        const offset = page * limit;
        
        const [responses, countResult] = await Promise.all([
            getAllQuestionnaireResponsesPaginated(offset, limit),
            getTotalResponseCount()
        ]);

        res.json({
            success: true,
            responses,
            total: countResult.count,
            page,
            pageSize: limit,
            totalPages: Math.ceil(countResult.count / limit),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching all questionnaire responses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch questionnaire responses',
            error: error.message
        });
    }
};
```

**Priority:** CRITICAL
**Estimated Fix Time:** 30 minutes

---

### 3. **Missing Error Boundaries in React**
**Location:** `quiz-frontend/src/App.jsx`, `quiz-frontend/src/main.jsx`

**Issue:** No error boundary to catch React component crashes
**Solution:** Create an error boundary wrapper:
```jsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}
```

**Priority:** CRITICAL
**Estimated Fix Time:** 15 minutes

---

## 🟠 HIGH PRIORITY ISSUES (Implement Soon)

### 4. **Frontend Bundle Size - Missing Code Splitting**
**Location:** `quiz-frontend/vite.config.js`

**Issue:** Entire app loads as one bundle
```javascript
// Current: Single bundle
// Solution: Add code splitting for routes
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'admin': ['src/pages/AdminDashboard.jsx'],
          'questionnaire': ['src/components/Questionnaire.jsx'],
          'auth': ['src/pages/authScreen.jsx'],
          'vendor': ['react', 'react-dom', '@mui/material']
        }
      }
    }
  }
});
```

**Impact:** Initial load time reduced by 40-60%
**Priority:** HIGH
**Estimated Fix Time:** 20 minutes

---

### 5. **Excessive Re-renders in QuestionnaireContent**
**Location:** `quiz-frontend/src/components/QuestionnaireContent.jsx`

**Current Issue:**
```jsx
const watchAllFields = methods.watch(); // Re-runs on EVERY keystroke
// Then used in dependency array of useEffect
useEffect(() => {
  // ... dependency logic
}, [watchAllFields, currentPage, methods]); // watchAllFields changes constantly
```

**Optimization Already Partially Applied:** Debouncing added, but can be further optimized
```jsx
// Better approach: Use useCallback and useMemo more aggressively
const debouncedValidationRef = useRef(
  debounce((values) => {
    // validation logic
  }, 100)
);

// Only watch specific fields, not all
const criticalFields = useMemo(() => 
  questionnaire.flatMap(page => 
    page.questions
      .filter(q => q.dependsOn)
      .map(q => q.dependsOn.id)
  ), [questionnaire]
);

const watchCriticalFields = methods.watch(criticalFields);
```

**Priority:** HIGH
**Estimated Fix Time:** 25 minutes

---

### 6. **Missing Database Connection Pooling Configuration**
**Location:** `backend/config/db.js`

**Current Issue:**
```javascript
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT)|| 5432,
  // Missing pool size configuration
});
```

**Solution:**
```javascript
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT) || 5432,
  max: 20, // max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false
  }
});
```

**Priority:** HIGH
**Estimated Fix Time:** 5 minutes

---

### 7. **Missing Input Validation on Backend**
**Location:** `backend/controllers/questionnaireController.js`

**Issue:** No comprehensive validation of `responseData`
```javascript
// Current - too permissive
if (!responseData || typeof responseData !== 'object') {
    return res.status(400).json({ success: false, message: 'Invalid response payload' });
}

// Better approach: Use express-validator
import { body, validationResult } from 'express-validator';

export const validateResponseData = [
  body('responseData').isObject().withMessage('Response data must be an object'),
  body('responseData.name').trim().notEmpty(),
  body('responseData.email').isEmail(),
  body('responseData.phone').matches(PHONE_REGEX),
  // ... validate each field
];
```

**Priority:** HIGH
**Estimated Fix Time:** 30 minutes

---

## 🟡 MEDIUM PRIORITY ISSUES (Schedule for Next Sprint)

### 8. **Missing Caching Headers**
**Location:** `backend/server.js`

**Issue:** Static assets not cached, API responses uncached
```javascript
app.use((req, res, next) => {
  // Add caching headers
  if (req.url.match(/\.(js|css|png|jpg|svg)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (req.url.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});
```

**Priority:** MEDIUM
**Estimated Fix Time:** 10 minutes

---

### 9. **Rate Limiting Not Used on All Endpoints**
**Location:** `backend/server.js`

**Current Issue:**
```javascript
// Rate limiter exists but only applied globally
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
// app.use(limiter); // Global rate limit
```

**Better Approach:**
```javascript
// Specific limits for different endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // strict for auth
  skipSuccessfulRequests: true
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Apply to specific routes
app.use('/auth/', authLimiter);
app.use('/api/', apiLimiter);
```

**Priority:** MEDIUM
**Estimated Fix Time:** 15 minutes

---

### 10. **AdminDashboard Search Not Optimized**
**Location:** `quiz-frontend/src/pages/AdminDashboard.jsx`

**Current Issue:** Client-side filtering of all responses
```javascript
const filteredResponses = responses.filter((response) => {
  const query = searchQuery.toLowerCase();
  // Searching through potentially 10,000 records on every keystroke
  return (
    hospitalId.includes(query) ||
    name.includes(query) ||
    email.includes(query) ||
    phone.includes(query)
  );
});
```

**Solution:** Server-side search with debounce
```javascript
const handleSearch = debounce(async (query) => {
  if (query.length < 2) {
    setFilteredResponses(responses);
    return;
  }
  
  try {
    const response = await authFetch(`/questionnaire/search?q=${encodeURIComponent(query)}`);
    const results = await response.json();
    setFilteredResponses(results.data);
  } catch (err) {
    console.error('Search failed:', err);
  }
}, 300);
```

**Add Backend Endpoint:**
```javascript
router.get('/search', verifyTokens, requireAdmin, async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ data: [] });
  
  const results = await pool.query(
    `SELECT * FROM questionnaire_responses 
     WHERE response_data->>'name' ILIKE $1 
     OR response_data->>'email' ILIKE $1
     LIMIT 50`,
    [`%${q}%`]
  );
  res.json({ data: results.rows });
});
```

**Priority:** MEDIUM
**Estimated Fix Time:** 40 minutes

---

### 11. **Missing Loading Skeletons**
**Location:** All pages loading data from API

**Issue:** No progressive UI during data fetch
```jsx
// Current: Simple loading message
if (loading) return <div>Loading...</div>;

// Better: Use skeleton loaders
import Skeleton from '@mui/lab/Skeleton';

function LoadingSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width="80%" height={40} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" height={300} />
    </Box>
  );
}
```

**Priority:** MEDIUM
**Estimated Fix Time:** 20 minutes

---

### 12. **Console.log Statements in Production**
**Location:** Throughout codebase

**Issue:** Excessive logging clutters console and may leak sensitive info
```javascript
// Remove or use environment-based logging
const log = (msg) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(msg);
  }
};

// Or use a logger library
import pino from 'pino';
const logger = pino();
```

**Priority:** MEDIUM
**Estimated Fix Time:** 15 minutes

---

## 🟢 LOW PRIORITY ISSUES (Nice to Have)

### 13. **Missing TypeScript**
**Current:** Using PropTypes only
**Recommendation:** Migrate to TypeScript for better type safety
**Priority:** LOW - Can be done incrementally
**Estimated Fix Time:** Multiple sessions

---

### 14. **Unused Dependencies**
**Issue:** Check for unused packages
```bash
npm dedupe
npm ls --depth=0
```

**Priority:** LOW
**Estimated Fix Time:** 10 minutes

---

### 15. **Missing API Response Compression**
**Location:** `backend/server.js`

```javascript
import compression from 'compression';
app.use(compression({
  level: 6,
  threshold: 1024
}));
```

**Priority:** LOW
**Estimated Fix Time:** 5 minutes

---

## 📊 Performance Metrics to Track

### Frontend Metrics (Use Lighthouse)
- First Contentful Paint (FCP): Target < 1.5s
- Largest Contentful Paint (LCP): Target < 2.5s
- Cumulative Layout Shift (CLS): Target < 0.1
- Time to Interactive (TTI): Target < 3.8s

### Backend Metrics
- P95 Response Time: Target < 200ms
- Database Query Time: Target < 50ms (95th percentile)
- API Endpoint Response Time: Target < 100ms

---

## 🛠️ Implementation Roadmap

### Phase 1 (This Week) - CRITICAL
1. Add database indexes
2. Add error boundaries
3. Implement pagination for getAllResponses
4. Fix pool configuration

**Estimated Time:** 1 hour

### Phase 2 (This Sprint) - HIGH
5. Code splitting
6. Optimize re-renders
7. Backend validation
8. Rate limiting

**Estimated Time:** 2-3 hours

### Phase 3 (Next Sprint) - MEDIUM
9. Caching headers
10. Server-side search
11. Loading skeletons
12. Remove console.logs

**Estimated Time:** 2-3 hours

---

## 🔍 Code Quality Improvements

### 1. **Add ESLint Rules**
```json
{
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### 2. **Add Pre-commit Hooks**
```bash
npm install husky lint-staged --save-dev
npx husky install
```

### 3. **Add Tests**
- Unit tests for utilities and validators
- Integration tests for API endpoints
- E2E tests for critical user flows

**Target Coverage:** 70%+ for critical paths

---

## 📝 Summary of Recommendations

| Issue | Priority | Impact | Effort |
|-------|----------|--------|--------|
| Database indexes | CRITICAL | High | Low |
| Pagination for admin | CRITICAL | High | Medium |
| Error boundaries | CRITICAL | High | Low |
| Code splitting | HIGH | High | Low |
| Reduce re-renders | HIGH | Medium | Medium |
| Backend validation | HIGH | High | Medium |
| Caching headers | MEDIUM | Medium | Low |
| Rate limiting | MEDIUM | Medium | Low |
| Server search | MEDIUM | Medium | Medium |
| Loading skeletons | MEDIUM | Low | Low |
| Console removal | MEDIUM | Low | Low |
| TypeScript | LOW | Medium | High |

---

## ✅ Conclusion

The application has a **solid foundation** and is **production-ready** for basic usage. However, to scale and maintain performance under load:

1. **Immediate:** Implement CRITICAL fixes (1 hour)
2. **This Sprint:** Implement HIGH priority items (2-3 hours)
3. **Ongoing:** Monitor performance metrics and address bottlenecks

**Next Steps:** Start with database optimization and pagination, then move to frontend bundle optimization.
