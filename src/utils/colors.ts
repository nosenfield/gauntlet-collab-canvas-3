/**
 * Color utilities for user assignment and shape styling
 */

/**
 * Predefined color palette for user assignment
 * Colors are chosen to be distinct and accessible
 */
export const USER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Lavender
  '#85C1E9', // Sky Blue
  '#F8BBD9', // Pink
  '#A8E6CF', // Light Green
  '#FFD3A5', // Peach
  '#C7CEEA', // Light Blue
  '#FFB6C1', // Light Pink
] as const;

/**
 * Generate a random color from the predefined palette
 */
export const generateRandomColor = (): string => {
  const randomIndex = Math.floor(Math.random() * USER_COLORS.length);
  return USER_COLORS[randomIndex];
};

/**
 * Get color by index (for consistent user assignment)
 */
export const getColorByIndex = (index: number): string => {
  return USER_COLORS[index % USER_COLORS.length];
};

/**
 * Check if a color is valid hex format
 */
export const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

/**
 * Convert hex color to RGB
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Get contrasting text color (black or white) for a background color
 */
export const getContrastingTextColor = (backgroundColor: string): string => {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return '#000000';

  // Calculate luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  
  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

/**
 * Generate a subtle variation of a color (lighter or darker)
 */
export const generateColorVariation = (color: string, factor: number = 0.2): string => {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const { r, g, b } = rgb;
  const newR = Math.max(0, Math.min(255, Math.round(r + (255 - r) * factor)));
  const newG = Math.max(0, Math.min(255, Math.round(g + (255 - g) * factor)));
  const newB = Math.max(0, Math.min(255, Math.round(b + (255 - b) * factor)));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};
