# CollabCanvas Project Structure

## Overview
This document describes the feature-based folder structure for the CollabCanvas application.

## Directory Layout

```
collab-canvas-3/
├── _docs/                          # Project documentation
│   ├── PRD.md                      # Product requirements
│   ├── TASK_LIST.md                # Implementation tasks
│   ├── ARCHITECTURE.md             # System architecture
│   └── README.md                   # Documentation guide
│
├── context-summaries/              # Task completion summaries
│   ├── README.md
│   └── TEMPLATE.md
│
├── src/                            # Application source code
│   ├── api/                        # Firebase configuration
│   │   └── firebase.ts             # Firebase initialization (to be created)
│   │
│   ├── components/                 # Shared UI components
│   │   ├── atoms/                  # Basic building blocks (Button, Input, etc.)
│   │   ├── molecules/              # Composite components (Toolbar, Panel)
│   │   └── organisms/              # Complex components (Modal, LoadingOverlay)
│   │
│   ├── features/                   # Feature modules (domain-driven)
│   │   ├── canvas/                 # Canvas viewport management
│   │   │   ├── components/         # Canvas, GridBackground
│   │   │   ├── hooks/              # useCanvasSize, usePan, useZoom
│   │   │   ├── store/              # viewportStore (Context + useReducer)
│   │   │   └── utils/              # coordinateTransform, gridUtils
│   │   │
│   │   ├── auth/                   # User authentication
│   │   │   ├── components/         # AuthModal
│   │   │   ├── hooks/              # useAuth
│   │   │   ├── services/           # authService (Firebase Auth)
│   │   │   └── store/              # authStore (Context + useReducer)
│   │   │
│   │   ├── presence/               # Real-time user presence
│   │   │   ├── components/         # UserPresenceSidebar, RemoteCursors
│   │   │   ├── hooks/              # usePresence, useActiveUsers, useCursorTracking
│   │   │   ├── services/           # presenceService (Realtime Database)
│   │   │   └── store/              # presenceStore (Context + useReducer)
│   │   │
│   │   └── shapes/                 # Display objects (shapes)
│   │       ├── components/         # ShapeRenderer, Rectangle, Circle, Line
│   │       ├── hooks/              # useShapes, useSelection, useShapeTransform
│   │       ├── services/           # shapeService (Firestore CRUD)
│   │       ├── store/              # shapesStore, selectionStore, toolStore
│   │       ├── utils/              # geometryUtils, viewportCulling
│   │       └── constants/          # defaultShapeProps
│   │
│   ├── hooks/                      # Shared custom React hooks
│   │
│   ├── services/                   # Shared business logic services
│   │
│   ├── store/                      # Global state management
│   │
│   ├── types/                      # TypeScript type definitions
│   │   ├── firebase.ts             # User, UserPresence, Shape (to be created)
│   │   └── canvas.ts               # ViewportState, CanvasConfig (to be created)
│   │
│   ├── utils/                      # Utility functions
│   │   ├── debounce.ts             # Debouncing utility (to be created)
│   │   ├── throttle.ts             # Throttling utility (to be created)
│   │   └── performanceMonitor.ts   # Performance tracking (to be created)
│   │
│   ├── App.tsx                     # Root component
│   ├── App.css                     # Root component styles
│   ├── main.tsx                    # Application entry point
│   └── index.css                   # Global styles
│
├── dist/                           # Production build output
├── node_modules/                   # Dependencies
│
├── .cursorrules                    # Cursor AI development rules
├── .gitignore                      # Git ignore patterns
├── eslint.config.js                # ESLint configuration
├── index.html                      # HTML template
├── package.json                    # Project dependencies and scripts
├── tsconfig.json                   # TypeScript configuration (root)
├── tsconfig.app.json               # TypeScript config for app code
├── tsconfig.node.json              # TypeScript config for build tools
├── vite.config.ts                  # Vite build configuration
└── PROJECT_STRUCTURE.md            # This file
```

## Key Principles

### Feature-Based Organization
- Each feature is self-contained in its own directory
- Features include: canvas, auth, presence, shapes
- Each feature has its own components, hooks, services, and stores

### Separation of Concerns
- **components/**: Reusable UI components (atoms, molecules, organisms)
- **features/**: Domain-specific feature modules
- **hooks/**: Shared React hooks
- **services/**: Business logic and API calls
- **store/**: State management (Context API + useReducer)
- **types/**: TypeScript type definitions
- **utils/**: Pure utility functions

### Database Strategy
- **Firestore**: Persistent data (shapes, user profiles)
- **Realtime Database**: High-frequency data (cursors, presence)

### State Management
- **Local State**: useState/useReducer for component-local state
- **Shared State**: Context API + useReducer for feature state
- **Server State**: Firebase real-time listeners

## File Naming Conventions

### Components
- PascalCase: `Canvas.tsx`, `GridBackground.tsx`
- One component per file

### Hooks
- camelCase with "use" prefix: `useAuth.ts`, `useCanvasSize.ts`

### Services
- camelCase with "Service" suffix: `authService.ts`, `shapeService.ts`

### Stores
- camelCase with "Store" suffix: `authStore.ts`, `shapesStore.ts`

### Utils
- camelCase: `debounce.ts`, `coordinateTransform.ts`

### Types
- PascalCase for interfaces: `User`, `Shape`, `ViewportState`

## Development Workflow

### Adding a New Feature
1. Create feature directory: `src/features/[feature-name]/`
2. Add subdirectories: `components/`, `hooks/`, `services/`, `store/`
3. Implement feature components
4. Export from feature index file (optional)

### Adding a Shared Component
1. Determine component type: atom, molecule, or organism
2. Create in appropriate subdirectory
3. Use TypeScript with strict mode
4. Export from component file

### Adding a Custom Hook
1. Create in `src/hooks/` if shared across features
2. Create in `src/features/[feature]/hooks/` if feature-specific
3. Use "use" prefix in filename and function name
4. Type all parameters and return values

## TypeScript Configuration

### Strict Mode Enabled
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `strictFunctionTypes: true`
- `noImplicitThis: true`

### Path Aliases
- `@/*` → `src/*`
- `@components/*` → `src/components/*`
- `@features/*` → `src/features/*`
- `@hooks/*` → `src/hooks/*`
- `@services/*` → `src/services/*`
- `@types/*` → `src/types/*`
- `@utils/*` → `src/utils/*`

## Next Steps

Refer to `_docs/TASK_LIST.md` for sequential implementation tasks.

**Current Status**: SETUP-1 Complete ✅
**Next Task**: SETUP-2 (Firebase Configuration)

