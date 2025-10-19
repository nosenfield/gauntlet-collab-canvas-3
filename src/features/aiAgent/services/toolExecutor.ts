/**
 * Tool Executor Service
 * 
 * Executes tool calls by invoking the appropriate service functions
 * Maps OpenAI tool calls to canvas operations
 */

import { createShape } from '@/features/displayObjects/shapes/services/shapeService';
import type { CreateShapeData } from '@/features/displayObjects/shapes/types';
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
      
      // Future tool executions will be added here:
      // case 'create_circle':
      //   return await executeCreateCircle(args, userId);
      // case 'create_line':
      //   return await executeCreateLine(args, userId);
      // case 'select_objects':
      //   return await executeSelectObjects(args);
      // case 'transform_objects':
      //   return await executeTransformObjects(args, userId);
      
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
    // createShape returns the Firestore-generated ID
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
 * Future: Execute circle creation tool
 */
// async function executeCreateCircle(
//   args: Record<string, any>,
//   userId: string
// ): Promise<ToolExecutionResult> {
//   // Implementation similar to executeCreateRectangle
// }

/**
 * Future: Execute line creation tool
 */
// async function executeCreateLine(
//   args: Record<string, any>,
//   userId: string
// ): Promise<ToolExecutionResult> {
//   // Implementation similar to executeCreateRectangle
// }

