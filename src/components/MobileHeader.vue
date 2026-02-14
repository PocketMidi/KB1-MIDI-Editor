<template>
  <header class="mobile-header">
    <div class="header-top">
      <img src="/src/assets/ui/KB1-title.svg" alt="KB1" class="header-logo" />
    </div>
    
    <!-- Connection status bar showing device connection state and optional timeout warnings.
         The timeout prop displays a warning when BLE connection might time out soon,
         alerting users to check their device connection. -->
    <div class="connection-bar" :class="connectionClass">
      <div class="connection-status">
        <span class="status-indicator" :class="{ connected: isConnected }"></span>
        <span class="status-text">
          {{ statusText }}
        </span>
      </div>
      <div v-if="timeout" class="timeout-warning">
        ⚠️ Timeout: {{ timeout }}s
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  isConnected: boolean;
  deviceName?: string;
  timeout?: number;
}>();

const statusText = computed(() => {
  if (props.isConnected) {
    return props.deviceName ? `Connected: ${props.deviceName}` : 'Connected';
  }
  return 'Disconnected';
});

const connectionClass = computed(() => ({
  'is-connected': props.isConnected,
  'is-disconnected': !props.isConnected,
  'has-warning': props.timeout && props.timeout > 0,
}));
</script>

<style scoped>
.mobile-header {
  background: var(--color-background-soft);
  border-bottom: none;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
}

.header-logo {
  height: 32px;
  width: auto;
}

.connection-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  border-top: none;
  gap: 1rem;
  font-size: 0.8125rem;
}

.connection-bar.is-connected {
  background: rgba(34, 197, 94, 0.1);
}

.connection-bar.is-disconnected {
  background: rgba(239, 68, 68, 0.1);
}

.connection-bar.has-warning {
  background: rgba(251, 191, 36, 0.1);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  animation: pulse 2s infinite;
}

.status-indicator.connected {
  background: #22c55e;
  animation: none;
}

.status-text {
  font-weight: 500;
  color: var(--color-text);
}

.timeout-warning {
  color: #f59e0b;
  font-weight: 500;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@media (min-width: 769px) {
  .header-title {
    font-size: 1.25rem;
  }
}
</style>
