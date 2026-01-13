# Data Contract Validation Audit

Ensures the source-of-truth schema is authoritative and validates data consistency across all boundaries (UI, API, Database).

## Steps

1. **Extract Source-of-Truth Schema**
   - If Supabase: use MCP to get table definitions
   - Else: parse migrations, ORM models, or DB introspection
   - Document columns, types, nullable, constraints, enums

2. **Map API Layer**
   - Identify all API endpoints/GraphQL queries
   - Extract request/response schemas and validation rules
   - Match to DB tables/models

3. **Map UI Layer**
   - Identify all forms and data display components
   - Extract field names, types, validation rules

4. **Build Contract Matrix**
   - For each data flow (Screen → API → DB):
     - List all fields at each layer
     - Compare types, nullability, enums, precision, dates/timezones

5. **Detect Mismatches**
   - Type mismatches, nullability issues, enum drift
   - Precision loss, timezone issues, missing validation

6. **Verify Validation Coverage**
   - Check that all DB constraints have corresponding validations
   - Identify gaps where validation is missing

7. **Generate Contract Matrix Report**
   - Create table showing data flow for each entity
   - Highlight mismatches and show validation coverage percentage

8. **Propose Fixes**
   - For each mismatch, suggest fix with code snippets
