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

## Stage 3: Display Objects - Universal Editing

### Functional Requirements

#### FR-3.0: Display Object Toolbar
- **Location**: Fixed at top of screen (below any app header)
- **Size**: 44px height, auto width based on tools
- **Tools**: Select, Rectangle, Circle, Line
- **Default Tool**: 'select'
- **Behavior**:
  - Click tool button to select tool
  - Selected tool highlighted with background color
  - Canvas click behavior depends on selected tool:
    - 'select': Enables selection and transforms
    - 'rectangle'/'circle'/'line': Creates shape at click position
  - After shape creation, tool auto-reverts to 'select'
- **Visual**:
  - Background: rgba(30, 30, 30, 0.95)
  - Tool buttons: 44px × 44px with icons
  - Selected: Blue highlight (#4A90E2)
  - Unselected: Subtle hover effect
  - Spacing: 8px between buttons, 8px padding

#### FR-3.1: Display Object Type System
- **Type Hierarchy**: DisplayObject → Shape → Rectangle/Circle/Line
- **Universal Properties**: x, y, rotation, scaleX, scaleY, opacity, zIndex
- **Shape Properties**: dimensions, fillColor, strokeColor, strokeWidth, borderRadius

#### FR-3.2: Multi-Selection
- **Single Click**: Select object (replace selection) - **only when tool === 'select'**
- **Shift+Click**: Add/remove from collection - **only when tool === 'select'**
- **Marquee**: Drag on empty canvas, select intersecting objects - **only when tool === 'select'**
- **Limit**: 100 objects max
- **Tool Interaction**: Selection disabled when tool !== 'select'

#### FR-3.3: Collection Bounding Box (AABB)
- **Visual**: Dashed blue outline, 50% opacity
- **Behavior**: Axis-aligned, recalculates during transforms
- **Visibility**: Only shown when tool === 'select' and objects selected

#### FR-3.4: Individual Object Highlights (OBB)
- **Visual**: Solid blue outline, 100% opacity
- **Behavior**: Rotates with object
- **Visibility**: Only shown when tool === 'select' and objects selected

#### FR-3.5: Collection-Level Locking
- **Atomic**: All objects lock or none lock
- **Conflict**: Log error, abort selection
- **Release**: On deselect, timeout (60s), sign-out, or tool change to non-select
- **Heartbeat**: Every 5 seconds

#### FR-3.6: Transform Modal
- **Position**: Collection centerpoint
- **Size**: 120px × 60px
- **Contents**: Rotation knob (left), Scale knob (right)
- **Behavior**: Fixed at centerpoint, visible when selected
- **Visibility**: Only shown when tool === 'select' and objects selected

#### FR-3.7: Rotation Knob
- **Sensitivity**: 1px = 1°
- **Direction**: Up/left = CCW, down/right = CW
- **Transform**: Rotate around collection center
- **Update**: Optimistic local + debounce 300ms
- **Availability**: Only active when tool === 'select'

#### FR-3.8: Scale Knob
- **Sensitivity**: 1px = 0.01 scale delta
- **Direction**: Clockwise = grow, CCW = shrink
- **Constraints**: 0.1 to 10.0
- **Transform**: Scale from collection center
- **Availability**: Only active when tool === 'select'

#### FR-3.9: Translation
- **Interaction**: Drag any object in collection
- **Constraint**: Canvas boundaries (0,0 to 10000,10000)
- **Update**: Optimistic + debounce 300ms
- **Availability**: Only active when tool === 'select'

#### FR-3.10: Shape Creation
- **Trigger**: Click canvas when tool === 'rectangle'/'circle'/'line'
- **Behavior**: Create shape at click position with default properties
- **Default Properties**:
  - Rectangle: 100px × 100px
  - Circle: 50px radius
  - Line: 100px horizontal line
  - Fill: #CCCCCC
  - Stroke: #000000
  - Stroke width: 2px
  - Opacity: 1.0
- **Post-Creation**: Tool automatically reverts to 'select'

#### FR-3.11: Shape Persistence
- Objects persist across sessions with all transform properties

### Technical Requirements

#### TR-3.1: Tool State Management
```typescript
interface ToolState {
  currentTool: 'select' | 'rectangle' | 'circle' | 'line';
}
```

#### TR-3.2: Data Model
```typescript
interface BaseDisplayObject {
  id: string;
  category: 'shape' | 'text' | 'image';
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  zIndex: number;
  opacity: number;
  createdBy: string;
  createdAt: Timestamp;
  lastModifiedBy: string;
  lastModifiedAt: Timestamp;
  lockedBy: string | null;
  lockedAt: Timestamp | null;
}

interface ShapeDisplayObject extends BaseDisplayObject {
  category: 'shape';
  type: 'rectangle' | 'circle' | 'line';
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  borderRadius?: number;
}
```

#### TR-3.3: Firestore Schema
- Path: `/documents/main/shapes/{shapeId}`
- Transactions for atomic locks
- Batch writes for transforms

#### TR-3.4: Transform Math
- Rotation: 2D rotation matrix around centerpoint
- Scaling: Proportional from centerpoint
- Constraints: Boundary checking, scale limits

#### TR-3.5: Performance
- 60 FPS with 100+ objects
- Viewport culling
- Debounced Firestore writes (300ms)

### Acceptance Criteria

#### Toolbar
- [ ] Toolbar visible at top of screen
- [ ] Four tool buttons: Select, Rectangle, Circle, Line
- [ ] Selected tool highlighted (blue background)
- [ ] Tool selection persists until changed
- [ ] Clicking tool changes currentTool state
- [ ] Toolbar styled correctly (44px height, proper spacing)

#### Shape Creation
- [ ] Rectangle tool creates rectangles on canvas click
- [ ] Circle tool creates circles on canvas click
- [ ] Line tool creates lines on canvas click
- [ ] Shapes created with default properties
- [ ] Tool reverts to 'select' after shape creation
- [ ] Created shapes persist to Firestore
- [ ] Created shapes visible to other users

#### Selection
- [ ] Single click selects object (when tool === 'select')
- [ ] Shift+click adds/removes from collection (when tool === 'select')
- [ ] Marquee selection works (when tool === 'select')
- [ ] Max 100 objects enforced
- [ ] Selection disabled when tool !== 'select'
- [ ] Selection syncs across users

#### Visual Indicators
- [ ] Collection AABB displays (dashed) when tool === 'select'
- [ ] Individual OBBs display (solid) when tool === 'select'
- [ ] Both visible simultaneously
- [ ] Update smoothly during transforms
- [ ] Hidden when tool !== 'select'

#### Locking
- [ ] Atomic lock acquisition
- [ ] Conflicts logged and abort selection
- [ ] Locks release on deselect
- [ ] Locks release on tool change to non-select
- [ ] Auto-release after 60s
- [ ] Heartbeat every 5s

#### Transform Modal
- [ ] Appears at collection center when tool === 'select'
- [ ] Contains rotation and scale knobs
- [ ] Position updates during transforms
- [ ] Fixed size (120px × 60px)
- [ ] Dismissed on deselection or tool change

#### Rotation
- [ ] 1px = 1° verified
- [ ] Up/left = CCW, down/right = CW
- [ ] Rotates around collection center
- [ ] Only active when tool === 'select'
- [ ] 60 FPS performance
- [ ] Syncs within 300ms

#### Scale
- [ ] 1px = 0.01 delta verified
- [ ] Clockwise grows, CCW shrinks
- [ ] Constraints enforced (0.1-10.0)
- [ ] Scales from collection center
- [ ] Only active when tool === 'select'
- [ ] 60 FPS performance

#### Translation
- [ ] Drag moves entire collection (when tool === 'select')
- [ ] Boundary constraints work
- [ ] Only active when tool === 'select'
- [ ] 60 FPS performance
- [ ] Syncs within 300ms

#### Persistence
- [ ] All transforms persist across sessions
- [ ] No data loss on disconnect

---

## Stage 4: Text Objects & Object-Specific Editing

### Functional Requirements

#### FR-4.1: Text Tool
- **Location**: Added to Display Object Toolbar
- **Icon**: "T" or text icon
- **Behavior**: Same as shape tools
  - Click text tool to select
  - Click canvas to create text box
  - Tool auto-reverts to 'select' after creation

#### FR-4.2: Text Display Objects
- **Creation**: Click canvas when tool === 'text'
- **Default**: 200px × 100px, "Double-click to edit"
- **Properties**:
  - Content (string)
  - Font family (Arial, Helvetica, Times New Roman, Courier, Georgia)
  - Font size (12-72px)
  - Font weight (100-900)
  - Text color (hex)
  - Text alignment (left, center, right, justify)
  - Line height (0.8-3.0)
  - Opacity (0-100%)

#### FR-4.3: Object-Specific Editing Mode
- **Trigger**: Double-click any display object
- **Behavior**: 
  - Deselects all other objects
  - Locks the single object
  - Shows object-specific properties panel
- **Exit**: Click empty canvas, click different object, press Escape, or tool change

#### FR-4.4: Shape Properties Panel
- **Location**: Left side, 280px wide
- **Properties**:
  - Fill Color (color picker + hex)
  - Stroke Color (color picker + hex)
  - Stroke Width (1-10px slider)
  - Opacity (0-100% slider)
  - Border Radius (0-50px slider, rectangles only)
- **Update**: Optimistic + debounce 300ms

#### FR-4.5: Text Properties Panel
- **Location**: Left side, 280px wide
- **Properties**:
  - Content (multi-line input)
  - Font Family (dropdown)
  - Font Size (12-72px slider)
  - Font Weight (100-900 slider)
  - Text Color (color picker)
  - Text Alignment (button group)
  - Line Height (0.8-3.0 slider)
  - Opacity (0-100% slider)
- **Update**: Content debounce 500ms, styles 300ms

#### FR-4.6: Visual Indicator
- **Initial**: Same as display-level (OBB highlight)
- **Future**: Differentiate with color/style

### Technical Requirements

#### TR-4.1: Tool State Update
```typescript
interface ToolState {
  currentTool: 'select' | 'rectangle' | 'circle' | 'line' | 'text';
}
```

#### TR-4.2: Text Data Model
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

#### TR-4.3: Firestore Schema
- Path: `/documents/main/texts/{textId}`
- Same metadata as shapes

#### TR-4.4: Selection Mode State
```typescript
type SelectionMode = 'display-level' | 'object-specific';
```

### Acceptance Criteria

#### Text Tool
- [ ] Text tool in toolbar
- [ ] Text tool button styled like other tools
- [ ] Text tool selection works
- [ ] Tool reverts to 'select' after text creation

#### Text Objects
- [ ] Text tool creates text box on canvas click
- [ ] Default size: 200px × 100px
- [ ] Default text displays
- [ ] Text wraps within bounds
- [ ] Text renders at all zoom levels
- [ ] Text persists across sessions
- [ ] Text can be transformed like shapes

#### Object-Specific Mode
- [ ] Double-click enters mode
- [ ] Other objects deselect
- [ ] Object locks successfully
- [ ] Properties panel displays
- [ ] Escape exits mode
- [ ] Tool change exits mode

#### Shape Properties Panel
- [ ] Panel displays for shapes
- [ ] Fill color works
- [ ] Stroke color works
- [ ] Stroke width works (1-10px)
- [ ] Opacity works (0-100%)
- [ ] Border radius works (rectangles, 0-50px)
- [ ] Changes sync within 500ms

#### Text Properties Panel
- [ ] Panel displays for text
- [ ] Content editable
- [ ] Font dropdown works (5 fonts)
- [ ] Font size works (12-72px)
- [ ] Font weight works (100-900)
- [ ] Text color works
- [ ] Alignment works (4 options)
- [ ] Line height works (0.8-3.0)
- [ ] Opacity works (0-100%)
- [ ] Long text wraps correctly

---

## Out of Scope

Not in Stages 3-4:
- Image display objects
- Undo/redo
- Copy/paste/duplicate
- Delete key
- Keyboard shortcuts (beyond Escape)
- Snapping/guides
- Grouping
- Layer panel
- Custom fonts
- Rich text formatting
- Effects (shadow, glow)
- Export
- Comments/annotations
- Version history

---

## Appendix A: Firebase Schema

### Firestore Collections

```
firestore/
├── users/{userId}/
│   ├── userId, displayName, color
│   └── createdAt, lastActive
│
└── documents/main/
    ├── shapes/{shapeId}/
    │   ├── category: 'shape'
    │   ├── type: 'rectangle' | 'circle' | 'line'
    │   ├── x, y, rotation, scaleX, scaleY
    │   ├── width?, height?, radius?, points?
    │   ├── fillColor, strokeColor, strokeWidth
    │   ├── opacity, borderRadius?, zIndex
    │   └── metadata, locking
    │
    └── texts/{textId}/
        ├── category: 'text'
        ├── x, y, rotation, scaleX, scaleY
        ├── width, height, content
        ├── font, fontSize, fontWeight
        ├── textAlign, lineHeight, color
        ├── opacity, zIndex
        └── metadata, locking
```

### Realtime Database

```
realtime-database/
└── presence/main/{userId}/{tabId}/
    ├── userId, displayName, color
    ├── cursorX, cursorY
    └── connectedAt, lastUpdate
```

---

## Appendix B: Transform Mathematics

### Rotation Around Point
```typescript
function rotatePoint(point: Point, center: Point, degrees: number): Point {
  const rad = (degrees * Math.PI) / 180;
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: dx * Math.cos(rad) - dy * Math.sin(rad) + center.x,
    y: dx * Math.sin(rad) + dy * Math.cos(rad) + center.y,
  };
}
```

### Scaling Around Point
```typescript
function scalePoint(point: Point, center: Point, scaleFactor: number): Point {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: dx * scaleFactor + center.x,
    y: dy * scaleFactor + center.y,
  };
}
```

### Collection AABB
```typescript
function calculateCollectionAABB(objects: DisplayObject[]): AABB {
  const allPoints = objects.flatMap(obj => getObjectCorners(obj));
  return {
    minX: Math.min(...allPoints.map(p => p.x)),
    minY: Math.min(...allPoints.map(p => p.y)),
    maxX: Math.max(...allPoints.map(p => p.x)),
    maxY: Math.max(...allPoints.map(p => p.y)),
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}
```

---

## Appendix C: Visual Design

### Colors
- Collection AABB: `#4A90E2` at 50%
- Individual OBB: `#4A90E2` at 100%
- Transform Modal BG: `rgba(30, 30, 30, 0.9)`
- Properties Panel BG: `rgba(30, 30, 30, 0.95)`
- Toolbar BG: `rgba(30, 30, 30, 0.95)`
- Selected Tool: `#4A90E2`

### Typography
- Modal Labels: 12px, 500 weight
- Panel Title: 16px, 600 weight
- Panel Labels: 14px, 500 weight

### Spacing
- Toolbar: 44px height, 8px padding, 8px between buttons
- Transform Modal: 120px × 60px, knobs 60px apart
- Properties Panel: 280px wide, 20px padding

---

## Appendix D: Performance Benchmarks

### Targets
- Frame Rate: 60 FPS sustained
- Selection: <100ms (Firestore)
- Transforms: <300ms (debounced)
- Properties: <500ms (debounced)
- Lock: <200ms (transaction)
- Tool Change: <50ms (local state)

### Scalability
- Max objects: 1000+ without degradation
- Max selected: 100 without FPS drop
- Max users: 10+ without sync issues

---

## Stage 5: Future AI Integration (Architecture Only)

### Overview
Stage 5 will add AI Canvas Agent capabilities. This stage is **NOT** implemented now, but architecture decisions should anticipate it.

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

- AI Canvas Agent integration (Stage 5)
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