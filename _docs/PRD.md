# Product Requirements Document (PRD)
# CollabCanvas - Real-Time Collaborative Design Tool

---

## Document Information
- **Project Name**: CollabCanvas
- **Version**: 1.0
- **Last Updated**: 2025-01-16
- **Target Audience**: AI Development Agent (Cursor IDE)
- **Location**: `_docs/PRD.md`
- **Related Documents**: 
  - Task List: `_docs/TASK_LIST.md`
  - Architecture Diagram: `_docs/ARCHITECTURE.md`

---

## Executive Summary

CollabCanvas is a real-time collaborative design tool inspired by Figma. This MVP focuses on core collaborative infrastructure with a canvas workspace where multiple users can create and manipulate display objects simultaneously with real-time synchronization.

### Core Value Proposition
- Real-time multiplayer collaboration with sub-100ms sync
- Persistent canvas state across sessions
- Intuitive pan/zoom canvas interface
- Multi-user presence awareness

---

## Technical Stack

### Frontend
- **Framework**: React 18+ with TypeScript (strict mode)
- **Canvas Library**: Konva.js for 2D rendering
- **State Management**: React Context API + useReducer
- **Styling**: CSS Modules or Tailwind CSS

### Backend
- **Persistent Database**: Firebase Firestore (shapes, user profiles)
- **Real-time Database**: Firebase Realtime Database (cursors, presence)
- **Authentication**: Firebase Auth (Anonymous + Google OAuth)
- **Hosting**: Firebase Hosting

### Development Tools
- **IDE**: Cursor with AI assistance
- **Build Tool**: Vite
- **Type Checking**: TypeScript strict mode
- **Linting**: ESLint with React + TypeScript rules

---

## Feature Stages

Development is organized into 4 sequential stages. Each stage must be completed and verified before proceeding to the next.

---

## Stage 1: Basic Canvas with Pan/Zoom

### Overview
Implement a high-performance canvas workspace with smooth pan and zoom capabilities.

### Functional Requirements

#### FR-1.1: Canvas Drawing Area
- **Requirement**: Canvas drawing area is 10,000 x 10,000 pixels
- **Behavior**: This is the absolute coordinate space where objects are placed
- **Validation**: Objects can be placed anywhere within (0,0) to (10000,10000)

#### FR-1.2: Viewport
- **Requirement**: User has a viewport that displays a portion of the drawing area
- **Behavior**: Viewport fills entire browser window and adapts to window resize
- **Validation**: Window resize maintains viewport aspect ratio and zoom level

#### FR-1.3: Pan Navigation
- **Requirement**: User can pan the viewport using mouse scroll
- **Implementation**: Standard scroll gestures move the viewport
- **Constraints**: Cannot pan beyond canvas boundaries (0,0 to 10000,10000)
- **Validation**: Smooth 60 FPS panning with no jitter

#### FR-1.4: Zoom Navigation
- **Requirement**: User can zoom using Cmd/Ctrl + Scroll
- **Behavior**: Zoom focal point is user's cursor position
- **Constraints**: 
  - **Maximum Zoom In**: Viewport displays 100px across the smaller window dimension
  - **Maximum Zoom Out**: Viewport displays 10,000px across the larger window dimension
- **Validation**: Smooth zoom with cursor-centered focal point

#### FR-1.5: Grid Background
- **Requirement**: Drawing area has a visible grid system
- **Specifications**:
  - Background color: Dark gray (#2A2A2A)
  - Primary grid lines: White with 25% opacity, spaced 100px apart
  - Secondary grid lines: White with 50% opacity, every 5th line (500px spacing)
- **Behavior**: Grid scales with zoom level (maintains visual density)
- **Validation**: Grid lines remain visible and properly spaced at all zoom levels

### Technical Requirements

#### TR-1.1: Performance
- Maintain 60 FPS during pan operations
- Maintain 60 FPS during zoom operations
- Smooth rendering with no visible tearing or stuttering

#### TR-1.2: Coordinate System
- Establish clear separation between:
  - **Canvas coordinates**: Absolute 10,000 x 10,000 space
  - **Screen coordinates**: Browser viewport pixels
  - **Transform matrix**: Conversion between coordinate systems

#### TR-1.3: Responsive Design
- Canvas fills 100% of browser window
- Adapts to window resize without losing zoom/pan state
- Maintains aspect ratio during resize

### Data Structures

```typescript
interface ViewportState {
  x: number;           // Canvas x coordinate at viewport top-left
  y: number;           // Canvas y coordinate at viewport top-left
  scale: number;       // Current zoom scale factor
  width: number;       // Viewport width in pixels
  height: number;      // Viewport height in pixels
}

interface CanvasConfig {
  width: 10000;        // Canvas width constant
  height: 10000;       // Canvas height constant
  gridSpacing: 100;    // Primary grid spacing
  gridAccent: 5;       // Secondary grid every Nth line
}
```

### Acceptance Criteria
- [ ] Canvas displays 10,000 x 10,000 drawing area
- [ ] Viewport fills entire browser window
- [ ] Panning works with smooth 60 FPS performance
- [ ] Zooming works with cursor-centered focal point
- [ ] Zoom constraints prevent excessive zoom in/out
- [ ] Grid displays correctly and scales with zoom
- [ ] Grid has proper primary (25% opacity) and secondary (50% opacity) lines
- [ ] Window resize maintains viewport state

---

## Stage 2: User Authentication & Presence

### Overview
Implement user authentication and real-time presence awareness showing all active users.

### Functional Requirements

#### FR-2.1: User Authentication
- **Requirement**: Users can authenticate via Anonymous or Google OAuth
- **Behavior**: 
  - First-time users see authentication modal
  - Users choose Anonymous or Google sign-in
  - Authentication persists across browser sessions
- **Validation**: User session persists across tabs/windows

#### FR-2.2: User Identity
- **Requirement**: Each user has a unique identifier and assigned color
- **Specifications**:
  - UUID: Generated on first authentication
  - Color: Randomly assigned from predefined palette
  - Display Name: Google name or "Anonymous User [UUID-prefix]"
- **Validation**: User identity persists across sessions

#### FR-2.3: User Presence Sidebar
- **Requirement**: Always-visible sidebar showing active users
- **Specifications**:
  - Location: Right side of screen
  - Width: 240px
  - Current user: Displayed at top with highlight
  - Other users: Listed below in alphabetical order
  - Display: User color swatch + Display name
- **Validation**: Sidebar updates in real-time as users join/leave

#### FR-2.4: Real-Time Cursor Tracking
- **Requirement**: Display cursor position for all active users
- **Specifications**:
  - Visual: Small cursor icon in user's assigned color
  - Label: Shows user's UUID/name
  - Update frequency: Target <50ms latency
  - Scope: Only visible within canvas drawing area
- **Validation**: Cursors move smoothly and track actual mouse positions

#### FR-2.5: Session Management
- **Requirement**: Track active sessions and clean up on disconnect
- **Behavior**:
  - User enters document → Creates presence record
  - User closes tab/window → Removes presence after timeout (30s)
  - User switches tabs → Maintains presence
  - User network disconnect → Removes presence after timeout
- **Validation**: Presence list accurately reflects active users

### Technical Requirements

#### TR-2.1: Firebase Authentication
- Implement Firebase Auth with Anonymous + Google providers
- Store user profile in Firestore `/users/{userId}` collection
- User document schema:
  ```typescript
  interface User {
    userId: string;        // Firebase Auth UID
    displayName: string;   // Display name
    color: string;         // Hex color code
    createdAt: Timestamp;  // Account creation
    lastActive: Timestamp; // Last activity
  }
  ```

#### TR-2.2: Presence System
- Use Firebase Realtime Database for presence (real-time updates)
- Use Firestore for user profiles (persistent data)
- Presence document schema in Realtime Database:
  ```typescript
  interface UserPresence {
    userId: string;
    displayName: string;
    color: string;
    cursorX: number;       // Canvas coordinates
    cursorY: number;       // Canvas coordinates
    connectedAt: number;   // Unix timestamp
    lastUpdate: number;    // Unix timestamp
  }
  ```
- Realtime Database path: `/presence/main/{userId}`
- Firestore path for user profiles: `/users/{userId}`
- Implement heartbeat mechanism (update every 5s)

#### TR-2.3: Cursor Synchronization
- Use Firebase Realtime Database for cursor positions
- Throttle cursor position updates to every 50ms
- Use Realtime Database `.update()` for cursor updates
- Transform screen coordinates to canvas coordinates before sending
- Transform canvas coordinates to screen coordinates for display
- Realtime Database path: `/presence/main/{userId}/cursorX` and `/cursorY`

#### TR-2.4: Session Persistence
- Session persists across tabs using `sessionStorage`
- One presence record per user (not per tab)
- Use Firebase Realtime Database `onDisconnect()` for cleanup
- Implement 30-second timeout for disconnected users
- User profiles persist in Firestore

### Data Structures

```typescript
interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

interface PresenceState {
  currentUser: UserPresence;
  otherUsers: Map<string, UserPresence>;
}

interface CursorPosition {
  userId: string;
  x: number;  // Canvas coordinates
  y: number;  // Canvas coordinates
  color: string;
  displayName: string;
}
```

### UI Components

#### User Presence Sidebar
```
┌─────────────────────────┐
│ Active Users            │
├─────────────────────────┤
│ ● You                   │ ← Highlighted
│   (Your Name)           │
├─────────────────────────┤
│ ● Alice Johnson         │
│ ● Bob Smith             │
│ ● Carol White           │
└─────────────────────────┘
```

#### Cursor Display
```
Canvas Area:
  [Cursor Icon]
  └─ "Alice"
```

### Acceptance Criteria
- [ ] Users can sign in with Anonymous or Google authentication
- [ ] User identity (UUID + color) is assigned and persists
- [ ] User presence sidebar is always visible on right side
- [ ] Current user is highlighted and shown at top of sidebar
- [ ] Real-time cursor positions display for all active users
- [ ] Cursors update with <50ms latency
- [ ] User presence updates when users join/leave
- [ ] Sessions persist across browser tabs/windows
- [ ] Disconnected users are removed after timeout
- [ ] No errors logged for presence system

---

## Stage 3: Display Objects - Shapes

### Overview
Implement creation, manipulation, and synchronization of display objects (shapes) on the canvas.

### Functional Requirements

#### FR-3.1: Shape Types
- **Requirement**: Support three shape types
- **Types**:
  1. **Rectangle**: Width, height, border radius
  2. **Circle**: Radius
  3. **Line**: Start point, end point, stroke width
- **Implementation Order**: Rectangle → Circle → Line (progressive)

#### FR-3.2: Shape Creation
- **Requirement**: Users can create shapes on the canvas
- **Interaction**:
  - Rectangle: Click and drag to define bounds
  - Circle: Click center, drag to define radius
  - Line: Click start point, drag to end point
- **Tool Selection**: UI toolbar to select shape type
- **Validation**: Created shapes appear for all users in real-time

#### FR-3.3: Shape Selection
- **Requirement**: Users can select shapes individually or multiple via marquee
- **Individual Selection**: Click on shape to select
- **Multiple Selection**: 
  - Hold Shift + click to add to selection
  - Drag marquee box to select multiple shapes
- **Visual Feedback**: Selected shapes show selection handles
- **Validation**: Selection state syncs across users

#### FR-3.4: Shape Locking
- **Requirement**: Selected shapes are locked to prevent concurrent editing
- **Behavior**:
  - User A selects shape → Shape locked to User A
  - User B attempts to select same shape → Console log message
  - User A deselects → Shape unlocked
- **Lock Timeout**: 60 seconds of inactivity auto-unlocks
- **Validation**: Locked shapes cannot be selected by other users

#### FR-3.5: Shape Manipulation
- **Requirement**: Users can transform selected shapes
- **Operations**:
  - **Drag**: Move shape position
  - **Resize**: Drag corner handles to resize
  - **Rotate**: Drag rotation handle (top-center)
- **Constraints**: Shapes cannot be moved outside canvas bounds
- **Validation**: Transformations sync to all users in real-time

#### FR-3.6: Shape Properties
- **Requirement**: Users can edit shape visual properties
- **Editable Properties**:
  - Fill color (hex color picker)
  - Stroke color (hex color picker)
  - Stroke width (1-10px)
  - Opacity (0-100%)
  - Border radius (rectangles only, 0-50px)
- **UI**: Properties panel appears when shape is selected
- **Validation**: Property changes sync in real-time

#### FR-3.7: Shape Persistence
- **Requirement**: Shapes persist across document sessions
- **Behavior**:
  - All users disconnect → Shapes remain in Firestore
  - Users reconnect → Shapes load from Firestore
  - No data loss on disconnect
- **Validation**: Canvas state fully restored after all users disconnect/reconnect

#### FR-3.8: Z-Index Management
- **Requirement**: Display modal showing shape layer order
- **Specifications**:
  - Modal: Toggleable z-index panel
  - Display: Read-only list of shapes ordered by z-index (top to bottom)
  - Item format: Shape type + ID (e.g., "Rectangle #1234")
- **Validation**: List accurately reflects current z-index order

### Technical Requirements

#### TR-3.1: Shape Data Model
```typescript
interface Shape {
  id: string;              // UUID
  type: 'rectangle' | 'circle' | 'line';
  x: number;               // Canvas coordinates
  y: number;               // Canvas coordinates
  width?: number;          // Rectangle/Circle
  height?: number;         // Rectangle
  radius?: number;         // Circle
  points?: number[];       // Line [x1, y1, x2, y2]
  
  // Visual properties
  fillColor: string;       // Hex color
  strokeColor: string;     // Hex color
  strokeWidth: number;     // 1-10px
  opacity: number;         // 0-1
  borderRadius?: number;   // Rectangle only, 0-50px
  
  // Transform
  rotation: number;        // Degrees
  zIndex: number;          // Layer order
  
  // Metadata
  createdBy: string;       // User ID
  createdAt: Timestamp;
  lastModifiedBy: string;
  lastModifiedAt: Timestamp;
  
  // Locking
  lockedBy: string | null; // User ID or null
  lockedAt: Timestamp | null;
}
```

#### TR-3.2: Firestore Schema
- Collection path: `/documents/{documentId}/shapes/{shapeId}`
- Use Firestore transactions for lock acquisition
- Real-time listeners for shape changes
- Batch writes for performance

#### TR-3.3: Selection State
```typescript
interface SelectionState {
  selectedShapeIds: string[];
  isMarqueeSelecting: boolean;
  marqueeStart: { x: number; y: number } | null;
  marqueeEnd: { x: number; y: number } | null;
}
```

#### TR-3.4: Lock Management
- Check lock status before allowing selection
- Implement automatic lock timeout (60s)
- Use Firestore server timestamp for lock times
- Log to console when user attempts to select locked shape

#### TR-3.5: Synchronization Strategy
- **Optimistic Updates**: Update local state immediately
- **Server Reconciliation**: Listen to Firestore changes
- **Conflict Resolution**: Last-write-wins
- **Debouncing**: Debounce rapid property changes (300ms)

#### TR-3.6: Performance Optimization
- Render only visible shapes (viewport culling)
- Use Konva layer caching for static shapes
- Throttle real-time updates during drag operations
- Maximum 500 shapes without FPS drop

### UI Components

#### Shape Toolbar
```
┌─────────────────────────────────┐
│ [Rectangle] [Circle] [Line]    │
└─────────────────────────────────┘
```

#### Properties Panel (when shape selected)
```
┌─────────────────────────┐
│ Properties              │
├─────────────────────────┤
│ Fill Color:    [●]      │
│ Stroke Color:  [●]      │
│ Stroke Width:  [3  ]px  │
│ Opacity:       [100]%   │
│ Border Radius: [0  ]px  │ (Rectangle only)
└─────────────────────────┘
```

#### Z-Index Modal
```
┌─────────────────────────┐
│ Layers                  │
├─────────────────────────┤
│ 1. Rectangle #abc123    │
│ 2. Circle #def456       │
│ 3. Line #ghi789         │
└─────────────────────────┘
```

### Interaction Flows

#### Create Rectangle
1. User clicks Rectangle tool in toolbar
2. User clicks on canvas (start point)
3. User drags to define bounds
4. User releases mouse (end point)
5. Rectangle created with default properties
6. Rectangle saved to Firestore
7. All users see new rectangle in real-time

#### Select and Edit Shape
1. User clicks on shape
2. System checks if shape is locked
   - If locked by another user → Log to console, abort
   - If unlocked → Acquire lock
3. Selection handles appear
4. User edits properties in properties panel
5. Changes debounced and saved to Firestore
6. All users see property changes in real-time
7. User clicks away or selects another shape → Lock released

#### Marquee Selection
1. User clicks on empty canvas area
2. User drags to create selection rectangle
3. All shapes intersecting marquee are selected
4. System attempts to acquire locks on all selected shapes
5. Successfully locked shapes are added to selection
6. Locked shapes are skipped (log to console)

### Acceptance Criteria
- [ ] Users can create rectangles by click-drag
- [ ] Users can create circles by click-drag
- [ ] Users can create lines by click-drag
- [ ] Shape toolbar allows tool selection
- [ ] Individual shape selection works
- [ ] Shift+click adds shapes to selection
- [ ] Marquee selection selects multiple shapes
- [ ] Selected shapes show visual handles
- [ ] Locked shapes cannot be selected by other users
- [ ] Console logs when attempting to select locked shape
- [ ] Users can drag selected shapes
- [ ] Users can resize selected shapes via handles
- [ ] Users can rotate selected shapes
- [ ] Properties panel displays for selected shapes
- [ ] Fill color can be edited
- [ ] Stroke color can be edited
- [ ] Stroke width can be edited (1-10px)
- [ ] Opacity can be edited (0-100%)
- [ ] Border radius can be edited (rectangles only, 0-50px)
- [ ] Property changes sync in real-time
- [ ] Shapes persist after all users disconnect
- [ ] Z-index modal displays correct layer order
- [ ] All shape operations maintain 60 FPS performance
- [ ] Canvas supports 500+ shapes without degradation

---

## Stage 4: Future AI Integration (Architecture Only)

### Overview
Stage 4 will add AI Canvas Agent capabilities. This stage is **NOT** implemented now, but architecture decisions should anticipate it.

### Architectural Considerations

#### API Design for AI Commands
- Expose canvas operations as imperative functions
- Functions should be stateless and idempotent
- Example function signatures:
  ```typescript
  createShape(type, properties): Promise<Shape>
  updateShape(shapeId, properties): Promise<Shape>
  deleteShape(shapeId): Promise<void>
  getCanvasState(): Promise<CanvasState>
  ```

#### Command Pattern
- Consider implementing Command pattern for all operations
- Commands should be serializable
- Enables undo/redo and AI command execution
- Example:
  ```typescript
  interface Command {
    execute(): Promise<void>;
    undo(): Promise<void>;
    serialize(): CommandData;
  }
  ```

#### State Management
- Ensure global state is accessible for AI context
- AI needs to query current canvas state before operations
- Implement getters for:
  - All shapes with properties
  - Current selections
  - Viewport state
  - User presence

#### Event Logging
- Log all canvas operations for debugging AI behavior
- Include: command type, parameters, timestamp, user
- Useful for training and improving AI prompts

### No Implementation Required
- **Do not implement AI features in this PRD**
- Focus only on making architecture decisions that don't preclude AI integration later
- Keep code modular and functions well-documented

---

## Non-Functional Requirements

### Performance
- **Frame Rate**: Maintain 60 FPS during all interactions
- **Sync Latency**: 
  - Object changes: <100ms
  - Cursor positions: <50ms
- **Scalability**:
  - Support 500+ shapes without performance degradation
  - Support 5+ concurrent users without sync issues
- **Load Time**: Initial app load <3 seconds

### Security
- **Firebase Rules**: Open test environment during development
- **Authentication**: Secure token management
- **Data Validation**: Validate all inputs on client and server

### Reliability
- **Uptime**: Target 99% uptime during testing
- **Data Persistence**: Zero data loss on disconnect
- **Error Handling**: Graceful degradation on network issues
- **Recovery**: Auto-reconnect on network restoration

### Code Quality
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with React + TypeScript rules
- **Testing**: Manual testing for all features
- **Documentation**: Inline comments for complex logic

### Browser Support
- **Primary**: Chrome 100+
- **Secondary**: Firefox 100+, Safari 15+, Edge 100+
- **Mobile**: Not required for MVP

---

## Development Constraints

### Must Use
- React 18+ with TypeScript (strict)
- Konva.js for canvas rendering
- Firebase (Firestore + Auth + Hosting)
- Vite as build tool

### Must Not
- No additional state management libraries (Redux, Zustand) unless absolutely necessary
- No CSS frameworks beyond Tailwind or CSS Modules
- No backend server beyond Firebase
- No AI features in initial implementation

### Assumed
- Firebase project is pre-configured
- Development environment has Node.js 18+
- Developer has Firebase CLI access
- Open Firebase security rules during development

---

## Success Metrics

### Stage 1 Success
- Canvas renders at 60 FPS
- Pan and zoom work smoothly
- Grid displays correctly at all zoom levels
- Viewport fills browser window

### Stage 2 Success
- Authentication works for Anonymous + Google
- User presence sidebar shows all active users
- Real-time cursors track with <50ms latency
- Sessions persist across tabs
- Disconnected users are removed properly

### Stage 3 Success
- All three shape types can be created
- Selection and locking work correctly
- Shape transformations sync in real-time
- Properties panel allows editing all attributes
- Shapes persist across sessions
- Z-index modal displays correct order
- Performance targets met (60 FPS, 500+ shapes)

### Overall Success
- All acceptance criteria met for Stages 1-3
- No critical bugs or errors
- App is deployable to Firebase Hosting
- Code is maintainable and well-documented

---

## Out of Scope

The following are explicitly **NOT** in scope for this PRD:

- AI Canvas Agent integration (Stage 4)
- Undo/redo functionality
- Image upload/display
- Text editing beyond basic text shapes
- Component/symbol system
- Export to PNG/SVG
- Advanced layer grouping
- Vector path editing
- Collaboration features beyond presence (comments, annotations)
- Multiple document support
- Mobile optimization
- Accessibility (WCAG compliance)
- Internationalization
- Analytics/telemetry

These may be added in future iterations but are not required for MVP.

---

## Appendix A: Color Palette for User Colors

Predefined colors for user assignment (hex codes):

1. `#FF6B6B` - Red
2. `#4ECDC4` - Teal
3. `#45B7D1` - Blue
4. `#FFA07A` - Orange
5. `#98D8C8` - Mint
6. `#FFE66D` - Yellow
7. `#A8E6CF` - Green
8. `#C7CEEA` - Lavender
9. `#FF8B94` - Pink
10. `#B4A7D6` - Purple

Assign colors sequentially and cycle if more than 10 users.

---

## Appendix B: Firebase Data Structure

### Firestore Collections (Persistent Data)

```
/users
  /{userId}
    - userId: string
    - displayName: string
    - color: string
    - createdAt: Timestamp
    - lastActive: Timestamp

/documents
  /{documentId}
    - name: string
    - createdAt: Timestamp
    - lastModified: Timestamp
    
    /shapes
      /{shapeId}
        - (Shape interface fields)
```

### Realtime Database Structure (Real-time Sync)

```
/presence
  /main
    /{userId}
      - userId: string
      - displayName: string
      - color: string
      - cursorX: number
      - cursorY: number
      - connectedAt: number (Unix timestamp)
      - lastUpdate: number (Unix timestamp)
```

### Data Storage Strategy

**Firestore** (Persistent, queryable data):
- User profiles
- Shape objects
- Document metadata

**Realtime Database** (High-frequency, ephemeral data):
- User presence
- Cursor positions
- Connection status

---

## Appendix C: Keyboard Shortcuts

Stage 1-3 does not require keyboard shortcuts, but consider these for future:
- `Delete`: Delete selected shapes
- `Cmd/Ctrl + D`: Duplicate selected shapes
- `Cmd/Ctrl + Z`: Undo (future)
- `Cmd/Ctrl + Shift + Z`: Redo (future)
- `Arrow Keys`: Nudge selected shapes
- `Cmd/Ctrl + A`: Select all

---

## Document End

This PRD defines all requirements for Stages 1-3 of CollabCanvas. 

**Next Steps:**
1. Review the Task List (`_docs/TASK_LIST.md`) for implementation order
2. Consult the Architecture Diagram (`_docs/ARCHITECTURE.md`) for system design
3. Begin with SETUP-1 in the Task List