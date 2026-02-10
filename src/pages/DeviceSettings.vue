<template>
  <div class="device-settings-page">
    <div class="page-header">
      <h2>Device Settings</h2>
      <p>Configure KB1 device settings</p>
    </div>
    
    <div v-if="!isConnected" class="not-connected-message">
      <p>Please connect to your KB1 device to view settings.</p>
    </div>
    
    <div v-else class="settings-content">
      <div class="settings-form">
        <div class="form-group">
          <label for="device-name">Device Name</label>
          <input
            id="device-name"
            type="text"
            v-model="localSettings.deviceName"
            :disabled="isLoading"
            @input="markChanged"
          />
        </div>
        
        <div class="form-group">
          <label for="midi-channel">Default MIDI Channel</label>
          <input
            id="midi-channel"
            type="number"
            min="1"
            max="16"
            v-model.number="localSettings.midiChannel"
            :disabled="isLoading"
            @input="markChanged"
          />
          <span class="help-text">Channel 1-16</span>
        </div>
        
        <div class="form-group">
          <label for="brightness">Display Brightness</label>
          <div class="slider-container">
            <input
              id="brightness"
              type="range"
              min="0"
              max="100"
              v-model.number="localSettings.brightness"
              :disabled="isLoading"
              @input="markChanged"
            />
            <span class="slider-value">{{ localSettings.brightness }}%</span>
          </div>
        </div>
        
        <!-- TODO: Add more KB1-specific settings -->
        <div class="settings-info">
          <p class="info-text">
            Additional device-specific settings will be added here as the KB1 protocol is implemented.
          </p>
        </div>
      </div>
      
      <div class="action-bar">
        <button
          class="btn btn-secondary"
          @click="handleLoad"
          :disabled="isLoading"
        >
          <span v-if="isLoading">Loading...</span>
          <span v-else>Load from Device</span>
        </button>
        
        <button
          class="btn btn-secondary"
          @click="handleReset"
          :disabled="isLoading || !hasChanges"
        >
          Reset
        </button>
        
        <button
          class="btn btn-primary"
          @click="handleApply"
          :disabled="isLoading || !hasChanges"
        >
          <span v-if="isLoading">Applying...</span>
          <span v-else>Apply to Device</span>
        </button>
        
        <button
          class="btn btn-primary"
          @click="handleSave"
          :disabled="isLoading"
        >
          <span v-if="isLoading">Saving...</span>
          <span v-else>Save to Flash</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useDeviceState } from '../composables/useDeviceState';
import type { DeviceSettings } from '../ble/kb1Protocol';

const {
  isConnected,
  deviceSettings,
  isLoading,
  loadSettings,
  sendSettings,
  saveToFlash,
} = useDeviceState();

const localSettings = ref<DeviceSettings>({ ...deviceSettings.value });
const hasChanges = ref(false);

// Watch for device settings changes from the device
watch(deviceSettings, (newSettings) => {
  if (!hasChanges.value) {
    localSettings.value = { ...newSettings };
  }
}, { deep: true });

function markChanged() {
  hasChanges.value = true;
}

async function handleLoad() {
  try {
    await loadSettings();
    localSettings.value = { ...deviceSettings.value };
    hasChanges.value = false;
  } catch (error) {
    console.error('Failed to load settings:', error);
    alert('Failed to load settings from device');
  }
}

function handleReset() {
  localSettings.value = { ...deviceSettings.value };
  hasChanges.value = false;
}

async function handleApply() {
  try {
    await sendSettings(localSettings.value);
    hasChanges.value = false;
    alert('Settings applied successfully');
  } catch (error) {
    console.error('Failed to apply settings:', error);
    alert('Failed to apply settings to device');
  }
}

async function handleSave() {
  try {
    await saveToFlash();
    alert('Settings saved to device flash memory');
  } catch (error) {
    console.error('Failed to save to flash:', error);
    alert('Failed to save to device flash memory');
  }
}
</script>

<style scoped>
.device-settings-page {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.page-header p {
  margin: 0;
  color: var(--color-text-muted);
}

.not-connected-message {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 500;
  font-size: 0.875rem;
}

input[type="text"],
input[type="number"] {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 1rem;
}

input[type="text"]:focus,
input[type="number"]:focus {
  outline: none;
  border-color: var(--color-border-hover);
}

input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

input[type="range"] {
  flex: 1;
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.slider-value {
  min-width: 3rem;
  text-align: right;
  font-weight: 500;
}

.help-text {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.settings-info {
  padding: 1rem;
  background: var(--color-background-mute);
  border-radius: 6px;
  margin-top: 1rem;
}

.info-text {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  font-style: italic;
}

.action-bar {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: var(--color-background-mute);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-background-soft);
}
</style>
