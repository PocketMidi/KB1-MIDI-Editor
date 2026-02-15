<template>
  <header class="mobile-header">
    <div class="header-top">
      <!-- Disconnected state: Show BLUETOOTH CONNECT button -->
      <button 
        v-if="!isConnected" 
        class="bluetooth-connect-btn"
        @click="$emit('connect')"
      >
        BLUETOOTH CONNECT
      </button>
      
      <!-- Always show KB1 logo -->
      <img src="/kb1-title.svg" alt="KB1 CONFIGURATOR" class="header-logo" />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  isConnected: boolean;
  deviceName?: string;
}>();

defineEmits<{
  connect: [];
}>();
</script>

<style scoped>
.mobile-header {
  background: #0F0F0F;
  border-bottom: none;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  gap: 2rem;
}

/* Bluetooth Connect Button - Disconnected State */
.bluetooth-connect-btn {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 2px solid #47708E;
  border-radius: 6px;
  color: #47708E;
  font-family: 'Roboto Mono', monospace;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.bluetooth-connect-btn:hover {
  background: rgba(71, 112, 142, 0.1);
}

.bluetooth-connect-btn:active {
  transform: scale(0.98);
}

.header-logo {
  height: 40px;
  width: auto;
  margin-left: auto;
}

/* When disconnected, logo stays on right */
/* When connected, logo is centered (no button on left) */
</style>
