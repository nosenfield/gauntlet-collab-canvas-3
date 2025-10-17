/**
 * Debounce Utility
 * 
 * Creates a debounced version of a function that delays invoking
 * until after a specified wait time has elapsed since the last call.
 * 
 * Useful for rate-limiting expensive operations like Firestore updates.
 */

/**
 * Creates a debounced function
 * 
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns Debounced function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    // Clear existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Creates a debounced function that also provides a way to flush pending calls
 * 
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns Object with debounced function and flush method
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounceWithFlush<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): {
  debounced: (...args: Parameters<T>) => void;
  flush: () => void;
  cancel: () => void;
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = (...args: Parameters<T>) => {
    lastArgs = args;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
      lastArgs = null;
    }, wait);
  };

  const flush = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (lastArgs !== null) {
      func(...lastArgs);
      lastArgs = null;
    }
  };

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  return { debounced, flush, cancel };
}

