/**
 * Tool Executor Service
 * 
 * Executes tool calls by invoking the appropriate service functions
 * Maps OpenAI tool calls to canvas operations
 */

import { createShape, updateShapesBatch } from '@/features/displayObjects/shapes/services/shapeService';
import { createText, updateTextsBatch } from '@/features/displayObjects/texts/services/textService';
import type { CreateShapeData, ShapeDisplayObject, UpdateShapeData } from '@/features/displayObjects/shapes/types';
import type { CreateTextData, TextDisplayObject, UpdateTextData } from '@/features/displayObjects/texts/types';
import type { ToolExecutionResult } from '../types';

/**
 * Selection callback type
 * Used to pass selection function from useAIAgent to toolExecutor
 */
export type SelectionCallback = (objectIds: string[]) => void;

/**
 * Execute a tool call by name with given arguments
 * 
 * @param toolName - Name of the tool to execute
 * @param args - Arguments from OpenAI function call
 * @param userId - ID of the user executing the command
 * @param context - Optional context for tools that need additional data
 * @returns Promise resolving to execution result with created object IDs
 */
export async function executeTool(
  toolName: string,
  args: Record<string, any>,
  userId: string,
  context?: {
    shapes?: ShapeDisplayObject[];
    texts?: TextDisplayObject[];
    setSelection?: SelectionCallback;
    selectedIds?: string[];
  }
): Promise<ToolExecutionResult> {
  try {
    console.log(`[ToolExecutor] Executing tool: ${toolName}`, args);
    
    switch (toolName) {
      case 'create_rectangle':
        return await executeCreateRectangle(args, userId);
      
      case 'create_circle':
        return await executeCreateCircle(args, userId);
      
      case 'create_line':
        return await executeCreateLine(args, userId);
      
      case 'create_text':
        return await executeCreateText(args, userId);
      
      case 'select_objects':
        return await executeSelectObjects(args, context);
      
      case 'move_objects':
        return await executeMoveObjects(args, userId, context);
      
      default:
        console.error(`[ToolExecutor] Unknown tool: ${toolName}`);
        return {
          success: false,
          createdObjectIds: [],
          error: `Unknown tool: ${toolName}`,
        };
    }
  } catch (error) {
    console.error(`[ToolExecutor] Error executing tool ${toolName}:`, error);
    return {
      success: false,
      createdObjectIds: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute rectangle creation tool
 * 
 * Applies defaults for any missing parameters and creates the shape
 * 
 * @param args - Arguments from OpenAI (all optional)
 * @param userId - ID of the user creating the shape
 * @returns Promise resolving to execution result
 */
async function executeCreateRectangle(
  args: Record<string, any>,
  userId: string
): Promise<ToolExecutionResult> {
  try {
    // Apply defaults for missing parameters
    const width = args.width ?? 100;
    const height = args.height ?? 100;
    const x = args.x ?? 5000; // Canvas center
    const y = args.y ?? 5000; // Canvas center
    const fillColor = args.fillColor ?? '#3B82F6'; // Blue
    const strokeColor = args.strokeColor ?? '#1E40AF'; // Dark blue
    const strokeWidth = args.strokeWidth ?? 2;
    const borderRadius = args.borderRadius ?? 0;
    
    console.log('[ToolExecutor] Creating rectangle with params:', {
      width,
      height,
      x,
      y,
      fillColor,
      strokeColor,
      strokeWidth,
      borderRadius,
    });
    
    // Build shape data matching CreateShapeData interface
    const shapeData: CreateShapeData = {
      type: 'rectangle',
      x,
      y,
      width,
      height,
      fillColor,
      strokeColor,
      strokeWidth,
      borderRadius,
      opacity: 1,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      zIndex: Date.now(), // Use timestamp for z-index (newer = on top)
    };
    
    // Create shape using existing service
    const shapeId = await createShape(userId, shapeData);
    
    console.log('[ToolExecutor] Rectangle created successfully:', shapeId);
    
    return {
      success: true,
      createdObjectIds: [shapeId],
    };
  } catch (error) {
    console.error('[ToolExecutor] Error creating rectangle:', error);
    return {
      success: false,
      createdObjectIds: [],
      error: error instanceof Error ? error.message : 'Failed to create rectangle',
    };
  }
}

/**
 * Execute circle creation tool
 * 
 * Applies defaults for any missing parameters and creates the shape
 * 
 * @param args - Arguments from OpenAI (all optional)
 * @param userId - ID of the user creating the shape
 * @returns Promise resolving to execution result
 */
async function executeCreateCircle(
  args: Record<string, any>,
  userId: string
): Promise<ToolExecutionResult> {
  try {
    // Apply defaults for missing parameters
    const radius = args.radius ?? 50;
    const x = args.x ?? 5000; // Canvas center
    const y = args.y ?? 5000; // Canvas center
    const fillColor = args.fillColor ?? '#3B82F6'; // Blue
    const strokeColor = args.strokeColor ?? '#1E40AF'; // Dark blue
    const strokeWidth = args.strokeWidth ?? 2;
    
    console.log('[ToolExecutor] Creating circle with params:', {
      radius,
      x,
      y,
      fillColor,
      strokeColor,
      strokeWidth,
    });
    
    // Build shape data matching CreateShapeData interface
    const shapeData: CreateShapeData = {
      type: 'circle',
      x,
      y,
      radius,
      fillColor,
      strokeColor,
      strokeWidth,
      opacity: 1,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      zIndex: Date.now(), // Use timestamp for z-index (newer = on top)
    };
    
    // Create shape using existing service
    const shapeId = await createShape(userId, shapeData);
    
    console.log('[ToolExecutor] Circle created successfully:', shapeId);
    
    return {
      success: true,
      createdObjectIds: [shapeId],
    };
  } catch (error) {
    console.error('[ToolExecutor] Error creating circle:', error);
    return {
      success: false,
      createdObjectIds: [],
      error: error instanceof Error ? error.message : 'Failed to create circle',
    };
  }
}

/**
 * Execute line creation tool
 * 
 * Applies defaults for any missing parameters and creates the shape
 * 
 * @param args - Arguments from OpenAI (all optional)
 * @param userId - ID of the user creating the shape
 * @returns Promise resolving to execution result
 */
async function executeCreateLine(
  args: Record<string, any>,
  userId: string
): Promise<ToolExecutionResult> {
  try {
    // Apply defaults for missing parameters
    // Default to a horizontal line 100px wide centered on canvas
    const x1 = args.x1 ?? 4950;
    const y1 = args.y1 ?? 5000;
    const x2 = args.x2 ?? 5050;
    const y2 = args.y2 ?? 5000;
    const strokeColor = args.strokeColor ?? '#3B82F6'; // Blue
    const strokeWidth = args.strokeWidth ?? 2;
    
    // Calculate position and points
    // Line position (x, y) is the start point
    // Points array is relative to (x, y)
    const x = x1;
    const y = y1;
    const points = [0, 0, x2 - x1, y2 - y1];
    
    console.log('[ToolExecutor] Creating line with params:', {
      x1,
      y1,
      x2,
      y2,
      strokeColor,
      strokeWidth,
      calculatedPosition: { x, y },
      calculatedPoints: points,
    });
    
    // Build shape data matching CreateShapeData interface
    const shapeData: CreateShapeData = {
      type: 'line',
      x,
      y,
      points,
      fillColor: 'transparent', // Lines don't have fill
      strokeColor,
      strokeWidth,
      opacity: 1,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      zIndex: Date.now(), // Use timestamp for z-index (newer = on top)
    };
    
    // Create shape using existing service
    const shapeId = await createShape(userId, shapeData);
    
    console.log('[ToolExecutor] Line created successfully:', shapeId);
    
    return {
      success: true,
      createdObjectIds: [shapeId],
    };
  } catch (error) {
    console.error('[ToolExecutor] Error creating line:', error);
    return {
      success: false,
      createdObjectIds: [],
      error: error instanceof Error ? error.message : 'Failed to create line',
    };
  }
}

/**
 * Execute text creation tool
 * 
 * Applies defaults for any missing parameters and creates the text object
 * 
 * @param args - Arguments from OpenAI (content required, others optional)
 * @param userId - ID of the user creating the text
 * @returns Promise resolving to execution result
 */
async function executeCreateText(
  args: Record<string, any>,
  userId: string
): Promise<ToolExecutionResult> {
  try {
    // Validate required parameter
    if (!args.content || typeof args.content !== 'string') {
      return {
        success: false,
        createdObjectIds: [],
        error: 'Text content is required',
      };
    }
    
    // Apply defaults for missing parameters
    const content = args.content;
    const x = args.x ?? 5000; // Canvas center
    const y = args.y ?? 5000; // Canvas center
    const fontSize = args.fontSize ?? 16;
    const fontFamily = args.fontFamily ?? 'Arial';
    const fontWeight = args.fontWeight ?? 400;
    const color = args.color ?? '#000000'; // Black
    const textAlign = args.textAlign ?? 'left';
    const width = args.width ?? 200;
    
    console.log('[ToolExecutor] Creating text with params:', {
      content,
      x,
      y,
      fontSize,
      fontFamily,
      fontWeight,
      color,
      textAlign,
      width,
    });
    
    // Build text data matching CreateTextData interface
    const textData: CreateTextData = {
      x,
      y,
      content,
      fontSize,
      fontFamily,
      fontWeight,
      color,
      textAlign: textAlign as 'left' | 'center' | 'right' | 'justify',
      width,
      opacity: 1,
    };
    
    // Create text using existing service
    const textObject = await createText(userId, textData);
    
    console.log('[ToolExecutor] Text created successfully:', textObject.id);
    
    return {
      success: true,
      createdObjectIds: [textObject.id],
    };
  } catch (error) {
    console.error('[ToolExecutor] Error creating text:', error);
    return {
      success: false,
      createdObjectIds: [],
      error: error instanceof Error ? error.message : 'Failed to create text',
    };
  }
}

/**
 * Execute object selection tool
 * 
 * Searches through existing display objects and selects those matching the criteria
 * 
 * @param args - Filter criteria from OpenAI
 * @param context - Context containing shapes, texts, and selection function
 * @returns Promise resolving to execution result
 */
async function executeSelectObjects(
  args: Record<string, any>,
  context?: {
    shapes?: ShapeDisplayObject[];
    texts?: TextDisplayObject[];
    setSelection?: SelectionCallback;
    selectedIds?: string[];
  }
): Promise<ToolExecutionResult> {
  try {
    // Validate context
    if (!context || !context.shapes || !context.texts || !context.setSelection) {
      return {
        success: false,
        createdObjectIds: [],
        error: 'Selection context not available',
      };
    }

    const { shapes, texts, setSelection } = context;
    const matchedIds: string[] = [];

    console.log('[ToolExecutor] Selecting objects with criteria:', args);
    console.log(`[ToolExecutor] Available shapes: ${shapes.length}`);

    // Filter shapes
    if (!args.category || args.category === 'shape') {
      for (const shape of shapes) {
        // Debug log for all shapes
        const scaleX = shape.scaleX ?? 1;
        const scaleY = shape.scaleY ?? 1;
        console.log(`[ToolExecutor] Checking ${shape.type}:`, {
          id: shape.id,
          type: shape.type,
          ...(shape.type === 'circle' && {
            baseRadius: shape.radius,
            baseWidth: shape.width,
            baseHeight: shape.height,
          }),
          ...('width' in shape && 'height' in shape && shape.type !== 'circle' && {
            baseWidth: shape.width,
            baseHeight: shape.height,
          }),
          scaleX,
          scaleY,
          ...('width' in shape && 'height' in shape && {
            actualWidth: shape.width * scaleX,
            actualHeight: shape.height * scaleY,
          }),
          fillColor: shape.fillColor,
          colorMatch: args.fillColor ? matchesColorSemantically(shape.fillColor, args.fillColor) : 'N/A',
          criteria: args
        });
        
        if (matchesShapeCriteria(shape, args)) {
          matchedIds.push(shape.id);
          // Log matched shape details for debugging
          const scaleX = shape.scaleX ?? 1;
          const scaleY = shape.scaleY ?? 1;
          if (shape.type === 'circle') {
            console.log(`[ToolExecutor] Matched circle: id=${shape.id}, radius=${shape.radius}, scale=(${scaleX}, ${scaleY}), actualRadius=${shape.radius * ((scaleX + scaleY) / 2)}`);
          } else if ('width' in shape && 'height' in shape) {
            console.log(`[ToolExecutor] Matched shape: id=${shape.id}, type=${shape.type}, dimensions=${shape.width}x${shape.height}, scale=(${scaleX}, ${scaleY}), actual=${shape.width * scaleX}x${shape.height * scaleY}`);
          }
        }
      }
    }

    // Filter texts
    if (!args.category || args.category === 'text') {
      for (const text of texts) {
        if (matchesTextCriteria(text, args)) {
          matchedIds.push(text.id);
        }
      }
    }

    // Apply selection
    if (matchedIds.length > 0) {
      setSelection(matchedIds);
      console.log(`[ToolExecutor] Selected ${matchedIds.length} objects:`, matchedIds);
      
      return {
        success: true,
        createdObjectIds: [], // No objects created, but we use this for selected IDs
        message: `Selected ${matchedIds.length} object(s)`,
      };
    } else {
      console.log('[ToolExecutor] No objects matched the criteria');
      
      return {
        success: true,
        createdObjectIds: [],
        message: 'No objects found matching the criteria',
      };
    }
  } catch (error) {
    console.error('[ToolExecutor] Error selecting objects:', error);
    return {
      success: false,
      createdObjectIds: [],
      error: error instanceof Error ? error.message : 'Failed to select objects',
    };
  }
}

/**
 * Check if a color is semantically "red", "green", "blue", etc.
 * More flexible than exact hex matching
 */
function matchesColorSemantically(shapeColor: string, criteriaColor: string): boolean {
  // Normalize both colors
  const normalizedCriteria = criteriaColor.toUpperCase().replace('#', '');
  const normalizedShape = shapeColor.toUpperCase().replace('#', '');
  
  // Parse RGB components
  const parseRGB = (hex: string) => {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b };
  };
  
  try {
    const criteria = parseRGB(normalizedCriteria);
    const shape = parseRGB(normalizedShape);
    
    // Determine which channel is dominant in criteria color
    const maxCriteria = Math.max(criteria.r, criteria.g, criteria.b);
    
    // Check if shape color has the same dominant channel
    // Allow for some tolerance (shape's dominant channel should be at least 2x the others)
    if (criteria.r === maxCriteria && criteria.r > criteria.g + 50 && criteria.r > criteria.b + 50) {
      // Criteria is predominantly RED
      return shape.r > shape.g && shape.r > shape.b;
    }
    if (criteria.g === maxCriteria && criteria.g > criteria.r + 50 && criteria.g > criteria.b + 50) {
      // Criteria is predominantly GREEN
      return shape.g > shape.r && shape.g > shape.b;
    }
    if (criteria.b === maxCriteria && criteria.b > criteria.r + 50 && criteria.b > criteria.g + 50) {
      // Criteria is predominantly BLUE
      return shape.b > shape.r && shape.b > shape.g;
    }
    
    // For other colors (white, black, gray, etc.), use exact match
    return normalizedShape === normalizedCriteria;
  } catch {
    // Fallback to exact match if parsing fails
    return normalizedShape === normalizedCriteria;
  }
}

/**
 * Check if a shape matches the given criteria
 * Accounts for scale multipliers when comparing dimensions
 */
function matchesShapeCriteria(shape: ShapeDisplayObject, criteria: Record<string, any>): boolean {
  // Type filter
  if (criteria.type && shape.type !== criteria.type) {
    return false;
  }

  // Fill color filter (semantic color matching)
  if (criteria.fillColor) {
    if (!matchesColorSemantically(shape.fillColor, criteria.fillColor)) {
      return false;
    }
  }

  // Stroke color filter (semantic color matching)
  if (criteria.strokeColor) {
    if (!matchesColorSemantically(shape.strokeColor, criteria.strokeColor)) {
      return false;
    }
  }

  // Get scale multipliers (default to 1 if not set)
  const scaleX = shape.scaleX ?? 1;
  const scaleY = shape.scaleY ?? 1;

  // Width filters (for rectangles and circles)
  if ('width' in shape) {
    const actualWidth = shape.width * scaleX;
    if (criteria.minWidth !== undefined && actualWidth < criteria.minWidth) {
      return false;
    }
    if (criteria.maxWidth !== undefined && actualWidth > criteria.maxWidth) {
      return false;
    }
  }

  // Height filters (for rectangles and circles)
  if ('height' in shape) {
    const actualHeight = shape.height * scaleY;
    if (criteria.minHeight !== undefined && actualHeight < criteria.minHeight) {
      return false;
    }
    if (criteria.maxHeight !== undefined && actualHeight > criteria.maxHeight) {
      return false;
    }
  }

  // Radius filters (for circles)
  if (shape.type === 'circle') {
    // For circles, use the average of scaleX and scaleY for radius
    // (in case they're scaled non-uniformly)
    const averageScale = (scaleX + scaleY) / 2;
    const actualRadius = shape.radius * averageScale;
    
    if (criteria.minRadius !== undefined && actualRadius < criteria.minRadius) {
      return false;
    }
    if (criteria.maxRadius !== undefined && actualRadius > criteria.maxRadius) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a text object matches the given criteria
 * Accounts for scale multipliers when comparing dimensions
 */
function matchesTextCriteria(text: TextDisplayObject, criteria: Record<string, any>): boolean {
  // Color filter (semantic color matching)
  if (criteria.color) {
    if (!matchesColorSemantically(text.color, criteria.color)) {
      return false;
    }
  }

  // Content filter (case-insensitive partial match)
  if (criteria.content) {
    const normalizedCriteria = criteria.content.toLowerCase();
    const normalizedContent = text.content.toLowerCase();
    if (!normalizedContent.includes(normalizedCriteria)) {
      return false;
    }
  }

  // Get scale multipliers (default to 1 if not set)
  const scaleX = text.scaleX ?? 1;
  const scaleY = text.scaleY ?? 1;

  // Width filters
  const actualWidth = text.width * scaleX;
  if (criteria.minWidth !== undefined && actualWidth < criteria.minWidth) {
    return false;
  }
  if (criteria.maxWidth !== undefined && actualWidth > criteria.maxWidth) {
    return false;
  }

  // Height filters
  const actualHeight = text.height * scaleY;
  if (criteria.minHeight !== undefined && actualHeight < criteria.minHeight) {
    return false;
  }
  if (criteria.maxHeight !== undefined && actualHeight > criteria.maxHeight) {
    return false;
  }

  return true;
}

/**
 * Execute move objects tool
 * 
 * Moves selected display objects to a new position
 * Supports absolute positioning, relative offsets, and center alignment
 * 
 * @param args - Movement parameters from OpenAI
 * @param userId - ID of the user performing the move
 * @param context - Context containing shapes, texts, and selected IDs
 * @returns Promise resolving to execution result
 */
async function executeMoveObjects(
  args: Record<string, any>,
  userId: string,
  context?: {
    shapes?: ShapeDisplayObject[];
    texts?: TextDisplayObject[];
    setSelection?: SelectionCallback;
    selectedIds?: string[];
  }
): Promise<ToolExecutionResult> {
  try {
    // Validate context
    if (!context || !context.shapes || !context.texts || !context.selectedIds) {
      return {
        success: false,
        createdObjectIds: [],
        error: 'Move context not available',
      };
    }

    const { shapes, texts, selectedIds } = context;

    // Check if any objects are selected
    if (selectedIds.length === 0) {
      return {
        success: false,
        createdObjectIds: [],
        error: 'No objects selected. Please select objects first.',
      };
    }

    console.log('[ToolExecutor] Moving objects with params:', args);
    console.log('[ToolExecutor] Selected IDs:', selectedIds);

    // Get selected objects
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    const selectedTexts = texts.filter(t => selectedIds.includes(t.id));
    const allSelectedObjects = [...selectedShapes, ...selectedTexts];

    if (allSelectedObjects.length === 0) {
      return {
        success: false,
        createdObjectIds: [],
        error: 'Selected objects not found',
      };
    }

    // Calculate current bounding box center of selected objects
    // Account for scale multipliers to get actual visual bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    for (const obj of allSelectedObjects) {
      const objMinX = obj.x;
      const objMinY = obj.y;
      
      // Calculate max based on object type
      let objMaxX = obj.x;
      let objMaxY = obj.y;
      
      if ('width' in obj && 'height' in obj) {
        const scaleX = obj.scaleX ?? 1;
        const scaleY = obj.scaleY ?? 1;
        const actualWidth = obj.width * scaleX;
        const actualHeight = obj.height * scaleY;
        
        objMaxX = obj.x + actualWidth;
        objMaxY = obj.y + actualHeight;
      }
      
      minX = Math.min(minX, objMinX);
      minY = Math.min(minY, objMinY);
      maxX = Math.max(maxX, objMaxX);
      maxY = Math.max(maxY, objMaxY);
    }
    
    const currentCenterX = (minX + maxX) / 2;
    const currentCenterY = (minY + maxY) / 2;

    console.log('[ToolExecutor] Current selection center:', { x: currentCenterX, y: currentCenterY });

    // Determine target position
    let targetCenterX = currentCenterX;
    let targetCenterY = currentCenterY;

    // Handle alignToCenter flag
    if (args.alignToCenter === true) {
      targetCenterX = 5000; // Canvas center
      targetCenterY = 5000;
    }

    // Handle absolute positioning
    if (args.x !== undefined) {
      targetCenterX = args.x;
    }
    if (args.y !== undefined) {
      targetCenterY = args.y;
    }

    // Handle relative offsets
    if (args.offsetX !== undefined) {
      targetCenterX = currentCenterX + args.offsetX;
    }
    if (args.offsetY !== undefined) {
      targetCenterY = currentCenterY + args.offsetY;
    }

    // Calculate the delta to apply to all objects
    const deltaX = targetCenterX - currentCenterX;
    const deltaY = targetCenterY - currentCenterY;

    console.log('[ToolExecutor] Moving by delta:', { deltaX, deltaY });
    console.log('[ToolExecutor] New center:', { x: targetCenterX, y: targetCenterY });

    // Prepare batch updates
    const shapeUpdates: Array<{ shapeId: string; updates: UpdateShapeData }> = [];
    const textUpdates: Array<{ textId: string; updates: UpdateTextData }> = [];

    // Update shapes
    for (const shape of selectedShapes) {
      shapeUpdates.push({
        shapeId: shape.id,
        updates: {
          x: shape.x + deltaX,
          y: shape.y + deltaY,
        },
      });
    }

    // Update texts
    for (const text of selectedTexts) {
      textUpdates.push({
        textId: text.id,
        updates: {
          x: text.x + deltaX,
          y: text.y + deltaY,
        },
      });
    }

    // Execute batch updates
    const updatePromises: Promise<void>[] = [];
    
    if (shapeUpdates.length > 0) {
      updatePromises.push(updateShapesBatch(userId, shapeUpdates));
    }
    
    if (textUpdates.length > 0) {
      updatePromises.push(updateTextsBatch(userId, textUpdates));
    }

    await Promise.all(updatePromises);

    console.log(`[ToolExecutor] Moved ${allSelectedObjects.length} objects successfully`);

    return {
      success: true,
      createdObjectIds: [],
      message: `Moved ${allSelectedObjects.length} object(s) to position (${Math.round(targetCenterX)}, ${Math.round(targetCenterY)})`,
    };
  } catch (error) {
    console.error('[ToolExecutor] Error moving objects:', error);
    return {
      success: false,
      createdObjectIds: [],
      error: error instanceof Error ? error.message : 'Failed to move objects',
    };
  }
}
