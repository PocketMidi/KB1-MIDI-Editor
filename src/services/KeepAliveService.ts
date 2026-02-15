/**
 * Keep-Alive Service - Manages BLE connection keep-alive pings
 * 
 * Sends periodic pings to the KB1 device to prevent it from going to sleep
 * during active configuration sessions. Implements smart ping management
 * based on user activity and page visibility.
 */

import { ActivityTracker } from '../utils/ActivityTracker';

export interface KeepAliveConfig {
  /** Interval between keep-alive pings in milliseconds (default: 45 seconds) */
  pingInterval?: number;
  /** Stop pings after this much inactivity in milliseconds (default: 2 minutes) */
  activityTimeout?: number;
  /** Activity tracking throttle delay in milliseconds (default: 500ms) */
  throttleDelay?: number;
}

/**
 * Service for managing keep-alive pings to maintain BLE connection
 */
export class KeepAliveService {
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private activityTracker: ActivityTracker;
  private sendPingCallback: (() => Promise<void>) | null = null;
  private isRunning: boolean = false;

  private readonly PING_INTERVAL: number;
  private readonly ACTIVITY_TIMEOUT: number;

  constructor(config: KeepAliveConfig = {}) {
    // 45 seconds - well under firmware's timeouts
    this.PING_INTERVAL = config.pingInterval ?? 45000;
    // 2 minutes after last activity
    this.ACTIVITY_TIMEOUT = config.activityTimeout ?? 120000;

    // Create activity tracker
    this.activityTracker = new ActivityTracker(
      () => this.onActivity(),
      config.throttleDelay ?? 500
    );
  }

  /**
   * Set the callback function that sends pings
   */
  setPingCallback(callback: () => Promise<void>): void {
    this.sendPingCallback = callback;
  }

  /**
   * Start the keep-alive ping system
   */
  startKeepAlive(): void {
    if (this.isRunning) {
      console.log('Keep-alive already running');
      return;
    }

    if (!this.sendPingCallback) {
      console.error('Cannot start keep-alive: no ping callback set');
      return;
    }

    this.isRunning = true;
    
    // Start activity tracking
    this.activityTracker.start();

    // Start ping interval
    this.pingInterval = setInterval(() => {
      this.checkAndSendPing();
    }, this.PING_INTERVAL);

    console.log('Keep-alive started (ping every 45s, stop after 2min inactivity)');
  }

  /**
   * Stop the keep-alive ping system
   */
  stopKeepAlive(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Stop ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Stop activity tracking
    this.activityTracker.stop();

    console.log('Keep-alive stopped');
  }

  /**
   * Update activity timestamp (called by activity tracker)
   */
  updateActivity(): void {
    // Activity tracker handles this internally
    // This method is for external manual activity updates
    this.onActivity();
  }

  /**
   * Handle activity detected
   */
  private onActivity(): void {
    // Activity timestamp is updated in the tracker
    // We just log for debugging
    // console.log('Activity detected');
  }

  /**
   * Check if a ping should be sent and send it
   */
  private async checkAndSendPing(): Promise<void> {
    if (!this.shouldSendPing()) {
      console.log('Skipping ping - no recent activity');
      return;
    }

    await this.sendPing();
  }

  /**
   * Determine if a ping should be sent based on recent activity
   */
  private shouldSendPing(): boolean {
    const timeSinceActivity = this.activityTracker.getTimeSinceActivity();
    return timeSinceActivity < this.ACTIVITY_TIMEOUT;
  }

  /**
   * Send a keep-alive ping
   */
  private async sendPing(): Promise<void> {
    if (!this.sendPingCallback) {
      console.error('No ping callback set');
      return;
    }

    try {
      await this.sendPingCallback();
    } catch (error) {
      console.warn('Keep-alive ping failed:', error);
    }
  }

  /**
   * Check if keep-alive is currently running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get time since last activity in milliseconds
   */
  getTimeSinceActivity(): number {
    return this.activityTracker.getTimeSinceActivity();
  }

  /**
   * Get last activity timestamp
   */
  getLastActivity(): number {
    return this.activityTracker.getLastActivity();
  }
}
