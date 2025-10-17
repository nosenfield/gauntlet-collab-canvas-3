# CollabCanvas MVP

> **Real-time collaborative design tool** built with React + TypeScript + Konva.js + Firebase

A Figma-inspired multiplayer canvas application with sub-100ms cursor synchronization, infinite pan/zoom workspace, and robust presence tracking. Built following strict architectural principles with comprehensive AI-assisted development documentation.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up Firebase configuration
cp src/api/firebaseConfig.example.ts src/api/firebaseConfig.ts
# Edit firebaseConfig.ts with your Firebase project credentials

# Start development server
npm run dev

# Open http://localhost:5173
```

---

## ✨ Features

### ✅ Stage 1: Canvas with Pan/Zoom (Complete)
- **10,000 x 10,000px infinite canvas** with boundary constraints
- **Smooth pan** - Click and drag to navigate
- **Cursor-centered zoom** - Cmd/Ctrl + Scroll for intuitive zooming
- **Intelligent grid background** - Dual-tier lines (100px primary, 500px secondary)
- **60 FPS performance** - Optimized rendering with viewport culling
- **Responsive design** - Adapts to window resize

### ✅ Stage 2: User Authentication & Presence (Complete)
- **Anonymous authentication** - Quick guest access
- **Google OAuth** - Sign in with Google account
- **Real-time user presence** - See who's online (<50ms cursor latency)
- **Per-tab presence tracking** - Elegant multi-tab support with immediate cleanup
- **User presence sidebar** - Color-coded user list with live updates
- **Remote cursors** - See other users' cursors in real-time with labels
- **Session persistence** - State maintained across page refreshes

### 🚧 Stage 3: Display Objects (In Progress)
- Shape creation (rectangles, circles, lines)
- Shape selection and transformation
- Collaborative locking system
- Properties panel
- Z-index management
- Real-time shape synchronization

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18+ with TypeScript (strict mode)
- Konva.js for canvas rendering
- Context API + useReducer for state management
- Vite for blazing-fast builds
- CSS Modules for styling

**Backend (Firebase):**
- **Firestore** - Persistent data (users, shapes)
- **Realtime Database** - Ephemeral data (presence, cursors)
- **Firebase Auth** - Anonymous + Google OAuth
- **Firebase Hosting** - Deployment

### Project Structure

```
src/
├── api/                    # Firebase configuration
├── features/               # Feature modules
│   ├── auth/              # Authentication system
│   ├── canvas/            # Canvas viewport & controls
│   ├── presence/          # User presence & cursors
│   └── shapes/            # Display objects (Stage 3)
├── types/                 # TypeScript interfaces
├── utils/                 # Helper functions
└── App.tsx                # Root component
```

**Key Architectural Decisions:**
- **Feature-based organization** - Co-located code by domain
- **Service layer pattern** - All Firebase logic abstracted
- **Custom hooks** - Reusable, testable business logic
- **Dual-database architecture** - Right tool for each data type
  - Realtime DB: <50ms cursor updates (high-frequency)
  - Firestore: 100-300ms shape updates (complex queries)

---

## 📚 Documentation

Comprehensive documentation for AI-assisted development:

### Core Documents (in `_docs/` folder)
- **PRD.md** - Product Requirements Document (complete feature specs)
- **TASK_LIST.md** - 30 sequential implementation tasks with verification checklists
- **ARCHITECTURE.md** - System design, data flows, performance targets
- **react-architecture-guide.md** - React development standards

### Context Summaries (in `context-summaries/` folder)
- 13 detailed task summaries documenting technical decisions
- ~6,000 lines of implementation context
- Code patterns, lessons learned, known issues
- Created after each completed task for continuity

### Development Rules
- `.cursorrules` - AI agent guidelines for consistent development
- Includes task execution protocol, code standards, testing requirements

---

## 🎯 Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Frame Rate | 60 FPS | ✅ Achieved |
| Cursor Sync | <50ms | ✅ 20-40ms |
| Shape Sync | <300ms | 🚧 Stage 3 |
| Initial Load | <3s | ✅ ~1.6s |
| Max Shapes | 500+ | 🚧 Stage 3 |
| Max Users | 5+ | ✅ Tested |

---

## 🧪 Testing

### Manual Testing
```bash
# Run development server
npm run dev

# Open multiple browser windows to test multiplayer
# - Sign in with different accounts
# - Test cursor synchronization
# - Verify presence sidebar updates
# - Test multi-tab behavior
```

### Performance Monitoring
- Chrome DevTools Performance tab for FPS tracking
- Built-in `performanceMonitor.ts` for canvas operations
- Firebase Console for database latency metrics

---

## 🔧 Development

### Prerequisites
- Node.js 18+ and npm
- Firebase project with:
  - Firestore enabled
  - Realtime Database enabled
  - Authentication enabled (Anonymous + Google)

### Setup Firebase
1. Create Firebase project at https://console.firebase.google.com
2. Enable Firestore, Realtime Database, and Authentication
3. Copy config to `src/api/firebaseConfig.ts`
4. Update Firestore security rules (see `_docs/ARCHITECTURE.md`)

### Development Workflow
```bash
# Start dev server with hot reload
npm run dev

# Run type checking
npm run build

# Run linter
npm run lint
```

### Git Workflow
```bash
# Commit format: [STAGE#-TASK#] Description
git commit -m "[STAGE3-1] Implement shape data model"
```

---

## 📈 Current Status

**Development Phase:** Stage 2 Complete, Stage 3 Ready  
**Tasks Completed:** 12 / 30 (40%)  
**Build Status:** Passing ✅  
**TypeScript Errors:** 0  
**ESLint Warnings:** 0

**Last Updated:** October 17, 2025

---

## 🎓 Key Technical Achievements

### 1. Per-Tab Presence Architecture
Innovative approach to multi-tab presence tracking:
- Each tab maintains independent presence entry in Realtime Database
- Server-side `onDisconnect()` guarantees cleanup within 1-2 seconds
- Listener aggregates tabs per user for clean API
- 40% code reduction vs. complex localStorage coordination

### 2. Cursor-Centered Zoom Mathematics
Professional-grade zoom behavior:
```typescript
// Transform calculation preserves cursor position during zoom
const mousePointTo = {
  x: (pointer.x - stage.x()) / stage.scaleX(),
  y: (pointer.y - stage.y()) / stage.scaleY(),
};
const newPos = {
  x: pointer.x - mousePointTo.x * newScale,
  y: pointer.y - mousePointTo.y * newScale,
};
```

### 3. Viewport Culling Optimization
Grid rendering optimization:
- Only draws grid lines visible in current viewport
- Recalculates on pan/zoom for 60 FPS performance
- Prevents rendering 10,000px worth of grid lines unnecessarily

---

## 🚫 Out of Scope (MVP)

Features intentionally excluded from current MVP:
- Undo/redo functionality
- Multiple shape types beyond primitives
- Advanced text editing
- Image upload and embedding
- Export to PNG/SVG
- Multiple documents/projects
- Mobile touch optimization
- AI Canvas Agent (planned for Stage 4)

---

## 🤝 Contributing

This is an AI-assisted development project following strict architectural rules.

**Before contributing:**
1. Read `_docs/PRD.md` for feature specifications
2. Review `_docs/TASK_LIST.md` for implementation order
3. Check `.cursorrules` for development guidelines
4. Read recent context summaries in `context-summaries/`

**Development standards:**
- TypeScript strict mode required
- ESLint must pass with no warnings
- 60 FPS performance maintained
- Context summary created after each task
- Feature modules follow established patterns

---

## 📄 License

This project is part of an educational assignment for GauntletAI Week 1.

---

## 🔗 Resources

- [React Documentation](https://react.dev)
- [Konva.js Documentation](https://konvajs.org/docs/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 💡 Quick Tips

**For AI Agents:**
- Start by reading `SESSION_SUMMARY.md` for current state
- Always reference `_docs/TASK_LIST.md` before implementing
- Follow task sequence strictly - don't skip ahead
- Create context summary after completing each task

**For Human Developers:**
- Press `A` key to toggle debug auth panel
- Use Chrome DevTools Performance tab to verify 60 FPS
- Check Firebase Console for real-time database updates
- Review context summaries for technical decisions

---

**Status:** ✅ Stage 1 & 2 Complete | 🚧 Stage 3 In Progress  
**Next Task:** STAGE3-1 (Shape Data Model & Firestore Setup)

*Built with ❤️ using AI-assisted development in Cursor IDE*
