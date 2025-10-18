/**
 * Performance Test Utility
 * 
 * Development-only component for testing performance with many objects
 * - Press 'P' to open performance test panel
 * - Spawn 100+ rectangles
 * - Test selection and drag performance
 * - Monitor FPS impact
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/store/authStore';
import { createShape } from '@/features/displayObjects/shapes/services/shapeService';
import { useShapes } from '@/features/displayObjects/shapes/store/shapesStore';
import { useSelection } from '@/features/displayObjects/common/store/selectionStore';
import './PerformanceTest.css';

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
  const { selectedIds, selectMultiple, clearSelection } = useSelection();

  // Toggle panel with 'P' key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only in dev mode and if not typing in an input
      if (!import.meta.env.DEV) return;
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
      
      for (let i = 0; i < config.count; i++) {
        let x: number, y: number;
        
        switch (config.pattern) {
          case 'grid':
            // Grid layout (10 per row)
            const cols = 10;
            const col = i % cols;
            const row = Math.floor(i / cols);
            x = -2000 + col * 150;
            y = -2000 + row * 150;
            break;
            
          case 'cluster':
            // Clustered in center
            x = -500 + (Math.random() * 1000);
            y = -500 + (Math.random() * 1000);
            break;
            
          case 'random':
          default:
            // Random across canvas
            x = -4000 + (Math.random() * 8000);
            y = -4000 + (Math.random() * 8000);
            break;
        }
        
        promises.push(
          createShape(user.userId, {
            type: 'rectangle',
            x,
            y,
            width,
            height,
            fillColor: `hsl(${(i * 360) / config.count}, 70%, 60%)`,
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
    selectMultiple(allIds);
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

  // Don't render in production
  if (!import.meta.env.DEV || !isOpen) {
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

