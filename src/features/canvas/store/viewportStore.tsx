/**
 * Viewport Store
 * 
 * Global state management for canvas viewport (pan and zoom).
 * Uses Context API + useReducer for state management.
 */

import { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';

interface ViewportState {
  x: number;      // Stage X position (pan horizontal)
  y: number;      // Stage Y position (pan vertical)
  scale: number;  // Zoom scale factor
}

type ViewportAction =
  | { type: 'SET_POSITION'; x: number; y: number }
  | { type: 'SET_SCALE'; scale: number }
  | { type: 'SET_VIEWPORT'; x: number; y: number; scale: number }
  | { type: 'RESET' };

interface ViewportContextType {
  viewport: ViewportState;
  setPosition: (x: number, y: number) => void;
  setScale: (scale: number) => void;
  setViewport: (x: number, y: number, scale: number) => void;
  resetViewport: () => void;
}

const initialViewport: ViewportState = {
  x: 0,
  y: 0,
  scale: 1,
};

const ViewportContext = createContext<ViewportContextType | undefined>(undefined);

function viewportReducer(state: ViewportState, action: ViewportAction): ViewportState {
  switch (action.type) {
    case 'SET_POSITION':
      return { ...state, x: action.x, y: action.y };
    case 'SET_SCALE':
      return { ...state, scale: action.scale };
    case 'SET_VIEWPORT':
      return { x: action.x, y: action.y, scale: action.scale };
    case 'RESET':
      return initialViewport;
    default:
      return state;
  }
}

interface ViewportProviderProps {
  children: ReactNode;
}

export function ViewportProvider({ children }: ViewportProviderProps): React.ReactElement {
  const [viewport, dispatch] = useReducer(viewportReducer, initialViewport);

  const setPosition = (x: number, y: number): void => {
    dispatch({ type: 'SET_POSITION', x, y });
  };

  const setScale = (scale: number): void => {
    dispatch({ type: 'SET_SCALE', scale });
  };

  const setViewport = (x: number, y: number, scale: number): void => {
    dispatch({ type: 'SET_VIEWPORT', x, y, scale });
  };

  const resetViewport = (): void => {
    dispatch({ type: 'RESET' });
  };

  return (
    <ViewportContext.Provider
      value={{ viewport, setPosition, setScale, setViewport, resetViewport }}
    >
      {children}
    </ViewportContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useViewport(): ViewportContextType {
  const context = useContext(ViewportContext);
  if (!context) {
    throw new Error('useViewport must be used within ViewportProvider');
  }
  return context;
}

