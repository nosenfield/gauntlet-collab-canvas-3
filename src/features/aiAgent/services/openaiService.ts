/**
 * OpenAI Service
 * 
 * Service layer for OpenAI API integration
 * Handles chat completions with function calling
 */

import OpenAI from 'openai';
import { allTools } from '../tools/toolDefinitions';
import type { AIResponse } from '../types';

/**
 * Initialize OpenAI client
 * API key is loaded from environment variable
 */
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Required for client-side usage
});

/**
 * System prompt for the AI agent
 * Provides context about CollabCanvas and how to interpret commands
 */
const SYSTEM_PROMPT = `You are an AI assistant for CollabCanvas, a collaborative design tool similar to Figma.

Your job is to interpret user commands and call the appropriate functions to manipulate canvas objects.

CANVAS SPECIFICATIONS:
- Canvas size: 10,000 x 10,000 pixels
- Canvas center: (5000, 5000)
- Coordinate system: (0, 0) is top-left, (10000, 10000) is bottom-right

COLOR GUIDELINES:
- All colors must be in hex format (#RRGGBB)
- Default fill: #3B82F6 (blue)
- Default stroke: #1E40AF (dark blue)
- Color matching is SEMANTIC: "red" matches any shade where red channel dominates (e.g., #FF0000, #EF4444, #DC2626, #F00000)
- Common colors:
  - Red: #FF0000 (pure), #EF4444 (lighter), #DC2626 (darker), or any red-dominant color
  - Green: #00FF00 (pure), #10B981, #059669, or any green-dominant color
  - Blue: #3B82F6, #2563EB, #1E40AF, or any blue-dominant color
  - Yellow: #FFFF00, #FBBF24, #F59E0B
  - Purple: #A855F7, #9333EA, #7C3AED
  - Orange: #F97316, #EA580C, #C2410C
  - Black: #000000
  - White: #FFFFFF
  - Gray: #6B7280, #9CA3AF, #D1D5DB

SIZE INTERPRETATION:
IMPORTANT: Size descriptors are THRESHOLDS, not ranges:
- "small" means ≤ 80px (use maxWidth/maxHeight ONLY, no min)
- "medium" means ≥ 100px (use minWidth/minHeight ONLY, no max)
- "big" or "large" means ≥ 150px (use minWidth/minHeight ONLY, no max)
- "huge" or "massive" means ≥ 300px (use minWidth/minHeight ONLY, no max)

Examples:
- "small circle" → {maxWidth: 80, maxHeight: 80} // matches anything ≤ 80px
- "big circle" → {minWidth: 150, minHeight: 150} // matches 150px, 200px, 500px, etc.
- "large rectangle" → {minWidth: 150, minHeight: 150} // no upper limit!

CIRCLE SIZE GUIDELINES:
- Circles are ALWAYS described by diameter (width/height), NEVER by radius
- A "100x100 circle" has width=100, height=100 (radius internally is 50, but users never say this)
- When selecting circles, use minWidth/maxWidth/minHeight/maxHeight, NOT minRadius/maxRadius
- Examples:
  - "big circle" → {minWidth: 150, minHeight: 150} // no maxWidth!
  - "small circle" → {maxWidth: 80, maxHeight: 80} // no minWidth!
  - "100 pixel circle" → {minWidth: 100, maxWidth: 100, minHeight: 100, maxHeight: 100} // exact size

POSITION GUIDELINES:
- If not specified, place objects near center (5000, 5000)
- Top-left area: ~(1000-3000, 1000-3000)
- Top-right area: ~(7000-9000, 1000-3000)
- Bottom-left area: ~(1000-3000, 7000-9000)
- Bottom-right area: ~(7000-9000, 7000-9000)

SHAPE INTERPRETATION:
- "Square" means equal width and height
- "Rounded rectangle" means use borderRadius (8-16)
- "Large" typically means 2-4x the default size

SELECTION STRATEGY:
When user says "the [descriptor] [object]":
- Use size as a THRESHOLD filter, not exact range
- "the big circle" will match ALL circles ≥ 150px (if multiple exist, that's fine - select them all)
- "the small rectangle" will match ALL rectangles ≤ 80px
- If user wants a single specific object, they'll say "the biggest" or provide more details
- Don't artificially limit selections with both min AND max unless explicitly needed

TOOL CALL CHAINING - CRITICAL:
⚠️ MOST COMMANDS REQUIRE MULTIPLE TOOL CALLS IN ONE RESPONSE ⚠️

YOU MUST RETURN ARRAY OF TOOL CALLS, NOT JUST ONE!

Commands that REQUIRE TWO tool calls (return BOTH in one response):

1. "Move the red circle 500px right" → 
   [select_objects({type: "circle", fillColor: "#FF0000"}), 
    move_objects({offsetX: 500})]

2. "Move the big red circle to the right" → 
   [select_objects({type: "circle", fillColor: "#FF0000", minWidth: 150}), 
    move_objects({offsetX: 500})]

3. "Move the textfield 100px left" or "Move the text 100px left" → 
   [select_objects({category: "text"}), 
    move_objects({offsetX: -100})]

4. "Center the blue square" → 
   [select_objects({type: "rectangle", fillColor: "#3B82F6"}), 
    move_objects({alignToCenter: true})]

5. "Move all rectangles right" → 
   [select_objects({type: "rectangle"}), 
    move_objects({offsetX: 200})]

PATTERN RECOGNITION:
- Does command mention EXISTING object? (red circle, the text, big rectangle, etc.)
- Does command want to DO something? (move, center, reposition, etc.)
- If YES to BOTH → Return TWO tool calls [select_objects, move_objects]

Commands that need ONE tool call:
- "Create a red circle" → [create_circle(...)]
- "Make a blue rectangle" → [create_rectangle(...)]
- "Add text that says hello" → [create_text(...)]

IMPORTANT: When you return multiple tool calls, they will be executed sequentially!
First call selects the objects, second call operates on selected objects.

Be intelligent about interpreting user intent while staying within canvas bounds.`;

/**
 * Process user command through OpenAI
 * 
 * Sends the command to OpenAI and returns either:
 * 1. Tool calls to execute
 * 2. A message if no tool call is needed
 * 
 * @param userCommand - Natural language command from user
 * @returns Promise resolving to AI response with tool calls or message
 * @throws Error if API call fails
 */
export async function processCommand(userCommand: string): Promise<AIResponse> {
  try {
    console.log('[OpenAI] Processing command:', userCommand);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo', // Better tool calling support than preview
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        // Add a few-shot example to teach chaining
        {
          role: 'user',
          content: 'Move the red circle 200px right',
        },
        {
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id: 'example1',
              type: 'function' as const,
              function: {
                name: 'select_objects',
                arguments: JSON.stringify({ category: 'shape', type: 'circle', fillColor: '#FF0000' }),
              },
            },
            {
              id: 'example2',
              type: 'function' as const,
              function: {
                name: 'move_objects',
                arguments: JSON.stringify({ offsetX: 200 }),
              },
            },
          ],
        },
        {
          role: 'tool',
          content: 'Selected 1 object(s)',
          tool_call_id: 'example1',
        },
        {
          role: 'tool',
          content: 'Moved 1 object(s)',
          tool_call_id: 'example2',
        },
        {
          role: 'user',
          content: userCommand,
        },
      ],
      tools: allTools,
      tool_choice: 'auto', // Let model decide if tool call needed
      temperature: 0.1, // Very low temperature for consistent behavior
      parallel_tool_calls: true, // Allow multiple tool calls in one response
    });

    const message = response.choices[0].message;
    console.log('[OpenAI] Response:', message);

    // Check if model wants to call a tool
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCalls = message.tool_calls.map(call => {
        // Type guard for standard tool calls
        if (call.type === 'function' && 'function' in call) {
          return {
            id: call.id,
            name: call.function.name,
            arguments: JSON.parse(call.function.arguments),
          };
        }
        throw new Error(`Unsupported tool call type: ${call.type}`);
      });
      
      console.log(`[OpenAI] Received ${toolCalls.length} tool call(s):`, toolCalls);
      
      return {
        needsToolCall: true,
        toolCalls,
      };
    }

    // No tool call needed, return message
    const messageContent = message.content || 
      'I understand, but I\'m not sure how to help with that.';
    
    console.log('[OpenAI] No tool call, message:', messageContent);
    
    return {
      needsToolCall: false,
      message: messageContent,
    };
  } catch (error) {
    console.error('[OpenAI] API Error:', error);
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('OpenAI API key is missing or invalid. Please check your .env.local file.');
      }
      if (error.message.includes('rate limit')) {
        throw new Error('OpenAI rate limit exceeded. Please wait a moment and try again.');
      }
      if (error.message.includes('network')) {
        throw new Error('Network error. Please check your internet connection.');
      }
    }
    
    throw new Error('Failed to process command. Please try again.');
  }
}

