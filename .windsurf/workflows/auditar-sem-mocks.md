# Mock Data Detection and Migration Audit

Scans the entire codebase for mock data patterns and proposes a migration plan to replace them with real data sources.

## Steps

1. **Scan for Mock Patterns**
   - Search for hardcoded data arrays in components/pages
   - Find all files in `fixtures/`, `mocks/`, `__mocks__/` directories
   - Grep for MSW handlers and mock API definitions
   - Search for TODO/FIXME comments mentioning mocks
   - Identify faker/casual usage in non-test files

2. **Categorize Mock Usage**
   - Production code (components, pages, services) - HIGH priority
   - Development tools (Storybook, dev servers)
   - Tests (unit, integration, E2E)

3. **Analyze Mock Data Structure**
   - Extract data shape from each mock
   - Identify fields, types, relationships

4. **Map to Real Data Source**
   - If Supabase: match to tables and propose queries
   - Else: match to DB table/ORM model/API endpoint

5. **Generate Migration Plan**
   - Create migration task for each mock with file path, code snippets, and effort estimate
   - Group by module/feature for PR-sized chunks

6. **Identify Blockers**
   - Missing tables/endpoints
   - Incomplete schema
   - Auth/permission gaps

7. **Create Migration Checklist**
   - Prioritize by production impact
   - Define acceptance criteria
