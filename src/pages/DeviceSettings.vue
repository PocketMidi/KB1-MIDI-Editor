<template>
  <div class="device-settings-page">
    <div class="page-header">
      <h2>Device Settings</h2>
      <p>Configure KB1 lever, touch, and scale settings</p>
    </div>
    
    <div v-if="!isConnected" class="not-connected-message">
      <p>Please connect to your KB1 device to view and configure settings.</p>
    </div>
    
    <div v-else class="settings-content">
      <div class="settings-sections">
        <LeverSettings
          title="Lever"
          :lever="1"
          v-model="localSettings.lever1"
          :ccOptions="ccOptions"
          :functionModes="functionModes"
          :valueModes="valueModes"
          :interpolations="interpolations"
          @update:modelValue="markChanged"
        />
        
        <LeverPushSettings
          title="Lever Push"
          :lever="1"
          v-model="localSettings.leverPush1"
          :ccOptions="ccOptions"
          :functionModes="functionModes"
          :interpolations="interpolations"
          @update:modelValue="markChanged"
        />
        
        <LeverSettings
          title="Lever"
          :lever="2"
          v-model="localSettings.lever2"
          :ccOptions="ccOptions"
          :functionModes="functionModes"
          :valueModes="valueModes"
          :interpolations="interpolations"
          @update:modelValue="markChanged"
        />
        
        <LeverPushSettings
          title="Lever Push"
          :lever="2"
          v-model="localSettings.leverPush2"
          :ccOptions="ccOptions"
          :functionModes="functionModes"
          :interpolations="interpolations"
          @update:modelValue="markChanged"
        />
        
        <TouchSettings
          title="Touch Sensor"
          v-model="localSettings.touch"
          :ccOptions="ccOptions"
          :functionModes="functionModes"
          @update:modelValue="markChanged"
        />
        
        <ScaleSettings
          title="Scales"
          v-model="localSettings.scale"
          :scales="scales"
          :rootNotes="rootNotes"
          @update:modelValue="markChanged"
        />
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
import LeverSettings from '../components/LeverSettings.vue';
import LeverPushSettings from '../components/LeverPushSettings.vue';
import TouchSettings from '../components/TouchSettings.vue';
import ScaleSettings from '../components/ScaleSettings.vue';

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

// CC Options (0-127 MIDI CC numbers)
const ccOptions = [
  { value: -1, label: 'None' },
  ...Array.from({ length: 128 }, (_, i) => ({ value: i, label: `CC ${i}` }))
];

// Function Modes
const functionModes = [
  { value: 0, label: 'Continuous' },
  { value: 1, label: 'Toggle' },
  { value: 2, label: 'Momentary' },
];

// Value Modes
const valueModes = [
  { value: 0, label: 'Absolute' },
  { value: 1, label: 'Relative' },
];

// Interpolation Types
const interpolations = [
  { value: 0, label: 'Linear' },
  { value: 1, label: 'Exponential' },
  { value: 2, label: 'Logarithmic' },
];

// Scales
const scales = [
  { value: 0, label: 'Chromatic' },
  { value: 1, label: 'Major' },
  { value: 2, label: 'Minor' },
  { value: 3, label: 'Dorian' },
  { value: 4, label: 'Phrygian' },
  { value: 5, label: 'Lydian' },
  { value: 6, label: 'Mixolydian' },
  { value: 7, label: 'Aeolian' },
  { value: 8, label: 'Locrian' },
  { value: 9, label: 'Pentatonic Major' },
  { value: 10, label: 'Pentatonic Minor' },
];

// Root Notes
const rootNotes = [
  { value: 0, label: 'C' },
  { value: 1, label: 'C#' },
  { value: 2, label: 'D' },
  { value: 3, label: 'D#' },
  { value: 4, label: 'E' },
  { value: 5, label: 'F' },
  { value: 6, label: 'F#' },
  { value: 7, label: 'G' },
  { value: 8, label: 'G#' },
  { value: 9, label: 'A' },
  { value: 10, label: 'A#' },
  { value: 11, label: 'B' },
];

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
  max-width: 1200px;
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

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.action-bar {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--kb1-radius-md, 6px);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--btn-primary-bg, #3b82f6);
  color: var(--btn-primary-color, white);
}

.btn-primary:hover:not(:disabled) {
  background: var(--btn-primary-bg-hover, #2563eb);
}

.btn-secondary {
  background: var(--btn-secondary-bg, var(--color-background-mute));
  color: var(--btn-secondary-color, var(--color-text));
  border: var(--btn-secondary-border, 1px solid var(--color-border));
}

.btn-secondary:hover:not(:disabled) {
  background: var(--btn-secondary-bg-hover, var(--color-background-soft));
}

@media (max-width: 768px) {
  .device-settings-page {
    padding: 1rem;
  }

  .action-bar {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
