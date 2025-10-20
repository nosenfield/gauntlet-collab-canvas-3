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
- Common colors:
  - Red: #FF0000, #EF4444, #DC2626
  - Green: #00FF00, #10B981, #059669
  - Blue: #3B82F6, #2563EB, #1E40AF
  - Yellow: #FFFF00, #FBBF24, #F59E0B
  - Purple: #A855F7, #9333EA, #7C3AED
  - Orange: #F97316, #EA580C, #C2410C
  - Black: #000000
  - White: #FFFFFF
  - Gray: #6B7280, #9CA3AF, #D1D5DB

SIZE INTERPRETATION:
- Default: 100x100 pixels
- Small: 50-80 pixels
- Medium: 100-150 pixels
- Large: 200-400 pixels
- Huge/Massive: 400-600 pixels

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
      model: 'gpt-4-turbo-preview', // or 'gpt-3.5-turbo' for faster/cheaper
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userCommand,
        },
      ],
      tools: allTools,
      tool_choice: 'auto', // Let model decide if tool call needed
      temperature: 0.7, // Slightly creative but mostly deterministic
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
      
      console.log('[OpenAI] Tool calls:', toolCalls);
      
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

