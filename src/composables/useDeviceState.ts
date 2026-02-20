/**
 * Device State Composable - Central store for KB1 device state
 * 
 * This composable provides reactive state management for the KB1 device,
 * including connection status, CC mappings, and device settings.
 */

import { ref, computed, watch, readonly } from 'vue';
import { bleClient, type BLEConnectionStatus } from '../ble/bleClient';
import { kb1Protocol, type CCMapping, type DeviceSettings, type DevicePresetMetadata, DEVICE_PRESET } from '../ble/kb1Protocol';

// ============================================
// DEV MODE - Reactive state with localStorage persistence
// ============================================
// WARNING: Dev mode simulates device connection with mock data for development
const DEV_MODE_KEY = 'kb1-dev-mode';
const devMode = ref(localStorage.getItem(DEV_MODE_KEY) === 'true');

// Function to toggle dev mode
function setDevMode(enabled: boolean) {
  devMode.value = enabled;
  localStorage.setItem(DEV_MODE_KEY, enabled ? 'true' : 'false');
  
  if (enabled) {
    console.log('🔧 DEV MODE ENABLED: Simulating device with mock data');
    // Auto-connect when enabling dev mode
    connectionStatus.value = {
      connected: true,
      device: { name: 'KB1 (Dev Mode)' } as BluetoothDevice,
      error: null,
    };
    // Initialize with mock data
    deviceSettings.value = kb1Protocol.createDefaultSettings();
    ccMappings.value = Array.from({ length: 8 }, (_, i) => 
      kb1Protocol.createDefaultCCMapping(i)
    );
  } else {
    console.log('✅ DEV MODE DISABLED: Hardware connection required');
  }
}

// Global reactive state
const connectionStatus = ref<BLEConnectionStatus>({
  connected: devMode.value, // Auto-connect in dev mode
  device: devMode.value ? { name: 'KB1 (Dev Mode)' } as BluetoothDevice : null,
  error: null,
});

const ccMappings = ref<CCMapping[]>([]);
const deviceSettings = ref<DeviceSettings>(kb1Protocol.createDefaultSettings());
const isLoading = ref(false);

// Initialize mock data in dev mode
if (devMode.value) {
  console.log('🔧 DEV MODE: Simulating connected device with mock data');
  deviceSettings.value = kb1Protocol.createDefaultSettings();
  ccMappings.value = Array.from({ length: 8 }, (_, i) => 
    kb1Protocol.createDefaultCCMapping(i)
  );
}

// Snapshot state for restore functionality
const SNAPSHOT_KEY = 'kb1_snapshot_v1';
const baselineSnapshot = ref<{ ccMappings: CCMapping[]; settings: DeviceSettings } | null>(null);

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
    // In dev mode, simulate instant connection
    if (devMode.value) {
      console.log('🔧 DEV MODE: Simulating connection...');
      isLoading.value = true;
      
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          connectionStatus.value = {
            connected: true,
            device: { name: 'KB1 (Dev Mode)' } as BluetoothDevice,
            error: null,
          };
          
          // Initialize with mock data
          deviceSettings.value = kb1Protocol.createDefaultSettings();
          ccMappings.value = Array.from({ length: 8 }, (_, i) => 
            kb1Protocol.createDefaultCCMapping(i)
          );
          
          isLoading.value = false;
          console.log('🔧 DEV MODE: Connected with mock data');
          resolve();
        }, 500); // Simulate brief connection delay
      });
    }
    
    // Real BLE connection
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
    if (devMode.value) {
      console.log('🔧 DEV MODE: Simulating disconnect');
      connectionStatus.value = {
        connected: false,
        device: null,
        error: null,
      };
      return;
    }
    
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

    // In dev mode, just update locally
    if (devMode.value) {
      console.log('🔧 DEV MODE: Simulating send settings');
      await new Promise(resolve => setTimeout(resolve, 200));
      updateSettings(settings);
      return;
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

    // In dev mode, simulate save
    if (devMode.value) {
      console.log('🔧 DEV MODE: Simulating save to flash');
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('🔧 DEV MODE: Save complete');
      return;
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
   * Capture baseline snapshot of current state
   * Called after successful load from device
   */
  const captureBaseline = () => {
    const snapshot = {
      ccMappings: JSON.parse(JSON.stringify(ccMappings.value)),
      settings: JSON.parse(JSON.stringify(deviceSettings.value)),
    };
    
    baselineSnapshot.value = snapshot;
    
    // Persist to localStorage
    try {
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
      console.log('Baseline snapshot captured and saved to localStorage');
    } catch (error) {
      console.error('Failed to save snapshot to localStorage:', error);
    }
  };

  /**
   * Restore from baseline snapshot
   * Recalls last snapshot from memory or localStorage
   */
  const recallBaseline = () => {
    let snapshot = baselineSnapshot.value;
    
    // If no snapshot in memory, try loading from localStorage
    if (!snapshot) {
      try {
        const stored = localStorage.getItem(SNAPSHOT_KEY);
        if (stored) {
          snapshot = JSON.parse(stored);
          baselineSnapshot.value = snapshot;
          console.log('Loaded snapshot from localStorage');
        }
      } catch (error) {
        console.error('Failed to load snapshot from localStorage:', error);
      }
    }
    
    if (snapshot) {
      ccMappings.value = JSON.parse(JSON.stringify(snapshot.ccMappings));
      deviceSettings.value = JSON.parse(JSON.stringify(snapshot.settings));
      console.log('Baseline snapshot restored');
    } else {
      console.warn('No snapshot available to restore');
      throw new Error('No snapshot available to restore. Please load from device first.');
    }
  };

  /**
   * Reset to firmware defaults
   * Sets ccMappings and settings to firmware-aligned defaults
   */
  const resetToDefaults = () => {
    // Reset device settings to firmware defaults
    deviceSettings.value = kb1Protocol.createDefaultDeviceSettings();
    
    // Reset CC mappings to defaults with channel 1
    ccMappings.value = Array.from({ length: 8 }, (_, i) => 
      kb1Protocol.createDefaultCCMapping(i)
    );
    
    console.log('Reset to firmware defaults');
  };

  /**
   * Load all data from the device (CC mappings + settings)
   */
  const handleLoad = async () => {
    if (!connectionStatus.value.connected) {
      throw new Error('Not connected to device');
    }

    isLoading.value = true;
    
    try {
      // In dev mode, simulate loading
      if (devMode.value) {
        console.log('🔧 DEV MODE: Simulating load from device');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Ensure we have fresh default data
        deviceSettings.value = kb1Protocol.createDefaultSettings();
        ccMappings.value = Array.from({ length: 8 }, (_, i) => 
          kb1Protocol.createDefaultCCMapping(i)
        );
        
        captureBaseline();
        console.log('🔧 DEV MODE: Load complete with mock data');
        isLoading.value = false;
        return;
      }
      
      // Real BLE read
      const settings = await bleClient.readAllSettings();
      
      // Update device settings with data from device
      if (settings.lever1) deviceSettings.value.lever1 = settings.lever1;
      if (settings.leverPush1) deviceSettings.value.leverPush1 = settings.leverPush1;
      if (settings.lever2) deviceSettings.value.lever2 = settings.lever2;
      if (settings.leverPush2) deviceSettings.value.leverPush2 = settings.leverPush2;
      if (settings.touch) deviceSettings.value.touch = settings.touch;
      if (settings.scale) deviceSettings.value.scale = settings.scale;
      
      // Initialize CC mappings if needed
      if (ccMappings.value.length === 0) {
        ccMappings.value = Array.from({ length: 8 }, (_, i) => 
          kb1Protocol.createDefaultCCMapping(i)
        );
      }
      
      // Capture baseline snapshot after successful load
      captureBaseline();
      
      console.log('Successfully loaded from device and captured snapshot');
    } catch (error) {
      console.error('Failed to load from device:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Check if Web Bluetooth is available
   */
  const isBluetoothAvailable = computed(() => devMode.value || bleClient.isBluetoothAvailable());

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

  // ============================================
  // Device Preset Management (Stub for testing UI)
  // ============================================
  
  const devicePresets = ref<DevicePresetMetadata[]>([]);
  const hasDevicePresetSupport = ref(true); // Always show UI structure
  
  // Initialize with empty slots or mock data
  if (devMode.value) {
    devicePresets.value = [
      { slot: 0, name: 'Ambient Pad', timestamp: Date.now() / 1000, isValid: true },
      { slot: 1, name: 'Bass Heavy', timestamp: Date.now() / 1000 - 86400, isValid: true },
      { slot: 2, name: DEVICE_PRESET.EMPTY_SLOT_NAME, timestamp: 0, isValid: false },
      { slot: 3, name: 'Performance', timestamp: Date.now() / 1000 - 172800, isValid: true },
      { slot: 4, name: DEVICE_PRESET.EMPTY_SLOT_NAME, timestamp: 0, isValid: false },
      { slot: 5, name: DEVICE_PRESET.EMPTY_SLOT_NAME, timestamp: 0, isValid: false },
      { slot: 6, name: DEVICE_PRESET.EMPTY_SLOT_NAME, timestamp: 0, isValid: false },
      { slot: 7, name: DEVICE_PRESET.EMPTY_SLOT_NAME, timestamp: 0, isValid: false },
    ];
  } else {
    // Initialize with 8 empty slots when not in dev mode
    devicePresets.value = Array.from({ length: 8 }, (_, i) => ({
      slot: i,
      name: DEVICE_PRESET.EMPTY_SLOT_NAME,
      timestamp: 0,
      isValid: false
    }));
  }
  
  // Watch devMode to update presets when toggled
  watch(devMode, (enabled) => {
    if (enabled) {
      // Load mock presets
      devicePresets.value = [
        { slot: 0, name: 'Ambient Pad', timestamp: Date.now() / 1000, isValid: true },
        { slot: 1, name: 'Bass Heavy', timestamp: Date.now() / 1000 - 86400, isValid: true },
        { slot: 2, name: DEVICE_PRESET.EMPTY_SLOT_NAME, timestamp: 0, isValid: false },
        { slot: 3, name: 'Performance', timestamp: Date.now() / 1000 - 172800, isValid: true },
        { slot: 4, name: DEVICE_PRESET.EMPTY_SLOT_NAME, timestamp: 0, isValid: false },
        { slot: 5, name: DEVICE_PRESET.EMPTY_SLOT_NAME, timestamp: 0, isValid: false },
        { slot: 6, name: DEVICE_PRESET.EMPTY_SLOT_NAME, timestamp: 0, isValid: false },
        { slot: 7, name: DEVICE_PRESET.EMPTY_SLOT_NAME, timestamp: 0, isValid: false },
      ];
    } else {
      // Clear to empty slots
      devicePresets.value = Array.from({ length: 8 }, (_, i) => ({
        slot: i,
        name: DEVICE_PRESET.EMPTY_SLOT_NAME,
        timestamp: 0,
        isValid: false
      }));
    }
  });
  
  const refreshDevicePresets = async () => {
    if (devMode.value) {
      console.log('🔧 DEV MODE: Refreshing device presets (mock)');
      return;

    }
    
    // TODO: Implement real BLE preset list
    console.log('Device presets: Real implementation pending firmware update');
  };
  
  const saveDevicePreset = async (slot: number, name: string) => {
    if (slot < 0 || slot >= DEVICE_PRESET.MAX_SLOTS) {
      throw new Error(`Invalid slot: ${slot}`);
    }
    
    if (devMode.value) {
      console.log(`🔧 DEV MODE: Saving to device slot ${slot}: "${name}"`);
      // Update mock data
      devicePresets.value[slot] = {
        slot,
        name: name.slice(0, DEVICE_PRESET.NAME_MAX_LENGTH),
        timestamp: Date.now() / 1000,
        isValid: true,
      };
      return;
    }
    
    // TODO: Implement real BLE preset save
    console.log(`Save to device slot ${slot}: ${name}`);
  };
  
  const loadDevicePreset = async (slot: number) => {
    if (slot < 0 || slot >= DEVICE_PRESET.MAX_SLOTS) {
      throw new Error(`Invalid slot: ${slot}`);
    }
    
    if (devMode.value) {
      console.log(`🔧 DEV MODE: Loading from device slot ${slot}`);
      const preset = devicePresets.value[slot];
      if (preset && preset.isValid) {
        console.log(`Loaded preset: "${preset.name}"`);
        // In real implementation, this would update deviceSettings
      } else {
        throw new Error('Slot is empty');
      }
      return;
    }
    
    // TODO: Implement real BLE preset load
    console.log(`Load from device slot ${slot}`);
  };
  
  const deleteDevicePreset = async (slot: number) => {
    if (slot < 0 || slot >= DEVICE_PRESET.MAX_SLOTS) {
      throw new Error(`Invalid slot: ${slot}`);
    }
    
    if (devMode.value) {
      console.log(`🔧 DEV MODE: Deleting device slot ${slot}`);
      // Update mock data
      devicePresets.value[slot] = {
        slot,
        name: DEVICE_PRESET.EMPTY_SLOT_NAME,
        timestamp: 0,
        isValid: false,
      };
      return;
    }
    
    // TODO: Implement real BLE preset delete
    console.log(`Delete device slot ${slot}`);
  };

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
    handleLoad,
    captureBaseline,
    recallBaseline,
    resetToDefaults,
    
    // Device Presets
    devicePresets,
    hasDevicePresetSupport,
    refreshDevicePresets,
    saveDevicePreset,
    loadDevicePreset,
    deleteDevicePreset,
    
    // Dev Mode
    devMode: readonly(devMode),
    setDevMode,
  };
}
