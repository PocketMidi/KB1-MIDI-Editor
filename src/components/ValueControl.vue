<template>
  <div class="value-control">
    <button 
      class="stepper-btn"
      :disabled="isAtMin"
      @click="decreaseSmall"
      :title="`Decrease by ${smallStep}`"
    >
      ◀
    </button>
    <input
      type="number"
      class="value-input"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      @input="handleInput"
      @blur="validateAndUpdate"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    />
    <button 
      class="stepper-btn"
      :disabled="isAtMax"
      @click="increaseSmall"
      :title="`Increase by ${smallStep}`"
    >
      ▶
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: number
  min?: number
  max?: number
  step?: number
  smallStep?: number
  largeStep?: number
}>(), {
  min: 0,
  max: 100,
  step: 1,
  smallStep: 5,
  largeStep: 10
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

// Drag tracking
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartValue = ref(0)

const isAtMin = computed(() => props.modelValue <= props.min)
const isAtMax = computed(() => props.modelValue >= props.max)

function clamp(value: number): number {
  return Math.max(props.min, Math.min(props.max, value))
}

function snapToStep(value: number): number {
  return Math.round(value / props.step) * props.step
}

function decreaseSmall() {
  const newValue = snapToStep(props.modelValue - props.smallStep)
  emit('update:modelValue', clamp(newValue))
}

function increaseSmall() {
  const newValue = snapToStep(props.modelValue + props.smallStep)
  emit('update:modelValue', clamp(newValue))
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = parseFloat(target.value)
  
  if (!isNaN(value)) {
    emit('update:modelValue', clamp(snapToStep(value)))
  }
}

function validateAndUpdate(event: Event) {
  const target = event.target as HTMLInputElement
  const value = parseFloat(target.value)
  
  if (isNaN(value)) {
    target.value = String(props.modelValue)
  } else {
    const clamped = clamp(snapToStep(value))
    target.value = String(clamped)
    emit('update:modelValue', clamped)
  }
}

// Mouse wheel scroll support
function handleWheel(event: WheelEvent) {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -1 : 1
  const change = delta * props.smallStep
  const newValue = snapToStep(props.modelValue + change)
  emit('update:modelValue', clamp(newValue))
}

// Mouse drag support
function handleMouseDown(event: MouseEvent) {
  event.preventDefault()
  isDragging.value = true
  dragStartX.value = event.clientX
  dragStartValue.value = props.modelValue
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function handleMouseMove(event: MouseEvent) {
  if (!isDragging.value) return
  
  const deltaX = event.clientX - dragStartX.value
  // Scale: 5 pixels of movement = 1 step
  const steps = Math.round(deltaX / 5)
  const change = steps * props.step
  const newValue = snapToStep(dragStartValue.value + change)
  emit('update:modelValue', clamp(newValue))
}

function handleMouseUp() {
  isDragging.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

// Touch gesture support (horizontal drag)
function handleTouchStart(event: TouchEvent) {
  if (!event.touches[0]) return
  isDragging.value = true
  dragStartX.value = event.touches[0].clientX
  dragStartValue.value = props.modelValue
}

function handleTouchMove(event: TouchEvent) {
  if (!isDragging.value || !event.touches[0]) return
  event.preventDefault()
  
  const deltaX = event.touches[0].clientX - dragStartX.value
  // Scale: 5 pixels of movement = 1 step
  const steps = Math.round(deltaX / 5)
  const change = steps * props.step
  const newValue = snapToStep(dragStartValue.value + change)
  emit('update:modelValue', clamp(newValue))
}

function handleTouchEnd() {
  isDragging.value = false
}

// Cleanup on unmount
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<style scoped>
.value-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
}

.stepper-btn {
  padding: 0;
  border: none;
  background: transparent;
  color: #EAEAEA;
  cursor: pointer;
  font-size: 0.625rem; /* 10px - match dropdown triangle */
  font-family: 'Roboto Mono';
  transition: opacity 0.2s;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stepper-btn:hover:not(:disabled) {
  opacity: 0.7;
}

.stepper-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.value-input {
  width: 60px;
  padding: 0;
  border: none;
  background: transparent;
  color: #EAEAEA;
  font-size: 0.8125rem; /* 13px */
  font-family: 'Roboto Mono';
  font-weight: 400;
  text-align: center;
  cursor: ew-resize; /* Indicates horizontal dragging */
  touch-action: none; /* Prevent default touch behaviors */
  user-select: none; /* Prevent text selection while dragging */
}

.value-input:focus {
  outline: none;
}

/* Hide number input spinners */
.value-input::-webkit-inner-spin-button,
.value-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.value-input[type=number] {
  -moz-appearance: textfield;
}
</style>
