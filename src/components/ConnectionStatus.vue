<template>
  <div class="connection-status" :class="statusClass">
    <div class="status-indicator">
      <div class="status-dot" :class="{ connected: isConnected }"></div>
      <span class="status-text">{{ statusText }}</span>
    </div>
    
    <div v-if="deviceName && isConnected" class="device-info">
      <span class="device-name">{{ deviceName }}</span>
    </div>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  isConnected: boolean;
  deviceName: string;
  error?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  error: null,
});

const statusText = computed(() => {
  if (props.isConnected) {
    return 'Connected';
  }
  return 'Disconnected';
});

const statusClass = computed(() => ({
  connected: props.isConnected,
  disconnected: !props.isConnected,
  'has-error': !!props.error,
}));
</script>

<style scoped>
.connection-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
}

.connection-status.has-error {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #6b7280;
  transition: background-color 0.3s;
}

.status-dot.connected {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
}

.status-text {
  font-weight: 500;
  font-size: 0.875rem;
}

.device-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.device-name {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.error-message {
  margin-left: auto;
  color: #ef4444;
  font-size: 0.875rem;
}
</style>
