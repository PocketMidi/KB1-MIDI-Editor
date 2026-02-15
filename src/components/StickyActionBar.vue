<template>
  <div class="sticky-action-bar">
    <button
      class="action-icon-btn"
      title="Load"
      aria-label="Load"
      @click="$emit('load')"
      :disabled="!isConnected || isLoading"
    >
      <img src="/load.svg" alt="" class="action-icon" />
    </button>
    
    <button
      class="action-icon-btn"
      title="Reset"
      aria-label="Reset"
      @click="$emit('reset-defaults')"
      :disabled="!isConnected || isLoading"
    >
      <img src="/reset.svg" alt="" class="action-icon" />
    </button>
    
    <button
      class="action-icon-btn"
      title="Save"
      aria-label="Save"
      @click="$emit('save')"
      :disabled="!isConnected || isLoading || !hasChanges"
    >
      <img src="/save.svg" alt="" class="action-icon" />
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
  save: [];
}>();
</script>

<style scoped>
.sticky-action-bar {
  position: sticky;
  top: 44px; /* Height of mobile tab nav */
  z-index: 199;
  display: flex;
  gap: 1rem;
  padding: 1rem 0.75rem;
  background: var(--color-background);
  justify-content: center;
  align-items: center;
}

.action-icon-btn {
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  opacity: 0.3;
  transition: opacity 0.3s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon-btn:hover:not(:disabled) {
  opacity: 1.0;
}

.action-icon-btn:focus-visible {
  opacity: 1.0;
  outline: 2px solid #74C4FF;
  outline-offset: 2px;
  border-radius: 2px;
}

.action-icon-btn:disabled {
  opacity: 0.15;
  cursor: not-allowed;
}

.action-icon {
  width: 24px;
  height: 24px;
  display: block;
  pointer-events: none;
}

@media (max-width: 480px) {
  .sticky-action-bar {
    padding: 0.75rem;
    gap: 0.75rem;
  }
  
  .action-icon {
    width: 22px;
    height: 22px;
  }
}

@media (min-width: 769px) {
  .sticky-action-bar {
    /* Not sticky on desktop - nav bar is not sticky */
    position: static;
    padding: 1.5rem;
  }
  
  .action-icon {
    width: 28px;
    height: 28px;
  }
}
</style>
