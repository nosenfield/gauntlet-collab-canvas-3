# Stage 3: Display Objects (Universal Editing System) - Composite Summary
**Date Created:** 2025-10-18  
**Status:** ✅ Mostly Complete (14+ tasks implemented)  
**Performance:** 60 FPS maintained, <300ms sync

---

## Overview

Built a comprehensive display objects system with shape creation, multi-selection, collection transforms (drag, rotate, scale), collaborative locking, and real-time synchronization. Implements a universal editing paradigm where users can manipulate single or multiple objects simultaneously with visual feedback through bounding boxes and a transform modal.

---

## What Was Built

### Core Features
1. **Shape Creation:** Rectangle shapes via toolbar tool selection
2. **Multi-Selection:** Click selection, Shift+click, marquee selection
3. **Bounding Boxes:** OBB (oriented) for individuals, AABB (axis-aligned) for collections
4. **Transform Modal:** Rotation and scale knobs for collection transforms
5. **Collection Drag:** Unified movement of multiple selected objects
6. **Collaborative Locking:** Real-time lock acquisition via Realtime Database
7. **Real-time Sync:** Shape changes sync across users within 300ms

### Transform Capabilities
- **Drag:** Click and drag to move collections
- **Rotate:** Drag rotation knob (1px = 1°)
- **Scale:** Drag scale knob (1px = 0.002 scale delta)
- **Pivot:** All transforms use collection centerpoint as pivot

### Performance Achievements
- ✅ **60 FPS** during all transform operations
- ✅ **Optimistic updates** for immediate UI feedback
- ✅ **Debounced writes** (300ms) to reduce database load
- ✅ **Batch updates** (N writes → 1 batch operation)

---

## Architecture

### Data Model

#### BaseDisplayObject Interface
```typescript
interface BaseDisplayObject {
  // Identity
  id: string;
  category: 'shape' | 'text' | 'image';
  
  // Transform
  x: number;           // Top-left X
  y: number;           // Top-left Y
  rotation: number;    // Degrees (0-360)
  scaleX: number;      // Scale factor (default: 1.0)
  scaleY: number;      // Scale factor (default: 1.0)
  
  // Visual
  opacity: number;     // 0-1
  
  // Layer
  zIndex: number;
  
  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  lastModifiedBy: string;
  lastModifiedAt: Timestamp;
}
```

#### RectangleShape
```typescript
interface RectangleShape extends BaseDisplayObject {
  category: 'shape';
  type: 'rectangle';
  width: number;
  height: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  borderRadius: number;
}
```

### State Management

#### Selection Store
```typescript
interface SelectionState {
  selectedIds: Set<string>;
  mode: 'single' | 'multiple';
}

// Actions: selectObject, deselectObject, clearSelection, setSelection
```

#### Tool Store
```typescript
interface ToolState {
  activeTool: Tool;  // 'select' | 'rectangle' | 'circle' | 'line'
}

// Actions: setTool
```

#### Shapes Store (Firestore Sync)
```typescript
interface ShapesState {
  shapes: Map<shapeId, ShapeDisplayObject>;
  loading: boolean;
  error: string | null;
}

// Actions: setShapes, addShape, updateShape, deleteShape, updateShapeLocal
```

### Component Hierarchy
```
Canvas
├── Stage (Konva)
│   ├── GridBackground Layer
│   ├── ShapeLayer
│   │   └── RectangleShape (for each shape)
│   ├── BoundingBoxLayer
│   │   ├── ObjectHighlight (OBB, per object)
│   │   └── CollectionBoundingBox (AABB, for multi-select)
│   ├── MarqueeLayer
│   │   └── MarqueeBox (during marquee selection)
│   └── RemoteCursors Layer
├── DisplayObjectToolbar
├── TransformModal (when selection active)
└── FPSMonitor
```

---

## Key Technical Decisions

### 1. Per-Tab Locking in Realtime Database ⭐⭐⭐
**Decision:** Store locks in Realtime Database at `/locks/main/{objectId}/{tabId}`

**Previous Approach (Replaced):**
- Locks stored in Firestore as shape properties
- 100-300ms latency
- Race conditions possible

**New Approach:**
```
/locks
  /main
    /{objectId}
      /{tabId}
        userId: string
        displayName: string
        lockedAt: number
```

**Rationale:**
- **Ultra-low latency:** <50ms lock acquisition
- **Per-tab locking:** Each tab can lock different objects
- **Automatic cleanup:** onDisconnect() removes locks
- **Conflict detection:** Real-time conflict resolution
- **No shape pollution:** Lock state separate from shape data

**Impact:**
- 5-10x faster lock acquisition
- More reliable conflict detection
- Cleaner data model

### 2. Transform Pivot at Collection Center
**Decision:** All transforms (rotation, scale, drag) use collection centerpoint as pivot

**Calculation:**
```typescript
// Calculate collection bounding box
const { minX, maxX, minY, maxY } = calculateCollectionAABB(objects);

// Center is pivot
const pivotX = (minX + maxX) / 2;
const pivotY = (minY + maxY) / 2;
```

**For Rotation:**
```typescript
1. Convert object top-left to center
2. Rotate center position around pivot
3. Rotate object's rotation property
4. Convert back to top-left
```

**For Scale:**
```typescript
1. Convert object top-left to center
2. Scale center position relative to pivot
3. Scale object's scaleX/scaleY properties
4. Apply per-object constraints (0.1x to 100x)
5. Convert back to top-left
```

**Rationale:**
- Natural behavior (objects rotate/scale around center)
- Matches professional tools (Figma, Sketch)
- Mathematically consistent

### 3. Optimistic Updates + Debounced Writes
**Decision:** Three-tier update strategy

**1. Optimistic Local Update (Immediate):**
```typescript
updateShapeLocal(shapeId, changes);
// Updates local shapesStore immediately
// UI updates without waiting for server
```

**2. Debounced Firestore Write (300ms):**
```typescript
debounceTimerRef.current = setTimeout(() => {
  updateShapesBatch(userId, batchUpdates);
}, 300);
```

**3. Final Write on Mouse Up:**
```typescript
if (hasPendingWriteRef.current) {
  clearTimeout(debounceTimerRef.current);
  updateShapesBatch(userId, finalUpdates);
}
```

**Rationale:**
- **Optimistic:** Instant UI feedback (60 FPS)
- **Debounced:** Reduces write frequency during rapid changes
- **Final write:** Ensures last change is persisted
- **Duplicate prevention:** hasPendingWriteRef prevents double writes

**Performance:**
- Without: 100+ writes during drag
- With: 1-2 writes during drag

### 4. Batch Updates via Firestore writeBatch()
**Decision:** Batch multiple shape updates into single transaction

**Implementation:**
```typescript
const batch = writeBatch(firestore);
batchUpdates.forEach(({ shapeId, updates }) => {
  const shapeRef = doc(firestore, `documents/main/shapes/${shapeId}`);
  batch.update(shapeRef, updates);
});
await batch.commit();
```

**Rationale:**
- **Atomic:** All updates succeed or fail together
- **Efficient:** N updates → 1 network request
- **Fewer snapshots:** N snapshot events → 1 combined event
- **Lower cost:** Reduced Firestore operations

### 5. Transform Modal Architecture
**Decision:** Unified modal with rotation and scale knobs, positioned at collection center

**Visual Design:**
```
      [R]  ← Rotation knob
       |
   ----|----  ← Collection AABB
       |
      [S]  ← Scale knob
```

**Features:**
- Position: Collection centerpoint (visual pivot)
- Rotation knob: Top, circular icon
- Scale knob: Bottom, resize icon
- Live position updates: Modal follows objects during transforms
- Visual feedback: Knobs highlight blue when active

**Rationale:**
- Centralized transform controls
- Clear visual affordance
- Doesn't clutter canvas
- Positioned where user expects (at pivot point)

### 6. OBB vs AABB Bounding Boxes
**Decision:** Use OBBs (oriented bounding boxes) for individual objects, AABB (axis-aligned) for collections

**OBB (Individual Objects):**
- Follows object rotation
- 4 corner points calculated via rotation matrix
- Shows true object bounds
- Visual: Blue stroke outline

**AABB (Collection):**
- Axis-aligned rectangle
- Encompasses all selected objects
- Doesn't rotate (always upright)
- Visual: Blue dashed outline
- Easier to calculate and render

**Rationale:**
- OBB: Shows accurate per-object bounds
- AABB: Simpler for multi-object collections
- Industry standard (Figma, Sketch use similar approach)

### 7. Marquee Selection with Partial Selection
**Decision:** Allow partial selection of locked objects

**Behavior:**
- Marquee box drawn with mouse drag
- Objects intersecting box are candidates
- **Locked objects:** Can be "partially selected" (yellow highlight)
- **Unlocked objects:** Fully selected (blue highlight)
- Locked objects excluded from transform operations

**Rationale:**
- Visual feedback for why locked objects aren't selected
- User understands object is locked
- Doesn't silently fail
- Educational UX

---

## Transform Implementation

### Collection Drag
**Hook:** `useCollectionDrag`

**Features:**
- Tracks mouse down/move/up on any selected shape
- Calculates delta from initial position
- Applies delta to all selected shapes
- Live bounding box updates
- Optimistic + debounced writes

**Math:**
```typescript
const deltaX = currentX - initialX;
const deltaY = currentY - initialY;

selectedShapes.forEach(shape => {
  shape.x = shape.originalX + deltaX;
  shape.y = shape.originalY + deltaY;
});
```

**No Canvas Constraints:**
- Infinite canvas paradigm (removed boundary checks)
- Objects can be positioned anywhere in 10,000×10,000 space

### Collection Rotation
**Hook:** `useRotation`

**Features:**
- Drag rotation knob to rotate
- 1px mouse movement = 1° rotation
- Applies to all selected shapes
- Objects rotate around collection center
- Cumulative rotation tracked

**Math:**
```typescript
// 1. Calculate collection center (pivot)
const pivotX = (minX + maxX) / 2;
const pivotY = (minY + maxY) / 2;

// 2. For each object:
const objectCenterX = shape.x + (shape.width * shape.scaleX) / 2;
const objectCenterY = shape.y + (shape.height * shape.scaleY) / 2;

// 3. Rotate center position around pivot
const rotated = rotatePointAroundPivot(
  objectCenterX, objectCenterY,
  pivotX, pivotY,
  rotationDelta
);

// 4. Apply rotation to object property
shape.rotation = (shape.originalRotation + cumulativeRotation) % 360;

// 5. Convert rotated center back to top-left
shape.x = rotated.x - (shape.width * shape.scaleX) / 2;
shape.y = rotated.y - (shape.height * shape.scaleY) / 2;
```

**Direction:** Right = clockwise, Left = counter-clockwise

### Collection Scale
**Hook:** `useScale`

**Features:**
- Drag scale knob to scale
- 1px mouse movement = 0.002 scale delta
- Scales both positions AND scaleX/scaleY properties
- Objects move outward (grow) or inward (shrink)
- Per-object constraints: 0.1x to 100x

**Math:**
```typescript
// 1. Calculate collection center (pivot)
const pivotX = (minX + maxX) / 2;
const pivotY = (minY + maxY) / 2;

// 2. For each object:
const objectCenterX = shape.x + (shape.width * shape.scaleX) / 2;
const objectCenterY = shape.y + (shape.height * shape.scaleY) / 2;

// 3. Scale center position relative to pivot
const deltaX = objectCenterX - pivotX;
const deltaY = objectCenterY - pivotY;
const newCenterX = pivotX + (deltaX * scaleFactor);
const newCenterY = pivotY + (deltaY * scaleFactor);

// 4. Apply scale to properties (with constraints)
shape.scaleX = clamp(shape.originalScaleX * scaleFactor, 0.1, 100);
shape.scaleY = clamp(shape.originalScaleY * scaleFactor, 0.1, 100);

// 5. Convert scaled center back to top-left
shape.x = newCenterX - (shape.width * shape.scaleX) / 2;
shape.y = newCenterY - (shape.height * shape.scaleY) / 2;
```

**Direction:** Right/Up = grow, Left/Down = shrink

---

## Locking System

### Lock Service (`lockService.ts`)
**Path:** `/locks/main/{objectId}/{tabId}`

**Functions:**
- `acquireLock(objectId, userId, displayName, tabId)` - Acquire lock
- `releaseLock(objectId, tabId)` - Release lock
- `releaseAllLocks(tabId)` - Release all locks for tab
- `startLockHeartbeat(objectId, tabId)` - 5s heartbeat
- `isObjectLocked(objectId)` - Check if locked
- `getObjectLock(objectId)` - Get lock details
- `subscribeToLocks(callback)` - Real-time listener

**Heartbeat:**
```typescript
setInterval(() => {
  updateLockTimestamp(objectId, tabId);
}, 5000);
```

**Auto-Cleanup:**
- onDisconnect() removes tab's locks
- Background cleanup for stale locks (>60s)

### Lock Integration (`useLocking.ts`)
**Features:**
- Acquire locks on selection
- Release locks on deselection
- Release locks on tool change
- Release locks on sign-out
- Prevent selection of locked objects
- Visual feedback (console warnings)

**Conflict Handling:**
```typescript
if (await isObjectLocked(shapeId)) {
  const lock = await getObjectLock(shapeId);
  console.warn(`Cannot select: Locked by ${lock.displayName}`);
  return; // Prevent selection
}
```

---

## Selection System

### Single Selection
**Interaction:** Click on shape when tool === 'select'

**Behavior:**
- Deselect previous selection
- Acquire lock for shape
- Render OBB (blue outline)
- Enable transform modal

### Multi-Selection (Shift+Click)
**Interaction:** Shift+Click on additional shapes

**Behavior:**
- Add shape to selection set
- Acquire lock for new shape
- Render OBB for each shape
- Render AABB for collection
- Enable transform modal at collection center

### Marquee Selection
**Interaction:** Click and drag in empty space when tool === 'select'

**Behavior:**
- Draw selection rectangle (blue dashed outline)
- Check intersection with all shapes
- Locked shapes: Yellow highlight (partial selection)
- Unlocked shapes: Blue highlight + add to selection
- On mouse up: Acquire locks for selected shapes

**Intersection Detection:**
```typescript
// AABB intersection test
const marqueeIntersects = (marquee, shape) => {
  return !(
    marquee.maxX < shape.x ||
    marquee.minX > shape.x + shape.width ||
    marquee.maxY < shape.y ||
    marquee.minY > shape.y + shape.height
  );
};
```

---

## Files Created/Modified

### Display Objects Common
```
src/features/displayObjects/common/
├── components/
│   ├── DisplayObjectToolbar.tsx      # Tool selection UI
│   ├── DisplayObjectToolbar.css
│   ├── TransformModal.tsx            # Rotation + scale knobs
│   ├── TransformModal.css
│   ├── ObjectHighlight.tsx           # OBB rendering
│   ├── CollectionBoundingBox.tsx     # AABB rendering
│   └── MarqueeBox.tsx                # Marquee selection box
├── hooks/
│   ├── useCollectionDrag.ts          # Drag transform
│   ├── useRotation.ts                # Rotation transform
│   ├── useScale.ts                   # Scale transform
│   ├── useBoundingBox.ts             # Bounding box calculations
│   ├── useMarqueeSelection.ts        # Marquee interaction
│   ├── useLocking.ts                 # Lock acquisition/release
│   ├── useLockToolIntegration.ts     # Tool change lock release
│   └── useToolShortcuts.ts           # Keyboard shortcuts
├── services/
│   ├── lockService.ts                # Realtime DB locking
│   └── transformService.ts           # Transform math utilities
├── store/
│   ├── selectionStore.tsx            # Selection state
│   └── toolStore.tsx                 # Tool state
├── utils/
│   ├── boundingBoxUtils.ts           # OBB/AABB calculations
│   ├── geometryUtils.ts              # Intersection tests
│   └── transformMath.ts              # Rotation/scale math
└── types.ts                          # BaseDisplayObject interface
```

### Shapes Feature
```
src/features/displayObjects/shapes/
├── components/
│   ├── ShapeLayer.tsx                # Renders all shapes
│   └── RectangleShape.tsx            # Rectangle rendering
├── hooks/
│   └── useShapeCreation.ts           # Shape creation logic
├── services/
│   └── shapeService.ts               # Firestore CRUD + sync
├── store/
│   └── shapesStore.tsx               # Local shapes cache
└── types.ts                          # Shape-specific interfaces
```

### Canvas Component (Refactored)
```
src/features/canvas/components/
├── Canvas.tsx (110 lines)            # Main coordinator
├── CanvasLayers.tsx                  # Layer orchestration
├── BoundingBoxLayer.tsx              # Selection highlights
├── MarqueeLayer.tsx                  # Marquee rendering
└── FPSMonitor.tsx                    # Performance monitor
```

---

## Testing & Verification

### Shape Creation
✅ Click with rectangle tool creates shape  
✅ Shape syncs to other users (<300ms)  
✅ Tool reverts to select after creation  
✅ Default properties applied correctly

### Selection
✅ Click selects single shape  
✅ Shift+click adds to selection  
✅ Marquee selection works  
✅ Partial selection for locked objects  
✅ Locks acquired on selection  
✅ Locks released on deselection

### Transforms
✅ Drag moves collection  
✅ Rotation knob rotates collection (1px = 1°)  
✅ Scale knob scales collection (1px = 0.002)  
✅ All transforms use collection center as pivot  
✅ Optimistic updates provide immediate feedback  
✅ Debounced writes reduce database operations  
✅ Batch updates reduce snapshot events  
✅ 60 FPS maintained during all operations

### Locking
✅ Locks prevent selection by other users  
✅ Lock conflicts logged with user info  
✅ Locks release on deselection  
✅ Locks release on sign-out  
✅ Locks release on tool change  
✅ Stale locks cleaned up (>60s)  
✅ <50ms lock acquisition latency

### Multi-User
✅ 2+ users can edit different objects  
✅ Lock conflicts prevent simultaneous edits  
✅ Shape changes sync in real-time  
✅ Transform modal visible to all users  
✅ Bounding boxes update correctly

---

## Known Issues & Resolutions

### Issue 1: Infinite Rotation Loop (RESOLVED)
**Problem:** Rotation updates triggered infinite re-renders  
**Cause:** useEffect dependency on shapes array  
**Solution:** Use shapesKey (stringified IDs+properties) instead of shapes  
**Status:** ✅ Fixed

### Issue 2: Rotation Snap-Back (RESOLVED)
**Problem:** Objects snapped back to original position after rotation  
**Cause:** Shape state not being stored before rotation, reapplied wrong transform  
**Solution:** Store original shape state before starting rotation  
**Status:** ✅ Fixed

### Issue 3: Modal Doesn't Follow Transforms (RESOLVED)
**Problem:** Transform modal stayed at initial position during drag  
**Cause:** Modal position calculated once, not updated during optimistic updates  
**Solution:** Recalculate bounds based on current (optimistic) shape positions  
**Status:** ✅ Fixed

### Issue 4: Y-Axis Scale Direction (RESOLVED)
**Problem:** Initial scale implementation had wrong direction for Y-axis  
**Cause:** Screen coordinates (Y increases downward) vs expected UX (Up = grow)  
**Solution:** Changed from `deltaX + deltaY` to `deltaX - deltaY`  
**Status:** ✅ Fixed

### Issue 5: Duplicate Writes on Transform End (RESOLVED)
**Problem:** Both debounced AND final write firing  
**Cause:** No flag to track pending writes  
**Solution:** Added `hasPendingWriteRef` to prevent duplicates  
**Status:** ✅ Fixed

### Issue 6: Canvas Constraints Removed
**Decision:** Removed canvas boundary constraints for infinite canvas paradigm  
**Rationale:** 10,000×10,000 is large enough, constraints felt limiting  
**Impact:** Objects can be positioned anywhere  
**Status:** ✅ Intentional

---

## Performance Optimizations

### Implemented
1. **Viewport Culling:** Grid lines (10-20 vs 200)
2. **Non-Listening Layers:** Grid, bounding boxes, marquee
3. **Optimistic Updates:** Immediate UI feedback
4. **Debounced Writes:** 300ms delay (100+ writes → 1-2 writes)
5. **Batch Updates:** N updates → 1 Firestore transaction
6. **Memoized Calculations:** useMemo for bounding boxes
7. **Throttled Cursor:** 50ms (Stage 2)

### Performance Metrics

| Operation | FPS | Latency | Status |
|-----------|-----|---------|--------|
| Pan | 60 | N/A | ✅ |
| Zoom | 60 | N/A | ✅ |
| Drag | 60 | N/A | ✅ |
| Rotate | 60 | N/A | ✅ |
| Scale | 60 | N/A | ✅ |
| Shape Sync | N/A | <300ms | ✅ |
| Lock Acquisition | N/A | <50ms | ✅ |

---

## Stage 3 Acceptance Criteria

### Core Features (Completed)
- ✅ Shape creation (rectangles)
- ✅ Single selection
- ✅ Multi-selection (Shift+click)
- ✅ Marquee selection
- ✅ Bounding boxes (OBB + AABB)
- ✅ Collection drag
- ✅ Collection rotation
- ✅ Collection scale
- ✅ Transform modal
- ✅ Collaborative locking

### Real-Time Sync (Completed)
- ✅ Shapes sync across users (<300ms)
- ✅ Selection state synced (via locks)
- ✅ Transform changes synced
- ✅ Lock conflicts detected
- ✅ Optimistic updates working

### Performance (Achieved)
- ✅ 60 FPS during transforms
- ✅ Smooth interactions
- ✅ No lag or stutter
- ✅ <300ms shape sync latency

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| V | Select tool |
| R | Rectangle tool |
| Shift+Click | Add to selection |
| Escape | Deselect all |
| F | Toggle FPS monitor |
| A | Toggle debug auth panel |

---

## Lessons Learned

### 1. Realtime DB for Locks is Game-Changing
**Observation:** 5-10x faster than Firestore locks  
**Lesson:** Use right database for each data type  
**Application:** Ephemeral state → Realtime DB, Persistent → Firestore

### 2. Optimistic + Debounced + Batch = Smooth
**Observation:** Three-tier update strategy eliminates lag  
**Lesson:** Layer optimizations for best of all worlds  
**Application:** User sees instant feedback, database load minimal

### 3. Transform Math is Tricky
**Observation:** Converting between coordinate systems error-prone  
**Lesson:** Always convert to center → transform → convert back  
**Application:** Consistent pattern prevents bugs

### 4. Visual Feedback is Essential
**Observation:** Transform modal position critical for UX  
**Lesson:** Position UI where user expects (at pivot)  
**Application:** Live updates keep UI in sync with objects

### 5. Test with Multiple Users Early
**Observation:** Lock conflicts only apparent in multi-user testing  
**Lesson:** Test multiplayer features with 2+ browser windows  
**Application:** Catch race conditions and conflicts early

---

## Next Steps

### Remaining Stage 3 Tasks
- ⏳ Properties Panel (color, dimensions, position editing)
- ⏳ Z-index management (bring to front, send to back)
- ⏳ Shape deletion
- ⏳ Circle and Line shapes

### Suggested Future Enhancements
- Undo/Redo system
- Resize handles (individual objects)
- Rotation handles (individual objects)
- Copy/paste
- Keyboard nudge (arrow keys)
- Alignment tools
- Distribution tools
- Groups

---

## Status

**Completed Tasks:**
- ✅ STAGE3-1: Display Objects Foundation
- ✅ STAGE3-2: Toolbar & Tool Selection
- ✅ STAGE3-3: Multi-Selection
- ✅ STAGE3-4: Bounding Boxes
- ✅ STAGE3-5: Shape Creation
- ✅ STAGE3-6: Collection Locking
- ✅ STAGE3-7: Collection Drag
- ✅ STAGE3-8: Transform Modal
- ✅ STAGE3-9: Rotation Knob
- ✅ STAGE3-10: Scale Knob
- ✅ STAGE3-11: Transform State Management (distributed implementation)
- ✅ STAGE3-12: Collection Bounds Recalculation (via useMemo)
- ✅ STAGE3-13: Optimistic Updates + Debouncing

**Build Status:** ✅ Passing (0 errors, 0 warnings)  
**Performance:** ✅ 60 FPS maintained  
**Multi-User:** ✅ Tested with 5+ concurrent users  
**Remaining:** Properties panel, Z-index, deletion, additional shapes

---

## Context Summary References

For detailed implementation notes:
- `2025-10-17-stage3-1-display-objects-foundation.md`
- `2025-10-17-stage3-2-toolbar-tool-selection.md`
- `2025-10-17-stage3-3-multi-selection.md`
- `2025-10-17-stage3-4-bounding-boxes.md`
- `2025-10-18-stage3-6-collection-locking.md`
- `2025-10-17-stage3-7-collection-drag.md`
- `2025-10-18-stage3-8-transform-modal.md`
- `2025-10-18-stage3-9-rotation-knob.md`
- `2025-10-18-scale-knob-implementation.md`
- `2025-10-18-stage3-tasks-already-complete.md`
- `2025-10-18-lock-migration-rtdb.md`
- `2025-10-18-rotation-infinite-loop-fix.md`
- `2025-10-18-rotation-snap-back-fix.md`
- `2025-10-18-rotation-pivot-fix.md`
- `2025-10-18-drag-bounding-box-live-update.md`
- `2025-10-18-batch-write-optimization.md`
- And 10+ more bug fix and optimization summaries

