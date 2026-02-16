<template>
  <div class="value-control">
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
  font-size: 0.8125rem; /* 13px */
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
