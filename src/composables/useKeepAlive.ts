/**
 * Use Keep-Alive Composable - Vue integration for keep-alive service
 * 
 * Provides a Vue composable for managing BLE keep-alive pings with
 * automatic lifecycle management and connection status integration.
 */

import { onMounted, onBeforeUnmount, ref } from 'vue';
import { KeepAliveService } from '../services/KeepAliveService';
import type { BLEClient } from '../ble/bleClient';

/**
 * Vue composable for managing keep-alive pings
 */
export function useKeepAlive(bleClient: BLEClient) {
  const keepAliveService = new KeepAliveService();
  const isKeepAliveActive = ref(false);
  let stabilizationTimeout: ReturnType<typeof setTimeout> | null = null;

  // Delay to allow BLE connection to stabilize before starting keep-alive
  const STABILIZATION_DELAY_MS = 3000;

  /**
   * Initialize keep-alive service with ping callback
   */
  const initKeepAlive = () => {
    keepAliveService.setPingCallback(async () => {
      await bleClient.sendKeepAlivePing();
    });
  };

  /**
   * Start keep-alive after stabilization delay
   */
  const startKeepAliveWithDelay = () => {
    // Clear any existing timeout to prevent race conditions
    if (stabilizationTimeout !== null) {
      clearTimeout(stabilizationTimeout);
      stabilizationTimeout = null;
    }

    // Add stabilization delay before starting keep-alive
    console.log(`Connection successful - waiting ${STABILIZATION_DELAY_MS / 1000} seconds before starting keep-alive...`);
    stabilizationTimeout = setTimeout(() => {
      stabilizationTimeout = null;
      // Double-check connection is still valid after delay
      if (bleClient.isConnected()) {
        keepAliveService.startKeepAlive();
        isKeepAliveActive.value = true;
        console.log('Keep-alive started after stabilization period');
      } else {
        console.warn('Connection lost during stabilization period');
      }
    }, STABILIZATION_DELAY_MS);
  };

  /**
   * Start keep-alive if connected
   */
  const startIfConnected = () => {
    if (bleClient.isConnected()) {
      startKeepAliveWithDelay();
    }
  };

  /**
   * Stop keep-alive
   */
  const stop = () => {
    // Clear any pending stabilization timeout
    if (stabilizationTimeout !== null) {
      clearTimeout(stabilizationTimeout);
      stabilizationTimeout = null;
    }
    keepAliveService.stopKeepAlive();
    isKeepAliveActive.value = false;
  };

  /**
   * Handle visibility change (app going to background/foreground)
   */
  const handleVisibilityChange = () => {
    if (document.hidden) {
      stop();
      console.log('App backgrounded - keep-alive stopped');
    } else {
      keepAliveService.updateActivity();
      startIfConnected();
      console.log('App foregrounded - keep-alive resumed');
    }
  };

  /**
   * Setup lifecycle hooks
   */
  onMounted(() => {
    // Initialize keep-alive service
    initKeepAlive();

    // Start keep-alive if already connected
    startIfConnected();

    // Listen for connection status changes
    bleClient.setStatusChangeCallback((status) => {
      if (status.connected) {
        startKeepAliveWithDelay();
      } else {
        stop();
      }
    });

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
  });

  onBeforeUnmount(() => {
    // Clean up
    stop();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });

  return {
    isKeepAliveActive,
    keepAliveService,
  };
}
