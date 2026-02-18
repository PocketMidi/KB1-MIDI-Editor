<template>
  <div class="mobile-sliders-tab">
    <StickyActionBar
      :is-connected="isConnected"
      :is-loading="false"
      :has-changes="false"
      @load="handleLoad"
      @reset-defaults="handleResetDefaults"
      @save="handleSave"
    />
    
    <!-- Always show content, but apply disconnected styling -->
    <div class="sliders-wrapper" :class="{ 'disconnected-state': !isConnected }">
      <PerformanceSliders ref="performanceSlidersRef" />
    </div>

    <!-- Save Preset Dialog -->
    <div v-if="showSaveDialog" class="modal-overlay" @click.self="showSaveDialog = false">
      <div class="modal-dialog">
        <h3>Save Slider Preset</h3>
        <div class="form-group">
          <label>Preset Name</label>
          <input
            v-model="newPresetName"
            type="text"
            class="input-text"
            placeholder="Enter preset name"
            @keyup.enter="confirmSave"
            ref="saveInput"
          />
        </div>
        <div class="form-actions">
          <button class="btn-secondary" @click="generateName">
            🎲 Random Name
          </button>
        </div>
        <div class="modal-buttons">
          <button class="btn-secondary" @click="showSaveDialog = false">Cancel</button>
          <button class="btn-primary" @click="confirmSave" :disabled="!newPresetName.trim()">
            Save
          </button>
        </div>
      </div>
    </div>

    <!-- Load Preset Dialog -->
    <div v-if="showLoadDialog" class="modal-overlay" @click.self="showLoadDialog = false">
      <div class="modal-dialog">
        <h3>Load Slider Preset</h3>
        
        <div v-if="presets.length > 0" class="presets-list">
          <div
            v-for="preset in presets"
            :key="preset.id"
            class="preset-item"
            @click="loadPreset(preset.id)"
          >
            <div class="preset-info">
              <div class="preset-name">{{ preset.name }}</div>
              <div class="preset-meta">{{ formatDate(preset.modifiedAt) }}</div>
            </div>
            <div class="preset-actions">
              <button class="btn-icon" @click.stop="deletePreset(preset.id)" title="Delete">
                🗑️
              </button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>No presets saved yet.</p>
        </div>

        <div class="modal-buttons">
          <button class="btn-secondary" @click="showLoadDialog = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';
import { useDeviceState } from '../composables/useDeviceState';
import PerformanceSliders from '../components/PerformanceSliders.vue';
import StickyActionBar from '../components/StickyActionBar.vue';
import { SliderPresetStore, generateRandomSliderName, type NamedSliderPreset } from '../state/sliderPresets';

const { isConnected } = useDeviceState();
const performanceSlidersRef = ref<InstanceType<typeof PerformanceSliders> | null>(null);

// Save dialog
const showSaveDialog = ref(false);
const newPresetName = ref('');
const saveInput = ref<HTMLInputElement | null>(null);

// Load dialog
const showLoadDialog = ref(false);
const presets = ref<NamedSliderPreset[]>([]);

onMounted(() => {
  refreshPresets();
});

function refreshPresets() {
  presets.value = SliderPresetStore.getAllPresets();
}

// Handle reset to defaults
function handleResetDefaults() {
  if (performanceSlidersRef.value) {
    performanceSlidersRef.value.resetToDefaults();
  }
}

// Handle load - show load dialog
async function handleLoad() {
  refreshPresets();
  showLoadDialog.value = true;
}

// Handle save - show save dialog
async function handleSave() {
  showSaveDialog.value = true;
  await nextTick();
  saveInput.value?.focus();
}

// Generate random name for preset
function generateName() {
  newPresetName.value = generateRandomSliderName();
}

// Confirm save
function confirmSave() {
  const name = newPresetName.value.trim();
  if (!name || !performanceSlidersRef.value) return;

  const currentPreset = performanceSlidersRef.value.getCurrentPreset();
  if (currentPreset) {
    SliderPresetStore.createPreset(name, currentPreset);
  }

  showSaveDialog.value = false;
  newPresetName.value = '';
  refreshPresets();
}

// Load preset
function loadPreset(id: string) {
  const preset = SliderPresetStore.getPreset(id);
  if (!preset || !performanceSlidersRef.value) return;

  performanceSlidersRef.value.loadPreset(preset.preset);
  SliderPresetStore.setActivePresetId(id);
  showLoadDialog.value = false;
}

// Delete preset
function deletePreset(id: string) {
  const preset = SliderPresetStore.getPreset(id);
  if (!preset) return;

  if (!confirm(`Delete preset "${preset.name}"? This cannot be undone.`)) return;

  SliderPresetStore.deletePreset(id);
  refreshPresets();
}

// Format date
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins} min${mins > 1 ? 's' : ''} ago`;
  }
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  return date.toLocaleDateString();
}
</script>

<style scoped>
.mobile-sliders-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.not-connected-message {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}

.sliders-wrapper {
  flex: 1;
  overflow: hidden;
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-dialog {
  background: #1A1A1A;
  border: 1px solid #6A6853;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  font-family: 'Roboto Mono', monospace;
}

.modal-dialog h3 {
  margin: 0 0 1.5rem 0;
  color: #EAEAEA;
  font-size: 1.125rem;
  font-weight: 500;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #EAEAEA;
  font-size: 0.875rem;
}

.input-text {
  width: 100%;
  padding: 0.625rem;
  background: rgba(106, 104, 83, 0.1);
  border: 1px solid #6A6853;
  border-radius: 4px;
  color: #EAEAEA;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
}

.input-text:focus {
  outline: none;
  border-color: #8B8970;
  background: rgba(106, 104, 83, 0.15);
}

.form-actions {
  margin-bottom: 1rem;
}

.modal-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.625rem 1.25rem;
  border-radius: 4px;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;
}

.btn-primary {
  background: rgba(106, 104, 83, 0.3);
  border-color: #6A6853;
  color: #EAEAEA;
}

.btn-primary:hover:not(:disabled) {
  background: rgba(106, 104, 83, 0.5);
  border-color: #8B8970;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  border-color: #6A6853;
  color: #EAEAEA;
}

.btn-secondary:hover {
  background: rgba(106, 104, 83, 0.2);
  border-color: #8B8970;
}

/* Presets List */
.presets-list {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.preset-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: rgba(106, 104, 83, 0.1);
  border: 1px solid #6A6853;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-item:hover {
  background: rgba(106, 104, 83, 0.2);
  border-color: #8B8970;
}

.preset-info {
  flex: 1;
}

.preset-name {
  color: #EAEAEA;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.preset-meta {
  color: #8B8970;
  font-size: 0.75rem;
}

.preset-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: transparent;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  font-size: 1rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.btn-icon:hover {
  opacity: 1;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #8B8970;
}

.empty-state p {
  margin: 0.5rem 0;
  font-size: 0.875rem;
}

@media (min-width: 769px) {
  .mobile-sliders-tab {
    padding-bottom: 0;
  }
}
</style>