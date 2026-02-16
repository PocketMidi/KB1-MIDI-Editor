<template>
  <nav class="bottom-nav">
    <button
      class="bottom-nav-button"
      @click="$emit('home')"
      :disabled="disabled"
    >
      <span class="bottom-nav-icon">🏠</span>
      <span class="bottom-nav-label">HOME</span>
    </button>
    <button
      class="bottom-nav-button"
      @click="$emit('sync')"
      :disabled="!isConnected || disabled"
    >
      <span class="bottom-nav-icon">🔄</span>
      <span class="bottom-nav-label">SYNC</span>
    </button>
    <button
      class="bottom-nav-button"
      @click="$emit('save')"
      :disabled="!isConnected || disabled"
    >
      <span class="bottom-nav-icon">💾</span>
      <span class="bottom-nav-label">SAVE</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  isConnected: boolean;
  disabled?: boolean;
}>();

defineEmits<{
  home: [];
  sync: [];
  save: [];
}>();
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: var(--color-background-soft);
  border-top: 1px solid var(--color-border);
  padding: 0.5rem;
  gap: 0.5rem;
  z-index: 100;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.bottom-nav-button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s;
  border-radius: var(--kb1-radius-sm, 4px);
  min-height: 56px; /* Mobile touch target */
}

.bottom-nav-button:hover:not(:disabled) {
  background: var(--color-background-mute);
}

.bottom-nav-button:active:not(:disabled) {
  transform: scale(0.95);
  background: var(--color-background);
}

.bottom-nav-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.bottom-nav-icon {
  font-size: 0.8125rem; /* 13px */
  margin-bottom: 0.25rem;
}

.bottom-nav-label {
  font-size: 0.8125rem; /* 13px */
  font-weight: 600;
  letter-spacing: 0.5px;
}

@media (min-width: 769px) {
  .bottom-nav {
    display: none;
  }
}
</style>
