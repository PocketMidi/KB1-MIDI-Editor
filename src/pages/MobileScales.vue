<template>
  <div class="mobile-scales-tab">
    <StickyActionBar
      :is-connected="isConnected"
      :is-loading="isLoading"
      :has-changes="hasChanges"
      @load="handleLoadClick"
      @reset-defaults="handleResetDefaults"
      @reset-changes="handleReset"
      @save="handleSaveToDevice"
    />
    
    <!-- Subtle connection status indicator -->
    <div v-if="!isConnected" class="connection-status-bar">
      <span class="status-dot disconnected"></span>
      <span class="status-text">Disconnected - Preview mode</span>
    </div>
    
    <!-- Always show content, but apply disconnected styling -->
    <div class="scales-content" :class="{ 'disconnected-state': !isConnected }">
      <ScaleSettings
        title="Scales"
        v-model="localSettings.scale"
        :scales="scales"
        :rootNotes="rootNotes"
        @update:modelValue="markChanged"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useDeviceState } from '../composables/useDeviceState';
import type { DeviceSettings } from '../ble/kb1Protocol';
import StickyActionBar from '../components/StickyActionBar.vue';
import ScaleSettings from '../components/ScaleSettings.vue';

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

// Watch for device settings changes
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
    await sendSettings(localSettings.value);
    
    try {
      await saveToFlash();
      hasChanges.value = false;
      alert('Settings saved to device successfully');
    } catch (flashError) {
      console.error('Failed to save to flash:', flashError);
      alert('Settings applied to device RAM but failed to save to flash memory.');
    }
  } catch (error) {
    console.error('Failed to apply settings to device:', error);
    alert('Failed to apply settings to device');
  }
}
</script>

<style scoped>
.mobile-scales-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.not-connected-message {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}

.scales-content {
  padding: 1rem;
  overflow-y: auto;
  /* Ensure content doesn't hide behind sticky bars */
  padding-top: 1rem;
}

@media (max-width: 768px) {
  .scales-content {
    padding: 0.75rem;
  }
}

@media (min-width: 769px) {
  .mobile-scales-tab {
    padding-bottom: 0;
  }
}
</style>
