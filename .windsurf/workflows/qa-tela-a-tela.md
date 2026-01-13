# Screen-by-Screen QA Audit

Enumerates all routes/screens and performs comprehensive QA testing for each.

## Steps

1. **Enumerate All Routes**
   - Parse router config to extract all routes
   - Identify public, authenticated, role-based, and dynamic routes
   - Group by feature/module

2. **Map Critical User Journeys**
   - Identify main flows: registration/login, core features, checkout, admin operations

3. **For Each Screen, Test:**
   - **Navigation**: All links work, back button, breadcrumbs, menu
   - **Buttons & Actions**: All buttons functional, loading states, success/error feedback
   - **Forms**: All fields accept input, validation triggers, error messages, submit button
   - **Error States**: Network errors, API errors, validation errors, retry mechanisms
   - **Empty States**: No data scenarios, helpful messages, call-to-action buttons
   - **Authentication**: Unauthenticated users redirected, role-based access, session expiry

4. **Build/Extend E2E Test Suite**
   - Create test file for each critical screen
   - Use Playwright if available

5. **Execute Tests**
   - Run full E2E suite across browsers and viewport sizes
   - Test different user roles

6. **Document Findings**
   - For each issue: screen, steps to reproduce, expected vs actual, screenshots, severity

7. **Assess Coverage**
   - Calculate test coverage: % of routes tested, % of critical journeys covered

8. **Prioritize Fixes**
   - Group issues by severity, affected user count, business impact
