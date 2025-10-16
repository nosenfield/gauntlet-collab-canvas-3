# CollabCanvas PRD

## Product Requirements Document
**Project:** CollabCanvas MVP  
**Version:** 1.0  
**Last Updated:** October 15, 2025  
**Status:** MVP Development

---

## 1. Executive Summary

CollabCanvas is a real-time collaborative canvas application that enables multiple users to simultaneously create and manipulate shapes on a shared workspace. The MVP focuses on establishing robust multiplayer infrastructure with anonymous user presence, cursor synchronization, and basic shape creation capabilities.

---

## 2. Product Overview

### 2.1 Vision
Build the foundational infrastructure for a Figma-like collaborative design tool, prioritizing real-time synchronization and conflict-free concurrent editing.

### 2.2 Target Users
- Designers exploring collaborative workflows
- Teams needing real-time visual collaboration
- Developers learning multiplayer application architecture

### 2.3 Success Metrics (MVP)
- Support 5+ concurrent users without performance degradation
- Maintain 60 FPS during all canvas interactions
- Sync object changes across users in <100ms
- Sync cursor positions in <50ms
- Zero state conflicts during concurrent editing

---

## 3. Core Features (MVP Scope)

### 3.1 Canvas System

**3.1.1 Canvas Workspace**
- Fixed 10,000 x 10,000 pixel canvas
- Canvas center positioned at coordinate (0, 0)
- Full-screen viewport display
- Hard boundary constraints (cannot pan beyond edges)

**3.1.2 Navigation**
- **Panning:** Mouse scroll (horizontal/vertical)
- **Zooming:** Cmd/Ctrl + Scroll
- Zoom focal point: User's cursor position
- Maintain canvas boundaries during all navigation
- Viewport cannot display area outside canvas bounds

**3.1.3 Performance Requirements**
- 60 FPS during pan/zoom operations
- Smooth rendering with 500+ objects on canvas
- No visible lag during concurrent user actions

### 3.2 User System

**3.2.1 Anonymous Authentication**
- Automatic anonymous user creation on app load
- No login/signup required for MVP
- Persistent user session until browser close/refresh

**3.2.2 User Identity**
- Each user assigned a unique color (from predefined palette)
- Display name: User ID (e.g., "user_abc123")
- User color used for cursor and created shapes

**3.2.3 Presence Awareness**
- Real-time display of all active users' cursors
- Cursor appearance: Colored pointer with user ID label
- Cursor updates synced in <50ms
- Automatic removal when user disconnects/leaves

### 3.3 Shape Creation & Manipulation

**3.3.1 Rectangle Tool**
- Toggle on/off via "Draw Rect" button in top toolbar
- Drawing interaction: Press → Drag → Release
  - **Press:** Establish first vertex
  - **Drag:** Size the rectangle (visible to all users in real-time)
  - **Release:** Complete shape creation
- Created rectangles filled with creator's user color
- In-progress drawings visible to all users

**3.3.2 Shape Persistence**
- All completed shapes saved to Firestore
- Shapes persist across sessions and browser refreshes
- Shapes remain after creator disconnects

**3.3.3 Shape Repositioning**
- Drag-and-drop to move completed shapes
- Shape movement visible to all users in real-time
- Shapes must remain within canvas boundaries

**3.3.4 Object Locking**
- When user is drawing/dragging a shape:
  - Object locked for that user exclusively
  - Visual indicator: 🔒 emoji displayed on locked object
  - Other users cannot interact with locked object
- If user disconnects mid-drag:
  - Operation cancelled automatically
  - Object lock released immediately
  - Partial/incomplete operations reverted

### 3.4 User Interface

**3.4.1 Toolbar**
- Fixed position (does not move with pan/zoom)
- Located at top of viewport
- Contains: "Draw Rect" toggle button
- Visual state: Active/inactive indication

**3.4.2 Viewport**
- Full browser window coverage
- No scrollbars (panning via mouse scroll)
- Canvas boundaries enforced visually

---

## 4. Technical Architecture

### 4.1 Technology Stack
- **Frontend:** React 18+ with TypeScript
- **Canvas Rendering:** Konva.js + react-konva
- **Backend/Database:** Firebase Firestore
- **Authentication:** Firebase Anonymous Auth
- **Real-time Sync:** Firestore real-time listeners
- **Deployment:** Firebase Hosting
- **Build Tool:** Vite

### 4.2 Data Models

**4.2.1 User Document**
```typescript
interface User {
  id: string;
  color: string;
  displayName: string;
  lastActive: timestamp;
  cursorPosition: { x: number; y: number };
}
```

**4.2.2 Shape Document**
```typescript
interface Shape {
  id: string;
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  createdBy: string;
  createdAt: timestamp;
  lockedBy?: string;
  lockedAt?: timestamp;
}
```

**4.2.3 Canvas Session Document**
```typescript
interface CanvasSession {
  id: string;
  activeUsers: string[];
  lastModified: timestamp;
}
```

### 4.3 Real-time Sync Strategy
- Firestore real-time listeners for:
  - Active users collection
  - Shapes collection
  - User cursor positions
- Optimistic updates for local user actions
- Server reconciliation for conflicts (last-write-wins for MVP)
- Debounced cursor position updates (16ms / 60fps)

---

## 5. Feature Constraints & Exclusions (MVP)

### 5.1 Explicitly Out of Scope
- ❌ User accounts / email authentication
- ❌ Editable user display names
- ❌ Multiple shape types (only rectangles in MVP)
- ❌ Shape colors/styling customization
- ❌ Shape selection UI (multi-select, bounding boxes)
- ❌ Delete/undo/redo operations
- ❌ Copy/paste/duplicate
- ❌ Layer management / z-index control
- ❌ Shape transformations (resize, rotate)
- ❌ Text layers
- ❌ AI agent integration
- ❌ Export/save functionality
- ❌ Keyboard shortcuts (beyond Cmd+Scroll for zoom)

### 5.2 Known Limitations
- Anonymous users lose identity on browser refresh
- No conflict resolution beyond last-write-wins
- Single canvas per deployment (no multi-canvas support)
- No history/version control

---

## 6. User Experience Requirements

### 6.1 Performance
- Initial page load: <2 seconds
- Time to first meaningful paint: <1 second
- Canvas interaction response: <16ms (60 FPS)
- Network sync latency: <100ms

### 6.2 Reliability
- Graceful handling of network disconnections
- Automatic reconnection without data loss
- Stale lock cleanup on user disconnect

### 6.3 Usability
- Zero-learning-curve for basic canvas navigation
- Clear visual feedback for all user actions
- Obvious presence indicators for collaborators

---

## 7. Testing Requirements

### 7.1 MVP Acceptance Criteria
- [ ] Canvas renders at 10,000 x 10,000 pixels
- [ ] Pan/zoom maintains 60 FPS
- [ ] Canvas boundaries enforced (cannot pan outside)
- [ ] Zoom focuses on cursor position
- [ ] Anonymous users created automatically
- [ ] Each user assigned unique color
- [ ] User cursors visible to all users in <50ms
- [ ] User presence updates on connect/disconnect
- [ ] "Draw Rect" button toggles tool state
- [ ] Rectangles drawn via press/drag/release
- [ ] In-progress drawings visible to all users
- [ ] Completed shapes saved and persist
- [ ] Shapes filled with creator's color
- [ ] Shapes can be repositioned via drag-drop
- [ ] Shapes stay within canvas boundaries
- [ ] 🔒 indicator appears on locked objects
- [ ] Lock released on user disconnect
- [ ] 2+ users can edit simultaneously without conflicts
- [ ] App remains stable with 500+ shapes
- [ ] 5+ concurrent users supported without degradation

### 7.2 Test Scenarios
1. **Multi-user concurrent editing:** 3 users creating and moving shapes simultaneously
2. **Network disconnect:** User disconnects mid-drag, shape operation cancelled
3. **Performance stress:** 500 shapes on canvas, multiple users panning/zooming
4. **Boundary enforcement:** Attempt to create/move shapes outside canvas bounds
5. **Session persistence:** Create shapes, refresh browser, verify shapes remain

---

## 8. Deployment Requirements

### 8.1 Hosting
- Deploy to Firebase Hosting
- Public URL accessible
- Support 5+ concurrent connections

### 8.2 Environment
- Production Firebase project (not local emulator)
- Anonymous auth enabled
- Firestore in production mode with security rules

### 8.3 Security Rules (Firestore)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 9. Future Considerations (Post-MVP)

While explicitly out of scope for MVP, architectural decisions should consider:
- AI agent canvas manipulation (function calling API)
- Additional shape types (circles, lines, text)
- Shape styling and customization
- Advanced selection and transformation tools
- User accounts and permissions
- Canvas history and version control
- Export capabilities

---

## 10. Open Questions

1. Color palette for user assignment - how many colors needed? **Answer: Random color generation**
2. Maximum concurrent user limit for MVP testing? **Answer: 5+ users**
3. Firestore quota limits - will free tier support MVP testing? **Answer: Yes**
4. Cursor update frequency - balance between smoothness and bandwidth? **Answer: ≤50ms**

---

**Approval Required Before Development:**
- [ ] Product Owner approval
- [ ] Technical architecture review
- [ ] Firebase project setup complete
- [ ] Success metrics defined and measurable