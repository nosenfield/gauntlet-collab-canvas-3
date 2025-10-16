/**
 * Shape Component
 * 
 * Renders individual shapes on the canvas using Konva.
 * Handles shape interactions and visual feedback.
 */

import React from 'react';
import { Rect } from 'react-konva';
import { Shape } from '@/types';

/**
 * Shape component props
 */
interface ShapeProps {
  shape: Shape;
  isSelected?: boolean;
  isLocked?: boolean;
  onSelect?: (shapeId: string) => void;
  onDragStart?: (shapeId: string) => void;
  onDragEnd?: (shapeId: string, newPosition: { x: number; y: number }) => void;
}

/**
 * Shape component
 */
export const ShapeComponent: React.FC<ShapeProps> = ({
  shape,
  isSelected = false,
  isLocked = false,
  onSelect,
  onDragStart,
  onDragEnd
}) => {
  /**
   * Handle shape click
   */
  const handleClick = () => {
    onSelect?.(shape.id);
  };

  /**
   * Handle drag start
   */
  const handleDragStart = () => {
    onDragStart?.(shape.id);
  };

  /**
   * Handle drag end
   */
  const handleDragEnd = (event: any) => {
    const newPosition = {
      x: event.target.x(),
      y: event.target.y()
    };
    onDragEnd?.(shape.id, newPosition);
  };

  /**
   * Render rectangle shape
   */
  const renderRectangle = () => {
    return (
      <Rect
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        fill={shape.fill}
        stroke={isSelected ? '#007bff' : '#dee2e6'}
        strokeWidth={isSelected ? 2 : 1}
        opacity={isLocked ? 0.7 : 1}
        draggable={!isLocked}
        onClick={handleClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        shadowColor="rgba(0, 0, 0, 0.1)"
        shadowBlur={5}
        shadowOffset={{ x: 2, y: 2 }}
      />
    );
  };

  /**
   * Render lock indicator
   */
  const renderLockIndicator = () => {
    if (!isLocked) return null;

    return (
      <div
        style={{
          position: 'absolute',
          left: shape.x + shape.width / 2 - 10,
          top: shape.y + shape.height / 2 - 10,
          width: 20,
          height: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          pointerEvents: 'none'
        }}
      >
        🔒
      </div>
    );
  };

  return (
    <>
      {shape.type === 'rectangle' && renderRectangle()}
      {renderLockIndicator()}
    </>
  );
};
