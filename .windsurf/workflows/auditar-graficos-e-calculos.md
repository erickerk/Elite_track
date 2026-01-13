# Charts and Calculations Audit

Verifies that charts, totals, percentages, and derived metrics are calculated correctly.

## Steps

1. **Identify Charts and Calculations**
   - Search for chart components
   - List all charts: type, data source, calculations, aggregations
   - Identify calculation utilities: sum, average, median, percentages

2. **Map Data Sources**
   - For each chart/calculation: source query, aggregation logic, transformations

3. **Verify Calculation Logic**
   - **Unit Test Calculations**: Create tests with known inputs/outputs, test edge cases
   - **Check for Common Issues**: Floating-point precision, division by zero, null handling

4. **Verify Chart Data**
   - **Query Source-of-Truth**: Run underlying query, perform same aggregations
   - **Compare Chart Values**: Extract values from chart, compare to expected values
   - **Visual Verification**: Take screenshot, check for visual anomalies

5. **Check Timezone & Locale Issues**
   - **Timezone**: Verify date/time calculations respect timezone, test with different timezones
   - **Locale**: Verify number formatting (decimal separator, thousands separator, currency)

6. **Identify Calculation Errors**
   - Document each error: chart/calculation, expected vs actual, root cause, severity

7. **Create E2E Tests**
   - For each critical chart: load page, extract values, query source-of-truth, assert match

8. **Propose Fixes**
   - Root cause analysis, code, unit test for each issue
