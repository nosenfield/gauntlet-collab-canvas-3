/**
 * Alignment Utilities
 * 
 * Utility functions for aligning and distributing display objects
 * Supports: align left/right/center/top/bottom/middle, distribute horizontally/vertically
 */

import type { TransformableObject } from '../types';

/**
 * Alignment result containing object ID and new position
 */
export interface AlignmentUpdate {
  objectId: string;
  x?: number;
  y?: number;
}

/**
 * Get the bounding box of an object (considering rotation)
 */
function getObjectBounds(obj: TransformableObject): {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
} {
  // For objects with width/height
  const width = (obj.width ?? 0) * obj.scaleX;
  const height = (obj.height ?? 0) * obj.scaleY;
  
  // Top-left position
  const left = obj.x;
  const top = obj.y;
  
  // Calculate bounds
  const right = left + width;
  const bottom = top + height;
  const centerX = left + width / 2;
  const centerY = top + height / 2;
  
  return {
    left,
    right,
    top,
    bottom,
    centerX,
    centerY,
    width,
    height,
  };
}

/**
 * Get the collective bounding box of multiple objects
 */
function getCollectiveBounds(objects: TransformableObject[]): {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
} {
  if (objects.length === 0) {
    return { left: 0, right: 0, top: 0, bottom: 0, centerX: 0, centerY: 0, width: 0, height: 0 };
  }
  
  const bounds = objects.map(getObjectBounds);
  
  const left = Math.min(...bounds.map(b => b.left));
  const right = Math.max(...bounds.map(b => b.right));
  const top = Math.min(...bounds.map(b => b.top));
  const bottom = Math.max(...bounds.map(b => b.bottom));
  
  const width = right - left;
  const height = bottom - top;
  const centerX = left + width / 2;
  const centerY = top + height / 2;
  
  return { left, right, top, bottom, centerX, centerY, width, height };
}

/**
 * Align objects to the left edge
 * All objects will align to the leftmost object's left edge
 */
export function alignLeft(objects: TransformableObject[]): AlignmentUpdate[] {
  if (objects.length < 2) return [];
  
  const collective = getCollectiveBounds(objects);
  const targetLeft = collective.left;
  
  return objects.map(obj => ({
    objectId: obj.id,
    x: targetLeft,
  }));
}

/**
 * Align objects to the right edge
 * All objects will align to the rightmost object's right edge
 */
export function alignRight(objects: TransformableObject[]): AlignmentUpdate[] {
  if (objects.length < 2) return [];
  
  const collective = getCollectiveBounds(objects);
  const targetRight = collective.right;
  
  return objects.map(obj => {
    const bounds = getObjectBounds(obj);
    return {
      objectId: obj.id,
      x: targetRight - bounds.width,
    };
  });
}

/**
 * Align objects to the horizontal center
 * All objects will align to the collective center X
 */
export function alignCenterHorizontal(objects: TransformableObject[]): AlignmentUpdate[] {
  if (objects.length < 2) return [];
  
  const collective = getCollectiveBounds(objects);
  const targetCenterX = collective.centerX;
  
  return objects.map(obj => {
    const bounds = getObjectBounds(obj);
    return {
      objectId: obj.id,
      x: targetCenterX - bounds.width / 2,
    };
  });
}

/**
 * Align objects to the top edge
 * All objects will align to the topmost object's top edge
 */
export function alignTop(objects: TransformableObject[]): AlignmentUpdate[] {
  if (objects.length < 2) return [];
  
  const collective = getCollectiveBounds(objects);
  const targetTop = collective.top;
  
  return objects.map(obj => ({
    objectId: obj.id,
    y: targetTop,
  }));
}

/**
 * Align objects to the bottom edge
 * All objects will align to the bottommost object's bottom edge
 */
export function alignBottom(objects: TransformableObject[]): AlignmentUpdate[] {
  if (objects.length < 2) return [];
  
  const collective = getCollectiveBounds(objects);
  const targetBottom = collective.bottom;
  
  return objects.map(obj => {
    const bounds = getObjectBounds(obj);
    return {
      objectId: obj.id,
      y: targetBottom - bounds.height,
    };
  });
}

/**
 * Align objects to the vertical center
 * All objects will align to the collective center Y
 */
export function alignCenterVertical(objects: TransformableObject[]): AlignmentUpdate[] {
  if (objects.length < 2) return [];
  
  const collective = getCollectiveBounds(objects);
  const targetCenterY = collective.centerY;
  
  return objects.map(obj => {
    const bounds = getObjectBounds(obj);
    return {
      objectId: obj.id,
      y: targetCenterY - bounds.height / 2,
    };
  });
}

/**
 * Distribute objects evenly along the horizontal axis
 * Objects are distributed evenly within the collection bounding box
 */
export function distributeHorizontal(objects: TransformableObject[]): AlignmentUpdate[] {
  if (objects.length < 3) return [];
  
  // Sort objects by their center X position
  const sorted = [...objects].sort((a, b) => {
    const boundsA = getObjectBounds(a);
    const boundsB = getObjectBounds(b);
    return boundsA.centerX - boundsB.centerX;
  });
  
  // Get the collective bounding box
  const collective = getCollectiveBounds(objects);
  
  // Calculate spacing between object centers
  const totalWidth = collective.width;
  const spacing = totalWidth / (sorted.length - 1);
  
  // Create updates - distribute all objects evenly within the collection bounds
  const updates: AlignmentUpdate[] = [];
  
  for (let i = 0; i < sorted.length; i++) {
    const bounds = getObjectBounds(sorted[i]);
    const targetCenterX = collective.left + (i * spacing);
    const newX = targetCenterX - bounds.width / 2;
    
    updates.push({
      objectId: sorted[i].id,
      x: newX,
    });
  }
  
  return updates;
}

/**
 * Distribute objects evenly along the vertical axis
 * Objects are distributed evenly within the collection bounding box
 */
export function distributeVertical(objects: TransformableObject[]): AlignmentUpdate[] {
  if (objects.length < 3) return [];
  
  // Sort objects by their center Y position
  const sorted = [...objects].sort((a, b) => {
    const boundsA = getObjectBounds(a);
    const boundsB = getObjectBounds(b);
    return boundsA.centerY - boundsB.centerY;
  });
  
  // Get the collective bounding box
  const collective = getCollectiveBounds(objects);
  
  // Calculate spacing between object centers
  const totalHeight = collective.height;
  const spacing = totalHeight / (sorted.length - 1);
  
  // Create updates - distribute all objects evenly within the collection bounds
  const updates: AlignmentUpdate[] = [];
  
  for (let i = 0; i < sorted.length; i++) {
    const bounds = getObjectBounds(sorted[i]);
    const targetCenterY = collective.top + (i * spacing);
    const newY = targetCenterY - bounds.height / 2;
    
    updates.push({
      objectId: sorted[i].id,
      y: newY,
    });
  }
  
  return updates;
}

/**
 * Alignment type enum
 */
export type AlignmentType =
  | 'left'
  | 'right'
  | 'center-horizontal'
  | 'top'
  | 'bottom'
  | 'center-vertical'
  | 'distribute-horizontal'
  | 'distribute-vertical';

/**
 * Apply alignment to objects
 * Convenience function that routes to the appropriate alignment function
 */
export function applyAlignment(
  objects: TransformableObject[],
  type: AlignmentType
): AlignmentUpdate[] {
  switch (type) {
    case 'left':
      return alignLeft(objects);
    case 'right':
      return alignRight(objects);
    case 'center-horizontal':
      return alignCenterHorizontal(objects);
    case 'top':
      return alignTop(objects);
    case 'bottom':
      return alignBottom(objects);
    case 'center-vertical':
      return alignCenterVertical(objects);
    case 'distribute-horizontal':
      return distributeHorizontal(objects);
    case 'distribute-vertical':
      return distributeVertical(objects);
    default:
      return [];
  }
}

