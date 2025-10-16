# CollabCanvas Task List

## Task Breakdown for MVP Development
**Project:** CollabCanvas MVP  
**Version:** 1.0

---

## Phase 1: Canvas Foundation (Priority: CRITICAL)

### 1.1 Project Setup & Configuration
- [x] Initialize Vite + React + TypeScript project
- [x] Install dependencies (react-konva, konva, firebase)
- [x] Configure Firebase project (Firestore + Anonymous Auth)
- [x] Set up environment variables
- [x] Configure TypeScript types for Konva and Firebase
- [x] Set up project folder structure per architecture guide
- [x] Configure path aliases in vite.config.ts

### 1.2 Firebase Integration
- [x] Create Firebase configuration service (`src/services/firebase.ts`)
- [x] Initialize Firestore connection
- [x] Set up Anonymous Authentication
- [x] Implement user creation on app load
- [x] Assign random color to new users
- [x] Create Firestore security rules
- [x] Deploy security rules to Firebase

### 1.3 Canvas Core Rendering
- [ ] Create Canvas component with Konva Stage
- [ ] Implement 10,000 x 10,000px canvas bounds
- [ ] Set canvas center to coordinate (0, 0)
- [ ] Render canvas full-screen in viewport
- [ ] Implement basic stage rendering loop
- [ ] Test performance: Verify 60 FPS baseline

### 1.4 Canvas Navigation (Pan/Zoom)
- [ ] Implement panning via mouse scroll
  - [ ] Horizontal scroll support
  - [ ] Vertical scroll support
- [ ] Implement zooming via Cmd/Ctrl + Scroll
  - [ ] Zoom in/out functionality
  - [ ] Focus zoom on cursor position
- [ ] Enforce canvas boundary constraints
  - [ ] Calculate viewport boundaries
  - [ ] Prevent panning beyond canvas edges
  - [ ] Clamp zoom to keep canvas visible
- [ ] Test edge cases: corners, max zoom, min zoom
- [ ] Performance test: Verify 60 FPS during pan/zoom

---

## Phase 2: Multiplayer Foundation (Priority: CRITICAL)

### 2.1 User Presence System
- [ ] Create User data model (TypeScript interface)
- [ ] Create Firestore `users` collection structure
- [ ] Implement user document creation on auth
- [ ] Store user data: id, color, displayName, lastActive
- [ ] Set up real-time listener for active users
- [ ] Implement user cleanup on disconnect
- [ ] Test: Multiple browser windows show presence

### 2.2 Cursor Synchronization
- [ ] Track local cursor position on canvas
- [ ] Convert screen coordinates to canvas coordinates
- [ ] Debounce cursor updates (≤50ms throttle)
- [ ] Update user's cursor position in Firestore
- [ ] Listen to other users' cursor positions
- [ ] Render multiplayer cursors on canvas
  - [ ] Create cursor component (colored pointer)
  - [ ] Add user ID label to cursor
  - [ ] Position cursor at correct canvas coordinates
- [ ] Test: Cursor sync between 2+ users under 50ms
- [ ] Test: Cursor removal on user disconnect

### 2.3 Session Management
- [ ] Create CanvasSession data model
- [ ] Initialize canvas session on app load
- [ ] Track active users in session
- [ ] Update lastActive timestamp (heartbeat)
- [ ] Handle user reconnection
- [ ] Test: Session persistence across refreshes

---

## Phase 3: Shape Creation (Priority: HIGH)

### 3.1 Shape Data Model
- [ ] Create Shape TypeScript interface
- [ ] Create Firestore `shapes` collection structure
- [ ] Define shape properties: id, type, x, y, width, height, fill, createdBy, lockedBy
- [ ] Set up real-time listener for shapes collection
- [ ] Implement shape synchronization logic

### 3.2 Toolbar UI
- [ ] Create Toolbar component (fixed to viewport)
- [ ] Add "Draw Rect" toggle button
- [ ] Implement button active/inactive states
- [ ] Manage drawing mode state (useState)
- [ ] Style toolbar: top position, clear visual feedback
- [ ] Test: Button toggle updates tool state

### 3.3 Rectangle Drawing Tool
- [ ] Implement press/drag/release interaction
  - [ ] Capture mousedown event (establish first vertex)
  - [ ] Track mousemove during drag (update dimensions)
  - [ ] Capture mouseup event (complete shape)
- [ ] Enforce canvas boundary constraints during draw
  - [ ] Clamp rectangle to canvas edges
  - [ ] Handle drag outside canvas bounds
- [ ] Render in-progress rectangle (local preview)
- [ ] Sync in-progress rectangle to Firestore (real-time)
- [ ] Fill rectangle with user's color
- [ ] Save completed rectangle to Firestore
- [ ] Test: Rectangle appears for all users in real-time
- [ ] Test: In-progress drawing visible to others
- [ ] Test: Cannot draw outside canvas boundaries

### 3.4 Shape Rendering
- [ ] Create Rectangle shape component (Konva.Rect)
- [ ] Render all shapes from Firestore state
- [ ] Apply shape properties: position, dimensions, color
- [ ] Optimize rendering for 500+ shapes
- [ ] Test: Shapes render correctly
- [ ] Test: Performance with 500+ shapes (60 FPS)

---

## Phase 4: Shape Manipulation (Priority: HIGH)

### 4.1 Shape Selection & Dragging
- [ ] Implement click-to-select shape
- [ ] Enable drag interaction on selected shapes
  - [ ] Capture drag start event
  - [ ] Track drag movement
  - [ ] Update shape position in real-time
  - [ ] Capture drag end event
- [ ] Enforce boundary constraints during drag
  - [ ] Clamp shape position to canvas edges
  - [ ] Prevent shape from moving outside bounds
- [ ] Sync shape position updates to Firestore
- [ ] Test: Drag-and-drop updates for all users
- [ ] Test: Shapes stay within canvas boundaries

### 4.2 Object Locking System
- [ ] Add `lockedBy` and `lockedAt` fields to Shape model
- [ ] Implement lock acquisition on drag start
  - [ ] Update Firestore: set lockedBy to current user
  - [ ] Set lockedAt timestamp
- [ ] Implement lock release on drag end
  - [ ] Update Firestore: clear lockedBy field
- [ ] Listen for lock changes from other users
- [ ] Disable interactions on locked shapes
  - [ ] Prevent drag if locked by another user
  - [ ] Show visual feedback (cursor change)
- [ ] Render lock indicator on locked shapes
  - [ ] Display 🔒 emoji overlay
  - [ ] Position indicator on shape
- [ ] Handle lock cleanup on disconnect
  - [ ] Set up Firestore onDisconnect handler
  - [ ] Release all locks owned by disconnected user
  - [ ] Cancel in-progress operations
- [ ] Test: Lock prevents concurrent editing
- [ ] Test: Lock indicator displays correctly
- [ ] Test: Lock released on user disconnect

---

## Phase 5: Polish & Optimization (Priority: MEDIUM)

### 5.1 Performance Optimization
- [ ] Profile rendering performance
- [ ] Optimize Firestore queries (indexes, limits)
- [ ] Implement cursor position throttling/debouncing
- [ ] Optimize shape rendering (React.memo, useCallback)
- [ ] Reduce unnecessary re-renders
- [ ] Test: Maintain 60 FPS with 5+ users
- [ ] Test: 500+ shapes without degradation

### 5.2 Error Handling & Edge Cases
- [ ] Handle Firestore connection errors
- [ ] Display error states to user
- [ ] Implement retry logic for failed operations
- [ ] Handle race conditions in locking system
- [ ] Validate shape data from Firestore
- [ ] Handle malformed data gracefully
- [ ] Test: Network disconnect/reconnect scenarios
- [ ] Test: Concurrent lock acquisition attempts

### 5.3 User Experience Polish
- [ ] Add loading states during initialization
- [ ] Show connection status indicator
- [ ] Improve cursor label positioning
- [ ] Add smooth animations for shape updates
- [ ] Ensure toolbar is always accessible
- [ ] Test: UX flows feel responsive and clear

---

## Phase 6: Testing & Deployment (Priority: CRITICAL)

### 6.1 Integration Testing
- [ ] Test: 2 users editing simultaneously
- [ ] Test: 5+ concurrent users
- [ ] Test: User refresh mid-edit (persistence)
- [ ] Test: Rapid shape creation (sync performance)
- [ ] Test: Canvas with 500+ shapes
- [ ] Test: All MVP acceptance criteria

### 6.2 Performance Validation
- [ ] Measure FPS during interactions
- [ ] Measure network sync latency
  - [ ] Object changes: <100ms
  - [ ] Cursor updates: <50ms
- [ ] Measure initial page load time (<2s)
- [ ] Profile memory usage
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)

### 6.3 Firebase Deployment
- [ ] Build production bundle (`npm run build`)
- [ ] Initialize Firebase Hosting
- [ ] Deploy to Firebase Hosting
- [ ] Configure custom domain (optional)
- [ ] Test deployed app with multiple users
- [ ] Verify all features work in production
- [ ] Monitor Firestore usage/quota

### 6.4 Documentation
- [ ] Create README with setup instructions
- [ ] Document architecture decisions
- [ ] Add inline code documentation
- [ ] Create deployment guide
- [ ] Document known limitations

---

## Phase 7: Submission Preparation (Priority: CRITICAL)

### 7.1 Demo Video
- [ ] Record 3-5 minute demo video
- [ ] Show: Real-time collaboration (2+ users)
- [ ] Show: Canvas pan/zoom functionality
- [ ] Show: Rectangle drawing and manipulation
- [ ] Show: Object locking system
- [ ] Show: Cursor presence and sync
- [ ] Explain: Architecture overview
- [ ] Upload video to YouTube/Loom

### 7.2 AI Development Log
- [ ] Document AI tools used (Cursor IDE, etc.)
- [ ] List 3-5 effective prompts
- [ ] Estimate AI-generated vs hand-written code %
- [ ] Describe AI strengths and limitations
- [ ] Summarize key learnings
- [ ] Format as 1-page document

### 7.3 Repository & Submission
- [ ] Clean up code and remove console.logs
- [ ] Ensure all files committed to GitHub
- [ ] Write comprehensive README
- [ ] Include deployed link in README
- [ ] Add architecture diagram to repo
- [ ] Verify repo is public
- [ ] Submit: GitHub repo URL
- [ ] Submit: Demo video link
- [ ] Submit: Deployed app URL
- [ ] Submit: AI Development Log

---

## Critical Path (MVP Checkpoint)

**Must be completed for MVP:**
- ✅ Project setup and Firebase configuration
- Canvas rendering with pan/zoom
- Canvas boundary enforcement
- Anonymous user creation
- User presence system
- Multiplayer cursor sync
- At least one shape type (rectangle)
- Basic shape creation (draw)
- Basic shape movement (drag)
- Real-time sync between 2+ users
- Deployed and publicly accessible

**Verification:** Demo to another person in 2 browser windows showing simultaneous editing.

---

## Risk Mitigation

### High-Risk Items
1. **Real-time sync performance** - Start early, test frequently
2. **Object locking race conditions** - Implement early, test edge cases
3. **Canvas boundary math** - Test thoroughly with edge cases
4. **Firestore quota limits** - Monitor usage, optimize queries

### Backup Plans
- If Konva.js issues → Consider HTML5 Canvas fallback
- If Firestore issues → Consider Supabase as alternative
- If deployment issues → Use Vercel as backup hosting

---

## Notes for Cursor AI Agent

- Follow React architecture guide for all component development
- Use functional components with hooks exclusively
- Implement TypeScript types for all data structures
- Follow feature-based folder structure
- Prioritize real-time sync reliability over features
- Test each phase incrementally before moving to next
- Focus on MVP checklist - no additional features