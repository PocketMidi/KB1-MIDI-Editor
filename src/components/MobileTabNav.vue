<template>
  <nav class="mobile-tab-nav">
    <!-- Tab buttons -->
    <div class="tab-buttons">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-button"
        :class="{ active: modelValue === tab.id }"
        @click="$emit('update:modelValue', tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>
    
    <!-- Bluetooth status section -->
    <div class="bluetooth-status">
      <div class="separator"></div>
      <span class="status-text" :class="{ connected: isConnected }">
        {{ isConnected ? 'CONNECTED' : 'DISCONNECTED' }}
      </span>
      <img src="/bluetooth-icon.svg" alt="Bluetooth" class="bluetooth-icon" />
    </div>
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
  isConnected: boolean;
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
  justify-content: space-between;
  align-items: stretch;
  background: #0F0F0F;
  border-bottom: none;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-buttons {
  display: flex;
  flex: 1;
}

.tab-button {
  padding: 1rem 1.5rem;
  background: transparent;
  border: none;
  border-radius: 0;
  color: #EAEAEA;
  font-family: 'Roboto Mono', monospace;
  font-weight: 700;
  font-size: 0.875rem;
  text-transform: uppercase;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  opacity: 0.32;
  transition: all 0.2s;
  white-space: nowrap;
  min-height: 44px;
  position: relative;
}

.tab-button:hover {
  opacity: 0.6;
  background: transparent;
}

.tab-button.active {
  color: #EAEAEA;
  opacity: 1;
  background: transparent;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #EAEAEA;
  border-radius: 1px;
}

.tab-button:active {
  transform: scale(0.98);
}

/* Bluetooth status section */
.bluetooth-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  white-space: nowrap;
}

.separator {
  width: 2px;
  height: 1.25rem;
  background: #EAEAEA;
  align-self: center;
}

.status-text {
  font-family: 'Roboto Mono', monospace;
  font-weight: 700;
  font-size: 0.875rem;
  color: #47708E;
  opacity: 0.5;
}

.status-text.connected {
  opacity: 1;
}

.bluetooth-icon {
  height: 20px;
  width: auto;
}

@media (max-width: 768px) {
  .tab-button {
    font-size: 0.8125rem;
    padding: 0.75rem 1rem;
  }
  
  .bluetooth-status {
    padding: 0.75rem 1rem;
    gap: 0.5rem;
  }
  
  .bluetooth-icon {
    height: 18px;
  }
}
</style>
