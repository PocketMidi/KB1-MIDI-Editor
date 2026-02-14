<template>
  <div class="sticky-action-bar">
    <button
      class="action-btn action-btn-secondary"
      @click="$emit('load')"
      :disabled="!isConnected || isLoading"
    >
      <span class="action-icon">🔄</span>
      <span v-if="isLoading">Loading...</span>
      <span v-else>Load</span>
    </button>
    
    <button
      class="action-btn action-btn-secondary"
      @click="$emit('reset-defaults')"
      :disabled="!isConnected || isLoading"
    >
      <span class="action-icon">↺</span>
      <span>Reset</span>
    </button>
    
    <button
      class="action-btn action-btn-secondary"
      @click="$emit('reset-changes')"
      :disabled="!isConnected || isLoading || !hasChanges"
    >
      <span class="action-icon">↶</span>
      <span>Undo</span>
    </button>
    
    <button
      class="action-btn action-btn-primary"
      @click="$emit('save')"
      :disabled="!isConnected || isLoading || !hasChanges"
    >
      <span class="action-icon">💾</span>
      <span v-if="isLoading">Saving...</span>
      <span v-else>Save</span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isConnected: boolean;
  isLoading: boolean;
  hasChanges: boolean;
}>();

defineEmits<{
  load: [];
  'reset-defaults': [];
  'reset-changes': [];
  save: [];
}>();
</script>

<style scoped>
.sticky-action-bar {
  position: sticky;
  top: 44px; /* Height of mobile tab nav */
  z-index: 199;
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.action-btn {
  flex: 1;
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem 0.625rem;
  border: none;
  border-radius: var(--kb1-radius-sm, 6px);
  font-weight: 500;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-height: 40px; /* Compressed from 44px */
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn-primary {
  background: var(--kb1-primary, #3b82f6);
  color: white;
}

.action-btn-primary:hover:not(:disabled) {
  background: var(--kb1-primary-hover, #2563eb);
}

.action-btn-primary:active:not(:disabled) {
  transform: scale(0.98);
}

.action-btn-secondary {
  background: var(--color-background-mute);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.action-btn-secondary:hover:not(:disabled) {
  background: var(--color-background-soft);
}

.action-btn-secondary:active:not(:disabled) {
  transform: scale(0.98);
}

.action-icon {
  font-size: 1rem;
}

@media (max-width: 480px) {
  .sticky-action-bar {
    padding: 0.5rem;
    gap: 0.375rem;
  }
  
  .action-btn {
    font-size: 0.75rem;
    padding: 0.5rem 0.5rem;
    min-width: 70px;
    min-height: 38px;
  }
  
  .action-icon {
    font-size: 0.875rem;
  }
}

@media (min-width: 769px) {
  .sticky-action-bar {
    position: sticky;
    padding: 1rem;
  }
  
  .action-btn {
    flex: 0 1 auto;
    min-width: 120px;
  }
}
</style>
