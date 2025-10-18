# Context Summary: STAGE4-2 Text Tool & Text Object Creation
**Date:** 2025-10-18
**Phase:** STAGE4 (Text Objects & Object-Specific Editing)
**Status:** Completed

## What Was Built
Added text tool to the toolbar and implemented text object creation functionality. Users can now select the text tool and click on the canvas to create text objects that persist to Firestore and sync across users.

## Key Files Created
- `src/features/displayObjects/texts/hooks/useTextCreation.ts` - Text creation logic
- `src/features/displayObjects/texts/components/TextObject.tsx` - Single text renderer
- `src/features/displayObjects/texts/components/TextLayer.tsx` - Text layer for canvas

## Key Files Modified
- `src/features/displayObjects/common/store/toolStore.tsx` - Added 'text' to ToolType
- `src/features/displayObjects/common/components/DisplayObjectToolbar.tsx` - Added text button
- `src/features/canvas/components/CanvasLayers.tsx` - Added TextLayer
- `src/features/canvas/components/Canvas.tsx` - Integrated text creation logic

## Technical Decisions Made

### Tool Integration:
- **Tool Type:** Added `'text'` to ToolType union: `'select' | 'rectangle' | 'circle' | 'line' | 'text'`
- **Keyboard Shortcut:** 'T' key for text tool
- **Icon:** Simple "T" character in toolbar
- **Auto-revert:** Tool reverts to 'select' after creating text (matches shape behavior)

### Text Creation Flow:
```
1. User clicks Text tool in toolbar
2. User clicks on canvas
3. useTextCreation hook intercepts click
4. Convert screen coordinates to canvas coordinates
5. Call createText() service with position
6. Add to local state (optimistic update)
7. Firestore writes text document
8. Real-time listener syncs to all users
9. Tool auto-reverts to 'select'
```

### Text Rendering:
- **Konva Component:** Uses `<Text>` from react-konva
- **Text Wrapping:** Word wrap enabled within bounds
- **Default Content:** "Double-click to edit"
- **Default Size:** 200px × 100px
- **Rotation Support:** Uses offset pivot for rotation (matches shapes)

### Coordinate Handling:
- Data model stores x,y as top-left
- Konva renders at center with offset for rotation
- Same pattern as shapes for consistency

### Canvas Integration:
- **Combined Click Handler:** `handleCombinedStageClick` checks if text tool is active
- **Text Layer:** Rendered between shapes and bounding boxes
- **Selection:** Text objects use existing selection system

## Dependencies & Integrations
- **Uses:** Text service (createText), text store (addText, useTexts)
- **Integrates:** Selection system, tool system, coordinate transforms
- **Pattern:** Matches shape creation workflow exactly

## State of the Application
- ✅ Text tool in toolbar with 'T' icon and shortcut
- ✅ Text button styled correctly (matches other tools)
- ✅ Click creates text box when tool === 'text'
- ✅ Default size: 200px × 100px
- ✅ Default text: "Double-click to edit"
- ✅ Text renders on canvas
- ✅ Text wraps within bounds
- ✅ Text persists to Firestore
- ✅ Text syncs to other users (real-time)
- ✅ Tool reverts to 'select' after creation
- ✅ TypeScript compiles without errors
- ⏸️ Text editing not yet implemented (next tasks)

## Known Issues/Technical Debt
- Text cannot be edited yet (needs STAGE4-3: Text editing)
- Text dragging needs to be implemented
- Text objects should support all transforms (rotation, scale)

## Testing Notes
**To test:**
1. Click text tool in toolbar (or press 'T')
2. Click anywhere on canvas
3. **Expected:**
   - Text box appears at click position
   - Default content: "Double-click to edit"
   - Size: 200px × 100px
   - Tool reverts to select
   - Text visible to other users
4. Select text object - bounding box should appear
5. Check Firestore - text document created in `/documents/main/texts/`

## Next Steps
- STAGE4-3: Text Editing - Double-click to edit text content
- STAGE4-4: Text Transform Support - Drag, rotate, scale text objects
- STAGE4-5: Text Properties Panel - Edit font, size, color, alignment

## Code Snippets for Reference

### Tool Integration (toolStore.tsx)
```typescript
export type ToolType = 'select' | 'rectangle' | 'circle' | 'line' | 'text';

export const TOOL_LABELS: Record<ToolType, string> = {
  // ...
  text: 'Text',
};

export const TOOL_SHORTCUTS: Record<ToolType, string> = {
  // ...
  text: 'T',
};
```

### Text Creation Hook (useTextCreation.ts)
```typescript
export function useTextCreation() {
  const { user } = useAuth();
  const { addText } = useTexts();
  const { currentTool, resetToSelect } = useTool();
  
  const handleCanvasClick = useCallback(async (
    e: KonvaEventObject<MouseEvent>,
    viewport: { x: number; y: number; scale: number }
  ) => {
    if (currentTool !== 'text' || !user) return;
    
    const pointerPos = stage.getPointerPosition();
    const canvasPos = screenToCanvas(pointerPos.x, pointerPos.y, viewport...);
    
    const newText = await createText(user.userId, {
      x: canvasPos.x,
      y: canvasPos.y,
    });
    
    addText(newText);
    resetToSelect(); // Auto-revert
  }, [currentTool, user, addText, resetToSelect]);
  
  return { handleCanvasClick, isTextTool: currentTool === 'text' };
}
```

### Text Object Component (TextObject.tsx)
```typescript
export function TextObject({ text, isSelected, onClick }: TextObjectProps) {
  const centerX = text.x + (text.width * text.scaleX) / 2;
  const centerY = text.y + (text.height * text.scaleY) / 2;
  
  return (
    <Text
      x={centerX}
      y={centerY}
      offsetX={text.width / 2}
      offsetY={text.height / 2}
      rotation={text.rotation}
      scaleX={text.scaleX}
      scaleY={text.scaleY}
      text={text.content}
      width={text.width}
      height={text.height}
      fontFamily={text.fontFamily}
      fontSize={text.fontSize}
      align={text.textAlign}
      lineHeight={text.lineHeight}
      wrap="word"
      fill={text.color}
      opacity={text.opacity}
      onClick={onClick}
      cursor={isSelected ? 'move' : 'pointer'}
    />
  );
}
```

### Canvas Integration (Canvas.tsx)
```typescript
// Text creation hook
const { handleCanvasClick: handleTextClick, isTextTool } = useTextCreation();

// Combined stage click handler
const handleCombinedStageClick = useCallback((e: any) => {
  if (isTextTool) {
    handleTextClick(e, viewport);
  } else {
    handleStageClick(e); // Marquee selection
  }
}, [isTextTool, handleTextClick, viewport, handleStageClick]);

// In Stage component
<Stage onClick={handleCombinedStageClick}>
  <CanvasLayers>
    <ShapeLayer />
    <TextLayer />  {/* New layer */}
    <BoundingBoxLayer />
  </CanvasLayers>
</Stage>
```

## Questions for Next Session
- Should double-click on text enter edit mode immediately?
- Should text boxes auto-resize based on content?
- What's the UX for text editing (inline vs modal)?

