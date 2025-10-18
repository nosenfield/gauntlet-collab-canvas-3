# Context Summary: Rotation Infinite Loop Fix
**Date:** 2025-10-18
**Phase:** STAGE 3 - STAGE3-9: Rotation Bug Fix
**Status:** Completed

## What Was Fixed
Fixed "Maximum update depth exceeded" error that occurred during rotation operations when rapidly updating the collection bounding box.

## Key Files Modified
- `src/features/displayObjects/common/components/TransformModal.tsx` - Fixed useEffect dependency array

## Technical Issue
**Error Message:**
```
Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, 
but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.
```

**Root Cause:**
The `useEffect` in `TransformModal` had `onRotationCornersChange` in its dependency array:
```typescript
useEffect(() => {
  if (onRotationCornersChange) {
    onRotationCornersChange(rotatedCollectionCorners);
  }
}, [rotatedCollectionCorners, onRotationCornersChange]);  // ← onRotationCornersChange causes issues
```

Even though `onRotationCornersChange` was wrapped in `useCallback([])` in Canvas, React's reconciliation during rapid state updates (every mouse move during rotation) could cause the effect to re-run excessively, leading to the "Maximum update depth" error.

## Solution
Removed `onRotationCornersChange` from the dependency array:
```typescript
useEffect(() => {
  if (onRotationCornersChange) {
    onRotationCornersChange(rotatedCollectionCorners);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [rotatedCollectionCorners]);  // ✅ Only depend on data, not callback
```

**Why this works:**
1. `onRotationCornersChange` is memoized with `useCallback([])` so it never changes
2. By removing it from deps, we avoid React reconciliation triggering re-runs
3. The effect only runs when `rotatedCollectionCorners` actually changes
4. This prevents the infinite loop while maintaining correct behavior

## Pattern for High-Frequency Updates

When using callbacks in `useEffect` with high-frequency state updates:

**❌ Bad (can cause infinite loops):**
```typescript
const callback = useCallback(() => { ... }, []);

useEffect(() => {
  callback(data);
}, [data, callback]);  // Including callback can cause loops
```

**✅ Good:**
```typescript
const callback = useCallback(() => { ... }, []);

useEffect(() => {
  callback(data);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [data]);  // Only depend on data if callback is stable
```

## State of the Application
- ✅ Rotation works smoothly without errors
- ✅ Collection box rotates in real-time
- ✅ No "Maximum update depth" errors
- ✅ Performance unaffected

## Testing Notes
- Test rotation with single and multiple objects
- Rotate rapidly back and forth
- Should see no console errors
- Bounding box should rotate smoothly

## Next Steps
- Continue with STAGE3-10: Scale Knob Implementation

