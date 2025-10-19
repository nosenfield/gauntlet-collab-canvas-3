# Magic Values Audit

## Overview
This document identifies hardcoded "magic values" in the codebase that should reference existing constants/config instead.

**Status:** ✅ All critical issues have been fixed (2025-10-19)

---

## ✅ Critical Issues (FIXED)

### 1. Canvas Dimensions

**Existing Constant:** `CANVAS_CONSTANTS.width` = 10000, `CANVAS_CONSTANTS.height` = 10000

#### Files Using Magic Values:

**`src/features/canvas/store/viewportStore.tsx` (lines 49-51)**
```typescript
// ❌ Hardcoded
const CANVAS_CENTER_X = 5000;
const CANVAS_CENTER_Y = 5000;
const INITIAL_VISIBLE_SIZE = 2000;

// ✅ Should be
const CANVAS_CENTER_X = CANVAS_CONSTANTS.width / 2;
const CANVAS_CENTER_Y = CANVAS_CONSTANTS.height / 2;
const INITIAL_VISIBLE_SIZE = 2000; // Could add to CANVAS_CONSTANTS as initialViewSize
```

**`src/features/canvas/utils/gridUtils.ts` (lines 91-92)**
```typescript
// ❌ Hardcoded
maxX: Math.min(10000, maxX),
maxY: Math.min(10000, maxY),

// ✅ Should be
maxX: Math.min(CANVAS_CONSTANTS.width, maxX),
maxY: Math.min(CANVAS_CONSTANTS.height, maxY),
```

**`src/features/displayObjects/common/services/transformService.ts` (lines 16-17)**
```typescript
// ❌ Hardcoded
const CANVAS_CONFIG = {
  MAX_X: 10000,
  MAX_Y: 10000,
};

// ✅ Should be
import { CANVAS_CONSTANTS } from '@/types/canvas';
// Use CANVAS_CONSTANTS.width and CANVAS_CONSTANTS.height
```

**`src/features/canvas/utils/zoomConstraints.ts` (line 12)**
```typescript
// ❌ Hardcoded (local const)
const CANVAS_SIZE = 10000;

// ✅ Should be
import { CANVAS_CONSTANTS } from '@/types/canvas';
const CANVAS_SIZE = CANVAS_CONSTANTS.width;
```

---

### 2. Shape Minimum Size

**Existing Constant:** `SHAPE_CONSTANTS.MIN_DIMENSION` = 10

**`src/features/displayObjects/shapes/hooks/useRectangleDraw.ts` (line 40)**
```typescript
// ❌ Hardcoded
const MIN_SIZE = 10;

// ✅ Should be
import { SHAPE_CONSTANTS } from '../types';
const MIN_SIZE = SHAPE_CONSTANTS.MIN_DIMENSION;
```

---

### 3. Rectangle Preview Styling

**Existing Constant:** `DEFAULT_SHAPE_PROPERTIES.rectangle`

**`src/features/displayObjects/shapes/components/PreviewRectangle.tsx` (lines 40-43)**
```typescript
// ❌ Hardcoded
fill="white"
stroke="black"
strokeWidth={1}
opacity={0.7}

// ✅ Should be
import { DEFAULT_SHAPE_PROPERTIES } from '../types';

const PREVIEW_OPACITY = 0.7; // Could add to a PREVIEW_CONSTANTS

fill={DEFAULT_SHAPE_PROPERTIES.rectangle.fillColor}
stroke={DEFAULT_SHAPE_PROPERTIES.rectangle.strokeColor}
strokeWidth={DEFAULT_SHAPE_PROPERTIES.rectangle.strokeWidth}
opacity={PREVIEW_OPACITY}
```

---

### 4. Canvas Background Color

**Existing Constant:** `GRID_CONSTANTS.backgroundColor` = '#2A2A2A'

**`src/features/canvas/components/Canvas.tsx` (line 123)**
```typescript
// ❌ Hardcoded
backgroundColor: '#2A2A2A', // Dark gray background

// ✅ Should be
import { GRID_CONSTANTS } from '@/types/canvas';
backgroundColor: GRID_CONSTANTS.backgroundColor,
```

---

## Medium Priority (Nice to Have)

### 5. Performance/Timing Constants

**`src/features/presence/hooks/useCursorTracking.ts` (line 49)**
```typescript
// ❌ Hardcoded
}, 50);

// ✅ Could create PRESENCE_CONSTANTS
// Add to src/types/firebase.ts or new constants file:
export const PRESENCE_CONSTANTS = {
  CURSOR_THROTTLE_MS: 50,
  HEARTBEAT_INTERVAL_MS: 5000,
};
```

**`src/features/presence/hooks/usePresence.ts` (line 19)**
```typescript
// ❌ Hardcoded
const HEARTBEAT_INTERVAL = 5000; // 5 seconds

// ✅ Should reference same constant as above
```

---

### 6. Collection Bounding Box Styling

**`src/features/displayObjects/common/components/CollectionBoundingBox.tsx` (line 65)**
```typescript
// ❌ Hardcoded
opacity={0.5}

// ✅ Could add to UI_CONSTANTS
export const UI_CONSTANTS = {
  BOUNDING_BOX_OPACITY: 0.5,
  PREVIEW_OPACITY: 0.7,
  MARQUEE_OPACITY: 0.5,
};
```

---

### 7. Lock/Transform Constants

**Existing:** `LOCK_CONSTANTS.MAX_Z_INDEX` = 10000

**`src/features/displayObjects/common/components/UniversalProperties.tsx` (lines 392-405, 565)**
```typescript
// ❌ Hardcoded position bounds
min={-10000}
max={20000}

// These seem intentionally more permissive than canvas bounds
// But could document why or reference CANVAS_CONSTANTS * 2
```

---

### 8. Performance Test

**`src/features/displayObjects/common/components/PerformanceTest.tsx` (lines 75-76, 100-101)**
```typescript
// ❌ Hardcoded
const CANVAS_CENTER = 5000;
x = CANVAS_CENTER - 2000 + (Math.random() * 4000);

// ✅ Should be
const CANVAS_CENTER = CANVAS_CONSTANTS.width / 2;
const TEST_AREA_SIZE = 4000; // Document constant
```

---

## Low Priority (Intentional or UI-specific)

### 9. CSS Z-Index Values
- `PerformanceTest.css`: `z-index: 2000`
- These are UI layering, not related to shape z-index

### 10. CSS Opacity Values
- Multiple CSS files with opacity values (0.4, 0.6, 0.7, 0.8)
- These are UI styling choices, less critical to centralize

### 11. Transition Timing
- Various CSS transition durations (0.15s, 0.2s)
- Could centralize but lower priority

---

## Recommendations

### ✅ Immediate Actions (COMPLETED):
1. ✅ **FIXED** - Canvas dimension references (10000, 5000) → use `CANVAS_CONSTANTS`
   - viewportStore.tsx
   - gridUtils.ts
   - transformService.ts
   - zoomConstraints.ts
2. ✅ **FIXED** - Shape minimum size → use `SHAPE_CONSTANTS.MIN_DIMENSION`
   - useRectangleDraw.ts
3. ✅ **FIXED** - PreviewRectangle colors → use `DEFAULT_SHAPE_PROPERTIES`
   - PreviewRectangle.tsx
4. ✅ **FIXED** - Canvas background color → use `GRID_CONSTANTS.backgroundColor`
   - Canvas.tsx

### Short-term Actions:
5. Create `PRESENCE_CONSTANTS` for timing values
6. Create `UI_CONSTANTS` for common opacity/styling values
7. Document intentional differences (e.g., position bounds being larger than canvas)

### Long-term Actions:
8. Consider centralizing common CSS values (z-indexes, transitions)
9. Add JSDoc comments explaining why certain values differ from constants

---

## Summary

**Critical Issues:** 4 categories, affecting ~10 files
**Medium Priority:** 4 categories, affecting ~5 files  
**Low Priority:** Mostly CSS/UI styling

**Biggest Impact:**
- Canvas dimension references (most frequent)
- Rectangle preview styling (visual consistency)
- Shape minimum size (feature correctness)

