/**
 * Clipboard Hook
 * 
 * Handles copy/paste functionality for display objects
 * Supports Cmd+C (Mac) / Ctrl+C (Windows) for copy
 * Supports Cmd+V (Mac) / Ctrl+V (Windows) for paste
 */

import { useState, useEffect, useCallback } from 'react';
import { useSelection } from '../store/selectionStore';
import { useShapes } from '@/features/displayObjects/shapes/store/shapesStore';
import { useTexts } from '@/features/displayObjects/texts/store/textsStore';
import { createShape } from '@/features/displayObjects/shapes/services/shapeService';
import { createText } from '@/features/displayObjects/texts/services/textService';
import type { ShapeDisplayObject } from '@/features/displayObjects/shapes/types';
import type { TextDisplayObject } from '@/features/displayObjects/texts/types';

/**
 * Clipboard item can be either a shape or text
 */
type ClipboardItem = {
  type: 'shape' | 'text';
  data: ShapeDisplayObject | TextDisplayObject;
};

/**
 * Offset to apply when pasting objects
 */
const PASTE_OFFSET = 20;

/**
 * useClipboard Hook
 * 
 * Provides copy/paste functionality for display objects
 * 
 * @param userId - Current user ID for creating new objects
 */
export function useClipboard(userId: string | undefined) {
  const [clipboard, setClipboard] = useState<ClipboardItem[]>([]);
  const { selectedIds, setSelection } = useSelection();
  const { shapes } = useShapes();
  const { texts } = useTexts();

  /**
   * Copy selected objects to clipboard
   */
  const copy = useCallback(() => {
    if (selectedIds.length === 0) {
      console.log('[Clipboard] Nothing selected to copy');
      return;
    }

    const shapeMap = new Map(shapes.map(s => [s.id, s]));
    const textMap = new Map(texts.map(t => [t.id, t]));

    const items: ClipboardItem[] = [];

    selectedIds.forEach(id => {
      if (shapeMap.has(id)) {
        items.push({
          type: 'shape',
          data: shapeMap.get(id)!,
        });
      } else if (textMap.has(id)) {
        items.push({
          type: 'text',
          data: textMap.get(id)!,
        });
      }
    });

    setClipboard(items);
    console.log(`[Clipboard] Copied ${items.length} objects`);
  }, [selectedIds, shapes, texts]);

  /**
   * Paste objects from clipboard
   * @param offset - Amount to offset pasted objects (default: PASTE_OFFSET)
   */
  const paste = useCallback(async (offset: number = PASTE_OFFSET) => {
    if (!userId) {
      console.warn('[Clipboard] Cannot paste: No user ID');
      return;
    }

    if (clipboard.length === 0) {
      console.log('[Clipboard] Nothing in clipboard to paste');
      return;
    }

    try {
      const newIds: string[] = [];

      // Create new objects with offset positions
      for (const item of clipboard) {
        if (item.type === 'shape') {
          const shape = item.data as ShapeDisplayObject;
          
          // Create new shape with offset position
          const newId = await createShape(userId, {
            type: shape.type,
            x: shape.x + offset,
            y: shape.y + offset,
            rotation: shape.rotation,
            scaleX: shape.scaleX,
            scaleY: shape.scaleY,
            fillColor: shape.fillColor,
            strokeColor: shape.strokeColor,
            strokeWidth: shape.strokeWidth,
            opacity: shape.opacity,
            blendMode: shape.blendMode,
            ...(shape.type === 'rectangle' && {
              width: shape.width,
              height: shape.height,
              borderRadius: shape.borderRadius,
            }),
            ...(shape.type === 'circle' && {
              radius: shape.radius,
              width: shape.width,
              height: shape.height,
            }),
            ...(shape.type === 'line' && {
              points: shape.points,
            }),
          });
          
          newIds.push(newId);
        } else if (item.type === 'text') {
          const text = item.data as TextDisplayObject;
          
          // Create new text with offset position (returns TextDisplayObject)
          const newText = await createText(userId, {
            content: text.content,
            x: text.x + offset,
            y: text.y + offset,
            fontSize: text.fontSize,
            fontFamily: text.fontFamily,
            fontWeight: text.fontWeight,
            textAlign: text.textAlign,
            lineHeight: text.lineHeight,
            color: text.color,
            opacity: text.opacity,
            width: text.width,
            height: text.height,
          });
          
          newIds.push(newText.id);
        }
      }

      const pasteType = offset === 0 ? 'in place' : `with ${offset}px offset`;
      console.log(`[Clipboard] Pasted ${newIds.length} objects ${pasteType}`);

      // Select the newly pasted objects
      // Wait a bit for Firestore to sync
      setTimeout(() => {
        setSelection(newIds);
      }, 100);
    } catch (error) {
      console.error('[Clipboard] Error pasting objects:', error);
      alert('Failed to paste objects. Please try again.');
    }
  }, [clipboard, userId, setSelection]);

  /**
   * Keyboard event handler for copy/paste shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Don't trigger if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Copy: Cmd/Ctrl + C
      if (isCmdOrCtrl && e.key === 'c') {
        e.preventDefault();
        copy();
      }

      // Paste in place: Cmd/Ctrl + Shift + V (no offset)
      if (isCmdOrCtrl && e.shiftKey && e.key === 'v') {
        e.preventDefault();
        paste(0); // Paste with 0 offset
      }
      // Paste with offset: Cmd/Ctrl + V
      else if (isCmdOrCtrl && e.key === 'v') {
        e.preventDefault();
        paste(); // Paste with default offset
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copy, paste]);

  return {
    copy,
    paste,
    hasClipboard: clipboard.length > 0,
    clipboardCount: clipboard.length,
  };
}

