/**
 * Performance Monitoring Utilities
 * 
 * Tracks FPS and logs warnings when performance drops below target.
 * Useful for development and debugging performance issues.
 */

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  timestamp: number;
}

/**
 * FPS Monitor Class
 * Tracks frame rate and provides real-time performance metrics
 */
export class FPSMonitor {
  private lastFrameTime: number = performance.now();
  private frameCount: number = 0;
  private fps: number = 60;
  private fpsUpdateInterval: number = 1000; // Update FPS every second
  private lastFpsUpdate: number = performance.now();
  private enabled: boolean = false;
  private animationFrameId: number | null = null;
  private onUpdate?: (metrics: PerformanceMetrics) => void;

  /**
   * Start monitoring FPS
   * @param onUpdate - Optional callback for FPS updates
   */
  start(onUpdate?: (metrics: PerformanceMetrics) => void): void {
    if (this.enabled) return;
    
    this.enabled = true;
    this.onUpdate = onUpdate;
    this.lastFrameTime = performance.now();
    this.lastFpsUpdate = performance.now();
    this.frameCount = 0;
    
    this.measureFrame();
  }

  /**
   * Stop monitoring FPS
   */
  stop(): void {
    this.enabled = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * Measure frame and calculate FPS
   */
  private measureFrame = (): void => {
    if (!this.enabled) return;

    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    this.frameCount++;

    // Update FPS every second
    const timeSinceLastUpdate = now - this.lastFpsUpdate;
    if (timeSinceLastUpdate >= this.fpsUpdateInterval) {
      this.fps = Math.round((this.frameCount * 1000) / timeSinceLastUpdate);
      this.frameCount = 0;
      this.lastFpsUpdate = now;

      // Call update callback
      if (this.onUpdate) {
        this.onUpdate({
          fps: this.fps,
          frameTime,
          timestamp: now,
        });
      }

      // Log warning if FPS drops below 60
      if (this.fps < 60) {
        console.warn(`⚠️ Performance warning: FPS dropped to ${this.fps}`);
      }
    }

    // Continue measuring
    this.animationFrameId = requestAnimationFrame(this.measureFrame);
  };
}

/**
 * Global FPS monitor instance
 */
let globalMonitor: FPSMonitor | null = null;

/**
 * Start global FPS monitoring
 * @param onUpdate - Optional callback for FPS updates
 */
export function startFPSMonitoring(
  onUpdate?: (metrics: PerformanceMetrics) => void
): void {
  if (!globalMonitor) {
    globalMonitor = new FPSMonitor();
  }
  globalMonitor.start(onUpdate);
}

/**
 * Stop global FPS monitoring
 */
export function stopFPSMonitoring(): void {
  if (globalMonitor) {
    globalMonitor.stop();
  }
}

/**
 * Get current FPS from global monitor
 */
export function getCurrentFPS(): number {
  return globalMonitor ? globalMonitor.getFPS() : 60;
}

/**
 * Performance measurement utility
 * Measures execution time of a function
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T,
  warnThreshold?: number
): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;

  if (warnThreshold && duration > warnThreshold) {
    console.warn(
      `⚠️ Performance: "${name}" took ${duration.toFixed(2)}ms (threshold: ${warnThreshold}ms)`
    );
  }

  return result;
}

/**
 * Debounce function
 * Limits the rate at which a function can fire
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * Ensures a function is only called once per specified time period
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Log performance metrics to console
 * Useful for debugging and profiling
 */
export function logPerformanceMetrics(label: string, metrics: PerformanceMetrics): void {
  console.log(`📊 ${label}:`, {
    fps: metrics.fps,
    frameTime: `${metrics.frameTime.toFixed(2)}ms`,
    timestamp: metrics.timestamp,
  });
}

