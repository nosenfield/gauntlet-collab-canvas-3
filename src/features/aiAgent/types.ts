/**
 * AI Agent Types
 * 
 * Type definitions for the AI agent feature module
 */

/**
 * AI Command
 * Represents a user command executed by the AI agent
 */
export interface AICommand {
  id: string;
  userId: string;
  command: string;
  timestamp: number;
  executionTime: number;
  success: boolean;
  error?: string;
}

/**
 * Tool Call
 * Represents an OpenAI function call
 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

/**
 * Tool Result
 * Result of executing a tool
 */
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * AI Response
 * Response from OpenAI API
 */
export interface AIResponse {
  needsToolCall: boolean;
  toolCalls?: ToolCall[];
  message?: string;
}

/**
 * Tool Execution Result
 * Result of executing a tool with created object IDs
 */
export interface ToolExecutionResult {
  success: boolean;
  createdObjectIds: string[];
  error?: string;
}

