## Firestore Database Schema

### Firestore Collections (Persistent Data)

```
firestore/
├── users/                           # User profiles
│   └── {userId}/                    # Document per user
│       ├── userId: string
│       ├── displayName: string
│       ├── color: string
│       ├── createdAt: Timestamp
│       └── lastActive: Timestamp
│
└── documents/                       # Canvas documents
    └── main/                        # Single document for MVP
        ├── name: "Shared Canvas"
        ├── createdAt: Timestamp
        ├── lastModified: Timestamp
        │
        └── shapes/                  # Shape objects subcollection
            └── {shapeId}/           # Document per shape
                ├── id: string
                ├── type: 'rectangle' | 'circle' | 'line'
                ├── x: number
                ├── y: number
                ├── width: number (optional)
                ├── height: number (optional)
                ├── radius: number (optional)
                ├── points: number[] (optional)
                ├── fillColor: string
                ├── strokeColor: string
                ├── strokeWidth: number
                ├── opacity: number
                ├── borderRadius: number (optional)
                ├── rotation: number
                ├── zIndex: number
                ├── createdBy: string
                ├── createdAt: Timestamp
                ├── lastModifiedBy: string
                ├── lastModifiedAt: Timestamp
                ├── lockedBy: string | null
                └── lockedAt: Timestamp | null
```

### Realtime Database Structure (Real-time Sync)

```
realtime-database/
└── presence/
    └── main/                        # Document ID
        └── {userId}/                # User presence
            ├── userId: string
            ├── displayName: string
            ├── color: string
            ├── cursorX: number      # Canvas coordinates
            ├── cursorY: number      # Canvas coordinates
            ├── connectedAt: number  # Unix timestamp (ms)
            └── lastUpdate: number   # Unix timestamp (ms)
```

### Data Storage Strategy

**Firestore** (Persistent, queryable data):
- ✅ User profiles
- ✅ Shape objects (all properties)
- ✅ Document metadata
- ✅ Shape locks (part of shape document)
- **Why**: Need complex queries, indexing, transactions
- **Update frequency**: Low (on create, modify, delete)

**Realtime Database** (High-frequency, ephemeral data):
- ✅ User presence (who's online)
- ✅ Cursor positions (x, y coordinates)
- ✅ Connection status (heartbeat)
- **Why**: Ultra-low latency (<50ms), high-frequency updates
- **Update frequency**: Very high (every 50ms for cursors, every 5s for heartbeat)

### Database Selection Decision Tree

```
Is this data ephemeral (OK to lose on disconnect)?
├─ YES → Does it update more than once per second?
│         ├─ YES → Use Realtime Database
│         │        (cursors, presence heartbeat)
│         └─ NO → Use Firestore
│                 (could use either, prefer Firestore for structure)
└─ NO → Must persist permanently?
          └─ YES → Use Firestore
                   (shapes, user profiles, locks)
```
                # Architecture Diagram - CollabCanvas
# System Design & Technical Architecture

---

## Document Information
- **Project**: CollabCanvas
- **Target Audience**: AI Development Agent (Cursor IDE)
- **Purpose**: High-level system architecture and component relationships
- **Location**: `_docs/ARCHITECTURE.md`
- **Related Documents**: 
  - PRD: `_docs/PRD.md`
  - Task List: `_docs/TASK_LIST.md`

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER CLIENT                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                      React Application                     │ │
│  │                                                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │ │
│  │  │   Canvas     │  │     Auth     │  │   Presence   │   │ │
│  │  │   Feature    │  │   Feature    │  │   Feature    │   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │ │
│  │                                                            │ │
│  │  ┌──────────────┐  ┌──────────────┐                      │ │
│  │  │   Shapes     │  │     UI       │                      │ │
│  │  │   Feature    │  │  Components  │                      │ │
│  │  └──────────────┘  └──────────────┘                      │ │
│  │                                                            │ │
│  │  ┌───────────────────────────────────────────────────┐   │ │
│  │  │              Konva.js Canvas Layer                │   │ │
│  │  │  (Rendering: Grid, Shapes, Cursors, Handles)     │   │ │
│  │  └───────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  Firebase Client SDK                       │ │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │ │
│  │   │   Firestore  │  │   Realtime   │  │     Auth     │  │ │
│  │   │   Client     │  │   Database   │  │    Client    │  │ │
│  │   │              │  │   Client     │  │              │  │ │
│  │   └──────────────┘  └──────────────┘  └──────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                      FIREBASE BACKEND                           │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Firestore   │  │   Realtime   │  │   Firebase   │        │
│  │   Database   │  │   Database   │  │     Auth     │        │
│  │              │  │              │  │              │        │
│  │  Persistent  │  │  Real-time   │  │  User Mgmt   │        │
│  │  Shapes &    │  │  Presence &  │  │  OAuth       │        │
│  │  Profiles    │  │  Cursors     │  │              │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Feature Module Architecture

### Feature-Based Organization

```
src/
├── features/
│   ├── canvas/          # Canvas viewport management
│   │   ├── components/  # Canvas, GridBackground
│   │   ├── hooks/       # useCanvasSize, usePan, useZoom
│   │   ├── store/       # viewportStore (Context + useReducer)
│   │   └── utils/       # coordinateTransform, gridUtils
│   │
│   ├── auth/            # User authentication
│   │   ├── components/  # AuthModal
│   │   ├── hooks/       # useAuth
│   │   ├── services/    # authService (Firebase Auth)
│   │   └── store/       # authStore (Context + useReducer)
│   │
│   ├── presence/        # Real-time user presence
│   │   ├── components/  # UserPresenceSidebar, RemoteCursors
│   │   ├── hooks/       # usePresence, useActiveUsers, useCursorTracking
│   │   ├── services/    # presenceService (Firestore)
│   │   └── store/       # presenceStore (Context + useReducer)
│   │
│   └── shapes/          # Display objects (shapes)
│       ├── components/  # ShapeRenderer, Rectangle, Circle, Line
│       ├── hooks/       # useShapes, useSelection, useShapeTransform
│       ├── services/    # shapeService (Firestore CRUD)
│       ├── store/       # shapesStore, selectionStore, toolStore
│       └── utils/       # geometryUtils, viewportCulling
│
├── components/          # Shared UI components
│   ├── atoms/           # Button, Input, ColorPicker
│   ├── molecules/       # Toolbar, Panel
│   └── organisms/       # Modal, LoadingOverlay
│
├── api/                 # Firebase configuration
│   ├── firebase.ts      # Firebase initialization
│   └── firebaseConfig.ts # Firebase config (gitignored)
│
├── types/               # TypeScript types
│   ├── firebase.ts      # User, UserPresence, Shape
│   └── canvas.ts        # ViewportState, CanvasConfig
│
├── utils/               # Utility functions
│   ├── debounce.ts
│   ├── throttle.ts
│   └── performanceMonitor.ts
│
└── App.tsx              # Root component with providers
```

---

## Data Flow Architecture

### State Management Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATION STATE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LOCAL STATE (React useState/useReducer)                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  • Canvas viewport (pan, zoom, dimensions)             │    │
│  │  • Selected tool (select, rectangle, circle, line)     │    │
│  │  • Selection state (selectedShapeIds)                  │    │
│  │  • UI state (modal open/close, loading)                │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  SHARED STATE (Context API + useReducer)                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  • Auth state (current user, loading, error)           │    │
│  │  • Viewport state (shared across components)           │    │
│  │  • Tool state (shared tool selection)                  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  FIREBASE REALTIME DATABASE (High-frequency, ephemeral)         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  • User presence (all active users)                    │    │
│  │  • Cursor positions (real-time updates)                │    │
│  │  • Connection status                                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  FIRESTORE (Persistent, structured data)                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  • User profiles                                       │    │
│  │  • Shape objects (all canvas objects)                  │    │
│  │  • Document metadata                                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### State Flow Diagram

```
User Interaction
      ↓
React Component
      ↓
Event Handler
      ↓
┌─────────────────────┐
│  Optimistic Update  │ → Update local state immediately
│  (Local State)      │
└─────────────────────┘
      ↓
┌─────────────────────┐
│  Debounced/         │ → Throttle rapid updates
│  Throttled Write    │
└─────────────────────┘
      ↓
Firebase Service
      ↓
Firestore Write
      ↓
┌─────────────────────┐
│  Real-time          │ → Broadcast to all clients
│  Listener           │
└─────────────────────┘
      ↓
┌─────────────────────┐
│  Server             │ → Update local state from server
│  Reconciliation     │
└─────────────────────┘
      ↓
Re-render Components
```

---

## Firestore Database Schema

### Collections Structure

```
firestore/
├── users/                           # User profiles
│   └── {userId}/                    # Document per user
│       ├── userId: string
│       ├── displayName: string
│       ├── color: string
│       ├── createdAt: Timestamp
│       └── lastActive: Timestamp
│
└── documents/                       # Canvas documents
    └── main/                        # Single document for MVP
        ├── name: "Shared Canvas"
        ├── createdAt: Timestamp
        ├── lastModified: Timestamp
        │
        ├── presence/                # User presence subcollection
        │   └── {userId}/            # Document per active user
        │       ├── userId: string
        │       ├── displayName: string
        │       ├── color: string
        │       ├── cursorX: number
        │       ├── cursorY: number
        │       ├── connectedAt: Timestamp
        │       └── lastUpdate: Timestamp
        │
        └── shapes/                  # Shape objects subcollection
            └── {shapeId}/           # Document per shape
                ├── id: string
                ├── type: 'rectangle' | 'circle' | 'line'
                ├── x: number
                ├── y: number
                ├── width: number (optional)
                ├── height: number (optional)
                ├── radius: number (optional)
                ├── points: number[] (optional)
                ├── fillColor: string
                ├── strokeColor: string
                ├── strokeWidth: number
                ├── opacity: number
                ├── borderRadius: number (optional)
                ├── rotation: number
                ├── zIndex: number
                ├── createdBy: string
                ├── createdAt: Timestamp
                ├── lastModifiedBy: string
                ├── lastModifiedAt: Timestamp
                ├── lockedBy: string | null
                └── lockedAt: Timestamp | null
```

### Firestore Indexes

```javascript
// Required composite indexes for Firestore
{
  collectionGroup: "shapes",
  fields: [
    { fieldPath: "zIndex", order: "ASCENDING" },
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
}
```

### Realtime Database Indexes

```json
// Realtime Database rules with indexing
{
  "rules": {
    "presence": {
      "main": {
        "$userId": {
          ".indexOn": ["lastUpdate", "connectedAt"]
        }
      }
    }
  }
}
```

---

## Component Hierarchy

### Application Component Tree

```
App (Root)
├── AuthProvider (Context)
│   └── AuthModal (conditional on !authenticated)
│
├── ViewportProvider (Context)
│   └── ToolProvider (Context)
│       └── PresenceProvider (Context)
│           └── ShapesProvider (Context)
│               │
│               ├── ShapeToolbar (top-left)
│               │
│               ├── UserPresenceSidebar (right side)
│               │   └── UserPresenceItem[] (list items)
│               │
│               ├── Canvas (main area)
│               │   └── Konva.Stage
│               │       ├── GridBackground (Layer)
│               │       │   └── Konva.Rect + Konva.Line[]
│               │       │
│               │       ├── ShapeRenderer (Layer)
│               │       │   └── [Rectangle | Circle | Line][]
│               │       │       └── SelectionHandles (conditional)
│               │       │
│               │       └── RemoteCursors (Layer)
│               │           └── RemoteCursor[] (one per user)
│               │
│               ├── PropertiesPanel (left side, conditional on selection)
│               │   ├── ColorPicker (fill)
│               │   ├── ColorPicker (stroke)
│               │   ├── NumberInput (stroke width)
│               │   ├── NumberInput (opacity)
│               │   └── NumberInput (border radius)
│               │
│               ├── ZIndexModal (conditional on open)
│               │   └── ZIndexItem[] (list items)
│               │
│               └── MarqueeBox (conditional on active)
```

---

## Real-Time Synchronization Architecture

### Sync Flow for Shape Creation (Firestore)

```
User A creates rectangle
         ↓
┌─────────────────────────┐
│  Local Optimistic       │
│  Update                 │  → Rectangle appears immediately for User A
└─────────────────────────┘
         ↓
┌─────────────────────────┐
│  shapeService           │
│  .createShape()         │
└─────────────────────────┘
         ↓
┌─────────────────────────┐
│  Firestore Write        │  → Write to /documents/main/shapes/{id}
│  (with timestamp)       │     Latency: ~100-200ms
└─────────────────────────┘
         ↓
┌─────────────────────────┐
│  Firestore Listener     │  → Firestore broadcasts change
│  (all clients)          │     Total latency: ~100-300ms
└─────────────────────────┘
         ↓                ↓
    User B            User C
    ↓                    ↓
Shape appears       Shape appears
(~100-300ms delay)  (~100-300ms delay)
```

### Sync Flow for Cursor Movement (Realtime Database)

```
User A moves mouse
         ↓
┌─────────────────────────┐
│  onMouseMove Handler    │
└─────────────────────────┘
         ↓
┌─────────────────────────┐
│  Throttled Update       │  → Only send every 50ms
│  (50ms throttle)        │
└─────────────────────────┘
         ↓
┌─────────────────────────┐
│  Realtime DB Update     │  → Update /presence/main/{userId}
│  .update()              │     { cursorX: x, cursorY: y }
└─────────────────────────┘     Latency: ~20-50ms
         ↓
┌─────────────────────────┐
│  Realtime DB Listener   │  → Realtime DB broadcasts instantly
│  .on('value')           │     Total latency: <50ms
└─────────────────────────┘
         ↓                ↓
    User B            User C
    ↓                    ↓
Cursor updates      Cursor updates
instantly           instantly
(<50ms latency)     (<50ms latency)

Key Difference: Realtime DB is 3-6x faster than Firestore
```

### Sync Flow for Shape Transformation

```
User A drags rectangle
         ↓
┌─────────────────────────┐
│  onDragMove Handler     │  → Fires on every pixel movement
└─────────────────────────┘
         ↓
┌─────────────────────────┐
│  Local State Update     │  → Update local position immediately
│  (Optimistic)           │
└─────────────────────────┘
         ↓
┌─────────────────────────┐
│  Debounced Firestore    │  → Only write every 300ms
│  Update (300ms)         │
└─────────────────────────┘
         ↓
┌─────────────────────────┐
│  Real-time Listener     │  → Other users see smooth movement
│  (all other clients)    │     (with slight delay)
└─────────────────────────┘
         ↓
User B & C see position updates
(lagged by ~300-400ms)
```

### Cursor Position Sync (Realtime Database)

```
User A moves mouse
         ↓
┌─────────────────────────┐
│  onMouseMove Handler    │
└─────────────────────────┘
         ↓
┌─────────────────────────┐
│  Throttled Update       │  → Only send every 50ms
│  (50ms throttle)        │
└─────────────────────────┘
         ↓
┌─────────────────────────┐
│  presenceService        │
│  .updateCursor()        │
└─────────────────────────┘
         ↓
┌─────────────────────────┐
│  Realtime DB Write      │  → Update cursor position
│  database.ref().update()│     Very low latency (~20-50ms)
└─────────────────────────┘
         ↓
┌─────────────────────────┐
│  Realtime DB Listener   │  → Target <50ms latency
│  .on('value')           │     Much faster than Firestore
└─────────────────────────┘
         ↓
User B & C see cursor move
(with 20-50ms delay)

✅ Uses Realtime Database for speed
✅ Sub-50ms latency consistently
✅ 3-6x faster than Firestore
```

### Why Two Databases?

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE COMPARISON                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FIRESTORE                          REALTIME DATABASE            │
│  ├─ Latency: 100-300ms              ├─ Latency: 20-50ms        │
│  ├─ Structure: Documents            ├─ Structure: JSON tree     │
│  ├─ Queries: Complex, indexed       ├─ Queries: Simple paths    │
│  ├─ Transactions: ACID              ├─ Transactions: Limited    │
│  ├─ Offline: Full support           ├─ Offline: Basic support   │
│  └─ Best for: Persistent data       └─ Best for: Ephemeral data │
│                                                                  │
│  USE CASES IN OUR APP:                                          │
│  ├─ Shapes (complex, persistent)    → Firestore                │
│  ├─ User profiles (queryable)       → Firestore                │
│  ├─ Shape locks (transactional)     → Firestore                │
│  ├─ Cursor positions (fast, temp)   → Realtime Database        │
│  └─ Presence heartbeat (fast)       → Realtime Database        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Coordinate System Architecture

### Canvas Coordinate Spaces

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCREEN COORDINATES                           │
│  (Browser viewport pixels)                                      │
│                                                                 │
│  Origin: Top-left of browser window                            │
│  Range: (0, 0) to (window.innerWidth, window.innerHeight)     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                   VIEWPORT                                │ │
│  │  Current visible area of canvas                          │ │
│  │                                                           │ │
│  │  Transform:                                               │ │
│  │  - Translation: (viewport.x, viewport.y)                 │ │
│  │  - Scale: viewport.scale                                 │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐│ │
│  │  │          CANVAS COORDINATES                         ││ │
│  │  │  (Absolute 10,000 x 10,000 space)                  ││ │
│  │  │                                                     ││ │
│  │  │  Origin: (0, 0) - Top-left of canvas               ││ │
│  │  │  Range: (0, 0) to (10000, 10000)                   ││ │
│  │  │                                                     ││ │
│  │  │  All shapes positioned in this space               ││ │
│  │  │  Grid lines calculated in this space               ││ │
│  │  │                                                     ││ │
│  │  └─────────────────────────────────────────────────────┘│ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Coordinate Transformation Functions

```typescript
// coordinateTransform.ts

/**
 * Convert screen coordinates to canvas coordinates
 */
function screenToCanvas(
  screenX: number,
  screenY: number,
  viewport: ViewportState
): { x: number; y: number } {
  return {
    x: (screenX - viewport.x) / viewport.scale,
    y: (screenY - viewport.y) / viewport.scale
  };
}

/**
 * Convert canvas coordinates to screen coordinates
 */
function canvasToScreen(
  canvasX: number,
  canvasY: number,
  viewport: ViewportState
): { x: number; y: number } {
  return {
    x: canvasX * viewport.scale + viewport.x,
    y: canvasY * viewport.scale + viewport.y
  };
}

/**
 * Calculate visible canvas bounds for viewport culling
 */
function getVisibleBounds(viewport: ViewportState): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  const topLeft = screenToCanvas(0, 0, viewport);
  const bottomRight = screenToCanvas(
    viewport.width,
    viewport.height,
    viewport
  );
  
  return {
    minX: topLeft.x,
    minY: topLeft.y,
    maxX: bottomRight.x,
    maxY: bottomRight.y
  };
}
```

---

## Performance Optimization Strategies

### Viewport Culling

```
┌─────────────────────────────────────────────────────────────────┐
│                    Canvas (10,000 x 10,000)                     │
│                                                                 │
│   ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    │
│                                                             │   │
│   │  Shapes outside viewport                                   │
│      (NOT RENDERED)                                         │   │
│   │                                                             │
│      ┌──────────────────────────────────────────┐          │   │
│   │  │         VIEWPORT                        │              │
│      │  (Visible area)                         │          │   │
│   │  │                                         │              │
│      │  Shapes inside viewport                 │          │   │
│   │  │  (RENDERED)                             │              │
│      │                                         │          │   │
│   │  │  • Shape culling based on bounds       │              │
│      │  • Grid lines culled to visible area   │          │   │
│   │  │  • Remote cursors always visible       │              │
│      │                                         │          │   │
│   │  └──────────────────────────────────────────┘              │
│                                                             │   │
│   │  Shapes outside viewport                                   │
│      (NOT RENDERED)                                         │   │
│   │                                                             │
│    ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Algorithm:
1. Calculate visible bounds from viewport state
2. Filter shapes: keep only if bounds intersect visible area
3. Render only visible shapes
4. Update on pan/zoom
```

### Render Optimization Layers

```
Konva Stage
│
├── Layer: GridBackground
│   - listening: false (non-interactive)
│   - cache: enabled (static until zoom changes)
│   - Only render visible grid lines
│
├── Layer: Shapes
│   - listening: true (interactive)
│   - cache: disabled (frequently changing)
│   - Viewport culling applied
│   - Individual shape caching for selected shapes
│
└── Layer: RemoteCursors
    - listening: false (non-interactive)
    - cache: disabled (constantly updating)
    - Always render (small count)
```

### Debouncing & Throttling Strategy

```
User Input Event → Database Choice
       ↓
┌─────────────────┐
│  Cursor Move    │ → Throttle to 50ms → REALTIME DATABASE
│  (mouse move)   │   (max 20 updates/second)
└─────────────────┘   Ultra-low latency required

┌─────────────────┐
│  Presence       │ → Interval 5000ms → REALTIME DATABASE
│  Heartbeat      │   (periodic keep-alive)
└─────────────────┘   Ephemeral data

┌─────────────────┐
│  Shape Drag     │ → Debounce to 300ms → FIRESTORE
│  (position)     │   (write after user stops moving)
└─────────────────┘   Persistent data

┌─────────────────┐
│  Property Edit  │ → Debounce to 500ms → FIRESTORE
│  (color, etc)   │   (write after user stops typing)
└─────────────────┘   Persistent data

┌─────────────────┐
│  Shape Create   │ → Immediate write → FIRESTORE
│  (new object)   │   (no debounce)
└─────────────────┘   Permanent operation
```

---

## Lock Management Architecture

### Shape Locking Flow

```
User A clicks shape
        ↓
┌─────────────────────────┐
│  Check Lock Status      │
│  (from local state)     │
└─────────────────────────┘
        ↓
    Is locked?
   /          \
  Yes         No
  ↓            ↓
Check owner   Acquire Lock
  ↓            ↓
Same user?   ┌─────────────────────────┐
  ↓          │  Firestore Transaction  │
Allow        │  Update shape:          │
  ↓          │  - lockedBy: userId     │
  │          │  - lockedAt: timestamp  │
  │          └─────────────────────────┘
  │                   ↓
  │              Success?
  │             /         \
  │           Yes         No
  │            ↓          ↓
  │      Add to       Log error
  │      selection    to console
  │            ↓
  └───────────┴──────────→ Enable editing

Different user?
  ↓
Log to console:
"Shape locked by [user]"
  ↓
Abort selection
```

### Lock Timeout Mechanism

```
Background Service (runs every 30s)

Query shapes where:
  - lockedBy != null
  - lockedAt < (now - 60 seconds)

For each stale lock:
  ↓
┌─────────────────────────┐
│  Release Lock           │
│  (Firestore update)     │
│  - lockedBy: null       │
│  - lockedAt: null       │
└─────────────────────────┘
  ↓
Real-time listener notifies all clients
  ↓
Shape becomes available for selection
```

---

## Authentication Flow

### User Authentication Sequence

```
App loads
    ↓
┌─────────────────────────┐
│  Check Auth State       │
│  (Firebase Auth)        │
└─────────────────────────┘
    ↓
  Is authenticated?
   /          \
 Yes           No
  ↓            ↓
Load user    Show AuthModal
profile          ↓
  ↓          User chooses:
  │          ┌──────────────┬──────────────┐
  │          ↓              ↓              ↓
  │     Continue as    Sign in with   (Close modal
  │     Guest          Google         = no access)
  │          ↓              ↓
  │     Anonymous      Google OAuth
  │     sign-in        flow
  │          ↓              ↓
  │     ┌────────────────────┐
  │     │  Create User       │
  │     │  Profile           │
  │     │  - Generate UUID   │
  │     │  - Assign color    │
  │     │  - Set name        │
  │     └────────────────────┘
  │              ↓
  └──────────────┴───────────→ User authenticated
                               ↓
                          ┌─────────────────────────┐
                          │  Create Presence        │
                          │  Document               │
                          │  (Firestore)            │
                          └─────────────────────────┘
                               ↓
                          Load canvas
```

---

## Error Handling Architecture

### Error Handling Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                        ERROR BOUNDARIES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  App Level Error Boundary                                       │
│  └── Catches all uncaught errors                                │
│      └── Shows error UI with reload option                      │
│                                                                  │
│  Feature Level Error Handling                                   │
│  ├── Auth errors → Show in auth modal                          │
│  ├── Firestore errors → Retry with exponential backoff         │
│  ├── Network errors → Queue operations, retry on reconnect     │
│  └── Validation errors → Show inline error messages            │
│                                                                  │
│  Logging Strategy                                               │
│  ├── Console errors: Development only                          │
│  ├── Critical errors: Log to console.error                     │
│  ├── Warnings: Log to console.warn                             │
│  └── Info: Log to console.log (removed in production)          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Network Resilience

```
Network Interruption
        ↓
┌─────────────────────────┐
│  Detect Offline         │
│  (Firebase listeners)   │
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│  Realtime DB:           │
│  - Presence auto-       │
│    removed via          │
│    onDisconnect()       │
│  - Cursor updates stop  │
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│  Firestore:             │
│  - Queue Write          │
│    Operations           │
│  - Store in memory      │
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│  Show Offline           │
│  Indicator to User      │
└─────────────────────────┘
        ↓
    Wait for reconnect
        ↓
┌─────────────────────────┐
│  Detect Online          │
│  (Firebase listeners)   │
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│  Realtime DB:           │
│  - Re-establish         │
│    presence             │
│  - Resume cursor sync   │
└─────────────────────────┘
        ↓
┌─────────────────────────┐
│  Firestore:             │
│  - Flush Queued         │
│    Operations           │
│  - Reconcile state      │
└─────────────────────────┘
        ↓
    Resume normal operation
```

---

## Future Architecture Considerations

### AI Agent Integration (Stage 4)

```
┌─────────────────────────────────────────────────────────────────┐
│                   FUTURE AI ARCHITECTURE                         │
│                   (Not implemented in MVP)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    AI Agent Layer                      │    │
│  │                                                        │    │
│  │  ┌──────────────┐      ┌──────────────┐             │    │
│  │  │   Natural    │      │   Function   │             │    │
│  │  │   Language   │ ───→ │   Calling    │             │    │
│  │  │   Input      │      │   (OpenAI)   │             │    │
│  │  └──────────────┘      └──────────────┘             │    │
│  │         ↓                      ↓                     │    │
│  │  ┌──────────────┐      ┌──────────────┐             │    │
│  │  │   Command    │      │   Canvas     │             │    │
│  │  │   Parser     │      │   API        │             │    │
│  │  └──────────────┘      └──────────────┘             │    │
│  │                               ↓                      │    │
│  │                    ┌──────────────────┐             │    │
│  │                    │  Shape Service   │             │    │
│  │                    │  (Existing CRUD) │             │    │
│  │                    └──────────────────┘             │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Canvas API Interface (to be exposed):                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  createShape(type, properties): Promise<Shape>        │    │
│  │  updateShape(shapeId, properties): Promise<Shape>     │    │
│  │  deleteShape(shapeId): Promise<void>                  │    │
│  │  getCanvasState(): Promise<CanvasState>               │    │
│  │  arrangeShapes(shapeIds, layout): Promise<void>       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Architectural Decisions for AI Support:                        │
│  • Use Command pattern for all operations (undo/redo ready)   │
│  • Keep CRUD functions pure and composable                     │
│  • Expose getters for full canvas state query                  │
│  • Maintain operation history for AI learning                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Scalability Considerations

```
Current Architecture (MVP)
├── Single document ("main")
├── All users in same canvas
└── Direct Firestore real-time listeners

Future Scalability Path
├── Multiple documents (user-created projects)
├── Document-level permissions
├── WebSocket server for high-frequency updates (cursors)
├── Firestore for persistent data only
├── Redis cache for hot data
└── Horizontal scaling with load balancing
```

---

## Performance Targets & Monitoring

### Performance Metrics

```
┌─────────────────────────────────────────────────────────────────┐
│                     PERFORMANCE TARGETS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Rendering Performance                                          │
│  ├── Frame Rate: 60 FPS (16.67ms per frame)                    │
│  ├── Pan/Zoom: No dropped frames                               │
│  └── Shape Transform: Smooth at 60 FPS                         │
│                                                                  │
│  Synchronization Latency                                        │
│  ├── Cursor sync (Realtime DB): <50ms ⚡                       │
│  ├── Presence updates (Realtime DB): <100ms                    │
│  ├── Object sync (Firestore): <300ms                           │
│  └── Shape properties (Firestore): <500ms (debounced)          │
│                                                                  │
│  Database Performance                                           │
│  ├── Realtime DB reads: ~1200/minute (20/sec * 60)            │
│  │   (cursor updates for 5 users)                              │
│  ├── Realtime DB writes: ~600/minute (10/sec * 60)            │
│  │   (cursor + heartbeat)                                      │
│  ├── Firestore reads: <100/minute per user                     │
│  └── Firestore writes: <50/minute per user                     │
│                                                                  │
│  Scalability                                                    │
│  ├── Max shapes: 500+ without FPS drop                         │
│  ├── Max concurrent users: 5+ without degradation              │
│  └── Initial load time: <3 seconds                             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Monitoring Points

```typescript
// performanceMonitor.ts

interface PerformanceMetrics {
  fps: number;
  lastFrameTime: number;
  shapeCount: number;
  visibleShapeCount: number;
  firestoreReads: number;
  firestoreWrites: number;
  syncLatency: number;
}

// Monitor in development mode
if (import.meta.env.DEV) {
  // Track FPS
  // Track Firestore operations
  // Track sync latency
  // Log warnings if thresholds exceeded
}
```

---

## Technology Stack Details

### Core Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "konva": "^9.2.0",
    "react-konva": "^18.2.0",
    "firebase": "^10.7.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "eslint-plugin-react": "^7.33.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "typescript": "^5.2.0",
    "vite": "^5.0.0"
  }
}
```

### Firebase Services Used

```typescript
// src/api/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database'; // Realtime Database
import { getAuth } from 'firebase/auth';

const app = initializeApp(firebaseConfig);

export const firestore = getFirestore(app);  // Persistent data
export const database = getDatabase(app);     // Real-time sync
export const auth = getAuth(app);             // Authentication
```

### Build Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@features': '/src/features',
      '@hooks': '/src/hooks',
      '@utils': '/src/utils',
      '@types': '/src/types'
    }
  },
  build: {
    target: 'esnext',
    sourcemap: true
  }
});
```

---

## Security Considerations

### Firestore Security Rules (Development)

```javascript
// firestore.rules (DEVELOPMENT ONLY - Open for testing)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all reads and writes during development
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Realtime Database Security Rules (Development)

```json
// database.rules.json (DEVELOPMENT ONLY - Open for testing)
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### Future Production Rules

**Firestore:**
```javascript
// firestore.rules (PRODUCTION - Example for future)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Document access
    match /documents/{docId} {
      // Anyone authenticated can read
      allow read: if request.auth != null;
      
      // Shapes - authenticated users can create/modify
      match /shapes/{shapeId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow update: if request.auth != null 
                      && (resource.data.lockedBy == null 
                          || resource.data.lockedBy == request.auth.uid);
        allow delete: if request.auth != null;
      }
    }
  }
}
```

**Realtime Database:**
```json
// database.rules.json (PRODUCTION - Example for future)
{
  "rules": {
    "presence": {
      "main": {
        "$userId": {
          ".read": "auth != null",
          ".write": "auth != null && auth.uid == $userId",
          ".validate": "newData.hasChildren(['userId', 'displayName', 'color', 'cursorX', 'cursorY', 'connectedAt', 'lastUpdate'])"
        }
      }
    }
  }
}
```

---

## Deployment Architecture

### Firebase Hosting Structure

```
Firebase Project
├── Hosting
│   ├── Domain: [project-id].web.app
│   ├── Static files: /dist/*
│   └── SPA rewrite: /* → /index.html
│
├── Firestore (Persistent Data)
│   ├── Database: (default)
│   ├── Indexes: Auto-generated
│   └── Rules: firestore.rules
│
├── Realtime Database (Real-time Sync)
│   ├── Database: (default-rtdb)
│   ├── Indexes: Defined in rules
│   └── Rules: database.rules.json
│
└── Authentication
    ├── Providers: Anonymous, Google
    ├── Domain: [project-id].firebaseapp.com
    └── OAuth redirect: Auto-configured
```

### Deployment Flow

```
Local Development
      ↓
┌─────────────────────────┐
│  npm run build          │
│  (Vite build)           │
└─────────────────────────┘
      ↓
┌─────────────────────────┐
│  dist/ folder           │
│  created with           │
│  optimized assets       │
└─────────────────────────┘
      ↓
┌─────────────────────────┐
│  firebase deploy        │
│  (deploys all services) │
└─────────────────────────┘
      ↓                    ↓                    ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Hosting    │  │  Firestore   │  │  Realtime DB │
│   (static)   │  │   (rules)    │  │   (rules)    │
└──────────────┘  └──────────────┘  └──────────────┘
      ↓
    Production URL
```
## Deployment Commands

```bash
# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Realtime Database rules
firebase deploy --only database

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

---

## API Service Layer Architecture

### Service Organization

```
src/
├── features/
│   ├── auth/
│   │   └── services/
│   │       └── authService.ts          # Firestore user profiles
│   │
│   ├── presence/
│   │   └── services/
│   │       └── presenceService.ts      # Realtime DB presence
│   │
│   └── shapes/
│       └── services/
│           └── shapeService.ts         # Firestore shapes CRUD
```

### Service Responsibilities

**authService.ts** (Firestore):
```typescript
// User profile management in Firestore
- createUserProfile(user): Promise<void>
- getUserProfile(userId): Promise<User>
- updateUserProfile(userId, updates): Promise<void>
```

**presenceService.ts** (Realtime Database):
```typescript
// Real-time presence in Realtime DB
- createPresence(user): Promise<void>
- updatePresence(userId, updates): Promise<void>
- updateCursor(userId, x, y): Promise<void>
- removePresence(userId): Promise<void>
- onPresenceChange(callback): () => void  // Listener
```

**shapeService.ts** (Firestore):
```typescript
// Shape CRUD operations in Firestore
- createShape(shape): Promise<Shape>
- updateShape(shapeId, updates): Promise<Shape>
- deleteShape(shapeId): Promise<void>
- lockShape(shapeId, userId): Promise<boolean>
- unlockShape(shapeId): Promise<void>
- onShapesChange(callback): () => void  // Listener
```

---

## Code Examples for Database Usage

### Realtime Database - Cursor Update

```typescript
// features/presence/services/presenceService.ts
import { ref, update, onDisconnect } from 'firebase/database';
import { database } from '@/api/firebase';

export const presenceService = {
  // Update cursor position (throttled to 50ms)
  updateCursor: async (userId: string, x: number, y: number) => {
    const presenceRef = ref(database, `/presence/main/${userId}`);
    await update(presenceRef, {
      cursorX: x,
      cursorY: y,
      lastUpdate: Date.now()
    });
  },
  
  // Setup presence with disconnect cleanup
  createPresence: async (user: User) => {
    const presenceRef = ref(database, `/presence/main/${user.userId}`);
    
    // Set presence data
    await update(presenceRef, {
      userId: user.userId,
      displayName: user.displayName,
      color: user.color,
      cursorX: 0,
      cursorY: 0,
      connectedAt: Date.now(),
      lastUpdate: Date.now()
    });
    
    // Setup auto-cleanup on disconnect
    onDisconnect(presenceRef).remove();
  },
  
  // Listen to all presence changes
  onPresenceChange: (callback: (users: Map<string, UserPresence>) => void) => {
    const presenceRef = ref(database, '/presence/main');
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const users = new Map<string, UserPresence>();
      const data = snapshot.val();
      
      if (data) {
        Object.entries(data).forEach(([userId, presence]) => {
          // Filter out stale presence (>30s old)
          const now = Date.now();
          if (now - presence.lastUpdate < 30000) {
            users.set(userId, presence as UserPresence);
          }
        });
      }
      
      callback(users);
    });
    
    return unsubscribe;
  }
};
```

### Firestore - Shape Operations

```typescript
// features/shapes/services/shapeService.ts
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  runTransaction 
} from 'firebase/firestore';
import { firestore } from '@/api/firebase';

export const shapeService = {
  // Create shape (persistent)
  createShape: async (shape: Shape): Promise<Shape> => {
    const shapeRef = doc(collection(firestore, 'documents/main/shapes'));
    await setDoc(shapeRef, {
      ...shape,
      id: shapeRef.id,
      createdAt: serverTimestamp(),
      lastModifiedAt: serverTimestamp()
    });
    return { ...shape, id: shapeRef.id };
  },
  
  // Update shape (debounced from drag)
  updateShape: async (shapeId: string, updates: Partial<Shape>) => {
    const shapeRef = doc(firestore, `documents/main/shapes/${shapeId}`);
    await updateDoc(shapeRef, {
      ...updates,
      lastModifiedAt: serverTimestamp()
    });
  },
  
  // Lock shape (uses transaction for atomicity)
  lockShape: async (shapeId: string, userId: string): Promise<boolean> => {
    const shapeRef = doc(firestore, `documents/main/shapes/${shapeId}`);
    
    try {
      const success = await runTransaction(firestore, async (transaction) => {
        const shapeDoc = await transaction.get(shapeRef);
        
        if (!shapeDoc.exists()) {
          return false;
        }
        
        const shape = shapeDoc.data();
        
        // Check if already locked by another user
        if (shape.lockedBy && shape.lockedBy !== userId) {
          return false;
        }
        
        // Acquire lock
        transaction.update(shapeRef, {
          lockedBy: userId,
          lockedAt: serverTimestamp()
        });
        
        return true;
      });
      
      return success;
    } catch (error) {
      console.error('Lock acquisition failed:', error);
      return false;
    }
  },
  
  // Listen to shape changes
  onShapesChange: (callback: (shapes: Shape[]) => void) => {
    const shapesRef = collection(firestore, 'documents/main/shapes');
    
    const unsubscribe = onSnapshot(shapesRef, (snapshot) => {
      const shapes: Shape[] = [];
      snapshot.forEach((doc) => {
        shapes.push(doc.data() as Shape);
      });
      callback(shapes);
    });
    
    return unsubscribe;
  }
};
```

---

## Performance Monitoring Implementation

```typescript
// utils/performanceMonitor.ts

interface PerformanceMetrics {
  // Rendering
  fps: number;
  lastFrameTime: number;
  
  // Object counts
  shapeCount: number;
  visibleShapeCount: number;
  
  // Database operations
  realtimeDbReads: number;
  realtimeDbWrites: number;
  firestoreReads: number;
  firestoreWrites: number;
  
  // Latency tracking
  cursorLatency: number;  // Realtime DB
  shapeLatency: number;   // Firestore
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private frameCount = 0;
  private lastFpsUpdate = Date.now();
  
  constructor() {
    this.metrics = {
      fps: 60,
      lastFrameTime: 0,
      shapeCount: 0,
      visibleShapeCount: 0,
      realtimeDbReads: 0,
      realtimeDbWrites: 0,
      firestoreReads: 0,
      firestoreWrites: 0,
      cursorLatency: 0,
      shapeLatency: 0
    };
  }
  
  // Track frame rate
  recordFrame() {
    this.frameCount++;
    const now = Date.now();
    
    if (now - this.lastFpsUpdate >= 1000) {
      this.metrics.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      
      if (this.metrics.fps < 55 && import.meta.env.DEV) {
        console.warn(`Low FPS detected: ${this.metrics.fps}`);
      }
    }
  }
  
  // Track database operations
  recordRealtimeDbRead() {
    this.metrics.realtimeDbReads++;
  }
  
  recordRealtimeDbWrite() {
    this.metrics.realtimeDbWrites++;
  }
  
  recordFirestoreRead() {
    this.metrics.firestoreReads++;
  }
  
  recordFirestoreWrite() {
    this.metrics.firestoreWrites++;
  }
  
  // Track latency
  recordCursorLatency(latency: number) {
    this.metrics.cursorLatency = latency;
    
    if (latency > 50 && import.meta.env.DEV) {
      console.warn(`High cursor latency: ${latency}ms`);
    }
  }
  
  recordShapeLatency(latency: number) {
    this.metrics.shapeLatency = latency;
    
    if (latency > 300 && import.meta.env.DEV) {
      console.warn(`High shape latency: ${latency}ms`);
    }
  }
  
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  // Log summary (development only)
  logSummary() {
    if (!import.meta.env.DEV) return;
    
    console.table({
      'FPS': this.metrics.fps,
      'Shapes (total)': this.metrics.shapeCount,
      'Shapes (visible)': this.metrics.visibleShapeCount,
      'Cursor Latency (ms)': this.metrics.cursorLatency,
      'Shape Latency (ms)': this.metrics.shapeLatency,
      'Realtime DB Reads': this.metrics.realtimeDbReads,
      'Realtime DB Writes': this.metrics.realtimeDbWrites,
      'Firestore Reads': this.metrics.firestoreReads,
      'Firestore Writes': this.metrics.firestoreWrites
    });
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Usage in components:
// import { performanceMonitor } from '@/utils/performanceMonitor';
// performanceMonitor.recordFrame();
// performanceMonitor.recordCursorLatency(latency);
```

---

## Database Selection Quick Reference

```
┌─────────────────────────────────────────────────────────────────┐
│                    WHEN TO USE WHAT                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  USE REALTIME DATABASE WHEN:                                    │
│  ✅ Data updates multiple times per second                      │
│  ✅ Ultra-low latency required (<50ms)                          │
│  ✅ Data is ephemeral (OK to lose on disconnect)               │
│  ✅ Simple key-value structure is sufficient                    │
│  ✅ Real-time synchronization is critical                       │
│                                                                  │
│  Examples: Cursor positions, presence heartbeat                 │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  USE FIRESTORE WHEN:                                            │
│  ✅ Data must persist permanently                               │
│  ✅ Need complex queries and indexing                           │
│  ✅ Need ACID transactions                                      │
│  ✅ Structured documents with relationships                     │
│  ✅ Update frequency is low (<1/second)                         │
│                                                                  │
│  Examples: Shapes, user profiles, locks                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## End of Architecture Diagram

This architecture document now includes **both Firebase Realtime Database and Firestore**, optimized for their respective strengths:
- **Realtime Database**: High-frequency, low-latency operations (cursors, presence)
- **Firestore**: Persistent, structured data with complex queries (shapes, profiles)

All components, data flows, and architectural decisions reflect this dual-database approach for optimal performance.

**Quick Reference:**
- For requirements: See `_docs/PRD.md`
- For implementation steps: See `_docs/TASK_LIST.md`
- For React patterns: See `_docs/react-architecture-guide.md` (if available)

---

## End of Architecture Diagram

This architecture document provides a comprehensive system design for CollabCanvas, optimized for AI agent implementation. All components, data flows, and architectural decisions are documented to guide development.