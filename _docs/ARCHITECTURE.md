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
        ├── shapes/                  # Shape display objects
        │   └── {shapeId}/           # Document per shape
        │       ├── id: string
        │       ├── category: 'shape'
        │       ├── type: 'rectangle' | 'circle' | 'line'
        │       ├── x: number
        │       ├── y: number
        │       ├── rotation: number (degrees)
        │       ├── scaleX: number (scale factor, 1.0 = 100%)
        │       ├── scaleY: number (scale factor, 1.0 = 100%)
        │       ├── width: number (optional)
        │       ├── height: number (optional)
        │       ├── radius: number (optional)
        │       ├── points: number[] (optional)
        │       ├── fillColor: string
        │       ├── strokeColor: string
        │       ├── strokeWidth: number
        │       ├── opacity: number
        │       ├── borderRadius: number (optional)
        │       ├── zIndex: number
        │       ├── createdBy: string
        │       ├── createdAt: Timestamp
        │       ├── lastModifiedBy: string
        │       └── lastModifiedAt: Timestamp
        │
        ├── texts/                   # Text display objects (Stage 4)
        │   └── {textId}/
        │       ├── id: string
        │       ├── category: 'text'
        │       ├── content: string
        │       ├── x, y, rotation, scaleX, scaleY, opacity, zIndex
        │       ├── font, fontSize, fontWeight, textAlign, lineHeight
        │       ├── color: string
        │       ├── width, height: number
        │       └── (metadata and locking fields)
        │
        └── images/                  # Image display objects (Future)
            └── {imageId}/
                ├── id: string
                ├── category: 'image'
                ├── x, y, rotation, scaleX, scaleY, opacity, zIndex
                ├── imageUrl: string
                ├── width, height: number
                └── (metadata and locking fields)
```

### Realtime Database Structure (Real-time Sync)

```
realtime-database/
├── presence/
│   └── main/                        # Document ID
│       └── {userId}/
│           └── {tabId}/             # Per-tab presence
│               ├── userId: string
│               ├── displayName: string
│               ├── color: string
│               ├── cursorX: number      # Canvas coordinates
│               ├── cursorY: number      # Canvas coordinates
│               ├── connectedAt: number  # Unix timestamp (ms)
│               └── lastUpdate: number   # Unix timestamp (ms)
│
└── locks/                           # Object locking (collaborative editing)
    └── main/                        # Document ID
        └── {objectId}/              # Lock per object
            ├── userId: string       # User who owns the lock
            ├── lockedAt: number     # Unix timestamp (ms)
            └── userName: string     # Optional display name for debugging
```

### Data Storage Strategy

**Firestore** (Persistent, queryable data):
- ✅ User profiles
- ✅ Display objects (shapes, texts, images) - all properties
- ✅ Document metadata
- **Why**: Need complex queries, indexing, transactions
- **Update frequency**: Low (on create, modify, delete)

**Realtime Database** (High-frequency, ephemeral data):
- ✅ User presence (who's online)
- ✅ Cursor positions (x, y coordinates)
- ✅ Connection status (heartbeat)
- ✅ Object locks (collaborative editing)
- **Why**: Ultra-low latency (<50ms), high-frequency updates, automatic cleanup with onDisconnect
- **Update frequency**: Very high (every 50ms for cursors, every 5s for heartbeat)

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
│  │  │  Display     │  │     UI       │                      │ │
│  │  │  Objects     │  │  Components  │                      │ │
│  │  │  Feature     │  │              │                      │ │
│  │  └──────────────┘  └──────────────┘                      │ │
│  │                                                            │ │
│  │  ┌───────────────────────────────────────────────────┐   │ │
│  │  │              Konva.js Canvas Layer                │   │ │
│  │  │  (Rendering: Grid, Objects, Cursors, Transforms) │   │ │
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
│  │  Objects &   │  │  Presence &  │  │  OAuth       │        │
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
│   ├── canvas/                    # Canvas viewport management
│   │   ├── components/            # Canvas, GridBackground
│   │   ├── hooks/                 # useCanvasSize, usePan, useZoom
│   │   ├── store/                 # viewportStore (Context + useReducer)
│   │   └── utils/                 # coordinateTransform, gridUtils
│   │
│   ├── auth/                      # User authentication
│   │   ├── components/            # AuthModal
│   │   ├── hooks/                 # useAuth
│   │   ├── services/              # authService (Firebase Auth)
│   │   └── store/                 # authStore (Context + useReducer)
│   │
│   ├── presence/                  # Real-time user presence
│   │   ├── components/            # UserPresenceSidebar, RemoteCursors
│   │   ├── hooks/                 # usePresence, useActiveUsers, useCursorTracking
│   │   ├── services/              # presenceService (Realtime Database)
│   │   └── store/                 # presenceStore (Context + useReducer)
│   │
│   └── displayObjects/            # Display objects domain
│       ├── common/                # Shared across all object types
│       │   ├── components/
│       │   │   ├── DisplayObjectToolbar.tsx  # Tool selection UI
│       │   │   ├── CollectionBoundingBox.tsx
│       │   │   ├── ObjectHighlight.tsx (OBB)
│       │   │   ├── TransformModal.tsx
│       │   │   ├── RotationKnob.tsx
│       │   │   └── ScaleKnob.tsx
│       │   ├── hooks/
│       │   │   ├── useTool.ts               # Tool state access
│       │   │   ├── useSelection.ts
│       │   │   ├── useMultiSelection.ts
│       │   │   ├── useTransform.ts
│       │   │   ├── useTranslation.ts
│       │   │   ├── useRotation.ts
│       │   │   ├── useScaling.ts
│       │   │   └── useBoundingBox.ts
│       │   ├── services/
│       │   │   ├── selectionService.ts
│       │   │   ├── transformService.ts
│       │   │   └── lockService.ts
│       │   ├── store/
│       │   │   ├── toolStore.tsx            # Tool state management
│       │   │   ├── selectionStore.tsx
│       │   │   └── transformStore.tsx
│       │   ├── utils/
│       │   │   ├── boundingBoxUtils.ts
│       │   │   ├── geometryUtils.ts
│       │   │   └── transformMath.ts
│       │   └── types.ts
│       │
│       ├── shapes/                # Shape-specific
│       │   ├── components/
│       │   │   ├── ShapeRenderer.tsx
│       │   │   ├── Rectangle.tsx
│       │   │   ├── Circle.tsx
│       │   │   ├── Line.tsx
│       │   │   └── ShapePropertiesPanel.tsx (Stage 4)
│       │   ├── hooks/
│       │   │   ├── useShapes.ts
│       │   │   └── useShapeCreation.ts
│       │   ├── services/
│       │   │   └── shapeService.ts
│       │   ├── store/
│       │   │   └── shapesStore.ts
│       │   └── types.ts
│       │
│       ├── texts/                 # Text-specific (Stage 4)
│       │   ├── components/
│       │   │   ├── TextRenderer.tsx
│       │   │   ├── TextObject.tsx
│       │   │   └── TextPropertiesPanel.tsx
│       │   ├── hooks/
│       │   │   ├── useTexts.ts
│       │   │   └── useTextCreation.ts
│       │   ├── services/
│       │   │   └── textService.ts
│       │   ├── store/
│       │   │   └── textsStore.ts
│       │   └── types.ts
│       │
│       └── images/                # Image-specific (Future)
│           ├── components/
│           ├── hooks/
│           ├── services/
│           └── types.ts
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
├── types/               # Shared domain types
│   ├── firebase.ts      # User, UserPresence, DisplayObject types
│   └── canvas.ts        # CanvasConfig, Point, CanvasBounds, ZoomConstraints
│
├── utils/               # Utility functions
│   ├── debounce.ts
│   ├── throttle.ts
│   └── performanceMonitor.ts
│
└── App.tsx              # Root component with providers
```

---

## Tool System Architecture

### Overview

The tool system controls user interaction modes with the canvas. Only one tool can be active at a time, and the active tool determines how canvas clicks and interactions behave.

### Tool Types

```
'select'    → Default tool, enables selection and transforms
'rectangle' → Creates rectangle shapes on canvas click
'circle'    → Creates circle shapes on canvas click  
'line'      → Creates line shapes on canvas click
'text'      → Creates text objects on canvas click (Stage 4)
```

### Tool State Management

```typescript
// displayObjects/common/store/toolStore.tsx
interface ToolState {
  currentTool: 'select' | 'rectangle' | 'circle' | 'line' | 'text';
}

type ToolAction = 
  | { type: 'SET_TOOL'; payload: ToolState['currentTool'] };

function toolReducer(state: ToolState, action: ToolAction): ToolState {
  switch (action.type) {
    case 'SET_TOOL':
      return { ...state, currentTool: action.payload };
    default:
      return state;
  }
}
```

### Tool Behavior Matrix

```
┌──────────────┬─────────────────────┬──────────────────────────────┐
│ Tool         │ Canvas Click        │ Object Interaction           │
├──────────────┼─────────────────────┼──────────────────────────────┤
│ 'select'     │ Deselect all        │ - Single click: Select       │
│              │ (or start marquee)  │ - Shift+click: Multi-select  │
│              │                     │ - Drag: Translate            │
│              │                     │ - Knobs: Rotate/Scale        │
├──────────────┼─────────────────────┼──────────────────────────────┤
│ 'rectangle'  │ Create rectangle    │ No interaction               │
│              │ → Auto-revert       │ (tool ≠ 'select')            │
├──────────────┼─────────────────────┼──────────────────────────────┤
│ 'circle'     │ Create circle       │ No interaction               │
│              │ → Auto-revert       │ (tool ≠ 'select')            │
├──────────────┼─────────────────────┼──────────────────────────────┤
│ 'line'       │ Create line         │ No interaction               │
│              │ → Auto-revert       │ (tool ≠ 'select')            │
├──────────────┼─────────────────────┼──────────────────────────────┤
│ 'text'       │ Create text box     │ No interaction               │
│ (Stage 4)    │ → Auto-revert       │ (tool ≠ 'select')            │
└──────────────┴─────────────────────┴──────────────────────────────┘
```

### Tool Lifecycle

```
User clicks tool button
  ↓
Tool state updates (currentTool = clicked tool)
  ↓
Canvas behavior changes based on new tool
  ↓
[If creation tool selected]
  ↓
User clicks canvas
  ↓
Display object created at click position
  ↓
Tool auto-reverts to 'select'
  ↓
Object can now be selected and transformed
```

### Tool Integration Points

**With Selection System:**
```typescript
// Selection only works when tool === 'select'
function handleObjectClick(objectId: string) {
  const { currentTool } = useTool();
  if (currentTool !== 'select') return; // Ignore clicks when not in select mode
  
  // Proceed with selection logic...
}
```

**With Transform System:**
```typescript
// Transforms only work when tool === 'select'
function handleObjectDrag(objectId: string) {
  const { currentTool } = useTool();
  if (currentTool !== 'select') return; // Ignore drags when not in select mode
  
  // Proceed with translation logic...
}
```

**With Creation System:**
```typescript
// Creation only works when tool is a creation tool
function handleCanvasClick(position: Point) {
  const { currentTool, setTool } = useTool();
  
  switch (currentTool) {
    case 'rectangle':
      createRectangle(position);
      setTool('select'); // Auto-revert
      break;
    case 'circle':
      createCircle(position);
      setTool('select'); // Auto-revert
      break;
    // ... other creation tools
    case 'select':
      // Handle deselection or marquee start
      break;
  }
}
```

**With Locking System:**
```typescript
// Locks release when tool changes from 'select'
useEffect(() => {
  if (currentTool !== 'select' && hasSelection) {
    releaseAllLocks();
    clearSelection();
  }
}, [currentTool]);
```

### Display Object Toolbar Component

```
┌────────────────────────────────────────────────────────────────┐
│  [🖱️ Select]  [▭ Rectangle]  [○ Circle]  [/ Line]  [T Text]  │
│     ^^^^^^                                                      │
│   (highlighted when selected)                                  │
└────────────────────────────────────────────────────────────────┘

Position: Fixed at top of canvas area
Background: rgba(30, 30, 30, 0.95)
Button Size: 44px × 44px
Spacing: 8px between buttons, 8px padding
Selected State: Blue background (#4A90E2)
```

---

## Display Objects Architecture

### Overview

Display objects are the core visual elements on the canvas. The system supports three categories:
- **Shapes**: Rectangle, Circle, Line (Stage 3)
- **Text**: Text boxes with formatting (Stage 4)
- **Images**: Raster images (Future)

### Type Hierarchy

```
DisplayObject (abstract base)
├── Shape (category)
│   ├── Rectangle (type)
│   ├── Circle (type)
│   └── Line (type)
├── Text (category - Stage 4)
└── Image (category - Future)
```

**Implementation Pattern:**
- `category`: Top-level classification ('shape' | 'text' | 'image')
- `type`: Specific subtype (e.g., 'rectangle', 'circle', 'line' for shapes)
- Separate Firestore collections per category for clean queries

### Display Object Base Properties

```typescript
interface BaseDisplayObject {
  id: string;
  category: 'shape' | 'text' | 'image';
  
  // Position (canvas coordinates)
  x: number;               // Center X
  y: number;               // Center Y
  
  // Transform
  rotation: number;        // Degrees, relative to object center
  scaleX: number;          // Scale factor (1.0 = 100%)
  scaleY: number;          // Scale factor (1.0 = 100%)
  zIndex: number;          // Layer order
  
  // Visual properties (universal)
  opacity: number;         // 0-1
  
  // Metadata
  createdBy: string;       // User ID
  createdAt: Timestamp;
  lastModifiedBy: string;
  lastModifiedAt: Timestamp;
  
  // Locking
  lockedBy: string | null;
  lockedAt: Timestamp | null;
}
```

### Shape-Specific Properties

```typescript
interface ShapeDisplayObject extends BaseDisplayObject {
  category: 'shape';
  type: 'rectangle' | 'circle' | 'line';
  
  // Dimensions (type-specific)
  width?: number;          // Rectangle
  height?: number;         // Rectangle
  radius?: number;         // Circle
  points?: number[];       // Line: [x1, y1, x2, y2] relative to (x, y)
  
  // Visual properties (shape-specific)
  fillColor: string;       // Hex color
  strokeColor: string;     // Hex color
  strokeWidth: number;     // 1-10px
  borderRadius?: number;   // Rectangle only, 0-50px
}
```

---

## Selection System Architecture

### Selection Modes

The system supports two selection levels:
1. **Display-Level Selection** (Stage 3): Select one or more display objects as a collection
2. **Object-Specific Selection** (Stage 4): Edit individual object properties

### Tool-Aware Selection

**Critical Constraint**: Selection only works when `currentTool === 'select'`

```
IF currentTool === 'select':
  Single Click → Select object (display-level)
  Shift + Click → Add/remove from collection
  Marquee Drag → Select multiple objects
  
ELSE (currentTool is creation tool):
  All selection interactions disabled
  Objects cannot be selected or interacted with
```

### Display-Level Selection (Stage 3)

#### Selection State

```typescript
interface SelectionState {
  // Selected collection
  selectedIds: string[];                    // Array of display object IDs
  
  // Collection geometry
  collectionBounds: AxisAlignedBoundingBox; // AABB for entire collection
  collectionCenter: Point;                   // Geometric center
  
  // Transform state
  isTransforming: boolean;
  transformMode: 'translate' | 'rotate' | 'scale' | null;
  
  // Lock tracking
  lockedIds: string[];                      // Objects locked by current user
}

interface AxisAlignedBoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

interface OrientedBoundingBox {
  center: Point;
  width: number;
  height: number;
  rotation: number;  // Degrees
  corners: Point[];  // 4 corner points
}
```

---

## Transform System Architecture

### Transform Types

All transforms operate relative to the **collection centerpoint** (geometric center of collection AABB).

**Critical Constraint**: Transforms only work when `currentTool === 'select'`

#### 1. Translation (Drag)

```
User Action: Click and drag any object in collection (when tool === 'select')
Result: All objects translate together, maintaining relative positions
Constraint: Collection cannot move beyond canvas boundaries (0,0 to 10000,10000)
Update: Optimistic local update, debounced Firestore write (300ms)
Availability: Only when currentTool === 'select'
```

#### 2. Rotation (Knob)

```
User Action: Click and drag rotation knob (when tool === 'select')
Knob Behavior: 
  - Circular button that spins in place (like volume knob)
  - 1px drag = 1° rotation
  - Drag up/left = counter-clockwise
  - Drag down/right = clockwise
Result: All objects rotate around collection center
  - Object positions rotate around center
  - Each object's rotation property increases/decreases
Update: Real-time local update, debounced Firestore write (300ms)
Availability: Only when currentTool === 'select'
```

#### 3. Scale (Knob)

```
User Action: Click and drag scale knob (when tool === 'select')
Knob Behavior:
  - Circular button that spins in place
  - 1px drag = 0.01 scale delta
  - Clockwise = increase scale
  - Counter-clockwise = decrease scale
Result: All objects scale around collection center
  - Object positions scale from center
  - Each object's scaleX/scaleY multiply by (1 + delta)
Constraints: 
  - Minimum scale: 0.1 (10%)
  - Maximum scale: 10.0 (1000%)
Update: Real-time local update, debounced Firestore write (300ms)
Availability: Only when currentTool === 'select'
```

### Transform Modal Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CANVAS LAYER                               │
│                                                                 │
│   ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐                 │
│    Collection Bounding Box (AABB - dashed)                      │
│   │                                          │                 │
│      ╔═══════════╗         ┌───────────┐                       │
│   │  ║ Object 1  ║         │ Object 2  │   │                 │
│      ║   OBB     ║         │   OBB     │                       │
│   │  ║  (solid)  ║         │  (solid)  │   │                 │
│      ╚═══════════╝         └───────────┘                       │
│   │                                          │                 │
│              ● ← Collection Center                             │
│   │          │                               │                 │
│         [Transform Modal]                                      │
│   │    ┌─────────────┐                      │                 │
│        │   ⟳    ⊕   │                                         │
│   │    │ Rotate Scale│                      │                 │
│        └─────────────┘                                         │
│   └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘                 │
│                                                                 │
│   Visibility: Only when currentTool === 'select' AND selected  │
└─────────────────────────────────────────────────────────────────┘
```

#### Modal Behavior

- **Position**: Fixed at collection centerpoint in canvas coordinates
- **Persistence**: Visible when collection is selected AND tool === 'select'
- **Pan/Zoom**: Modal position transforms with canvas (stays at centerpoint in canvas coords)
- **During Transform**: Modal remains at centerpoint even as objects transform
- **Dismissal**: Hidden when user deselects collection OR changes tool

---

## Bounding Box System Architecture

### Hybrid Bounding Box Strategy

```
Collection Bounding Box: AABB (Axis-Aligned Bounding Box)
  - Always aligned with canvas X/Y axes
  - Recalculates as objects transform
  - Used for: modal positioning, collection operations
  - Visual: Dashed outline around entire collection
  - Visibility: Only when currentTool === 'select' AND objects selected

Individual Object Highlight: OBB (Oriented Bounding Box)
  - Rotates with object
  - Maintains object's actual oriented shape
  - Used for: visual feedback, precise selection indication
  - Visual: Solid outline around each object
  - Visibility: Only when currentTool === 'select' AND objects selected
```

---

## Collection-Level Locking

### Lock Acquisition Strategy

```
User selects object(s) → Attempt to lock ALL objects in collection
  - If ANY object is locked by another user → Abort selection, log to console
  - If ALL objects available → Lock all, proceed with selection
  
User deselects → Release ALL locks for current user
User changes tool to non-'select' → Release ALL locks for current user

Timeout → Automatically release locks after 60 seconds of inactivity
```

### Lock Rules

1. **Atomic Lock Acquisition**: All objects must lock successfully, or none lock
2. **Conflict Handling**: If any object is locked by another user:
   - Log: `"Cannot select: Object [id] is locked by [displayName]"`
   - Abort selection entirely
   - Do not partial-select available objects
3. **Lock Release**: On deselection, timeout, sign-out, OR tool change to non-'select'
4. **Lock Heartbeat**: Update `lockedAt` timestamp every 5s while selected
5. **Stale Lock Cleanup**: Background service releases locks >60s old

---

## Transform Mathematics

### Rotation Around Collection Center

```typescript
function rotatePoint(point: Point, angleDegrees: number, center: Point): Point {
  const angleRad = (angleDegrees * Math.PI) / 180;
  const translatedX = point.x - center.x;
  const translatedY = point.y - center.y;
  const rotatedX = translatedX * Math.cos(angleRad) - translatedY * Math.sin(angleRad);
  const rotatedY = translatedX * Math.sin(angleRad) + translatedY * Math.cos(angleRad);
  return { x: rotatedX + center.x, y: rotatedY + center.y };
}
```

### Scaling Around Collection Center

```typescript
function scalePoint(point: Point, center: Point, scaleDelta: number): Point {
  const translatedX = point.x - center.x;
  const translatedY = point.y - center.y;
  const scaleFactor = 1 + scaleDelta;
  const scaledX = translatedX * scaleFactor;
  const scaledY = translatedY * scaleFactor;
  return { x: scaledX + center.x, y: scaledY + center.y };
}
```

---

## Performance Optimization Strategies

### Viewport Culling

```
Algorithm:
1. Calculate visible bounds from viewport state
2. For each display object:
   - Calculate object AABB
   - Check intersection with visible bounds
   - Render only if intersecting
3. Always render selected objects and their UI (even if partially out of view)
4. Update culling on pan/zoom
```

### Debouncing & Throttling Strategy

```
User Input Event → Update Strategy

Cursor Move    → Throttle to 50ms → REALTIME DATABASE
Presence Heartbeat → Interval 5000ms → REALTIME DATABASE
Object Drag    → Optimistic local + Debounce 300ms → FIRESTORE
Rotation Knob  → Optimistic local + Debounce 300ms → FIRESTORE
Scale Knob     → Optimistic local + Debounce 300ms → FIRESTORE
Object Create  → Immediate write → FIRESTORE
Lock Heartbeat → Interval 5000ms → FIRESTORE
Tool Change    → Immediate local state update → LOCAL ONLY
```

---

## End of Architecture Document

This architecture document provides comprehensive system design for CollabCanvas display objects with:
- Tool system (select and creation tools)
- Display object type hierarchy (Shape/Text/Image)
- Selection system (collection and individual, tool-aware)
- Transform system (translate, rotate, scale with knobs, tool-aware)
- Bounding box system (hybrid AABB/OBB)
- Collection-level locking (with tool change handling)
- Updated Firebase schema
- Updated module structure

**Quick Reference:**
- For requirements: See `_docs/PRD.md`
- For implementation steps: See `_docs/TASK_LIST.md`
