/**
 * Text Display Object Types
 * 
 * Type definitions for text objects in the canvas.
 * Text objects support rich text editing with font, size, alignment, and styling.
 * 
 * Color Convention:
 * All color values MUST use hex format (#RRGGBB or #RRGGBBAA).
 * See shapes/types.ts for detailed color convention rules.
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
  
  /** Text color in hex format (e.g., '#000000') */
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
  blendMode?: string;  // BlendMode from common/types
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
  blendMode?: string;  // BlendMode from common/types
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  zIndex?: number;
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
  content: 'Hello world! 👋🌎',
  width: 200,
  height: 100,
  fontFamily: 'Arial',
  fontSize: 32,
  fontWeight: 400,
  textAlign: 'left',
  lineHeight: 1.2,
  color: '#FFFFFF',
  opacity: 1.0,
} as const;

