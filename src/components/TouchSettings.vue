<template>
  <div class="settings-touch">
    <!-- Level Meter -->
    <LevelMeter 
      :min="userMin" 
      :max="userMax" 
      :is-bipolar="false"
      mode="range"
    />

    <div class="inputs">
      <div class="group">
        <label>CATEGORY</label>
        <button 
          ref="categoryTriggerRef"
          class="picker-trigger"
          :class="{ 'picker-open': categoryPickerOpen }"
          @click="categoryPickerOpen = true"
        >
          {{ selectedCategory }}
        </button>
      </div>
      <div class="input-divider"></div>

      <div class="group">
        <label>PARAMETER</label>
        <button 
          ref="parameterTriggerRef"
          class="picker-trigger"
          :class="{ 'picker-open': parameterPickerOpen }"
          @click="parameterPickerOpen = true"
        >
          {{ selectedParameterLabel }}
        </button>
      </div>
      <div class="input-divider"></div>

      <div class="group">
        <label>MODE</label>
        <button 
          ref="modeTriggerRef"
          class="picker-trigger"
          :class="{ 'picker-open': modePickerOpen }"
          @click="modePickerOpen = true"
        >
          {{ selectedModeLabel }}
        </button>
      </div>
      <div class="input-divider"></div>

      <div class="group">
        <label for="touch-min">MIN</label>
        <ValueControl
          v-model="userMin"
          :min="0"
          :max="100"
          :step="1"
          :small-step="5"
          :large-step="10"
        />
      </div>
      <div class="input-divider"></div>

      <div class="group">
        <label for="touch-max">MAX</label>
        <ValueControl
          v-model="userMax"
          :min="0"
          :max="100"
          :step="1"
          :small-step="5"
          :large-step="10"
        />
      </div>
      <div class="input-divider"></div>

      <div class="group">
        <label for="touch-threshold">THRESHOLD</label>
        <ValueControl
          v-model="userThreshold"
          :min="0"
          :max="100"
          :step="1"
          :small-step="5"
          :large-step="10"
        />
      </div>
      <div class="hint-text">Sensitivity: 0 = most sensitive, 100 = least sensitive</div>
    </div>

    <!-- Category Wheel Picker Modal -->
    <OptionWheelPicker
      v-model="selectedCategory"
      v-model:isOpen="categoryPickerOpen"
      :options="categoryOptions"
      :trigger-el="categoryTriggerRef"
    />

    <!-- Parameter Wheel Picker Modal -->
    <OptionWheelPicker
      v-model="model.ccNumber"
      v-model:isOpen="parameterPickerOpen"
      :options="filteredOptions"
      :trigger-el="parameterTriggerRef"
    />

    <!-- Mode Wheel Picker Modal -->
    <OptionWheelPicker
      v-model="model.functionMode"
      v-model:isOpen="modePickerOpen"
      :options="functionModes"
      :trigger-el="modeTriggerRef"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { type CCEntry } from '../data/ccMap'
import ValueControl from './ValueControl.vue'
import LevelMeter from './LevelMeter.vue'
import OptionWheelPicker from './OptionWheelPicker.vue'

type TouchModel = {
  ccNumber: number
  minCCValue: number
  maxCCValue: number
  functionMode: number
  threshold?: number
}

const props = defineProps<{
  title?: string
  modelValue: TouchModel
  ccOptions: Array<{ value: number; label: string; group?: string }>
  ccMapByNumber: Map<number, CCEntry>
  categories: string[]
  functionModes: { value: number, label: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: TouchModel): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

// Initialize selectedCategory from current ccNumber's category (fallback to first available category)
const initialCategory = computed(() => {
  const cat = props.ccMapByNumber.get(model.value.ccNumber)?.category
  return cat || props.categories[0] || 'Global'
})
const selectedCategory = ref<string>(initialCategory.value)

const categoryOptions = computed(() => {
  return props.categories.map(cat => ({ label: cat, value: cat }))
})

// Wheel picker state
const categoryPickerOpen = ref(false)
const categoryTriggerRef = ref<HTMLElement | null>(null)
const parameterPickerOpen = ref(false)
const parameterTriggerRef = ref<HTMLElement | null>(null)
const modePickerOpen = ref(false)
const modeTriggerRef = ref<HTMLElement | null>(null)

// Get selected labels
const selectedParameterLabel = computed(() => {
  const option = filteredOptions.value.find(opt => opt.value === model.value.ccNumber)
  return option?.label || 'None'
})

const selectedModeLabel = computed(() => {
  const mode = props.functionModes.find(m => m.value === model.value.functionMode)
  return mode?.label || 'Unknown'
})

// Flag to prevent infinite watch loops
const isUpdatingInternally = ref(false)

// Watch for ccMapByNumber changes to initialize category when map loads
watch(() => props.ccMapByNumber.size, () => {
  if (isUpdatingInternally.value) return
  isUpdatingInternally.value = true
  const cat = props.ccMapByNumber.get(model.value.ccNumber)?.category
  if (cat && cat !== selectedCategory.value) {
    selectedCategory.value = cat
  }
  isUpdatingInternally.value = false
}, { immediate: true })

// Filter options by selected category
const filteredOptions = computed(() => {
  const list = props.ccOptions.filter(opt => opt.group === selectedCategory.value)
  const none = props.ccOptions.find(o => o.value === -1)
  return none ? [none, ...list] : list
})

// Watch ccNumber to keep Category in sync
watch(() => model.value.ccNumber, (cc) => {
  if (isUpdatingInternally.value) return
  isUpdatingInternally.value = true
  const cat = props.ccMapByNumber.get(cc)?.category
  if (cat) selectedCategory.value = cat
  isUpdatingInternally.value = false
})

// Watch selectedCategory to ensure a valid parameter is selected
watch(selectedCategory, (cat) => {
  if (isUpdatingInternally.value) return
  isUpdatingInternally.value = true
  
  // If "None" is selected, keep it
  if (model.value.ccNumber === -1) {
    isUpdatingInternally.value = false
    return
  }
  
  const ok = props.ccMapByNumber.get(model.value.ccNumber)?.category === cat
  if (!ok) {
    const first = filteredOptions.value.find(o => o.value >= 0)
    if (first) model.value.ccNumber = first.value
  }
  isUpdatingInternally.value = false
})

// Conversion functions
function unipolarToMidi(userValue: number): number {
  return Math.round((userValue / 100) * 127)
}

function midiToUnipolar(midiValue: number): number {
  return Math.round((midiValue / 127) * 100)
}

// User-facing Min value (0-100, always unipolar for Touch)
const userMin = computed({
  get: () => midiToUnipolar(model.value.minCCValue),
  set: (userValue: number) => {
    model.value.minCCValue = unipolarToMidi(userValue)
  }
})

// User-facing Max value (0-100, always unipolar for Touch)
const userMax = computed({
  get: () => midiToUnipolar(model.value.maxCCValue),
  set: (userValue: number) => {
    model.value.maxCCValue = unipolarToMidi(userValue)
  }
})

// Threshold range in firmware (based on typical capacitive touch sensor values)
const THRESHOLD_MIN = 24000
const THRESHOLD_MAX = 64000

// User-facing Threshold (0-100 percentage)
const userThreshold = computed({
  get: () => {
    const threshold = model.value.threshold ?? THRESHOLD_MIN
    // Convert from firmware range to 0-100 percentage
    // Note: Higher firmware value = less sensitive, so we map accordingly
    return Math.round(((threshold - THRESHOLD_MIN) / (THRESHOLD_MAX - THRESHOLD_MIN)) * 100)
  },
  set: (userValue: number) => {
    // Convert from 0-100 percentage to firmware range
    model.value.threshold = Math.round((userValue / 100) * (THRESHOLD_MAX - THRESHOLD_MIN) + THRESHOLD_MIN)
  }
})
</script>

<style scoped>
.settings-touch {
  padding: 1rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-family: 'Roboto Mono';
  font-size: 0.8125rem; /* 13px */
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

@media (max-width: 768px) {
  .settings-touch {
    padding: 0.75rem;
  }
  
  .title {
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
  }
}

.title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.title h2 {
  margin: 0;
  font-size: 0.8125rem; /* 13px */
  font-weight: 600;
  font-family: 'Roboto Mono';
}

.parameter-header {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  font-size: 0.8125rem; /* 13px */
  font-family: 'Roboto Mono';
}

.parameter-name {
  font-weight: 600;
  color: var(--color-text);
}

.parameter-range {
  color: var(--color-text-muted);
  font-style: italic;
}

.cc-reference {
  color: var(--color-text-muted);
  font-size: 0.8125rem; /* 13px */
  font-family: 'Roboto Mono';
}

.inputs {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.input-divider {
  height: 1px;
  background: var(--color-divider);
  width: 100%;
}

.group {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  gap: 1rem;
}

.group label {
  font-weight: 400;
  font-size: 0.8125rem; /* 13px */
  color: #848484;
  font-family: 'Roboto Mono';
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
  min-width: 120px;
}

.picker-trigger {
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 0;
  background: transparent;
  color: #EAEAEA;
  font-size: 0.8125rem; /* 13px */
  font-family: 'Roboto Mono';
  font-weight: 400;
  flex: 1;
  text-align: right;
  cursor: pointer;
  transition: background 0.2s ease;
}

.picker-trigger:hover {
  background: rgba(234, 234, 234, 0.05);
}

.picker-trigger.picker-open {
  color: transparent;
}

.group select {
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 0;
  background: transparent;
  color: #EAEAEA;
  font-size: 0.8125rem; /* 13px */
  font-family: 'Roboto Mono';
  font-weight: 400;
  flex: 1;
  text-align: right;
  appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23EAEAEA' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1rem;
  padding-right: 2rem;
}

.group option {
  background: var(--color-background);
  color: #EAEAEA;
  font-family: 'Roboto Mono';
  font-weight: 400;
  font-size: 0.8125rem;
}

.group select:focus {
  outline: none;
}

.hint-text {
  font-size: 0.8125rem; /* 13px */
  font-style: italic;
  color: var(--color-text-muted);
  padding: 0.5rem 0 1rem 0;
  font-family: 'Roboto Mono';
}
</style>