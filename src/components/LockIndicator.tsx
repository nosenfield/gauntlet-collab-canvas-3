/**
 * Lock Indicator Component
 * 
 * Visual indicator for locked shapes during collaborative editing.
 * Shows lock emoji and user information.
 */

import React from 'react';
import { Text, Group } from 'react-konva';
import type { Shape, User } from '@/types';

/**
 * Lock indicator component props
 */
interface LockIndicatorProps {
  shape: Shape;
  lockedByUser?: User;
  className?: string;
}

/**
 * Lock indicator component
 */
export const LockIndicator: React.FC<LockIndicatorProps> = ({
  shape,
  lockedByUser
}) => {
  // Don't render if shape is not locked
  if (!shape.lockedBy) return null;

  const lockPosition = {
    x: shape.x + shape.width / 2,
    y: shape.y + shape.height / 2
  };

  return (
    <Group>
      {/* Lock emoji */}
      <Text
        x={lockPosition.x - 10}
        y={lockPosition.y - 10}
        text="🔒"
        fontSize={16}
        align="center"
        verticalAlign="middle"
        shadowColor="rgba(0, 0, 0, 0.5)"
        shadowBlur={3}
        shadowOffset={{ x: 1, y: 1 }}
      />
      
      {/* User label (if user data available) */}
      {lockedByUser && (
        <Text
          x={lockPosition.x - 20}
          y={lockPosition.y + 10}
          text={lockedByUser.displayName}
          fontSize={10}
          fontFamily="Arial, sans-serif"
          fill={lockedByUser.color}
          stroke="#ffffff"
          strokeWidth={1}
          padding={2}
          background="rgba(0, 0, 0, 0.7)"
          cornerRadius={2}
          align="center"
          verticalAlign="middle"
          shadowColor="rgba(0, 0, 0, 0.3)"
          shadowBlur={2}
          shadowOffset={{ x: 1, y: 1 }}
        />
      )}
    </Group>
  );
};
