<template>
  <Teleport to="body">
    <div v-if="isOpen" class="wheel-picker-overlay" @click="handleOverlayClick">
      <div class="wheel-picker-container" @click.stop>
        <div class="wheel-picker-header">
          <button class="picker-btn" @click="cancel">Cancel</button>
          <span class="picker-title">{{ title }}</span>
          <button class="picker-btn picker-done" @click="done">Done</button>
        </div>
        
        <div class="wheel-picker-content">
          <div class="picker-overlay-top"></div>
          <div class="picker-selection-bar"></div>
          <div class="picker-overlay-bottom"></div>
          
          <div 
            ref="pickerScroll"
            class="picker-scroll"
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
          >
            <div class="picker-spacer"></div>
            <div 
              v-for="(value, index) in values" 
              :key="index"
              class="picker-item"
              :class="{ selected: value === selectedValue }"
              @click="selectValue(value)"
            >
              {{ formatValue(value) }}
            </div>
            <div class="picker-spacer"></div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = withDefaults(defineProps<{
  isOpen: boolean
  title?: string
  min: number
  max: number
  step: number
  modelValue: number
  unit?: string
}>(), {
  title: 'Select Value',
  unit: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'close'): void
}>()

const pickerScroll = ref<HTMLElement | null>(null)
const selectedValue = ref(props.modelValue)
const touchStartY = ref(0)
const scrollStartY = ref(0)
const velocity = ref(0)
const lastTouchTime = ref(0)
const lastTouchY = ref(0)

// Generate array of values
const values = ref<number[]>([])

// Generate values when props change
watch(() => [props.min, props.max, props.step], () => {
  generateValues()
}, { immediate: true })

function generateValues() {
  const vals: number[] = []
  for (let v = props.min; v <= props.max; v += props.step) {
    vals.push(v)
  }
  values.value = vals
}

// Scroll to selected value when opened
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    selectedValue.value = props.modelValue
    nextTick(() => {
      scrollToValue(props.modelValue, false)
    })
  }
})

function formatValue(value: number): string {
  return props.unit ? `${value}${props.unit}` : String(value)
}

function scrollToValue(value: number, smooth = true) {
  if (!pickerScroll.value) return
  
  const index = values.value.indexOf(value)
  if (index === -1) return
  
  const ITEM_HEIGHT = 44
  const scrollTop = index * ITEM_HEIGHT
  
  if (smooth) {
    pickerScroll.value.scrollTo({ top: scrollTop, behavior: 'smooth' })
  } else {
    pickerScroll.value.scrollTop = scrollTop
  }
}

function selectValue(value: number) {
  selectedValue.value = value
  scrollToValue(value, true)
}

function handleOverlayClick() {
  cancel()
}

function cancel() {
  emit('close')
}

function done() {
  emit('update:modelValue', selectedValue.value)
  emit('close')
}

// Touch handling for smooth scrolling with momentum
function handleTouchStart(event: TouchEvent) {
  if (!pickerScroll.value || !event.touches[0]) return
  
  touchStartY.value = event.touches[0].clientY
  scrollStartY.value = pickerScroll.value.scrollTop
  velocity.value = 0
  lastTouchTime.value = Date.now()
  lastTouchY.value = event.touches[0].clientY
}

function handleTouchMove(event: TouchEvent) {
  if (!pickerScroll.value || !event.touches[0]) return
  
  const deltaY = touchStartY.value - event.touches[0].clientY
  const newScrollTop = scrollStartY.value + deltaY
  
  pickerScroll.value.scrollTop = newScrollTop
  
  // Calculate velocity for momentum
  const now = Date.now()
  const timeDelta = now - lastTouchTime.value
  const yDelta = lastTouchY.value - event.touches[0].clientY
  
  if (timeDelta > 0) {
    velocity.value = yDelta / timeDelta
  }
  
  lastTouchTime.value = now
  lastTouchY.value = event.touches[0].clientY
  
  // Update selected value based on scroll position
  updateSelectedFromScroll()
}

function handleTouchEnd() {
  if (!pickerScroll.value) return
  
  // Apply momentum
  if (Math.abs(velocity.value) > 0.5) {
    const momentum = velocity.value * 200
    const currentScroll = pickerScroll.value.scrollTop
    const targetScroll = currentScroll + momentum
    
    pickerScroll.value.scrollTo({ top: targetScroll, behavior: 'smooth' })
  }
  
  // Snap to nearest value
  setTimeout(() => {
    snapToNearest()
  }, 300)
}

function updateSelectedFromScroll() {
  if (!pickerScroll.value) return
  
  const ITEM_HEIGHT = 44
  const scrollTop = pickerScroll.value.scrollTop
  const index = Math.round(scrollTop / ITEM_HEIGHT)
  
  if (index >= 0 && index < values.value.length) {
    const value = values.value[index]
    if (value !== undefined) {
      selectedValue.value = value
    }
  }
}

function snapToNearest() {
  if (!pickerScroll.value) return
  
  const ITEM_HEIGHT = 44
  const scrollTop = pickerScroll.value.scrollTop
  const nearestIndex = Math.round(scrollTop / ITEM_HEIGHT)
  
  if (nearestIndex >= 0 && nearestIndex < values.value.length) {
    const value = values.value[nearestIndex]
    if (value !== undefined) {
      selectedValue.value = value
      scrollToValue(value, true)
    }
  }
}
</script>

<style scoped>
.wheel-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.wheel-picker-container {
  width: 100%;
  background: var(--color-background-soft);
  border-radius: 16px 16px 0 0;
  max-height: 50vh;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.wheel-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.picker-title {
  font-family: 'Roboto Mono';
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-heading);
}

.picker-btn {
  font-family: 'Roboto Mono';
  font-size: 0.8125rem;
  background: transparent;
  border: none;
  color: var(--color-text);
  cursor: pointer;
  padding: 0.5rem;
}

.picker-done {
  color: #9F9C80;
  font-weight: 700;
}

.wheel-picker-content {
  position: relative;
  height: 264px;
  overflow: hidden;
}

.picker-overlay-top,
.picker-overlay-bottom {
  position: absolute;
  left: 0;
  right: 0;
  height: 110px;
  pointer-events: none;
  z-index: 2;
}

.picker-overlay-top {
  top: 0;
  background: linear-gradient(to bottom, 
    var(--color-background-soft) 0%, 
    rgba(31, 30, 26, 0) 100%);
}

.picker-overlay-bottom {
  bottom: 0;
  background: linear-gradient(to top, 
    var(--color-background-soft) 0%, 
    rgba(31, 30, 26, 0) 100%);
}

.picker-selection-bar {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 44px;
  border-top: 1px solid rgba(159, 156, 128, 0.3);
  border-bottom: 1px solid rgba(159, 156, 128, 0.3);
  background: rgba(159, 156, 128, 0.05);
  pointer-events: none;
  z-index: 1;
}

.picker-scroll {
  height: 264px;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.picker-scroll::-webkit-scrollbar {
  display: none;
}

.picker-spacer {
  height: 110px;
  flex-shrink: 0;
}

.picker-item {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Roboto Mono';
  font-size: 1.25rem;
  color: var(--color-text);
  scroll-snap-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.picker-item.selected {
  color: var(--color-heading);
  font-weight: 700;
}

.picker-item:active {
  background: rgba(159, 156, 128, 0.1);
}
</style>
