# AI Agent Implementation Plan - CollabCanvas

## Document Information
- **Project**: CollabCanvas
- **Feature**: Agentic AI Commands with OpenAI Function Calling
- **Target Audience**: AI Development Agent (Cursor IDE)
- **Initial Scope**: Rectangle creation via natural language
- **Response Time Target**: ≤3 seconds
- **Location**: Implementation follows modular architecture from `_docs/ARCHITECTURE.md`

---

## Overview

This plan implements natural language command execution using OpenAI's function calling feature. Users will type commands like "Make a 200x300 rectangle" and the agent will execute the corresponding canvas operations.

### Technology Stack
- **OpenAI SDK**: Direct API integration (no LangChain)
- **Model**: GPT-4 Turbo or GPT-3.5 Turbo (both support function calling)
- **Integration**: Client-side API calls
- **Monitoring**: LangSmith can be added later for production observability

### Why Not LangChain?
- Client-side implementation (LangChain is primarily server-side focused)
- Simple tool calling pattern (don't need agent orchestration complexity)
- Better performance with direct SDK calls
- Easier debugging during initial development

---

## Implementation Steps

### Step 1: Environment Setup

**File**: `.env.development`

```bash
# Add to existing .env.development
VITE_OPENAI_API_KEY=sk-your-key-here
```

**Security Note**: This API key will be exposed client-side. For production:
- Use Firebase Functions as a proxy
- Implement rate limiting
- Monitor usage with OpenAI dashboard

---

### Step 2: Install Dependencies

```bash
npm install openai
```

**Package**: `openai@^4.0.0` (latest SDK with function calling support)

---

### Step 3: Create AI Agent Feature Structure

Create new feature module following your modular architecture:

```
src/
└── features/
    └── aiAgent/
        ├── components/
        │   └── AICommandModal.tsx       # Modal UI component
        ├── hooks/
        │   ├── useAIAgent.ts             # Main agent logic
        │   └── useAIModal.ts             # Modal state management
        ├── services/
        │   ├── openaiService.ts          # OpenAI API integration
        │   └── toolExecutor.ts           # Tool execution logic
        ├── tools/
        │   ├── toolDefinitions.ts        # OpenAI function schemas
        │   └── rectangleCreationTool.ts  # Rectangle creation implementation
        └── types.ts                      # TypeScript interfaces
```

---

### Step 4: Create Tool Definitions

**File**: `src/features/aiAgent/tools/toolDefinitions.ts`

```typescript
import { ChatCompletionTool } from 'openai/resources/chat';

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
          description: 'Width of the rectangle in pixels. Default is 100 if not specified.',
        },
        height: {
          type: 'number',
          description: 'Height of the rectangle in pixels. Default is 100 if not specified.',
        },
        x: {
          type: 'number',
          description: 'X coordinate for rectangle center. Default is 5000 (canvas center) if not specified.',
        },
        y: {
          type: 'number',
          description: 'Y coordinate for rectangle center. Default is 5000 (canvas center) if not specified.',
        },
        fillColor: {
          type: 'string',
          description: 'Fill color as hex string (e.g., "#FF0000" for red). Default is "#3B82F6" if not specified.',
        },
        strokeColor: {
          type: 'string',
          description: 'Stroke color as hex string. Default is "#1E40AF" if not specified.',
        },
        strokeWidth: {
          type: 'number',
          description: 'Stroke width in pixels. Default is 2 if not specified.',
        },
      },
      required: [], // All parameters optional with defaults
    },
  },
};

export const allTools: ChatCompletionTool[] = [
  rectangleCreationTool,
  // Future tools will be added here:
  // circleCreationTool,
  // lineCreationTool,
  // selectObjectsTool,
  // transformObjectsTool,
  // alignObjectsTool,
];
```

---

### Step 5: Create OpenAI Service

**File**: `src/features/aiAgent/services/openaiService.ts`

```typescript
import OpenAI from 'openai';
import { allTools } from '../tools/toolDefinitions';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Required for client-side usage
});

export interface AIResponse {
  needsToolCall: boolean;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, any>;
  }>;
  message?: string;
}

/**
 * Send user command to OpenAI and get tool calls or response
 */
export async function processCommand(userCommand: string): Promise<AIResponse> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview', // or 'gpt-3.5-turbo' for faster/cheaper
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant for CollabCanvas, a collaborative design tool. 
Your job is to interpret user commands and call the appropriate functions to manipulate canvas objects.

The canvas is 10,000 x 10,000 pixels. Center is at (5000, 5000).
When users don't specify positions, place objects near the center.
When users don't specify colors, use blue (#3B82F6) as default.
Be smart about interpreting dimensions - "large rectangle" should be bigger than default.`,
        },
        {
          role: 'user',
          content: userCommand,
        },
      ],
      tools: allTools,
      tool_choice: 'auto', // Let model decide if tool call needed
    });

    const message = response.choices[0].message;

    // Check if model wants to call a tool
    if (message.tool_calls && message.tool_calls.length > 0) {
      return {
        needsToolCall: true,
        toolCalls: message.tool_calls.map(call => ({
          id: call.id,
          name: call.function.name,
          arguments: JSON.parse(call.function.arguments),
        })),
      };
    }

    // No tool call needed, just return message
    return {
      needsToolCall: false,
      message: message.content || 'I understand, but I\'m not sure how to help with that.',
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to process command. Please check your API key and try again.');
  }
}
```

---

### Step 6: Create Tool Executor

**File**: `src/features/aiAgent/services/toolExecutor.ts`

```typescript
import { v4 as uuidv4 } from 'uuid';
import { createShape } from '../../displayObjects/shapes/services/shapeService';
import { ShapeType } from '../../displayObjects/shapes/types';

export interface ToolExecutionResult {
  success: boolean;
  createdObjectIds: string[];
  error?: string;
}

/**
 * Execute a tool call by name with given arguments
 */
export async function executeTool(
  toolName: string,
  args: Record<string, any>,
  userId: string
): Promise<ToolExecutionResult> {
  try {
    switch (toolName) {
      case 'create_rectangle':
        return await executeCreateRectangle(args, userId);
      
      // Future tool executions:
      // case 'create_circle':
      //   return await executeCreateCircle(args, userId);
      // case 'select_objects':
      //   return await executeSelectObjects(args);
      
      default:
        return {
          success: false,
          createdObjectIds: [],
          error: `Unknown tool: ${toolName}`,
        };
    }
  } catch (error) {
    console.error(`Tool execution error (${toolName}):`, error);
    return {
      success: false,
      createdObjectIds: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute rectangle creation tool
 */
async function executeCreateRectangle(
  args: Record<string, any>,
  userId: string
): Promise<ToolExecutionResult> {
  // Apply defaults
  const width = args.width || 100;
  const height = args.height || 100;
  const x = args.x || 5000; // Canvas center
  const y = args.y || 5000; // Canvas center
  const fillColor = args.fillColor || '#3B82F6';
  const strokeColor = args.strokeColor || '#1E40AF';
  const strokeWidth = args.strokeWidth || 2;

  // Create shape using existing service
  const shapeId = uuidv4();
  await createShape({
    id: shapeId,
    type: 'rectangle' as ShapeType,
    x,
    y,
    width,
    height,
    fillColor,
    strokeColor,
    strokeWidth,
    opacity: 1,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    zIndex: Date.now(), // Use timestamp for z-index
    userId,
  });

  return {
    success: true,
    createdObjectIds: [shapeId],
  };
}
```

---

### Step 7: Create AI Modal Component

**File**: `src/features/aiAgent/components/AICommandModal.tsx`

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { useAIAgent } from '../hooks/useAIAgent';

interface AICommandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AICommandModal({ isOpen, onClose }: AICommandModalProps) {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { executeCommand } = useAIAgent();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      await executeCommand(command);
      setCommand('');
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to execute command');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">AI Command</h2>
          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Try: 'Make a 200x300 blue rectangle' or 'Create a large red circle'"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isProcessing}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!command.trim() || isProcessing}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Execute'}
              </button>
            </div>
          </form>
          <div className="mt-4 text-sm text-gray-500">
            <p className="font-semibold mb-2">Example commands:</p>
            <ul className="space-y-1">
              <li>• "Make a 200x300 rectangle"</li>
              <li>• "Create a red square"</li>
              <li>• "Add a blue rectangle at position 2000, 3000"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### Step 8: Create Agent Hook

**File**: `src/features/aiAgent/hooks/useAIAgent.ts`

```typescript
import { useCallback } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useSelection } from '../../displayObjects/common/hooks/useSelection';
import { processCommand } from '../services/openaiService';
import { executeTool } from '../services/toolExecutor';

export function useAIAgent() {
  const { user } = useAuth();
  const { selectObjects } = useSelection();

  const executeCommand = useCallback(
    async (userCommand: string) => {
      if (!user) {
        throw new Error('You must be logged in to use AI commands');
      }

      // Step 1: Send command to OpenAI
      const response = await processCommand(userCommand);

      // Step 2: If no tool call needed, show message
      if (!response.needsToolCall) {
        if (response.message) {
          alert(response.message);
        }
        return;
      }

      // Step 3: Execute tool calls
      if (response.toolCalls) {
        const allCreatedIds: string[] = [];

        for (const toolCall of response.toolCalls) {
          const result = await executeTool(
            toolCall.name,
            toolCall.arguments,
            user.uid
          );

          if (!result.success) {
            throw new Error(result.error || 'Tool execution failed');
          }

          allCreatedIds.push(...result.createdObjectIds);
        }

        // Step 4: Auto-select created objects
        if (allCreatedIds.length > 0) {
          // Small delay to ensure Firestore write completes
          setTimeout(() => {
            selectObjects(allCreatedIds);
          }, 100);
        }
      }
    },
    [user, selectObjects]
  );

  return {
    executeCommand,
  };
}
```

---

### Step 9: Create Modal State Hook

**File**: `src/features/aiAgent/hooks/useAIModal.ts`

```typescript
import { useState, useCallback } from 'react';

export function useAIModal() {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    openModal,
    closeModal,
  };
}
```

---

### Step 10: Add AI Button to Toolbar

**File**: `src/features/displayObjects/common/components/DisplayObjectToolbar.tsx`

```typescript
import React from 'react';
import { useTool } from '../hooks/useTool';
import { useAIModal } from '../../../aiAgent/hooks/useAIModal';
import { AICommandModal } from '../../../aiAgent/components/AICommandModal';

export function DisplayObjectToolbar() {
  const { currentTool, setTool } = useTool();
  const { isOpen, openModal, closeModal } = useAIModal();

  return (
    <>
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-900 bg-opacity-95 rounded-lg shadow-lg flex gap-2 p-2">
        {/* Existing tool buttons */}
        <button
          onClick={() => setTool('select')}
          className={`px-4 py-2 rounded ${
            currentTool === 'select' ? 'bg-blue-500' : 'hover:bg-gray-700'
          }`}
        >
          🖱️ Select
        </button>
        <button
          onClick={() => setTool('rectangle')}
          className={`px-4 py-2 rounded ${
            currentTool === 'rectangle' ? 'bg-blue-500' : 'hover:bg-gray-700'
          }`}
        >
          ▭ Rectangle
        </button>
        {/* ... other tool buttons ... */}

        {/* Divider */}
        <div className="w-px bg-gray-600 mx-2" />

        {/* AI Button */}
        <button
          onClick={openModal}
          className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white font-semibold"
          title="AI Commands"
        >
          ✨ AI
        </button>
      </div>

      {/* AI Command Modal */}
      <AICommandModal isOpen={isOpen} onClose={closeModal} />
    </>
  );
}
```

---

### Step 11: Type Definitions

**File**: `src/features/aiAgent/types.ts`

```typescript
export interface AICommand {
  id: string;
  userId: string;
  command: string;
  timestamp: number;
  executionTime: number;
  success: boolean;
  error?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}
```

---

## Testing Plan

### Manual Testing Steps

1. **Basic Rectangle Creation**
   ```
   Command: "Make a rectangle"
   Expected: 100x100 blue rectangle at center
   ```

2. **Specified Dimensions**
   ```
   Command: "Create a 200x300 rectangle"
   Expected: 200x300 blue rectangle at center
   ```

3. **Color Specification**
   ```
   Command: "Make a red rectangle"
   Expected: Red rectangle with default size
   ```

4. **Position Specification**
   ```
   Command: "Create a rectangle at position 2000, 3000"
   Expected: Rectangle at specified coordinates
   ```

5. **Complex Command**
   ```
   Command: "Make a large green rectangle with black border"
   Expected: Large green rectangle with black stroke
   ```

6. **Auto-Selection**
   ```
   After any creation command, verify:
   - Object is automatically selected
   - Transform modal appears
   - Object has highlight
   ```

### Error Cases

1. **No API Key**
   - Remove API key from .env
   - Should show error alert

2. **Invalid Command**
   ```
   Command: "Make me a sandwich"
   Expected: Polite message that it can't help
   ```

3. **Network Error**
   - Disable network
   - Should show error alert

---

## Performance Considerations

### Response Time Optimization

**Target**: ≤3 seconds total

**Breakdown**:
- OpenAI API call: ~1-2 seconds
- Tool execution: ~100-200ms
- UI updates: ~50ms

**Optimizations**:
1. Use `gpt-3.5-turbo` for faster responses (vs GPT-4)
2. Keep function descriptions concise
3. Use optimistic UI updates
4. Show loading state immediately

### Cost Optimization

**Estimated Costs** (per 1000 commands):
- GPT-3.5-Turbo: ~$0.02
- GPT-4-Turbo: ~$0.20

**Recommendations**:
- Start with GPT-3.5-Turbo
- Monitor usage in OpenAI dashboard
- Set spending limits

---

## Future Enhancements

### Phase 2: Additional Creation Tools

```typescript
// Add to toolDefinitions.ts
export const circleCreationTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_circle',
    description: 'Creates a circle shape on the canvas.',
    parameters: {
      type: 'object',
      properties: {
        radius: { type: 'number', description: 'Circle radius in pixels' },
        x: { type: 'number', description: 'X coordinate' },
        y: { type: 'number', description: 'Y coordinate' },
        fillColor: { type: 'string', description: 'Fill color hex' },
      },
    },
  },
};
```

### Phase 3: Selection Tools

```typescript
export const selectObjectsTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'select_objects',
    description: 'Selects objects based on criteria like type, color, or position.',
    parameters: {
      type: 'object',
      properties: {
        type: { 
          type: 'string', 
          enum: ['rectangle', 'circle', 'line', 'text'],
          description: 'Object type to select'
        },
        fillColor: { type: 'string', description: 'Filter by fill color' },
        minX: { type: 'number', description: 'Minimum X coordinate' },
        maxX: { type: 'number', description: 'Maximum X coordinate' },
        minY: { type: 'number', description: 'Minimum Y coordinate' },
        maxY: { type: 'number', description: 'Maximum Y coordinate' },
      },
    },
  },
};
```

### Phase 4: Transform Tools

```typescript
export const transformObjectsTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'transform_objects',
    description: 'Transforms selected objects (translate, rotate, scale).',
    parameters: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['translate', 'rotate', 'scale'],
          description: 'Type of transformation'
        },
        deltaX: { type: 'number', description: 'X translation' },
        deltaY: { type: 'number', description: 'Y translation' },
        rotation: { type: 'number', description: 'Rotation in degrees' },
        scaleX: { type: 'number', description: 'X scale factor' },
        scaleY: { type: 'number', description: 'Y scale factor' },
      },
      required: ['operation'],
    },
  },
};
```

### Phase 5: Alignment Tools

```typescript
export const alignObjectsTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'align_objects',
    description: 'Aligns or distributes selected objects.',
    parameters: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['align-left', 'align-center', 'align-right', 'align-top', 'align-middle', 'align-bottom', 'distribute-horizontal', 'distribute-vertical'],
          description: 'Alignment operation'
        },
      },
      required: ['operation'],
    },
  },
};
```

### Phase 6: LangSmith Integration

When ready for production observability:

```typescript
// Add to openaiService.ts
import { Client } from 'langsmith';

const langsmithClient = new Client({
  apiKey: import.meta.env.VITE_LANGSMITH_API_KEY,
});

// Wrap API calls with tracing
export async function processCommand(userCommand: string): Promise<AIResponse> {
  const runId = await langsmithClient.createRun({
    name: 'ai-command',
    inputs: { command: userCommand },
    run_type: 'chain',
  });

  try {
    // ... existing OpenAI logic ...
    
    await langsmithClient.updateRun(runId, {
      outputs: { response },
      end_time: Date.now(),
    });
    
    return response;
  } catch (error) {
    await langsmithClient.updateRun(runId, {
      error: error.message,
      end_time: Date.now(),
    });
    throw error;
  }
}
```

---

## Security Considerations

### Client-Side API Key Exposure

**Current Implementation** (Development):
- API key is in .env.development
- Exposed in browser (acceptable for local dev)

**Production Implementation** (Required):
```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Browser   │ ──────> │ Firebase Function│ ──────> │   OpenAI    │
│   Client    │         │    (Proxy)       │         │     API     │
└─────────────┘         └──────────────────┘         └─────────────┘
     HTTPS                  API Key hidden              Secured
```

**Firebase Function Example**:
```typescript
// functions/src/aiCommand.ts
import * as functions from 'firebase-functions';
import OpenAI from 'openai';

export const processAICommand = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  // Rate limiting check
  // ... implement rate limiting ...

  // Call OpenAI with server-side key
  const openai = new OpenAI({
    apiKey: functions.config().openai.key,
  });

  // ... process command ...
});
```

### Rate Limiting

Implement in production:
- Max 10 commands per minute per user
- Max 100 commands per hour per user
- Track in Firestore or Redis

---

## Deployment Checklist

### Development
- [x] Install dependencies
- [x] Add API key to .env.development
- [x] Create feature module structure
- [x] Implement tool definitions
- [x] Implement OpenAI service
- [x] Implement tool executor
- [x] Create UI components
- [x] Test basic commands
- [x] Test error handling

### Production
- [ ] Move API calls to Firebase Functions
- [ ] Implement rate limiting
- [ ] Add usage monitoring
- [ ] Set up error logging
- [ ] Add LangSmith tracing
- [ ] Load test with concurrent users
- [ ] Document for team

---

## Troubleshooting

### Common Issues

**Issue**: "API key not found"
**Solution**: Verify .env.development has VITE_OPENAI_API_KEY

**Issue**: "Tool execution failed"
**Solution**: Check browser console for shape service errors

**Issue**: "Objects not auto-selecting"
**Solution**: Verify tool state is 'select' after creation

**Issue**: "Slow responses (>3s)"
**Solution**: 
- Switch to gpt-3.5-turbo
- Check network latency
- Verify function descriptions are concise

---

## Success Metrics

Track these metrics for evaluation:

1. **Response Time**: Average <3s end-to-end
2. **Success Rate**: >95% successful executions
3. **User Satisfaction**: Qualitative feedback
4. **Cost**: <$0.05 per user per day
5. **Error Rate**: <5% API failures

---

## Next Steps

1. **Immediate**: Implement Steps 1-10 in order
2. **Week 1**: Test rectangle creation thoroughly
3. **Week 2**: Add circle and line creation tools
4. **Week 3**: Add selection tools
5. **Week 4**: Add transform and alignment tools
6. **Month 2**: Move to Firebase Functions for production

---

## Support & Resources

### Documentation Links
- [OpenAI Function Calling Docs](https://platform.openai.com/docs/guides/function-calling)
- [OpenAI Node.js SDK](https://github.com/openai/openai-node)
- [LangSmith Docs](https://docs.smith.langchain.com/)

### Example Commands Reference

```
Creation:
- "Make a rectangle"
- "Create a 200x300 blue rectangle"
- "Add a red circle at 1000, 2000"
- "Draw a green line from 0,0 to 1000,1000"

Selection (Future):
- "Select all rectangles"
- "Select objects with red fill"
- "Select everything in the top-left quadrant"

Transform (Future):
- "Move selected objects 100 pixels right"
- "Rotate selected objects 45 degrees"
- "Scale selected objects to 200%"

Alignment (Future):
- "Align selected objects to the left"
- "Distribute selected objects horizontally"
- "Center selected objects on the canvas"
```

---

## End of Implementation Plan

This plan provides a complete, step-by-step guide to implementing agentic AI commands in CollabCanvas. Follow the steps in order, test thoroughly, and expand functionality incrementally.

**Key Principles:**
1. Start simple (rectangles only)
2. Test extensively before adding complexity
3. Monitor costs and performance
4. Secure API keys in production
5. Follow modular architecture patterns

Good luck with implementation! 🚀
