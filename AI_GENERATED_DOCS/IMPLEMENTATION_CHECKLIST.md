# Implementation Checklist - Performance & Best Practices

## 🔴 CRITICAL (Must Do This Week)

### [ ] 1. Add Database Indexes
- [ ] Create migration file: `backend/migrations/add-indexes.sql`
- [ ] Add index for `users.email`
- [ ] Add index for `users.google_id`
- [ ] Add index for `questionnaire_responses.user_id`
- [ ] Add index for `questionnaire_responses.created_at`
- [ ] Add index for `user_sessions.user_id`
- [ ] Run migration and verify indexes are created
- [ ] Test query performance before/after
- **Effort:** 15 minutes | **Impact:** Critical

### [ ] 2. Create Error Boundary Component
- [ ] Create `quiz-frontend/src/components/ErrorBoundary.jsx`
- [ ] Add error state management
- [ ] Add error display UI
- [ ] Add home/refresh buttons
- [ ] Update `main.jsx` to wrap app with ErrorBoundary
- [ ] Test by intentionally throwing error
- [ ] Verify error is caught and displayed
- **Effort:** 20 minutes | **Impact:** Critical

### [ ] 3. Implement Admin API Pagination
- [ ] Add `getAllQuestionnaireResponsesPaginated()` to `userModel.js`
- [ ] Add `getTotalResponseCount()` to `userModel.js`
- [ ] Update `getAllResponses()` controller to use pagination
- [ ] Add page and limit query parameters
- [ ] Update AdminDashboard component to handle pagination
- [ ] Update table footer with pagination controls
- [ ] Test pagination with more than 50 records
- **Effort:** 30 minutes | **Impact:** Critical

### [ ] 4. Fix Database Connection Pool
- [ ] Update `backend/config/db.js`
- [ ] Add `max: 20` setting
- [ ] Add `idleTimeoutMillis: 30000`
- [ ] Add `connectionTimeoutMillis: 2000`
- [ ] Add `statement_timeout: 30000`
- [ ] Restart server and verify connection
- **Effort:** 10 minutes | **Impact:** Critical

---

## 🟠 HIGH PRIORITY (Implement in Next Sprint)

### [ ] 5. Implement Code Splitting
- [ ] Update `vite.config.js` with rollupOptions
- [ ] Create manual chunks for admin, questionnaire, auth, home
- [ ] Create vendor chunk for node_modules
- [ ] Create UI chunk for MUI and icons
- [ ] Run `npm run build` and check bundle sizes
- [ ] Verify chunks are loaded lazily
- [ ] Check bundle analyzer output
- **Effort:** 20 minutes | **Impact:** 40-60% bundle reduction

### [ ] 6. Add Backend Input Validation
- [ ] Install or use `express-validator`
- [ ] Create validation middleware for questionnaire submission
- [ ] Validate required fields
- [ ] Validate email format
- [ ] Validate phone format (India specific)
- [ ] Validate numeric ranges (age, BMI, etc.)
- [ ] Update endpoints to use validation middleware
- [ ] Test with invalid data
- **Effort:** 40 minutes | **Impact:** High (security & data integrity)

### [ ] 7. Improve Rate Limiting
- [ ] Create auth-specific rate limiter (5 requests/15min)
- [ ] Create API-specific rate limiter (100 requests/15min)
- [ ] Create stricter limits for search endpoints
- [ ] Apply limiters to appropriate routes
- [ ] Test rate limiting is working
- [ ] Add retry-after headers
- **Effort:** 20 minutes | **Impact:** High (security)

### [ ] 8. Optimize Re-renders (Advanced)
- [ ] Review `QuestionnaireContent.jsx` rendering logic
- [ ] Consider React.memo for QuestionRenderer
- [ ] Optimize watchAllFields to only watch critical fields
- [ ] Profile with React DevTools Profiler
- [ ] Measure before/after render times
- **Effort:** 30 minutes | **Impact:** Medium (UX improvement)

---

## 🟡 MEDIUM PRIORITY (Next Quarter)

### [ ] 9. Add Caching Headers
- [ ] Update `server.js` middleware
- [ ] Set cache-control for static assets (max-age=31536000)
- [ ] Set cache-control for API responses (no-cache)
- [ ] Verify headers in browser DevTools Network tab
- **Effort:** 10 minutes | **Impact:** Medium

### [ ] 10. Implement Server-Side Search
- [ ] Create `/questionnaire/search` endpoint
- [ ] Add search handler in questionnaireController
- [ ] Update AdminDashboard to call server-side search
- [ ] Add minimum query length (2 characters)
- [ ] Test search performance
- **Effort:** 30 minutes | **Impact:** Medium (at scale)

### [ ] 11. Add Loading Skeletons
- [ ] Install `@mui/lab` Skeleton component
- [ ] Create LoadingSkeleton component for tables
- [ ] Create LoadingSkeleton for forms
- [ ] Update AdminDashboard to show skeleton while loading
- [ ] Update Questionnaire to show skeleton while loading
- **Effort:** 25 minutes | **Impact:** Low (UX improvement)

### [ ] 12. Remove Console Logs
- [ ] Create development-only logging utility
- [ ] Replace all console.log with dev logger
- [ ] Keep console.error for errors only
- [ ] Test in production mode
- **Effort:** 15 minutes | **Impact:** Low (clean console)

---

## 🟢 LOW PRIORITY (When You Have Time)

### [ ] 13. Add Response Compression
- [ ] Install compression middleware
- [ ] Add to `server.js`
- [ ] Verify in DevTools (Content-Encoding header)
- **Effort:** 5 minutes | **Impact:** Low

### [ ] 14. Audit Dependencies
- [ ] Run `npm outdated`
- [ ] Run `npm audit`
- [ ] Update non-breaking changes
- [ ] Check for duplicate packages
- **Effort:** 20 minutes | **Impact:** Low (maintenance)

### [ ] 15. Migrate to TypeScript
- [ ] Install TypeScript and types
- [ ] Convert critical files first
- [ ] Add tsconfig.json
- [ ] Update build process
- **Effort:** Multiple hours | **Impact:** Medium (long-term)

---

## ✅ Testing Checklist

After implementing each fix, verify:

### [ ] Database Indexes
```bash
# Verify indexes exist
psql -U your_user -d your_db -c "SELECT * FROM pg_indexes WHERE schemaname = 'public';"
```

### [ ] Error Boundary
```bash
# Check component renders without errors
npm run dev
# Visit app and check console for errors
```

### [ ] Pagination
```bash
# Test with different page numbers
curl "http://localhost:3000/questionnaire/admin/all-responses?page=0&limit=10"
```

### [ ] Connection Pool
```bash
# Check connection status
npm run dev
# Look for connection log messages
```

### [ ] Code Splitting
```bash
npm run build
# Check output for chunk files: admin.js, questionnaire.js, etc.
```

### [ ] Rate Limiting
```bash
# Test rate limit by making multiple requests
for i in {1..6}; do curl http://localhost:3000/auth/login; done
# Sixth request should return 429
```

---

## 📊 Performance Metrics Before & After

Create this spreadsheet to track improvements:

| Metric | Before | After | Improvement | Test Method |
|--------|--------|-------|-------------|-------------|
| Bundle Size | KB | KB | % | `npm run build` |
| Initial Load Time | ms | ms | % | Lighthouse |
| Admin Dashboard Load | ms | ms | % | Network tab |
| Query Time (user lookup) | ms | ms | % | Database logs |
| Form Render Time | ms | ms | % | React Profiler |
| Concurrent Connections | requests | requests | % | Load test |

---

## 🚀 Deployment Checklist

Before deploying changes to production:

### [ ] Code Review
- [ ] Have team member review changes
- [ ] Check for commented code
- [ ] Verify no console.logs remain
- [ ] Check for console.errors

### [ ] Testing
- [ ] Run `npm run lint`
- [ ] Run `npm run build` (no errors)
- [ ] Test locally with `npm run dev`
- [ ] Test error scenarios
- [ ] Test on mobile device

### [ ] Performance
- [ ] Run Lighthouse audit
- [ ] Check bundle size hasn't increased
- [ ] Verify pagination works
- [ ] Test rate limiting
- [ ] Check database queries in slow query log

### [ ] Security
- [ ] No sensitive data in console
- [ ] No credentials in code
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Input validation active

### [ ] Monitoring
- [ ] Error tracking enabled (check ErrorBoundary)
- [ ] API response time monitoring enabled
- [ ] Database monitoring active
- [ ] Error logs reviewed

---

## 📝 Implementation Notes

Use this section to track progress:

### Week 1
- [ ] Task 1: ___________________
- [ ] Task 2: ___________________
- [ ] Task 3: ___________________
- Notes: ___________________

### Week 2
- [ ] Task 4: ___________________
- [ ] Task 5: ___________________
- [ ] Task 6: ___________________
- Notes: ___________________

### Week 3+
- [ ] Task 7-12: ___________________
- Notes: ___________________

---

## 🎯 Success Criteria

You'll know you've successfully completed the review when:

✅ All 4 CRITICAL items are implemented and tested
✅ Bundle size is at least 30% smaller (with code splitting)
✅ Database queries run in < 10ms (with indexes)
✅ Admin dashboard loads in < 2 seconds
✅ App doesn't crash on component errors (error boundary)
✅ No console errors in production
✅ All tests pass
✅ Lighthouse score improves by 20+ points

---

## 📞 Getting Help

If you get stuck on any task:

1. **Reference:** Check `IMPLEMENTATION_GUIDE.md` for code examples
2. **Details:** Check `PERFORMANCE_AND_BEST_PRACTICES_REVIEW.md` for background
3. **Encouragement:** Check `PROJECT_STRENGTHS.md` to remember what's working well

---

**Last Updated:** October 17, 2025
**Status:** Ready for Implementation ✅
