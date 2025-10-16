/**
 * Cursor Component
 * 
 * Renders multiplayer cursors with user labels.
 * Optimized with React.memo for performance.
 */

import React from 'react';
import { Circle, Text } from 'react-konva';
import type { User } from '@/types';

/**
 * Cursor component props
 */
interface CursorProps {
  user: User;
  isCurrentUser?: boolean;
}

/**
 * Cursor component with memoization
 */
export const Cursor: React.FC<CursorProps> = React.memo(({ user, isCurrentUser = false }) => {
  // Skip rendering current user's cursor
  if (isCurrentUser) return null;

  // Skip if cursor position is not available
  if (!user.cursorPosition || typeof user.cursorPosition.x !== 'number' || typeof user.cursorPosition.y !== 'number') {
    return null;
  }

  return (
    <React.Fragment>
      {/* Cursor circle */}
      <Circle
        x={user.cursorPosition.x}
        y={user.cursorPosition.y}
        radius={8}
        fill={user.color || '#666666'}
        stroke="#ffffff"
        strokeWidth={2}
        listening={false}
      />
      {/* User label */}
      <Text
        x={user.cursorPosition.x + 12}
        y={user.cursorPosition.y - 8}
        text={user.displayName || 'Unknown'}
        fontSize={12}
        fill={user.color || '#666666'}
        fontStyle="bold"
        listening={false}
      />
    </React.Fragment>
  );
});

Cursor.displayName = 'Cursor';