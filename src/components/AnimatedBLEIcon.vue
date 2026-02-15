<template>
  <div class="animated-ble-icon" :style="{ width: `${size}px`, height: `${size}px` }">
    <img 
      :src="currentFrame" 
      :alt="alt"
      :style="{ width: '100%', height: '100%', objectFit: 'contain' }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';

interface Props {
  size?: number;
  alt?: string;
  fps?: number;
}

const props = withDefaults(defineProps<Props>(), {
  size: 150,
  alt: 'Bluetooth',
  fps: 25,
});

const FRAME_COUNT = 83;
const currentFrameIndex = ref(0);
let animationInterval: ReturnType<typeof setInterval> | null = null;

// Generate frame path based on current index
const currentFrame = computed(() => {
  const frameNum = String(currentFrameIndex.value).padStart(5, '0');
  // Use import.meta.env.BASE_URL to get the correct base path
  return `${import.meta.env.BASE_URL}ble_1/ble_2_${frameNum}.png`;
});

// Start animation
onMounted(() => {
  const frameDelay = 1000 / props.fps; // Convert FPS to milliseconds per frame
  
  animationInterval = setInterval(() => {
    currentFrameIndex.value = (currentFrameIndex.value + 1) % FRAME_COUNT;
  }, frameDelay) as ReturnType<typeof setInterval>;
  
  // Preload all frames for smooth animation
  preloadFrames();
});

// Stop animation on unmount
onBeforeUnmount(() => {
  if (animationInterval !== null) {
    clearInterval(animationInterval);
  }
});

// Preload all frames
function preloadFrames() {
  const baseUrl = import.meta.env.BASE_URL;
  for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new Image();
    const frameNum = String(i).padStart(5, '0');
    img.src = `${baseUrl}ble_1/ble_2_${frameNum}.png`;
  }
}
</script>

<style scoped>
.animated-ble-icon {
  display: inline-block;
  position: relative;
}
</style>
