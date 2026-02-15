<template>
  <div class="midi-editor-page">
    <div class="page-header">
      <h2>SLIDERS</h2>
      <p>Perform and control live CC output</p>
    </div>
    
    <!-- Always show content, but apply disconnected styling -->
    <div class="editor-content" :class="{ 'disconnected-state': !isConnected }">
      <div class="cc-mappings-grid">
        <CCMappingCard
          v-for="mapping in ccMappings"
          :key="mapping.faderIndex"
          :mapping="mapping"
          :disabled="isLoading"
          @update="handleMappingUpdate"
        />
      </div>
      
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
          @click="handleRestoreSnapshot"
          :disabled="isLoading"
        >
          Restore from Snapshot
        </button>
        
        <button
          class="btn btn-secondary"
          @click="handleResetDefaults"
          :disabled="isLoading"
        >
          Reset to Defaults
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
import { ref } from 'vue';
import CCMappingCard from '../components/CCMappingCard.vue';
import { useDeviceState } from '../composables/useDeviceState';
import type { CCMapping } from '../ble/kb1Protocol';

const {
  isConnected,
  ccMappings,
  isLoading,
  sendCCMapping,
  saveToFlash,
  handleLoad,
  recallBaseline,
  resetToDefaults,
} = useDeviceState();

const hasChanges = ref(false);

async function handleLoadClick() {
  try {
    await handleLoad();
    hasChanges.value = false;
  } catch (error) {
    console.error('Failed to load from device:', error);
    alert('Failed to load from device');
  }
}

async function handleRestoreSnapshot() {
  try {
    recallBaseline();
    hasChanges.value = false;
  } catch (error) {
    console.error('Failed to restore from snapshot:', error);
    alert('No snapshot available to restore');
  }
}

async function handleResetDefaults() {
  if (confirm('Reset all settings to firmware defaults? This will discard current changes.')) {
    try {
      resetToDefaults();
      hasChanges.value = true;
    } catch (error) {
      console.error('Failed to reset to defaults:', error);
      alert('Failed to reset to defaults');
    }
  }
}

async function handleMappingUpdate(mapping: CCMapping) {
  try {
    // TODO: In a real implementation, you might want to batch updates
    // or apply them only when user clicks "Apply"
    // For now, we'll just mark that we have changes
    hasChanges.value = true;
    
    // Update the mapping locally
    const index = ccMappings.value.findIndex(m => m.faderIndex === mapping.faderIndex);
    if (index !== -1) {
      ccMappings.value[index] = mapping;
    }
  } catch (error) {
    console.error('Failed to update CC mapping:', error);
    alert('Failed to update CC mapping');
  }
}

async function handleApply() {
  try {
    // Send all mappings to the device
    for (const mapping of ccMappings.value) {
      await sendCCMapping(mapping);
    }
    hasChanges.value = false;
    alert('CC mappings applied successfully');
  } catch (error) {
    console.error('Failed to apply CC mappings:', error);
    alert('Failed to apply CC mappings to device');
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
.midi-editor-page {
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

.editor-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.cc-mappings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
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
