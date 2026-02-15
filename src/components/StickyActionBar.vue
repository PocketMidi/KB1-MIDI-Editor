<template>
  <div class="footer-action-bar">
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
.footer-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 199;
  display: flex;
  gap: 50px; /* Increased spacing between icons (40-60px range) */
  padding: 20px 0;
  background: var(--color-background);
  justify-content: center;
  align-items: center;
  border-top: 1px solid rgba(234, 234, 234, 0.1);
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
  width: 41px; /* Increased by ~70% from 24px */
  height: 41px;
  display: block;
  pointer-events: none;
}

@media (max-width: 640px) {
  .footer-action-bar {
    padding: 16px 0;
    gap: 40px; /* Slightly smaller gap on mobile but still increased */
  }
  
  .action-icon {
    width: 36px; /* Slightly smaller on mobile but still larger than original */
    height: 36px;
  }
}

@media (max-width: 480px) {
  .footer-action-bar {
    padding: 12px 0;
    gap: 35px;
  }
  
  .action-icon {
    width: 32px;
    height: 32px;
  }
}
</style>
