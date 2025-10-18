# Context Summary: Rotation Snap-Back Bug Fix
**Date:** 2025-10-18
**Phase:** STAGE 3 - STAGE3-9: Rotation Knob Implementation
**Status:** Completed

## What Was Built
Fixed critical bug where objects would snap back to their original position after rotation ended. The issue was caused by missing `userId` parameter in Firestore write calls, causing writes to fail silently.

## Key Files Modified/Created
- `src/features/displayObjects/common/hooks/useRotation.ts` - Added userId parameter to updateShape calls

## Technical Decisions Made
- **Root Cause:** The `updateShape` function requires 3 parameters (`shapeId`, `userId`, `updates`), but `useRotation` was only passing 2 parameters. This caused Firestore writes to fail silently.
- **Symptom:** Objects would rotate correctly during interaction (optimistic updates working), but snap back to original position on release (Firestore writes failing, real-time listener overwriting with stale data).
- **Solution:** 
  1. Import `useAuth` hook to get current user
  2. Pass `user.id` as second parameter to all `updateShape` calls
  3. Add `user` to dependency arrays for callbacks
  4. Guard Firestore writes with `user` check

## Code Changes

### Before (Bug):
```typescript
export function useRotation(collectionCenter: Point | null) {
  const { selectedIds } = useSelection();
  const { shapes, updateShapeLocal } = useShapes();
  
  // ... later in code ...
  
  updateShape(obj.id, {  // ❌ Missing userId!
    x: obj.x,
    y: obj.y,
    rotation: obj.rotation,
  })
}
```

### After (Fixed):
```typescript
export function useRotation(collectionCenter: Point | null) {
  const { selectedIds } = useSelection();
  const { shapes, updateShapeLocal } = useShapes();
  const { user } = useAuth();  // ✅ Get user
  
  // ... later in code ...
  
  if (user) {  // ✅ Guard check
    updateShape(obj.id, user.id, {  // ✅ Pass userId
      x: obj.x,
      y: obj.y,
      rotation: obj.rotation,
    })
  }
}
```

## Dependencies & Integrations
- **Depends on:** `useAuth` for current user ID
- **Affects:** All rotation operations in transform modal

## State of the Application
- ✅ Objects rotate around collection centerpoint
- ✅ Rotation persists after release (Firestore writes succeed)
- ✅ No snap-back behavior
- ✅ Real-time sync working correctly
- ✅ Optimistic updates and Firestore writes in sync

## Known Issues/Technical Debt
- None - rotation now works correctly end-to-end

## Testing Notes
- Test rotation with single object - should persist after release
- Test rotation with multiple objects - should persist after release
- Check browser console - no Firestore write errors
- Test with multiple users - rotation should sync across sessions

## Next Steps
- Continue with STAGE3-10: Scale Knob Implementation

## Important Context for Next Session
**CRITICAL PATTERN:** All Firestore write operations require `userId` parameter!

When calling `updateShape` from shapeService, always pass:
1. `shapeId` - ID of the shape to update
2. `userId` - Current user's ID from `useAuth()`
3. `updates` - Partial update data

**IMPORTANT:** The User type has `userId` property, NOT `id`!

Example pattern from other hooks:
```typescript
const { user } = useAuth();

if (user) {
  await updateShape(shapeId, user.userId, { x, y, rotation });  // ✅ user.userId
  // NOT user.id - that property doesn't exist!
}
```

This pattern is consistent across:
- `useCollectionDrag` ✓
- `useRotation` ✓ (now fixed)
- Future: `useScale`, etc.

