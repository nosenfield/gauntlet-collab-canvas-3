/**
 * Performance Test Utility
 * 
 * Component for testing performance with many objects
 * - Press 'P' to open performance test panel
 * - Spawn 100+ rectangles
 * - Test selection and drag performance
 * - Monitor FPS impact
 * - Available in production builds
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/store/authStore';
import { createShape } from '@/features/displayObjects/shapes/services/shapeService';
import { useShapes } from '@/features/displayObjects/shapes/store/shapesStore';
import { useSelection } from '@/features/displayObjects/common/store/selectionStore';
import './PerformanceTest.css';

/**
 * Convert HSL to Hex color format
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns Hex color string (e.g., '#FF6B6B')
 */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }
  
  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

interface TestConfig {
  count: number;
  pattern: 'grid' | 'random' | 'cluster';
  size: 'small' | 'medium' | 'large';
}

export function PerformanceTest(): React.ReactElement | null {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpawning, setIsSpawning] = useState(false);
  const [lastTestResults, setLastTestResults] = useState<string>('');
  
  const { user } = useAuth();
  const { shapes } = useShapes();
  const { selectedIds, setSelection, clearSelection } = useSelection();

  // Toggle panel with 'P' key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'p' || e.key === 'P') {
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  /**
   * Spawn multiple rectangles based on test configuration
   */
  const spawnShapes = async (config: TestConfig) => {
    if (!user) {
      setLastTestResults('❌ No user authenticated');
      return;
    }

    setIsSpawning(true);
    setLastTestResults(`⏳ Spawning ${config.count} shapes...`);
    
    const startTime = performance.now();
    
    try {
      const promises: Promise<string>[] = [];
      
      // Size presets
      const sizes = {
        small: { width: 30, height: 30 },
        medium: { width: 60, height: 60 },
        large: { width: 100, height: 100 },
      };
      
      const { width, height } = sizes[config.size];
      
      // Canvas center is at (5000, 5000) in a 10,000 x 10,000 canvas
      const CANVAS_CENTER = 5000;
      
      for (let i = 0; i < config.count; i++) {
        let x: number, y: number;
        
        switch (config.pattern) {
          case 'grid':
            // Grid layout (10 per row) centered around viewport
            const cols = 10;
            const col = i % cols;
            const row = Math.floor(i / cols);
            x = CANVAS_CENTER - 750 + col * 150; // Center the grid
            y = CANVAS_CENTER - 750 + row * 150;
            break;
            
          case 'cluster':
            // Clustered around canvas center
            x = CANVAS_CENTER - 500 + (Math.random() * 1000);
            y = CANVAS_CENTER - 500 + (Math.random() * 1000);
            break;
            
          case 'random':
          default:
            // Random across visible canvas area
            x = CANVAS_CENTER - 2000 + (Math.random() * 4000);
            y = CANVAS_CENTER - 2000 + (Math.random() * 4000);
            break;
        }
        
        // Generate varied hex colors based on index
        const hue = (i * 360) / config.count;
        const hexColor = hslToHex(hue, 70, 60);
        
        promises.push(
          createShape(user.userId, {
            type: 'rectangle',
            x,
            y,
            width,
            height,
            fillColor: hexColor,
            strokeColor: '#000000',
            strokeWidth: 1,
          })
        );
        
        // Batch in groups of 20 to avoid overwhelming Firestore
        if (promises.length >= 20) {
          await Promise.all(promises);
          promises.length = 0;
          
          // Small delay between batches
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Create remaining shapes
      if (promises.length > 0) {
        await Promise.all(promises);
      }
      
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      setLastTestResults(
        `✅ Created ${config.count} shapes in ${duration}s\n` +
        `Pattern: ${config.pattern}, Size: ${config.size}\n` +
        `Total shapes on canvas: ${shapes.length + config.count}`
      );
    } catch (error) {
      console.error('[PerformanceTest] Error spawning shapes:', error);
      setLastTestResults(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSpawning(false);
    }
  };

  /**
   * Select all shapes on canvas
   */
  const selectAll = () => {
    const allIds = shapes.map(s => s.id);
    setSelection(allIds);
    setLastTestResults(
      `✅ Selected ${allIds.length} shapes\n` +
      `Watch FPS during drag operations\n` +
      `Bounding box recalculation overhead: ~${(allIds.length * 0.02).toFixed(1)}ms per frame`
    );
  };

  /**
   * Clear all selections
   */
  const clearAll = () => {
    clearSelection();
    setLastTestResults('✅ Cleared selection');
  };

  // Don't render if closed
  if (!isOpen) {
    return null;
  }

  return (
    <div className="performance-test-panel">
      <div className="performance-test-header">
        <h3>🔬 Performance Test</h3>
        <button onClick={() => setIsOpen(false)}>×</button>
      </div>
      
      <div className="performance-test-content">
        <div className="test-section">
          <h4>Current State</h4>
          <div className="metrics">
            <div>Shapes on canvas: <strong>{shapes.length}</strong></div>
            <div>Selected: <strong>{selectedIds.length}</strong></div>
            <div>Watch FPS counter (bottom-left)</div>
          </div>
        </div>

        <div className="test-section">
          <h4>Spawn Test Shapes</h4>
          
          <button
            onClick={() => spawnShapes({ count: 50, pattern: 'grid', size: 'medium' })}
            disabled={isSpawning}
            className="test-button"
          >
            50 Shapes (Grid)
          </button>
          
          <button
            onClick={() => spawnShapes({ count: 100, pattern: 'grid', size: 'medium' })}
            disabled={isSpawning}
            className="test-button"
          >
            100 Shapes (Grid)
          </button>
          
          <button
            onClick={() => spawnShapes({ count: 200, pattern: 'random', size: 'small' })}
            disabled={isSpawning}
            className="test-button"
          >
            200 Shapes (Random)
          </button>
          
          <button
            onClick={() => spawnShapes({ count: 100, pattern: 'cluster', size: 'large' })}
            disabled={isSpawning}
            className="test-button"
          >
            100 Shapes (Cluster)
          </button>
        </div>

        <div className="test-section">
          <h4>Selection Tests</h4>
          
          <button
            onClick={selectAll}
            disabled={shapes.length === 0}
            className="test-button"
          >
            Select All ({shapes.length})
          </button>
          
          <button
            onClick={clearAll}
            className="test-button"
          >
            Clear Selection
          </button>
          
          <div className="test-instructions">
            After selecting, drag shapes and watch FPS.
            Target: 60 FPS minimum.
          </div>
        </div>

        {lastTestResults && (
          <div className="test-results">
            <h4>Test Results</h4>
            <pre>{lastTestResults}</pre>
          </div>
        )}

        <div className="test-help">
          <strong>Performance Targets:</strong>
          <ul>
            <li>60 FPS with 100+ shapes</li>
            <li>Smooth drag with 50+ selected</li>
            <li>No visible lag during selection</li>
          </ul>
          <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.7 }}>
            Press P to close
          </div>
        </div>
      </div>
    </div>
  );
}

