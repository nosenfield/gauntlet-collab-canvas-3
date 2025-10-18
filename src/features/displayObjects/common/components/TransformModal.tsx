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
import { useScale } from '../hooks/useScale';
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
  
  /**
   * Callback to expose rotated collection corners during rotation
   * Used to render a rotating bounding box (instead of recalculating)
   */
  onRotationCornersChange?: (corners: Point[] | null) => void;
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
  onRotationCornersChange,
}: TransformModalProps): React.ReactElement | null {
  // Rotation hook
  const {
    startRotation,
    updateRotation,
    endRotation,
    handleGlobalMouseUp: handleGlobalMouseUpRotation,
    isRotating,
    currentAngle,
    rotatedCollectionCorners,
    rotationPivot,
  } = useRotation(center);
  
  // Scale hook
  const {
    startScale,
    updateScale,
    endScale,
    handleGlobalMouseUp: handleGlobalMouseUpScale,
    isScaling,
    scalePivot,
  } = useScale(center);
  
  // Expose rotated collection corners to parent
  // Note: onRotationCornersChange is NOT in deps because it's memoized with useCallback([])
  // Including it causes infinite loops due to React reconciliation during rapid state updates
  useEffect(() => {
    if (onRotationCornersChange) {
      onRotationCornersChange(rotatedCollectionCorners);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotatedCollectionCorners]);
  
  // Handle global mouse up/move for rotation (release outside knob)
  useEffect(() => {
    if (isRotating) {
      window.addEventListener('mouseup', handleGlobalMouseUpRotation);
      window.addEventListener('mousemove', updateRotation as any);
      
      return () => {
        window.removeEventListener('mouseup', handleGlobalMouseUpRotation);
        window.removeEventListener('mousemove', updateRotation as any);
      };
    }
  }, [isRotating, handleGlobalMouseUpRotation, updateRotation]);
  
  // Handle global mouse up/move for scale (release outside knob)
  useEffect(() => {
    if (isScaling) {
      window.addEventListener('mouseup', handleGlobalMouseUpScale);
      window.addEventListener('mousemove', updateScale as any);
      
      return () => {
        window.removeEventListener('mouseup', handleGlobalMouseUpScale);
        window.removeEventListener('mousemove', updateScale as any);
      };
    }
  }, [isScaling, handleGlobalMouseUpScale, updateScale]);
  
  // Calculate screen position from canvas coordinates
  // Use rotationPivot during rotation or scalePivot during scaling (fixed points), otherwise use dynamic center
  const screenPosition = useMemo(() => {
    const activeCenter = rotationPivot || scalePivot || center;
    if (!activeCenter) return null;
    
    const screen = canvasToScreen(
      activeCenter.x,
      activeCenter.y,
      viewport.x,
      viewport.y,
      viewport.scale
    );
    
    return screen;
  }, [center, rotationPivot, scalePivot, viewport.x, viewport.y, viewport.scale]);
  
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
          className={`transform-modal__knob transform-modal__knob--scale ${isScaling ? 'transform-modal__knob--active' : ''}`}
          onMouseDown={startScale}
          onMouseUp={endScale}
          title="Scale (drag to scale)"
          aria-label="Scale"
        >
          <span className="transform-modal__knob-icon">
            ⊕
          </span>
        </button>
      </div>
    </div>
  );
}

