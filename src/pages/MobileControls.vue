<template>
  <div class="mobile-controls-tab">
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
    <div v-if="isCCMapLoaded()" class="controls-accordion" :class="{ 'disconnected-state': !isConnected }">
      <AccordionSection
        :title="`Lever 1`"
        :subtitle="getLeverSubtitle(localSettings.lever1)"
        :id="'lever-1'"
        :default-open="false"
      >
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
      </AccordionSection>
      
      <AccordionSection
        :title="`Lever Push 1`"
        :subtitle="getLeverPushSubtitle(localSettings.leverPush1)"
        :id="'lever-push-1'"
        :default-open="false"
      >
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
      </AccordionSection>
      
      <AccordionSection
        :title="`Lever 2`"
        :subtitle="getLeverSubtitle(localSettings.lever2)"
        :id="'lever-2'"
        :default-open="false"
      >
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
      </AccordionSection>
      
      <AccordionSection
        :title="`Lever Push 2`"
        :subtitle="getLeverPushSubtitle(localSettings.leverPush2)"
        :id="'lever-push-2'"
        :default-open="false"
      >
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
      </AccordionSection>
      
      <AccordionSection
        title="Touch Sensor"
        :subtitle="getTouchSubtitle(localSettings.touch)"
        :id="'touch-sensor'"
        :default-open="false"
      >
        <TouchSettings
          title="Touch Sensor"
          v-model="localSettings.touch"
          :ccOptions="ccOptions"
          :ccMapByNumber="ccMapByNumber"
          :categories="categories"
          :functionModes="touchFunctionModes"
          @update:modelValue="markChanged"
        />
      </AccordionSection>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useDeviceState } from '../composables/useDeviceState';
import type { 
  DeviceSettings, 
  LeverSettings as LeverSettingsType, 
  LeverPushSettings as LeverPushSettingsType, 
  TouchSettings as TouchSettingsType 
} from '../ble/kb1Protocol';
import AccordionSection from '../components/AccordionSection.vue';
import StickyActionBar from '../components/StickyActionBar.vue';
import LeverSettings from '../components/LeverSettings.vue';
import LeverPushSettings from '../components/LeverPushSettings.vue';
import TouchSettings from '../components/TouchSettings.vue';
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
  }
});

// CC Options
const ccOptions = computed(() => {
  if (isCCMapLoaded()) {
    return getSortedCCOptions();
  } else {
    return [
      { value: -1, label: 'None' },
      { value: 128, label: 'Velocity (CC 128)' },
      ...Array.from({ length: 128 }, (_, i) => ({ value: i, label: `CC ${i}` }))
    ];
  }
});

const ccMapByNumber = computed(() => getCCMap());
const categories = computed(() => getCCGroups().map(g => g.category));

// Function Modes
const leverFunctionModes = [
  { value: 0, label: 'Interpolated' },
  { value: 1, label: 'Peak & Decay' },
  { value: 2, label: 'Incremental' },
];

const leverPushFunctionModes = [
  { value: 0, label: 'Interpolated' },
  { value: 1, label: 'Peak & Decay' },
  { value: 2, label: 'Static' },
  { value: 3, label: 'Reset' },
];

const touchFunctionModes = [
  { value: 0, label: 'Hold' },
  { value: 1, label: 'Toggle' },
  { value: 2, label: 'Continuous' },
];

const valueModes = [
  { value: 0, label: 'Unipolar' },
  { value: 1, label: 'Bipolar' },
];

const interpolations = [
  { value: 0, label: 'Linear' },
  { value: 1, label: 'Exponential' },
  { value: 2, label: 'Logarithmic' },
];

// Helper functions to generate subtitles for accordion headers
// These use the CC map to show user-friendly parameter names and ranges
function getLeverSubtitle(lever: LeverSettingsType): string {
  const ccMap = ccMapByNumber.value;
  const ccInfo = ccMap.get(lever.ccNumber);
  const paramName = ccInfo?.parameter || `CC ${lever.ccNumber}`;
  const range = ccInfo?.range ? `${ccInfo.range.min} to ${ccInfo.range.max}` : '0 to 127';
  return `${paramName} | ${range} | MIDI CC ${lever.ccNumber}`;
}

function getLeverPushSubtitle(leverPush: LeverPushSettingsType): string {
  const ccMap = ccMapByNumber.value;
  const ccInfo = ccMap.get(leverPush.ccNumber);
  const paramName = ccInfo?.parameter || `CC ${leverPush.ccNumber}`;
  const range = ccInfo?.range ? `${ccInfo.range.min} to ${ccInfo.range.max}` : '0 to 127';
  return `${paramName} | ${range} | MIDI CC ${leverPush.ccNumber}`;
}

function getTouchSubtitle(touch: TouchSettingsType): string {
  const ccMap = ccMapByNumber.value;
  const ccInfo = ccMap.get(touch.ccNumber);
  const paramName = ccInfo?.parameter || `CC ${touch.ccNumber}`;
  return `${paramName} | MIDI CC ${touch.ccNumber}`;
}

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
.mobile-controls-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.not-connected-message {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}

.controls-accordion {
  padding: 1rem;
  overflow-y: auto;
  /* Ensure content doesn't hide behind sticky bars */
  padding-top: 1rem;
}

@media (max-width: 768px) {
  .controls-accordion {
    padding: 0.75rem;
  }
}

@media (min-width: 769px) {
  .mobile-controls-tab {
    padding-bottom: 0;
  }
}
</style>
