/**
 * Performance Test Utility
 * 
 * Component for testing performance with many objects
 * - Press 'P' to open performance test panel
 * - Spawn shapes with configurable options
 * - Test selection and drag performance
 * - Test AI commands
 * - Monitor FPS impact
 * - Available in production builds
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/store/authStore';
import { createShapesBatch } from '@/features/displayObjects/shapes/services/shapeService';
import { createTextsBatch } from '@/features/displayObjects/texts/services/textService';
import type { CreateShapeData } from '@/features/displayObjects/shapes/types';
import type { CreateTextData } from '@/features/displayObjects/texts/types';
import { useShapes } from '@/features/displayObjects/shapes/store/shapesStore';
import { useTexts } from '@/features/displayObjects/texts/store/textsStore';
import { useSelection } from '@/features/displayObjects/common/store/selectionStore';
import { useAIAgent } from '@/features/aiAgent/hooks/useAIAgent';
import { startFPSMonitoring, stopFPSMonitoring } from '@/utils/performanceMonitor';
import type { PerformanceMetrics } from '@/utils/performanceMonitor';
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

type ObjectType = 'rectangle' | 'circle' | 'line' | 'text';
type SpawnPattern = 'grid' | 'random' | 'cluster';

export function PerformanceTest(): React.ReactElement | null {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpawning, setIsSpawning] = useState(false);
  const [lastTestResults, setLastTestResults] = useState<string>('');
  const [fpsMetrics, setFpsMetrics] = useState<PerformanceMetrics>({ 
    fps: 60, 
    frameTime: 0, 
    timestamp: 0 
  });
  
  // Spawn configuration state
  const [selectedTypes, setSelectedTypes] = useState<Set<ObjectType>>(new Set(['rectangle']));
  const [spawnPattern, setSpawnPattern] = useState<SpawnPattern>('grid');
  const [spawnCount, setSpawnCount] = useState<number>(50);
  
  const { user } = useAuth();
  const { shapes } = useShapes();
  const { texts } = useTexts();
  const { selectedIds, setSelection, clearSelection } = useSelection();
  const { executeCommand } = useAIAgent();

  // FPS monitoring
  useEffect(() => {
    startFPSMonitoring((metrics) => {
      setFpsMetrics(metrics);
    });

    return () => {
      stopFPSMonitoring();
    };
  }, []);

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
   * Toggle object type selection
   */
  const toggleObjectType = (type: ObjectType) => {
    setSelectedTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        // Don't allow deselecting all types
        if (newSet.size > 1) {
          newSet.delete(type);
        }
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  /**
   * Spawn multiple objects based on test configuration
   * Uses batch creation for optimal performance
   */
  const spawnObjects = async () => {
    if (!user) {
      setLastTestResults('❌ No user authenticated');
      return;
    }

    if (selectedTypes.size === 0) {
      setLastTestResults('❌ Select at least one object type');
      return;
    }

    setIsSpawning(true);
    setLastTestResults(`⏳ Spawning ${spawnCount} objects...`);
    
    const startTime = performance.now();
    
    try {
      const shapesToCreate: CreateShapeData[] = [];
      const textsToCreate: CreateTextData[] = [];
      const typesArray = Array.from(selectedTypes);
      
      // Canvas center is at (5000, 5000) in a 10,000 x 10,000 canvas
      const CANVAS_CENTER = 5000;
      
      // Prepare all objects for batch creation
      for (let i = 0; i < spawnCount; i++) {
        let x: number, y: number;
        
        switch (spawnPattern) {
          case 'grid':
            // Grid layout (10 per row) centered around viewport
            const cols = 10;
            const col = i % cols;
            const row = Math.floor(i / cols);
            x = CANVAS_CENTER - 750 + col * 150;
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
        const hue = (i * 360) / spawnCount;
        const hexColor = hslToHex(hue, 70, 60);
        
        // Randomly select object type from selected types
        const objectType = typesArray[i % typesArray.length];
        
        switch (objectType) {
          case 'rectangle':
            shapesToCreate.push({
              type: 'rectangle',
              x,
              y,
              width: 60,
              height: 60,
              fillColor: hexColor,
              strokeColor: '#000000',
              strokeWidth: 1,
              zIndex: Date.now() + i, // Unique z-index
            });
            break;
            
          case 'circle':
            shapesToCreate.push({
              type: 'circle',
              x,
              y,
              radius: 30,
              fillColor: hexColor,
              strokeColor: '#000000',
              strokeWidth: 1,
              zIndex: Date.now() + i, // Unique z-index
            });
            break;
            
          case 'line':
            shapesToCreate.push({
              type: 'line',
              x,
              y,
              points: [0, 0, 60, 60],
              fillColor: 'transparent',
              strokeColor: hexColor,
              strokeWidth: 2,
              zIndex: Date.now() + i, // Unique z-index
            });
            break;
            
          case 'text':
            textsToCreate.push({
              x,
              y,
              content: `Text ${i + 1}`,
              fontSize: 16,
              color: hexColor,
            });
            break;
        }
      }
      
      // Batch create all objects (single write per type)
      const batchPromises: Promise<any>[] = [];
      
      if (shapesToCreate.length > 0) {
        batchPromises.push(createShapesBatch(user.userId, shapesToCreate));
      }
      
      if (textsToCreate.length > 0) {
        batchPromises.push(createTextsBatch(user.userId, textsToCreate));
      }
      
      await Promise.all(batchPromises);
      
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      const totalObjects = shapes.length + texts.length;
      setLastTestResults(
        `✅ Created ${spawnCount} objects in ${duration}s (BATCHED)\n` +
        `Types: ${Array.from(selectedTypes).join(', ')}\n` +
        `Pattern: ${spawnPattern}\n` +
        `Total objects on canvas: ${totalObjects}\n` +
        `Shapes batched: ${shapesToCreate.length}, Texts batched: ${textsToCreate.length}`
      );
    } catch (error) {
      console.error('[PerformanceTest] Error spawning objects:', error);
      setLastTestResults(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSpawning(false);
    }
  };

  /**
   * Select all objects on canvas
   */
  const selectAll = () => {
    const allIds = [...shapes.map(s => s.id), ...texts.map(t => t.id)];
    setSelection(allIds);
    setLastTestResults(
      `✅ Selected ${allIds.length} objects\n` +
      `Watch FPS during drag operations`
    );
  };

  /**
   * Clear all selections
   */
  const clearAll = () => {
    clearSelection();
    setLastTestResults('✅ Cleared selection');
  };

  /**
   * Execute AI command
   */
  const runAICommand = async (command: string) => {
    if (!user) {
      setLastTestResults('❌ No user authenticated');
      return;
    }

    setLastTestResults(`⏳ Executing AI command: "${command}"`);
    
    try {
      const startTime = performance.now();
      await executeCommand(command);
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      setLastTestResults(
        `✅ AI command executed in ${duration}s\n` +
        `Command: "${command}"`
      );
    } catch (error) {
      console.error('[PerformanceTest] Error executing AI command:', error);
      setLastTestResults(
        `❌ AI command failed\n` +
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Don't render if closed
  if (!isOpen) {
    return null;
  }

  const totalObjects = shapes.length + texts.length;

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
            <div>Objects on canvas: <strong>{totalObjects}</strong></div>
            <div>Selected: <strong>{selectedIds.length}</strong></div>
            <div>
              FPS: <strong style={{ color: fpsMetrics.fps < 60 ? '#ff6b6b' : '#51cf66' }}>
                {fpsMetrics.fps}
              </strong>
            </div>
          </div>
        </div>

        <div className="test-section">
          <h4>Spawn Test Objects</h4>
          
          <div className="spawn-config">
            <div className="config-group">
              <label>Object Types:</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedTypes.has('rectangle')}
                    onChange={() => toggleObjectType('rectangle')}
                  />
                  Rectangle
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedTypes.has('circle')}
                    onChange={() => toggleObjectType('circle')}
                  />
                  Circle
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedTypes.has('line')}
                    onChange={() => toggleObjectType('line')}
                  />
                  Line
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedTypes.has('text')}
                    onChange={() => toggleObjectType('text')}
                  />
                  Text
                </label>
              </div>
            </div>

            <div className="config-group">
              <label htmlFor="spawn-pattern">Pattern:</label>
              <select
                id="spawn-pattern"
                value={spawnPattern}
                onChange={(e) => setSpawnPattern(e.target.value as SpawnPattern)}
                className="spawn-select"
              >
                <option value="grid">Grid</option>
                <option value="random">Random</option>
                <option value="cluster">Cluster</option>
              </select>
            </div>

            <div className="config-group">
              <label htmlFor="spawn-count">Count:</label>
              <input
                id="spawn-count"
                type="number"
                min="1"
                max="500"
                value={spawnCount}
                onChange={(e) => setSpawnCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="spawn-input"
              />
            </div>

            <button
              onClick={spawnObjects}
              disabled={isSpawning}
              className="test-button"
            >
              {isSpawning ? 'Spawning...' : 'Spawn Objects'}
            </button>
          </div>
        </div>

        <div className="test-section">
          <h4>Selection Tests</h4>
          
          <button
            onClick={selectAll}
            disabled={totalObjects === 0}
            className="test-button"
          >
            Select All ({totalObjects})
          </button>
          
          <button
            onClick={clearAll}
            className="test-button"
          >
            Clear Selection
          </button>
        </div>

        <div className="test-section">
          <h4>AI Commands</h4>
          
          <div className="ai-commands">
            <div className="config-group">
              <label htmlFor="ai-creation">Creation:</label>
              <select
                id="ai-creation"
                onChange={(e) => {
                  if (e.target.value) {
                    runAICommand(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="spawn-select"
                defaultValue=""
              >
                <option value="">Select command...</option>
                <option value="Create a red circle at position 4000, 5000">Create a red circle at position 4000, 5000</option>
                <option value="Add a text layer that says 'Hello World'">Add a text layer that says 'Hello World'</option>
                <option value="Make a 200x300 rectangle">Make a 200x300 rectangle</option>
              </select>
            </div>

            <div className="config-group">
              <label htmlFor="ai-manipulation">Manipulation:</label>
              <select
                id="ai-manipulation"
                onChange={(e) => {
                  if (e.target.value) {
                    runAICommand(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="spawn-select"
                defaultValue=""
              >
                <option value="">Select command...</option>
                <option value="Move the blue rectangle to the center">Move the blue rectangle to the center</option>
                <option value="Resize the circle to be twice as big">Resize the circle to be twice as big</option>
                <option value="Rotate the text 45 degrees">Rotate the text 45 degrees</option>
              </select>
            </div>

            <div className="config-group">
              <label htmlFor="ai-layout">Layout:</label>
              <select
                id="ai-layout"
                onChange={(e) => {
                  if (e.target.value) {
                    runAICommand(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="spawn-select"
                defaultValue=""
              >
                <option value="">Select command...</option>
                <option value="Arrange these shapes in a horizontal row">Arrange these shapes in a horizontal row</option>
                <option value="Create a grid of 3x3 squares">Create a grid of 3x3 squares</option>
                <option value="Space these elements evenly">Space these elements evenly</option>
              </select>
            </div>

            <div className="config-group">
              <label htmlFor="ai-complex">Complex:</label>
              <select
                id="ai-complex"
                onChange={(e) => {
                  if (e.target.value) {
                    runAICommand(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="spawn-select"
                defaultValue=""
              >
                <option value="">Select command...</option>
                <option value="Create a login form with username and password fields">Create a login form with username and password fields</option>
                <option value="Build a navigation bar with 4 menu items">Build a navigation bar with 4 menu items</option>
                <option value="Make a card layout with title, image, and description">Make a card layout with title, image, and description</option>
              </select>
            </div>
          </div>
        </div>

        {lastTestResults && (
          <div className="test-results">
            <h4>Test Results</h4>
            <pre>{lastTestResults}</pre>
          </div>
        )}

        <div className="test-help">
          <div style={{ fontSize: '11px', opacity: 0.7 }}>
            Press P to close
          </div>
        </div>
      </div>
    </div>
  );
}
