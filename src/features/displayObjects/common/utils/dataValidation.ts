/**
 * Data Validation Utilities
 * 
 * Runtime validation for Firestore data to prevent crashes from malformed data.
 * All data read from Firestore should be validated before casting to typed interfaces.
 * 
 * Why this is critical:
 * - Firestore data could be corrupted, outdated, or malicious
 * - Schema changes might leave old data in database
 * - TypeScript type assertions don't provide runtime safety
 * - Better to reject bad data than crash with cryptic errors
 */

import type { ShapeDisplayObject, ShapeType } from '../../shapes/types';
import type { TextDisplayObject } from '../../texts/types';
import type { Timestamp } from 'firebase/firestore';

/**
 * Validation Result
 */
interface ValidationResult<T> {
  valid: boolean;
  data: T | null;
  errors: string[];
}

/**
 * Type guard: Check if value is a Firestore Timestamp
 */
function isFirestoreTimestamp(value: any): value is Timestamp {
  return (
    value &&
    typeof value === 'object' &&
    'seconds' in value &&
    'nanoseconds' in value &&
    typeof value.seconds === 'number' &&
    typeof value.nanoseconds === 'number'
  );
}

/**
 * Validate common base display object properties
 * Returns array of error messages (empty if valid)
 */
function validateBaseProperties(data: any): string[] {
  const errors: string[] = [];

  // Required primitive fields
  if (typeof data.x !== 'number') errors.push('Invalid or missing x position');
  if (typeof data.y !== 'number') errors.push('Invalid or missing y position');
  if (typeof data.rotation !== 'number') errors.push('Invalid or missing rotation');
  if (typeof data.scaleX !== 'number') errors.push('Invalid or missing scaleX');
  if (typeof data.scaleY !== 'number') errors.push('Invalid or missing scaleY');
  if (typeof data.opacity !== 'number') errors.push('Invalid or missing opacity');
  if (typeof data.zIndex !== 'number') errors.push('Invalid or missing zIndex');

  // Metadata fields
  if (typeof data.createdBy !== 'string') errors.push('Invalid or missing createdBy');
  if (typeof data.lastModifiedBy !== 'string') errors.push('Invalid or missing lastModifiedBy');
  
  // Timestamps (can be server-generated, so allow null during creation)
  if (data.createdAt !== null && !isFirestoreTimestamp(data.createdAt)) {
    errors.push('Invalid createdAt timestamp');
  }
  if (data.lastModifiedAt !== null && !isFirestoreTimestamp(data.lastModifiedAt)) {
    errors.push('Invalid lastModifiedAt timestamp');
  }

  return errors;
}

/**
 * Validate Shape Display Object data from Firestore
 * 
 * @param id - Document ID
 * @param data - Raw Firestore document data
 * @returns Validation result with typed data or errors
 */
export function validateShapeData(id: string, data: any): ValidationResult<ShapeDisplayObject> {
  const errors: string[] = [];

  // Check basic structure
  if (!data || typeof data !== 'object') {
    return { valid: false, data: null, errors: ['Data is not an object'] };
  }

  // Validate category
  if (data.category !== 'shape') {
    errors.push(`Invalid category: expected 'shape', got '${data.category}'`);
  }

  // Validate type
  const validTypes: ShapeType[] = ['rectangle', 'circle', 'line'];
  if (!validTypes.includes(data.type)) {
    errors.push(`Invalid shape type: '${data.type}'`);
  }

  // Validate base properties
  errors.push(...validateBaseProperties(data));

  // Validate shape-specific properties
  if (typeof data.fillColor !== 'string') errors.push('Invalid or missing fillColor');
  if (typeof data.strokeColor !== 'string') errors.push('Invalid or missing strokeColor');
  if (typeof data.strokeWidth !== 'number') errors.push('Invalid or missing strokeWidth');

  // Type-specific validation
  if (data.type === 'rectangle') {
    if (typeof data.width !== 'number') errors.push('Rectangle missing width');
    if (typeof data.height !== 'number') errors.push('Rectangle missing height');
    // borderRadius is optional
    if (data.borderRadius !== undefined && typeof data.borderRadius !== 'number') {
      errors.push('Rectangle borderRadius must be number if provided');
    }
  } else if (data.type === 'circle') {
    if (typeof data.radius !== 'number') errors.push('Circle missing radius');
    // Width and height are computed from radius, may not exist in old data
  } else if (data.type === 'line') {
    if (!Array.isArray(data.points)) {
      errors.push('Line missing points array');
    } else if (data.points.some((p: any) => typeof p !== 'number')) {
      errors.push('Line points must be numbers');
    }
  }

  // If validation failed, return errors
  if (errors.length > 0) {
    return { valid: false, data: null, errors };
  }

  // Validation passed - safe to cast
  const validatedShape: ShapeDisplayObject = {
    id,
    category: 'shape',
    type: data.type,
    x: data.x,
    y: data.y,
    rotation: data.rotation,
    scaleX: data.scaleX,
    scaleY: data.scaleY,
    opacity: data.opacity,
    blendMode: data.blendMode, // Optional blend mode
    zIndex: data.zIndex,
    fillColor: data.fillColor,
    strokeColor: data.strokeColor,
    strokeWidth: data.strokeWidth,
    createdBy: data.createdBy,
    createdAt: data.createdAt,
    lastModifiedBy: data.lastModifiedBy,
    lastModifiedAt: data.lastModifiedAt,
    
    // Type-specific properties
    ...(data.type === 'rectangle' && {
      width: data.width,
      height: data.height,
      borderRadius: data.borderRadius,
    }),
    ...(data.type === 'circle' && {
      radius: data.radius,
      width: data.width ?? data.radius * 2, // Compute if missing
      height: data.height ?? data.radius * 2,
    }),
    ...(data.type === 'line' && {
      points: data.points,
    }),
  } as ShapeDisplayObject;

  return { valid: true, data: validatedShape, errors: [] };
}

/**
 * Validate Text Display Object data from Firestore
 * 
 * @param id - Document ID
 * @param data - Raw Firestore document data
 * @returns Validation result with typed data or errors
 */
export function validateTextData(id: string, data: any): ValidationResult<TextDisplayObject> {
  const errors: string[] = [];

  // Check basic structure
  if (!data || typeof data !== 'object') {
    return { valid: false, data: null, errors: ['Data is not an object'] };
  }

  // Validate category
  if (data.category !== 'text') {
    errors.push(`Invalid category: expected 'text', got '${data.category}'`);
  }

  // Validate base properties
  errors.push(...validateBaseProperties(data));

  // Validate text-specific properties
  if (typeof data.content !== 'string') errors.push('Invalid or missing content');
  if (typeof data.width !== 'number') errors.push('Invalid or missing width');
  if (typeof data.height !== 'number') errors.push('Invalid or missing height');
  if (typeof data.fontFamily !== 'string') errors.push('Invalid or missing fontFamily');
  if (typeof data.fontSize !== 'number') errors.push('Invalid or missing fontSize');
  if (typeof data.fontWeight !== 'number') errors.push('Invalid or missing fontWeight');
  if (typeof data.color !== 'string') errors.push('Invalid or missing color');
  if (typeof data.lineHeight !== 'number') errors.push('Invalid or missing lineHeight');

  // Validate textAlign
  const validAlignments = ['left', 'center', 'right', 'justify'];
  if (!validAlignments.includes(data.textAlign)) {
    errors.push(`Invalid textAlign: '${data.textAlign}'`);
  }

  // If validation failed, return errors
  if (errors.length > 0) {
    return { valid: false, data: null, errors };
  }

  // Validation passed - safe to cast
  const validatedText: TextDisplayObject = {
    id,
    category: 'text',
    x: data.x,
    y: data.y,
    rotation: data.rotation,
    scaleX: data.scaleX,
    scaleY: data.scaleY,
    opacity: data.opacity,
    blendMode: data.blendMode, // Optional blend mode
    zIndex: data.zIndex,
    content: data.content,
    width: data.width,
    height: data.height,
    fontFamily: data.fontFamily,
    fontSize: data.fontSize,
    fontWeight: data.fontWeight,
    textAlign: data.textAlign,
    lineHeight: data.lineHeight,
    color: data.color,
    createdBy: data.createdBy,
    createdAt: data.createdAt,
    lastModifiedBy: data.lastModifiedBy,
    lastModifiedAt: data.lastModifiedAt,
  };

  return { valid: true, data: validatedText, errors: [] };
}

/**
 * Batch validate array of shape data
 * Logs errors for invalid items but doesn't throw
 * 
 * @param items - Array of {id, data} pairs from Firestore
 * @returns Array of valid shapes only
 */
export function validateShapeBatch(
  items: Array<{ id: string; data: any }>
): ShapeDisplayObject[] {
  const validShapes: ShapeDisplayObject[] = [];

  for (const item of items) {
    const result = validateShapeData(item.id, item.data);
    
    if (result.valid && result.data) {
      validShapes.push(result.data);
    } else {
      console.error(
        `[DataValidation] Invalid shape data for ${item.id}:`,
        result.errors.join(', ')
      );
      // Don't throw - just skip invalid data
    }
  }

  return validShapes;
}

/**
 * Batch validate array of text data
 * Logs errors for invalid items but doesn't throw
 * 
 * @param items - Array of {id, data} pairs from Firestore
 * @returns Array of valid texts only
 */
export function validateTextBatch(
  items: Array<{ id: string; data: any }>
): TextDisplayObject[] {
  const validTexts: TextDisplayObject[] = [];

  for (const item of items) {
    const result = validateTextData(item.id, item.data);
    
    if (result.valid && result.data) {
      validTexts.push(result.data);
    } else {
      console.error(
        `[DataValidation] Invalid text data for ${item.id}:`,
        result.errors.join(', ')
      );
      // Don't throw - just skip invalid data
    }
  }

  return validTexts;
}

