# QA + Data Sync Master Orchestrator

Master workflow that orchestrates a complete audit of data synchronization, validation, and quality assurance across the entire application.

## Steps

1. **Initialize Audit Session**
   - Create audit report directory: `.windsurf/audit-reports/[timestamp]/`
   - Log detected project configuration
   - Verify all required tools are available

2. **Run Mock Data Audit**
   - Execute `/auditar-sem-mocks`
   - Capture results in `01-mock-data-audit.json`

3. **Run Data Contract Audit**
   - Execute `/auditar-contrato-de-dados`
   - Capture results in `02-data-contract-audit.json`

4. **Run Realtime Integrity Audit**
   - Execute `/auditar-integridade-realtime`
   - Capture results in `03-realtime-audit.json`

5. **Run Query Optimization Audit**
   - Execute `/otimizar-queries`
   - Capture results in `04-query-optimization.json`

6. **Run Screen-by-Screen QA**
   - Execute `/qa-tela-a-tela`
   - Capture results in `05-screen-qa.json`

7. **Run Export Verification**
   - Execute `/verificar-exports`
   - Capture results in `06-export-verification.json`

8. **Run Charts & Calculations Audit**
   - Execute `/auditar-graficos-e-calculos`
   - Capture results in `07-charts-calculations.json`

9. **Consolidate Results**
   - Aggregate all findings
   - Categorize by severity: CRITICAL, HIGH, MEDIUM, LOW
   - Group by affected area: UI, API, Database, Realtime, Exports, Calculations

10. **Generate Fix Plan**
    - Prioritize issues by severity and impact
    - Create PR-sized fix chunks
    - Estimate effort for each chunk

11. **Create Regression Checklist**
    - List all areas that need regression testing
    - Define acceptance criteria for each fix

12. **Generate Master Report**
    - Create `master-report.md` with executive summary, issues breakdown, fix plan, and regression checklist
