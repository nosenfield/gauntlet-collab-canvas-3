# Context Summary: Rectangle Drag-to-Create Interaction
**Date:** 2025-10-19
**Phase:** Display Objects Enhancement
**Status:** Completed

## What Was Built
Implemented click-and-drag interaction for rectangle creation, replacing the previous single-click fixed-size rectangle creation. Users now mouse down to start drawing, drag to resize the rectangle in real-time with visual preview, and mouse up to finalize the shape.

## Key Files Modified/Created

### Created Files
- `src/features/displayObjects/shapes/hooks/useRectangleDraw.ts` - Hook managing drawing state and mouse event handling for interactive rectangle creation
- `src/features/displayObjects/shapes/components/PreviewRectangle.tsx` - Visual preview component showing rectangle as user drags
- `src/features/canvas/components/PreviewRectangleLayer.tsx` - Konva Layer wrapper for rendering the preview rectangle

### Modified Files
- `src/features/displayObjects/shapes/hooks/useShapeCreation.ts` - Added `createRectangle()` function accepting width/height parameters; removed auto-reset to select mode
- `src/features/canvas/hooks/useCanvasInteractions.ts` - Integrated rectangle drawing hook, routed mouse events appropriately
- `src/features/canvas/components/Canvas.tsx` - Passed drawing state to CanvasLayers
- `src/features/canvas/components/CanvasLayers.tsx` - Added PreviewRectangleLayer to rendering pipeline

## Technical Decisions Made

### Drawing State Management
- **Decision:** Created dedicated `useRectangleDraw` hook for drawing state
- **Rationale:** Separates drawing logic from canvas interactions, follows single-responsibility principle

### Preview Visual Style
- White fill with 1px black border, 0.7 opacity
- Non-interactive (listening: false) for performance
- Renders on separate layer between marquee and cursors

### Coordinate Handling
- Supports dragging in all directions (up/down/left/right from start point)
- Calculates top-left corner dynamically based on drag direction
- Uses Math.abs() for dimensions to handle negative drag

### Minimum Size Enforcement
- 10x10px minimum enforced in `finishDrawing()`
- Rectangles smaller than minimum are discarded (not created)
- User gets no error, just no rectangle appears

### Tool Behavior
- **Decision:** Rectangle tool stays active after creating a shape
- **Rationale:** Allows rapid creation of multiple rectangles without tool switching
- Removed `resetToSelect()` call from useShapeCreation

### Event Routing
- Mouse down on empty canvas when rectangle tool active → starts drawing
- Mouse move while drawing → updates preview
- Mouse up while drawing → finalizes and creates shape
- Prevents conflict with marquee selection and shape dragging

## Dependencies & Integrations

### Depends On
- `useShapeCreation` - For creating final rectangle in Firebase
- `useCanvasInteractions` - For orchestrating mouse events
- Konva coordinate transformation system
- Firebase shape service

### Used By
- Canvas.tsx - Main rendering component
- CanvasLayers.tsx - Layer composition

## State of the Application

### What Works Now
- ✅ Click and drag to create rectangles with live preview
- ✅ Drag in any direction from start point
- ✅ Visual feedback during drawing (white fill, black border)
- ✅ 10x10px minimum size enforcement
- ✅ Tool stays on rectangle mode after creation
- ✅ Proper coordinate transformation (canvas space)
- ✅ No conflicts with marquee selection or shape dragging

### What's Not Yet Implemented
- Keyboard modifiers (e.g., Shift for square constraint, Alt for center-origin)
- Escape key to cancel drawing
- Visual feedback for minimum size threshold

## Known Issues/Technical Debt

### Fixed Issues
- **Color consistency**: Initial implementation used system defaults (teal fill, gray stroke), causing visual mismatch between preview and final rectangle. Fixed by explicitly setting white fill, black stroke, and 1px stroke width to match preview appearance.

## Testing Notes

### How to Test
1. Start dev server: `npm run dev`
2. Open browser to localhost
3. Select rectangle tool from toolbar
4. Click and drag on empty canvas
5. Observe white preview rectangle during drag
6. Release mouse to create final rectangle
7. Test dragging in all directions (up, down, left, right, diagonal)
8. Test tiny rectangles (should be discarded if < 10x10px)
9. Create multiple rectangles (tool should stay active)

### Known Edge Cases
- Very small drags (< 10px) correctly discard rectangle
- Dragging off-screen properly handles coordinate bounds
- Preview updates smoothly during drag
- No interference with existing shape interactions

## Code Snippets for Reference

### Drawing State Hook Pattern
```typescript
const {
  isDrawing,
  previewRect,
  startDrawing,
  updateDrawing,
  finishDrawing,
} = useRectangleDraw();

// In mouse down handler
if (currentTool === 'rectangle') {
  startDrawing(e);
}

// In mouse move handler
if (isDrawingRectangle) {
  updateDrawing(e);
}

// In mouse up handler
if (isDrawingRectangle) {
  const rectDimensions = finishDrawing(e);
  if (rectDimensions) {
    await createRectangle(rectDimensions);
  }
}
```

### Coordinate Transformation
```typescript
// Convert screen to canvas coordinates
const scale = stage.scaleX();
const stageX = stage.x();
const stageY = stage.y();

const canvasX = (pointerPosition.x - stageX) / scale;
const canvasY = (pointerPosition.y - stageY) / scale;
```

### Bidirectional Drag Calculation
```typescript
const rawWidth = current.x - start.x;
const rawHeight = current.y - start.y;

// Handle negative dimensions (dragging up/left)
const x = rawWidth >= 0 ? start.x : current.x;
const y = rawHeight >= 0 ? start.y : current.y;
const width = Math.abs(rawWidth);
const height = Math.abs(rawHeight);
```

## Architecture Notes

### Layer Rendering Order
1. Grid Background
2. Shapes
3. Texts
4. Bounding Boxes
5. Marquee Selection
6. **Preview Rectangle** (new)
7. Remote Cursors

### Event Handling Flow
```
Canvas.tsx
  ↓ mouse events
useCanvasInteractions
  ↓ routes based on tool/state
useRectangleDraw (rectangle tool)
  ↓ on finish
useShapeCreation.createRectangle()
  ↓
shapeService.createShape()
  ↓
Firebase Firestore
```

## Next Steps
This feature is complete and ready for use. Potential future enhancements:
- Add keyboard modifier support (Shift for square, Alt for center-origin)
- Add Escape key to cancel drawing
- Show dimensions tooltip during drag
- Add snapping to grid during draw

## Questions for Next Session
None - implementation complete and tested.

