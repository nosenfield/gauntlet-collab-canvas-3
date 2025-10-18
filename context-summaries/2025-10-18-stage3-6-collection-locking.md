# Context Summary: STAGE3-6 Collection-Level Locking
**Date:** 2025-10-18  
**Phase:** Stage 3 - Display Objects (Universal Editing)  
**Status:** Completed

## What Was Built
Implemented a comprehensive collaborative locking system to prevent editing conflicts when multiple users work on the same canvas. The system provides atomic collection locking (all-or-none), automatic lock management, heartbeat mechanism, and stale lock cleanup.

## Key Files Created

### 1. **`src/features/displayObjects/common/services/lockService.ts`** (450+ lines)
Complete lock management service with:

- **`checkLockAvailability(objectIds, userId)`** - Check if objects can be locked
  - Returns availability status and conflict details
  - Checks for stale locks (>60s old)
  - Returns Map of locked objects and conflicting users

- **`lockCollection(objectIds, userId)`** - Atomically lock multiple objects
  - All-or-none transaction using Firestore transactions
  - Pre-check optimization to avoid unnecessary transactions
  - Double-check in transaction for race condition safety
  - Returns true if all locks acquired, false on conflicts

- **`releaseCollection(objectIds, userId)`** - Release locks on objects
  - Batch writes for efficiency
  - Only releases locks owned by the requesting user
  - Graceful handling of missing objects

- **`refreshLocks(objectIds, userId)`** - Update lock timestamps
  - Used by heartbeat to keep locks alive
  - Batch writes for performance
  - Only refreshes locks owned by the user

- **`releaseExpiredLocks()`** - Background cleanup of stale locks
  - Queries all locked objects
  - Releases locks older than 60 seconds
  - Returns count of released locks

- **`startLockHeartbeat(objectIds, userId)`** - Start heartbeat interval
  - Refreshes locks every 5 seconds
  - Returns cleanup function to stop heartbeat
  - Prevents lock timeout during active editing

- **`startLockCleanupService()`** - Start background cleanup
  - Runs every 30 seconds
  - Automatically releases expired locks
  - Returns cleanup function to stop service

### 2. **`src/features/displayObjects/common/hooks/useLocking.ts`** (170+ lines)
React hook that integrates locking with selection:

- **`tryLockAndSelect(objectIds)`** - Attempt to acquire locks before selection
  - Checks availability first
  - Logs conflicts with user details
  - Starts heartbeat on success
  - Returns boolean indicating success/failure

- **`releaseLocks()`** - Release all current locks
  - Stops heartbeat
  - Releases Firestore locks
  - Clears internal lock tracking

- **`canSelect(objectIds)`** - Check if objects can be selected
  - Non-blocking availability check
  - Used for UI feedback

- **Auto-release on selection clear** - useEffect monitors selectedIds
  - Automatically releases locks when selection is cleared
  - Ensures no orphaned locks

- **Cleanup on unmount** - useEffect cleanup
  - Releases all locks when component unmounts
  - Prevents locks from persisting after navigation

### 3. **`src/features/displayObjects/common/hooks/useLockToolIntegration.ts`** (30+ lines)
Hook to integrate locks with tool state:

- Monitors tool changes via `useTool()`
- Automatically releases locks when switching away from select tool
- Clears selection when entering creation modes
- Ensures users don't hold locks while drawing new shapes

## Key Files Modified

### 1. **`src/features/canvas/hooks/useCanvasInteractions.ts`**
Integrated locking into selection workflow:

- **Added `useLocking()` hook** - Access lock management functions
- **Updated `handleShapeClick()`** - Now async, checks locks before selection
  - Determines target selection (single or shift-click)
  - Calls `tryLockAndSelect()` before updating selection
  - Only selects if locks successfully acquired
  - Logs conflicts to console
- **Updated `handleStageMouseUp()`** - Marquee selection with locks
  - Attempts to lock all selected objects after marquee
  - Clears selection if any locks fail
  - Prevents partial selections on conflicts

### 2. **`src/features/canvas/components/Canvas.tsx`**
Added lock-tool integration:

- **Imported `useLockToolIntegration` hook**
- **Called hook in component body** - Automatic lock release on tool change
- Comment: "Release locks when switching away from select tool"

### 3. **`src/App.tsx`**
Started background lock cleanup service:

- **Imported `startLockCleanupService`**
- **Added useEffect in AppContent** - Starts cleanup service on mount
- **Cleanup function** - Stops service on unmount
- Runs every 30 seconds to remove stale locks

## Technical Decisions Made

### 1. Atomic Collection Locking
**Decision:** Use Firestore transactions for all-or-none locking  
**Rationale:**
- Prevents partial selections (some objects locked, others not)
- Ensures data consistency
- Avoids edge cases where user has mixed lock states

**Implementation:**
```typescript
await runTransaction(firestore, async (transaction) => {
  // Read all objects
  // Check all locks
  // Lock all or throw error
});
```

### 2. Pre-Check Optimization
**Decision:** Check lock availability before starting transaction  
**Rationale:**
- Transactions are expensive
- Most conflicts can be detected without transaction
- Provides faster feedback to users
- Reduces Firestore read/write costs

### 3. Lock Heartbeat (5 seconds)
**Decision:** Refresh locks every 5 seconds while selection is active  
**Rationale:**
- Timeout is 60 seconds
- 5-second interval provides safety margin
- Network delays accounted for (5s << 60s)
- Balance between reliability and Firestore writes

### 4. Stale Lock Timeout (60 seconds)
**Decision:** Locks expire after 60 seconds without refresh  
**Rationale:**
- Handles browser crashes
- Handles network disconnections
- Prevents indefinite locks from client failures
- 60s is long enough for temporary network issues

### 5. Background Cleanup Service (30 seconds)
**Decision:** Run cleanup every 30 seconds at app level  
**Rationale:**
- Ensures locks don't accumulate from crashes
- 30s interval catches expired locks promptly
- App-level service (not per-user) reduces overhead
- One cleanup serves all users on same client

### 6. Release on Tool Change
**Decision:** Automatically release locks when switching to creation tools  
**Rationale:**
- Users can't edit selected objects while drawing
- Prevents holding unnecessary locks
- Improves collaboration (others can select)
- Clear user intent separation (select vs create)

### 7. Release on Selection Clear
**Decision:** Monitor selectedIds and release when empty  
**Rationale:**
- Deselecting indicates user is done editing
- Frees locks immediately for other users
- Natural user behavior mapping
- No manual release required

### 8. Release on Unmount
**Decision:** Release all locks when component unmounts  
**Rationale:**
- Handles navigation away from canvas
- Prevents locks from persisting across routes
- Component lifecycle tied to lock lifecycle
- Graceful cleanup

## Lock Conflict Handling

### User Experience Flow:

1. **User A selects shape** → Lock acquired ✓
2. **User B tries to select same shape** → Lock check fails ✗
3. **Console warning logged** with User A's ID
4. **Selection not updated** for User B
5. **User A's lock times out** (if inactive for 60s)
6. **User B can now select** the shape

### Conflict Logging:
```typescript
console.warn(
  `[useLocking] Cannot select object ${objectId}: ` +
  `locked by user ${lockedUserId}`
);
```

**TODO:** Add user-friendly UI notifications (toast/banner)

## Integration Points

### Selection System Integration:
- **Before**: `selectShape()` → immediate selection
- **After**: `tryLockAndSelect()` → lock check → selection (if successful)

### Tool System Integration:
- **Before**: Tool change → selection persists
- **After**: Tool change → locks released → selection cleared

### Presence System Integration:
- **Lock heartbeat** uses similar pattern to presence heartbeat
- **Both run at 5-second intervals**
- **Both have automatic cleanup mechanisms**

## Data Model Updates

### BaseDisplayObject (Already Existed):
```typescript
interface BaseDisplayObject {
  // ... existing fields
  lockedBy: string | null;      // User ID or null
  lockedAt: Timestamp | null;   // Lock acquisition time
}
```

**No schema changes required** - fields already in data model from earlier stages.

## Performance Considerations

### Firestore Operations:

| Operation | Frequency | Cost |
|-----------|-----------|------|
| Lock acquisition | Per selection change | 1-2 reads + 1 transaction write |
| Lock heartbeat | Every 5s (per selection) | N batch writes |
| Lock release | Per deselection | N batch writes |
| Cleanup service | Every 30s (app-wide) | 1 query + N writes |

**Optimizations:**
- Batch writes wherever possible (release, refresh, cleanup)
- Pre-check before transactions (reduces failed transaction costs)
- Single cleanup service (not per-user)
- Only query locked objects (not all shapes)

### Memory Usage:
- **Per selection:** ~1 interval (heartbeat)
- **App-wide:** 1 interval (cleanup service)
- **Tracked state:** Array of locked IDs (refs only)

## Known Issues / Technical Debt

### 1. Hardcoded to Shapes Collection
**Issue:** Lock service currently only works with shapes  
**Location:** `lockService.ts` lines querying `'documents/main/shapes'`  
**TODO:** Make generic for all display object types (text, images)  
**Workaround:** None needed until Stage 4 (text objects)

### 2. No User-Friendly Notifications
**Issue:** Lock conflicts only logged to console  
**Location:** `useCanvasInteractions.ts` conflict handling  
**TODO:** Implement toast/banner notifications  
**Impact:** Users don't see visual feedback for conflicts

### 3. Lock Availability Check Race Condition
**Issue:** Pre-check and transaction check could have race window  
**Mitigation:** Transaction provides authoritative check  
**Impact:** Minimal - transaction prevents actual conflicts  
**Acceptable:** Pre-check is optimization, not critical

### 4. No Lock Ownership Visualization
**Issue:** Users can't see who has locked an object  
**TODO:** Add lock indicator icons on locked shapes  
**Planned:** STAGE3-8 or later visual indicators

## Testing Notes

### Manual Testing Checklist:
- [ ] Open 2 browser windows as different users
- [ ] User A selects shape → lock acquired
- [ ] User B tries to select same shape → denied
- [ ] Check console for conflict warnings
- [ ] User A deselects → lock released
- [ ] User B can now select shape
- [ ] User A selects and holds > 60s → lock expires
- [ ] User B can steal lock after timeout
- [ ] User A switches tool → lock released
- [ ] User B can select shape

### Edge Cases to Test:
- **Network disconnect** during lock hold
- **Browser crash** while holding locks
- **Rapid selection changes** (lock/unlock/lock)
- **Marquee select** with mixed locked/unlocked objects
- **Shift-click** adding locked objects to selection

## Next Steps

### Immediate (This Stage):
- ✅ STAGE3-7: Collection Drag (already complete)
- ⏸️ STAGE3-8: Transform Modal UI (next task)
- Integration of lock indicators in transform modal

### Future Enhancements:
- **User-friendly notifications** for lock conflicts
- **Visual lock indicators** on shapes (padlock icon)
- **Lock stealing** with user confirmation dialog
- **Lock timeout warnings** before expiration
- **Generic display object support** for text/images

## Code Patterns for Reference

### Starting a Lock Heartbeat:
```typescript
const stopHeartbeat = startLockHeartbeat(selectedIds, userId);
// ... later
stopHeartbeat(); // Stop heartbeat
```

### Checking and Acquiring Locks:
```typescript
const { tryLockAndSelect } = useLocking();
const success = await tryLockAndSelect(objectIds);
if (success) {
  // Locks acquired, proceed with selection
} else {
  // Conflicts exist, handle gracefully
}
```

### Automatic Lock Release (useEffect):
```typescript
useEffect(() => {
  if (selectedIds.length === 0) {
    releaseLocks(); // Auto-release when selection clears
  }
}, [selectedIds, releaseLocks]);
```

### Lock-Tool Integration:
```typescript
useEffect(() => {
  if (!isSelectMode()) {
    releaseLocks();    // Release locks
    clearSelection();  // Clear selection
  }
}, [currentTool, isSelectMode, releaseLocks, clearSelection]);
```

## Acceptance Criteria

- ✅ **Lock acquisition is atomic** - All objects locked or none
- ✅ **Conflicts logged with user info** - Console warnings include user IDs
- ✅ **Conflicts prevent selection** - Failed lock blocks selection change
- ✅ **No partial selections on conflict** - Transaction ensures atomicity
- ✅ **Locks release on deselect** - Automatic via useEffect
- ✅ **Locks release on sign-out** - Component unmount cleanup
- ✅ **Locks release on tool change** - useLockToolIntegration hook
- ✅ **Locks auto-release after 60s** - Stale lock timeout
- ✅ **Heartbeat updates every 5s** - startLockHeartbeat interval
- ✅ **Stale locks cleaned up** - Background service every 30s

## Summary

STAGE3-6 provides a robust foundation for collaborative editing by preventing edit conflicts through:
- **Atomic locking** (all-or-none transactions)
- **Automatic management** (heartbeat, cleanup, release)
- **Graceful conflict handling** (checks before selection)
- **Multiple safety mechanisms** (timeout, cleanup service, unmount)

The locking system is transparent to users during normal operation (locks acquired on selection, released on deselection) but prevents conflicts when multiple users interact with the same objects.

**Next task:** STAGE3-8 (Transform Modal UI) will add visual transform controls to the locked selections.

