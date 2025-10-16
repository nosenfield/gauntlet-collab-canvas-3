/**
 * Cursor Component
 * 
 * Renders multiplayer cursors with user labels.
 * Shows real-time cursor positions of other users.
 */

import React from 'react';
import { Circle, Text } from 'react-konva';
import { User } from '@/types';

/**
 * Cursor component props
 */
interface CursorProps {
  user: User;
  isCurrentUser?: boolean;
}

/**
 * Cursor component
 */
export const Cursor: React.FC<CursorProps> = ({ 
  user, 
  isCurrentUser = false 
}) => {
  // Don't render cursor for current user
  if (isCurrentUser) return null;

  const { cursorPosition, color, displayName } = user;

  return (
    <>
      {/* Cursor pointer */}
      <Circle
        x={cursorPosition.x}
        y={cursorPosition.y}
        radius={8}
        fill={color}
        stroke="#ffffff"
        strokeWidth={2}
        shadowColor="rgba(0, 0, 0, 0.3)"
        shadowBlur={4}
        shadowOffset={{ x: 1, y: 1 }}
      />
      
      {/* Cursor label */}
      <Text
        x={cursorPosition.x + 12}
        y={cursorPosition.y - 8}
        text={displayName}
        fontSize={12}
        fontFamily="Arial, sans-serif"
        fill={color}
        stroke="#ffffff"
        strokeWidth={1}
        padding={4}
        background="rgba(255, 255, 255, 0.9)"
        cornerRadius={4}
        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowBlur={2}
        shadowOffset={{ x: 1, y: 1 }}
      />
    </>
  );
};
