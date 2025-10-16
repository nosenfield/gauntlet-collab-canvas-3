/**
 * Debounce and throttle utilities for performance optimization
 */

/**
 * Debounce a function call
 * @param func Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

/**
 * Throttle a function call
 * @param func Function to throttle
 * @param delay Delay in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
      }, delay - (now - lastCall));
    }
  };
};

/**
 * Create a debounced version of a function with immediate execution option
 * @param func Function to debounce
 * @param delay Delay in milliseconds
 * @param immediate Execute immediately on first call
 * @returns Debounced function
 */
export const debounceImmediate = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  immediate: boolean = false
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let hasExecuted = false;

  return (...args: Parameters<T>) => {
    const execute = () => {
      func(...args);
      hasExecuted = true;
    };

    if (immediate && !hasExecuted) {
      execute();
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      if (!immediate || hasExecuted) {
        execute();
      }
    }, delay);
  };
};

/**
 * Create a throttled version of a function with leading/trailing options
 * @param func Function to throttle
 * @param delay Delay in milliseconds
 * @param options Throttle options
 * @returns Throttled function
 */
export const throttleAdvanced = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
  } = {}
): ((...args: Parameters<T>) => void) => {
  const { leading = true, trailing = true } = options;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCall = 0;
  let lastArgs: Parameters<T> | null = null;

  const execute = (...args: Parameters<T>) => {
    func(...args);
    lastCall = Date.now();
    lastArgs = null;
  };

  return (...args: Parameters<T>) => {
    const now = Date.now();
    lastArgs = args;

    if (now - lastCall >= delay) {
      if (leading) {
        execute(...args);
      }
    } else if (trailing) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        if (lastArgs) {
          execute(...lastArgs);
        }
      }, delay - (now - lastCall));
    }
  };
};

/**
 * Create a requestAnimationFrame-based throttle
 * @param func Function to throttle
 * @returns RAF-throttled function
 */
export const throttleRAF = <T extends (...args: any[]) => any>(
  func: T
): ((...args: Parameters<T>) => void) => {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  const execute = (...args: Parameters<T>) => {
    func(...args);
    rafId = null;
    lastArgs = null;
  };

  return (...args: Parameters<T>) => {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs) {
          execute(...lastArgs);
        }
      });
    }
  };
};

/**
 * Create a debounced function that returns a promise
 * @param func Function to debounce
 * @param delay Delay in milliseconds
 * @returns Promise-returning debounced function
 */
export const debouncePromise = <T extends (...args: any[]) => Promise<any>>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let resolvePromise: ((value: Awaited<ReturnType<T>>) => void) | null = null;
  let rejectPromise: ((reason?: any) => void) | null = null;

  return (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    return new Promise((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      resolvePromise = resolve;
      rejectPromise = reject;

      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolvePromise?.(result);
        } catch (error) {
          rejectPromise?.(error);
        }
      }, delay);
    });
  };
};
