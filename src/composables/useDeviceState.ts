/**
 * Device State Composable - Central store for KB1 device state
 * 
 * This composable provides reactive state management for the KB1 device,
 * including connection status, CC mappings, and device settings.
 */

import { ref, computed } from 'vue';
import { bleClient, type BLEConnectionStatus } from '../ble/bleClient';
import { kb1Protocol, type CCMapping, type DeviceSettings } from '../ble/kb1Protocol';

// Global reactive state
const connectionStatus = ref<BLEConnectionStatus>({
  connected: false,
  device: null,
  error: null,
});

const ccMappings = ref<CCMapping[]>([]);
const deviceSettings = ref<DeviceSettings>(kb1Protocol.createDefaultSettings());
const isLoading = ref(false);

// Initialize BLE client callbacks
bleClient.setStatusChangeCallback((status) => {
  connectionStatus.value = status;
  
  // Clear data on disconnect
  if (!status.connected) {
    ccMappings.value = [];
    deviceSettings.value = kb1Protocol.createDefaultSettings();
  }
});

bleClient.setDataReceivedCallback((data) => {
  // Handle incoming data from device
  const message = kb1Protocol.decodeMessage(data);
  if (message) {
    console.log('Received message from device:', message);
    // TODO: Update state based on message type
  }
});

/**
 * Composable for managing KB1 device state
 */
export function useDeviceState() {
  /**
   * Connect to a KB1 device
   */
  const connect = async () => {
    isLoading.value = true;
    try {
      await bleClient.connect();
      // On successful connection, load device state
      // TODO: Implement loading CC mappings and settings from device
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Disconnect from the current device
   */
  const disconnect = async () => {
    await bleClient.disconnect();
  };

  /**
   * Load CC mappings from the device
   */
  const loadCCMappings = async () => {
    if (!connectionStatus.value.connected) {
      throw new Error('Not connected to device');
    }

    isLoading.value = true;
    try {
      // TODO: Implement actual loading from device
      const request = kb1Protocol.encodeGetCCMappings();
      await bleClient.sendData(request);
      
      // For now, initialize with defaults
      ccMappings.value = Array.from({ length: 8 }, (_, i) => 
        kb1Protocol.createDefaultCCMapping(i)
      );
    } catch (error) {
      console.error('Failed to load CC mappings:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Update a CC mapping
   */
  const updateCCMapping = (mapping: CCMapping) => {
    if (!kb1Protocol.validateCCMapping(mapping)) {
      throw new Error('Invalid CC mapping');
    }

    const index = ccMappings.value.findIndex(m => m.faderIndex === mapping.faderIndex);
    if (index !== -1) {
      ccMappings.value[index] = mapping;
    } else {
      ccMappings.value.push(mapping);
    }
  };

  /**
   * Send CC mapping to the device
   */
  const sendCCMapping = async (mapping: CCMapping) => {
    if (!connectionStatus.value.connected) {
      throw new Error('Not connected to device');
    }

    try {
      const data = kb1Protocol.encodeSetCCMapping(mapping);
      await bleClient.sendData(data);
      updateCCMapping(mapping);
    } catch (error) {
      console.error('Failed to send CC mapping:', error);
      throw error;
    }
  };

  /**
   * Load device settings from the device
   */
  const loadSettings = async () => {
    if (!connectionStatus.value.connected) {
      throw new Error('Not connected to device');
    }

    isLoading.value = true;
    try {
      // TODO: Implement actual loading from device
      const request = kb1Protocol.encodeGetSettings();
      await bleClient.sendData(request);
    } catch (error) {
      console.error('Failed to load settings:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Update device settings
   */
  const updateSettings = (settings: DeviceSettings) => {
    if (!kb1Protocol.validateSettings(settings)) {
      throw new Error('Invalid device settings');
    }
    deviceSettings.value = settings;
  };

  /**
   * Send settings to the device
   */
  const sendSettings = async (settings: DeviceSettings) => {
    if (!connectionStatus.value.connected) {
      throw new Error('Not connected to device');
    }

    try {
      const data = kb1Protocol.encodeSetSettings(settings);
      await bleClient.sendData(data);
      updateSettings(settings);
    } catch (error) {
      console.error('Failed to send settings:', error);
      throw error;
    }
  };

  /**
   * Save current state to device flash memory
   */
  const saveToFlash = async () => {
    if (!connectionStatus.value.connected) {
      throw new Error('Not connected to device');
    }

    try {
      const data = kb1Protocol.encodeSaveToFlash();
      await bleClient.sendData(data);
    } catch (error) {
      console.error('Failed to save to flash:', error);
      throw error;
    }
  };

  /**
   * Check if Web Bluetooth is available
   */
  const isBluetoothAvailable = computed(() => bleClient.isBluetoothAvailable());

  /**
   * Check if connected
   */
  const isConnected = computed(() => connectionStatus.value.connected);

  /**
   * Get device name
   */
  const deviceName = computed(() => 
    connectionStatus.value.device?.name || 'No device'
  );

  return {
    // State
    connectionStatus,
    ccMappings,
    deviceSettings,
    isLoading,
    
    // Computed
    isBluetoothAvailable,
    isConnected,
    deviceName,
    
    // Actions
    connect,
    disconnect,
    loadCCMappings,
    updateCCMapping,
    sendCCMapping,
    loadSettings,
    updateSettings,
    sendSettings,
    saveToFlash,
  };
}
