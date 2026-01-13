# Realtime Data Integrity Audit

Verifies that realtime subscriptions correctly update the UI when database changes occur.

## Steps

1. **Detect Realtime Usage**
   - Search for subscription patterns (Supabase, Socket.io, WebSocket)
   - List all subscribed tables/channels/events
   - Identify components that consume realtime data

2. **If Realtime Not Used**
   - Mark audit as N/A
   - Recommend realtime strategy only if business requirements demand it

3. **Map Realtime Data Flows**
   - For each subscription: source, handler, state update, UI components

4. **Identify Potential Issues**
   - Race conditions, stale caches, state bugs
   - Memory leaks, duplicate subscriptions

5. **Create Realtime Test Suite**
   - Test 1: Open UI, trigger DB change, verify UI updates
   - Test 2: Multiple clients, verify all receive updates
   - Test 3: Rapid updates, verify no race conditions
   - Test 4: Reconnection after disconnect
   - Test 5: Subscription cleanup on unmount

6. **Implement Tests**
   - Use Playwright if available, else existing E2E framework

7. **Run Tests and Document Failures**
   - Execute all realtime tests
   - Capture failures with evidence

8. **Analyze Performance**
   - Measure update latency (DB change → UI update)
   - Check for excessive re-renders

9. **Propose Fixes**
   - Root cause analysis and code snippets for each issue
