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

/**
 * Calculate initial viewport state
 * Centers on canvas center (5000, 5000) with 2000px showing across larger dimension
 */
function calculateInitialViewport(): ViewportState {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Canvas constants
  const CANVAS_CENTER_X = 5000;
  const CANVAS_CENTER_Y = 5000;
  const INITIAL_VISIBLE_SIZE = 2000; // px to show across larger dimension
  
  // Calculate scale to show 2000px across the larger window dimension
  const largerDimension = Math.max(width, height);
  const scale = largerDimension / INITIAL_VISIBLE_SIZE;
  
  // Calculate stage offset to center canvas (5000, 5000) at viewport center
  // From coordinate transform: screenX = canvasX * scale + stageX
  // To have canvas coordinate appear at viewport center:
  // stageX = (width/2) - (canvasX * scale)
  const x = (width / 2) - (CANVAS_CENTER_X * scale);
  const y = (height / 2) - (CANVAS_CENTER_Y * scale);
  
  return { x, y, scale, width, height };
}

const initialViewport: ViewportState = calculateInitialViewport();

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
      // Recalculate viewport for current window size
      return calculateInitialViewport();
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

