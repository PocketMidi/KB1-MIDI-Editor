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
    <div class="scales-content" :class="{ 'disconnected-state': !isConnected }">
      <AccordionSection
        ref="scalesAccordion"
        title="Scales"
        :title-suffix="scalesSuffix"
        :title-suffix-fading="scalesSuffixFading"
        :subtitle="scalesSubtitle"
        :id="'scales'"
        :default-open="false"
      >
        <template #header-right>
          <div class="root-note-display">
            Root Note <span class="root-note-value">{{ currentRootNoteLabel }}</span>
          </div>
        </template>
        <ScaleSettings
          v-model="localSettings.scale"
          :scales="scales"
          :rootNotes="rootNotes"
          @update:modelValue="markChanged"
          @mappingChanged="handleMappingChange"
        />
      </AccordionSection>
      
      <AccordionSection
        ref="presetsAccordion"
        title="PRESETS"
        :subtitle="presetsSubtitle"
        :id="'presets'"
        :default-open="false"
      >
        <PresetManager
          :current-settings="localSettings"
          :has-unsaved-changes="hasChanges"
          @load="handlePresetLoad"
          @preset-activated="handlePresetActivated"
        />
      </AccordionSection>
      
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
import { ref, watch, computed } from 'vue';
import { useDeviceState } from '../composables/useDeviceState';
import type { DeviceSettings } from '../ble/kb1Protocol';
import StickyActionBar from '../components/StickyActionBar.vue';
import ScaleSettings from '../components/ScaleSettings.vue';
import AccordionSection from '../components/AccordionSection.vue';
import SystemSettings from '../components/SystemSettings.vue';
import PresetManager from '../components/PresetManager.vue';
import { PresetStore } from '../state/presets';

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

// Active preset tracking
const activePresetId = ref<string | null>(PresetStore.getActivePresetId());
const activePresetName = ref<string>('');

// State for temporary accordion title suffix (fade-in/out effect)
const scalesSuffix = ref<string>('');
const scalesSuffixFading = ref<boolean>(false);
let scalesFadeTimeoutId: number | null = null;
let scalesClearTimeoutId: number | null = null;

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

// Computed properties for accordion header display
const currentScaleLabel = computed(() => {
  const scale = scales.find(s => s.value === localSettings.value.scale.scaleType);
  return scale ? scale.label : 'Unknown';
});

const currentRootNoteLabel = computed(() => {
  const rootNote = rootNotes.find(n => n.value === localSettings.value.scale.rootNote);
  return rootNote ? rootNote.label : 'C';
});

const scalesSubtitle = computed(() => {
  return currentScaleLabel.value;
});

const presetsSubtitle = computed(() => {
  const presets = PresetStore.getAllPresets();
  const count = presets.length;
  
  if (activePresetName.value) {
    return `Active: ${activePresetName.value}`;
  }
  
  return count === 0 ? 'No presets saved' : `${count} saved`;
});

// Watch for device settings changes
watch(deviceSettings, (newSettings) => {
  if (!hasChanges.value) {
    localSettings.value = { ...newSettings };
  }
}, { deep: true });

function markChanged() {
  hasChanges.value = true;
}

function handleMappingChange(mappingName: string) {
  if (scalesFadeTimeoutId) clearTimeout(scalesFadeTimeoutId);
  if (scalesClearTimeoutId) clearTimeout(scalesClearTimeoutId);
  scalesSuffix.value = ` ${mappingName}`;
  scalesSuffixFading.value = false;
  scalesFadeTimeoutId = window.setTimeout(() => {
    scalesSuffixFading.value = true;
    scalesFadeTimeoutId = null;
  }, 500);
  scalesClearTimeoutId = window.setTimeout(() => {
    scalesSuffix.value = '';
    scalesSuffixFading.value = false;
    scalesClearTimeoutId = null;
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

// Accordion refs
const scalesAccordion = ref<InstanceType<typeof AccordionSection> | null>(null);
const presetsAccordion = ref<InstanceType<typeof AccordionSection> | null>(null);
const systemAccordion = ref<InstanceType<typeof AccordionSection> | null>(null);

function closeAllAccordions() {
  scalesAccordion.value?.close();
  presetsAccordion.value?.close();
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
