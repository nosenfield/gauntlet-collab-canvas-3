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
    description: 'Creates a rectangle shape on the canvas. Use this when the user wants to create, add, or make a rectangle or square.',
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
 * Circle Creation Tool
 * 
 * Creates a circle shape on the canvas
 * All parameters are optional with sensible defaults
 */
export const circleCreationTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_circle',
    description: 'Creates a circle shape on the canvas. Use this when the user wants to create, add, or make a circle or circular shape.',
    parameters: {
      type: 'object',
      properties: {
        radius: {
          type: 'number',
          description: 'Radius of the circle in pixels. Default is 50 if not specified. Use larger values (100-200) for "large" circles.',
        },
        x: {
          type: 'number',
          description: 'X coordinate for circle center. Canvas is 10,000x10,000 pixels with center at (5000, 5000). Default is 5000 if not specified.',
        },
        y: {
          type: 'number',
          description: 'Y coordinate for circle center. Canvas is 10,000x10,000 pixels with center at (5000, 5000). Default is 5000 if not specified.',
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
      },
      required: [], // All parameters optional with defaults
    },
  },
};

/**
 * Line Creation Tool
 * 
 * Creates a line shape on the canvas
 * All parameters are optional with sensible defaults
 */
export const lineCreationTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_line',
    description: 'Creates a line shape on the canvas. Use this when the user wants to create, add, or draw a line.',
    parameters: {
      type: 'object',
      properties: {
        x1: {
          type: 'number',
          description: 'X coordinate for line start point. Canvas is 10,000x10,000 pixels with center at (5000, 5000). Default is 4950 if not specified.',
        },
        y1: {
          type: 'number',
          description: 'Y coordinate for line start point. Canvas is 10,000x10,000 pixels with center at (5000, 5000). Default is 5000 if not specified.',
        },
        x2: {
          type: 'number',
          description: 'X coordinate for line end point. Canvas is 10,000x10,000 pixels with center at (5000, 5000). Default is 5050 if not specified.',
        },
        y2: {
          type: 'number',
          description: 'Y coordinate for line end point. Canvas is 10,000x10,000 pixels with center at (5000, 5000). Default is 5000 if not specified.',
        },
        strokeColor: {
          type: 'string',
          description: 'Line color as hex string (e.g., "#FF0000" for red, "#3B82F6" for blue). Default is "#3B82F6" (blue) if not specified. Common colors: red=#FF0000, green=#00FF00, blue=#3B82F6, yellow=#FFFF00, purple=#A855F7, orange=#F97316.',
        },
        strokeWidth: {
          type: 'number',
          description: 'Line thickness in pixels (1-10). Default is 2 if not specified.',
        },
      },
      required: [], // All parameters optional with defaults
    },
  },
};

/**
 * Text Creation Tool
 * 
 * Creates a text object on the canvas
 * All parameters are optional with sensible defaults
 */
export const textCreationTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_text',
    description: 'Creates a text object on the canvas. Use this when the user wants to create, add, or write text.',
    parameters: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The text content to display. Required parameter.',
        },
        x: {
          type: 'number',
          description: 'X coordinate for text position (top-left corner). Canvas is 10,000x10,000 pixels with center at (5000, 5000). Default is 5000 if not specified.',
        },
        y: {
          type: 'number',
          description: 'Y coordinate for text position (top-left corner). Canvas is 10,000x10,000 pixels with center at (5000, 5000). Default is 5000 if not specified.',
        },
        fontSize: {
          type: 'number',
          description: 'Font size in pixels. Default is 16 if not specified. Use larger values (24-48) for headings.',
        },
        fontFamily: {
          type: 'string',
          description: 'Font family name. Default is "Arial" if not specified. Common fonts: Arial, Helvetica, Times New Roman, Courier New, Georgia, Verdana.',
        },
        fontWeight: {
          type: 'number',
          description: 'Font weight (100-900). Default is 400 (normal) if not specified. Use 700 for bold.',
        },
        color: {
          type: 'string',
          description: 'Text color as hex string (e.g., "#000000" for black, "#FF0000" for red). Default is "#000000" (black) if not specified.',
        },
        textAlign: {
          type: 'string',
          enum: ['left', 'center', 'right', 'justify'],
          description: 'Text alignment. Default is "left" if not specified.',
        },
        width: {
          type: 'number',
          description: 'Text box width in pixels. Default is 200 if not specified.',
        },
      },
      required: ['content'], // Content is required
    },
  },
};

/**
 * Display Object Selection Tool
 * 
 * Selects display objects based on their properties
 * Searches through all existing objects and creates a collection selection
 */
export const selectObjectsTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'select_objects',
    description: 'Selects display objects on the canvas based on their properties. Use this when the user wants to select, find, or choose objects by their characteristics (e.g., "select all red circles", "select the blue rectangle", "find all text objects").',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['shape', 'text'],
          description: 'Filter by object category. Use "shape" for rectangles, circles, and lines. Use "text" for text objects.',
        },
        type: {
          type: 'string',
          enum: ['rectangle', 'circle', 'line'],
          description: 'Filter by shape type (only applies when category is "shape"). Use "rectangle" for rectangles/squares, "circle" for circles, "line" for lines.',
        },
        fillColor: {
          type: 'string',
          description: 'Filter by fill color as hex string (e.g., "#FF0000" for red, "#3B82F6" for blue). Common colors: red=#FF0000, green=#00FF00, blue=#3B82F6, yellow=#FFFF00, purple=#A855F7, orange=#F97316, white=#FFFFFF, black=#000000.',
        },
        strokeColor: {
          type: 'string',
          description: 'Filter by stroke/border color as hex string (e.g., "#000000" for black borders).',
        },
        color: {
          type: 'string',
          description: 'Filter text objects by text color as hex string (e.g., "#000000" for black text).',
        },
        content: {
          type: 'string',
          description: 'Filter text objects by content. Can be exact match or partial match (case-insensitive).',
        },
        minWidth: {
          type: 'number',
          description: 'Filter objects with width greater than or equal to this value (in pixels).',
        },
        maxWidth: {
          type: 'number',
          description: 'Filter objects with width less than or equal to this value (in pixels).',
        },
        minHeight: {
          type: 'number',
          description: 'Filter objects with height greater than or equal to this value (in pixels).',
        },
        maxHeight: {
          type: 'number',
          description: 'Filter objects with height less than or equal to this value (in pixels).',
        },
        minRadius: {
          type: 'number',
          description: 'Filter circles with radius greater than or equal to this value (in pixels).',
        },
        maxRadius: {
          type: 'number',
          description: 'Filter circles with radius less than or equal to this value (in pixels).',
        },
      },
      required: [], // All parameters optional - at least one should be provided
    },
  },
};

/**
 * Move Objects Tool
 * 
 * Changes the position of selected display objects
 * Can move to absolute position or relative offset
 */
export const moveObjectsTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'move_objects',
    description: 'Moves selected display objects to a new position. Use this when the user wants to move, reposition, or relocate selected objects. Can move to absolute coordinates or apply relative offsets. Canvas is 10,000x10,000 pixels with center at (5000, 5000).',
    parameters: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'Absolute X coordinate to move objects to. If provided, moves all selected objects so their collective center is at this X position. Canvas center is 5000.',
        },
        y: {
          type: 'number',
          description: 'Absolute Y coordinate to move objects to. If provided, moves all selected objects so their collective center is at this Y position. Canvas center is 5000.',
        },
        offsetX: {
          type: 'number',
          description: 'Relative X offset in pixels. Moves all selected objects by this amount horizontally. Positive values move right, negative move left.',
        },
        offsetY: {
          type: 'number',
          description: 'Relative Y offset in pixels. Moves all selected objects by this amount vertically. Positive values move down, negative move up.',
        },
        alignToCenter: {
          type: 'boolean',
          description: 'If true, moves selected objects to the canvas center (5000, 5000). Use this when user says "move to center" or "center the selection".',
        },
      },
      required: [], // At least one parameter should be provided
    },
  },
};

/**
 * All Available Tools
 * 
 * Array of all tools available to the AI agent
 */
export const allTools: ChatCompletionTool[] = [
  rectangleCreationTool,
  circleCreationTool,
  lineCreationTool,
  textCreationTool,
  selectObjectsTool,
  moveObjectsTool,
];
