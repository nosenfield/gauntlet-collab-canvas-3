/**
 * Tool Executor Service
 * 
 * Executes tool calls by invoking the appropriate service functions
 * Maps OpenAI tool calls to canvas operations
 */

import { createShape } from '@/features/displayObjects/shapes/services/shapeService';
import { createText } from '@/features/displayObjects/texts/services/textService';
import type { CreateShapeData } from '@/features/displayObjects/shapes/types';
import type { CreateTextData } from '@/features/displayObjects/texts/types';
import type { ToolExecutionResult } from '../types';

/**
 * Execute a tool call by name with given arguments
 * 
 * @param toolName - Name of the tool to execute
 * @param args - Arguments from OpenAI function call
 * @param userId - ID of the user executing the command
 * @returns Promise resolving to execution result with created object IDs
 */
export async function executeTool(
  toolName: string,
  args: Record<string, any>,
  userId: string
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
