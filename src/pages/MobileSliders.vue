<template>
  <div class="mobile-sliders-tab">
    <!-- Always show content, but apply disconnected styling -->
    <div class="sliders-wrapper" :class="{ 'disconnected-state': !isConnected }">
      <PerformanceSliders />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDeviceState } from '../composables/useDeviceState';
import PerformanceSliders from '../components/PerformanceSliders.vue';

const { isConnected } = useDeviceState();
</script>

<style scoped>
.mobile-sliders-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.not-connected-message {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}

.sliders-wrapper {
  flex: 1;
  overflow: hidden;
}

@media (min-width: 769px) {
  .mobile-sliders-tab {
    padding-bottom: 0;
  }
}
</style>