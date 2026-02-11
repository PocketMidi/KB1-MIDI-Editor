<template>
  <div class="device-settings-page">
    <div class="page-header">
      <h2>SETTINGS</h2>
      <p>Configure KB1 lever, touch, and scale settings</p>
    </div>
    
    <div v-if="!isConnected" class="not-connected-message">
      <p>Please connect to your KB1 device to view and configure settings.</p>
    </div>
    
    <div v-else class="settings-content">
      <div class="action-bar">
        <button
          class="btn btn-secondary"
          @click="handleLoadClick"
          :disabled="isLoading"
        >
          <span v-if="isLoading">Loading...</span>
          <span v-else>Load from Device</span>
        </button>
        
        <button
          class="btn btn-secondary"
          @click="handleResetDefaults"
          :disabled="isLoading"
        >
          Reset to Defaults
        </button>
        
        <button
          class="btn btn-secondary"
          @click="handleReset"
          :disabled="isLoading || !hasChanges"
        >
          Reset Changes
        </button>
        
        <button
          class="btn btn-primary"
          @click="handleSaveToDevice"
          :disabled="isLoading || !hasChanges"
        >
          <span v-if="isLoading">Saving...</span>
          <span v-else>Save to Device</span>
        </button>
      </div>
      
      <!-- Guard to ensure CC map is loaded before rendering settings sections.
           This prevents race conditions where category data might not be available
           during component initialization, which would cause blank category dropdowns. -->
      <div v-if="isCCMapLoaded()" class="settings-sections">
        <LeverSettings
          title="Lever"
          :lever="1"
          v-model="localSettings.lever1"
          :ccOptions="ccOptions"
          :ccMapByNumber="ccMapByNumber"
          :categories="categories"
          :functionModes="leverFunctionModes"
          :valueModes="valueModes"
          :interpolations="interpolations"
          @update:modelValue="markChanged"
        />
        
        <LeverPushSettings
          title="Lever Push"
          :lever="1"
          v-model="localSettings.leverPush1"
          :ccOptions="ccOptions"
          :ccMapByNumber="ccMapByNumber"
          :categories="categories"
          :functionModes="leverPushFunctionModes"
          :interpolations="interpolations"
          @update:modelValue="markChanged"
        />
        
        <LeverSettings
          title="Lever"
          :lever="2"
          v-model="localSettings.lever2"
          :ccOptions="ccOptions"
          :ccMapByNumber="ccMapByNumber"
          :categories="categories"
          :functionModes="leverFunctionModes"
          :valueModes="valueModes"
          :interpolations="interpolations"
          @update:modelValue="markChanged"
        />
        
        <LeverPushSettings
          title="Lever Push"
          :lever="2"
          v-model="localSettings.leverPush2"
          :ccOptions="ccOptions"
          :ccMapByNumber="ccMapByNumber"
          :categories="categories"
          :functionModes="leverPushFunctionModes"
          :interpolations="interpolations"
          @update:modelValue="markChanged"
        />
        
        <TouchSettings
          title="Touch Sensor"
          v-model="localSettings.touch"
          :ccOptions="ccOptions"
          :ccMapByNumber="ccMapByNumber"
          :categories="categories"
          :functionModes="touchFunctionModes"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useDeviceState } from '../composables/useDeviceState';
import type { DeviceSettings } from '../ble/kb1Protocol';
import LeverSettings from '../components/LeverSettings.vue';
import LeverPushSettings from '../components/LeverPushSettings.vue';
import TouchSettings from '../components/TouchSettings.vue';
import ScaleSettings from '../components/ScaleSettings.vue';
import {
  loadPolyendCCMap,
  getCCMap,
  isCCMapLoaded,
  getSortedCCOptions,
  getCCGroups,
} from '../data/ccMap';

const {
  isConnected,
  deviceSettings,
  isLoading,
  sendSettings,
  saveToFlash,
  handleLoad,
  resetToDefaults,
} = useDeviceState();

const localSettings = ref<DeviceSettings>({ ...deviceSettings.value });
const hasChanges = ref(false);

// Load CC map on mount
onMounted(async () => {
  try {
    await loadPolyendCCMap();
  } catch (error) {
    console.error('Failed to load CC map:', error);
    // Continue with fallback CC options
  }
});

// CC Options - either from CSV or fallback to basic labels
const ccOptions = computed(() => {
  if (isCCMapLoaded()) {
    // Use the sorted options which puts Velocity first
    return getSortedCCOptions();
  } else {
    // Fallback: basic CC 0-127 labels plus CC 128 for Velocity
    return [
      { value: -1, label: 'None' },
      { value: 128, label: 'Velocity (CC 128)' },
      ...Array.from({ length: 128 }, (_, i) => ({ value: i, label: `CC ${i}` }))
    ];
  }
});

// Expose ccMapByNumber for child components
const ccMapByNumber = computed(() => getCCMap());

// Expose categories for child components
const categories = computed(() => getCCGroups().map(g => g.category));

// Lever Function Modes (firmware values)
const leverFunctionModes = [
  { value: 0, label: 'Interpolated' },
  { value: 1, label: 'Peak & Decay' },
  { value: 2, label: 'Incremental' },
];

// Lever Push Function Modes (firmware values)
const leverPushFunctionModes = [
  { value: 0, label: 'Interpolated' },
  { value: 1, label: 'Peak & Decay' },
  { value: 2, label: 'Static' },
  { value: 3, label: 'Reset' },
];

// Touch Function Modes (firmware values)
const touchFunctionModes = [
  { value: 0, label: 'Hold' },
  { value: 1, label: 'Toggle' },
  { value: 2, label: 'Continuous' },
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

// Root Notes as MIDI numbers so protocol/defaults (60=C) match UI selection
const rootNotes = [
  { value: 60, label: 'C' },
  { value: 61, label: 'C#' },
  { value: 62, label: 'D' },
  { value: 63, label: 'D#' },
  { value: 64, label: 'E' },
  { value: 65, label: 'F' },
  { value: 66, label: 'F#' },
  { value: 67, label: 'G' },
  { value: 68, label: 'G#' },
  { value: 69, label: 'A' },
  { value: 70, label: 'A#' },
  { value: 71, label: 'B' },
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

async function handleLoadClick() {
  try {
    await handleLoad();
    localSettings.value = { ...deviceSettings.value };
    hasChanges.value = false;
  } catch (error) {
    console.error('Failed to load settings:', error);
    alert('Failed to load settings from device');
  }
}

async function handleResetDefaults() {
  if (confirm('Reset all settings to firmware defaults? This will discard current changes.')) {
    try {
      resetToDefaults();
      localSettings.value = { ...deviceSettings.value };
      hasChanges.value = true;
    } catch (error) {
      console.error('Failed to reset to defaults:', error);
      alert('Failed to reset to defaults');
    }
  }
}

function handleReset() {
  localSettings.value = { ...deviceSettings.value };
  hasChanges.value = false;
}

async function handleSaveToDevice() {
  try {
    // First apply the settings to the device RAM
    await sendSettings(localSettings.value);
    
    // Then persist to flash memory
    try {
      await saveToFlash();
      hasChanges.value = false;
      alert('Settings saved to device successfully');
    } catch (flashError) {
      console.error('Failed to save to flash after applying to RAM:', flashError);
      alert('Settings applied to device RAM but failed to save to flash memory. Settings will be lost on power cycle.');
    }
  } catch (error) {
    console.error('Failed to apply settings to device:', error);
    alert('Failed to apply settings to device');
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

.action-bar {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
