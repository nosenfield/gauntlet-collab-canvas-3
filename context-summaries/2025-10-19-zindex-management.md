# Context Summary: Z-Index Management Feature
**Date:** 2025-10-19
**Feature:** Z-Index Layer Ordering Controls
**Status:** Completed

## What Was Built
Implemented a complete Z-index management system that allows users to reorder display objects (shapes and texts) on the canvas. The feature includes a contextual toolbar that appears when objects are selected, along with keyboard shortcuts for quick access.

## Key Files Created/Modified

### New Files Created
- `src/features/displayObjects/common/hooks/useZIndexManagement.ts` - Hook for Z-index operations
- `src/features/displayObjects/common/components/ZIndexControls.tsx` - UI component for Z-index controls
- `src/features/displayObjects/common/components/ZIndexControls.css` - Styles for Z-index controls

### Modified Files
- `src/features/displayObjects/texts/services/textService.ts` - Added `updateZIndexes()` function
- `src/App.tsx` - Added `<ZIndexControls />` component to the app

## Technical Decisions Made

### 1. **Contextual Toolbar Approach**
- Z-index controls appear at the top-center of the screen only when objects are selected
- This keeps the UI clean and only shows relevant controls
- Uses smooth slide-down animation for appearance

### 2. **Unified Object Management**
- The hook (`useZIndexManagement`) works with both shapes and texts transparently
- Automatically partitions updates by category (shape vs text) and routes to correct services
- Uses the existing `TransformableObject` interface for type-safe operations

### 3. **Z-Index Calculation Logic**
- **Bring to Front**: Sets zIndex to `maxZIndex + 1` for all selected objects
- **Send to Back**: Sets zIndex to `minZIndex - selected.length` for all selected objects
- **Bring Forward**: Increments zIndex by 1 (checks if already at front)
- **Send Backward**: Decrements zIndex by 1 (checks if already at back)

### 4. **Keyboard Shortcuts**
Implemented platform-aware shortcuts (Cmd on Mac, Ctrl on Windows/Linux):
- `Cmd/Ctrl + Shift + ]` → Bring to Front
- `Cmd/Ctrl + Shift + [` → Send to Back
- `Cmd/Ctrl + ]` → Bring Forward
- `Cmd/Ctrl + [` → Send Backward

### 5. **Multi-Object Support**
- All operations work on single or multiple selected objects
- Selected objects maintain their relative ordering when moved as a group

## Dependencies & Integrations

### Depends On
- Existing selection system (`useSelection` hook)
- Shapes store and service (`useShapes`, `updateZIndexes` in shapeService)
- Texts store and service (`useTexts`, `updateZIndexes` in textService)
- `TransformableObject` type from common types

### Integrates With
- Selection system - only shows controls when objects are selected
- Real-time sync - z-index updates are synced to Firestore automatically
- Both shapes and texts - works uniformly across all display object types

## State of the Application

### What Works Now
✅ Z-index controls toolbar appears when objects are selected
✅ All four z-index operations (front, back, forward, backward)
✅ Keyboard shortcuts for all operations
✅ Works with both shapes and texts
✅ Multi-object selection support
✅ Real-time sync of z-index changes to Firestore
✅ Platform-aware keyboard shortcuts (Mac vs Windows/Linux)

### What's Not Yet Implemented
- Visual feedback/confirmation when operation is at limit (already at front/back)
- Undo/redo for z-index operations (not in MVP scope)
- Layers panel UI showing object hierarchy (not in current feature)

## Known Issues/Technical Debt

### Minor Issues
- The existing BlendMode type is missing from types.ts (pre-existing issue)
- Some UniversalProperties components have undefined width/height checks (pre-existing issue)

### Potential Improvements
- Could add toast notifications for user feedback
- Could optimize batch updates to use Firestore batch API instead of Promise.all
- Could add visual indicators showing object z-index values

## Testing Notes

### How to Test
1. Create multiple shapes/texts on the canvas
2. Select one or more objects (use Shift+Click for multi-select)
3. Z-index controls toolbar should appear at top-center
4. Click buttons to reorder objects or use keyboard shortcuts
5. Verify objects render in correct order (higher z-index appears on top)
6. Test with multiple browser windows to verify real-time sync

### Test Cases
- Single object: bring to front, send to back
- Multiple objects: group reordering
- Mixed selection: shapes and texts together
- Keyboard shortcuts: all four operations
- Edge cases: already at front/back (should show error message in console)
- Real-time sync: changes appear in other connected clients

## Code Snippets for Reference

### Using the Z-Index Management Hook
```typescript
import { useZIndexManagement } from '@/features/displayObjects/common/hooks/useZIndexManagement';

function MyComponent() {
  const {
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    hasSelection,
  } = useZIndexManagement();
  
  // Use the functions to reorder objects
  await bringToFront();
}
```

### Z-Index Update Service Pattern
```typescript
// Services now have updateZIndexes function
import { updateZIndexes as updateShapeZIndexes } from '@/features/displayObjects/shapes/services/shapeService';
import { updateZIndexes as updateTextZIndexes } from '@/features/displayObjects/texts/services/textService';

// Update shapes
await updateShapeZIndexes([
  { shapeId: 'shape-1', zIndex: 10 },
  { shapeId: 'shape-2', zIndex: 11 },
]);

// Update texts
await updateTextZIndexes([
  { textId: 'text-1', zIndex: 12 },
]);
```

## Next Steps

### Immediate Follow-Up
- Implement alignment tools feature (next in queue)
- Consider adding toast notifications for better UX

### Future Enhancements (Post-MVP)
- Layers panel showing all objects in z-order
- Drag-to-reorder in layers panel
- Named layers/groups
- Lock z-index to prevent accidental reordering

## Architecture Notes

### Design Pattern
The feature follows the established architecture pattern:
- **Hook** (`useZIndexManagement`) - Business logic and state management
- **Component** (`ZIndexControls`) - UI presentation and user interaction
- **Service** (existing `shapeService`, `textService`) - Firestore operations

### Why This Approach
- Separation of concerns: UI is decoupled from business logic
- Reusability: The hook can be used in other components if needed
- Testability: Logic can be tested independently from UI
- Consistency: Follows the same pattern as other features in the codebase

## Questions Addressed

**Q: Should z-index controls be in the main toolbar or contextual?**
A: Contextual (top-center when objects selected) - keeps UI clean and focused

**Q: How to handle shapes and texts together?**
A: Unified approach using TransformableObject interface, partitioning by category internally

**Q: Should forward/backward move by 1 or swap with adjacent object?**
A: Move by 1 - simpler logic and more predictable behavior

**Q: Platform-specific keyboard shortcuts?**
A: Yes - detect Mac vs Windows/Linux and use Cmd vs Ctrl appropriately

## References
- PRD.md - Z-index management was identified as an easy win
- ARCHITECTURE.md - Follows established service/hook/component pattern
- existing shapeService.ts - Already had updateZIndexes function

