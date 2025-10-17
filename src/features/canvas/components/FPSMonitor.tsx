/**
 * FPSMonitor Component
 * 
 * Development-only performance monitor that displays:
 * - Current FPS (frames per second)
 * - Frame time in milliseconds
 * - Toggle with 'F' key
 * 
 * Only renders in development mode (import.meta.env.DEV)
 */

import { useEffect, useState } from 'react';
import { startFPSMonitoring, stopFPSMonitoring } from '@/utils/performanceMonitor';
import type { PerformanceMetrics } from '@/utils/performanceMonitor';

export function FPSMonitor(): React.ReactElement | null {
  const [fpsMetrics, setFpsMetrics] = useState<PerformanceMetrics>({ 
    fps: 60, 
    frameTime: 0, 
    timestamp: 0 
  });
  const [showFPS, setShowFPS] = useState(true);

  // Performance monitoring in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      startFPSMonitoring((metrics) => {
        setFpsMetrics(metrics);
      });

      return () => {
        stopFPSMonitoring();
      };
    }
  }, []);

  // Toggle FPS display with 'F' key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        setShowFPS((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Don't render in production or when toggled off
  if (!import.meta.env.DEV || !showFPS) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: fpsMetrics.fps < 60 ? '#ff6b6b' : '#51cf66',
        padding: '8px 12px',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '14px',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      <div>FPS: {fpsMetrics.fps}</div>
      <div style={{ fontSize: '11px', opacity: 0.7 }}>
        Frame: {fpsMetrics.frameTime.toFixed(2)}ms
      </div>
      <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '4px' }}>
        Press F to hide
      </div>
    </div>
  );
}

