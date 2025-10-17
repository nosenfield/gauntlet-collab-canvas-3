/**
 * RemoteCursor Component
 * 
 * Displays a single remote user's cursor on the canvas.
 * - Cursor icon (triangle) in user's color
 * - Label with user's display name
 * - Positioned at canvas coordinates
 */

import { Group, Path, Text, Rect } from 'react-konva';
import type { UserPresence } from '@/types/firebase';

interface RemoteCursorProps {
  presence: UserPresence;
}

/**
 * RemoteCursor Component
 * Konva group displaying cursor icon + label
 */
export function RemoteCursor({ presence }: RemoteCursorProps): React.ReactElement | null {
  const { cursorX, cursorY, color, displayName } = presence;

  // Guard against incomplete presence data
  if (!displayName || typeof cursorX !== 'number' || typeof cursorY !== 'number') {
    return null;
  }

  // Cursor SVG path (triangle/arrow shape)
  const cursorPath = 'M 0 0 L 0 16 L 4.8 12 L 8 18 L 10 17 L 6.8 11 L 12 10 Z';

  // Label dimensions
  const labelPadding = 6;
  const labelOffsetX = 12;
  const labelOffsetY = 8;

  return (
    <Group x={cursorX} y={cursorY}>
      {/* Cursor icon (triangle/arrow) */}
      <Path
        data={cursorPath}
        fill={color}
        stroke="#ffffff"
        strokeWidth={0.5}
        shadowColor="rgba(0, 0, 0, 0.5)"
        shadowBlur={4}
        shadowOffset={{ x: 1, y: 1 }}
        shadowOpacity={0.8}
      />

      {/* Label background */}
      <Rect
        x={labelOffsetX}
        y={labelOffsetY}
        width={displayName.length * 7 + labelPadding * 2} // Approximate width
        height={20}
        fill={color}
        cornerRadius={4}
        shadowColor="rgba(0, 0, 0, 0.3)"
        shadowBlur={3}
        shadowOffset={{ x: 1, y: 1 }}
        shadowOpacity={0.6}
      />

      {/* Label text */}
      <Text
        x={labelOffsetX + labelPadding}
        y={labelOffsetY + 4}
        text={displayName}
        fontSize={12}
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="#ffffff"
        fontStyle="500"
      />
    </Group>
  );
}

