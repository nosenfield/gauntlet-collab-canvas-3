/**
 * RemoteCursors Component
 * 
 * Container for all remote user cursors.
 * - Maps over active users (excluding current user)
 * - Renders RemoteCursor for each user
 * - Konva Layer for cursor rendering
 */

import { Layer } from 'react-konva';
import { useAuth } from '@/features/auth/store/authStore';
import { useActiveUsers } from '../hooks/useActiveUsers';
import { RemoteCursor } from './RemoteCursor';

/**
 * RemoteCursors Component
 * Konva Layer containing all remote cursors
 */
export function RemoteCursors(): React.ReactElement {
  const { user } = useAuth();
  const activeUsers = useActiveUsers(user?.userId); // Excludes current user

  return (
    <Layer listening={false}>
      {Array.from(activeUsers.values()).map((presence) => (
        <RemoteCursor key={presence.userId} presence={presence} />
      ))}
    </Layer>
  );
}

