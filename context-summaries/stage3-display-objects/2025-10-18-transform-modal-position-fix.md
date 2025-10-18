# Context Summary: Transform Modal Position Fix
**Date:** 2025-10-18
**Phase:** STAGE3 (Transform Modal Interactions)
**Status:** Completed

## What Was Built
Fixed the transform modal position to stay fixed at the rotation/scale pivot point during transformations instead of tracking the dynamically changing AABB center. This prevents the modal from "wandering" during rotation operations.

## Key Files Modified
- `src/features/displayObjects/common/hooks/useRotation.ts` - Exposed `rotationPivot`
- `src/features/displayObjects/common/hooks/useScale.ts` - Exposed `scalePivot`
- `src/features/displayObjects/common/components/TransformModal.tsx` - Use fixed pivots during transforms

## Technical Decisions Made

### The Problem:
**AABB vs OBB Tracking Issue:**
- Transform modal was positioned at `collectionCenter` from `useBoundingBox`
- `collectionCenter` is calculated from the AABB (Axis-Aligned Bounding Box)
- During rotation, the AABB grows and changes shape to encompass rotated objects
- AABB center moves as objects rotate, causing modal to drift

**Why AABB center moves:**
```
Initial (no rotation):
┌───────┐
│   ■   │  AABB center at ■
└───────┘

After 45° rotation:
  ┌─────────┐
  │    ■    │  AABB is larger, center moved
  │  ◆   ◆  │  Objects ◆ rotated around original ■
  └─────────┘
```

### The Solution:
**Use Fixed Pivot Points:**
- Rotation and scale hooks already store initial center as `initialCenterRef`
- This is the fixed pivot point that doesn't change during the operation
- Expose this as `rotationPivot` / `scalePivot` from the hooks
- Use these fixed pivots for modal positioning during transforms
- Fall back to dynamic `collectionCenter` when not transforming

### Implementation Pattern:
```typescript
// In TransformModal:
const activeCenter = rotationPivot || scalePivot || center;

// Behavior:
// - When rotating: use rotationPivot (fixed)
// - When scaling: use scalePivot (fixed)
// - When idle: use center (dynamic AABB center)
```

## Dependencies & Integrations
- **Modified:** `useRotation` and `useScale` hooks to expose pivot points
- **Pattern:** Follows "fixed pivot during transform" paradigm
- **Affects:** Transform modal positioning during all rotation/scale operations

## State of the Application
- ✅ Transform modal stays fixed during rotation (no drift)
- ✅ Transform modal stays fixed during scaling (no drift)
- ✅ Modal updates position when selection changes (idle state)
- ✅ Rotation knob still rotates around correct pivot
- ✅ Scale knob still scales from correct pivot
- ✅ All transform operations work correctly

## Known Issues/Technical Debt
- None - this is the correct behavior

## Testing Notes
**Test fixed modal position:**
1. **Rotation test:**
   - Create multiple objects
   - Select all and start rotating
   - **Expected:** Modal stays at fixed centerpoint during rotation
   - **Before fix:** Modal would drift/move as AABB changed

2. **Scale test:**
   - Create objects
   - Select and start scaling
   - **Expected:** Modal stays at fixed centerpoint during scaling

3. **Idle state:**
   - Select objects (don't transform)
   - **Expected:** Modal positioned at collection center

## Next Steps
- STAGE3-11: Properties Panel for numeric property editing

## Code Snippets for Reference

### useRotation.ts (Return Statement)
```typescript
return {
  startRotation,
  updateRotation,
  endRotation,
  handleGlobalMouseUp,
  isRotating,
  currentAngle,
  rotatedCollectionCorners,
  rotationPivot: initialCenterRef.current, // Fixed pivot point (null when not rotating)
};
```

### useScale.ts (Return Statement)
```typescript
return {
  startScale,
  updateScale,
  endScale,
  handleGlobalMouseUp,
  isScaling,
  currentScale,
  scalePivot: initialCenterRef.current, // Fixed pivot point (null when not scaling)
};
```

### TransformModal.tsx (Screen Position Calculation)
```typescript
// Before (WRONG - used dynamic AABB center):
const screenPosition = useMemo(() => {
  if (!center) return null;
  const screen = canvasToScreen(center.x, center.y, ...);
  return screen;
}, [center, viewport...]);

// After (CORRECT - uses fixed pivot during transforms):
const screenPosition = useMemo(() => {
  const activeCenter = rotationPivot || scalePivot || center;
  if (!activeCenter) return null;
  const screen = canvasToScreen(activeCenter.x, activeCenter.y, ...);
  return screen;
}, [center, rotationPivot, scalePivot, viewport...]);
```

### Visual Explanation:
```
┌────────────────────────────────────┐
│                                    │
│   Objects rotating around ■        │
│                                    │
│            ◆  ◆                    │
│              ■ ← Modal stays here  │
│            ◆  ◆                    │
│                                    │
│   (AABB center moves, but modal   │
│    tracks rotationPivot instead)  │
│                                    │
└────────────────────────────────────┘
```

## Questions for Next Session
- Should we add visual indicator showing the pivot point?
- Should we allow users to change the pivot point (like Figma's "Set Origin" feature)?

