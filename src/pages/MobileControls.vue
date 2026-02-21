<template>
  <div class="mobile-controls-tab">
    <StickyActionBar
      :is-connected="isConnected"
      :is-loading="isLoading"
      :has-changes="hasChanges"
      @load="handleLoadClick"
      @reset-defaults="handleResetDefaults"
      @save="handleSaveToDevice"
    />
    
    <!-- Always show content, but apply disconnected styling -->
    <div v-if="isCCMapLoaded()" class="controls-accordion" :class="{ 'disconnected-state': !isConnected }">
      <AccordionSection
        ref="lever1Accordion"
        :title="`Lever 1`"
        :title-suffix="lever1Suffix"
        :title-suffix-fading="lever1SuffixFading"
        :subtitle="getLeverSubtitle(localSettings.lever1)"
        :midi-cc="localSettings.lever1.ccNumber"
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
          @update:modelValue="markChanged"
          @profileChanged="handleLever1ProfileChange"
          @valueModeChanged="handleLever1ValueModeChange"
        />
      </AccordionSection>
      
      <AccordionSection
        ref="leverPush1Accordion"
        :title="`Press 1`"
        :title-suffix="leverPush1Suffix"
        :title-suffix-fading="leverPush1SuffixFading"
        :subtitle="getLeverPushSubtitle(localSettings.leverPush1)"
        :midi-cc="localSettings.leverPush1.ccNumber"
        :id="'lever-push-1'"
        :default-open="false"
      >
        <LeverPushSettings
          title="Press"
          :lever="1"
          v-model="localSettings.leverPush1"
          :ccOptions="ccOptions"
          :ccMapByNumber="ccMapByNumber"
          :categories="categories"
          :functionModes="leverPushFunctionModes"
          :interpolations="interpolations"
          @update:modelValue="markChanged"
          @profileChanged="handleLeverPush1ProfileChange"
          @behaviourChanged="handleLeverPush1BehaviourChange"
        />
      </AccordionSection>
      
      <AccordionSection
        ref="lever2Accordion"
        :title="`Lever 2`"
        :title-suffix="lever2Suffix"
        :title-suffix-fading="lever2SuffixFading"
        :subtitle="getLeverSubtitle(localSettings.lever2)"
        :midi-cc="localSettings.lever2.ccNumber"
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
          @update:modelValue="markChanged"
          @profileChanged="handleLever2ProfileChange"
          @valueModeChanged="handleLever2ValueModeChange"
        />
      </AccordionSection>
      
      <AccordionSection
        ref="leverPush2Accordion"
        :title="`Press 2`"
        :title-suffix="leverPush2Suffix"
        :title-suffix-fading="leverPush2SuffixFading"
        :subtitle="getLeverPushSubtitle(localSettings.leverPush2)"
        :midi-cc="localSettings.leverPush2.ccNumber"
        :id="'lever-push-2'"
        :default-open="false"
      >
        <LeverPushSettings
          title="Press"
          :lever="2"
          v-model="localSettings.leverPush2"
          :ccOptions="ccOptions"
          :ccMapByNumber="ccMapByNumber"
          :categories="categories"
          :functionModes="leverPushFunctionModes"
          :interpolations="interpolations"
          @update:modelValue="markChanged"
          @profileChanged="handleLeverPush2ProfileChange"
          @behaviourChanged="handleLeverPush2BehaviourChange"
        />
      </AccordionSection>
      
      <AccordionSection
        ref="touchAccordion"
        title="TOUCH"
        :subtitle="getTouchSubtitle(localSettings.touch)"
        :midi-cc="localSettings.touch.ccNumber"
        :id="'touch-sensor'"
        :default-open="false"
      >
        <TouchSettings
          title="TOUCH"
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
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue';
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
import { useToast } from '../composables/useToast';
import { useConfirm } from '../composables/useConfirm';
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

const toast = useToast();
const { confirm } = useConfirm();

const localSettings = ref<DeviceSettings>({ ...deviceSettings.value });
const hasChanges = ref(false);

// Title suffix state for temporary profile name display
const lever1Suffix = ref<string>('');
const lever1SuffixFading = ref<boolean>(false);
const leverPush1Suffix = ref<string>('');
const leverPush1SuffixFading = ref<boolean>(false);
const lever2Suffix = ref<string>('');
const lever2SuffixFading = ref<boolean>(false);
const leverPush2Suffix = ref<string>('');
const leverPush2SuffixFading = ref<boolean>(false);

// Timeout IDs for clearing suffixes
let lever1FadeTimeoutId: ReturnType<typeof setTimeout> | null = null;
let lever1ClearTimeoutId: ReturnType<typeof setTimeout> | null = null;
let leverPush1FadeTimeoutId: ReturnType<typeof setTimeout> | null = null;
let leverPush1ClearTimeoutId: ReturnType<typeof setTimeout> | null = null;
let lever2FadeTimeoutId: ReturnType<typeof setTimeout> | null = null;
let lever2ClearTimeoutId: ReturnType<typeof setTimeout> | null = null;
let leverPush2FadeTimeoutId: ReturnType<typeof setTimeout> | null = null;
let leverPush2ClearTimeoutId: ReturnType<typeof setTimeout> | null = null;

// Handle profile and mode change events from lever components
function handleLever1ProfileChange(profileName: string) {
  if (lever1FadeTimeoutId) clearTimeout(lever1FadeTimeoutId);
  if (lever1ClearTimeoutId) clearTimeout(lever1ClearTimeoutId);
  lever1Suffix.value = ` ${profileName}`;
  lever1SuffixFading.value = false;
  lever1FadeTimeoutId = setTimeout(() => {
    lever1SuffixFading.value = true;
    lever1FadeTimeoutId = null;
  }, 500);
  lever1ClearTimeoutId = setTimeout(() => {
    lever1Suffix.value = '';
    lever1SuffixFading.value = false;
    lever1ClearTimeoutId = null;
  }, 2500);
}

function handleLever1ValueModeChange(modeName: string) {
  handleLever1ProfileChange(modeName);
}

function handleLeverPush1ProfileChange(profileName: string) {
  if (leverPush1FadeTimeoutId) clearTimeout(leverPush1FadeTimeoutId);
  if (leverPush1ClearTimeoutId) clearTimeout(leverPush1ClearTimeoutId);
  leverPush1Suffix.value = ` ${profileName}`;
  leverPush1SuffixFading.value = false;
  leverPush1FadeTimeoutId = setTimeout(() => {
    leverPush1SuffixFading.value = true;
    leverPush1FadeTimeoutId = null;
  }, 500);
  leverPush1ClearTimeoutId = setTimeout(() => {
    leverPush1Suffix.value = '';
    leverPush1SuffixFading.value = false;
    leverPush1ClearTimeoutId = null;
  }, 2500);
}

function handleLeverPush1BehaviourChange(behaviourName: string) {
  handleLeverPush1ProfileChange(behaviourName);
}

function handleLever2ProfileChange(profileName: string) {
  if (lever2FadeTimeoutId) clearTimeout(lever2FadeTimeoutId);
  if (lever2ClearTimeoutId) clearTimeout(lever2ClearTimeoutId);
  lever2Suffix.value = ` ${profileName}`;
  lever2SuffixFading.value = false;
  lever2FadeTimeoutId = setTimeout(() => {
    lever2SuffixFading.value = true;
    lever2FadeTimeoutId = null;
  }, 500);
  lever2ClearTimeoutId = setTimeout(() => {
    lever2Suffix.value = '';
    lever2SuffixFading.value = false;
    lever2ClearTimeoutId = null;
  }, 2500);
}

function handleLever2ValueModeChange(modeName: string) {
  handleLever2ProfileChange(modeName);
}

function handleLeverPush2ProfileChange(profileName: string) {
  if (leverPush2FadeTimeoutId) clearTimeout(leverPush2FadeTimeoutId);
  if (leverPush2ClearTimeoutId) clearTimeout(leverPush2ClearTimeoutId);
  leverPush2Suffix.value = ` ${profileName}`;
  leverPush2SuffixFading.value = false;
  leverPush2FadeTimeoutId = setTimeout(() => {
    leverPush2SuffixFading.value = true;
    leverPush2FadeTimeoutId = null;
  }, 500);
  leverPush2ClearTimeoutId = setTimeout(() => {
    leverPush2Suffix.value = '';
    leverPush2SuffixFading.value = false;
    leverPush2ClearTimeoutId = null;
  }, 2500);
}

function handleLeverPush2BehaviourChange(behaviourName: string) {
  handleLeverPush2ProfileChange(behaviourName);
}

// Load CC map on mount
onMounted(async () => {
  try {
    await loadPolyendCCMap();
  } catch (error) {
    console.error('Failed to load CC map:', error);
  }
});

// Cleanup timeouts on unmount
onBeforeUnmount(() => {
  if (lever1FadeTimeoutId) clearTimeout(lever1FadeTimeoutId);
  if (lever1ClearTimeoutId) clearTimeout(lever1ClearTimeoutId);
  if (leverPush1FadeTimeoutId) clearTimeout(leverPush1FadeTimeoutId);
  if (leverPush1ClearTimeoutId) clearTimeout(leverPush1ClearTimeoutId);
  if (lever2FadeTimeoutId) clearTimeout(lever2FadeTimeoutId);
  if (lever2ClearTimeoutId) clearTimeout(lever2ClearTimeoutId);
  if (leverPush2FadeTimeoutId) clearTimeout(leverPush2FadeTimeoutId);
  if (leverPush2ClearTimeoutId) clearTimeout(leverPush2ClearTimeoutId);
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
  { value: 3, label: 'Reset' },
];

const touchFunctionModes = [
  { value: 0, label: 'Gate' },
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
// These show user-friendly parameter names and user-facing value ranges
function getLeverSubtitle(lever: LeverSettingsType): string {
  const ccMap = ccMapByNumber.value;
  const ccInfo = ccMap.get(lever.ccNumber);
  const paramName = ccInfo?.parameter || `CC ${lever.ccNumber}`;
  // Show user-facing range based on polarity
  const range = lever.valueMode === 1 ? '-100 to 100' : '0 to 100';
  return `${paramName} | ${range}`;
}

function getLeverPushSubtitle(leverPush: LeverPushSettingsType): string {
  const ccMap = ccMapByNumber.value;
  const ccInfo = ccMap.get(leverPush.ccNumber);
  const paramName = ccInfo?.parameter || `CC ${leverPush.ccNumber}`;
  // Check if in Reset mode (functionMode = 3)
  const FUNCTION_MODE_RESET = 3;
  const range = leverPush.functionMode === FUNCTION_MODE_RESET ? 'Reset' : '0 to 100';
  return `${paramName} | ${range}`;
}

function getTouchSubtitle(touch: TouchSettingsType): string {
  const ccMap = ccMapByNumber.value;
  const ccInfo = ccMap.get(touch.ccNumber);
  const paramName = ccInfo?.parameter || `CC ${touch.ccNumber}`;
  // Touch is always unipolar, convert MIDI values (0-127) to display range (0-100)
  const min = Math.round((touch.minCCValue / 127) * 100);
  const max = Math.round((touch.maxCCValue / 127) * 100);
  const range = `${min} to ${max}`;
  return `${paramName} | ${range}`;
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
    toast.error('Failed to load settings from device');
  }
}

async function handleResetDefaults() {
  if (await confirm('Reset all settings to firmware defaults? This will discard current changes.')) {
    try {
      resetToDefaults();
      localSettings.value = { ...deviceSettings.value };
      hasChanges.value = true;
    } catch (error) {
      console.error('Failed to reset to defaults:', error);
      toast.error('Failed to reset to defaults');
    }
  }
}

async function handleSaveToDevice() {
  try {
    await sendSettings(localSettings.value);
    
    try {
      await saveToFlash();
      hasChanges.value = false;
      toast.success('Settings uploaded to device');
    } catch (flashError) {
      console.error('Failed to save to flash:', flashError);
      toast.warning('Settings applied but may not persist on reboot');
    }
  } catch (error) {
    console.error('Failed to apply settings to device:', error);
    toast.error('Failed to apply settings to device');
  }
}

// Accordion refs
const lever1Accordion = ref<InstanceType<typeof AccordionSection> | null>(null);
const leverPush1Accordion = ref<InstanceType<typeof AccordionSection> | null>(null);
const lever2Accordion = ref<InstanceType<typeof AccordionSection> | null>(null);
const leverPush2Accordion = ref<InstanceType<typeof AccordionSection> | null>(null);
const touchAccordion = ref<InstanceType<typeof AccordionSection> | null>(null);

function closeAllAccordions() {
  lever1Accordion.value?.close();
  leverPush1Accordion.value?.close();
  lever2Accordion.value?.close();
  leverPush2Accordion.value?.close();
  touchAccordion.value?.close();
}

defineExpose({
  closeAllAccordions
});
</script>

<style scoped>
.mobile-controls-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.not-connected-message {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}

.controls-accordion {
  padding: 1rem;
  overflow-y: auto;
  overflow-x: hidden;
  /* Ensure content doesn't hide behind sticky bars */
  padding-top: 1rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
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
