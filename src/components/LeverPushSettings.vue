<template>
  <div class="settings-leverpush" :class="`lever-${lever}`">
    <div class="inputs">
      <div class="group">
        <label :for="`push-category-${lever}`">CATEGORY</label>
        <select :id="`push-category-${lever}`" v-model="selectedCategory">
          <option v-for="cat in props.categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
      <div class="input-divider"></div>

      <div class="group">
        <label :for="`push-ccNumber-${lever}`">PARAMETER</label>
        <select :id="`push-ccNumber-${lever}`" v-model.number="model.ccNumber">
          <option v-for="opt in filteredOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
      <div class="input-divider"></div>

      <div class="group">
        <label :for="`push-functionMode-${lever}`">PROFILE</label>
        <select :id="`push-functionMode-${lever}`" v-model.number="model.functionMode">
          <option v-for="opt in functionModes" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <!-- Min control - visible only for Interpolated and Peak & Decay modes -->
      <template v-if="showValueControls">
        <div class="input-divider"></div>
        <div class="group">
          <label :for="`push-max-${lever}`">MAX</label>
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
          <label :for="`push-min-${lever}`">MIN</label>
          <ValueControl
            v-model="userMin"
            :min="0"
            :max="100"
            :step="1"
            :small-step="5"
            :large-step="10"
          />
        </div>
      </template>

      <!-- Duration control - visible only for Interpolated and Peak & Decay modes -->
      <template v-if="showTimingControls">
        <div class="input-divider"></div>
        <div class="group">
          <label :for="`push-duration-${lever}`">DURATION</label>
          <div class="number-with-unit">
            <input type="number" :id="`push-duration-${lever}`" v-model.number="duration" min="0" max="10000" step="10" />
            <span>ms</span>
          </div>
        </div>
        <div class="input-divider"></div>
        <div class="group">
          <label :for="`push-type-${lever}`">TYPE</label>
          <select :id="`push-type-${lever}`" v-model.number="pressType">
            <option v-for="opt in interpolations" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
      </template>

      <!-- Reset Value control - visible only for Reset mode -->
      <template v-if="isResetMode">
        <div class="input-divider"></div>
        <div class="group">
          <label :for="`push-reset-value-${lever}`">RESET VALUE</label>
          <ValueControl
            v-model="resetValue"
            :min="5"
            :max="100"
            :step="5"
            :small-step="5"
            :large-step="10"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { type CCEntry } from '../data/ccMap'
import ValueControl from './ValueControl.vue'

type LeverPushModel = {
  ccNumber: number
  minCCValue: number
  maxCCValue: number
  functionMode: number
  onsetTime: number
  offsetTime: number
  onsetType: number
  offsetType: number
}

const props = defineProps<{
  title?: string
  lever: number
  modelValue: LeverPushModel
  ccOptions: Array<{ value: number; label: string; group?: string }>
  ccMapByNumber: Map<number, CCEntry>
  categories: string[]
  functionModes: { value: number, label: string }[]
  interpolations: { value: number, label: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: LeverPushModel): void
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

// Watch for ccMapByNumber changes to initialize category when map loads
watch(() => props.ccMapByNumber.size, () => {
  const cat = props.ccMapByNumber.get(model.value.ccNumber)?.category
  if (cat && cat !== selectedCategory.value) {
    selectedCategory.value = cat
  }
}, { immediate: true })

// Filter options by selected category
const filteredOptions = computed(() => {
  const list = props.ccOptions.filter(opt => opt.group === selectedCategory.value)
  const none = props.ccOptions.find(o => o.value === -1)
  return none ? [none, ...list] : list
})

// Watch ccNumber to keep Category in sync
watch(() => model.value.ccNumber, (cc) => {
  const cat = props.ccMapByNumber.get(cc)?.category
  if (cat) selectedCategory.value = cat
})

// Watch selectedCategory to ensure a valid parameter is selected
watch(selectedCategory, (cat) => {
  // If "None" is selected, keep it
  if (model.value.ccNumber === -1) return
  
  const ok = props.ccMapByNumber.get(model.value.ccNumber)?.category === cat
  if (!ok) {
    const first = filteredOptions.value.find(o => o.value >= 0)
    if (first) model.value.ccNumber = first.value
  }
})

// Function mode constants
const FUNCTION_MODE_INTERPOLATED = 0
const FUNCTION_MODE_PEAK_DECAY = 1
const FUNCTION_MODE_RESET = 3

// Computed properties to determine which controls to show
const isResetMode = computed(() => model.value.functionMode === FUNCTION_MODE_RESET)
const showTimingControls = computed(() => {
  return model.value.functionMode === FUNCTION_MODE_INTERPOLATED || model.value.functionMode === FUNCTION_MODE_PEAK_DECAY
})
const showValueControls = computed(() => {
  return model.value.functionMode === FUNCTION_MODE_INTERPOLATED || model.value.functionMode === FUNCTION_MODE_PEAK_DECAY
})

// Conversion functions
function unipolarToMidi(userValue: number): number {
  return Math.round((userValue / 100) * 127)
}

function midiToUnipolar(midiValue: number): number {
  return Math.round((midiValue / 127) * 100)
}

// User-facing Min value (0-100, always unipolar for Press)
const userMin = computed({
  get: () => midiToUnipolar(model.value.minCCValue),
  set: (userValue: number) => {
    model.value.minCCValue = unipolarToMidi(userValue)
  }
})

// User-facing Max value (0-100, always unipolar for Press)
const userMax = computed({
  get: () => midiToUnipolar(model.value.maxCCValue),
  set: (userValue: number) => {
    model.value.maxCCValue = unipolarToMidi(userValue)
  }
})

// Reset Value (5-100 in increments of 5, default 70)
// In Reset mode, minCCValue stores the reset value, maxCCValue is set to the same
const resetValue = computed({
  get: () => {
    return midiToUnipolar(model.value.minCCValue)
  },
  set: (userValue: number) => {
    const midiValue = unipolarToMidi(userValue)
    model.value.minCCValue = midiValue
    model.value.maxCCValue = midiValue
  }
})

// Computed property to gang both onset and offset times as "Duration"
const duration = computed({
  get: () => model.value.onsetTime,
  set: (value: number) => {
    model.value.onsetTime = value
    model.value.offsetTime = value
  }
})

// Computed property to gang both onset and offset types as "Type"
const pressType = computed({
  get: () => model.value.onsetType,
  set: (value: number) => {
    model.value.onsetType = value
    model.value.offsetType = value
  }
})
</script>

<style scoped>
.settings-leverpush {
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
  .settings-leverpush {
    padding: 0.75rem;
  }
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

.group input,
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
}

.group select {
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

.group input:focus,
.group select:focus {
  outline: none;
}

.number-with-unit {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
  flex: 1;
}

.number-with-unit input {
  width: 60px;
  padding: 0;
  border: none;
  background: transparent;
  color: #EAEAEA;
  font-size: 0.8125rem;
  font-family: 'Roboto Mono';
  font-weight: 400;
  text-align: right;
}

.number-with-unit input:focus {
  outline: none;
}

/* Hide number input spinners */
.number-with-unit input::-webkit-inner-spin-button,
.number-with-unit input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.number-with-unit input[type=number] {
  -moz-appearance: textfield;
}

.number-with-unit span {
  font-size: 0.8125rem; /* 13px */
  color: #EAEAEA;
  font-family: 'Roboto Mono';
  font-weight: 400;
}

.readonly-field {
  background: var(--color-background-mute) !important;
  cursor: not-allowed;
  color: var(--color-text-muted);
}
</style>