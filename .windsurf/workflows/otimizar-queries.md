# Query Optimization Audit

Identifies the most-used and slowest queries and proposes optimizations.

## Steps

1. **Identify Most-Used Queries**
   - Search codebase for query patterns (ORM calls, raw SQL, GraphQL)
   - Count query frequency by grepping code references

2. **Detect Slow Queries**
   - If Supabase: use MCP to get performance stats
   - Else: parse slow query logs
   - Identify queries with long execution time or full table scans

3. **Analyze Query Patterns**
   - Check if all selected columns are needed
   - Verify pagination is implemented
   - Look for N+1 query patterns
   - Check index usage and JOIN optimization

4. **Run EXPLAIN ANALYZE**
   - For top 20 queries, run EXPLAIN ANALYZE
   - Identify bottlenecks: sequential scans, missing indexes, inefficient JOINs

5. **Propose Optimizations**
   - Select only needed columns
   - Add pagination
   - Fix N+1 queries
   - Suggest indexes
   - Optimize JOINs

6. **Create Measurement Plan**
   - For each optimization: baseline, target, measurement method

7. **Generate Migration Scripts**
   - Create migration files for index additions
   - Provide before/after code for query changes

8. **Estimate Impact**
   - Calculate potential improvements: query time reduction, database load reduction
