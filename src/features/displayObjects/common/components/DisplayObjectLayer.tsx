/**
 * DisplayObjectLayer - Generic Layer Component
 * 
 * Generic component for rendering display objects (shapes, texts, etc.) on the canvas.
 * Eliminates code duplication between ShapeLayer and TextLayer.
 * 
 * Features:
 * - Handles collection dragging for multi-selection
 * - Manages optimistic updates during drag
 * - Delegates rendering to specific object components via render prop
 */

import React from 'react';
import { Layer } from 'react-konva';
import { useAuth } from '@/features/auth/store/authStore';
import type { TransformableObject } from '../types';
import type { ToolType } from '../store/toolStore';

/**
 * Props for rendering an individual object
 */
export interface ObjectRenderProps {
  isSelected: boolean;
  onClick?: (objectId: string, isShiftClick: boolean) => void;
  onDragEnd: (objectId: string, x: number, y: number) => void;
  draggable: boolean;
  onCollectionDragStart?: (objectId: string) => void;
  onCollectionDragMove?: (objectId: string, x: number, y: number) => void;
  listening: boolean;
  currentTool?: ToolType;
}

/**
 * DisplayObjectLayer Props
 */
interface DisplayObjectLayerProps<T extends TransformableObject> {
  /** Array of display objects to render */
  objects: T[];
  
  /** IDs of selected objects */
  selectedIds: string[];
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Click handler for object selection */
  onClick?: (objectId: string, isShiftClick: boolean) => void;
  
  /** Render function for individual objects */
  renderObject: (object: T, props: ObjectRenderProps) => React.ReactNode;
  
  /** Update function for single object drag (non-collection) */
  updateObject: (objectId: string, userId: string, updates: { x: number; y: number }) => Promise<void>;
  
  // Collection drag props
  isCollectionDragging: boolean;
  driverObjectId: string;
  dragOptimisticObjects: T[] | null;
  startCollectionDrag: (driverObjectId: string) => void;
  moveCollectionDrag: (driverObjectId: string, x: number, y: number) => void;
  endCollectionDrag: () => void;
  
  /** Current active tool */
  currentTool?: ToolType;
  
  /** Layer name for debugging */
  layerName?: string;
}

/**
 * DisplayObjectLayer Component
 * 
 * Generic layer that renders any type of display object.
 * Handles selection, dragging, and optimistic updates.
 * 
 * @example
 * ```tsx
 * <DisplayObjectLayer
 *   objects={shapes}
 *   selectedIds={selectedIds}
 *   onClick={handleClick}
 *   renderObject={(shape, props) => <RectangleShape shape={shape} {...props} />}
 *   updateObject={updateShape}
 *   {...collectionDragProps}
 * />
 * ```
 */
export function DisplayObjectLayer<T extends TransformableObject>({
  objects,
  selectedIds,
  isLoading = false,
  onClick,
  renderObject,
  updateObject,
  isCollectionDragging,
  driverObjectId,
  dragOptimisticObjects,
  startCollectionDrag,
  moveCollectionDrag,
  endCollectionDrag,
  currentTool,
  layerName = 'display-objects-layer',
}: DisplayObjectLayerProps<T>): React.ReactElement {
  const { user } = useAuth();
  
  // Check if multiple objects are selected (enables collection drag)
  // NOTE: We use collection drag for single objects too, to ensure bounding boxes update during drag
  const hasMultipleSelected = selectedIds.length >= 1;

  /**
   * Handle drag end (collection or single object)
   */
  const handleObjectDragEnd = async (objectId: string, x: number, y: number) => {
    if (!user) return;
    
    // All drags now use collection drag system for consistent bounding box updates
    if (isCollectionDragging) {
      await endCollectionDrag();
      return;
    }
    
    // Fallback: direct update (shouldn't happen with current logic)
    try {
      console.log(`[DisplayObjectLayer] Fallback: Updating single object position:`, objectId, { x, y });
      await updateObject(objectId, user.userId, { x, y });
    } catch (error) {
      console.error('[DisplayObjectLayer] Error updating object position:', error);
    }
  };
  
  /**
   * Handle collection drag start (includes single object drags)
   */
  const handleCollectionDragStart = (objectId: string) => {
    if (selectedIds.length === 0) return;
    startCollectionDrag(objectId);
  };
  
  /**
   * Handle collection drag move (includes single object drags)
   */
  const handleCollectionDragMove = (objectId: string, x: number, y: number) => {
    if (!isCollectionDragging) return;
    moveCollectionDrag(objectId, x, y);
  };
  
  // Performance optimization: Create optimistic map once, reuse for rendering
  const optimisticObjectsMap = React.useMemo(() => {
    if (!dragOptimisticObjects) return null;
    return new Map(dragOptimisticObjects.map(obj => [obj.id, obj]));
  }, [dragOptimisticObjects]);
  
  // Merge optimistic objects with regular objects during collection dragging
  // Sort by zIndex to control rendering order (React Konva renders in order, not by zIndex prop)
  const objectsToRender = React.useMemo(() => {
    let result = objects;
    
    if (isCollectionDragging && optimisticObjectsMap) {
      // Replace selected objects with optimistic versions, keep non-selected objects as-is
      result = objects.map(obj => optimisticObjectsMap.get(obj.id) || obj);
    }
    
    // Sort by zIndex (ascending) so higher zIndex objects render on top
    return result.slice().sort((a, b) => a.zIndex - b.zIndex);
  }, [isCollectionDragging, optimisticObjectsMap, objects]);

  // Early return for loading state
  if (isLoading) {
    return <Layer name={layerName} />;
  }

  return (
    <Layer name={layerName}>
      {objectsToRender.map((object) => {
        const isSelected = selectedIds.includes(object.id);
        const isDriver = isCollectionDragging && driverObjectId === object.id;

        // Build props for object renderer
        const renderProps: ObjectRenderProps = {
          isSelected,
          onClick,
          onDragEnd: handleObjectDragEnd,
          // Keep draggable for all selected objects (use Konva's draggable)
          draggable: isSelected,
          // Collection drag handlers (for all selected objects, including single)
          onCollectionDragStart: hasMultipleSelected ? handleCollectionDragStart : undefined,
          onCollectionDragMove: hasMultipleSelected ? handleCollectionDragMove : undefined,
          // During collection drag, only the driver object is controlled by Konva
          // Non-driver objects get their positions from optimistic updates
          listening: !isCollectionDragging || isDriver,
          currentTool,
        };

        return renderObject(object, renderProps);
      })}
    </Layer>
  );
}

