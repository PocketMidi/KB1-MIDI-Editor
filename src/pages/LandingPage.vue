<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import SettingsPanel from '../components/SettingsPanel.vue';
import SlidersPanel from '../components/SlidersPanel.vue';
import '../styles/slider.css';

const LIVE_MODE_KEY = 'kb1.liveMode';

function getInitialLiveMode(): boolean {
  try {
    return JSON.parse(localStorage.getItem(LIVE_MODE_KEY) || 'false');
  } catch {
    return false;
  }
}

const liveMode = ref<boolean>(getInitialLiveMode());

watch(liveMode, (newValue) => {
  localStorage.setItem(LIVE_MODE_KEY, JSON.stringify(newValue));
});

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    liveMode.value = false;
  }
  if (e.key.toLowerCase() === 'f') {
    liveMode.value = !liveMode.value;
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown);
});

function enterLiveMode() {
  liveMode.value = true;
}

function exitLiveMode() {
  liveMode.value = false;
}
</script>

<template>
  <div
    :class="{ 'live-root': liveMode }"
    :style="{
      display: 'grid',
      gridTemplateColumns: liveMode ? '1fr' : '320px 1fr',
      height: '100vh',
    }"
  >
    <aside
      v-if="!liveMode"
      style="
        border-right: 1px solid #e5e7eb;
        padding: 12px 16px;
        overflow-y: auto;
      "
    >
      <SettingsPanel />
    </aside>
    <main
      :style="{
        padding: liveMode ? '24px' : '12px 16px',
        overflowY: 'auto',
      }"
    >
      <SlidersPanel :live-mode="liveMode" @enter-live-mode="enterLiveMode" />
    </main>
    <button
      v-if="liveMode"
      class="live-exit-pill"
      @click="exitLiveMode"
      title="Exit Live Mode (Esc)"
    >
      Exit
    </button>
  </div>
</template>
