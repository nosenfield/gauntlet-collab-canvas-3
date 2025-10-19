# Context Summary: Fix Konva zIndex Warning
**Date:** 2025-10-19
**Phase:** Post-MVP Maintenance
**Status:** Completed

## What Was Built
Fixed React Konva warning about using `zIndex` attribute on Konva nodes. React Konva expects rendering order to be controlled by the order of elements in the render function, not by the `zIndex` prop.

## Problem
On application startup with display objects on the canvas, we were getting these warnings:
```
Konva warning: Node has no parent. zIndex parameter is ignored.
ReactKonva: You are using "zIndex" attribute for a Konva node. 
react-konva may get confused with ordering. Just define correct order 
of elements in your render function of a component.
```

## Solution
1. **Removed `zIndex` prop from Konva components:**
   - Removed from `RectangleShape.tsx` (line 127)
   - Removed from `TextObject.tsx` (line 134)

2. **Added sorting in `DisplayObjectLayer.tsx`:**
   - Sort objects by `zIndex` before rendering
   - Ensures objects render in correct z-order (lower zIndex = render first = appear behind)
   - Sorting happens in the `objectsToRender` useMemo

## Key Files Modified
- `src/features/displayObjects/shapes/components/RectangleShape.tsx` - Removed zIndex prop
- `src/features/displayObjects/texts/components/TextObject.tsx` - Removed zIndex prop
- `src/features/displayObjects/common/components/DisplayObjectLayer.tsx` - Added sorting by zIndex

## Technical Decisions Made
- **Why remove zIndex prop?** React Konva doesn't respect the zIndex attribute during initial render when nodes don't have a parent yet. It's also not the recommended way to control order in React Konva.
- **Why sort in DisplayObjectLayer?** This is the centralized place where all display objects (shapes and texts) are rendered, making it the ideal location to ensure correct rendering order.
- **Sort direction:** Ascending (a.zIndex - b.zIndex) means lower zIndex values render first and appear behind higher zIndex values.

## Dependencies & Integrations
- Works with existing zIndex management system (`useZIndexManagement` hook)
- No changes needed to zIndex data model or Firebase storage
- zIndex property still exists on objects and is still used for ordering logic

## State of the Application
- Warning eliminated
- Z-ordering still works correctly
- Objects render in proper stacking order based on zIndex values
- No visual changes to user experience

## Code Snippets for Reference

### DisplayObjectLayer sorting logic:
```typescript
// Sort by zIndex to control rendering order (React Konva renders in order, not by zIndex prop)
const objectsToRender = React.useMemo(() => {
  let result = objects;
  
  if (isCollectionDragging && optimisticObjectsMap) {
    // Replace selected objects with optimistic versions
    result = objects.map(obj => optimisticObjectsMap.get(obj.id) || obj);
  }
  
  // Sort by zIndex (ascending) so higher zIndex objects render on top
  return result.slice().sort((a, b) => a.zIndex - b.zIndex);
}, [isCollectionDragging, optimisticObjectsMap, objects]);
```

## Testing Notes
- Start application with existing display objects on canvas
- Verify no Konva warnings in console
- Test z-ordering by using "Bring to Front" / "Send to Back" commands
- Verify objects stack correctly

## Known Issues/Technical Debt
None - this is a clean fix that aligns with React Konva best practices.

