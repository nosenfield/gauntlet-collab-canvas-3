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

### SETUP-1: Initialize Project Structure ✅

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
- [x] Project builds without errors: `npm run dev`
- [x] Folder structure matches specification
- [x] TypeScript strict mode enabled
- [x] All dependencies installed correctly

**Files to Create**:
- `tsconfig.json` (updated)
- `.eslintrc.json`
- `src/` folder structure

---

### SETUP-2: Firebase Configuration ✅

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
- [x] Firebase initializes without errors
- [x] Firestore instance available
- [x] Realtime Database instance available
- [x] Environment variables load correctly
- [x] TypeScript types are defined and exported

**Files to Create**:
- `src/api/firebase.ts`
- `src/api/firebaseConfig.ts.example`
- `src/types/firebase.ts`
- `.env.local.example`

---

## Stage 1: Canvas with Pan/Zoom

### STAGE1-1: Basic Canvas Setup ✅

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
- [x] Canvas renders and fills entire browser window
- [x] Canvas resizes when window resizes
- [x] No console errors
- [x] TypeScript compiles without errors

**Files to Create**:
- `src/features/canvas/components/Canvas.tsx`
- `src/features/canvas/hooks/useCanvasSize.ts`
- `src/types/canvas.ts`

**Files to Modify**:
- `src/App.tsx`

---

### STAGE1-2: Grid Background ✅

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
- [x] Grid displays with correct colors and opacity
- [x] Primary grid lines at 100px spacing
- [x] Secondary grid lines at 500px spacing (every 5th line)
- [x] Grid scales when zooming (tested manually with placeholder zoom)
- [x] Background is dark gray
- [x] No performance issues with grid rendering

**Files to Create**:
- `src/features/canvas/components/GridBackground.tsx`
- `src/features/canvas/utils/gridUtils.ts`

**Files to Modify**:
- `src/features/canvas/components/Canvas.tsx`

---

### STAGE1-3: Pan Implementation ✅

**Objective**: Implement smooth panning with scroll

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
- [x] Click and drag pans the canvas
- [x] Panning is smooth at 60 FPS (check DevTools Performance)
- [x] Cannot pan beyond canvas boundaries
- [x] Panning works in all directions
- [x] Release mouse stops panning

**Files to Create**:
- `src/features/canvas/hooks/usePan.ts`
- `src/features/canvas/store/viewportStore.ts`
- `src/features/canvas/utils/coordinateTransform.ts`

**Files to Modify**:
- `src/features/canvas/components/Canvas.tsx`

---

### STAGE1-4: Zoom Implementation ✅

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
- [x] Cmd/Ctrl + Scroll zooms the canvas
- [x] Zoom is centered on cursor position
- [x] Zoom is smooth at 60 FPS
- [x] Cannot zoom beyond maximum zoom in (100px across smaller dimension)
- [x] Cannot zoom beyond maximum zoom out (10,000px across larger dimension)
- [x] Grid scales appropriately with zoom
- [x] Regular scroll without modifier does not zoom

**Files to Create**:
- `src/features/canvas/hooks/useZoom.ts`

**Files to Modify**:
- `src/features/canvas/utils/coordinateTransform.ts`
- `src/features/canvas/store/viewportStore.ts`
- `src/features/canvas/components/Canvas.tsx`

---

### STAGE1-5: Performance Optimization & Testing ✅

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
- [x] Pan maintains 60 FPS (verify with Chrome DevTools Performance)
- [x] Zoom maintains 60 FPS
- [x] Grid rendering is optimized (no unnecessary redraws)
- [x] Window resize works smoothly
- [x] All Stage 1 acceptance criteria pass
- [x] No console errors or warnings

**Files to Create**:
- `src/utils/performanceMonitor.ts`

**Files to Modify**:
- `src/features/canvas/components/GridBackground.tsx`
- `src/features/canvas/components/Canvas.tsx`

---

## Stage 2: User Authentication & Presence

### STAGE2-1: Firebase Authentication Setup ✅

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
- [x] Auth modal appears on first load
- [x] Anonymous sign-in works
- [x] Google sign-in works
- [x] User document created in Firestore `/users/{userId}`
- [x] User has UUID, displayName, and color
- [x] Auth state persists across browser refresh
- [x] Modal closes after authentication

**Files to Create**:
- `src/features/auth/services/authService.ts`
- `src/features/auth/hooks/useAuth.ts`
- `src/features/auth/store/authStore.ts`
- `src/features/auth/components/AuthModal.tsx`

**Files to Modify**:
- `src/types/firebase.ts`
- `src/App.tsx`

---

### STAGE2-2: User Presence System ✅

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
- [x] User presence created in Realtime Database on auth
- [x] Presence heartbeat updates every 5 seconds
- [x] Presence removed after 30 seconds of inactivity
- [x] onDisconnect cleanup works when closing tab
- [x] Multiple tabs maintain per-tab presence entries
- [x] Real-time listener receives presence updates instantly
- [x] Check Firebase Realtime Database console to see presence data

**Files to Create**:
- `src/features/presence/services/presenceService.ts`
- `src/features/presence/hooks/usePresence.ts`
- `src/features/presence/hooks/useActiveUsers.ts`
- `src/features/presence/store/presenceStore.ts`

**Files to Modify**:
- `src/types/firebase.ts`

---

### STAGE2-3: User Presence Sidebar ✅

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
- [x] Sidebar is visible on right side
- [x] Sidebar width is 240px
- [x] Current user appears at top with highlight
- [x] Other users listed alphabetically
- [x] Color swatch displays for each user
- [x] Sidebar updates in real-time as users join/leave
- [x] Sidebar does not block canvas interaction

**Files to Create**:
- `src/features/presence/components/UserPresenceSidebar.tsx`
- `src/features/presence/components/UserPresenceItem.tsx`
- `src/features/presence/components/UserPresenceSidebar.module.css` (if using CSS Modules)

**Files to Modify**:
- `src/App.tsx`

---

### STAGE2-4: Real-Time Cursor Tracking ✅

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
- [x] Current user's cursor position updates in Realtime Database
- [x] Check Firebase Realtime Database console to see cursor updates
- [x] Remote cursors display for other users
- [x] Cursors move smoothly with <50ms latency
- [x] Cursor positions are accurate in canvas coordinates
- [x] Cursor label shows correct display name
- [x] Cursor color matches user's assigned color
- [x] Cursors only visible within canvas area
- [x] No performance degradation with multiple cursors
- [x] Cursor updates are noticeably faster than shape updates

**Files to Create**:
- `src/features/presence/hooks/useCursorTracking.ts`
- `src/features/presence/components/RemoteCursor.tsx`
- `src/features/presence/components/RemoteCursors.tsx`
- `src/utils/throttle.ts` (if not exists)

**Files to Modify**:
- `src/features/canvas/components/Canvas.tsx`

---

### STAGE2-5: Session Persistence & Testing ✅

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
- [x] User can open multiple tabs with per-tab presence entries
- [x] Presence persists across tab switches
- [x] Closing all tabs removes presence immediately (1-2s via onDisconnect)
- [x] Network disconnect triggers cleanup
- [x] Cursor updates are <50ms (check in Realtime Database console timestamps)
- [x] All Stage 2 acceptance criteria pass
- [x] No console errors
- [x] No memory leaks (check DevTools Memory)
- [x] Realtime Database shows presence and cursor data updating

**Files to Modify**:
- `src/features/presence/services/presenceService.ts`
- `src/features/presence/hooks/usePresence.ts`

---

## Stage 3: Display Objects - Universal Editing (15 Tasks)

### STAGE3-1: Refactor Shapes to Display Objects Structure ✅

**Objective**: Restructure existing shapes feature into new displayObjects module

**Actions**:
1. Create new folder structure:
   ```
   src/features/displayObjects/
   ├── common/
   │   ├── components/
   │   ├── hooks/
   │   ├── services/
   │   ├── store/
   │   ├── utils/
   │   └── types.ts
   └── shapes/
       ├── components/
       ├── hooks/
       ├── services/
       ├── store/
       └── types.ts
   ```

2. Move existing shapes files to `displayObjects/shapes/`
   - Move shape components
   - Move shape services
   - Move shape store
   - Update all imports

3. Update shape data model to include display object properties:
   ```typescript
   interface ShapeDisplayObject extends BaseDisplayObject {
     category: 'shape';
     type: 'rectangle' | 'circle' | 'line';
     // Add: rotation, scaleX, scaleY (all default to 0, 1, 1)
     // Keep existing properties
   }
   ```

4. Update Firestore schema:
   - Add `category: 'shape'` field
   - Add `rotation: 0` (default)
   - Add `scaleX: 1` (default)
   - Add `scaleY: 1` (default)
   - Ensure backward compatibility

5. Create `displayObjects/common/types.ts`:
   - Define `BaseDisplayObject` interface
   - Define `Point` type
   - Define bounding box types

6. Update existing shape rendering to use new structure

**Verification**:
- [x] New folder structure created
- [x] All shapes files moved successfully
- [x] Imports updated and working
- [x] Shape objects have new display object properties
- [x] Firestore schema updated
- [x] Existing shapes still render correctly
- [x] No TypeScript errors
- [x] No console errors

**Files to Create**:
- `src/features/displayObjects/common/types.ts`
- `src/features/displayObjects/shapes/types.ts`

**Files to Move/Modify**:
- Move all `src/features/shapes/*` to `src/features/displayObjects/shapes/`
- Update `src/types/firebase.ts` with new interfaces

---

### STAGE3-2: Display Object Toolbar & Tool Selection ✅

**Objective**: Create UI toolbar for selecting display object creation tools

**Actions**:
1. Create DisplayObjectToolbar component:
   ```typescript
   // displayObjects/common/components/DisplayObjectToolbar.tsx
   - Horizontal toolbar at top of screen
   - Tool buttons: Select, Rectangle, Circle, Line
   - Visual indication of selected tool
   - Click to select tool
   ```

2. Create tool store:
   ```typescript
   // displayObjects/common/store/toolStore.tsx
   interface ToolState {
     currentTool: 'select' | 'rectangle' | 'circle' | 'line';
   }
   - Context + useReducer for tool selection
   - Default: 'select'
   - Actions: setTool(tool)
   ```

3. Create useTool hook:
   ```typescript
   // displayObjects/common/hooks/useTool.ts
   - Access current tool
   - Set tool
   - Return: { currentTool, setTool }
   ```

4. Style toolbar:
   - Position: fixed top-left, below any app header
   - Background: rgba(30, 30, 30, 0.95)
   - Buttons: 44px × 44px with icons
   - Selected tool: highlighted background (#4A90E2)
   - Unselected: subtle hover effect
   - Spacing: 8px between buttons
   - Padding: 8px

5. Create tool icons/labels:
   - Select: Cursor icon or "Select"
   - Rectangle: Rectangle icon or "□"
   - Circle: Circle icon or "○"
   - Line: Line icon or "/"

6. Integrate into Canvas:
   - Import toolbar in Canvas component
   - Wire up tool selection to shape creation
   - When tool !== 'select', canvas click creates shape
   - After creating shape, revert to 'select' tool

7. Update shape creation hooks:
   - Check currentTool before creating shape
   - Create appropriate shape type
   - Auto-switch to select tool after creation

**Verification**:
- [x] Toolbar visible at top of screen
- [x] Four tool buttons: Select, Rectangle, Circle, Line
- [x] Clicking button selects tool
- [x] Selected tool visually highlighted
- [x] Tool state accessible via useTool hook
- [x] Tool selection persists until changed
- [x] Canvas click creates shape when tool selected
- [x] Tool reverts to 'select' after shape creation
- [x] Toolbar styled correctly
- [x] Icons/labels clear and readable

**Files to Create**:
- `src/features/displayObjects/common/components/DisplayObjectToolbar.tsx`
- `src/features/displayObjects/common/store/toolStore.tsx`
- `src/features/displayObjects/common/hooks/useTool.ts`

**Files to Modify**:
- `src/features/canvas/components/Canvas.tsx`
- `src/features/displayObjects/shapes/hooks/useShapeCreation.ts`
- `src/App.tsx` (if toolbar needs to be placed in app layout)

---

### STAGE3-3: Multi-Selection Implementation ✅

**Objective**: Implement selection system supporting single, shift-click, and marquee selection

**Actions**:
1. Create selection store:
   ```typescript
   // displayObjects/common/store/selectionStore.ts
   interface SelectionState {
     selectedIds: string[];
     collectionBounds: AxisAlignedBoundingBox | null;
     collectionCenter: Point | null;
     isTransforming: boolean;
     transformMode: 'translate' | 'rotate' | 'scale' | null;
     lockedIds: string[];
   }
   ```

2. Create selection hooks:
   - `useSelection.ts`: Access selection state
   - `useMultiSelection.ts`: Handle multi-select logic

3. Implement single-click selection:
   - Click object → replace selection
   - Update selection state
   - Clear previous selection
   - Only when currentTool === 'select'

4. Implement shift-click selection:
   - Detect shift modifier
   - Add/remove from selectedIds
   - Toggle if already selected

5. Implement marquee selection:
   - Detect click on empty canvas (when tool === 'select')
   - Track drag to create selection rectangle
   - Show visual feedback during drag
   - Calculate intersecting objects on release
   - Select all intersecting objects

6. Create marquee component:
   ```typescript
   // displayObjects/common/components/MarqueeBox.tsx
   ```

7. Add selection handlers to Canvas component
   - Respect currentTool state
   - Only select when tool === 'select'

**Verification**:
- [x] Single click selects object (when tool === 'select')
- [x] Previous selection cleared on new selection
- [x] Shift+click adds to selection
- [x] Shift+click toggles already-selected objects
- [x] Marquee starts on empty canvas click (tool === 'select')
- [x] Marquee visual shows during drag
- [x] Marquee selects intersecting objects
- [x] Max 100 objects enforced
- [x] Selection state updates correctly
- [x] Selection only works when tool === 'select'
- [x] Shape creation works when tool !== 'select'

**Files to Create**:
- `src/features/displayObjects/common/store/selectionStore.tsx`
- `src/features/displayObjects/common/hooks/useSelection.ts`
- `src/features/displayObjects/common/hooks/useMultiSelection.ts`
- `src/features/displayObjects/common/components/MarqueeBox.tsx`

**Files to Modify**:
- `src/features/canvas/components/Canvas.tsx`
- `src/features/displayObjects/shapes/components/Rectangle.tsx` (add click handlers)
- `src/features/displayObjects/shapes/components/Circle.tsx`
- `src/features/displayObjects/shapes/components/Line.tsx`

---

### STAGE3-4: Collection & Individual Bounding Boxes ✅

**Objective**: Render AABB for collection and OBB for individual objects

**Actions**:
1. Create bounding box utilities:
   ```typescript
   // displayObjects/common/utils/boundingBoxUtils.ts
   - calculateCollectionAABB(objects): AABB
   - calculateObjectOBB(object): OBB
   - getObjectCorners(object): Point[]
   ```

2. Create geometry utilities:
   ```typescript
   // displayObjects/common/utils/geometryUtils.ts
   - rotatePoint(point, angle, center): Point
   - pointsIntersectAABB(points, aabb): boolean
   ```

3. Create CollectionBoundingBox component:
   ```typescript
   // displayObjects/common/components/CollectionBoundingBox.tsx
   - Konva Line with dashed stroke
   - Color: #4A90E2, opacity: 0.5
   - Render AABB rectangle
   ```

4. Create ObjectHighlight component:
   ```typescript
   // displayObjects/common/components/ObjectHighlight.tsx
   - Konva Line with solid stroke
   - Color: #4A90E2, opacity: 1.0
   - Render OBB (rotated rectangle)
   ```

5. Create useBoundingBox hook:
   - Calculate bounds when selection changes
   - Recalculate during transforms
   - Memoize calculations

6. Integrate into Canvas:
   - Render CollectionBoundingBox when selection exists
   - Render ObjectHighlight for each selected object
   - Proper layer ordering

**Verification**:
- [x] Collection AABB displays (dashed blue)
- [x] AABB axis-aligned (doesn't rotate)
- [x] Individual OBBs display (solid blue)
- [x] OBBs rotate with objects
- [x] Both visible simultaneously
- [x] Bounds calculate correctly
- [x] Bounds update during selection changes
- [x] Performance acceptable (60 FPS)

**Files to Create**:
- `src/features/displayObjects/common/utils/boundingBoxUtils.ts`
- `src/features/displayObjects/common/utils/geometryUtils.ts`
- `src/features/displayObjects/common/components/CollectionBoundingBox.tsx`
- `src/features/displayObjects/common/components/ObjectHighlight.tsx`
- `src/features/displayObjects/common/hooks/useBoundingBox.ts`

**Files to Modify**:
- `src/features/canvas/components/Canvas.tsx`

---

### STAGE3-5: Individual Object Highlights Rendering ✅

**Objective**: Render oriented bounding boxes for each selected object

**Actions**:
1. Enhance ObjectHighlight component:
   - Calculate 4 corners considering rotation
   - Render as closed path
   - Apply proper styling

2. Create helper for corner calculation:
   ```typescript
   function calculateRotatedCorners(obj: DisplayObject): Point[] {
     // Get local corners
     // Apply rotation
     // Translate to world position
   }
   ```

3. Add ObjectHighlight to selection layer:
   - Map over selectedIds
   - Render ObjectHighlight for each
   - Proper z-index ordering

4. Optimize rendering:
   - Only render for visible objects
   - Memoize corner calculations

**Verification**:
- [x] OBB renders for each selected object
- [x] OBB shows correct rotated bounds
- [x] OBB updates when object rotates
- [x] Multiple OBBs visible simultaneously
- [x] Performance acceptable

**Files to Modify**:
- `src/features/displayObjects/common/components/ObjectHighlight.tsx`
- `src/features/displayObjects/common/utils/geometryUtils.ts`
- `src/features/canvas/components/Canvas.tsx`

---

### STAGE3-6: Collection-Level Locking ✅

**Objective**: Implement atomic locking for selected collections

**Actions**:
1. Create lock service:
   ```typescript
   // displayObjects/common/services/lockService.ts
   - lockCollection(objectIds, userId): Promise<boolean>
   - releaseCollection(objectIds, userId): Promise<void>
   - checkAvailability(objectIds): Promise<{available, lockedBy}>
   - refreshLocks(objectIds, userId): Promise<void>
   - releaseExpiredLocks(): Promise<void>
   ```

2. Implement atomic lock acquisition:
   - Use Firestore transactions
   - Check all objects available
   - Lock all or lock none
   - Return success/failure

3. Add lock checking to selection:
   - Before adding to selection, check availability
   - If any locked, log error and abort
   - If all available, proceed with lock

4. Implement lock heartbeat:
   - Update `lockedAt` every 5 seconds
   - Use setInterval while selection active
   - Clear interval on deselection

5. Implement lock release:
   - On deselection
   - On component unmount
   - On sign-out
   - On tool change to non-select

6. Implement stale lock cleanup:
   - Background service (every 30s)
   - Release locks >60s old

7. Add lock conflict logging:
   ```typescript
   console.warn(`Cannot select: Object ${id} is locked by ${displayName}`);
   ```

**Verification**:
- [x] Lock acquisition is atomic
- [x] Conflicts logged with user info
- [x] Conflicts prevent selection
- [x] No partial selections on conflict
- [x] Locks release on deselect
- [x] Locks release on sign-out
- [x] Locks release on tool change
- [x] Locks auto-release after 60s
- [x] Heartbeat updates every 5s
- [x] Stale locks cleaned up

**Files to Create**:
- `src/features/displayObjects/common/services/lockService.ts`

**Files to Modify**:
- `src/features/displayObjects/common/hooks/useSelection.ts`
- `src/features/displayObjects/common/hooks/useMultiSelection.ts`
- `src/features/displayObjects/common/hooks/useTool.ts` (release locks on tool change)
- `src/features/displayObjects/shapes/services/shapeService.ts`

---

### STAGE3-7: Translation (Drag) Implementation ✅

**Objective**: Implement drag-to-translate for selected collections

**Actions**:
1. Create translation hook:
   ```typescript
   // displayObjects/common/hooks/useTranslation.ts
   - Track mouse down/move/up
   - Calculate delta (current - initial)
   - Apply optimistic update
   - Debounce Firestore write (300ms)
   - Only active when tool === 'select'
   ```

2. Create transform service:
   ```typescript
   // displayObjects/common/services/transformService.ts
   - translateCollection(objects, deltaX, deltaY): DisplayObject[]
   - constrainToCanvas(objects, canvasBounds): DisplayObject[]
   ```

3. Add translation handlers:
   - onMouseDown on any selected object (when tool === 'select')
   - onMouseMove calculates delta
   - Apply delta to all objects in collection
   - Constrain to canvas boundaries

4. Implement constraints:
   - Check collection AABB against canvas bounds
   - Constrain X and Y independently
   - Prevent movement beyond boundaries

5. Update bounding boxes during drag:
   - Recalculate collection AABB
   - Update visual rendering

6. Debounce Firestore updates:
   - Optimistic local update immediately
   - Batch write to Firestore after 300ms
   - Final write on mouse up

**Verification**:
- [x] Click and drag moves collection (when tool === 'select')
- [x] All objects move together
- [x] Movement is smooth (60 FPS)
- [x] Canvas boundaries enforced
- [x] Bounding boxes move with objects
- [x] Firestore updates debounced
- [x] Changes sync to other users within 300ms
- [x] Translation disabled when tool !== 'select'

**Files to Create**:
- `src/features/displayObjects/common/hooks/useTranslation.ts`
- `src/features/displayObjects/common/services/transformService.ts`

**Files to Modify**:
- `src/features/canvas/components/Canvas.tsx`
- `src/features/displayObjects/shapes/services/shapeService.ts`

---

### STAGE3-8: Transform Modal UI

**Objective**: Create transform modal with rotation and scale knobs

**Actions**:
1. Create TransformModal component:
   ```typescript
   // displayObjects/common/components/TransformModal.tsx
   interface TransformModalProps {
     position: Point;  // Collection centerpoint
     visible: boolean;
     onRotate: (delta: number) => void;
     onScale: (delta: number) => void;
   }
   ```

2. Position modal at collection center:
   - Get centerpoint from collection AABB
   - Convert to screen coordinates
   - Fixed size: 120px × 60px

3. Create modal styling:
   - Background: rgba(30, 30, 30, 0.9)
   - Border radius: 8px
   - Subtle shadow
   - Always on top (high z-index)

4. Add knob placeholders:
   - Left knob: Rotation (icon: ⟳)
   - Right knob: Scale (icon: ⊕)
   - Circular buttons, 40px diameter
   - Spaced 60px apart (center to center)

5. Handle pan/zoom:
   - Modal position in canvas coordinates
   - Transforms with canvas viewport

6. Handle visibility:
   - Show when collection selected AND tool === 'select'
   - Hide when no selection or tool !== 'select'

**Verification**:
- [ ] Modal appears at collection center
- [ ] Modal size is 120px × 60px
- [ ] Modal contains two knobs
- [ ] Knobs positioned correctly (60px apart)
- [ ] Modal visible when selected (tool === 'select')
- [ ] Modal hidden when deselected or tool changed
- [ ] Modal follows collection during pan/zoom
- [ ] Modal has proper styling

**Files to Create**:
- `src/features/displayObjects/common/components/TransformModal.tsx`

**Files to Modify**:
- `src/features/canvas/components/Canvas.tsx`

---

### STAGE3-9: Rotation Knob Implementation

**Objective**: Implement rotation knob with 1px = 1° sensitivity

**Actions**:
1. Create RotationKnob component:
   ```typescript
   // displayObjects/common/components/RotationKnob.tsx
   interface RotationKnobProps {
     onRotate: (angleDelta: number) => void;
     visualAngle: number;
   }
   ```

2. Implement knob interaction:
   - onMouseDown: Start tracking
   - onMouseMove: Calculate drag distance
   - Determine direction (up/left = CCW, down/right = CW)
   - Calculate angle: totalDragDistance * 1° per px

3. Visual feedback:
   - Rotate knob icon by visualAngle
   - Smooth spinning animation

4. Create rotation hook:
   ```typescript
   // displayObjects/common/hooks/useRotation.ts
   - Track initial mouse position
   - Calculate cumulative drag
   - Convert to angle delta
   - Apply to collection
   ```

5. Implement rotation logic:
   ```typescript
   // In transformMath.ts
   function rotateCollection(
     objects: DisplayObject[],
     angleDelta: number,
     centerPoint: Point
   ): DisplayObject[]
   ```

6. Apply transform:
   - Rotate object positions around center
   - Update each object's rotation property
   - Recalculate collection AABB
   - Update modal position (stays at center)

7. Debounce Firestore writes (300ms)

**Verification**:
- [ ] Knob responds to drag
- [ ] 1px = 1° verified (test with ruler tool)
- [ ] Up/left rotates counter-clockwise
- [ ] Down/right rotates clockwise
- [ ] All objects rotate around collection center
- [ ] Object positions update correctly
- [ ] Object rotation properties update
- [ ] Knob icon spins (visual feedback)
- [ ] Rotation is smooth (60 FPS)
- [ ] Changes sync within 300ms
- [ ] Collection AABB recalculates
- [ ] Modal stays at centerpoint

**Files to Create**:
- `src/features/displayObjects/common/components/RotationKnob.tsx`
- `src/features/displayObjects/common/hooks/useRotation.ts`
- `src/features/displayObjects/common/utils/transformMath.ts`

**Files to Modify**:
- `src/features/displayObjects/common/components/TransformModal.tsx`
- `src/features/displayObjects/common/services/transformService.ts`

---

### STAGE3-10: Scale Knob Implementation

**Objective**: Implement scale knob with 1px = 0.01 delta sensitivity

**Actions**:
1. Create ScaleKnob component:
   ```typescript
   // displayObjects/common/components/ScaleKnob.tsx
   interface ScaleKnobProps {
     onScale: (scaleDelta: number) => void;
     visualAngle: number;
   }
   ```

2. Implement knob interaction:
   - onMouseDown: Start tracking
   - onMouseMove: Calculate drag distance
   - Determine direction (clockwise = grow, CCW = shrink)
   - Calculate delta: totalDragDistance * 0.01 per px

3. Visual feedback:
   - Rotate knob icon by visualAngle
   - Smooth spinning animation

4. Create scaling hook:
   ```typescript
   // displayObjects/common/hooks/useScaling.ts
   - Track initial mouse position
   - Calculate cumulative drag
   - Convert to scale delta
   - Apply to collection
   ```

5. Implement scaling logic:
   ```typescript
   // In transformMath.ts
   function scaleCollection(
     objects: DisplayObject[],
     scaleDelta: number,
     centerPoint: Point
   ): DisplayObject[]
   ```

6. Apply transform:
   - Scale object positions from center
   - Update each object's scaleX/scaleY properties
   - Apply constraints (0.1 to 10.0)
   - Recalculate collection AABB
   - Update modal position

7. Implement constraints:
   - Per-object min: 0.1 (10%)
   - Per-object max: 10.0 (1000%)
   - Clamp on each update

8. Debounce Firestore writes (300ms)

**Verification**:
- [ ] Knob responds to drag
- [ ] 1px = 0.01 delta verified
- [ ] Clockwise increases scale
- [ ] Counter-clockwise decreases scale
- [ ] All objects scale from collection center
- [ ] Object positions update correctly
- [ ] Object scale properties update
- [ ] Constraints enforced (0.1-10.0)
- [ ] Knob icon spins (visual feedback)
- [ ] Scaling is smooth (60 FPS)
- [ ] Changes sync within 300ms
- [ ] Collection AABB recalculates
- [ ] Modal stays at centerpoint

**Files to Create**:
- `src/features/displayObjects/common/components/ScaleKnob.tsx`
- `src/features/displayObjects/common/hooks/useScaling.ts`

**Files to Modify**:
- `src/features/displayObjects/common/components/TransformModal.tsx`
- `src/features/displayObjects/common/utils/transformMath.ts`
- `src/features/displayObjects/common/services/transformService.ts`

---

### STAGE3-11: Transform State Management

**Objective**: Centralize transform state and coordinate between transforms

**Actions**:
1. Create transform store:
   ```typescript
   // displayObjects/common/store/transformStore.tsx
   interface TransformState {
     mode: 'translate' | 'rotate' | 'scale' | null;
     isActive: boolean;
     initialMousePos: Point | null;
     cumulativeDrag: { x: number; y: number };
   }
   ```

2. Create useTransform hook:
   - Coordinate between translation, rotation, scaling
   - Ensure only one transform active at a time
   - Manage transform lifecycle

3. Integrate with existing hooks:
   - useTranslation sets mode to 'translate'
   - useRotation sets mode to 'rotate'
   - useScaling sets mode to 'scale'

4. Add cursor styling:
   - Translate: move cursor (↔)
   - Rotate: rotation cursor (⟳)
   - Scale: resize cursor (⊕)

5. Implement transform cleanup:
   - Reset mode on mouse up
   - Clear state on deselection
   - Clear state on tool change

**Verification**:
- [ ] Only one transform active at a time
- [ ] Transform mode tracked correctly
- [ ] Cursor changes based on mode
- [ ] State cleanup on completion
- [ ] No conflicts between transforms

**Files to Create**:
- `src/features/displayObjects/common/store/transformStore.tsx`
- `src/features/displayObjects/common/hooks/useTransform.ts`

**Files to Modify**:
- `src/features/displayObjects/common/hooks/useTranslation.ts`
- `src/features/displayObjects/common/hooks/useRotation.ts`
- `src/features/displayObjects/common/hooks/useScaling.ts`

---

### STAGE3-12: Collection Bounds Recalculation

**Objective**: Ensure collection AABB recalculates during all transforms

**Actions**:
1. Create bounds recalculation service:
   ```typescript
   // In boundingBoxUtils.ts
   function recalculateBoundsAfterTransform(
     objects: DisplayObject[]
   ): { bounds: AABB; center: Point }
   ```

2. Integrate into transform flows:
   - After translation: recalculate
   - After rotation: recalculate
   - After scaling: recalculate

3. Update selection store:
   - Update collectionBounds after each transform
   - Update collectionCenter after each transform

4. Optimize calculations:
   - Memoize when objects haven't changed
   - Use efficient corner calculation
   - Avoid unnecessary recalculations

5. Update visual rendering:
   - Collection AABB follows new bounds
   - Modal follows new centerpoint
   - Individual OBBs follow objects

**Verification**:
- [ ] Collection AABB updates during translation
- [ ] Collection AABB updates during rotation
- [ ] Collection AABB updates during scaling
- [ ] Modal stays at centerpoint during transforms
- [ ] Recalculation is performant (60 FPS)
- [ ] No visual jitter or jumping

**Files to Modify**:
- `src/features/displayObjects/common/utils/boundingBoxUtils.ts`
- `src/features/displayObjects/common/store/selectionStore.tsx`
- `src/features/displayObjects/common/hooks/useTransform.ts`

---

### STAGE3-13: Firestore Sync & Debouncing

**Objective**: Implement optimistic updates with debounced Firestore writes

**Actions**:
1. Create update batching service:
   ```typescript
   // displayObjects/common/services/updateService.ts
   - batchUpdateObjects(updates: ObjectUpdate[]): Promise<void>
   - debouncedUpdate(objectId, updates, delay): void
   ```

2. Implement optimistic updates:
   - Update local state immediately
   - Queue Firestore write
   - Apply debouncing (300ms)

3. Create debounce utility:
   ```typescript
   // utils/debounce.ts (if not exists)
   function debounce<T>(func: T, wait: number): T
   ```

4. Integrate into transform hooks:
   - Translation: debounce 300ms
   - Rotation: debounce 300ms
   - Scaling: debounce 300ms

5. Handle final write on mouse up:
   - Flush pending debounced writes
   - Ensure final state written to Firestore

6. Implement server reconciliation:
   - Listen to Firestore changes
   - Merge with local optimistic state
   - Handle conflicts (last-write-wins)

7. Add loading indicators (optional):
   - Show syncing status
   - Indicate when updates pending

**Verification**:
- [ ] Local updates apply immediately
- [ ] Firestore writes debounced to 300ms
- [ ] Final write occurs on mouse up
- [ ] Changes sync to other users
- [ ] No duplicate writes
- [ ] Server reconciliation works
- [ ] Conflicts handled gracefully
- [ ] Performance not degraded

**Files to Create**:
- `src/features/displayObjects/common/services/updateService.ts`
- `src/utils/debounce.ts` (if not exists)

**Files to Modify**:
- `src/features/displayObjects/common/hooks/useTranslation.ts`
- `src/features/displayObjects/common/hooks/useRotation.ts`
- `src/features/displayObjects/common/hooks/useScaling.ts`
- `src/features/displayObjects/shapes/services/shapeService.ts`

---

### STAGE3-14: Performance Optimization

**Objective**: Ensure 60 FPS with 100+ objects during all operations

**Actions**:
1. Implement viewport culling for display objects:
   ```typescript
   // In geometryUtils.ts
   function isObjectInViewport(
     object: DisplayObject,
     viewport: ViewportState
   ): boolean
   ```

2. Optimize bounding box calculations:
   - Cache corner calculations
   - Only recalculate on transform
   - Use efficient algorithms

3. Optimize rendering:
   - Only render visible objects
   - Use Konva layer caching where appropriate
   - Disable listening on non-interactive layers

4. Profile performance:
   - Use Chrome DevTools Performance tab
   - Identify bottlenecks
   - Optimize hot paths

5. Add performance monitoring:
   ```typescript
   // In performanceMonitor.ts
   - Track FPS during transforms
   - Log warnings if FPS < 55
   - Monitor memory usage
   ```

6. Optimize Firestore operations:
   - Batch writes
   - Use transactions for atomic operations
   - Minimize read operations

7. Test with large datasets:
   - Create 100+ objects
   - Verify smooth performance
   - Test all transform operations

**Verification**:
- [ ] 60 FPS with 100+ objects
- [ ] 60 FPS during translation
- [ ] 60 FPS during rotation
- [ ] 60 FPS during scaling
- [ ] 60 FPS during multi-selection
- [ ] Viewport culling works
- [ ] Memory usage reasonable
- [ ] No performance degradation over time
- [ ] Firestore operations efficient

**Files to Modify**:
- `src/features/displayObjects/common/utils/geometryUtils.ts`
- `src/features/displayObjects/common/utils/boundingBoxUtils.ts`
- `src/features/canvas/components/Canvas.tsx`
- `src/utils/performanceMonitor.ts`

---

### STAGE3-15: Testing & Bug Fixes

**Objective**: Test all Stage 3 features and fix remaining bugs

**Actions**:
1. Create comprehensive test checklist:
   - Test toolbar and tool selection
   - Test shape creation with each tool
   - Test all selection methods
   - Test all transform operations
   - Test locking mechanism
   - Test multi-user scenarios
   - Test edge cases

2. Test toolbar:
   - Tool selection
   - Visual feedback
   - Tool state persistence
   - Auto-revert to select after creation

3. Test shape creation:
   - Rectangle tool
   - Circle tool
   - Line tool
   - Default properties
   - Firestore persistence

4. Test selection:
   - Single click (tool === 'select')
   - Shift+click
   - Marquee (various sizes)
   - Max 100 objects
   - Selection across users
   - No selection when tool !== 'select'

5. Test transforms:
   - Translation (drag)
   - Rotation (knob)
   - Scale (knob)
   - Canvas boundary constraints
   - Scale constraints (0.1-10.0)

6. Test locking:
   - Lock acquisition
   - Lock conflicts
   - Lock release
   - Lock timeout
   - Lock heartbeat
   - Lock release on tool change

7. Test visual indicators:
   - Collection AABB
   - Individual OBBs
   - Transform modal
   - Knob visuals
   - Modal visibility with tool changes

8. Test performance:
   - 100+ objects
   - Continuous transforms
   - Multiple users

9. Test persistence:
   - All properties persist
   - Disconnect/reconnect
   - No data loss

10. Fix identified bugs:
    - Document each bug
    - Implement fix
    - Verify with test case

11. Code cleanup:
    - Remove console.logs (except intentional)
    - Remove unused code
    - Add missing comments
    - Format consistently

**Verification**:
- [ ] All Stage 3 acceptance criteria pass
- [ ] Toolbar works correctly
- [ ] All tools create shapes correctly
- [ ] Tool auto-reverts to select
- [ ] No critical bugs
- [ ] Performance targets met (60 FPS)
- [ ] Multi-user collaboration works
- [ ] Persistence verified
- [ ] Code is clean and documented
- [ ] No console errors or warnings

**Files to Modify**:
- Various files as bugs are identified and fixed

---

## Stage 4: Text Objects & Object-Specific Editing (9 Tasks)

### STAGE4-1: Text Display Object Data Model

**Objective**: Define text display object type and Firestore schema

**Actions**:
1. Define TextDisplayObject interface:
   ```typescript
   interface TextDisplayObject extends BaseDisplayObject {
     category: 'text';
     content: string;
     width: number;
     height: number;
     font: string;
     fontSize: number;
     fontWeight: number;
     textAlign: 'left' | 'center' | 'right' | 'justify';
     lineHeight: number;
     color: string;
   }
   ```

2. Create text types file:
   ```typescript
   // displayObjects/texts/types.ts
   ```

3. Update Firestore schema:
   - Create `/documents/main/texts/` collection
   - Same metadata as shapes
   - Text-specific fields

4. Create text service:
   ```typescript
   // displayObjects/texts/services/textService.ts
   - createText(text): Promise<TextDisplayObject>
   - updateText(id, updates): Promise<void>
   - deleteText(id): Promise<void>
   ```

5. Create text store:
   ```typescript
   // displayObjects/texts/store/textsStore.ts
   - Manage text objects
   - Real-time listener for texts collection
   ```

**Verification**:
- [ ] TextDisplayObject interface defined
- [ ] Text types file created
- [ ] Firestore schema documented
- [ ] Text service implemented
- [ ] Text store created
- [ ] TypeScript compiles without errors

**Files to Create**:
- `src/features/displayObjects/texts/types.ts`
- `src/features/displayObjects/texts/services/textService.ts`
- `src/features/displayObjects/texts/store/textsStore.tsx`

**Files to Modify**:
- `src/types/firebase.ts`

---

### STAGE4-2: Text Tool & Text Object Creation

**Objective**: Add text tool to toolbar and implement text object placement

**Actions**:
1. Add "Text" tool to DisplayObjectToolbar:
   - Add button with text icon (T or "Text")
   - Same styling as other tool buttons
   - Tool value: 'text'

2. Update tool store:
   ```typescript
   currentTool: 'select' | 'rectangle' | 'circle' | 'line' | 'text';
   ```

3. Create useTextCreation hook:
   ```typescript
   // displayObjects/texts/hooks/useTextCreation.ts
   - Handle click on canvas when text tool selected
   - Create text box at click position
   - Default: 200px × 100px
   - Default content: "Double-click to edit"
   ```

4. Create TextObject component:
   ```typescript
   // displayObjects/texts/components/TextObject.tsx
   - Render Konva.Text
   - Apply all text properties
   - Handle text wrapping
   ```

5. Create TextRenderer component:
   ```typescript
   // displayObjects/texts/components/TextRenderer.tsx
   - Map over texts and render TextObject
   ```

6. Default properties:
   - Font: Arial
   - Font size: 16px
   - Font weight: 400
   - Color: #000000
   - Text align: left
   - Line height: 1.2
   - Opacity: 1.0

7. Integrate into Canvas:
   - Add TextRenderer layer
   - Wire up text tool selection
   - Auto-revert to 'select' after creation

**Verification**:
- [ ] Text tool in toolbar
- [ ] Text tool button styled correctly
- [ ] Click creates text box (when tool === 'text')
- [ ] Default size: 200px × 100px
- [ ] Default text: "Double-click to edit"
- [ ] Text renders correctly
- [ ] Text wraps within bounds
- [ ] Text persists to Firestore
- [ ] Text visible to other users
- [ ] Tool reverts to 'select' after creation

**Files to Create**:
- `src/features/displayObjects/texts/hooks/useTextCreation.ts`
- `src/features/displayObjects/texts/components/TextObject.tsx`
- `src/features/displayObjects/texts/components/TextRenderer.tsx`

**Files to Modify**:
- `src/features/displayObjects/common/components/DisplayObjectToolbar.tsx`
- `src/features/displayObjects/common/store/toolStore.tsx`
- `src/features/canvas/components/Canvas.tsx`

---

### STAGE4-3: Object-Specific Selection Mode

**Objective**: Implement double-click to enter object-specific editing

**Actions**:
1. Update selection store:
   ```typescript
   interface SelectionState {
     mode: 'display-level' | 'object-specific';
     // ... existing fields
   }
   ```

2. Add double-click handlers:
   - Detect double-click on any display object
   - Switch mode to 'object-specific'
   - Deselect all other objects
   - Select only double-clicked object

3. Implement mode switching:
   - Exit object-specific on:
     - Click empty canvas
     - Click different object
     - Press Escape key
     - Tool change to non-select

4. Update visual indicators:
   - Same OBB highlight (for now)
   - Future: differentiate with color

5. Add escape key handler:
   ```typescript
   useEffect(() => {
     const handleKeyPress = (e: KeyboardEvent) => {
       if (e.key === 'Escape' && mode === 'object-specific') {
         exitObjectSpecificMode();
       }
     };
     window.addEventListener('keydown', handleKeyPress);
     return () => window.removeEventListener('keydown', handleKeyPress);
   }, [mode]);
   ```

**Verification**:
- [ ] Double-click enters object-specific mode
- [ ] Other objects deselect
- [ ] Single object selected
- [ ] Object locks successfully
- [ ] Escape exits mode
- [ ] Click empty canvas exits mode
- [ ] Click different object switches to that object
- [ ] Tool change exits object-specific mode
- [ ] Mode tracked correctly in state

**Files to Modify**:
- `src/features/displayObjects/common/store/selectionStore.tsx`
- `src/features/displayObjects/common/hooks/useSelection.ts`
- `src/features/displayObjects/common/hooks/useTool.ts` (exit on tool change)
- `src/features/displayObjects/shapes/components/Rectangle.tsx` (add double-click)
- `src/features/displayObjects/shapes/components/Circle.tsx`
- `src/features/displayObjects/shapes/components/Line.tsx`
- `src/features/displayObjects/texts/components/TextObject.tsx`

---

### STAGE4-4: Shape Properties Panel

**Objective**: Create properties panel for editing shape-specific properties

**Actions**:
1. Create ShapePropertiesPanel component:
   ```typescript
   // displayObjects/shapes/components/ShapePropertiesPanel.tsx
   interface ShapePropertiesPanelProps {
     shape: ShapeDisplayObject;
     onUpdate: (updates: Partial<ShapeDisplayObject>) => void;
   }
   ```

2. Panel layout:
   - Position: Fixed left side
   - Width: 280px
   - Background: rgba(30, 30, 30, 0.95)
   - Padding: 20px

3. Property inputs:
   - Fill Color: Color picker + hex input
   - Stroke Color: Color picker + hex input
   - Stroke Width: Slider (1-10px) + numeric input
   - Opacity: Slider (0-100%) + numeric input
   - Border Radius: Slider (0-50px) + input (rectangles only)

4. Create reusable input components:
   ```typescript
   // components/atoms/ColorPicker.tsx
   // components/atoms/Slider.tsx
   // components/atoms/NumberInput.tsx
   ```

5. Implement property updates:
   - onChange handlers for each input
   - Optimistic local update
   - Debounce Firestore write (300ms)

6. Panel visibility:
   - Show when mode === 'object-specific' && category === 'shape'
   - Hide otherwise

7. Styling:
   - Labels: 14px, 500 weight
   - Inputs: 14px, 400 weight
   - Row spacing: 16px

**Verification**:
- [ ] Panel displays for shape in object-specific mode
- [ ] Panel positioned on left side
- [ ] Fill color picker works
- [ ] Stroke color picker works
- [ ] Stroke width slider works (1-10px)
- [ ] Opacity slider works (0-100%)
- [ ] Border radius works (rectangles, 0-50px)
- [ ] Border radius hidden for circles/lines
- [ ] Changes apply in real-time
- [ ] Changes sync within 300ms
- [ ] Panel hidden when not in object-specific mode

**Files to Create**:
- `src/features/displayObjects/shapes/components/ShapePropertiesPanel.tsx`
- `src/components/atoms/ColorPicker.tsx`
- `src/components/atoms/Slider.tsx`
- `src/components/atoms/NumberInput.tsx`

**Files to Modify**:
- `src/App.tsx` (integrate panel)

---

### STAGE4-5: Text Properties Panel

**Objective**: Create properties panel for editing text-specific properties

**Actions**:
1. Create TextPropertiesPanel component:
   ```typescript
   // displayObjects/texts/components/TextPropertiesPanel.tsx
   ```

2. Panel layout:
   - Position: Fixed left (same as shape panel)
   - Width: 280px
   - Same styling as shape panel

3. Property inputs:
   - Content: Multi-line textarea
   - Font Family: Dropdown (Arial, Helvetica, Times New Roman, Courier, Georgia)
   - Font Size: Slider (12-72px) + input
   - Font Weight: Slider (100-900, step 100) + dropdown labels
   - Text Color: Color picker + hex input
   - Text Alignment: Button group (4 buttons with icons)
   - Line Height: Slider (0.8-3.0, step 0.1) + input
   - Opacity: Slider (0-100%) + input

4. Create text-specific components:
   ```typescript
   // components/atoms/TextArea.tsx
   // components/atoms/FontDropdown.tsx
   // components/molecules/AlignmentButtonGroup.tsx
   ```

5. Implement updates:
   - Content: debounce 500ms
   - Styles: debounce 300ms
   - Optimistic updates

6. Panel visibility:
   - Show when mode === 'object-specific' && category === 'text'
   - Hide otherwise

**Verification**:
- [ ] Panel displays for text in object-specific mode
- [ ] Content textarea works
- [ ] Font dropdown has 5 options
- [ ] Font size slider works (12-72px)
- [ ] Font weight slider works (100-900)
- [ ] Text color picker works
- [ ] Alignment buttons work (4 options)
- [ ] Line height slider works (0.8-3.0)
- [ ] Opacity slider works (0-100%)
- [ ] Content changes debounced to 500ms
- [ ] Style changes debounced to 300ms
- [ ] Long text wraps correctly
- [ ] Changes sync to other users

**Files to Create**:
- `src/features/displayObjects/texts/components/TextPropertiesPanel.tsx`
- `src/components/atoms/TextArea.tsx`
- `src/components/atoms/FontDropdown.tsx`
- `src/components/molecules/AlignmentButtonGroup.tsx`

**Files to Modify**:
- `src/App.tsx` (integrate panel)

---

### STAGE4-6: Panel Switching Logic

**Objective**: Show correct properties panel based on object type

**Actions**:
1. Create panel manager component:
   ```typescript
   // displayObjects/common/components/PropertiesPanelManager.tsx
   - Determine which panel to show
   - Handle panel visibility
   - Pass correct object data
   ```

2. Panel selection logic:
   ```typescript
   if (mode !== 'object-specific') return null;
   
   const selectedObject = getSelectedObject();
   if (!selectedObject) return null;
   
   switch (selectedObject.category) {
     case 'shape':
       return <ShapePropertiesPanel shape={selectedObject} />;
     case 'text':
       return <TextPropertiesPanel text={selectedObject} />;
     default:
       return null;
   }
   ```

3. Handle panel transitions:
   - Smooth fade in/out
   - Maintain scroll position
   - Clear panel state on switch

4. Add loading states:
   - Show loading when fetching object data
   - Disable inputs during save

**Verification**:
- [ ] Correct panel shows for shape
- [ ] Correct panel shows for text
- [ ] Panel switches when switching objects
- [ ] Panel hides when exiting object-specific mode
- [ ] Transitions are smooth
- [ ] No flashing or jitter
- [ ] Loading states work

**Files to Create**:
- `src/features/displayObjects/common/components/PropertiesPanelManager.tsx`

**Files to Modify**:
- `src/App.tsx`

---

### STAGE4-7: Text Rendering & Wrapping

**Objective**: Ensure text renders correctly with all properties

**Actions**:
1. Enhance TextObject component:
   - Apply all typography properties
   - Implement text wrapping
   - Handle line height
   - Apply alignment

2. Text wrapping logic:
   ```typescript
   - Calculate available width
   - Break text into lines
   - Respect word boundaries
   - Handle long words
   ```

3. Apply transforms:
   - Rotation
   - Scaling
   - Translation
   - Opacity

4. Test with various content:
   - Short text
   - Long text
   - Multiple paragraphs
   - Special characters

5. Optimize rendering:
   - Cache text metrics
   - Only recalculate on content/style change

**Verification**:
- [ ] Text renders with all properties
- [ ] Text wraps within bounds
- [ ] Word wrapping works correctly
- [ ] Long words handled gracefully
- [ ] Line height applies correctly
- [ ] Text alignment works (all 4 options)
- [ ] Font family applies correctly
- [ ] Font size applies correctly
- [ ] Font weight applies correctly
- [ ] Text color applies correctly
- [ ] Text transforms correctly (rotate, scale)
- [ ] Text renders at all zoom levels

**Files to Modify**:
- `src/features/displayObjects/texts/components/TextObject.tsx`

---

### STAGE4-8: Text in Multi-Selection & Transforms

**Objective**: Ensure text objects work correctly with display-level selection and transforms

**Actions**:
1. Test text with selection:
   - Text selectable with single click (tool === 'select')
   - Text included in shift+click multi-select
   - Text included in marquee selection

2. Test text with transforms:
   - Translation: text moves with collection
   - Rotation: text rotates around collection center
   - Scale: text scales from collection center

3. Test mixed selections:
   - Mix of shapes and text in same selection
   - All objects transform together
   - Collection bounds include text objects

4. Update bounding box calculations:
   - Include text objects in collection AABB
   - Calculate text object OBB correctly

5. Test text locking:
   - Text objects lock/unlock with collection
   - Text conflicts prevent selection

**Verification**:
- [ ] Text selectable (tool === 'select')
- [ ] Text in multi-select works
- [ ] Text in marquee works
- [ ] Text translates with collection
- [ ] Text rotates with collection
- [ ] Text scales with collection
- [ ] Mixed selections work (shapes + text)
- [ ] Collection bounds include text
- [ ] Text OBB renders correctly
- [ ] Text locking works

**Files to Modify**:
- `src/features/displayObjects/common/utils/boundingBoxUtils.ts`
- `src/features/displayObjects/texts/components/TextObject.tsx`

---

### STAGE4-9: Testing & Integration

**Objective**: Test all Stage 4 features and integrate with Stage 3

**Actions**:
1. Test text tool:
   - Tool selection
   - Text creation
   - Auto-revert to select

2. Test text objects:
   - Creation
   - Selection (display-level)
   - Transforms (translate, rotate, scale)
   - Persistence

3. Test object-specific editing:
   - Double-click entry
   - Exit methods (Escape, click away, tool change)
   - Switching between objects

4. Test properties panels:
   - Shape properties
   - Text properties
   - Panel switching
   - Property updates
   - Sync across users

5. Test cross-type functionality:
   - Mix shapes and text in selections
   - Transform mixed collections
   - Lock mixed collections

6. Test edge cases:
   - Empty text content
   - Very long text
   - Special characters
   - Extreme property values

7. Test performance:
   - Mixed object types (100+ total)
   - Rapid property changes
   - Multiple users editing

8. Fix bugs:
   - Document issues
   - Implement fixes
   - Verify fixes

9. Code cleanup:
   - Remove debug code
   - Add comments
   - Format code

**Verification**:
- [ ] All Stage 4 acceptance criteria pass
- [ ] Text tool works correctly
- [ ] Text objects work correctly
- [ ] Object-specific editing works
- [ ] Properties panels work
- [ ] Cross-type functionality works
- [ ] Edge cases handled
- [ ] Performance acceptable
- [ ] No critical bugs
- [ ] Code is clean

**Files to Modify**:
- Various files as bugs are identified

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

### Setup Phase (2 tasks) ✅ COMPLETE
- ✅ SETUP-1: Initialize Project Structure
- ✅ SETUP-2: Firebase Configuration

### Stage 1: Canvas with Pan/Zoom (5 tasks) ✅ COMPLETE
- ✅ STAGE1-1: Basic Canvas Setup
- ✅ STAGE1-2: Grid Background
- ✅ STAGE1-3: Pan Implementation
- ✅ STAGE1-4: Zoom Implementation
- ✅ STAGE1-5: Performance Optimization & Testing

### Stage 2: User Authentication & Presence (5 tasks) ✅ COMPLETE
- ✅ STAGE2-1: Firebase Authentication Setup
- ✅ STAGE2-2: User Presence System
- ✅ STAGE2-3: User Presence Sidebar
- ✅ STAGE2-4: Real-Time Cursor Tracking
- ✅ STAGE2-5: Session Persistence & Testing

### Stage 3: Display Objects - Universal Editing (15 tasks) 🚧 IN PROGRESS (7/15 complete)
- ✅ STAGE3-1: Refactor Shapes to Display Objects Structure
- ✅ STAGE3-2: Display Object Toolbar & Tool Selection
- ✅ STAGE3-3: Multi-Selection Implementation
- ✅ STAGE3-4: Collection & Individual Bounding Boxes
- ✅ STAGE3-5: Individual Object Highlights Rendering
- ✅ STAGE3-6: Collection-Level Locking
- ✅ STAGE3-7: Translation (Drag) Implementation
- ⏸️ STAGE3-8: Transform Modal UI
- ⏸️ STAGE3-9: Rotation Knob Implementation
- ⏸️ STAGE3-10: Scale Knob Implementation
- ⏸️ STAGE3-11: Transform State Management
- ⏸️ STAGE3-12: Collection Bounds Recalculation
- ⏸️ STAGE3-13: Firestore Sync & Debouncing
- ⏸️ STAGE3-14: Performance Optimization
- ⏸️ STAGE3-15: Testing & Bug Fixes

### Stage 4: Text Objects & Object-Specific Editing (9 tasks) ⏸️ NOT STARTED
- STAGE4-1 through STAGE4-9

### Final Integration (4 tasks) ⏸️ NOT STARTED
- FINAL-1: Integration Testing
- FINAL-2: Code Quality & Documentation
- FINAL-3: Build & Deploy to Firebase Hosting
- FINAL-4: Final Verification & Handoff

**Total Tasks: 30 (Setup: 2, Stage 1: 5, Stage 2: 5, Stage 3: 15, Stage 4: 9, Final: 4)**
**Completed: 19/30 (63%)**
**Current Focus: Stage 3 - Universal Editing System**

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
   