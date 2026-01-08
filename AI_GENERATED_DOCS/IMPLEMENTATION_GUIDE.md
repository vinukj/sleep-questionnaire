# Quick Implementation Guide - Critical Fixes

## 1. Add Database Indexes (5 minutes)

Create a migration file: `backend/migrations/add-indexes.sql`

```sql
-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_user_id ON questionnaire_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_created_at ON questionnaire_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- For JSONB queries (if frequently searching in response_data)
CREATE INDEX IF NOT EXISTS idx_response_data_name ON questionnaire_responses USING GIN (response_data);

-- Run in psql:
-- psql -U your_user -d your_db -f backend/migrations/add-indexes.sql
```

**Expected Improvement:** 10-100x faster queries for user/response lookups

---

## 2. Add Error Boundary Component (10 minutes)

Create: `quiz-frontend/src/components/ErrorBoundary.jsx`

```jsx
import React from 'react';
import { Container, Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Could send to error tracking service here
    // Example: Sentry.captureException(error, { contexts: { errorInfo } });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md">
          <Box sx={{ 
            py: 8, 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: '100vh'
          }}>
            <Typography variant="h2" component="h1" gutterBottom sx={{ color: 'error.main' }}>
              Oops! Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              We're sorry, but something unexpected happened.
            </Typography>
            <Box>
              <Button 
                variant="contained" 
                onClick={() => window.location.href = '/'}
                sx={{ mr: 2 }}
              >
                Go to Home
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </Box>
            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ mt: 4, p: 2, backgroundColor: '#f5f5f5', textAlign: 'left' }}>
                <Typography variant="code" component="pre" sx={{ fontSize: '0.75rem' }}>
                  {this.state.error?.toString()}
                </Typography>
              </Box>
            )}
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

Update `quiz-frontend/src/main.jsx`:

```jsx
import ErrorBoundary from './components/ErrorBoundary';

// Wrap your app
ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
```

---

## 3. Add Pagination to Admin API (20 minutes)

Update: `backend/models/userModel.js`

```javascript
// Add pagination function
export const getAllQuestionnaireResponsesPaginated = async (offset, limit) => {
  const result = await pool.query(
    `SELECT id, user_id, response_data, created_at, updated_at 
     FROM questionnaire_responses 
     ORDER BY created_at DESC 
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
};

export const getTotalResponseCount = async () => {
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM questionnaire_responses`
  );
  return result.rows[0];
};
```

Update: `backend/controllers/questionnaireController.js`

```javascript
import {
    getAllQuestionnaireResponsesPaginated,
    getTotalResponseCount
} from '../models/userModel.js';

export const getAllResponses = async (req, res) => {
    try {
        const page = Math.max(0, parseInt(req.query.page) || 0);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
        const offset = page * limit;
        
        const [responses, countResult] = await Promise.all([
            getAllQuestionnaireResponsesPaginated(offset, limit),
            getTotalResponseCount()
        ]);

        // Log admin access (if user exists in request)
        if (req.user) {
            console.log(`Admin ${req.user.email} accessed questionnaire responses - Page ${page}`);
        }

        res.json({
            success: true,
            responses: responses,
            pagination: {
                total: countResult.count,
                page,
                pageSize: limit,
                totalPages: Math.ceil(countResult.count / limit),
                hasNextPage: (page + 1) * limit < countResult.count,
                hasPrevPage: page > 0
            },
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

Update: `quiz-frontend/src/pages/AdminDashboard.jsx`

```jsx
// Update the fetch call
useEffect(() => {
    const fetchResponses = async () => {
        try {
            setLoading(true);
            const response = await authFetch(
                `/questionnaire/admin/all-responses?page=${page}&limit=${rowsPerPage}`
            );
            
            if (response.ok) {
                const data = await response.json();
                setResponses(data.responses);
                setPaginationData(data.pagination);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (user) {
        fetchResponses();
    }
}, [user, authFetch, page, rowsPerPage]);

// Update pagination handler
const handleChangePage = (event, newPage) => {
    setPage(newPage);
};

const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
};
```

---

## 4. Fix Database Connection Pool (2 minutes)

Update: `backend/config/db.js`

```javascript
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT) || 5432,
  
  // Connection pooling configuration
  max: 20,                    // Max connections in pool
  min: 2,                     // Min connections to maintain
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Connection timeout
  statement_timeout: 30000,   // Query timeout 30s
  
  ssl: {
    rejectUnauthorized: false
  }
});

pool
  .connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("Connection error", err.stack));

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected pool error:', err);
});

export default pool;
```

---

## 5. Add Error Boundary Integration Testing

Test file: `quiz-frontend/src/components/__tests__/ErrorBoundary.test.jsx`

```jsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

describe('ErrorBoundary', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  beforeEach(() => {
    // Suppress console.error for clean test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('displays error message when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
});
```

---

## 6. Add Code Splitting (10 minutes)

Update: `quiz-frontend/vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'admin': ['src/pages/AdminDashboard.jsx'],
          'questionnaire': ['src/components/Questionnaire.jsx'],
          'auth': ['src/pages/authScreen.jsx'],
          'home': ['src/pages/HomeScreen.jsx'],
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui': ['@mui/material', '@mui/icons-material'],
          'forms': ['react-hook-form', '@hookform/resolvers']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
```

---

## Performance Improvement Checklist

- [ ] Database indexes added and verified
- [ ] Error boundary component created and integrated
- [ ] Admin API pagination implemented
- [ ] Frontend updated to use pagination
- [ ] Connection pool configuration updated
- [ ] Code splitting configured
- [ ] Test suite run and passing
- [ ] Bundle size analyzed with `npm run build`
- [ ] Performance metrics measured (Lighthouse)

---

## Testing Commands

```bash
# Test build performance
npm run build

# Analyze bundle size
npm run build -- --report

# Run ESLint
npm run lint

# Check for unused dependencies
npm ls --depth=0

# Database: Apply indexes
psql -U your_user -d your_db -f backend/migrations/add-indexes.sql

# Verify indexes
SELECT * FROM pg_indexes WHERE schemaname = 'public';
```

---

## Expected Performance Improvements

| Optimization | Expected Improvement |
|--------------|---------------------|
| Database indexes | 10-100x faster queries |
| Error boundary | Prevents full app crashes |
| Pagination | Reduces initial load from 10MB → 100KB |
| Connection pooling | 2-5x more concurrent requests |
| Code splitting | 30-50% reduction in initial bundle |

**Total Expected Page Load Time Improvement:** 40-60%
