# Task List - CollabCanvas Implementation
# AI Agent Development Guide

---

## Document Information
- **Project**: CollabCanvas
- **Target Agent**: Cursor IDE AI Agent
- **Execution Model**: Sequential task completion with verification gates
- **Location**: `_docs/TASK_LIST.md`
- **Related Documents**: 
  - PRD: `_docs/PRD.md`
  - Architecture Diagram: `_docs/ARCHITECTURE.md`

---

## Task Execution Rules

### For AI Agent:
1. **Complete tasks sequentially** - Do not skip ahead
2. **Verify completion** - Each task has specific verification steps
3. **Request approval** - Wait for human verification before proceeding to next task
4. **Log issues** - Document any blockers or deviations
5. **Maintain structure** - Follow React Architecture Guide principles
6. **TypeScript strict** - All code must pass strict TypeScript checks

### Verification Format:
After completing each task, provide:
```
✅ TASK COMPLETED: [Task ID]
📋 Changes Made:
- [List of files created/modified]
- [Key implementation details]

🧪 Verification Steps:
- [How to verify this task is complete]
- [What to look for in browser/console]

⚠️ Known Issues:
- [Any issues or limitations]

🔄 Ready for: [Next Task ID]
```

---

## Project Setup Phase

### SETUP-1: Initialize Project Structure

**Objective**: Create React + TypeScript + Vite project with proper folder structure

**Actions**:
1. Create new Vite project with React-TypeScript template
2. Install core dependencies:
   ```bash
   npm install konva react-konva
   npm install firebase
   npm install -D @types/node
   ```
3. Create folder structure following React Architecture Guide:
   ```
   project-root/
   ├── _docs/                    # Project documentation
   │   ├── PRD.md
   │   ├── TASK_LIST.md
   │   ├── ARCHITECTURE.md
   │   └── react-architecture-guide.md (optional reference)
   │
   ├── src/
   │   ├── api/              # Firebase client setup
   │   ├── components/
   │   │   ├── atoms/
   │   │   ├── molecules/
   │   │   └── organisms/
   │   ├── features/
   │   │   ├── canvas/       # Canvas feature module
   │   │   ├── auth/         # Auth feature module
   │   │   └── shapes/       # Shapes feature module
   │   ├── hooks/            # Custom hooks
   │   ├── services/         # Business logic
   │   ├── store/            # State management
   │   ├── types/            # TypeScript types
   │   ├── utils/            # Utility functions
   │   └── App.tsx
   │
   └── [other config files]
   ```

4. Configure TypeScript strict mode in `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true,
       "strictFunctionTypes": true,
       "noImplicitThis": true
     }
   }
   ```

5. Set up ESLint with React + TypeScript rules

**Verification**:
- [ ] Project builds without errors: `npm run dev`
- [ ] Folder structure matches specification
- [ ] TypeScript strict mode enabled
- [ ] All dependencies installed correctly

**Files to Create**:
- `tsconfig.json` (updated)
- `.eslintrc.json`
- `src/` folder structure

---

### SETUP-2: Firebase Configuration

**Objective**: Set up Firebase client with both Firestore and Realtime Database

**Actions**:
1. Create `src/api/firebase.ts` with Firebase initialization
   ```typescript
   // Initialize Firebase app
   // Export firestore, database (Realtime DB), auth instances
   // Use environment variables for config
   ```

2. Create `src/api/firebaseConfig.ts.example` template:
   ```typescript
   export const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     databaseURL: "YOUR_DATABASE_URL", // Realtime Database URL
     // ... other config
   };
   ```

3. Create `.env.local.example` with Firebase variables including database URL

4. Create TypeScript types for Firebase data:
   - `src/types/firebase.ts`
   - Define User, UserPresence, Shape interfaces from PRD
   - Note: UserPresence uses number timestamps (not Firestore Timestamp) for Realtime DB

**Verification**:
- [ ] Firebase initializes without errors
- [ ] Firestore instance available
- [ ] Realtime Database instance available
- [ ] Environment variables load correctly
- [ ] TypeScript types are defined and exported

**Files to Create**:
- `src/api/firebase.ts`
- `src/api/firebaseConfig.ts.example`
- `src/types/firebase.ts`
- `.env.local.example`

---

## Stage 1: Canvas with Pan/Zoom

### STAGE1-1: Basic Canvas Setup

**Objective**: Render a Konva Stage with 10,000 x 10,000 canvas area

**Actions**:
1. Create `src/features/canvas/components/Canvas.tsx`
   - Konva Stage component
   - 10,000 x 10,000 layer dimensions
   - Fill entire browser window

2. Create `src/features/canvas/hooks/useCanvasSize.tsx`
   - Custom hook to track window dimensions
   - Resize listener for responsive canvas

3. Create `src/types/canvas.ts`
   ```typescript
   interface ViewportState {
     x: number;
     y: number;
     scale: number;
     width: number;
     height: number;
   }
   
   interface CanvasConfig {
     width: 10000;
     height: 10000;
     gridSpacing: 100;
     gridAccent: 5;
   }
   ```

4. Update `src/App.tsx` to render Canvas component

**Verification**:
- [ ] Canvas renders and fills entire browser window
- [ ] Canvas resizes when window resizes
- [ ] No console errors
- [ ] TypeScript compiles without errors

**Files to Create**:
- `src/features/canvas/components/Canvas.tsx`
- `src/features/canvas/hooks/useCanvasSize.ts`
- `src/types/canvas.ts`

**Files to Modify**:
- `src/App.tsx`

---

### STAGE1-2: Grid Background

**Objective**: Render grid background with scaling specifications

**Actions**:
1. Create `src/features/canvas/components/GridBackground.tsx`
   - Konva Layer with Lines
   - Dark gray background (#2A2A2A)
   - Primary grid lines: white 25% opacity, 100px spacing
   - Secondary grid lines: white 50% opacity, every 5th line (500px)
   - Grid should scale with viewport zoom level

2. Create `src/features/canvas/utils/gridUtils.ts`
   - Helper functions to calculate visible grid lines
   - Optimize rendering to only draw visible lines

3. Integrate GridBackground into Canvas component

**Verification**:
- [ ] Grid displays with correct colors and opacity
- [ ] Primary grid lines at 100px spacing
- [ ] Secondary grid lines at 500px spacing (every 5th line)
- [ ] Grid scales when zooming (tested manually with placeholder zoom)
- [ ] Background is dark gray
- [ ] No performance issues with grid rendering

**Files to Create**:
- `src/features/canvas/components/GridBackground.tsx`
- `src/features/canvas/utils/gridUtils.ts`

**Files to Modify**:
- `src/features/canvas/components/Canvas.tsx`

---

### STAGE1-3: Pan Implementation

**Objective**: Implement smooth panning with scroll/drag

**Actions**:
1. Create `src/features/canvas/hooks/usePan.ts`
   - Track mouse drag events
   - Calculate delta movement
   - Update viewport position
   - Constrain to canvas boundaries (0,0 to 10000,10000)

2. Create `src/features/canvas/store/viewportStore.ts`
   - Context + useReducer for viewport state
   - Actions: setPan, setZoom, resetViewport
   - Initial state with viewport centered

3. Integrate pan handler into Canvas component
   - Handle mouse down/move/up events
   - Update Konva Stage position based on viewport state

4. Create `src/features/canvas/utils/coordinateTransform.ts`
   - Functions to convert between screen and canvas coordinates
   - Account for pan and zoom transforms

**Verification**:
- [ ] Click and drag pans the canvas
- [ ] Panning is smooth at 60 FPS (check DevTools Performance)
- [ ] Cannot pan beyond canvas boundaries
- [ ] Panning works in all directions
- [ ] Release mouse stops panning

**Files to Create**:
- `src/features/canvas/hooks/usePan.ts`
- `src/features/canvas/store/viewportStore.ts`
- `src/features/canvas/utils/coordinateTransform.ts`

**Files to Modify**:
- `src/features/canvas/components/Canvas.tsx`

---

### STAGE1-4: Zoom Implementation

**Objective**: Implement cursor-centered zoom with Cmd/Ctrl + Scroll

**Actions**:
1. Create `src/features/canvas/hooks/useZoom.ts`
   - Listen for wheel events with Cmd/Ctrl modifier
   - Calculate zoom delta
   - Implement zoom constraints:
     - Max zoom in: viewport shows 100px across smaller window dimension
     - Max zoom out: viewport shows 10,000px across larger window dimension
   - Calculate new viewport position to keep cursor position fixed

2. Add zoom calculation utilities to `coordinateTransform.ts`
   - Function to calculate scale limits based on window size
   - Function to adjust pan position during zoom (keep cursor centered)

3. Update viewportStore to handle zoom actions

4. Integrate zoom handler into Canvas component

**Implementation Note**:
```typescript
// Pseudo-code for cursor-centered zoom
function handleZoom(event: WheelEvent) {
  const pointer = stage.getPointerPosition();
  const mousePointTo = {
    x: (pointer.x - stage.x()) / stage.scaleX(),
    y: (pointer.y - stage.y()) / stage.scaleY(),
  };
  
  const newScale = calculateNewScale(currentScale, wheelDelta);
  
  const newPos = {
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  };
  
  updateViewport(newPos, newScale);
}
```

**Verification**:
- [ ] Cmd/Ctrl + Scroll zooms the canvas
- [ ] Zoom is centered on cursor position
- [ ] Zoom is smooth at 60 FPS
- [ ] Cannot zoom beyond maximum zoom in (100px across smaller dimension)
- [ ] Cannot zoom beyond maximum zoom out (10,000px across larger dimension)
- [ ] Grid scales appropriately with zoom
- [ ] Regular scroll without modifier does not zoom

**Files to Create**:
- `src/features/canvas/hooks/useZoom.ts`

**Files to Modify**:
- `src/features/canvas/utils/coordinateTransform.ts`
- `src/features/canvas/store/viewportStore.ts`
- `src/features/canvas/components/Canvas.tsx`

---

### STAGE1-5: Performance Optimization & Testing

**Objective**: Ensure 60 FPS performance for all Stage 1 features

**Actions**:
1. Implement viewport culling for grid lines
   - Only render grid lines visible in current viewport
   - Update grid rendering logic

2. Add performance monitoring
   - Create `src/utils/performanceMonitor.ts`
   - Track FPS during pan/zoom operations
   - Log warnings if FPS drops below 60

3. Optimize Konva configuration
   - Set `listening: false` for grid layer
   - Enable Konva layer caching where appropriate

4. Test and verify all Stage 1 acceptance criteria

**Verification**:
- [ ] Pan maintains 60 FPS (verify with Chrome DevTools Performance)
- [ ] Zoom maintains 60 FPS
- [ ] Grid rendering is optimized (no unnecessary redraws)
- [ ] Window resize works smoothly
- [ ] All Stage 1 acceptance criteria pass
- [ ] No console errors or warnings

**Files to Create**:
- `src/utils/performanceMonitor.ts`

**Files to Modify**:
- `src/features/canvas/components/GridBackground.tsx`
- `src/features/canvas/components/Canvas.tsx`

---

## Stage 2: User Authentication & Presence

### STAGE2-1: Firebase Authentication Setup

**Objective**: Implement Anonymous and Google OAuth authentication

**Actions**:
1. Create `src/features/auth/services/authService.ts`
   - Functions for Anonymous sign-in
   - Functions for Google OAuth sign-in
   - Listen to auth state changes
   - Store user profile in Firestore `/users/{userId}`

2. Create `src/features/auth/hooks/useAuth.ts`
   - Custom hook to access auth state
   - Return: user, loading, error, signInAnonymous, signInGoogle, signOut

3. Create `src/features/auth/store/authStore.ts`
   - Context + useReducer for auth state
   - Actions: setUser, setLoading, setError, clearUser

4. Create `src/features/auth/components/AuthModal.tsx`
   - Modal displayed on first load if not authenticated
   - Two buttons: "Continue as Guest" and "Sign in with Google"
   - Modal closes after successful auth

5. Update `src/types/firebase.ts` with User interface
   ```typescript
   interface User {
     userId: string;
     displayName: string;
     color: string;
     createdAt: Timestamp;
     lastActive: Timestamp;
   }
   ```

6. Wrap App with AuthProvider in `src/App.tsx`

**Implementation Note**:
- Assign user color from predefined palette (see PRD Appendix A)
- Generate display name: Google name or "Anonymous User [UUID-prefix]"
- Use UUID for userId (Firebase Auth UID)

**Verification**:
- [ ] Auth modal appears on first load
- [ ] Anonymous sign-in works
- [ ] Google sign-in works
- [ ] User document created in Firestore `/users/{userId}`
- [ ] User has UUID, displayName, and color
- [ ] Auth state persists across browser refresh
- [ ] Modal closes after authentication

**Files to Create**:
- `src/features/auth/services/authService.ts`
- `src/features/auth/hooks/useAuth.ts`
- `src/features/auth/store/authStore.ts`
- `src/features/auth/components/AuthModal.tsx`

**Files to Modify**:
- `src/types/firebase.ts`
- `src/App.tsx`

---

### STAGE2-2: User Presence System

**Objective**: Track active users in real-time with Realtime Database

**Actions**:
1. Create `src/features/presence/services/presenceService.ts`
   - Function to create presence in Realtime Database on connect
   - Function to update presence (heartbeat every 5s)
   - Function to remove presence on disconnect
   - Use Realtime Database `onDisconnect()` for cleanup
   - Path: `/presence/main/{userId}`

2. Create `src/features/presence/hooks/usePresence.ts`
   - Custom hook to manage current user presence
   - Implement 5-second heartbeat using `setInterval`
   - Update lastUpdate timestamp (Unix timestamp)
   - Clean up on unmount

3. Create `src/features/presence/hooks/useActiveUsers.ts`
   - Custom hook to listen to all active users
   - Real-time Realtime Database listener on `/presence/main`
   - Filter out users with lastUpdate > 30s old
   - Return Map of userId → UserPresence

4. Update `src/types/firebase.ts` with UserPresence interface
   ```typescript
   interface UserPresence {
     userId: string;
     displayName: string;
     color: string;
     cursorX: number;
     cursorY: number;
     connectedAt: number;    // Unix timestamp
     lastUpdate: number;     // Unix timestamp
   }
   ```

5. Create presence context and provider
   - `src/features/presence/store/presenceStore.ts`
   - Provide current user presence and all active users

**Implementation Note**:
- Hard-code documentId as "main" for single-document MVP
- Use sessionStorage to prevent duplicate presence per user
- Implement automatic timeout removal (30s without update)
- Use Realtime Database `.on('value')` for real-time listeners

**Verification**:
- [ ] User presence created in Realtime Database on auth
- [ ] Presence heartbeat updates every 5 seconds
- [ ] Presence removed after 30 seconds of inactivity
- [ ] onDisconnect cleanup works when closing tab
- [ ] Multiple tabs share same presence (one per user)
- [ ] Real-time listener receives presence updates instantly
- [ ] Check Firebase Realtime Database console to see presence data

**Files to Create**:
- `src/features/presence/services/presenceService.ts`
- `src/features/presence/hooks/usePresence.ts`
- `src/features/presence/hooks/useActiveUsers.ts`
- `src/features/presence/store/presenceStore.ts`

**Files to Modify**:
- `src/types/firebase.ts`

---

### STAGE2-3: User Presence Sidebar

**Objective**: Display always-visible sidebar with active users

**Actions**:
1. Create `src/features/presence/components/UserPresenceSidebar.tsx`
   - Fixed position on right side of screen
   - Width: 240px
   - Display current user at top with highlight
   - Display other users below in alphabetical order
   - Show user color swatch + display name

2. Create `src/features/presence/components/UserPresenceItem.tsx`
   - Reusable component for each user in list
   - Props: user, isCurrentUser
   - Display color circle + name
   - Highlight if current user

3. Add styling with CSS Modules or Tailwind
   - Sidebar style:
     - Position: fixed right
     - Background: semi-transparent dark
     - Padding: 16px
     - Border left: 1px solid gray
   - Current user highlight: lighter background

4. Integrate sidebar into `src/App.tsx`
   - Always visible overlay
   - Does not block canvas interaction

**Verification**:
- [ ] Sidebar is visible on right side
- [ ] Sidebar width is 240px
- [ ] Current user appears at top with highlight
- [ ] Other users listed alphabetically
- [ ] Color swatch displays for each user
- [ ] Sidebar updates in real-time as users join/leave
- [ ] Sidebar does not block canvas interaction

**Files to Create**:
- `src/features/presence/components/UserPresenceSidebar.tsx`
- `src/features/presence/components/UserPresenceItem.tsx`
- `src/features/presence/components/UserPresenceSidebar.module.css` (if using CSS Modules)

**Files to Modify**:
- `src/App.tsx`

---

### STAGE2-4: Real-Time Cursor Tracking

**Objective**: Display cursor positions for all active users using Realtime Database

**Actions**:
1. Create `src/features/presence/hooks/useCursorTracking.ts`
   - Track local user's cursor position in canvas coordinates
   - Throttle updates to 50ms
   - Update presence in Realtime Database with cursorX, cursorY
   - Use Realtime Database `.update()` method for performance

2. Create `src/features/presence/components/RemoteCursor.tsx`
   - Konva Group component
   - Render cursor icon in user's color
   - Render label with user's display name
   - Position based on canvas coordinates

3. Create `src/features/presence/components/RemoteCursors.tsx`
   - Container component for all remote cursors
   - Map over activeUsers and render RemoteCursor for each
   - Exclude current user

4. Integrate RemoteCursors into Canvas component
   - Render as Konva Layer on top of grid
   - Transform cursor positions from canvas to screen coordinates

5. Create cursor icon SVG or use simple shape
   - Small triangle or circle in user's color
   - 16x16px size

**Implementation Note**:
```typescript
// Throttle cursor updates for Realtime Database
const throttledUpdateCursor = useCallback(
  throttle((x: number, y: number) => {
    // Direct Realtime Database update
    database.ref(`/presence/main/${userId}`)
      .update({ cursorX: x, cursorY: y });
  }, 50),
  [userId]
);
```

**Verification**:
- [ ] Current user's cursor position updates in Realtime Database
- [ ] Check Firebase Realtime Database console to see cursor updates
- [ ] Remote cursors display for other users
- [ ] Cursors move smoothly with <50ms latency
- [ ] Cursor positions are accurate in canvas coordinates
- [ ] Cursor label shows correct display name
- [ ] Cursor color matches user's assigned color
- [ ] Cursors only visible within canvas area
- [ ] No performance degradation with multiple cursors
- [ ] Cursor updates are noticeably faster than shape updates

**Files to Create**:
- `src/features/presence/hooks/useCursorTracking.ts`
- `src/features/presence/components/RemoteCursor.tsx`
- `src/features/presence/components/RemoteCursors.tsx`
- `src/utils/throttle.ts` (if not exists)

**Files to Modify**:
- `src/features/canvas/components/Canvas.tsx`

---

### STAGE2-5: Session Persistence & Testing

**Objective**: Ensure sessions persist across tabs and test all Stage 2 features

**Actions**:
1. Implement session persistence
   - Use sessionStorage for presence deduplication
   - Key: `canvas-session-${userId}`
   - Prevent multiple presence docs per user in Realtime Database

2. Test disconnect handling
   - Verify Realtime Database `onDisconnect()` removes presence
   - Verify 30-second timeout works
   - Test network disconnect simulation

3. Test multi-tab behavior
   - Open multiple tabs with same user
   - Verify single presence document in Realtime Database
   - Verify cursor updates from all tabs

4. Compare Realtime Database vs Firestore performance
   - Measure cursor update latency (should be <50ms)
   - Measure shape update latency (will be higher, ~100-300ms)
   - Confirm Realtime Database is noticeably faster for cursors

5. Verify all Stage 2 acceptance criteria

**Verification**:
- [ ] User can open multiple tabs without duplicate presence
- [ ] Presence persists across tab switches
- [ ] Closing all tabs removes presence after timeout
- [ ] Network disconnect triggers cleanup
- [ ] Cursor updates are <50ms (check in Realtime Database console timestamps)
- [ ] All Stage 2 acceptance criteria pass
- [ ] No console errors
- [ ] No memory leaks (check DevTools Memory)
- [ ] Realtime Database shows presence and cursor data updating

**Files to Modify**:
- `src/features/presence/services/presenceService.ts`
- `src/features/presence/hooks/usePresence.ts`

---

## Stage 3: Display Objects (Shapes)

### STAGE3-1: Shape Data Model & Firestore Setup

**Objective**: Define shape schema and Firestore integration

**Actions**:
1. Update `src/types/firebase.ts` with Shape interface
   ```typescript
   interface Shape {
     id: string;
     type: 'rectangle' | 'circle' | 'line';
     x: number;
     y: number;
     width?: number;
     height?: number;
     radius?: number;
     points?: number[];
     fillColor: string;
     strokeColor: string;
     strokeWidth: number;
     opacity: number;
     borderRadius?: number;
     rotation: number;
     zIndex: number;
     createdBy: string;
     createdAt: Timestamp;
     lastModifiedBy: string;
     lastModifiedAt: Timestamp;
     lockedBy: string | null;
     lockedAt: Timestamp | null;
   }
   ```

2. Create `src/features/shapes/services/shapeService.ts`
   - CRUD functions for shapes
   - createShape(shape): Promise<Shape>
   - updateShape(shapeId, updates): Promise<Shape>
   - deleteShape(shapeId): Promise<void>
   - lockShape(shapeId, userId): Promise<boolean>
   - unlockShape(shapeId): Promise<void>
   - Use Firestore transactions for locking

3. Create `src/features/shapes/store/shapesStore.ts`
   - Context + useReducer for shapes state
   - Actions: addShape, updateShape, deleteShape, setShapes
   - Real-time Firestore listener for shapes collection
   - Path: `/documents/main/shapes`

4. Create `src/features/shapes/hooks/useShapes.ts`
   - Custom hook to access shapes state
   - Return: shapes, loading, error, createShape, updateShape, deleteShape

**Verification**:
- [ ] Shape interface defined with all properties
- [ ] shapeService functions implemented
- [ ] Shapes store with real-time listener
- [ ] useShapes hook provides CRUD operations
- [ ] TypeScript compiles without errors

**Files to Create**:
- `src/features/shapes/services/shapeService.ts`
- `src/features/shapes/store/shapesStore.ts`
- `src/features/shapes/hooks/useShapes.ts`

**Files to Modify**:
- `src/types/firebase.ts`

---

### STAGE3-2: Shape Toolbar & Tool Selection

**Objective**: Create UI toolbar for selecting shape creation tool

**Actions**:
1. Create `src/features/shapes/components/ShapeToolbar.tsx`
   - Horizontal toolbar at top of screen
   - Three buttons: Rectangle, Circle, Line
   - Visual indication of selected tool
   - Click to select tool

2. Create `src/features/shapes/store/toolStore.ts`
   - Context + useState for selected tool
   - Tools: 'select' | 'rectangle' | 'circle' | 'line'
   - Default: 'select'

3. Create `src/features/shapes/hooks/useTool.ts`
   - Custom hook to access and set current tool
   - Return: currentTool, setTool

4. Style toolbar
   - Position: fixed top-left
   - Background: semi-transparent dark
   - Buttons with icons or text labels
   - Highlight selected tool

5. Integrate toolbar into `src/App.tsx`

**Verification**:
- [ ] Toolbar visible at top of screen
- [ ] Three tool buttons: Rectangle, Circle, Line
- [ ] Clicking button selects tool
- [ ] Visual feedback for selected tool
- [ ] Tool state accessible via useTool hook

**Files to Create**:
- `src/features/shapes/components/ShapeToolbar.tsx`
- `src/features/shapes/store/toolStore.ts`
- `src/features/shapes/hooks/useTool.ts`

**Files to Modify**:
- `src/App.tsx`

---

### STAGE3-3: Rectangle Creation

**Objective**: Implement click-drag rectangle creation

**Actions**:
1. Create `src/features/shapes/hooks/useRectangleCreation.ts`
   - Listen for mouse down on canvas (when rectangle tool selected)
   - Track start point
   - Listen for mouse move to track end point
   - Calculate width/height from start/end
   - On mouse up: create rectangle in Firestore
   - Default properties: white fill, black stroke, 2px width, 100% opacity

2. Create `src/features/shapes/components/ShapeRenderer.tsx`
   - Konva component to render all shapes
   - Map over shapes and render based on type
   - For rectangle: Konva.Rect with shape properties

3. Create `src/features/shapes/components/Rectangle.tsx`
   - Render individual rectangle shape
   - Props: shape data
   - Apply fill, stroke, width, height, position, rotation, opacity, borderRadius

4. Integrate rectangle creation into Canvas component
   - Use useRectangleCreation hook when tool is 'rectangle'
   - Add ShapeRenderer layer to canvas

5. Create default shape properties constant
   - `src/features/shapes/constants/defaultShapeProps.ts`

**Implementation Note**:
```typescript
// Rectangle creation flow
onMouseDown: save startPoint, set isCreating = true
onMouseMove: if isCreating, calculate bounds and show preview
onMouseUp: if isCreating, call createShape with final bounds
```

**Verification**:
- [ ] Select rectangle tool
- [ ] Click and drag on canvas creates rectangle
- [ ] Rectangle has correct bounds based on drag
- [ ] Rectangle appears in Firestore
- [ ] Rectangle renders on canvas with default properties
- [ ] Rectangle visible to other users in real-time
- [ ] Multiple rectangles can be created

**Files to Create**:
- `src/features/shapes/hooks/useRectangleCreation.ts`
- `src/features/shapes/components/ShapeRenderer.tsx`
- `src/features/shapes/components/Rectangle.tsx`
- `src/features/shapes/constants/defaultShapeProps.ts`

**Files to Modify**:
- `src/features/canvas/components/Canvas.tsx`

---

### STAGE3-4: Shape Selection & Locking

**Objective**: Implement individual shape selection with locking mechanism

**Actions**:
1. Create `src/features/shapes/store/selectionStore.ts`
   - Context + useReducer for selection state
   - State: selectedShapeIds: string[]
   - Actions: selectShape, deselectShape, clearSelection, selectMultiple

2. Create `src/features/shapes/hooks/useSelection.ts`
   - Custom hook for selection operations
   - Handle single selection (click)
   - Handle lock acquisition before selection
   - Log to console if shape is locked by another user

3. Update Rectangle component to handle selection
   - Add onClick handler
   - Check lock status before allowing selection
   - Visual feedback for selected state (selection handles)

4. Create `src/features/shapes/components/SelectionHandles.tsx`
   - Konva Group with resize/rotate handles
   - Corner handles for resize
   - Top handle for rotation
   - Only visible when shape is selected

5. Implement lock acquisition flow
   - Before selection: call lockShape in shapeService
   - If locked by another user: console.log message, abort
   - If successful: add to selectedShapeIds
   - On deselection: call unlockShape

6. Implement automatic lock timeout (60s)
   - Background service to check for stale locks
   - Release locks with lastModifiedAt > 60s ago

**Implementation Note**:
```typescript
async function handleShapeClick(shapeId: string) {
  const shape = shapes.get(shapeId);
  if (shape.lockedBy && shape.lockedBy !== currentUserId) {
    console.log(`Shape ${shapeId} is locked by ${shape.lockedBy}`);
    return;
  }
  
  const locked = await shapeService.lockShape(shapeId, currentUserId);
  if (locked) {
    selectionStore.selectShape(shapeId);
  }
}
```

**Verification**:
- [ ] Clicking shape selects it
- [ ] Selection handles appear for selected shape
- [ ] Shape locked to current user on selection
- [ ] Attempting to select locked shape logs to console
- [ ] Deselecting shape releases lock
- [ ] Lock timeout releases after 60s inactivity
- [ ] Selection syncs across users (locked shapes cannot be selected)

**Files to Create**:
- `src/features/shapes/store/selectionStore.ts`
- `src/features/shapes/hooks/useSelection.ts`
- `src/features/shapes/components/SelectionHandles.tsx`
- `src/features/shapes/services/lockService.ts` (optional separate service)

**Files to Modify**:
- `src/features/shapes/components/Rectangle.tsx`
- `src/features/shapes/services/shapeService.ts`

---

### STAGE3-5: Shape Transformation (Drag, Resize, Rotate)

**Objective**: Implement drag, resize, and rotate for selected shapes

**Actions**:
1. Create `src/features/shapes/hooks/useShapeTransform.ts`
   - Handle drag events (move)
   - Handle resize events (corner handles)
   - Handle rotate events (top handle)
   - Constrain to canvas boundaries
   - Debounce Firestore updates (300ms)

2. Update Rectangle component with transform handlers
   - Konva draggable prop
   - onDragMove: update local position, debounce Firestore update
   - onDragEnd: final Firestore update

3. Update SelectionHandles component
   - Make handles draggable
   - Corner handles: resize shape
   - Top handle: rotate shape
   - Update shape dimensions/rotation on drag

4. Implement transform constraints
   - Shapes cannot be dragged outside canvas (0,0 to 10000,10000)
   - Minimum shape size: 10x10px
   - Maintain aspect ratio for proportional resize (optional)

5. Create `src/utils/debounce.ts` if not exists
   - Utility for debouncing Firestore updates

**Implementation Note**:
```typescript
// Debounced update pattern
const debouncedUpdate = useMemo(
  () => debounce((shapeId: string, updates: Partial<Shape>) => {
    shapeService.updateShape(shapeId, updates);
  }, 300),
  []
);

function handleDragMove(shapeId: string, newPos: { x: number; y: number }) {
  // Optimistic local update
  updateLocalShape(shapeId, newPos);
  // Debounced Firestore update
  debouncedUpdate(shapeId, newPos);
}
```

**Verification**:
- [ ] Selected rectangle can be dragged
- [ ] Drag is smooth at 60 FPS
- [ ] Dragged position syncs to other users
- [ ] Corner handles resize rectangle
- [ ] Resize is smooth and updates in real-time
- [ ] Top handle rotates rectangle
- [ ] Rotation is smooth
- [ ] Shapes cannot be dragged outside canvas bounds
- [ ] Minimum size constraint enforced (10x10px)
- [ ] Firestore updates are debounced (not on every pixel)

**Files to Create**:
- `src/features/shapes/hooks/useShapeTransform.ts`
- `src/utils/debounce.ts` (if not exists)

**Files to Modify**:
- `src/features/shapes/components/Rectangle.tsx`
- `src/features/shapes/components/SelectionHandles.tsx`

---

### STAGE3-6: Shape Properties Panel

**Objective**: Create UI panel for editing shape properties

**Actions**:
1. Create `src/features/shapes/components/PropertiesPanel.tsx`
   - Panel appears when shape(s) selected
   - Position: left side of screen or floating
   - Inputs for: fill color, stroke color, stroke width, opacity, border radius

2. Create property input components
   - `src/features/shapes/components/ColorPicker.tsx`
     - Simple color input (HTML5 color picker)
   - `src/features/shapes/components/NumberInput.tsx`
     - Input for numeric values with constraints

3. Wire up property changes
   - On input change: update shape in Firestore
   - Use debouncing for rapid changes
   - Optimistic updates for smooth UX

4. Handle multi-selection
   - If multiple shapes selected: show shared properties
   - If properties differ: show placeholder or first value
   - Changes apply to all selected shapes

5. Style properties panel
   - Fixed position on left side (or floating near selection)
   - Semi-transparent background
   - Clear labels for each property

**Verification**:
- [ ] Properties panel appears when shape selected
- [ ] Fill color input works and updates shape
- [ ] Stroke color input works
- [ ] Stroke width input works (1-10px)
- [ ] Opacity input works (0-100%)
- [ ] Border radius input works (rectangles only, 0-50px)
- [ ] Property changes sync to other users in real-time
- [ ] Panel hides when no shape selected
- [ ] Changes are debounced for performance

**Files to Create**:
- `src/features/shapes/components/PropertiesPanel.tsx`
- `src/features/shapes/components/ColorPicker.tsx`
- `src/features/shapes/components/NumberInput.tsx`

**Files to Modify**:
- `src/App.tsx` (integrate panel)

---

### STAGE3-7: Circle Creation

**Objective**: Implement click-drag circle creation

**Actions**:
1. Create `src/features/shapes/hooks/useCircleCreation.ts`
   - Similar to rectangle creation
   - On mouse down: save center point
   - On mouse move: calculate radius from center to cursor
   - On mouse up: create circle in Firestore

2. Create `src/features/shapes/components/Circle.tsx`
   - Render Konva.Circle with shape properties
   - Apply fill, stroke, radius, position, opacity

3. Update ShapeRenderer to render circles
   - Add case for shape.type === 'circle'

4. Integrate circle creation into Canvas component
   - Use useCircleCreation when tool is 'circle'

**Verification**:
- [ ] Select circle tool
- [ ] Click and drag creates circle
- [ ] Radius based on distance from center to cursor
- [ ] Circle appears in Firestore
- [ ] Circle renders with default properties
- [ ] Circle visible to other users in real-time
- [ ] Circle can be selected, dragged, resized, rotated
- [ ] Properties panel works for circles

**Files to Create**:
- `src/features/shapes/hooks/useCircleCreation.ts`
- `src/features/shapes/components/Circle.tsx`

**Files to Modify**:
- `src/features/shapes/components/ShapeRenderer.tsx`
- `src/features/canvas/components/Canvas.tsx`

---

### STAGE3-8: Line Creation

**Objective**: Implement click-drag line creation

**Actions**:
1. Create `src/features/shapes/hooks/useLineCreation.ts`
   - On mouse down: save start point
   - On mouse move: track end point
   - On mouse up: create line in Firestore
   - Store as points array: [x1, y1, x2, y2]

2. Create `src/features/shapes/components/Line.tsx`
   - Render Konva.Line with shape properties
   - Apply stroke color, stroke width, opacity
   - Lines do not have fill color

3. Update ShapeRenderer to render lines
   - Add case for shape.type === 'line'

4. Update PropertiesPanel for lines
   - Hide fill color input for lines
   - Show only stroke color, stroke width, opacity

5. Integrate line creation into Canvas component
   - Use useLineCreation when tool is 'line'

**Verification**:
- [ ] Select line tool
- [ ] Click and drag creates line
- [ ] Line connects start and end points
- [ ] Line appears in Firestore
- [ ] Line renders with stroke properties
- [ ] Line visible to other users in real-time
- [ ] Line can be selected, dragged, rotated
- [ ] Properties panel shows correct inputs for lines (no fill color)

**Files to Create**:
- `src/features/shapes/hooks/useLineCreation.ts`
- `src/features/shapes/components/Line.tsx`

**Files to Modify**:
- `src/features/shapes/components/ShapeRenderer.tsx`
- `src/features/shapes/components/PropertiesPanel.tsx`
- `src/features/canvas/components/Canvas.tsx`

---

### STAGE3-9: Marquee Selection

**Objective**: Implement drag-to-select multiple shapes

**Actions**:
1. Create `src/features/shapes/hooks/useMarqueeSelection.ts`
   - On mouse down (with no shape under cursor): start marquee
   - On mouse move: track marquee bounds
   - On mouse up: select all shapes intersecting marquee
   - Attempt to lock all intersecting shapes
   - Skip shapes that are locked by other users

2. Create `src/features/shapes/components/MarqueeBox.tsx`
   - Konva Rect showing selection area during drag
   - Dashed border, semi-transparent fill
   - Only visible during marquee selection

3. Update selection logic
   - Calculate shape intersection with marquee bounds
   - For each intersecting shape: attempt lock
   - Add successfully locked shapes to selection
   - Log skipped shapes (locked by others)

4. Integrate marquee into Canvas component
   - Render MarqueeBox when marquee is active
   - Use useMarqueeSelection when tool is 'select'

**Implementation Note**:
```typescript
function checkIntersection(
  shapeBounds: { x, y, width, height },
  marqueeBounds: { x, y, width, height }
): boolean {
  // Check if rectangles overlap
  return !(
    shapeBounds.x + shapeBounds.width < marqueeBounds.x ||
    marqueeBounds.x + marqueeBounds.width < shapeBounds.x ||
    shapeBounds.y + shapeBounds.height < marqueeBounds.y ||
    marqueeBounds.y + marqueeBounds.height < shapeBounds.y
  );
}
```

**Verification**:
- [ ] Drag on empty canvas area starts marquee selection
- [ ] Marquee box displays during drag
- [ ] All shapes intersecting marquee are selected
- [ ] Locked shapes are skipped (logged to console)
- [ ] Multi-selection works correctly
- [ ] Selected shapes all show selection handles
- [ ] Marquee selection works with pan/zoom transforms

**Files to Create**:
- `src/features/shapes/hooks/useMarqueeSelection.ts`
- `src/features/shapes/components/MarqueeBox.tsx`
- `src/features/shapes/utils/geometryUtils.ts` (intersection calculations)

**Files to Modify**:
- `src/features/canvas/components/Canvas.tsx`

---

### STAGE3-10: Shift-Click Multi-Selection

**Objective**: Implement Shift+Click to add shapes to selection

**Actions**:
1. Update `src/features/shapes/hooks/useSelection.ts`
   - Detect Shift key modifier on click
   - If Shift is pressed: add to selection (don't clear existing)
   - If Shift not pressed: clear selection and select clicked shape

2. Update selection logic
   - Maintain array of selected shape IDs
   - Shift+click locked shape: log to console, don't add
   - Shift+click already selected shape: deselect it (toggle)

3. Update multi-selection transform handling
   - When multiple shapes selected: transform all together
   - Drag moves all selected shapes
   - Resize/rotate applies to all (proportionally)

**Implementation Note**:
```typescript
function handleShapeClick(shapeId: string, event: KonvaEvent) {
  const isShiftPressed = event.evt.shiftKey;
  
  if (isShiftPressed) {
    // Add to existing selection
    if (selectedShapeIds.includes(shapeId)) {
      deselectShape(shapeId);
    } else {
      selectShape(shapeId); // includes lock attempt
    }
  } else {
    // Replace selection
    clearSelection();
    selectShape(shapeId);
  }
}
```

**Verification**:
- [ ] Click shape selects it (clears previous selection)
- [ ] Shift+click adds shape to selection
- [ ] Shift+click selected shape deselects it
- [ ] Multiple selected shapes show handles
- [ ] Dragging moves all selected shapes together
- [ ] Property changes apply to all selected shapes
- [ ] Shift+click locked shape logs to console

**Files to Modify**:
- `src/features/shapes/hooks/useSelection.ts`
- `src/features/shapes/hooks/useShapeTransform.ts`

---

### STAGE3-11: Shape Persistence & State Recovery

**Objective**: Ensure shapes persist and recover correctly

**Actions**:
1. Implement shape persistence verification
   - All shapes saved to Firestore on creation/update
   - Shapes persist when all users disconnect

2. Implement canvas state recovery
   - On app load: fetch all shapes from Firestore
   - Render shapes in correct z-index order
   - Restore all shape properties

3. Test disconnect scenarios
   - All users disconnect → shapes remain in Firestore
   - Users reconnect → shapes load correctly
   - Network interruption → shapes recover on reconnect

4. Implement error handling
   - Handle Firestore write failures
   - Retry failed writes with exponential backoff
   - Show user feedback on errors

5. Add loading state
   - Show loading indicator while fetching shapes
   - Prevent interactions until shapes loaded

**Verification**:
- [ ] Create shapes, close all tabs, reopen → shapes are present
- [ ] All shape properties restored correctly
- [ ] Z-index order maintained after recovery
- [ ] Network disconnect/reconnect doesn't lose data
- [ ] Error handling works for Firestore failures
- [ ] Loading state displays during initial load

**Files to Create**:
- `src/features/shapes/hooks/useShapeRecovery.ts`
- `src/components/organisms/LoadingOverlay.tsx`

**Files to Modify**:
- `src/features/shapes/store/shapesStore.ts`
- `src/App.tsx`

---

### STAGE3-12: Z-Index Management Modal

**Objective**: Display read-only list of shapes ordered by z-index

**Actions**:
1. Create `src/features/shapes/components/ZIndexModal.tsx`
   - Modal component (toggleable)
   - List of shapes ordered by z-index (descending)
   - Each item shows: shape type + ID
   - Format: "Rectangle #abc123"

2. Create `src/features/shapes/components/ZIndexItem.tsx`
   - Single item in z-index list
   - Display shape type icon + shortened ID
   - Color indicator for shape's fill color

3. Add toggle button for modal
   - Button in toolbar or corner of screen
   - Click to open/close modal

4. Sort shapes by z-index
   - Query shapes from state
   - Sort by zIndex property (descending = top to bottom)
   - Handle shapes with same z-index

5. Style modal
   - Semi-transparent overlay
   - Centered or side panel
   - Scrollable list if many shapes

**Verification**:
- [ ] Modal toggle button visible
- [ ] Modal opens and closes
- [ ] List displays all shapes
- [ ] Shapes ordered by z-index (top to bottom)
- [ ] Each item shows shape type and ID
- [ ] List updates in real-time as shapes are added/removed
- [ ] Modal is read-only (no reordering yet)

**Files to Create**:
- `src/features/shapes/components/ZIndexModal.tsx`
- `src/features/shapes/components/ZIndexItem.tsx`
- `src/features/shapes/components/ZIndexToggleButton.tsx`

**Files to Modify**:
- `src/App.tsx`

---

### STAGE3-13: Performance Optimization for Shapes

**Objective**: Ensure performance targets are met with 500+ shapes

**Actions**:
1. Implement viewport culling for shapes
   - Only render shapes visible in current viewport
   - Calculate visible bounds based on viewport transform
   - Filter shapes before rendering

2. Optimize Konva rendering
   - Enable Konva layer caching for static shapes
   - Disable listening for non-interactive layers
   - Use Konva perfectDrawEnabled = false for performance

3. Optimize Firestore queries
   - Use Firestore indexes for queries
   - Limit real-time listener scope if possible
   - Batch write operations

4. Implement shape loading strategy
   - Load shapes in chunks if > 500 shapes
   - Progressive rendering for large canvases
   - Show loading indicators

5. Profile and optimize
   - Use Chrome DevTools Performance tab
   - Identify bottlenecks in render loop
   - Optimize hot paths

6. Add performance monitoring
   - Track FPS during interactions
   - Log warnings if FPS drops below 60
   - Monitor Firestore read/write counts

**Verification**:
- [ ] Canvas maintains 60 FPS with 500+ shapes
- [ ] Viewport culling reduces rendered shapes
- [ ] Drag/transform smooth with many shapes
- [ ] Firestore sync doesn't degrade with many shapes
- [ ] Memory usage is reasonable (check DevTools)
- [ ] No unnecessary re-renders (use React DevTools Profiler)

**Files to Create**:
- `src/features/shapes/utils/viewportCulling.ts`
- `src/utils/performanceMonitor.ts` (if not exists)

**Files to Modify**:
- `src/features/shapes/components/ShapeRenderer.tsx`
- `src/features/canvas/components/Canvas.tsx`

---

### STAGE3-14: Final Testing & Bug Fixes

**Objective**: Test all Stage 3 features and fix remaining bugs

**Actions**:
1. Create comprehensive test checklist
   - Test all shape types (rectangle, circle, line)
   - Test all operations (create, select, drag, resize, rotate, delete)
   - Test multi-selection and marquee
   - Test property editing for all shape types
   - Test with multiple concurrent users
   - Test edge cases (canvas boundaries, minimum sizes, etc.)

2. Test performance scenarios
   - Create 500+ shapes and verify FPS
   - Test with 5+ concurrent users
   - Rapid shape creation/manipulation
   - Large viewport pans and zooms

3. Test persistence and recovery
   - All users disconnect → reconnect
   - Network interruptions
   - Browser refresh during operations

4. Test locking mechanism
   - Multiple users attempting to select same shape
   - Lock timeouts
   - Concurrent editing attempts

5. Fix identified bugs
   - Document each bug
   - Create fix
   - Verify fix with original test case

6. Code cleanup
   - Remove console.logs (except intentional ones)
   - Remove unused code
   - Add missing comments
   - Format code consistently

**Verification**:
- [ ] All Stage 3 acceptance criteria pass
- [ ] No critical bugs
- [ ] Performance targets met
- [ ] All features work with multiple users
- [ ] Code is clean and well-documented
- [ ] No console errors or warnings

**Files to Modify**:
- Various files as bugs are identified and fixed

---

## Final Integration & Deployment

### FINAL-1: Integration Testing

**Objective**: Test entire application end-to-end

**Actions**:
1. Test complete user journey
   - New user flow: auth → canvas → create shapes → collaborate
   - Returning user flow: load existing canvas
   - Multi-user collaboration scenarios

2. Test all features together
   - Pan/zoom while creating shapes
   - Presence updates during shape manipulation
   - Properties panel while viewing other users' cursors
   - All tools and operations working simultaneously

3. Test edge cases
   - Very large canvases
   - Many concurrent users (10+)
   - Slow network conditions
   - Mobile browsers (optional but good to test)

4. Cross-browser testing
   - Chrome
   - Firefox
   - Safari
   - Edge

5. Document known issues
   - Create KNOWN_ISSUES.md
   - List any limitations or bugs
   - Note browser-specific issues

**Verification**:
- [ ] Complete user journey works smoothly
- [ ] All features integrate correctly
- [ ] No major bugs in integration
- [ ] Performance acceptable under load
- [ ] Works in all target browsers

**Files to Create**:
- `KNOWN_ISSUES.md`

---

### FINAL-2: Code Quality & Documentation

**Objective**: Ensure code quality and proper documentation

**Actions**:
1. Run linter and fix all errors
   ```bash
   npm run lint
   npm run lint --fix
   ```

2. Run TypeScript type checks
   ```bash
   npm run type-check
   ```

3. Add code comments where needed
   - Complex algorithms
   - Non-obvious logic
   - Workarounds for known issues

4. Create/update README.md
   - Project description
   - Features list
   - Setup instructions
   - Development workflow
   - Tech stack
   - Architecture overview

5. Create ARCHITECTURE.md
   - High-level system design
   - Key components and their interactions
   - Data flow diagrams
   - Firestore schema
   - Future considerations (AI integration)

6. Create SETUP.md
   - Detailed setup instructions
   - Firebase configuration steps
   - Environment variables
   - Running locally
   - Troubleshooting

**Verification**:
- [ ] No linting errors
- [ ] No TypeScript errors
- [ ] Code is well-commented
- [ ] README is comprehensive
- [ ] ARCHITECTURE.md is clear
- [ ] SETUP.md has complete instructions

**Files to Create**:
- `README.md`
- `ARCHITECTURE.md`
- `SETUP.md`

**Files to Modify**:
- Various files for code comments and cleanup

---

### FINAL-3: Build & Deploy to Firebase Hosting

**Objective**: Build production app and deploy to Firebase

**Actions**:
1. Configure Firebase Hosting
   - Update `firebase.json` for hosting configuration
   - Set public directory to `dist`
   - Configure rewrites for SPA routing

2. Create production build
   ```bash
   npm run build
   ```

3. Test production build locally
   ```bash
   npm run preview
   ```

4. Deploy to Firebase Hosting
   ```bash
   firebase deploy --only hosting
   ```

5. Test deployed application
   - Open deployed URL
   - Test all features
   - Test with multiple users from different devices
   - Verify Firebase services are working

6. Configure Firebase security rules
   - Set appropriate Firestore security rules
   - Set appropriate Auth rules
   - Test rules with Firebase emulator if possible

7. Monitor deployment
   - Check Firebase console for errors
   - Monitor Firestore usage
   - Monitor Auth usage

**Verification**:
- [ ] Build completes without errors
- [ ] Production build works locally
- [ ] Deployment succeeds
- [ ] Deployed app is accessible
- [ ] All features work in production
- [ ] Multiple users can collaborate
- [ ] Firebase security rules are appropriate
- [ ] No errors in Firebase console

**Files to Create**:
- `firebase.json` (if not exists)
- `.firebaserc` (if not exists)
- `firestore.rules`
- `firestore.indexes.json`

**Files to Modify**:
- Build configuration files as needed

---

### FINAL-4: Final Verification & Handoff

**Objective**: Final checks and prepare for handoff

**Actions**:
1. Verify all acceptance criteria from PRD
   - Go through each stage's acceptance criteria
   - Check off completed items
   - Document any incomplete items

2. Create final test report
   - List all tested scenarios
   - Note performance metrics
   - Document any known issues
   - Include screenshots/videos

3. Performance benchmarks
   - Measure and document:
     - FPS during pan/zoom
     - Sync latency for objects
     - Sync latency for cursors
     - Max shapes before degradation
     - Max concurrent users tested

4. Create deployment checklist
   - Environment variables
   - Firebase configuration
   - Domain setup (if applicable)
   - Monitoring setup

5. Document future improvements
   - Features for future phases (AI integration)
   - Performance optimizations
   - UX improvements
   - Additional shape types
   - Advanced features (undo/redo, etc.)

**Verification**:
- [ ] All Stage 1 acceptance criteria met
- [ ] All Stage 2 acceptance criteria met
- [ ] All Stage 3 acceptance criteria met
- [ ] Performance targets achieved
- [ ] Documentation complete
- [ ] Deployment successful
- [ ] Application is production-ready

**Files to Create**:
- `TEST_REPORT.md`
- `PERFORMANCE_BENCHMARKS.md`
- `FUTURE_IMPROVEMENTS.md`
- `DEPLOYMENT_CHECKLIST.md`

---

## Task List Summary

### Stage 1: Canvas with Pan/Zoom (5 tasks)
- STAGE1-1: Basic Canvas Setup
- STAGE1-2: Grid Background
- STAGE1-3: Pan Implementation
- STAGE1-4: Zoom Implementation
- STAGE1-5: Performance Optimization & Testing

### Stage 2: User Authentication & Presence (5 tasks)
- STAGE2-1: Firebase Authentication Setup
- STAGE2-2: User Presence System
- STAGE2-3: User Presence Sidebar
- STAGE2-4: Real-Time Cursor Tracking
- STAGE2-5: Session Persistence & Testing

### Stage 3: Display Objects (14 tasks)
- STAGE3-1: Shape Data Model & Firestore Setup
- STAGE3-2: Shape Toolbar & Tool Selection
- STAGE3-3: Rectangle Creation
- STAGE3-4: Shape Selection & Locking
- STAGE3-5: Shape Transformation (Drag, Resize, Rotate)
- STAGE3-6: Shape Properties Panel
- STAGE3-7: Circle Creation
- STAGE3-8: Line Creation
- STAGE3-9: Marquee Selection
- STAGE3-10: Shift-Click Multi-Selection
- STAGE3-11: Shape Persistence & State Recovery
- STAGE3-12: Z-Index Management Modal
- STAGE3-13: Performance Optimization for Shapes
- STAGE3-14: Final Testing & Bug Fixes

### Final Integration (4 tasks)
- FINAL-1: Integration Testing
- FINAL-2: Code Quality & Documentation
- FINAL-3: Build & Deploy to Firebase Hosting
- FINAL-4: Final Verification & Handoff

**Total Tasks: 30**

---

## Development Workflow

### For Each Task:

1. **Read task requirements carefully**
2. **Create/modify files as specified**
3. **Test implementation thoroughly**
4. **Verify all verification checkpoints**
5. **Request human approval before proceeding**

### Commit Strategy:

- Commit after each completed task
- Use descriptive commit messages
- Format: `[TASK-ID] Brief description`
- Example: `[STAGE1-1] Setup basic canvas with Konva`

### When Blocked:

1. Document the blocker clearly
2. List attempted solutions
3. Request human guidance
4. Do not skip ahead to unblocked tasks

---

## Appendix: Quick Reference Commands

### Development
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build

# Preview production build
npm run preview
```

### Firebase
```bash
# Login to Firebase
firebase login

# Initialize Firebase project
firebase init

# Deploy hosting
firebase deploy --only hosting

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

### Testing
```bash
# Open in multiple browser windows
# Use Chrome DevTools for performance profiling
# Use React DevTools for component profiling
# Throttle network in DevTools to test sync latency
```

---

## End of Task List

This task list provides a complete, sequential implementation plan for the CollabCanvas project. Follow each task in order, verify completion, and request approval before proceeding.

**Quick Reference:**
- PRD (requirements): `_docs/PRD.md`
- Architecture (system design): `_docs/ARCHITECTURE.md`
- React patterns: `_docs/react-architecture-guide.md` (if available)
   