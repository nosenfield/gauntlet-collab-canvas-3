/**
 * useExport Hook
 * 
 * Handles exporting the canvas or selected objects as PNG or SVG
 * Triggered by Cmd+S keyboard shortcut
 */

import { useCallback } from 'react';
import { useSelection } from '@/features/displayObjects/common/store/selectionStore';
import { useShapes } from '@/features/displayObjects/shapes/store/shapesStore';
import { useTexts } from '@/features/displayObjects/texts/store/textsStore';
import type { ShapeDisplayObject } from '@/features/displayObjects/shapes/types';
import type { TextDisplayObject } from '@/features/displayObjects/texts/types';

interface UseExportParams {
  stageRef: React.RefObject<any>;
}

interface UseExportReturn {
  exportAsPNG: () => void;
  exportAsSVG: () => void;
  exportSelection: (format: 'png' | 'svg') => void;
}

/**
 * Custom hook for exporting canvas or selection
 */
export function useExport({ stageRef }: UseExportParams): UseExportReturn {
  const { selectedIds, hasSelection } = useSelection();
  const { shapes } = useShapes();
  const { texts } = useTexts();

  /**
   * Download a file with the given data URL and filename
   */
  const downloadFile = useCallback((dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  /**
   * Generate a timestamp-based filename
   */
  const generateFilename = useCallback((prefix: string, extension: string): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${prefix}_${timestamp}.${extension}`;
  }, []);

  /**
   * Export the entire canvas as PNG
   */
  const exportAsPNG = useCallback(() => {
    if (!stageRef.current) {
      console.warn('[Export] Stage ref not available');
      return;
    }

    try {
      console.log('[Export] Exporting canvas as PNG');
      
      const stage = stageRef.current;
      
      // Get the stage's data URL at standard resolution
      const dataUrl = stage.toDataURL({
        pixelRatio: 2, // 2x resolution for better quality
      });

      // Download the image
      const filename = generateFilename('collab-canvas', 'png');
      downloadFile(dataUrl, filename);
      
      console.log('[Export] PNG export complete:', filename);
    } catch (error) {
      console.error('[Export] Failed to export PNG:', error);
    }
  }, [stageRef, downloadFile, generateFilename]);

  /**
   * Export the entire canvas as SVG
   */
  const exportAsSVG = useCallback(() => {
    if (!stageRef.current) {
      console.warn('[Export] Stage ref not available');
      return;
    }

    try {
      console.log('[Export] Exporting canvas as SVG');
      
      const stage = stageRef.current;
      
      // Get the stage's SVG representation
      const svgData = stage.toDataURL({
        mimeType: 'image/svg+xml',
      });

      // Download the SVG
      const filename = generateFilename('collab-canvas', 'svg');
      downloadFile(svgData, filename);
      
      console.log('[Export] SVG export complete:', filename);
    } catch (error) {
      console.error('[Export] Failed to export SVG:', error);
    }
  }, [stageRef, downloadFile, generateFilename]);

  /**
   * Export only the selected objects
   */
  const exportSelection = useCallback((format: 'png' | 'svg') => {
    if (!stageRef.current || !hasSelection()) {
      console.warn('[Export] No selection to export');
      return;
    }

    try {
      console.log(`[Export] Exporting selection as ${format.toUpperCase()}`);
      
      // Get selected objects
      const selectedShapes = shapes.filter(shape => selectedIds.includes(shape.id));
      const selectedTexts = texts.filter(text => selectedIds.includes(text.id));
      const selectedObjects = [...selectedShapes, ...selectedTexts];

      if (selectedObjects.length === 0) {
        console.warn('[Export] No selected objects found');
        return;
      }

      // Calculate bounding box of selected objects
      const bounds = calculateSelectionBounds(selectedObjects);
      
      // Create a temporary stage for export
      const tempStage = createTempStageForExport(selectedObjects, bounds);
      
      // Export based on format
      let dataUrl: string;
      if (format === 'svg') {
        dataUrl = tempStage.toDataURL({
          mimeType: 'image/svg+xml',
        });
      } else {
        dataUrl = tempStage.toDataURL({
          pixelRatio: 2,
        });
      }
      
      // Download
      const filename = generateFilename('selection', format);
      downloadFile(dataUrl, filename);
      
      // Cleanup
      tempStage.destroy();
      
      console.log(`[Export] Selection ${format.toUpperCase()} export complete:`, filename);
    } catch (error) {
      console.error(`[Export] Failed to export selection as ${format.toUpperCase()}:`, error);
    }
  }, [stageRef, selectedIds, shapes, texts, hasSelection, downloadFile, generateFilename]);

  return {
    exportAsPNG,
    exportAsSVG,
    exportSelection,
  };
}

/**
 * Calculate the bounding box of a collection of objects
 */
function calculateSelectionBounds(objects: (ShapeDisplayObject | TextDisplayObject)[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  objects.forEach(obj => {
    // Get object bounds considering scale and rotation
    let width: number;
    let height: number;

    if (obj.category === 'shape') {
      const shape = obj as ShapeDisplayObject;
      if (shape.type === 'rectangle') {
        width = shape.width * shape.scaleX;
        height = shape.height * shape.scaleY;
      } else if (shape.type === 'circle') {
        const diameter = shape.radius * 2;
        width = diameter * shape.scaleX;
        height = diameter * shape.scaleY;
      } else {
        // Line - approximate with small bounds
        width = 10;
        height = 10;
      }
    } else {
      // Text
      const text = obj as TextDisplayObject;
      width = text.width * text.scaleX;
      height = text.height * text.scaleY;
    }

    // Update bounds
    minX = Math.min(minX, obj.x);
    minY = Math.min(minY, obj.y);
    maxX = Math.max(maxX, obj.x + width);
    maxY = Math.max(maxY, obj.y + height);
  });

  const padding = 20; // Add some padding around selection

  return {
    x: minX - padding,
    y: minY - padding,
    width: (maxX - minX) + (padding * 2),
    height: (maxY - minY) + (padding * 2),
  };
}

/**
 * Create a temporary Konva stage containing only the selected objects
 */
function createTempStageForExport(
  objects: (ShapeDisplayObject | TextDisplayObject)[],
  bounds: { x: number; y: number; width: number; height: number }
) {
  // Import Konva dynamically to create temp stage
  const Konva = (window as any).Konva;
  
  const stage = new Konva.Stage({
    container: document.createElement('div'),
    width: bounds.width,
    height: bounds.height,
  });

  const layer = new Konva.Layer();
  stage.add(layer);

  // Add shapes to the layer
  objects.forEach(obj => {
    // Adjust position relative to bounds
    const relativeX = obj.x - bounds.x;
    const relativeY = obj.y - bounds.y;

    if (obj.category === 'shape') {
      const shape = obj as ShapeDisplayObject;
      
      if (shape.type === 'rectangle') {
        const rect = new Konva.Rect({
          x: relativeX,
          y: relativeY,
          width: shape.width,
          height: shape.height,
          fill: shape.fillColor,
          stroke: shape.strokeColor,
          strokeWidth: shape.strokeWidth,
          cornerRadius: shape.borderRadius,
          rotation: shape.rotation,
          scaleX: shape.scaleX,
          scaleY: shape.scaleY,
          opacity: shape.opacity,
        });
        layer.add(rect);
      } else if (shape.type === 'circle') {
        const circle = new Konva.Circle({
          x: relativeX + (shape.radius * shape.scaleX),
          y: relativeY + (shape.radius * shape.scaleY),
          radius: shape.radius,
          fill: shape.fillColor,
          stroke: shape.strokeColor,
          strokeWidth: shape.strokeWidth,
          rotation: shape.rotation,
          scaleX: shape.scaleX,
          scaleY: shape.scaleY,
          opacity: shape.opacity,
        });
        layer.add(circle);
      } else if (shape.type === 'line') {
        const line = new Konva.Line({
          points: shape.points,
          stroke: shape.strokeColor,
          strokeWidth: shape.strokeWidth,
          lineCap: 'round',
          lineJoin: 'round',
          x: relativeX,
          y: relativeY,
          rotation: shape.rotation,
          scaleX: shape.scaleX,
          scaleY: shape.scaleY,
          opacity: shape.opacity,
        });
        layer.add(line);
      }
    } else {
      // Text
      const text = obj as TextDisplayObject;
      const textNode = new Konva.Text({
        x: relativeX,
        y: relativeY,
        text: text.content,
        fontSize: text.fontSize,
        fontFamily: text.fontFamily,
        fontStyle: text.fontWeight >= 600 ? 'bold' : 'normal',
        fill: text.color,
        width: text.width,
        align: text.textAlign,
        lineHeight: text.lineHeight,
        rotation: text.rotation,
        scaleX: text.scaleX,
        scaleY: text.scaleY,
        opacity: text.opacity,
      });
      layer.add(textNode);
    }
  });

  layer.draw();
  return stage;
}

