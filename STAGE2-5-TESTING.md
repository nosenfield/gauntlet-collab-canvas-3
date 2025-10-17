# STAGE2-5: Session Persistence & Testing

**Status:** In Progress  
**Date:** 2025-10-17

## Overview

This document provides comprehensive testing procedures for Stage 2 (User Authentication & Presence) features, with focus on session persistence, multi-tab behavior, and performance verification.

---

## ✅ Session Persistence Implementation Status

### Already Completed:
- ✅ **Per-Tab Presence Entries**: Each tab creates entry at `/presence/main/{userId}/{tabId}`
- ✅ **Firebase onDisconnect()**: Each tab sets its own cleanup handler
- ✅ **Tab ID in sessionStorage**: Persists across page refreshes
- ✅ **Immediate Cleanup**: Server-side removal within 1-2 seconds
- ✅ **Multi-Tab Support**: Natural support via separate entries
- ✅ **30-Second Timeout**: Safety net for stale presences

### Architecture Summary:
```
Per-Tab Presence Model:
- Path: /presence/main/{userId}/{tabId}
- Each tab has individual onDisconnect() handler
- Listener aggregates tabs per user
- Presence persists until ALL tabs close
- Cleanup: 1-2 seconds (server-side)
```

---

## 🧪 Testing Checklist

### 1. Multi-Tab Behavior ✓

#### Test 1.1: Multiple Tabs - Same User
**Steps:**
1. Open browser window (Tab 1)
2. Sign in as User A
3. Open DevTools → Console
4. Note the console output: "Creating tab presence: tab-..."
5. Open Firebase Console → Realtime Database
6. Navigate to `/presence/main/{userId}/`
7. Verify ONE tab entry exists

**Expected Results:**
- ✅ Console shows: `📝 Creating tab presence: tab-[timestamp]-[random]`
- ✅ Console shows: `✅ Tab presence created with auto-cleanup`
- ✅ Firebase shows single entry at `/presence/main/{userId}/{tabId}`
- ✅ Entry contains: userId, displayName, color, cursorX, cursorY, connectedAt, lastUpdate

**Status:** [ ] Pass [ ] Fail

---

#### Test 1.2: Second Tab - Same User
**Steps:**
1. With Tab 1 still open, open Tab 2 (same browser)
2. Tab 2 should auto-sign in (persistent session)
3. Check console in Tab 2
4. Check Firebase Realtime Database

**Expected Results:**
- ✅ Tab 2 auto-signs in (no auth modal)
- ✅ Console shows new tab presence being created
- ✅ Firebase now shows TWO entries:
  - `/presence/main/{userId}/{tabId1}`
  - `/presence/main/{userId}/{tabId2}`
- ✅ Both entries have same userId, displayName, color
- ✅ Both entries have different tabIds

**Status:** [ ] Pass [ ] Fail

---

#### Test 1.3: Close One Tab - Presence Persists
**Steps:**
1. With 2 tabs open for same user
2. Close Tab 1
3. Wait 2-3 seconds
4. Check Firebase Realtime Database
5. Check Tab 2 console

**Expected Results:**
- ✅ Tab 1's console shows: `🔴 Tab closing - onDisconnect will handle cleanup`
- ✅ Firebase: Tab 1's entry disappears within 1-2 seconds
- ✅ Firebase: Tab 2's entry still exists
- ✅ User still appears in UserPresenceSidebar
- ✅ User's cursor still visible (if cursor tracking enabled)

**Status:** [ ] Pass [ ] Fail

---

#### Test 1.4: Close Last Tab - User Disappears
**Steps:**
1. With only Tab 2 remaining open
2. Close Tab 2
3. Open another browser window (different user or incognito)
4. Check Firebase Realtime Database
5. Check UserPresenceSidebar in other window

**Expected Results:**
- ✅ Tab 2's console shows: `🔴 Tab closing - onDisconnect will handle cleanup`
- ✅ Firebase: User A's entry completely removed within 1-2 seconds
- ✅ No entries remain at `/presence/main/{userIdA}/`
- ✅ User A disappears from sidebar in other window
- ✅ User A's cursor disappears

**Status:** [ ] Pass [ ] Fail

---

#### Test 1.5: Page Refresh - Same Tab ID
**Steps:**
1. Open tab, sign in
2. Note the tab ID from console: `tab-[timestamp]-[random]`
3. Refresh the page (Cmd+R / Ctrl+R)
4. Note the new tab ID from console

**Expected Results:**
- ✅ Same tab ID before and after refresh
- ✅ Tab ID persists in sessionStorage
- ✅ Old presence entry is replaced (not duplicated)
- ✅ User remains in sidebar throughout refresh

**Status:** [ ] Pass [ ] Fail

---

### 2. Disconnect Handling ✓

#### Test 2.1: Network Disconnect Simulation
**Steps:**
1. Open tab, sign in
2. Open DevTools → Network tab
3. Set throttling to "Offline"
4. Wait 35 seconds
5. Open another browser window (incognito)
6. Check if disconnected user still appears

**Expected Results:**
- ✅ After 30 seconds, user is filtered out by timeout
- ✅ Other users don't see disconnected user in sidebar
- ✅ When network restored, presence recreates automatically

**Status:** [ ] Pass [ ] Fail

---

#### Test 2.2: Tab Crash Simulation
**Steps:**
1. Open tab, sign in
2. Open Firebase Realtime Database
3. Note presence entry location
4. In Chrome: chrome://crash-tab (or force kill tab process)
5. Wait 5 seconds
6. Check Firebase Realtime Database

**Expected Results:**
- ✅ Firebase onDisconnect() triggers server-side
- ✅ Presence entry removed within 1-2 seconds
- ✅ No stale presence remains

**Status:** [ ] Pass [ ] Fail

---

#### Test 2.3: Browser Close (Graceful)
**Steps:**
1. Open browser, sign in with 1 tab
2. Check Firebase for presence entry
3. Close entire browser window (not just tab)
4. Open another browser (incognito)
5. Check Firebase Realtime Database

**Expected Results:**
- ✅ Presence removed immediately (1-2 seconds)
- ✅ onDisconnect() fires reliably
- ✅ User disappears from other users' sidebars

**Status:** [ ] Pass [ ] Fail

---

### 3. Performance Measurements ⚡

#### Test 3.1: Cursor Update Latency (Realtime Database)
**Steps:**
1. Open 2 browser windows (2 different users)
2. Window 1: Move cursor on canvas
3. Window 2: Watch cursor in DevTools Network → WS (WebSocket)
4. Measure time from cursor move to update receipt

**Expected Results:**
- ✅ Latency: <50ms (typical: 20-40ms)
- ✅ Updates arrive via WebSocket
- ✅ Smooth cursor movement, no lag
- ✅ 50ms throttling working (max 20 updates/second)

**Actual Measurement:**
- Average latency: _____ ms
- Min latency: _____ ms
- Max latency: _____ ms

**Status:** [ ] Pass (<50ms) [ ] Fail (≥50ms)

---

#### Test 3.2: Presence Heartbeat Performance
**Steps:**
1. Open tab, sign in
2. Open Firebase Console → Realtime Database
3. Watch lastUpdate field
4. Measure update frequency

**Expected Results:**
- ✅ Updates every 5 seconds (±500ms)
- ✅ No missed heartbeats
- ✅ No errors in console
- ✅ Minimal CPU usage (<1%)

**Actual Measurement:**
- Heartbeat interval: _____ seconds
- CPU usage: _____ %

**Status:** [ ] Pass [ ] Fail

---

#### Test 3.3: Memory Leak Check
**Steps:**
1. Open DevTools → Memory tab
2. Take heap snapshot (Snapshot 1)
3. Open 3 tabs for same user
4. Close all tabs
5. Wait 10 seconds
6. Take heap snapshot (Snapshot 2)
7. Compare snapshots

**Expected Results:**
- ✅ No significant memory increase (< 5MB difference)
- ✅ Listeners properly cleaned up
- ✅ Intervals cleared
- ✅ No detached DOM nodes

**Actual Measurement:**
- Snapshot 1: _____ MB
- Snapshot 2: _____ MB
- Difference: _____ MB

**Status:** [ ] Pass [ ] Fail

---

#### Test 3.4: Realtime Database vs Firestore Comparison
**Steps:**
1. Open Firebase Console
2. Navigate to Realtime Database → presence/main
3. Watch cursor updates (cursorX, cursorY, lastUpdate)
4. Navigate to Firestore → users
5. Watch user document updates
6. Compare visual update speeds

**Expected Results:**
- ✅ Realtime Database updates: Near-instant (<50ms)
- ✅ Firestore updates: Slower (~100-300ms)
- ✅ Realtime Database noticeably faster for presence
- ✅ Firestore appropriate for persistent user data

**Observation:**
- RTDB cursor latency: _____ ms
- Firestore user update latency: _____ ms
- Difference: _____ ms

**Status:** [ ] Pass [ ] Fail

---

### 4. Sidebar UI Integration ✓

#### Test 4.1: Real-Time Updates
**Steps:**
1. Open 2 browser windows (Window A, Window B)
2. Sign in as different users
3. Watch UserPresenceSidebar in Window A
4. In Window B: Sign in/out, open/close tabs

**Expected Results:**
- ✅ User appears in sidebar immediately (<2 seconds)
- ✅ User disappears when all tabs close (<2 seconds)
- ✅ User count badge updates correctly
- ✅ Current user always at top (highlighted)
- ✅ Other users sorted alphabetically
- ✅ Color swatches display correctly

**Status:** [ ] Pass [ ] Fail

---

#### Test 4.2: Sidebar Persistence
**Steps:**
1. Open tab, sign in
2. Note users in sidebar
3. Refresh page
4. Check sidebar after reload

**Expected Results:**
- ✅ Sidebar rebuilds immediately
- ✅ Same users appear
- ✅ No flicker or flash of empty state
- ✅ Current user still highlighted

**Status:** [ ] Pass [ ] Fail

---

### 5. Cursor Tracking Integration ✓

#### Test 5.1: Cursor Position Updates
**Steps:**
1. Open 2 browser windows (different users)
2. Window 1: Move cursor on canvas
3. Window 2: Watch remote cursor

**Expected Results:**
- ✅ Remote cursor appears
- ✅ Cursor moves smoothly (not jumpy)
- ✅ Cursor position accurate
- ✅ User name label follows cursor
- ✅ Color matches user's assigned color

**Status:** [ ] Pass [ ] Fail

---

#### Test 5.2: Window Focus Detection
**Steps:**
1. Open 2 tabs for same user
2. Tab 1: Active, move cursor
3. Tab 2: Inactive (switch to different window)
4. Move mouse over Tab 2 window (while still inactive)
5. Check Firebase Realtime Database

**Expected Results:**
- ✅ Only Tab 1's cursor updates in RTDB
- ✅ Tab 2's cursor does NOT update (window not focused)
- ✅ No cursor updates from inactive windows
- ✅ Cursor resumes updating when Tab 2 becomes active

**Status:** [ ] Pass [ ] Fail

---

### 6. Edge Cases & Error Handling ⚠️

#### Test 6.1: Rapid Tab Open/Close
**Steps:**
1. Quickly open 5 tabs (same user)
2. Immediately close 3 tabs
3. Wait 5 seconds
4. Check Firebase Realtime Database

**Expected Results:**
- ✅ No duplicate entries
- ✅ Only 2 tab entries remain
- ✅ No orphaned entries
- ✅ No console errors

**Status:** [ ] Pass [ ] Fail

---

#### Test 6.2: Sign Out Behavior
**Steps:**
1. Open tab, sign in
2. Open DebugAuthPanel (press 'A')
3. Click "Sign Out"
4. Check Firebase Realtime Database

**Expected Results:**
- ✅ Presence removed immediately
- ✅ Auth modal reappears
- ✅ User disappears from other users' sidebars
- ✅ Console shows cleanup message

**Status:** [ ] Pass [ ] Fail

---

#### Test 6.3: Concurrent Sign-Ins
**Steps:**
1. Open 3 incognito windows simultaneously
2. In all 3: Click "Continue as Guest" at same time
3. Check Firebase Realtime Database
4. Check UserPresenceSidebar

**Expected Results:**
- ✅ 3 unique users created
- ✅ 3 unique colors assigned
- ✅ 3 unique display names
- ✅ All 3 appear in each other's sidebars
- ✅ No collisions or race conditions

**Status:** [ ] Pass [ ] Fail

---

## 📊 Stage 2 Acceptance Criteria

### STAGE2-1: Firebase Authentication ✓
- [x] Auth modal appears on first load
- [x] Anonymous sign-in works
- [x] Google sign-in works
- [x] User document created in Firestore `/users/{userId}`
- [x] User has UUID, displayName, and color
- [x] Auth state persists across browser refresh
- [x] Sign-out works correctly
- [x] User color assigned from palette

**Status:** COMPLETED ✅

---

### STAGE2-2: User Presence System ✓
- [x] Presence created in Realtime Database on authentication
- [x] Path: `/presence/main/{userId}/{tabId}`
- [x] Contains userId, displayName, color, cursor coords, timestamps
- [x] onDisconnect() handler set for each tab
- [x] 5-second heartbeat updates `lastUpdate`
- [x] 30-second timeout filters stale presences
- [x] Multi-tab support (presence persists until all tabs close)
- [x] Immediate cleanup (1-2 seconds) when last tab closes
- [x] Real-time listener active
- [x] useActiveUsers() hook available

**Status:** COMPLETED ✅

---

### STAGE2-3: User Presence Sidebar ✓
- [x] Sidebar visible on right side (240px wide)
- [x] Current user at top (highlighted)
- [x] Other users sorted alphabetically
- [x] Color swatch + display name for each user
- [x] User count badge
- [x] Real-time updates as users join/leave
- [x] Dark theme styling
- [x] Responsive (hidden on small screens)

**Status:** COMPLETED ✅

---

### STAGE2-4: Real-Time Cursor Tracking ✓
- [x] Local cursor position tracked
- [x] Cursor updates throttled to 50ms
- [x] Screen → Canvas coordinate transformation
- [x] Updates sent to Realtime Database
- [x] Remote cursors rendered for other users
- [x] Cursor icon + name label
- [x] Cursors colored per user
- [x] Cursors update smoothly
- [x] Window focus detection (no updates from inactive tabs)

**Status:** COMPLETED ✅

---

### STAGE2-5: Session Persistence & Testing ⚡
- [ ] User can open multiple tabs without duplicate presence
- [ ] Presence persists across tab switches
- [ ] Closing all tabs removes presence within 2 seconds
- [ ] Network disconnect triggers cleanup (or 30s timeout)
- [ ] Cursor updates are <50ms
- [ ] All Stage 2 acceptance criteria verified
- [ ] No console errors
- [ ] No memory leaks
- [ ] Realtime Database shows presence updating correctly

**Status:** IN PROGRESS 🔄

---

## 🐛 Known Issues

### Issues Found During Testing:
1. [None yet - will document as testing proceeds]

---

## 📝 Testing Notes

### Environment:
- Browser: _____________
- OS: _____________
- Firebase Project: _____________
- Date: _____________

### Test Conducted By:
- Name: _____________
- Role: _____________

### Overall Results:
- Tests Passed: ___ / ___
- Tests Failed: ___ / ___
- Success Rate: ____%

---

## ✅ Final Sign-Off

### Stage 2 Complete:
- [ ] All tests pass
- [ ] Performance metrics meet targets
- [ ] No critical bugs
- [ ] Documentation complete
- [ ] Ready for Stage 3

**Approved By:** _____________  
**Date:** _____________

---

## 📚 Reference Links

- **PRD**: `_docs/PRD.md`
- **Task List**: `_docs/TASK_LIST.md`
- **Architecture**: `_docs/ARCHITECTURE.md`
- **Context Summaries**: `context-summaries/`
- **Firebase Console**: [https://console.firebase.google.com](https://console.firebase.google.com)

---

**Next Step:** Begin Stage 3 (Display Objects / Shapes)

