# CollabCanvas Documentation

> **Project**: Real-Time Collaborative Design Tool  
> **Tech Stack**: React + TypeScript + Konva.js + Firebase (Firestore + Realtime Database)  
> **Development Approach**: AI-assisted development with Cursor IDE

---

## 📚 Documentation Overview

This folder contains comprehensive documentation for building CollabCanvas, a Figma-inspired collaborative canvas application. All documents are optimized for consumption by AI development agents.

---

## 📄 Core Documents

### 1. [PRD.md](./PRD.md) - Product Requirements Document
**Purpose**: Complete feature specifications and requirements  
**When to Use**: Understanding what to build and acceptance criteria  

**Contains**:
- Feature specifications for 3 development stages
- Functional and technical requirements
- Data models and schemas
- UI/UX specifications
- Acceptance criteria for each feature
- Performance targets

**Key Sections**:
- Stage 1: Canvas with Pan/Zoom
- Stage 2: User Authentication & Presence
- Stage 3: Display Objects (Shapes)
- Appendices: Color palette, database schema, keyboard shortcuts

---

### 2. [TASK_LIST.md](./TASK_LIST.md) - Implementation Task List
**Purpose**: Sequential implementation guide with 30 tasks  
**When to Use**: Step-by-step development workflow  

**Contains**:
- 30 sequential tasks organized by stage
- Detailed implementation actions for each task
- Verification checklists
- Files to create/modify
- Code examples and patterns

**Task Breakdown**:
- Setup: 2 tasks (project init, Firebase config)
- Stage 1: 5 tasks (canvas, grid, pan, zoom, performance)
- Stage 2: 5 tasks (auth, presence, sidebar, cursors, testing)
- Stage 3: 14 tasks (shapes, selection, manipulation, properties)
- Final: 4 tasks (integration, documentation, deployment)

---

### 3. [ARCHITECTURE.md](./ARCHITECTURE.md) - System Architecture
**Purpose**: High-level system design and technical architecture  
**When to Use**: Understanding system structure and design decisions  

**Contains**:
- System architecture diagrams
- Component hierarchy
- Data flow diagrams
- Database schemas (Firestore + Realtime Database)
- Real-time synchronization architecture
- Coordinate system design
- Performance optimization strategies
- Code examples for key patterns

**Key Sections**:
- Feature module organization
- State management strategy
- Dual-database architecture
- Real-time sync flows
- Performance targets
- Security considerations

---

## 🚀 Getting Started

### For Human Developers

1. **Start here**: Read [PRD.md](./PRD.md) to understand the product
2. **Plan work**: Review [TASK_LIST.md](./TASK_LIST.md) for implementation order
3. **Understand system**: Consult [ARCHITECTURE.md](./ARCHITECTURE.md) for design decisions
4. **Begin coding**: Follow Task List sequentially, starting with SETUP-1

### For AI Agents (Cursor IDE)

1. **Load context**: Read all three documents to understand the full project
2. **Follow sequence**: Execute tasks from [TASK_LIST.md](./TASK_LIST.md) in order
3. **Reference architecture**: Consult [ARCHITECTURE.md](./ARCHITECTURE.md) for implementation patterns
4. **Verify requirements**: Check [PRD.md](./PRD.md) acceptance criteria after each task
5. **Request approval**: Wait for human verification before proceeding to next task

---

## 🏗️ Project Structure

```
CollabCanvas/
├── _docs/                          # This folder - All documentation
│   ├── README.md                   # This file
│   ├── PRD.md                      # Product requirements
│   ├── TASK_LIST.md                # Implementation tasks
│   ├── ARCHITECTURE.md             # System architecture
│   └── react-architecture-guide.md # (Optional) React patterns reference
│
├── src/                            # Application source code
│   ├── api/                        # Firebase configuration
│   ├── components/                 # Shared UI components
│   ├── features/                   # Feature modules
│   │   ├── canvas/                 # Canvas viewport
│   │   ├── auth/                   # Authentication
│   │   ├── presence/               # User presence
│   │   └── shapes/                 # Shape objects
│   ├── hooks/                      # Custom React hooks
│   ├── types/                      # TypeScript types
│   ├── utils/                      # Utility functions
│   └── App.tsx                     # Root component
│
├── firebase.json                   # Firebase config
├── firestore.rules                 # Firestore security rules
├── database.rules.json             # Realtime Database rules
├── package.json                    # Dependencies
└── vite.config.ts                  # Build configuration
```

---

## 🎯 Development Stages

### Stage 1: Canvas with Pan/Zoom ✅
**Goal**: Build foundational canvas infrastructure  
**Duration**: ~5 tasks  
**Deliverables**:
- 10,000 x 10,000 pixel canvas
- Smooth pan and zoom
- Grid background with scaling
- 60 FPS performance

### Stage 2: User Authentication & Presence ✅
**Goal**: Implement multiplayer infrastructure  
**Duration**: ~5 tasks  
**Deliverables**:
- Anonymous + Google OAuth
- Real-time user presence
- Cursor synchronization (<50ms)
- User sidebar

### Stage 3: Display Objects (Shapes) ✅
**Goal**: Create and manipulate shapes collaboratively  
**Duration**: ~14 tasks  
**Deliverables**:
- Rectangle, circle, line creation
- Selection and locking
- Drag, resize, rotate
- Properties panel
- Real-time sync (<300ms)
- Z-index management

### Stage 4: AI Canvas Agent 🔮
**Goal**: Natural language canvas manipulation  
**Status**: Not in current scope (future)  
**Note**: Architecture designed to support future AI integration

---

## 🗄️ Database Architecture

### Firebase Realtime Database (Real-time sync)
**Purpose**: High-frequency, low-latency operations  
**Latency**: <50ms  
**Data**:
- User presence (`/presence/main/{userId}`)
- Cursor positions (updated every 50ms)
- Connection heartbeats (every 5s)

**Why**: Ultra-fast synchronization for ephemeral data

### Firestore (Persistent data)
**Purpose**: Structured, queryable, persistent data  
**Latency**: 100-300ms  
**Data**:
- User profiles (`/users/{userId}`)
- Shape objects (`/documents/main/shapes/{shapeId}`)
- Document metadata

**Why**: Complex queries, transactions, data persistence

---

## 📊 Performance Targets

| Metric | Target | Database |
|--------|--------|----------|
| Frame Rate | 60 FPS | N/A |
| Cursor Sync | <50ms | Realtime DB |
| Shape Sync | <300ms | Firestore |
| Max Shapes | 500+ | N/A |
| Max Users | 5+ | Both |
| Initial Load | <3s | Both |

---

## 🔧 Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript (strict mode)
- **Canvas**: Konva.js + react-konva
- **State**: Context API + useReducer
- **Build**: Vite
- **Styling**: CSS Modules or Tailwind CSS

### Backend (Firebase)
- **Persistent DB**: Firestore
- **Real-time DB**: Firebase Realtime Database
- **Auth**: Firebase Auth (Anonymous + Google)
- **Hosting**: Firebase Hosting

### Development Tools
- **IDE**: Cursor with AI assistance
- **Linting**: ESLint + TypeScript
- **Type Checking**: TypeScript strict mode

---

## 📝 Document Conventions

### For AI Agents
- All code examples use TypeScript with strict mode
- File paths are relative to project root
- Tasks must be completed sequentially
- Verification required before proceeding
- No deadlines or time estimates included

### Document Format
- Markdown with clear hierarchies
- Code blocks with language specifications
- Diagrams using ASCII art
- Examples for all patterns
- Decision trees for architecture choices

---

## 🔍 Quick Reference

### Find Information About...

| Topic | Document | Section |
|-------|----------|---------|
| What to build | PRD.md | Feature Stages 1-3 |
| How to build | TASK_LIST.md | Sequential Tasks |
| Why these choices | ARCHITECTURE.md | Design Decisions |
| Data models | PRD.md + ARCHITECTURE.md | Data Structures, Schemas |
| Performance | ARCHITECTURE.md | Performance Targets |
| Database choice | ARCHITECTURE.md | Database Selection |
| Component structure | ARCHITECTURE.md | Component Hierarchy |
| State management | ARCHITECTURE.md | State Flow |
| Real-time sync | ARCHITECTURE.md | Sync Architecture |
| Security rules | ARCHITECTURE.md | Security Section |

---

## ⚠️ Important Notes

### For Development
1. **Sequential execution**: Tasks in TASK_LIST.md must be done in order
2. **Strict TypeScript**: All code uses strict mode - no implicit any
3. **Dual database**: Use Realtime DB for speed, Firestore for persistence
4. **Performance first**: 60 FPS is non-negotiable
5. **Open security**: Development uses open Firebase rules (update for production)

### Out of Scope (Current MVP)
- ❌ AI Canvas Agent (Stage 4)
- ❌ Undo/redo functionality
- ❌ Image upload
- ❌ Advanced text editing
- ❌ Export to PNG/SVG
- ❌ Multiple documents
- ❌ Mobile optimization

---

## 🤝 Development Workflow

### Task Execution Pattern

```
1. Read task in TASK_LIST.md
   ↓
2. Reference PRD.md for requirements
   ↓
3. Consult ARCHITECTURE.md for patterns
   ↓
4. Implement task
   ↓
5. Verify with checklist
   ↓
6. Request human approval
   ↓
7. Proceed to next task
```

### Commit Strategy

```bash
# Format: [TASK-ID] Brief description
git commit -m "[STAGE1-1] Setup basic canvas with Konva"
git commit -m "[STAGE2-3] Implement user presence sidebar"
git commit -m "[STAGE3-5] Add shape transformation handlers"
```

---

## 📖 Additional Resources

### External Documentation
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Konva.js Documentation](https://konvajs.org/docs/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [Realtime Database Guide](https://firebase.google.com/docs/database)

### Related Files
- React Architecture Guide: `react-architecture-guide.md` (if available in this folder)
- Assignment Brief: Project requirements (external)
- Grading Rubric: Evaluation criteria (external)

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: Tasks seem out of order  
**Solution**: Always follow TASK_LIST.md sequentially - do not skip

**Issue**: Unclear requirements  
**Solution**: Check PRD.md acceptance criteria for that feature

**Issue**: Architecture confusion  
**Solution**: Reference ARCHITECTURE.md diagrams and decision trees

**Issue**: Performance problems  
**Solution**: Check ARCHITECTURE.md performance optimization section

**Issue**: Database choice unclear  
**Solution**: See "Database Selection Quick Reference" in ARCHITECTURE.md

---

## 📞 Support

### For Human Developers
- Review all three documents thoroughly before starting
- Follow Task List sequentially
- Request clarification if requirements are ambiguous

### For AI Agents
- If blocked, document the issue and request guidance
- Never skip tasks or make assumptions
- Always verify with acceptance criteria
- Request human approval at task completion gates

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-16 | Initial documentation created |
|     |            | - PRD with 3 development stages |
|     |            | - Task List with 30 sequential tasks |
|     |            | - Architecture with dual-database design |

---

## 📄 License

This documentation is part of the CollabCanvas project.  
See project root for license information.

---

**Ready to start building?** 🚀

Begin with **[TASK_LIST.md](./TASK_LIST.md)** → **SETUP-1: Initialize Project Structure**