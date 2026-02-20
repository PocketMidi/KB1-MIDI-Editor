<template>
  <div class="preset-manager">
    <!-- Device Presets Section (if supported) -->
    <div v-if="hasDevicePresetSupport && isConnected" class="preset-section">
      <h4 class="section-title">Device Presets (On KB1)</h4>
      <p class="section-subtitle">Stored in KB1 flash memory • 8 slots</p>
      
      <div class="device-presets-grid">
        <div
          v-for="slot in 8"
          :key="`device-${slot - 1}`"
          class="device-preset-slot"
          :class="{ 
            empty: !getDevicePreset(slot - 1).isValid,
            active: activeDeviceSlot === (slot - 1)
          }"
        >
          <div class="slot-number">Slot {{ slot }}</div>
          
          <div v-if="getDevicePreset(slot - 1).isValid" class="slot-content">
            <div class="slot-name">{{ getDevicePreset(slot - 1).name }}</div>
            <div class="slot-actions">
              <button class="btn-small" @click="loadFromDevice(slot - 1)" title="Load preset from device">
                Load
              </button>
              <button class="btn-small" @click="saveToDevice(slot - 1)" title="Overwrite with current settings">
                Save
              </button>
              <button class="btn-small btn-danger" @click="deleteFromDevice(slot - 1)" title="Delete from device">
                Del
              </button>
            </div>
          </div>
          
          <div v-else class="slot-empty">
            <button class="btn-small btn-create" @click="saveToDevice(slot - 1)" title="Save current settings to this slot">
              + Save Here
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Divider between device and browser presets -->
    <div v-if="hasDevicePresetSupport && isConnected" class="section-divider">
      <span>Browser Presets (Local Storage)</span>
    </div>
    
    <!-- Create New Preset Button -->
    <button class="btn-create-preset" @click="showCreateDialog = true">
      + Create New Preset
    </button>

    <!-- Presets List -->
    <div v-if="presets.length > 0" class="presets-list">
      <div
        v-for="preset in presets"
        :key="preset.id"
        class="preset-item"
        :class="{ active: preset.id === activePresetId, selected: selectedPresets.has(preset.id) }"
      >
        <!-- Checkbox for selection (shy - only shows when in selection mode) -->
        <div v-if="showCheckboxes" class="preset-checkbox" @click.stop="togglePresetSelection(preset.id)">
          <input 
            type="checkbox" 
            :checked="selectedPresets.has(preset.id)"
            @change="togglePresetSelection(preset.id)"
          />
        </div>
        
        <div class="preset-info" @click="togglePresetSelection(preset.id)" style="cursor: pointer;">
          <div class="preset-name">
            <span class="active-indicator" v-if="preset.id === activePresetId">●</span>
            {{ preset.name }}
          </div>
          <div class="preset-meta">
            {{ formatDate(preset.modifiedAt) }}
          </div>
        </div>
        <div class="preset-actions">
          <button class="btn-small" @click="loadPreset(preset.id)" :title="preset.id === activePresetId ? 'Reload' : 'Load'">
            Load
          </button>
          <button class="btn-small" @click="updatePreset(preset.id)" :disabled="!hasUnsavedChanges || preset.id !== activePresetId" title="Save current settings to this preset">
            Save
          </button>
          <button class="btn-small btn-menu" @click="toggleMenu(preset.id)" title="More options">
            ⋯
          </button>
          
          <!-- Dropdown Menu -->
          <div v-if="openMenuId === preset.id" class="preset-menu">
            <button @click="renamePreset(preset.id)">Rename</button>
            <button @click="duplicatePreset(preset.id)">Duplicate</button>
            <button @click="exportPreset(preset.id)">Export</button>
            <div class="menu-divider"></div>
            <button @click="deletePreset(preset.id)" class="btn-danger">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <p>No presets saved yet.</p>
      <p class="hint">Create your first preset to save all current settings.</p>
    </div>

    <!-- Import/Export Section -->
    <div class="import-export-section">
      <button class="btn-secondary" @click="importPresetDialog">
        Import Preset
      </button>
      <button 
        v-if="showCheckboxes && selectedPresets.size < presets.length" 
        class="btn-secondary" 
        @click="selectAll"
      >
        Select All
      </button>
      <button 
        v-if="showCheckboxes" 
        class="btn-secondary" 
        @click="clearSelection"
      >
        Clear Selection
      </button>
      <button 
        class="btn-secondary" 
        @click="selectedPresets.size > 0 ? exportSelectedPresets() : exportAllPresets()" 
        :disabled="presets.length === 0"
      >
        {{ selectedPresets.size > 0 ? `Export (${selectedPresets.size})` : 'Export' }}
      </button>
    </div>

    <!-- Create Preset Dialog -->
    <div v-if="showCreateDialog" class="modal-overlay" @click.self="showCreateDialog = false">
      <div class="modal-dialog">
        <h3>Create New Preset</h3>
        <div class="form-group">
          <label>Preset Name</label>
          <input
            v-model="newPresetName"
            type="text"
            class="input-text"
            placeholder="Enter preset name"
            @keyup.enter="confirmCreate"
            ref="nameInput"
          />
        </div>
        <div class="form-actions">
          <button class="btn-secondary" @click="generateName">
            🎲 Random Name
          </button>
        </div>
        <div class="modal-buttons">
          <button class="btn-secondary" @click="showCreateDialog = false">Cancel</button>
          <button class="btn-primary" @click="confirmCreate" :disabled="!newPresetName.trim()">
            Create
          </button>
        </div>
      </div>
    </div>

    <!-- Rename Dialog -->
    <div v-if="showRenameDialog" class="modal-overlay" @click.self="showRenameDialog = false">
      <div class="modal-dialog">
        <h3>Rename Preset</h3>
        <div class="form-group">
          <label>Preset Name</label>
          <input
            v-model="renameValue"
            type="text"
            class="input-text"
            @keyup.enter="confirmRename"
            ref="renameInput"
          />
        </div>
        <div class="modal-buttons">
          <button class="btn-secondary" @click="showRenameDialog = false">Cancel</button>
          <button class="btn-primary" @click="confirmRename" :disabled="!renameValue.trim()">
            Rename
          </button>
        </div>
      </div>
    </div>

    <!-- Hidden file input for import -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleFileImport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';
import { PresetStore, generateRandomName, type Preset } from '../state/presets';
import type { DeviceSettings } from '../ble/kb1Protocol';
import { useDeviceState } from '../composables/useDeviceState';

const {
  isConnected,
  hasDevicePresetSupport,
  devicePresets,
  saveDevicePreset,
  loadDevicePreset,
  deleteDevicePreset,
} = useDeviceState();

const props = defineProps<{
  currentSettings: DeviceSettings;
  hasUnsavedChanges: boolean;
}>();

const emit = defineEmits<{
  (e: 'load', settings: DeviceSettings): void;
  (e: 'presetActivated', presetId: string | null): void;
}>();

const presets = ref<Preset[]>([]);
const activePresetId = ref<string | null>(null);
const openMenuId = ref<string | null>(null);

// Selection state for export
const selectedPresets = ref<Set<string>>(new Set());
const showCheckboxes = ref(false);

// Create dialog
const showCreateDialog = ref(false);
const newPresetName = ref('');
const nameInput = ref<HTMLInputElement | null>(null);

// Rename dialog
const showRenameDialog = ref(false);
const renameValue = ref('');
const renamingId = ref<string | null>(null);
const renameInput = ref<HTMLInputElement | null>(null);

// File input
const fileInput = ref<HTMLInputElement | null>(null);

// Device preset state
const activeDeviceSlot = ref<number | null>(null);

// Load presets on mount
onMounted(() => {
  refreshPresets();
  activePresetId.value = PresetStore.getActivePresetId();
});

// Helper to get device preset by slot
function getDevicePreset(slot: number) {
  return devicePresets.value[slot] || { 
    slot, 
    name: '[Empty]', 
    timestamp: 0, 
    isValid: false 
  };
}

// Device preset operations
async function saveToDevice(slot: number) {
  const name = prompt('Enter preset name (max 32 characters):', `Preset ${slot + 1}`);
  if (!name) return;
  
  try {
    await saveDevicePreset(slot, name.slice(0, 32));
    activeDeviceSlot.value = slot;
    alert(`Saved to device slot ${slot + 1}`);
  } catch (error) {
    console.error('Failed to save device preset:', error);
    alert('Failed to save to device');
  }
}

async function loadFromDevice(slot: number) {
  const preset = getDevicePreset(slot);
  if (!preset.isValid) {
    alert('Slot is empty');
    return;
  }
  
  try {
    await loadDevicePreset(slot);
    activeDeviceSlot.value = slot;
    // Clear browser preset active state
    activePresetId.value = null;
    emit('presetActivated', null);
    alert(`Loaded from device slot ${slot + 1}: "${preset.name}"`);
  } catch (error) {
    console.error('Failed to load device preset:', error);
    alert('Failed to load from device');
  }
}

async function deleteFromDevice(slot: number) {
  const preset = getDevicePreset(slot);
  if (!confirm(`Delete "${preset.name}" from slot ${slot + 1}?`)) return;
  
  try {
    await deleteDevicePreset(slot);
    if (activeDeviceSlot.value === slot) {
      activeDeviceSlot.value = null;
    }
    alert(`Deleted from device slot ${slot + 1}`);
  } catch (error) {
    console.error('Failed to delete device preset:', error);
    alert('Failed to delete device preset');
  }
}

// Load presets on mount

// Auto-focus inputs when dialogs open
watch(showCreateDialog, async (show) => {
  if (show) {
    await nextTick();
    nameInput.value?.focus();
  }
});

watch(showRenameDialog, async (show) => {
  if (show) {
    await nextTick();
    renameInput.value?.focus();
  }
});

// Close menu when clicking outside
onMounted(() => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.preset-actions')) {
      openMenuId.value = null;
    }
  });
});

function refreshPresets() {
  presets.value = PresetStore.getAllPresets();
}

function generateName() {
  newPresetName.value = generateRandomName();
}

function confirmCreate() {
  const name = newPresetName.value.trim();
  if (!name) return;

  const preset = PresetStore.createPreset(name, props.currentSettings);
  activePresetId.value = preset.id;
  PresetStore.setActivePresetId(preset.id);
  emit('presetActivated', preset.id);
  
  refreshPresets();
  showCreateDialog.value = false;
  newPresetName.value = '';
}

function loadPreset(id: string) {
  const preset = PresetStore.getPreset(id);
  if (!preset) return;

  if (props.hasUnsavedChanges && activePresetId.value !== id) {
    if (!confirm('You have unsaved changes. Loading this preset will discard them. Continue?')) {
      return;
    }
  }

  emit('load', preset.settings);
  activePresetId.value = id;
  PresetStore.setActivePresetId(id);
  emit('presetActivated', id);
  openMenuId.value = null;
}

function updatePreset(id: string) {
  if (!confirm('Update this preset with current settings?')) return;

  PresetStore.updatePreset(id, { settings: props.currentSettings });
  refreshPresets();
  openMenuId.value = null;
}

function toggleMenu(id: string) {
  openMenuId.value = openMenuId.value === id ? null : id;
}

function renamePreset(id: string) {
  const preset = PresetStore.getPreset(id);
  if (!preset) return;

  renamingId.value = id;
  renameValue.value = preset.name;
  showRenameDialog.value = true;
  openMenuId.value = null;
}

function confirmRename() {
  const name = renameValue.value.trim();
  if (!name || !renamingId.value) return;

  PresetStore.updatePreset(renamingId.value, { name });
  refreshPresets();
  showRenameDialog.value = false;
  renamingId.value = null;
  renameValue.value = '';
}

function duplicatePreset(id: string) {
  const preset = PresetStore.getPreset(id);
  if (!preset) return;

  PresetStore.duplicatePreset(id);
  refreshPresets();
  openMenuId.value = null;
}

function deletePreset(id: string) {
  const preset = PresetStore.getPreset(id);
  if (!preset) return;

  if (!confirm(`Delete preset "${preset.name}"? This cannot be undone.`)) return;

  PresetStore.deletePreset(id);
  
  if (activePresetId.value === id) {
    activePresetId.value = null;
    emit('presetActivated', null);
  }
  
  refreshPresets();
  openMenuId.value = null;
}

function exportPreset(id: string) {
  const json = PresetStore.exportPreset(id);
  if (!json) return;

  const preset = PresetStore.getPreset(id);
  const filename = `KB1_Preset_${preset?.name.replace(/\s/g, '_')}.json`;
  
  downloadJSON(json, filename);
  openMenuId.value = null;
}

function exportAllPresets() {
  const json = PresetStore.exportAllPresets();
  const filename = `KB1_All_Presets_${Date.now()}.json`;
  downloadJSON(json, filename);
}

function togglePresetSelection(id: string) {
  // Show checkboxes on first selection
  if (!showCheckboxes.value) {
    showCheckboxes.value = true;
  }
  
  // Toggle selection
  if (selectedPresets.value.has(id)) {
    selectedPresets.value.delete(id);
  } else {
    selectedPresets.value.add(id);
  }
  
  // Force reactivity
  selectedPresets.value = new Set(selectedPresets.value);
  
  // Hide checkboxes if all deselected
  if (selectedPresets.value.size === 0) {
    showCheckboxes.value = false;
  }
}

function clearSelection() {
  selectedPresets.value.clear();
  showCheckboxes.value = false;
}

function selectAll() {
  selectedPresets.value = new Set(presets.value.map(p => p.id));
}

function exportSelectedPresets() {
  if (selectedPresets.value.size === 0) return;
  
  // If only one preset selected, export with its name
  if (selectedPresets.value.size === 1) {
    const id = Array.from(selectedPresets.value)[0];
    if (id) {
      exportPreset(id);
    }
    return;
  }
  
  // Export multiple presets
  const selectedIds = Array.from(selectedPresets.value);
  const selectedPresetsData = selectedIds.map(id => PresetStore.getPreset(id)).filter(p => p !== null);
  const json = JSON.stringify(selectedPresetsData, null, 2);
  const filename = `KB1_${selectedPresets.value.size}_Presets_${Date.now()}.json`;
  downloadJSON(json, filename);
  clearSelection();
}

function downloadJSON(json: string, filename: string) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function importPresetDialog() {
  fileInput.value?.click();
}

async function handleFileImport(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const json = JSON.parse(text);
    
    // Check if it's a single preset or array
    if (Array.isArray(json)) {
      const count = PresetStore.importAllPresets(text);
      alert(`Successfully imported ${count} preset(s)`);
    } else {
      const preset = PresetStore.importPreset(text);
      if (preset) {
        alert(`Successfully imported preset "${preset.name}"`);
      } else {
        alert('Failed to import preset. Invalid format.');
      }
    }
    
    refreshPresets();
  } catch (error) {
    alert('Failed to import preset file. Please check the file format.');
  }
  
  // Reset input
  input.value = '';
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Less than 1 minute
  if (diff < 60000) return 'Just now';
  
  // Less than 1 hour
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins} min${mins > 1 ? 's' : ''} ago`;
  }
  
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  // Format as date
  return date.toLocaleDateString();
}
</script>

<style scoped>
.preset-manager {
  padding: 1rem;
  font-family: 'Roboto Mono', monospace;
}

.btn-create-preset {
  width: 100%;
  padding: 0.25rem 1rem;
  background: rgba(106, 104, 83, 0.2);
  border: none;
  color: #EAEAEA;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Roboto Mono', monospace;
  margin-bottom: 1rem;
}

.btn-create-preset:hover {
  background: rgba(106, 104, 83, 0.3);
}

.presets-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  overflow: visible;
}

.preset-item {
  background: rgba(29, 29, 29, 0.4);
  border: none;
  border-radius: 4px;
  padding: 0.25rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
  position: relative;
}

.preset-item.active {
  background: rgba(106, 104, 83, 0.25);
}

.preset-item:hover {
  background: rgba(234, 234, 234, 0.1);
}

.preset-item.selected {
  background: rgba(249, 172, 32, 0.2);
}

.preset-checkbox {
  display: flex;
  align-items: center;
  margin-right: 0.75rem;
  cursor: pointer;
}

.preset-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--accent-highlight);
}

.preset-info {
  flex: 1;
  min-width: 0;
}

.preset-name {
  font-size: 0.8125rem;
  color: #EAEAEA;
  font-weight: 500;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.active-indicator {
  color: #6A6853;
  font-size: 0.6rem;
}

.preset-meta {
  font-size: 0.75rem;
  color: var(--label-gray);
}

.preset-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  position: relative;
}

.btn-small {
  padding: 0.25rem 0.75rem;
  background: rgba(234, 234, 234, 0.1);
  border: none;
  color: #EAEAEA;
  font-size: 0.75rem;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Roboto Mono', monospace;
  white-space: nowrap;
}

.btn-small:hover:not(:disabled) {
  background: rgba(234, 234, 234, 0.2);
}

.btn-small:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-menu {
  padding: 0.375rem 0.5rem;
  font-size: 1rem;
  line-height: 1;
}

.preset-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.25rem;
  background: #1D1D1D;
  border: 1px solid rgba(234, 234, 234, 0.2);
  border-radius: 4px;
  padding: 0.25rem;
  z-index: 9999;
  min-width: 140px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.8);
}

.preset-menu button {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  color: #EAEAEA;
  font-size: 0.75rem;
  text-align: left;
  cursor: pointer;
  border-radius: 3px;
  font-family: 'Roboto Mono', monospace;
  transition: background 0.2s;
}

.preset-menu button:hover {
  background: rgba(234, 234, 234, 0.1);
}

.preset-menu button.btn-danger {
  color: #ff4444;
}

.preset-menu button.btn-danger:hover {
  background: rgba(255, 68, 68, 0.1);
}

.menu-divider {
  height: 1px;
  background: rgba(234, 234, 234, 0.1);
  margin: 0.25rem 0;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #848484;
}

.empty-state p {
  margin: 0.5rem 0;
  font-size: 0.8125rem;
}

.empty-state .hint {
  font-size: 0.75rem;
  opacity: 0.7;
}

.import-export-section {
  display: flex;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: none;
}

.btn-secondary {
  flex: 1;
  padding: 0.25rem 1rem;
  background: rgba(234, 234, 234, 0.05);
  border: none;
  color: #EAEAEA;
  font-size: 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Roboto Mono', monospace;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(234, 234, 234, 0.1);
}

.btn-secondary:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-dialog {
  background: #1D1D1D;
  border: 1px solid rgba(234, 234, 234, 0.2);
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
}

.modal-dialog h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #EAEAEA;
  font-weight: 500;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  color: #848484;
  text-transform: uppercase;
}

.input-text {
  width: 100%;
  padding: 0.25rem 1rem;
  background: rgba(234, 234, 234, 0.05);
  border: none;
  border-radius: 4px;
  color: #EAEAEA;
  font-size: 0.8125rem;
  font-family: 'Roboto Mono', monospace;
  box-sizing: border-box;
}

.input-text:focus {
  outline: none;
  background: rgba(234, 234, 234, 0.08);
}

.form-actions {
  margin-bottom: 1rem;
}

.modal-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-primary {
  padding: 0.25rem 1rem;
  background: #6A6853;
  border: none;
  color: #EAEAEA;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Roboto Mono', monospace;
}

.btn-primary:hover:not(:disabled) {
  background: #7A7863;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .preset-actions {
    flex-wrap: wrap;
  }
  
  .btn-small {
    font-size: 0.7rem;
    padding: 0.25rem 0.5rem;
  }
}

/* Device Presets Section */
.preset-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-text);
  margin-bottom: 0.25rem;
}

.section-subtitle {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.device-presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
}

.device-preset-slot {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0.75rem;
  min-height: 110px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: border-color 0.2s, background-color 0.2s;
  background: rgba(234, 234, 234, 0.02);
}

.device-preset-slot.active {
  border-color: var(--accent-highlight);
  background: rgba(106, 104, 83, 0.1);
}

.device-preset-slot.empty {
  opacity: 0.5;
  border-style: dashed;
}

.device-preset-slot:hover:not(.empty) {
  border-color: rgba(234, 234, 234, 0.3);
}

.slot-number {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.slot-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.slot-name {
  font-size: 0.8125rem;
  font-weight: 600;
  word-break: break-word;
  color: var(--color-text);
  flex: 1;
}

.slot-actions {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.slot-actions .btn-small {
  flex: 1;
  min-width: 45px;
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
}

.slot-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-create {
  background: rgba(106, 104, 83, 0.3) !important;
}

.btn-create:hover {
  background: rgba(106, 104, 83, 0.5) !important;
}

.section-divider {
  margin: 2rem 0;
  text-align: center;
  position: relative;
}

.section-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--color-divider);
}

.section-divider span {
  position: relative;
  background: var(--color-background);
  padding: 0 1rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  font-weight: 500;
}

@media (max-width: 768px) {
  .device-presets-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

