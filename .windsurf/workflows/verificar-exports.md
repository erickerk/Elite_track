# Export Verification Audit

Verifies that PDF, Excel, and CSV exports contain data that matches the UI and source-of-truth.

## Steps

1. **Detect Export Features**
   - Search for export functionality (PDF, Excel, CSV)
   - List all export types and data they contain

2. **If No Exports Found**
   - Mark audit as N/A and skip remaining steps

3. **For Each Export Feature:**
   - **Trigger Export**: Navigate to screen, click export, verify file created
   - **Parse Export File**: Extract all data values using appropriate parser
   - **Query Source-of-Truth**: Run the query that generates export data
   - **Compare Data**: Match export values to source-of-truth
   - **Verify UI Consistency**: Compare export data to UI display

4. **Check Formatting & Locale**
   - Dates: format, timezone handling
   - Numbers: decimal places, thousands separators
   - Currency: symbol, position, precision

5. **Identify Issues**
   - Data mismatches, formatting issues, sorting issues, stale data

6. **Create Automated Tests**
   - For each export: trigger, parse, compare, verify formatting

7. **Document Findings**
   - For each issue: export feature, type of mismatch, expected vs actual, severity

8. **Propose Fixes**
   - Root cause and code for each issue
