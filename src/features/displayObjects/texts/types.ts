/**
 * Text Display Object Types
 * 
 * Type definitions for text objects in the canvas.
 * Text objects support rich text editing with font, size, alignment, and styling.
 */

import type { BaseDisplayObject } from '../common/types';

/**
 * Text Display Object
 * 
 * Represents a text box on the canvas with editable content and styling properties.
 */
export interface TextDisplayObject extends BaseDisplayObject {
  /** Category identifier */
  category: 'text';
  
  /** Text content */
  content: string;
  
  /** Text box dimensions */
  width: number;
  height: number;
  
  /** Font properties */
  fontFamily: string;
  fontSize: number;
  fontWeight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  
  /** Text alignment */
  textAlign: 'left' | 'center' | 'right' | 'justify';
  
  /** Line height multiplier (e.g., 1.5 = 150% of font size) */
  lineHeight: number;
  
  /** Text color (hex format) */
  color: string;
  
  /** Opacity (0-1) */
  opacity: number;
}

/**
 * Data for creating a new text object
 */
export interface CreateTextData {
  x: number;
  y: number;
  content?: string;
  width?: number;
  height?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  color?: string;
  opacity?: number;
}

/**
 * Data for updating an existing text object
 */
export interface UpdateTextData {
  x?: number;
  y?: number;
  content?: string;
  width?: number;
  height?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  color?: string;
  opacity?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}

/**
 * Default text properties for new text objects
 */
export const DEFAULT_TEXT_PROPERTIES: Readonly<{
  content: string;
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: 400;
  textAlign: 'left';
  lineHeight: number;
  color: string;
  opacity: number;
}> = {
  content: 'Double-click to edit',
  width: 200,
  height: 100,
  fontFamily: 'Arial',
  fontSize: 16,
  fontWeight: 400,
  textAlign: 'left',
  lineHeight: 1.2,
  color: '#000000',
  opacity: 1.0,
} as const;

