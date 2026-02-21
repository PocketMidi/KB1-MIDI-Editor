<template>
  <div class="mobile-scales-tab">
    <StickyActionBar
      :is-connected="isConnected"
      :is-loading="isLoading"
      :has-changes="hasChanges"
      @load="handleLoadClick"
      @reset-defaults="handleResetDefaults"
      @save="handleSaveToDevice"
    />
    
    <!-- Always show content, but apply disconnected styling -->
    <div v-if="isCCMapLoaded()" class="scales-content" :class="{ 'disconnected-state': !isConnected }">
      <!-- Presets first -->
      <AccordionSection
        ref="presetsAccordion"
        title="PRESETS"
        :title-suffix="presetsSuffix"
        :title-suffix-fading="presetsSuffixFading"
        :subtitle="presetsSubtitle"
        :id="'presets'"
        :default-open="false"
      >
        <PresetManager
          :current-settings="localSettings"
          :has-unsaved-changes="hasChanges"
          @load="handlePresetLoad"
          @preset-activated="handlePresetActivated"
          @slot-name-display="handleSlotNameDisplay"
        />
      </AccordionSection>
      
      <!-- Keyboard second -->
      <AccordionSection
        ref="keyboardAccordion"
        title="KEYBOARD"
        :title-suffix="keyboardSuffix"
        :title-suffix-fading="keyboardSuffixFading"
        :subtitle="keyboardSubtitle"
        :id="'keyboard'"
        :default-open="false"
      >
        <template #header-right>
          <div class="root-note-display">
            Root Note <span class="root-note-value">{{ currentRootNoteLabel }}</span>
          </div>
        </template>
        <KeyboardSettings
          v-model="keyboardModel"
          :scales="scales"
          :chordTypes="chordTypes"
          :rootNotes="rootNotes"
          @update:modelValue="handleKeyboardChange"
          @mappingChanged="handleMappingChange"
          @chordStyleChanged="handleChordStyleChange"
        />
      </AccordionSection>
      
      <!-- Lever 1 -->
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
      
      <!-- Press 1 -->
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
      
      <!-- Lever 2 -->
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
      
      <!-- Press 2 -->
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
      
      <!-- Touch -->
      <AccordionSection
        ref="touchAccordion"
        title="TOUCH"
        :title-suffix="touchSuffix"
        :title-suffix-fading="touchSuffixFading"
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
          @modeChanged="handleTouchModeChange"
        />
      </AccordionSection>
      
      <!-- System at bottom -->
      <AccordionSection
        ref="systemAccordion"
        title="SYSTEM"
        subtitle="Power & Timeout Settings"
        :id="'system-settings'"
        :default-open="false"
      >
        <SystemSettings
          v-model="localSettings.system"
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
import StickyActionBar from '../components/StickyActionBar.vue';
import KeyboardSettings from '../components/KeyboardSettings.vue';
import AccordionSection from '../components/AccordionSection.vue';
import SystemSettings from '../components/SystemSettings.vue';
import PresetManager from '../components/PresetManager.vue';
import LeverSettings from '../components/LeverSettings.vue';
import LeverPushSettings from '../components/LeverPushSettings.vue';
import TouchSettings from '../components/TouchSettings.vue';
import { PresetStore } from '../state/presets';
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
  devicePresets,
  hasDevicePresetSupport,
} = useDeviceState();

const toast = useToast();
const { confirm } = useConfirm();

const localSettings = ref<DeviceSettings>({ ...deviceSettings.value });
const hasChanges = ref(false);

// Active preset tracking
const activePresetId = ref<string | null>(PresetStore.getActivePresetId());
const activePresetName = ref<string>('');

// State for temporary accordion title suffix (fade-in/out effect)
const keyboardSuffix = ref<string>('');
const keyboardSuffixFading = ref<boolean>(false);
let keyboardFadeTimeoutId: number | null = null;
let keyboardClearTimeoutId: number | null = null;

const presetsSuffix = ref<string>('');
const presetsSuffixFading = ref<boolean>(false);
let presetsFadeTimeoutId: ReturnType<typeof setTimeout> | null = null;
let presetsClearTimeoutId: ReturnType<typeof setTimeout> | null = null;

// Title suffix state for lever controls
const lever1Suffix = ref<string>('');
const lever1SuffixFading = ref<boolean>(false);
const leverPush1Suffix = ref<string>('');
const leverPush1SuffixFading = ref<boolean>(false);
const lever2Suffix = ref<string>('');
const lever2SuffixFading = ref<boolean>(false);
const leverPush2Suffix = ref<string>('');
const leverPush2SuffixFading = ref<boolean>(false);
const touchSuffix = ref<string>('');
const touchSuffixFading = ref<boolean>(false);

// Timeout IDs for clearing suffixes
let lever1FadeTimeoutId: ReturnType<typeof setTimeout> | null = null;
let lever1ClearTimeoutId: ReturnType<typeof setTimeout> | null = null;
let leverPush1FadeTimeoutId: ReturnType<typeof setTimeout> | null = null;
let leverPush1ClearTimeoutId: ReturnType<typeof setTimeout> | null = null;
let lever2FadeTimeoutId: ReturnType<typeof setTimeout> | null = null;
let lever2ClearTimeoutId: ReturnType<typeof setTimeout> | null = null;
let leverPush2FadeTimeoutId: ReturnType<typeof setTimeout> | null = null;
let leverPush2ClearTimeoutId: ReturnType<typeof setTimeout> | null = null;
let touchFadeTimeoutId: ReturnType<typeof setTimeout> | null = null;
let touchClearTimeoutId: ReturnType<typeof setTimeout> | null = null;

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
  if (keyboardFadeTimeoutId) clearTimeout(keyboardFadeTimeoutId);
  if (keyboardClearTimeoutId) clearTimeout(keyboardClearTimeoutId);
  if (presetsFadeTimeoutId) clearTimeout(presetsFadeTimeoutId);
  if (presetsClearTimeoutId) clearTimeout(presetsClearTimeoutId);
  if (lever1FadeTimeoutId) clearTimeout(lever1FadeTimeoutId);
  if (lever1ClearTimeoutId) clearTimeout(lever1ClearTimeoutId);
  if (leverPush1FadeTimeoutId) clearTimeout(leverPush1FadeTimeoutId);
  if (leverPush1ClearTimeoutId) clearTimeout(leverPush1ClearTimeoutId);
  if (lever2FadeTimeoutId) clearTimeout(lever2FadeTimeoutId);
  if (lever2ClearTimeoutId) clearTimeout(lever2ClearTimeoutId);
  if (leverPush2FadeTimeoutId) clearTimeout(leverPush2FadeTimeoutId);
  if (leverPush2ClearTimeoutId) clearTimeout(leverPush2ClearTimeoutId);
  if (touchFadeTimeoutId) clearTimeout(touchFadeTimeoutId);
  if (touchClearTimeoutId) clearTimeout(touchClearTimeoutId);
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

// Chord Types
const chordTypes = [
  { value: 0, label: 'Off' },
  { value: 1, label: 'Major' },
  { value: 2, label: 'Minor' },
  { value: 3, label: 'Diminished' },
  { value: 4, label: 'Augmented' },
  { value: 5, label: 'Sus2' },
  { value: 6, label: 'Sus4' },
  { value: 7, label: 'Power' },
];

// Root Notes (MIDI note numbers - firmware uses these as absolute pitches)
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

// Keyboard play mode (reactive state)
const playMode = ref<'scale' | 'chord'>('scale');

// Chord settings (temporary until firmware supports it)
const chordSettings = ref({
  chordType: 1, // Default: Major
  rootNote: 60, // Default: C
  velocitySpread: 25, // Default: 25%
  strumMode: false, // Default: chord (not strum)
  strumSpeed: 25, // Default: 25ms
});

// Keyboard model that wraps scale data for the component
const keyboardModel = computed({
  get: () => ({
    mode: playMode.value,
    scale: localSettings.value.scale,
    chord: chordSettings.value
  }),
  set: (v) => {
    // Update play mode
    playMode.value = v.mode;
    // Update scale data in localSettings
    localSettings.value.scale = v.scale;
    // Update chord settings (temporary until firmware supports it)
    chordSettings.value = v.chord;
  }
});

// Computed properties for accordion header display
const currentScaleLabel = computed(() => {
  const scale = scales.find(s => s.value === localSettings.value.scale.scaleType);
  return scale ? scale.label : 'Unknown';
});

const currentChordLabel = computed(() => {
  const chord = chordTypes.find(c => c.value === chordSettings.value.chordType);
  return chord ? chord.label : 'Off';
});

const currentRootNoteLabel = computed(() => {
  // Use scale root note in scale mode, chord root note in chord mode
  const rootNoteValue = playMode.value === 'scale' 
    ? localSettings.value.scale.rootNote 
    : chordSettings.value.rootNote;
  const rootNote = rootNotes.find(n => n.value === rootNoteValue);
  return rootNote ? rootNote.label : 'C';
});

const keyboardSubtitle = computed(() => {
  // Show current mode and type
  if (playMode.value === 'chord') {
    return `Chord • ${currentChordLabel.value}`;
  }
  return `Scale • ${currentScaleLabel.value}`;
});

const presetsSubtitle = computed(() => {
  const browserPresets = PresetStore.getAllPresets();
  const cacheCount = browserPresets.length;
  
  // Count valid device presets
  const embeddedCount = devicePresets.value.filter(p => p.isValid).length;
  
  const parts = [];
  
  // Show embedded count if device is connected and supports presets
  if (isConnected.value && hasDevicePresetSupport.value) {
    parts.push(`Embedded: ${embeddedCount}`);
  }
  
  // Always show cache count
  parts.push(`Cache: ${cacheCount}`);
  
  return parts.join(' | ');
});

// Helper functions to generate subtitles for lever accordion headers
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

function handleTouchModeChange(modeName: string) {
  if (touchFadeTimeoutId) clearTimeout(touchFadeTimeoutId);
  if (touchClearTimeoutId) clearTimeout(touchClearTimeoutId);
  touchSuffix.value = ` ${modeName}`;
  touchSuffixFading.value = false;
  touchFadeTimeoutId = setTimeout(() => {
    touchSuffixFading.value = true;
    touchFadeTimeoutId = null;
  }, 500);
  touchClearTimeoutId = setTimeout(() => {
    touchSuffix.value = '';
    touchSuffixFading.value = false;
    touchClearTimeoutId = null;
  }, 2500);
}

function handleSlotNameDisplay(name: string) {
  if (presetsFadeTimeoutId) clearTimeout(presetsFadeTimeoutId);
  if (presetsClearTimeoutId) clearTimeout(presetsClearTimeoutId);
  presetsSuffix.value = ` ${name}`;
  presetsSuffixFading.value = false;
  presetsFadeTimeoutId = setTimeout(() => {
    presetsSuffixFading.value = true;
    presetsFadeTimeoutId = null;
  }, 500);
  presetsClearTimeoutId = setTimeout(() => {
    presetsSuffix.value = '';
    presetsSuffixFading.value = false;
    presetsClearTimeoutId = null;
  }, 2500);
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

function handleKeyboardChange() {
  markChanged();
}

function handleMappingChange(mappingName: string) {
  if (keyboardFadeTimeoutId) clearTimeout(keyboardFadeTimeoutId);
  if (keyboardClearTimeoutId) clearTimeout(keyboardClearTimeoutId);
  keyboardSuffix.value = ` ${mappingName}`;
  keyboardSuffixFading.value = false;
  keyboardFadeTimeoutId = window.setTimeout(() => {
    keyboardSuffixFading.value = true;
    keyboardFadeTimeoutId = null;
  }, 500);
  keyboardClearTimeoutId = window.setTimeout(() => {
    keyboardSuffix.value = '';
    keyboardSuffixFading.value = false;
    keyboardClearTimeoutId = null;
  }, 2500);
}

function handleChordStyleChange(styleName: string) {
  if (keyboardFadeTimeoutId) clearTimeout(keyboardFadeTimeoutId);
  if (keyboardClearTimeoutId) clearTimeout(keyboardClearTimeoutId);
  keyboardSuffix.value = ` ${styleName}`;
  keyboardSuffixFading.value = false;
  keyboardFadeTimeoutId = window.setTimeout(() => {
    keyboardSuffixFading.value = true;
    keyboardFadeTimeoutId = null;
  }, 500);
  keyboardClearTimeoutId = window.setTimeout(() => {
    keyboardSuffix.value = '';
    keyboardSuffixFading.value = false;
    keyboardClearTimeoutId = null;
  }, 2500);
}

function handlePresetLoad(settings: DeviceSettings) {
  localSettings.value = { ...settings };
  hasChanges.value = true; // Mark as changed so user can save to device
}

function handlePresetActivated(presetId: string | null) {
  activePresetId.value = presetId;
  if (presetId) {
    const preset = PresetStore.getPreset(presetId);
    activePresetName.value = preset?.name || '';
  } else {
    activePresetName.value = '';
  }
}

async function handleLoadClick() {
  try {
    await handleLoad();
    localSettings.value = { ...deviceSettings.value };
    hasChanges.value = false;
    toast.success('Settings downloaded from device');
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
const presetsAccordion = ref<InstanceType<typeof AccordionSection> | null>(null);
const keyboardAccordion = ref<InstanceType<typeof AccordionSection> | null>(null);
const lever1Accordion = ref<InstanceType<typeof AccordionSection> | null>(null);
const leverPush1Accordion = ref<InstanceType<typeof AccordionSection> | null>(null);
const lever2Accordion = ref<InstanceType<typeof AccordionSection> | null>(null);
const leverPush2Accordion = ref<InstanceType<typeof AccordionSection> | null>(null);
const touchAccordion = ref<InstanceType<typeof AccordionSection> | null>(null);
const systemAccordion = ref<InstanceType<typeof AccordionSection> | null>(null);

function closeAllAccordions() {
  presetsAccordion.value?.close();
  keyboardAccordion.value?.close();
  lever1Accordion.value?.close();
  leverPush1Accordion.value?.close();
  lever2Accordion.value?.close();
  leverPush2Accordion.value?.close();
  touchAccordion.value?.close();
  systemAccordion.value?.close();
}

defineExpose({
  closeAllAccordions
});
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

.root-note-display {
  font-size: 0.8125rem; /* 13px */
  font-weight: 400;
  color: #848484;
  font-family: 'Roboto Mono';
  margin-right: 1rem;
}

.root-note-value {
  color: var(--accent-highlight);
  font-weight: 600;
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
