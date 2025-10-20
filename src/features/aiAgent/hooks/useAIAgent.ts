/**
 * useAIAgent Hook
 * 
 * Main hook for AI agent functionality
 * Orchestrates command processing, tool execution, and object selection
 */

import { useCallback } from 'react';
import { useAuth } from '@/features/auth/store/authStore';
import { useSelection } from '@/features/displayObjects/common/store/selectionStore';
import { useShapes } from '@/features/displayObjects/shapes/store/shapesStore';
import { useTexts } from '@/features/displayObjects/texts/store/textsStore';
import { processCommand } from '../services/openaiService';
import { executeTool } from '../services/toolExecutor';

/**
 * useAIAgent Hook
 * 
 * Provides the main executeCommand function for processing natural language
 * 
 * @returns Object with executeCommand function
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { executeCommand } = useAIAgent();
 *   
 *   const handleCommand = async () => {
 *     await executeCommand("Make a 200x300 blue rectangle");
 *   };
 * }
 * ```
 */
export function useAIAgent() {
  const { user } = useAuth();
  const { setSelection, selectedIds } = useSelection();
  const { shapes } = useShapes();
  const { texts } = useTexts();

  /**
   * Execute a natural language command
   * 
   * Flow:
   * 1. Send command to OpenAI for interpretation
   * 2. Execute any tool calls returned
   * 3. Auto-select created objects (or handle selection tool)
   * 
   * @param userCommand - Natural language command from user
   * @throws Error if user not authenticated or execution fails
   */
  const executeCommand = useCallback(
    async (userCommand: string) => {
      // Ensure user is authenticated
      if (!user) {
        throw new Error('You must be logged in to use AI commands');
      }

      console.log('[AIAgent] Executing command:', userCommand);
      const startTime = performance.now();

      try {
        // Step 1: Send command to OpenAI
        const response = await processCommand(userCommand);

        // Step 2: If no tool call needed, show message
        if (!response.needsToolCall) {
          if (response.message) {
            // Show message to user (could be improved with toast notification)
            alert(response.message);
          }
          return;
        }

        // Step 3: Execute tool calls
        if (response.toolCalls) {
          const allCreatedIds: string[] = [];
          let currentSelectedIds = selectedIds; // Track selection across tool calls

          console.log(`[AIAgent] Executing ${response.toolCalls.length} tool call(s)...`);

          // Execute each tool call sequentially
          for (let i = 0; i < response.toolCalls.length; i++) {
            const toolCall = response.toolCalls[i];
            console.log(`[AIAgent] Tool call ${i + 1}/${response.toolCalls.length}:`, toolCall.name, toolCall.arguments);
            
            // Prepare context for tools that need it (like selection and move)
            // Use currentSelectedIds which gets updated after each tool
            const context = {
              shapes,
              texts,
              setSelection: (ids: string[]) => {
                // Update both the store and our local tracker
                setSelection(ids);
                currentSelectedIds = ids;
                console.log('[AIAgent] Selection updated to:', ids);
              },
              selectedIds: currentSelectedIds,
            };
            
            const result = await executeTool(
              toolCall.name,
              toolCall.arguments,
              user.userId,
              context
            );

            if (!result.success) {
              throw new Error(result.error || 'Tool execution failed');
            }

            // Show message if tool provided one (e.g., selection results)
            if (result.message) {
              console.log(`[AIAgent] Tool message: ${result.message}`);
            }

            allCreatedIds.push(...result.createdObjectIds);
          }

          // Step 4: Auto-select created objects (only for creation tools)
          if (allCreatedIds.length > 0) {
            // Small delay to ensure Firestore write completes and triggers real-time listener
            setTimeout(() => {
              setSelection(allCreatedIds);
              console.log('[AIAgent] Auto-selected created objects:', allCreatedIds);
            }, 150);
          }

          // Log execution time
          const executionTime = performance.now() - startTime;
          console.log(`[AIAgent] Command executed successfully in ${executionTime.toFixed(0)}ms`);
          console.log(`[AIAgent] Created ${allCreatedIds.length} object(s)`);
        }
      } catch (error) {
        console.error('[AIAgent] Command execution failed:', error);
        
        // Re-throw with user-friendly message
        if (error instanceof Error) {
          throw error;
        }
        
        throw new Error('Failed to execute command. Please try again.');
      }
    },
    [user, setSelection, shapes, texts, selectedIds]
  );

  return {
    executeCommand,
  };
}

