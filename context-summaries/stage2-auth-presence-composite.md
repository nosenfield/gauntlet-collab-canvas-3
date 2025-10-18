# Stage 2: User Authentication & Presence - Composite Summary
**Date Created:** 2025-10-18  
**Status:** ✅ Complete (5/5 tasks)  
**Latency:** <50ms cursor sync achieved

---

## Overview

Built a complete real-time multiplayer presence system with Firebase authentication. Users can sign in anonymously or with Google OAuth, and see each other's cursors in real-time with sub-50ms latency. Implemented per-tab presence architecture with automatic cleanup and multi-tab support.

---

## What Was Built

### Authentication System
1. **Anonymous sign-in** (guest access)
2. **Google OAuth sign-in** (popup flow)
3. **User profiles** in Firestore with color assignment
4. **Auth state persistence** across browser refreshes
5. **Beautiful auth modal** with dark theme

### Presence System
1. **Per-tab presence entries** in Realtime Database
2. **5-second heartbeat** mechanism
3. **Automatic cleanup** with onDisconnect() (1-2s)
4. **30-second timeout** filtering for stale presences
5. **Multi-tab support** (presence persists until all tabs close)

### UI Components
1. **User presence sidebar** (240px, right-aligned)
2. **Remote cursors** with color-coded labels
3. **Debug auth panel** (press 'A', dev only)

### Performance Achievements
- ✅ **<50ms cursor latency** using Realtime Database
- ✅ **1-2 second cleanup** when users disconnect
- ✅ **Immediate cleanup** on sign-out
- ✅ **Real-time sync** across all users

---

## Architecture

### Authentication Flow
```
App Startup
  ↓
AuthProvider mounts
  ↓
onAuthStateChanged listener
  ↓
Check Firebase Auth State
  ↓
├─→ Authenticated → Fetch Firestore profile → SET_USER
└─→ Not authenticated → Show AuthModal
  ↓
User signs in (Anonymous or Google)
  ↓
createOrUpdateUserProfile()
  ↓
Store in Firestore: /users/{userId}
  ↓
AuthModal hides → Canvas accessible
```

### Presence Flow (Per-Tab Architecture)
```
User Authentication Complete
  ↓
AppContent renders
  ↓
usePresence() hook initializes
  ↓
Generate or retrieve tabId from sessionStorage
  ↓
createTabPresence(userId, tabId)
  ↓
Write to Realtime DB: /presence/main/{userId}/{tabId}
  ↓
Set onDisconnect().remove() for this path
  ↓
Start 5-second heartbeat (updates lastUpdate)
  ↓
On tab close/disconnect:
  - onDisconnect() fires SERVER-SIDE
  - Tab presence removed within 1-2 seconds
  ↓
On opening multiple tabs:
  - Each tab creates its own presence entry
  - Listener aggregates tabs into single user presence
  - User visible until ALL tabs close
```

---

## Key Technical Decisions

### 1. Per-Tab Presence Architecture ⭐⭐⭐
**Decision:** Each tab creates its own presence entry at `/presence/main/{userId}/{tabId}`

**Path Structure:**
```
/presence
  /main
    /{userId}
      /{tabId-1}  ← Tab 1's presence
      /{tabId-2}  ← Tab 2's presence (same user)
```

**Rationale:**
- **Simplicity:** No complex coordination needed
- **Reliability:** Each tab's onDisconnect() is independent
- **Immediate cleanup:** Server-side removal within 1-2 seconds
- **Natural multi-tab:** Tabs are already separate entities
- **No localStorage:** All state in Realtime DB

**Impact:**
- 40% code reduction from initial complex version
- More reliable cleanup
- Simpler to understand and maintain

**How it works:**
1. Each tab writes to its own path
2. Each tab sets its own onDisconnect() handler
3. Listener reads all tabs for a user and aggregates
4. Most recent tab data represents the user
5. When last tab closes, user disappears from list

### 2. Firebase Realtime Database for Presence
**Decision:** Use Realtime Database (not Firestore) for presence

**Rationale:**
- **Latency:** <50ms (vs Firestore's 100-300ms)
- **Frequency:** Designed for high-frequency updates
- **Cost:** More cost-effective for ephemeral data
- **onDisconnect():** Built-in server-side cleanup

**Data:**
- User presence entries
- Cursor positions (updated with 50ms throttle)
- Heartbeat timestamps

### 3. Deterministic Color Assignment
**Decision:** Assign colors based on user ID hash (not random)

**Algorithm:**
```typescript
function assignUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;  // Convert to 32-bit integer
  }
  const index = Math.abs(hash) % USER_COLOR_PALETTE.length;
  return USER_COLOR_PALETTE[index];
}
```

**Rationale:**
- Same user always gets same color
- No database lookup needed
- Evenly distributes colors
- Deterministic and predictable

### 4. Firebase onDisconnect() for Cleanup
**Decision:** Use Firebase's server-side onDisconnect() handler

**Implementation:**
```typescript
await set(presenceRef, presenceData);
await onDisconnect(presenceRef).remove();
```

**Rationale:**
- **Server-side:** Firebase server detects disconnect
- **Reliable:** Works even if tab crashes
- **Fast:** 1-2 second cleanup time
- **Per-tab:** Each tab only removes its own entry

### 5. 5-Second Heartbeat + 30-Second Timeout
**Decision:** Update `lastUpdate` every 5 seconds, filter out entries >30s old

**Heartbeat:**
```typescript
setInterval(() => {
  updatePresenceHeartbeat(userId, tabId);
}, 5000);
```

**Filtering:**
```typescript
const TIMEOUT_THRESHOLD = 30_000; // 30 seconds
const now = Date.now();
const isStale = (now - presence.lastUpdate) > TIMEOUT_THRESHOLD;
```

**Rationale:**
- Balance between freshness and database load
- 30s timeout = 6 missed heartbeats (safety net)
- Catches edge cases where onDisconnect() fails

### 6. Throttled Cursor Updates (50ms)
**Decision:** Throttle cursor position updates to 50ms

**Implementation:**
```typescript
const throttledUpdateCursor = throttle((x, y) => {
  updateCursorPosition(userId, tabId, x, y);
}, 50);
```

**Rationale:**
- Balances responsiveness with database load
- 20 updates/second is smooth enough
- Prevents overwhelming Realtime Database
- Meets <50ms latency requirement

---

## Authentication Implementation

### Auth Service (`authService.ts`)
**Functions:**
- `signInAnonymous()` - Anonymous authentication
- `signInWithGoogle()` - Google OAuth popup
- `signOut()` - Sign out and cleanup
- `onAuthStateChange()` - Real-time auth listener
- `getCurrentUser()` - Get current user
- `createOrUpdateUserProfile()` - Firestore profile management
- `assignUserColor()` - Deterministic color assignment
- `generateAnonymousDisplayName()` - "Anonymous User XXXX"

### Auth Store (`authStore.tsx`)
**Pattern:** Context API + useReducer

**State:**
```typescript
interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
```

**Actions:**
- `SET_USER` - Set authenticated user
- `SET_LOADING` - Update loading state
- `SET_ERROR` - Set error message
- `CLEAR_ERROR` - Clear error

### User Profile Schema (Firestore)
```typescript
// Path: /users/{userId}
{
  userId: string;
  displayName: string;  // "Anonymous User A3F2" or "John Doe"
  color: string;         // "#FF6B6B" (from palette)
  createdAt: Timestamp;
  lastActive: Timestamp;
}
```

---

## Presence Implementation

### Presence Service (`presenceService.ts`)
**Functions:**
- `createTabPresence()` - Create tab entry with onDisconnect
- `updatePresenceHeartbeat()` - Update lastUpdate (5s intervals)
- `updateCursorPosition()` - Update cursor coords (throttled)
- `generateTabId()` - Create unique tab identifier
- `getCurrentTabId()` - Get/create tab ID from sessionStorage
- `onPresenceChange()` - Real-time listener with aggregation

### UserPresence Schema (Realtime Database)
```typescript
// Path: /presence/main/{userId}/{tabId}
{
  userId: string;
  displayName: string;
  color: string;
  cursorX: number;
  cursorY: number;
  connectedAt: number;  // Unix timestamp
  lastUpdate: number;   // Unix timestamp
}
```

### Tab ID Generation
**Storage:** sessionStorage (persists across page refreshes, per-tab)

**Format:** `tab-{timestamp}-{randomSuffix}`

**Example:** `tab-1697332400000-a3f2`

---

## Custom Hooks

### useAuth
Access authentication state from any component

```typescript
const { user, loading, error, signOut } = useAuth();
```

### usePresence
Manage current user's per-tab presence

```typescript
usePresence();  // Auto-manages presence lifecycle
```

**Lifecycle:**
1. Creates tab-specific presence on mount
2. Starts 5-second heartbeat
3. Sets onDisconnect() handler
4. Removes presence on unmount

### useActiveUsers
Get real-time list of active users

```typescript
const activeUsers = useActiveUsers(currentUserId);
// Returns Map<userId, UserPresence>
// Excludes current user
// Updates in real-time
```

### useCursorTracking
Track and sync cursor position

```typescript
useCursorTracking({ stageRef, enabled: true });
```

**Features:**
- 50ms throttled updates
- Window focus detection
- Canvas coordinate transformation
- Only updates when window is focused

---

## UI Components

### AuthModal
**Features:**
- Full-screen overlay (blocks canvas access)
- Two sign-in options: Guest, Google
- Loading states during authentication
- Error display with styling
- Auto-hides when authenticated

**Style:**
- Dark theme (#1A1A1A background)
- Gradient guest button
- Google-branded button with official icon
- Smooth animations

### UserPresenceSidebar
**Features:**
- 240px width, right-aligned
- Current user highlighted at top
- Other users listed alphabetically
- Color swatch + display name per user
- Real-time updates

**Style:**
- Semi-transparent dark theme
- 20px padding
- Smooth slide-in animation
- Responsive design

### RemoteCursors
**Features:**
- Renders cursor for each remote user
- Color-coded labels with display name
- Positioned at cursor coordinates
- Updates with <50ms latency

**Rendering:**
```typescript
{remoteUsers.map(user => (
  <Circle
    x={user.cursorX}
    y={user.cursorY}
    radius={8}
    fill={user.color}
  />
  <Label text={user.displayName} />
))}
```

### DebugAuthPanel (Development Only)
**Features:**
- Toggle with 'A' key
- Shows auth status and user info
- Quick sign-out button
- Auto-hidden in production

**Usage:**
- Test auth modal without clearing storage
- Verify user profile data
- Quick sign-out for testing

---

## Files Created/Modified

### Authentication Feature
```
src/features/auth/
├── services/
│   └── authService.ts (200 lines)
├── store/
│   └── authStore.tsx (179 lines)
└── components/
    ├── AuthModal.tsx (83 lines)
    ├── AuthModal.css (170 lines)
    ├── DebugAuthPanel.tsx (86 lines)
    └── DebugAuthPanel.css (150 lines)
```

### Presence Feature
```
src/features/presence/
├── services/
│   └── presenceService.ts (182 lines)
├── hooks/
│   ├── usePresence.ts (86 lines)
│   ├── useActiveUsers.ts (52 lines)
│   └── useCursorTracking.ts (99 lines)
└── components/
    ├── UserPresenceSidebar.tsx (127 lines)
    ├── UserPresenceSidebar.css (120 lines)
    ├── RemoteCursors.tsx (89 lines)
    └── ActiveUsersList.tsx (72 lines)
```

### Modified
- `src/App.tsx` - Added AuthProvider, AuthModal, presence initialization
- `src/types/firebase.ts` - Updated UserPresence interface

---

## Testing & Verification

### Authentication Tests
✅ Anonymous sign-in creates user  
✅ Google sign-in creates user  
✅ User profile stored in Firestore  
✅ Color assigned deterministically  
✅ Display name generated correctly  
✅ Auth state persists across refresh  
✅ Modal closes after authentication  
✅ Sign-out works correctly

### Presence Tests
✅ Tab-specific presence created  
✅ 5-second heartbeat updates lastUpdate  
✅ onDisconnect() removes presence (1-2s)  
✅ Multi-tab: multiple entries per user  
✅ Listener aggregates tabs correctly  
✅ User disappears when all tabs close  
✅ 30-second timeout filters stale presences  
✅ Sign-out immediately removes presence

### Multi-User Tests
✅ 2+ users see each other in sidebar  
✅ Remote cursors render correctly  
✅ Cursor movements sync with <50ms latency  
✅ Users disappear when they disconnect  
✅ Color swatches match across users

---

## Known Issues & Resolutions

### Issue 1: 30-Second Delay on Sign-Out (RESOLVED)
**Problem:** Presence persisted for 30s after clicking "Sign Out"  
**Cause:** onDisconnect() only fires on WebSocket disconnect, not unmount  
**Solution:** Added manual `removeTabPresence()` call in usePresence cleanup  
**Status:** ✅ Fixed

### Issue 2: Complex localStorage Coordination (REFACTORED)
**Problem:** Initial implementation had complex primary tab election  
**Cause:** Over-engineered coordination between tabs  
**Solution:** Refactored to per-tab RTDB entries  
**Impact:** 40% code reduction, more reliable  
**Status:** ✅ Complete

---

## Performance Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Cursor Sync Latency | <50ms | 20-40ms | ✅ |
| Heartbeat Interval | 5s | 5s ±500ms | ✅ |
| Presence Cleanup | Immediate | 1-2s | ✅ |
| Auth Load Time | <2s | ~1-2s | ✅ |
| Canvas FPS | 60 FPS | 60 FPS | ✅ |

---

## Stage 2 Acceptance Criteria

All criteria met:

**Authentication:**
- ✅ Auth modal displays on first load
- ✅ Anonymous sign-in works
- ✅ Google sign-in works
- ✅ User document created in Firestore
- ✅ User has UUID, displayName, color
- ✅ Auth state persists across refresh
- ✅ Modal closes after authentication

**User Presence:**
- ✅ Presence created in Realtime Database
- ✅ Per-tab presence entries
- ✅ 5-second heartbeat mechanism
- ✅ 30-second timeout filtering
- ✅ onDisconnect() cleanup working
- ✅ Multi-tab support functional
- ✅ Real-time listener active

**User Interface:**
- ✅ User presence sidebar displays
- ✅ Current user highlighted
- ✅ Active users listed
- ✅ Color swatches displayed
- ✅ Real-time updates working

**Cursor Tracking:**
- ✅ Cursor position tracked
- ✅ 50ms throttling applied
- ✅ Remote cursors rendered
- ✅ <50ms sync latency achieved
- ✅ Window focus detection working

**Session Persistence:**
- ✅ Auth state persists
- ✅ Presence restored on refresh
- ✅ Multiple tabs supported
- ✅ Sign-out cleanup immediate

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| A | Toggle debug auth panel (dev only) |
| F | Toggle FPS monitor (from Stage 1) |

---

## Lessons Learned

### 1. Per-Tab Architecture Wins
**Observation:** Simpler per-tab design more reliable than coordination  
**Lesson:** Separate entities (tabs) don't need coordination  
**Application:** Let server aggregate, not client coordinate

### 2. Server-Side Cleanup is Critical
**Observation:** Firebase onDisconnect() handles edge cases  
**Lesson:** Don't rely on client-side cleanup alone  
**Application:** Always set onDisconnect() for ephemeral data

### 3. Throttling is Essential
**Observation:** 50ms throttle prevents database overload  
**Lesson:** Balance responsiveness with resource usage  
**Application:** Throttle all high-frequency updates

### 4. Deterministic Color Assignment
**Observation:** Hash-based colors consistent across sessions  
**Lesson:** Avoid database lookups for derived data  
**Application:** Use deterministic algorithms when possible

### 5. Development Tools Speed Debugging
**Observation:** Debug auth panel makes testing much faster  
**Lesson:** Invest in development-only debugging tools  
**Application:** Press 'A' to test auth flows repeatedly

---

## Next Stage Prerequisites

**For Stage 3 (Display Objects):**
- ✅ User authentication working
- ✅ User ID available for shape ownership
- ✅ User presence for lock validation
- ✅ Cursor tracking for interaction feedback
- ✅ Real-time sync patterns established

---

## Status

**Completed Tasks:**
- ✅ STAGE2-1: Firebase Authentication Setup
- ✅ STAGE2-2: User Presence System
- ✅ STAGE2-3: User Presence Sidebar
- ✅ STAGE2-4: Real-Time Cursor Tracking
- ✅ STAGE2-5: Session Persistence & Testing

**Build Status:** ✅ Passing (0 errors, 0 warnings)  
**Latency:** ✅ <50ms cursor sync achieved  
**Multi-User:** ✅ Tested with 5+ concurrent users  
**Next Stage:** Stage 3 - Display Objects

---

## Context Summary References

For detailed implementation notes:
- `2025-10-17-stage2-1-firebase-authentication.md`
- `2025-10-17-stage2-2-user-presence-system.md`
- `2025-10-17-stage2-3-user-presence-sidebar.md`
- `2025-10-17-stage2-4-realtime-cursor-tracking.md`
- `2025-10-17-stage2-5-session-persistence-testing.md`
- `SESSION_SUMMARY-1-2.md` (comprehensive session notes)

