# Context Summary: Rotation Pivot Fix
**Date:** 2025-10-18
**Phase:** STAGE 3 - STAGE3-9: Rotation Knob Implementation
**Status:** Completed

## What Was Built
Fixed critical rotation bug where objects were rotating around their top-left corner instead of their center when rotating collections. Objects now correctly orbit around the collection centerpoint with proper pivot behavior.

## Key Files Modified/Created
- `src/features/displayObjects/common/utils/transformMath.ts` - Fixed `rotateCollection()` function

## Technical Decisions Made
- **Root Cause:** The `rotateCollection()` function was rotating each object's top-left corner (x, y) around the collection center, but objects should rotate around their own centers.
- **Solution:** Added conversion logic to:
  1. Convert each object's top-left to its center point
  2. Rotate the center around the collection center
  3. Convert back to top-left coordinates
  4. Update rotation property
- **Type Safety:** Added type guards to handle different shape types (rectangle, circle, line) even though MVP only has rectangles.

## Code Changes

### Before (Bug):
```typescript
const newPosition = rotatePointAroundCenter(
  { x: obj.x, y: obj.y },  // ❌ Top-left corner
  angleDegrees,
  center
);
```

### After (Fixed):
```typescript
// Calculate object's center point
const halfWidth = (obj.width * obj.scaleX) / 2;
const halfHeight = (obj.height * obj.scaleY) / 2;
const objectCenter = {
  x: obj.x + halfWidth,
  y: obj.y + halfHeight,
};

// Rotate object's CENTER around collection center
const newCenter = rotatePointAroundCenter(
  objectCenter,
  angleDegrees,
  center
);

// Convert back to top-left coordinates
const newTopLeft = {
  x: newCenter.x - halfWidth,
  y: newCenter.y - halfHeight,
};
```

## Dependencies & Integrations
- **Depends on:** `useRotation` hook, `RectangleShape` component with Konva offset setup
- **Used by:** Transform modal rotation interaction

## State of the Application
- ✅ Objects rotate around collection centerpoint
- ✅ Single objects rotate correctly (treated as collection of 1)
- ✅ Multi-select collections rotate correctly
- ✅ Transform modal stays fixed at collection center during rotation
- ✅ Collection OBB visible and rotating with objects

## Known Issues/Technical Debt
- None - rotation pivot is now correct

## Testing Notes
- Test with single rectangle - should rotate around its own center
- Test with multiple rectangles - should orbit around collection center
- Each object should also spin around its own center while orbiting
- Transform modal should remain stationary at collection center

## Next Steps
- Continue with STAGE3-10: Scale Knob Implementation

## Important Context for Next Session
This fix establishes the correct coordinate conversion pattern for transformations:
1. Our data model stores `x, y` as **top-left corner**
2. Konva renders with offsets so rotation happens around **visual center**
3. Transform math must work in **center coordinates** then convert back to top-left
4. Always account for `scaleX` and `scaleY` when calculating dimensions

