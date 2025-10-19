/**
 * AI Agent Tool Definitions
 * 
 * OpenAI function calling schemas for canvas operations
 * Each tool represents a capability the AI can execute
 */

import type { ChatCompletionTool } from 'openai/resources/chat';

/**
 * Rectangle Creation Tool
 * 
 * Creates a rectangle shape on the canvas
 * All parameters are optional with sensible defaults
 */
export const rectangleCreationTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_rectangle',
    description: 'Creates a rectangle shape on the canvas. Use this when the user wants to create, add, or make a rectangle.',
    parameters: {
      type: 'object',
      properties: {
        width: {
          type: 'number',
          description: 'Width of the rectangle in pixels. Default is 100 if not specified. Use larger values (200-400) for "large" rectangles.',
        },
        height: {
          type: 'number',
          description: 'Height of the rectangle in pixels. Default is 100 if not specified. Use larger values (200-400) for "large" rectangles.',
        },
        x: {
          type: 'number',
          description: 'X coordinate for rectangle center. Canvas is 10,000x10,000 pixels with center at (5000, 5000). Default is 5000 if not specified.',
        },
        y: {
          type: 'number',
          description: 'Y coordinate for rectangle center. Canvas is 10,000x10,000 pixels with center at (5000, 5000). Default is 5000 if not specified.',
        },
        fillColor: {
          type: 'string',
          description: 'Fill color as hex string (e.g., "#FF0000" for red, "#3B82F6" for blue). Default is "#3B82F6" (blue) if not specified. Common colors: red=#FF0000, green=#00FF00, blue=#3B82F6, yellow=#FFFF00, purple=#A855F7, orange=#F97316.',
        },
        strokeColor: {
          type: 'string',
          description: 'Stroke/border color as hex string. Default is "#1E40AF" (dark blue) if not specified. Use "#000000" for black borders.',
        },
        strokeWidth: {
          type: 'number',
          description: 'Stroke width in pixels (1-10). Default is 2 if not specified.',
        },
        borderRadius: {
          type: 'number',
          description: 'Corner radius in pixels (0-50). Default is 0 (sharp corners). Use 8-16 for rounded corners.',
        },
      },
      required: [], // All parameters optional with defaults
    },
  },
};

/**
 * All Available Tools
 * 
 * Array of all tools available to the AI agent
 * Future tools can be added here:
 * - circleCreationTool
 * - lineCreationTool
 * - selectObjectsTool
 * - transformObjectsTool
 * - alignObjectsTool
 */
export const allTools: ChatCompletionTool[] = [
  rectangleCreationTool,
];

