<template>
  <Teleport to="body">
    <Transition name="picker-fade">
      <div v-if="isOpen" class="picker-backdrop" @click="handleBackdropClick">
        <div 
          class="picker-overlay" 
          @click.stop
          :style="positionStyle"
        >
          <div class="wheel-picker-container">
            <div class="center-indicator"></div>
            <div 
              ref="scrollContainer"
              class="wheel-scroll"
              @scroll="handleScroll"
            >
              <div class="wheel-spacer"></div>
              <div
                v-for="(option, index) in options"
                :key="option.value"
                class="wheel-item"
                :data-index="index"
                @click="selectItem(index)"
              >
                {{ option.label }}
              </div>
              <div class="wheel-spacer"></div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount, computed } from 'vue';

interface WheelOption {
  label: string;
  value: string | number;
}

const props = defineProps<{
  modelValue: string | number;
  options: WheelOption[];
  isOpen: boolean;
  triggerEl?: HTMLElement | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
  (e: 'update:isOpen', value: boolean): void;
}>();

const scrollContainer = ref<HTMLElement | null>(null);
const ITEM_HEIGHT = 44; // Height of each item in px
const VISIBLE_ITEMS = 5; // Number of visible items
let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

// Calculate position relative to trigger element
const positionStyle = computed(() => {
  if (!props.triggerEl) {
    return {
      position: 'fixed' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    };
  }
  
  const rect = props.triggerEl.getBoundingClientRect();
  const pickerHeight = VISIBLE_ITEMS * ITEM_HEIGHT; // 220px
  
  // Center the picker vertically over the trigger button
  const top = rect.top + (rect.height / 2) - (pickerHeight / 2);
  
  return {
    position: 'fixed' as const,
    top: `${top}px`,
    right: `${window.innerWidth - rect.right}px`,
    minWidth: `${rect.width}px`
  };
});

// Initialize scroll position when opened
watch(() => props.isOpen, async (open) => {
  if (open) {
    await nextTick();
    const initialIndex = props.options.findIndex(opt => opt.value === props.modelValue);
    if (initialIndex >= 0) {
      scrollToIndex(initialIndex, false);
    }
    updateItemStyles();
  }
});

function scrollToIndex(index: number, smooth = true) {
  if (!scrollContainer.value) return;
  
  const targetScroll = index * ITEM_HEIGHT;
  scrollContainer.value.scrollTo({
    top: targetScroll,
    behavior: smooth ? 'smooth' : 'auto'
  });
}

function selectItem(index: number) {
  const selectedOption = props.options[index];
  if (selectedOption) {
    // Scroll to the selected position before closing
    scrollToIndex(index, true);
    
    // Wait for scroll to complete before emitting and closing
    setTimeout(() => {
      emit('update:modelValue', selectedOption.value);
      close();
    }, 100);
  }
}

function handleScroll() {
  updateItemStyles();
  
  // Clear existing timeout
  if (scrollTimeout) clearTimeout(scrollTimeout);
  
  // Set new timeout to snap and commit selection
  scrollTimeout = setTimeout(() => {
    snapToNearest();
  }, 150);
}

function snapToNearest() {
  if (!scrollContainer.value) return;
  
  const scrollTop = scrollContainer.value.scrollTop;
  const nearestIndex = Math.round(scrollTop / ITEM_HEIGHT);
  const clampedIndex = Math.max(0, Math.min(nearestIndex, props.options.length - 1));
  
  scrollToIndex(clampedIndex);
  
  // Emit selection after snap
  setTimeout(() => {
    const selectedOption = props.options[clampedIndex];
    if (selectedOption) {
      emit('update:modelValue', selectedOption.value);
    }
  }, 100);
}

function updateItemStyles() {
  if (!scrollContainer.value) return;
  
  const scrollTop = scrollContainer.value.scrollTop;
  const containerHeight = VISIBLE_ITEMS * ITEM_HEIGHT; // 220px
  const spacerHeight = 88; // 2 items worth of space
  
  // Center of the visible container
  const centerY = scrollTop + (containerHeight / 2);
  
  const items = scrollContainer.value.querySelectorAll('.wheel-item');
  items.forEach((item, index) => {
    // Each item's center position accounting for spacer
    const itemY = spacerHeight + (index * ITEM_HEIGHT) + (ITEM_HEIGHT / 2);
    const distance = Math.abs(centerY - itemY);
    const maxDistance = containerHeight / 2;
    
    // Calculate scale and opacity based on distance from center
    const distanceRatio = Math.min(distance / maxDistance, 1);
    const scale = 1 - (distanceRatio * 0.4); // Scale from 1.0 to 0.6
    const opacity = 1 - (distanceRatio * 0.9); // Opacity from 1.0 to 0.1
    const blur = distanceRatio * 2; // Blur from 0px to 2px
    
    const element = item as HTMLElement;
    element.style.transform = `scale(${scale})`;
    element.style.opacity = `${opacity}`;
    element.style.filter = `blur(${blur}px)`;
  });
}

function handleBackdropClick() {
  close();
}

function close() {
  emit('update:isOpen', false);
}

onBeforeUnmount(() => {
  if (scrollTimeout) clearTimeout(scrollTimeout);
});
</script>

<style scoped>
.picker-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  backdrop-filter: blur(4px);
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
}

.picker-overlay {
  background: rgba(20, 20, 20, 0.5);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
}

.wheel-picker-container {
  position: relative;
  height: 220px; /* 5 items × 44px */
  overflow: hidden;
}

.center-indicator {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 44px;
  transform: translateY(-50%);
  background: rgba(40, 40, 40, 0.6);
  pointer-events: none;
  z-index: 0;
}

.wheel-scroll {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.wheel-scroll::-webkit-scrollbar {
  display: none;
}

.wheel-spacer {
  height: 88px; /* 2 items worth of space for centering */
  flex-shrink: 0;
}

.wheel-item {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.75rem;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.9375rem;
  color: #EAEAEA;
  cursor: pointer;
  transition: transform 0.1s ease, opacity 0.1s ease;
  user-select: none;
  transform-origin: center center;
}

/* Transition animations */
.picker-fade-enter-active {
  transition: opacity 0.2s ease;
}

.picker-fade-leave-active {
  transition: opacity 0.15s ease;
}

.picker-fade-enter-from,
.picker-fade-leave-to {
  opacity: 0;
}

.picker-fade-enter-active .picker-overlay {
  animation: picker-popup 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.picker-fade-leave-active .picker-overlay {
  animation: picker-popdown 0.2s ease-in;
}

@keyframes picker-popup {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes picker-popdown {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0.8);
    opacity: 0;
  }
}
</style>
