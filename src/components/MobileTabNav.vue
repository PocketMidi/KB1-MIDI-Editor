<template>
  <nav class="mobile-tab-nav">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="tab-button"
      :class="{ active: modelValue === tab.id }"
      @click="$emit('update:modelValue', tab.id)"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>

<script setup lang="ts">
export interface Tab {
  id: string;
  label: string;
}

defineProps<{
  tabs: Tab[];
  modelValue: string;
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<style scoped>
.mobile-tab-nav {
  position: sticky;
  top: 0;
  z-index: 200;
  display: flex;
  background: var(--color-background-mute);
  border-bottom: none;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-button {
  flex: 1;
  padding: 0.75rem 0.5rem;
  background: transparent;
  border: none;
  border-radius: 0;
  color: var(--color-text);
  font-family: 'Roboto Mono', monospace;
  font-weight: 700;
  font-size: 0.875rem;
  text-transform: uppercase;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  opacity: 0.32;
  transition: all 0.2s;
  white-space: nowrap;
  min-height: 44px; /* Mobile touch target */
  min-width: 80px;
}

.tab-button:hover {
  opacity: 0.6;
  background: transparent;
}

.tab-button.active {
  color: var(--color-text);
  border-bottom: 2px solid var(--color-text);
  opacity: 1;
  background: transparent;
}

.tab-button:active {
  transform: scale(0.98);
}

@media (max-width: 768px) {
  .tab-button {
    font-size: 0.8125rem;
    padding: 0.625rem 0.5rem;
  }
}
</style>
