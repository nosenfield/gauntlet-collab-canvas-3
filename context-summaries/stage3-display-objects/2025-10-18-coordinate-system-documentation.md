# Context Summary: Coordinate System Documentation
**Date:** 2025-10-18  
**Phase:** Phase 3 - Display Objects  
**Status:** Completed

## What Was Built
Added comprehensive inline documentation to `BaseDisplayObject` interface clarifying the dual coordinate system used in CollabCanvas: top-left corner for data model vs center point for Konva rendering.

## Key Files Modified/Created
- `src/features/displayObjects/common/types.ts` - Enhanced JSDoc comments on BaseDisplayObject interface

## Technical Decisions Made

### Problem Identified
The codebase uses two different coordinate reference systems without explicit documentation:
1. **Data Model**: `(x, y)` represents the top-left corner of objects
2. **Konva Rendering**: Uses center point as the rotation and scale pivot

This ambiguity was causing confusion and was identified as a risk for Stage 4 (text objects) implementation.

### Solution Implemented
Added comprehensive JSDoc documentation to `BaseDisplayObject` interface explaining:
- **What**: (x, y) represents top-left corner in Firestore data model
- **Why**: Top-left is intuitive for positioning, but center point is required for natural rotation/scale
- **How**: Conversion formula: `centerX = x + (width * scaleX) / 2`
- **Where**: References to implementation files (transformMath.ts, boundingBoxUtils.ts, RectangleShape.tsx)

### Documentation Structure
```typescript
/**
 * BaseDisplayObject
 * 
 * COORDINATE SYSTEM DOCUMENTATION:
 * --------------------------------
 * 1. DATA MODEL (x, y): Represents the TOP-LEFT CORNER
 * 2. KONVA RENDERING: Uses CENTER POINT as rotation/scale pivot
 * 3. WHY TWO SYSTEMS: Explanation of design rationale
 */
```

## Dependencies & Integrations
- **No code changes**: This is pure documentation enhancement
- **Impacts**: Future text objects (Stage 4), AI integration (Stage 5), new developer onboarding
- **References**: transformMath.ts, boundingBoxUtils.ts, RectangleShape.tsx already implement this pattern

## State of the Application
- ✅ All existing functionality unchanged
- ✅ TypeScript compilation passes
- ✅ No linter errors
- ✅ Documentation now explicitly clarifies coordinate system usage

## Known Issues/Technical Debt
None - this addresses technical debt from codebase-review-findings.md Issue #5.

## Testing Notes
- **Verification**: TypeScript compilation with `npx tsc --noEmit` - Passed ✓
- **Impact**: Zero runtime impact, documentation only
- **Future testing**: When implementing text objects in Stage 4, refer to this documentation

## Next Steps
This addresses one of the recommendations from codebase-review-findings.md. Remaining items:

**MEDIUM Priority (before Stage 3 complete)**:
- Test collection drag in multi-user scenario (Issue 3B)
- Add intermediate writes to collection drag (Issue 3C)

**LOW Priority (before Stage 4)**:
- Clean up legacy `Shape` type lock fields in types/firebase.ts (Issue 2)
- Clarify non-driver draggable state (Issue 3A)

## Code Snippets for Reference

### Coordinate Conversion Pattern
When implementing new display object types, use this conversion:
```typescript
// Data model stores top-left
const topLeftX = displayObject.x;
const topLeftY = displayObject.y;

// Konva needs center for rotation
const centerX = topLeftX + (width * displayObject.scaleX) / 2;
const centerY = topLeftY + (height * displayObject.scaleY) / 2;

// Render in Konva with offset
<Rect
  x={centerX}
  y={centerY}
  offsetX={width / 2}  // Shift pivot to center
  offsetY={height / 2}
  rotation={displayObject.rotation}
  scaleX={displayObject.scaleX}
  scaleY={displayObject.scaleY}
/>
```

## Questions for Next Session
None - straightforward documentation enhancement.

## Rationale
This addresses codebase-review-findings.md **Issue #5: Coordinate System Ambiguity** (Priority: HIGH). The documentation prevents future bugs and confusion, especially critical for upcoming text objects (Stage 4) where positioning and alignment will be more complex.

## Related Context Summaries
- 2025-10-18-stage3-9-rotation-knob.md (uses center point calculations)
- 2025-10-17-stage3-4-bounding-boxes.md (uses OBB calculations with center conversion)

