/**
 * Activity Tracker - Efficient user activity detection
 * 
 * Tracks user interaction events (mouse, touch, keyboard, scroll) with
 * minimal resource usage through throttling. Used to determine when
 * keep-alive pings should be sent to maintain BLE connection.
 */

/**
 * Simple throttle function to limit function execution rate
 * @param func - Function to throttle
 * @param delay - Minimum time between executions in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      func(...args);
    } else {
      // Schedule execution at the end of the delay period
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
      }, delay - timeSinceLastCall);
    }
  };
}

/**
 * Activity Tracker class for detecting user interactions
 */
export class ActivityTracker {
  private lastActivity: number = Date.now();
  private throttledUpdate: () => void;
  private isActive: boolean = false;

  constructor(
    private onActivity: () => void,
    private throttleDelay: number = 500 // Update at most twice per second
  ) {
    this.throttledUpdate = throttle(() => {
      this.updateActivity();
    }, this.throttleDelay);
  }

  /**
   * Start tracking user activity
   */
  start(): void {
    if (this.isActive) return;

    this.isActive = true;
    this.lastActivity = Date.now();

    // Mouse events
    document.addEventListener('mousemove', this.throttledUpdate, { passive: true });
    document.addEventListener('click', this.throttledUpdate);

    // Touch events
    document.addEventListener('touchstart', this.throttledUpdate, { passive: true });
    document.addEventListener('touchmove', this.throttledUpdate, { passive: true });

    // Keyboard events
    document.addEventListener('keydown', this.throttledUpdate);

    // Scroll events
    document.addEventListener('scroll', this.throttledUpdate, { passive: true });

    // Window focus
    window.addEventListener('focus', this.handleFocus);

    console.log('Activity tracking started');
  }

  /**
   * Stop tracking user activity
   */
  stop(): void {
    if (!this.isActive) return;

    this.isActive = false;

    // Remove all event listeners
    document.removeEventListener('mousemove', this.throttledUpdate);
    document.removeEventListener('click', this.throttledUpdate);
    document.removeEventListener('touchstart', this.throttledUpdate);
    document.removeEventListener('touchmove', this.throttledUpdate);
    document.removeEventListener('keydown', this.throttledUpdate);
    document.removeEventListener('scroll', this.throttledUpdate);
    window.removeEventListener('focus', this.handleFocus);

    console.log('Activity tracking stopped');
  }

  /**
   * Handle window focus event
   */
  private handleFocus = (): void => {
    this.updateActivity();
  };

  /**
   * Update last activity timestamp and notify listeners
   */
  private updateActivity(): void {
    this.lastActivity = Date.now();
    this.onActivity();
  }

  /**
   * Get time since last activity in milliseconds
   */
  getTimeSinceActivity(): number {
    return Date.now() - this.lastActivity;
  }

  /**
   * Get last activity timestamp
   */
  getLastActivity(): number {
    return this.lastActivity;
  }

  /**
   * Check if tracking is active
   */
  isTracking(): boolean {
    return this.isActive;
  }
}
