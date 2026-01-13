# Fix and Regression Testing Workflow

Takes the consolidated issue list from the master report and implements fixes in small PR-sized chunks.

## Steps

1. **Load Master Report**
   - Read consolidated issue list
   - Parse issues by severity, category, affected area

2. **Prioritize Fixes**
   - Sort by severity, business impact, dependencies
   - Group into PR-sized chunks (1-3 related issues per chunk)

3. **For Each Fix Chunk:**
   - **Create Feature Branch**: `fix/[category]-[issue-ids]`
   - **Implement Fixes**: Follow project conventions, add comments, update docs
   - **Add/Extend Tests**: Unit, integration, E2E tests for each fix
   - **Run Tests Locally**: Verify all tests pass, check coverage
   - **Code Review Checklist**: Style guide, no secrets, error handling, edge cases
   - **Commit and Push**: Clear commit message with issue IDs
   - **Create Pull Request**: List issues fixed, link to master report, testing performed

4. **Re-run Relevant Workflows**
   - For each fix category, run corresponding audit workflow
   - Verify issues are resolved

5. **Track Progress**
   - Maintain fix status: TODO, IN_PROGRESS, REVIEW, TESTING, DONE
   - Update progress report daily

6. **Handle Regressions**
   - Document new issues in regression log
   - Fix CRITICAL issues immediately

7. **Final Verification**
   - Run full `/qa-sincronia-master` again
   - Verify all original issues resolved

8. **Generate Regression Report**
   - Summary: total issues fixed, PRs merged, tests added, coverage improvement
   - Remaining issues, new issues found, recommendations
