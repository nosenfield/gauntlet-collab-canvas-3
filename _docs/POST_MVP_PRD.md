# Post-MVP Product Requirements Document
# CollabCanvas - Enhancement Features

---

## Document Information
- **Project Name**: CollabCanvas
- **Version**: 2.0 (Post-MVP)
- **Last Updated**: 2025-10-19
- **Target Audience**: AI Development Agent (Cursor IDE)
- **Location**: `_docs/POST_MVP_PRD.md`
- **Related Documents**: 
  - MVP PRD: `_docs/PRD.md`
  - Task List: `_docs/TASK_LIST.md`
  - Architecture: `_docs/ARCHITECTURE.md`

---

## Overview

This document defines enhancement features for CollabCanvas to be implemented **after** the MVP is complete and stable. These features build upon the existing foundation to provide advanced design capabilities.

### MVP Completion Prerequisites

Before implementing post-MVP features, ensure:
- ✅ All MVP stages (1-3) are complete
- ✅ Real-time sync is stable and tested
- ✅ No critical bugs or performance issues
- ✅ Core user flows work smoothly
- ✅ Code is well-documented and maintainable

---

## Enhancement 1: Blend Modes

### Overview
Add blend mode support to all display objects, enabling Photoshop/Figma-style layer blending effects.

### Priority
**High** - Significantly enhances design capabilities with minimal complexity

### Functional Requirements

#### FR-BLEND-1: Universal Blend Mode Property
- **Requirement**: All display objects support blend mode selection
- **Applies To**: Shapes (rectangles, circles, lines) and Text objects
- **Default**: `source-over` (normal blending)
- **Behavior**: Blend mode affects how the object composites with layers below it

#### FR-BLEND-2: Blend Mode Selection UI
- **Requirement**: Blend mode selector in Properties Panel
- **Location**: Below opacity slider in Universal Properties section
- **UI Component**: Dropdown menu
- **Label**: "Blend Mode"
- **Width**: Full width of properties section
- **Default Display**: Show current blend mode name (e.g., "Normal")

#### FR-BLEND-3: Supported Blend Modes
The following blend modes must be supported:

**Basic Modes** (Top Priority):
- `source-over` - Normal (default)
- `multiply` - Multiply
- `screen` - Screen
- `overlay` - Overlay

**Advanced Modes** (Medium Priority):
- `darken` - Darken
- `lighten` - Lighten
- `color-dodge` - Color Dodge
- `color-burn` - Color Burn
- `hard-light` - Hard Light
- `soft-light` - Soft Light

**Difference Modes** (Lower Priority):
- `difference` - Difference
- `exclusion` - Exclusion

**Color Modes** (Advanced):
- `hue` - Hue
- `saturation` - Saturation
- `color` - Color
- `luminosity` - Luminosity

**Special Modes**:
- `xor` - XOR (useful for masking effects)

#### FR-BLEND-4: Multi-Object Selection Behavior
- **Single Selection**: Show current blend mode
- **Multi-Selection (Same Mode)**: Show common blend mode
- **Multi-Selection (Different Modes)**: Show "Mixed" placeholder
- **Multi-Selection Update**: Changing blend mode applies to all selected objects

#### FR-BLEND-5: Real-Time Sync
- **Requirement**: Blend mode changes sync to Firestore
- **Latency Target**: <300ms (same as other property updates)
- **Behavior**: All connected users see blend mode updates in real-time
- **Optimistic Update**: UI updates immediately, Firestore updates async

#### FR-BLEND-6: Persistence
- **Requirement**: Blend modes persist across sessions
- **Storage**: Firestore document for each display object
- **Field Name**: `blendMode` (string)
- **Default Value**: `"source-over"` for existing objects (migration)

### Technical Requirements

#### TR-BLEND-1: Data Model
```typescript
// Add to BaseDisplayObject interface
interface BaseDisplayObject {
  // ... existing properties ...
  blendMode?: string; // Optional for backward compatibility
}

// Blend mode type definition
type BlendMode = 
  | 'source-over'      // Normal
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity'
  | 'xor';

// Default constant
const DEFAULT_BLEND_MODE: BlendMode = 'source-over';
```

#### TR-BLEND-2: Rendering
```typescript
// Konva component integration
<Rect
  // ... existing props ...
  globalCompositeOperation={shape.blendMode || 'source-over'}
/>

<Text
  // ... existing props ...
  globalCompositeOperation={text.blendMode || 'source-over'}
/>
```

#### TR-BLEND-3: Properties Panel Component
```typescript
// BlendModeSelector Component
interface BlendModeSelectorProps {
  value: BlendMode | 'mixed';
  onChange: (blendMode: BlendMode) => void;
  disabled?: boolean;
}

// Dropdown options
const BLEND_MODE_OPTIONS = [
  { value: 'source-over', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  // ... etc
];
```

#### TR-BLEND-4: Validation
```typescript
// Validation function
function isValidBlendMode(value: unknown): value is BlendMode {
  return typeof value === 'string' && VALID_BLEND_MODES.includes(value);
}

// Sanitization
function sanitizeBlendMode(value: unknown): BlendMode {
  return isValidBlendMode(value) ? value : 'source-over';
}
```

#### TR-BLEND-5: Firestore Migration
For existing objects without blend mode:
```typescript
// Firestore query with default
const blendMode = doc.data().blendMode ?? 'source-over';

// No migration needed - use fallback in code
// Future: Optional batch migration script
```

#### TR-BLEND-6: Update Service
```typescript
// Add to updateShapesBatch / updateTextsBatch
interface UpdateShapeData {
  // ... existing properties ...
  blendMode?: BlendMode;
}

interface UpdateTextData {
  // ... existing properties ...
  blendMode?: BlendMode;
}
```

### UI/UX Specifications

#### Blend Mode Dropdown Design
```
┌─────────────────────────────────────┐
│ Properties Panel                     │
├─────────────────────────────────────┤
│                                      │
│ Opacity                              │
│ ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░  75%           │
│                                      │
│ Blend Mode                           │
│ ┌─────────────────────────────┐    │
│ │ Multiply                 ▼ │    │
│ └─────────────────────────────┘    │
│                                      │
└─────────────────────────────────────┘

When opened:
┌─────────────────────────────────────┐
│ ┌─────────────────────────────┐    │
│ │ ☑ Normal                    │    │
│ │   Multiply                  │    │
│ │   Screen                    │    │
│ │   Overlay                   │    │
│ │   ─────────────             │    │
│ │   Darken                    │    │
│ │   Lighten                   │    │
│ │   Color Dodge               │    │
│ │   Color Burn                │    │
│ │   Hard Light                │    │
│ │   Soft Light                │    │
│ │   ─────────────             │    │
│ │   Difference                │    │
│ │   Exclusion                 │    │
│ │   ─────────────             │    │
│ │   Hue                       │    │
│ │   Saturation                │    │
│ │   Color                     │    │
│ │   Luminosity                │    │
│ │   ─────────────             │    │
│ │   XOR                       │    │
│ └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

#### Styling Specifications
- **Dropdown Height**: 36px
- **Font Size**: 14px
- **Font**: System UI font
- **Background**: `#2A2A2A` (dark theme)
- **Text Color**: `#FFFFFF`
- **Border**: 1px solid `#444444`
- **Hover Background**: `#333333`
- **Selected Background**: `#4A90E2` (blue)
- **Dropdown Max Height**: 300px (scrollable)
- **Option Padding**: 8px 12px
- **Divider Color**: `#444444`
- **Divider Height**: 1px

#### Visual Grouping
Group blend modes in dropdown with dividers:
1. **Basic** (Normal, Multiply, Screen, Overlay)
2. **Advanced** (Darken, Lighten, Color Dodge, Color Burn, Hard Light, Soft Light)
3. **Difference** (Difference, Exclusion)
4. **Color** (Hue, Saturation, Color, Luminosity)
5. **Special** (XOR)

### Acceptance Criteria

#### Data Model
- [ ] `blendMode` property added to `BaseDisplayObject` interface
- [ ] TypeScript type `BlendMode` defined with all valid modes
- [ ] Default value of `'source-over'` used for existing objects
- [ ] Type safety enforced across codebase

#### Rendering
- [ ] Rectangle shapes render with correct blend mode
- [ ] Circle shapes render with correct blend mode
- [ ] Line shapes render with correct blend mode
- [ ] Text objects render with correct blend mode
- [ ] Blend mode visually affects compositing with underlying layers
- [ ] Performance maintained (60 FPS with blend modes)

#### Properties Panel UI
- [ ] Blend mode dropdown displays below opacity slider
- [ ] Dropdown shows current blend mode for single selection
- [ ] Dropdown shows "Mixed" for multi-selection with different modes
- [ ] Dropdown organized with visual grouping (dividers)
- [ ] All 17+ blend modes available in dropdown
- [ ] Dropdown styled correctly (matches design specs)
- [ ] Dropdown accessible (keyboard navigation works)

#### User Interactions
- [ ] Clicking dropdown opens blend mode list
- [ ] Clicking blend mode updates selected object(s)
- [ ] Multi-selection applies blend mode to all selected
- [ ] UI updates immediately (optimistic update)
- [ ] Keyboard navigation works (arrow keys, Enter)
- [ ] ESC key closes dropdown
- [ ] Click outside closes dropdown

#### Real-Time Sync
- [ ] Blend mode changes sync to Firestore
- [ ] Other users see blend mode changes in real-time
- [ ] Latency < 300ms for sync
- [ ] No conflicts or race conditions
- [ ] Offline changes queue and sync on reconnect

#### Persistence
- [ ] Blend mode persists across sessions
- [ ] Existing objects default to 'source-over'
- [ ] New objects default to 'source-over'
- [ ] Data model backward compatible

#### Testing
- [ ] Test all blend modes render correctly
- [ ] Test multi-layer compositing (3+ overlapping objects)
- [ ] Test with different opacity values (blend + opacity)
- [ ] Test multi-selection behavior
- [ ] Test real-time sync with 2+ users
- [ ] Test performance with 100+ objects with blend modes
- [ ] Test keyboard accessibility
- [ ] Test mobile/tablet responsiveness (if applicable)

### Performance Considerations

#### Rendering Performance
- **Blend modes use GPU compositing** - should not impact performance
- **Test with 100+ overlapping objects** - ensure 60 FPS maintained
- **Monitor frame rate** during blend mode changes

#### Firestore Performance
- **Debounce updates** (300ms) like other properties
- **Batch updates** for multi-selection changes
- **Minimal payload** (single string field)

### Known Limitations

1. **Browser Support**: Some advanced blend modes (hue, saturation, color, luminosity) may have inconsistent rendering across browsers
2. **Canvas API**: Blend modes are applied at render time, not interactive editing
3. **Preview Accuracy**: Some blend modes may appear different on different monitors/color profiles
4. **No Blend Mode Preview**: Users must apply to see effect (potential future enhancement)

### Future Enhancements (Out of Scope)

- ❌ Blend mode preview on hover
- ❌ Blend mode presets/favorites
- ❌ Custom blend mode algorithms
- ❌ Blend mode animations/transitions
- ❌ Blend mode keyboard shortcuts

---

## Implementation Checklist

### Phase 1: Data Model (15 minutes)
- [ ] Add `blendMode?: string` to `BaseDisplayObject` in `types.ts`
- [ ] Create `BlendMode` type with all modes
- [ ] Add `DEFAULT_BLEND_MODE` constant
- [ ] Update `CreateShapeData` and `UpdateShapeData` interfaces
- [ ] Update `CreateTextData` and `UpdateTextData` interfaces

### Phase 2: Validation (10 minutes)
- [ ] Add blend mode validation to `dataValidation.ts`
- [ ] Add `isValidBlendMode()` function
- [ ] Add `sanitizeBlendMode()` function
- [ ] Add unit tests for validation

### Phase 3: Rendering (15 minutes)
- [ ] Add `globalCompositeOperation` to `RectangleShape.tsx`
- [ ] Add `globalCompositeOperation` to `CircleShape.tsx`
- [ ] Add `globalCompositeOperation` to `LineShape.tsx`
- [ ] Add `globalCompositeOperation` to `TextObject.tsx`
- [ ] Test visual rendering with sample objects

### Phase 4: UI Component (30 minutes)
- [ ] Create `BlendModeSelector.tsx` component
- [ ] Create `BlendModeSelector.css` styles
- [ ] Implement dropdown with all blend modes
- [ ] Add visual grouping (dividers)
- [ ] Add keyboard navigation
- [ ] Test accessibility

### Phase 5: Properties Panel Integration (15 minutes)
- [ ] Add `BlendModeSelector` to `UniversalProperties.tsx`
- [ ] Position below opacity slider
- [ ] Implement `getCommonValue()` for blend mode
- [ ] Implement `updateProperty()` for blend mode
- [ ] Handle "Mixed" state for multi-selection

### Phase 6: Services (10 minutes)
- [ ] Update `shapeService.ts` to handle blend mode
- [ ] Update `textService.ts` to handle blend mode
- [ ] Ensure batch updates include blend mode
- [ ] Test Firestore writes

### Phase 7: Testing (30 minutes)
- [ ] Test each blend mode visually
- [ ] Test multi-layer compositing
- [ ] Test with opacity + blend mode combinations
- [ ] Test multi-selection updates
- [ ] Test real-time sync (2+ browser windows)
- [ ] Test performance (100+ objects)
- [ ] Fix any issues

### Phase 8: Documentation (15 minutes)
- [ ] Create context summary document
- [ ] Update architecture docs if needed
- [ ] Add code comments
- [ ] Update user guide (if exists)

**Total Estimated Time**: ~2.5 hours

---

## Enhancement 2: Shadow Effects (Future)

### Overview
Add shadow/drop shadow support to display objects.

**Status**: Placeholder for future enhancement  
**Priority**: Medium  
**Complexity**: Low (Konva native support)

---

## Enhancement 3: Opacity Isolation (Future)

### Overview
Add ability to isolate opacity (prevent transparency blending with background).

**Status**: Placeholder for future enhancement  
**Priority**: Low  
**Complexity**: Medium

---

## Enhancement 4: Layer Groups (Future)

### Overview
Allow grouping display objects with shared properties and blend modes.

**Status**: Placeholder for future enhancement  
**Priority**: High  
**Complexity**: High

---

## Enhancement 5: Advanced Shape Properties (Future)

### Overview
- Gradient fills
- Pattern fills
- Multiple strokes
- Advanced stroke styles (dash patterns, caps, joins)

**Status**: Placeholder for future enhancement  
**Priority**: Medium  
**Complexity**: Medium-High

---

## Enhancement 6: Export Features (Future)

### Overview
- Export canvas to PNG
- Export canvas to SVG
- Export selected objects
- Export with custom resolution

**Status**: Placeholder for future enhancement  
**Priority**: High (for production)  
**Complexity**: Medium

---

## Enhancement 7: Undo/Redo System (Future)

### Overview
Implement command pattern for undo/redo of all operations.

**Status**: Placeholder for future enhancement  
**Priority**: High (for production)  
**Complexity**: High

---

## Enhancement 8: Keyboard Shortcuts (Future)

### Overview
Comprehensive keyboard shortcuts for all operations.

**Status**: Placeholder for future enhancement  
**Priority**: Medium  
**Complexity**: Medium

---

## Development Principles for Post-MVP

### 1. Maintain MVP Stability
- Never break existing functionality
- Ensure backward compatibility
- Test thoroughly before merging

### 2. Follow Existing Patterns
- Use established architecture patterns
- Maintain code consistency
- Follow React Architecture Guide

### 3. Incremental Implementation
- Implement one enhancement at a time
- Get user feedback before next enhancement
- Iterate based on real usage

### 4. Performance First
- Maintain 60 FPS target
- Monitor bundle size
- Optimize as needed

### 5. Documentation
- Create context summaries for each enhancement
- Update architecture docs
- Maintain clear code comments

---

## Questions for Implementation

Before implementing any post-MVP enhancement:

1. **Is the MVP stable and complete?**
2. **Has this enhancement been user-tested or requested?**
3. **Does this align with product vision?**
4. **Is the technical approach sound?**
5. **Will this impact performance?**
6. **Is the scope well-defined?**
7. **Do we have time/resources for this?**

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2025-10-19 | Initial post-MVP PRD |
|     |            | - Added Blend Modes feature spec |
|     |            | - Added placeholder enhancements |
|     |            | - Defined development principles |

---

**Ready to enhance?** 🎨

Begin with **Blend Modes** → Follow implementation checklist above.

