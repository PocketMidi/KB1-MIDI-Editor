<template>
  <div class="value-control">
    <div class="control-row">
      <button 
        class="stepper-btn"
        :disabled="isAtMin"
        @click="decreaseLarge"
        :title="`Decrease by ${largeStep}`"
      >
        ◄◄
      </button>
      <button 
        class="stepper-btn"
        :disabled="isAtMin"
        @click="decreaseSmall"
        :title="`Decrease by ${smallStep}`"
      >
        ◄
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
      />
      <button 
        class="stepper-btn"
        :disabled="isAtMax"
        @click="increaseSmall"
        :title="`Increase by ${smallStep}`"
      >
        ►
      </button>
      <button 
        class="stepper-btn"
        :disabled="isAtMax"
        @click="increaseLarge"
        :title="`Increase by ${largeStep}`"
      >
        ►►
      </button>
    </div>
    <div class="slider-row">
      <input
        type="range"
        class="value-slider"
        :value="modelValue"
        :min="min"
        :max="max"
        :step="step"
        @input="handleSliderInput"
      />
    </div>
    <div class="range-labels">
      <span>{{ min }}</span>
      <span>{{ max }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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

function decreaseLarge() {
  const newValue = snapToStep(props.modelValue - props.largeStep)
  emit('update:modelValue', clamp(newValue))
}

function increaseSmall() {
  const newValue = snapToStep(props.modelValue + props.smallStep)
  emit('update:modelValue', clamp(newValue))
}

function increaseLarge() {
  const newValue = snapToStep(props.modelValue + props.largeStep)
  emit('update:modelValue', clamp(newValue))
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = parseFloat(target.value)
  
  if (!isNaN(value)) {
    emit('update:modelValue', clamp(snapToStep(value)))
  }
}

function handleSliderInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = parseFloat(target.value)
  
  emit('update:modelValue', snapToStep(value))
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
</script>

<style scoped>
.value-control {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stepper-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
  cursor: pointer;
  font-size: 0.8125rem; /* 13px */
  font-family: 'Roboto Mono';
  transition: all 0.2s;
  min-width: 2.5rem;
}

.stepper-btn:hover:not(:disabled) {
  background: var(--color-background-soft);
  border-color: var(--color-border-hover);
}

.stepper-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.stepper-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.value-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.8125rem; /* 13px */
  font-family: 'Roboto Mono';
  text-align: center;
  min-width: 0;
}

.value-input:focus {
  outline: none;
  border-color: var(--color-border-hover);
}

.slider-row {
  display: flex;
  padding: 0 0.5rem;
}

.value-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
  background: var(--color-background-soft);
  outline: none;
}

.value-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-border-hover);
  cursor: pointer;
  transition: background 0.2s;
}

.value-slider::-webkit-slider-thumb:hover {
  background: var(--vt-c-text-1);
}

.value-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-border-hover);
  cursor: pointer;
  border: none;
  transition: background 0.2s;
}

.value-slider::-moz-range-thumb:hover {
  background: var(--vt-c-text-1);
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem; /* 13px */
  font-family: 'Roboto Mono';
  color: var(--color-text-muted);
  padding: 0 0.5rem;
}
</style>
