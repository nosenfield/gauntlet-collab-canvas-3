/**
 * Viewport Store
 * 
 * Global state management for canvas viewport (pan and zoom).
 * Uses Context API + useReducer for state management.
 */

import { createContext, useContext, useReducer, useCallback } from 'react';
import type { ReactNode } from 'react';

/**
 * Viewport State
 * Represents the current view into the canvas coordinate space.
 * Co-located with the store implementation as it's an implementation detail.
 */
interface ViewportState {
  x: number;           // Canvas x coordinate at viewport top-left
  y: number;           // Canvas y coordinate at viewport top-left
  scale: number;       // Current zoom scale factor (1.0 = 100%)
  width: number;       // Viewport width in pixels (window dimensions)
  height: number;      // Viewport height in pixels (window dimensions)
}

type ViewportAction =
  | { type: 'SET_POSITION'; x: number; y: number }
  | { type: 'SET_SCALE'; scale: number }
  | { type: 'SET_VIEWPORT'; x: number; y: number; scale: number }
  | { type: 'SET_DIMENSIONS'; width: number; height: number }
  | { type: 'RESET' };

interface ViewportContextType {
  viewport: ViewportState;
  setPosition: (x: number, y: number) => void;
  setScale: (scale: number) => void;
  setViewport: (x: number, y: number, scale: number) => void;
  setDimensions: (width: number, height: number) => void;
  resetViewport: () => void;
}

const initialViewport: ViewportState = {
  x: 0,
  y: 0,
  scale: 1,
  width: window.innerWidth,
  height: window.innerHeight,
};

const ViewportContext = createContext<ViewportContextType | undefined>(undefined);

function viewportReducer(state: ViewportState, action: ViewportAction): ViewportState {
  switch (action.type) {
    case 'SET_POSITION':
      return { ...state, x: action.x, y: action.y };
    case 'SET_SCALE':
      return { ...state, scale: action.scale };
    case 'SET_VIEWPORT':
      return { ...state, x: action.x, y: action.y, scale: action.scale };
    case 'SET_DIMENSIONS':
      return { ...state, width: action.width, height: action.height };
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

  // Memoize setter functions to prevent infinite useEffect loops in consumers
  const setPosition = useCallback((x: number, y: number): void => {
    dispatch({ type: 'SET_POSITION', x, y });
  }, []);

  const setScale = useCallback((scale: number): void => {
    dispatch({ type: 'SET_SCALE', scale });
  }, []);

  const setViewport = useCallback((x: number, y: number, scale: number): void => {
    dispatch({ type: 'SET_VIEWPORT', x, y, scale });
  }, []);

  const setDimensions = useCallback((width: number, height: number): void => {
    dispatch({ type: 'SET_DIMENSIONS', width, height });
  }, []);

  const resetViewport = useCallback((): void => {
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <ViewportContext.Provider
      value={{ viewport, setPosition, setScale, setViewport, setDimensions, resetViewport }}
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

