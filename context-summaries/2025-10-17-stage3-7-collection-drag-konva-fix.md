# Context Summary: STAGE3-7 Collection Drag - Konva Draggable Fix
**Date:** 2025-10-17  
**Phase:** Stage 3 - Display Objects (Universal Editing)  
**Status:** Completed

## What Was Built
Refactored the multi-object collection drag to use Konva's built-in `draggable` property instead of custom Layer-level mouse handlers. This fixes the issue where quick mouse movements would exit the shapes and cancel the drag operation.

## Problem Identified
The original implementation used custom `onMouseMove`, `onMouseUp`, and `onMouseLeave` handlers attached to the Layer component. This caused issues:

1. **Mouse leaving Layer**: When the mouse moved quickly and exited the Layer bounds, the `onMouseLeave` handler would fire and cancel the drag
2. **Event loss**: Mouse events attached to Layer (not Stage) would stop firing if the cursor moved outside the Layer
3. **Unreliable tracking**: Custom mouse tracking couldn't match Konva's robust Stage-level event handling

### Why Single-Object Drag Worked
Single-object drag used Konva's `draggable={true}` property, which:
- Attaches mouse listeners at the **Stage level** (or window), not just the shape
- Continues tracking even if mouse exits shape boundaries
- Uses proven, battle-tested event handling

## Solution Implemented
Refactored collection drag to leverage Konva's `draggable` property:

1. **Keep `draggable={true}` on all selected shapes** (even during multi-selection)
2. **Use one shape as "driver"** - the shape being actively dragged
3. **Leverage Konva's `onDragMove` event** instead of Layer-level mouse handlers
4. **Calculate deltas** from driver's movement and apply to all shapes
5. **Use optimistic updates** for non-driver shapes

## Key Files Modified

### 1. `src/features/displayObjects/common/hooks/useCollectionDrag.ts`
**Changes:**
- Changed `DragState` to track `driverShapeId` instead of `startX`/`startY`
- Modified `handleDragStart(driverShapeId)` - takes shape ID, not coordinates
- Modified `handleDragMove(driverShapeId, newX, newY)` - takes driver's new position
- Calculates delta from driver's initial vs current position
- Applies delta to all shapes using their initial positions
- Returns `driverShapeId` to identify which shape is being dragged

**Key Logic:**
```typescript
const handleDragMove = useCallback((driverShapeId: string, newX: number, newY: number) => {
  // Get driver's initial position
  const driverInitial = dragState.initialPositions.get(driverShapeId);
  
  // Calculate delta from driver's movement
  const deltaX = newX - driverInitial.x;
  const deltaY = newY - driverInitial.y;
  
  // Apply delta to all shapes
  const translatedShapes = selectedShapes.map(shape => {
    const initial = dragState.initialPositions.get(shape.id);
    return {
      ...shape,
      x: initial.x + deltaX,
      y: initial.y + deltaY,
    };
  });
  
  // Constrain and update optimistically
  const constrainedShapes = translateAndConstrain(translatedShapes, 0, 0);
  setOptimisticShapes(constrainedShapes);
  
  // Debounce Firestore writes (300ms)
  // ...
}, [dragState, selectedShapes, userId]);
```

### 2. `src/features/displayObjects/shapes/components/ShapeLayer.tsx`
**Changes:**
- **Removed** Layer-level `onMouseMove`, `onMouseUp`, `onMouseLeave` handlers
- Simplified drag handlers to work with shape IDs instead of coordinates
- Added `handleCollectionDragStart(shapeId)` - called when any selected shape starts dragging
- Added `handleCollectionDragMove(shapeId, x, y)` - called when driver shape moves
- Modified `handleShapeDragEnd` to handle both single and collection drags
- Added `listening` prop to disable events on non-driver shapes during collection drag
- **Fixed**: Merge optimistic shapes with non-selected shapes to prevent non-selected shapes from disappearing during drag

**Before (problematic):**
```typescript
<Layer 
  name="shapes-layer"
  onMouseMove={(e) => {
    // Custom tracking - loses events if mouse leaves Layer
  }}
  onMouseUp={() => {
    // Could miss if mouse up happens outside Layer
  }}
  onMouseLeave={() => {
    // CANCELS drag when mouse leaves! ❌
    endCollectionDrag();
  }}
>
```

**After (robust):**
```typescript
// Merge optimistic shapes with regular shapes during collection dragging
// Optimistic shapes only contain the selected/dragging shapes, we need to include non-selected shapes too
const shapesToRender = React.useMemo(() => {
  if (isCollectionDragging && optimisticShapes) {
    // Create a map of optimistic shapes by ID for fast lookup
    const optimisticMap = new Map(optimisticShapes.map(s => [s.id, s]));
    
    // Replace selected shapes with optimistic versions, keep non-selected shapes as-is
    return shapes.map(shape => optimisticMap.get(shape.id) || shape);
  }
  return shapes;
}, [isCollectionDragging, optimisticShapes, shapes]);

<Layer name="shapes-layer">
  <RectangleShape
    draggable={isSelected} // Always draggable if selected
    onCollectionDragStart={hasMultipleSelected ? handleCollectionDragStart : undefined}
    onCollectionDragMove={hasMultipleSelected ? handleCollectionDragMove : undefined}
    listening={!isCollectionDragging || isDriver} // Only driver listens during drag
  />
</Layer>
```

### 3. `src/features/displayObjects/shapes/components/RectangleShape.tsx`
**Changes:**
- Updated props interface:
  - `onCollectionDragStart?: (shapeId: string) => void` - simplified signature
  - `onCollectionDragMove?: (shapeId: string, x: number, y: number) => void` - new prop
  - `listening?: boolean` - disable events on non-driver shapes
- Added `handleDragStart` - calls `onCollectionDragStart` when drag begins
- Added `handleDragMove` - calls `onCollectionDragMove` with current position
- Wired up Konva's `onDragStart`, `onDragMove`, `onDragEnd` events
- Used `listening` prop to disable events on non-driver shapes

**Key Addition:**
```typescript
const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
  // If this is part of a collection, notify the collection drag system
  if (onCollectionDragMove && isSelected) {
    const node = e.target;
    onCollectionDragMove(shape.id, node.x(), node.y());
  }
};

<Rect
  draggable={isDraggable}
  onDragStart={handleDragStart} // ✅ New
  onDragMove={handleDragMove}   // ✅ New
  onDragEnd={handleDragEnd}
  listening={isListening}       // ✅ New
/>
```

## Technical Decisions Made

### 1. Use Konva's Draggable Property
**Decision:** Leverage Konva's built-in `draggable` instead of custom mouse tracking  
**Rationale:**
- Konva attaches listeners at Stage/window level, not shape level
- Continues working even if mouse exits shape bounds
- Battle-tested, handles edge cases automatically
- Less custom code to maintain

### 2. Driver Shape Concept
**Decision:** One "driver" shape controls the collection movement  
**Rationale:**
- Konva can only drag one shape at a time natively
- Driver's movement determines delta for all shapes
- Other shapes follow using optimistic updates
- Clean separation: Konva controls driver, we control others

### 3. Disable Listening on Non-Driver Shapes
**Decision:** Set `listening={false}` on non-driver shapes during collection drag  
**Rationale:**
- Prevents accidental interactions with non-driver shapes
- Ensures only driver shape receives Konva drag events
- Improves performance (fewer event listeners active)
- Cleaner event flow

### 4. Keep Optimistic Updates
**Decision:** Maintain debounced writes and optimistic rendering  
**Rationale:**
- Still provides smooth, responsive dragging
- Reduces Firestore costs
- Works well with Konva's drag events
- No change needed to this proven pattern

## Dependencies & Integrations

### Depends On:
- Konva's draggable system (now leveraged properly)
- Selection store (selectedIds)
- Shapes store (shape data)
- Auth store (userId for updates)
- Transform service (translateAndConstrain)

### Enables Future Work:
- Same pattern for rotation/scale with Konva's built-in transformers
- More reliable complex interactions
- Easier integration with Konva plugins

## State of the Application

### What Works Now:
1. ✅ **Single shape dragging**: Still works as before (unchanged)
2. ✅ **Collection dragging**: 2+ selected shapes drag together
3. ✅ **Quick mouse movements**: No longer cancels drag (FIXED!)
4. ✅ **Optimistic updates**: Immediate visual feedback
5. ✅ **Debounced sync**: Changes sync every 300ms
6. ✅ **Canvas constraints**: Collection cannot go off-canvas
7. ✅ **Final write**: Accurate final positions on drag end
8. ✅ **Multi-user sync**: Changes propagate to other users
9. ✅ **Zoom-independent**: Works at all zoom levels

### What's Not Yet Implemented:
- Locking (users can interfere with each other)
- Rotation and scale transforms
- Undo/redo
- Snap-to-grid or guides

## Known Issues/Technical Debt

### Minor Issues:
1. **No conflict prevention**: Multiple users can edit same objects simultaneously
   - **Fix**: Implement STAGE3-6 (Collection-Level Locking)
   - **Priority**: High (next task)

2. **Bounding boxes may lag slightly**: During drag, bounding box updates on next render
   - **Cause**: React re-render cycle
   - **Priority**: Low (barely noticeable)

### Resolved Issues:
- ✅ **Quick mouse movements canceling drag** - FIXED by using Konva draggable
- ✅ **Drag ending when mouse leaves Layer** - FIXED by removing onMouseLeave handler
- ✅ **Event loss outside Layer bounds** - FIXED by using Stage-level Konva events
- ✅ **Non-selected shapes disappearing during multi-object drag** - FIXED by merging optimistic shapes with non-selected shapes
- ✅ **"Rendered fewer hooks than expected" error** - FIXED by moving useMemo hook before early return (Rules of Hooks)

## Testing Notes

### How to Test:

1. **Single shape dragging** (regression test):
   - Select one rectangle
   - Drag it normally → should work as before
   - Drag with quick mouse movements → should stay dragging

2. **Collection dragging** (fixed functionality):
   - Select 2+ rectangles (shift-click or marquee)
   - Click and drag any selected shape
   - **Move mouse VERY quickly** → should NOT cancel drag ✅
   - All selected shapes should move together
   - Release → positions update in Firestore

3. **Mouse leaving canvas** (edge case):
   - Select multiple shapes
   - Start dragging
   - Move mouse outside canvas bounds quickly
   - Drag should continue (Konva tracks at window level)

4. **Multi-user sync**:
   - Open in two browser windows
   - Window 1: Select and drag shapes quickly
   - Window 2: Should see shapes update within 300ms

### Test Results:
✅ Single shape drag works normally  
✅ Collection drag no longer cancels with quick movements  
✅ Mouse can leave Layer/Stage during drag without canceling  
✅ All shapes move together smoothly  
✅ Optimistic updates provide immediate feedback  
✅ Final positions written correctly to Firestore  

## Performance Considerations

- **No change**: Still uses debounced writes (300ms)
- **Improved**: Fewer custom event handlers (less overhead)
- **Improved**: Non-driver shapes don't listen during drag (better performance)
- **Same**: Optimistic rendering for immediate feedback

## Code Quality

- ✅ TypeScript compiles without errors
- ✅ No ESLint warnings
- ✅ Cleaner, simpler code (removed custom mouse tracking)
- ✅ Better separation of concerns (Konva handles driver, we handle followers)
- ✅ More maintainable (less custom event handling logic)

## Architecture Alignment

This refactor improves alignment with best practices:

- ✅ **Leverage libraries properly**: Use Konva's features instead of reinventing
- ✅ **Separation of concerns**: Driver vs follower shapes
- ✅ **Event delegation**: Let Konva handle events at the right level
- ✅ **Performance**: Fewer event listeners, better performance
- ✅ **Maintainability**: Less custom code to debug

## Next Steps

Based on TASK_LIST.md, recommended next tasks:

### Option A: STAGE3-6 - Collection-Level Locking (Recommended)
- Prevent conflicts when multiple users edit same objects
- Atomic lock acquisition
- Lock heartbeat and auto-release
- **Priority**: High (enables true multiplayer collaboration)

### Option B: STAGE3-8 - Transform Modal UI
- Add rotation and scale controls
- Visual knobs at collection center
- Can leverage Konva's Transformer component
- **Priority**: Medium (visual transforms)

### Recommendation:
Implement **STAGE3-6** next to prevent editing conflicts between users.

## Lessons Learned

1. **Always use library features when available** - Konva's draggable is more robust than custom mouse tracking
2. **Layer-level events are problematic** - Stage-level or window-level events are more reliable for drag operations
3. **onMouseLeave is dangerous for drags** - Should never cancel drag on mouse leave
4. **Driver/follower pattern** - Clean way to handle multi-object manipulation with single-object drag systems

## Questions for Next Session

None - implementation is complete and tested. The quick mouse movement issue is resolved.

---

**Build Status**: ✅ Passing  
**Lint Status**: ✅ Clean  
**TypeScript**: ✅ No errors  
**Manual Testing**: ✅ Quick mouse movements no longer cancel drag  
**Performance**: ✅ Improved (fewer event handlers)  
**Problem Resolved**: ✅ Multi-object drag now uses Konva's robust event system

