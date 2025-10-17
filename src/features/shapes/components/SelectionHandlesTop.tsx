/**
 * Selection Handles Top Component
 * 
 * Renders selection handles in a separate layer, tracking the shape's live position.
 * This allows handles to move in real-time during drag while rendering above all shapes.
 */

import { useEffect, useRef, useState } from 'react';
import { Group } from 'react-konva';
import type Konva from 'konva';
import type { Shape } from '../../../types/firebase';
import { SelectionHandles } from './SelectionHandles';

/**
 * Selection Handles Top Props
 */
interface SelectionHandlesTopProps {
  shape: Shape;
}

/**
 * Selection Handles Top Component
 * 
 * Wraps SelectionHandles and syncs position/rotation with the shape's Konva node.
 * This ensures handles move in real-time during drag operations.
 */
export function SelectionHandlesTop({ shape }: SelectionHandlesTopProps) {
  const groupRef = useRef<Konva.Group>(null);
  const [livePosition, setLivePosition] = useState({
    x: shape.x + (shape.width || 0) / 2,
    y: shape.y + (shape.height || 0) / 2,
    rotation: shape.rotation || 0,
  });

  // Update position from shape data when it changes (Firestore updates)
  useEffect(() => {
    setLivePosition({
      x: shape.x + (shape.width || 0) / 2,
      y: shape.y + (shape.height || 0) / 2,
      rotation: shape.rotation || 0,
    });
  }, [shape.x, shape.y, shape.width, shape.height, shape.rotation]);

  // Track the shape's Konva node and sync position during animations
  useEffect(() => {
    const stage = groupRef.current?.getStage();
    if (!stage) return;

    // Find the shape's Group node by ID
    const shapeNode = stage.findOne(`#shape-${shape.id}`) as Konva.Group;
    if (!shapeNode) return;

    // Listen for drag/transform events
    const handleTransform = () => {
      setLivePosition({
        x: shapeNode.x(),
        y: shapeNode.y(),
        rotation: shapeNode.rotation(),
      });
    };

    // Listen for position changes
    shapeNode.on('xChange yChange rotationChange', handleTransform);
    shapeNode.on('dragmove', handleTransform);

    // Cleanup
    return () => {
      shapeNode.off('xChange yChange rotationChange', handleTransform);
      shapeNode.off('dragmove', handleTransform);
    };
  }, [shape.id]);

  return (
    <Group
      ref={groupRef}
      x={livePosition.x}
      y={livePosition.y}
      rotation={livePosition.rotation}
    >
      <SelectionHandles shape={shape} />
    </Group>
  );
}

