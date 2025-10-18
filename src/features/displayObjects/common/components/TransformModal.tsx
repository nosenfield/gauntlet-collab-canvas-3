/**
 * TransformModal Component
 * 
 * Modal that appears at the collection center when objects are selected.
 * Contains rotation and scale knobs for transforming the selected collection.
 * 
 * - Size: 120px × 60px fixed
 * - Position: Collection centerpoint (canvas coordinates)
 * - Visibility: Only when selection exists AND tool === 'select'
 * - Transforms with viewport (pan/zoom)
 */

import { useMemo, useEffect } from 'react';
import { canvasToScreen } from '@/features/canvas/utils/coordinateTransform';
import { useRotation } from '../hooks/useRotation';
import type { Point } from '../types';
import './TransformModal.css';

export interface TransformModalProps {
  /**
   * Collection centerpoint in canvas coordinates
   */
  center: Point | null;
  
  /**
   * Viewport state for coordinate transformation
   */
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
  
  /**
   * Whether the modal is visible
   * Should be true when selection exists AND tool === 'select'
   */
  visible: boolean;
}

/**
 * TransformModal Component
 * 
 * Renders a floating modal with transform controls at the collection center.
 * The modal transforms with the canvas viewport (pan/zoom).
 * 
 * @example
 * ```tsx
 * <TransformModal
 *   center={{ x: 5000, y: 5000 }}
 *   viewport={{ x: 100, y: 100, scale: 1.2 }}
 *   visible={true}
 * />
 * ```
 */
export function TransformModal({
  center,
  viewport,
  visible,
}: TransformModalProps): React.ReactElement | null {
  // Rotation hook
  const {
    startRotation,
    updateRotation,
    endRotation,
    handleGlobalMouseUp,
    isRotating,
    currentAngle,
  } = useRotation(center);
  
  // Handle global mouse up (release outside knob)
  useEffect(() => {
    if (isRotating) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('mousemove', updateRotation as any);
      
      return () => {
        window.removeEventListener('mouseup', handleGlobalMouseUp);
        window.removeEventListener('mousemove', updateRotation as any);
      };
    }
  }, [isRotating, handleGlobalMouseUp, updateRotation]);
  
  // Calculate screen position from canvas coordinates
  const screenPosition = useMemo(() => {
    if (!center) return null;
    
    const screen = canvasToScreen(
      center.x,
      center.y,
      viewport.x,
      viewport.y,
      viewport.scale
    );
    
    return screen;
  }, [center, viewport.x, viewport.y, viewport.scale]);
  
  // Don't render if not visible or no position
  if (!visible || !screenPosition) {
    return null;
  }
  
  // Modal dimensions
  const MODAL_WIDTH = 120;
  const MODAL_HEIGHT = 60;
  
  // Center the modal on the collection centerpoint
  const left = screenPosition.x - (MODAL_WIDTH / 2);
  const top = screenPosition.y - (MODAL_HEIGHT / 2);
  
  return (
    <div
      className="transform-modal"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${MODAL_WIDTH}px`,
        height: `${MODAL_HEIGHT}px`,
      }}
    >
      <div className="transform-modal__content">
        {/* Rotation Knob (Left) */}
        <button
          className={`transform-modal__knob transform-modal__knob--rotation ${isRotating ? 'transform-modal__knob--active' : ''}`}
          onMouseDown={startRotation}
          onMouseUp={endRotation}
          title="Rotate (drag to rotate)"
          aria-label="Rotate"
        >
          <span 
            className="transform-modal__knob-icon"
            style={{ transform: `rotate(${currentAngle}deg)` }}
          >
            ⟳
          </span>
        </button>
        
        {/* Scale Knob (Right) */}
        <button
          className="transform-modal__knob transform-modal__knob--scale"
          disabled
          title="Scale (not yet implemented)"
          aria-label="Scale"
        >
          <span className="transform-modal__knob-icon">⊕</span>
        </button>
      </div>
    </div>
  );
}

