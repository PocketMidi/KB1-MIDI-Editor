<template>
  <div class="settings-leverpush" :class="`lever-${lever}`">
    <!-- Toggle and Profile Selection -->
    <div class="controls-row">
      <!-- Momentary/Latch Toggle -->
      <div class="toggle-container">
        <img 
          :src="toggleImage" 
          alt="Mode Toggle"
          :title="toggleTooltip"
          class="toggle-image"
          @click="handleToggleClick"
          @mouseenter="toggleHovered = true"
          @mouseleave="toggleHovered = false"
        />
      </div>

      <!-- Profile Text Selection -->
      <div class="profile-selector">
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('lin') }"
          :disabled="isResetMode"
          @click="selectProfile('lin')"
          title="Linear"
        >
          Lin
        </button>
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('exp') }"
          :disabled="isResetMode"
          @click="selectProfile('exp')"
          title="Exponential"
        >
          Exp
        </button>
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('log') }"
          :disabled="isResetMode"
          @click="selectProfile('log')"
          title="Logarithmic"
        >
          Log
        </button>
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('pd') }"
          :disabled="isResetMode"
          @click="selectProfile('pd')"
          title="Peak & Decay"
        >
          P&D
        </button>
      </div>
    </div>

    <!-- Profile Visualization -->
    <div class="profile-visualization">
      <img :src="profileImage" alt="Profile Graph" />
    </div>

    <!-- Level Meter -->
    <LevelMeter 
      :min="userMin" 
      :max="userMax" 
      :is-bipolar="false"
      :mode="isResetMode ? 'reset' : 'range'"
      :value="resetValue"
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
        <label :for="`push-min-${lever}`">MIN</label>
        <ValueControl
          v-model="userMin"
          :min="minRange"
          :max="maxRange"
          :step="1"
          :small-step="5"
          :large-step="10"
          :disabled="isResetMode"
        />
      </div>
      <div class="input-divider"></div>

      <div class="group">
        <label :for="`push-max-${lever}`">MAX</label>
        <ValueControl
          v-model="userMax"
          :min="minRange"
          :max="maxRange"
          :step="1"
          :small-step="5"
          :large-step="10"
          :disabled="isResetMode"
        />
      </div>

      <!-- Duration control - visible only for Interpolated and Peak & Decay modes -->
      <template v-if="showTimingControls">
        <div class="duration-container">
          <!-- Duration Meter Visual (unipolar only - pink bar) -->
          <div class="duration-meter">
            <div class="meter-bar-container">
              <div class="meter-divider" :class="{ thick: !isMomentary }"></div>
              <div class="meter-bar-wrapper">
                <div class="meter-bar pink-bar-base"></div>
                <div 
                  class="meter-bar pink-bar-active"
                  :style="{ width: `${10 + ((duration - 100) / 1900) * 90}%` }"
                ></div>
                <div 
                  v-if="!isMomentary" 
                  class="latch-indicator-end"
                  :style="{ left: `${10 + ((duration - 100) / 1900) * 90}%` }"
                ></div>
              </div>
            </div>
          </div>

          <div class="group">
            <label :for="`push-duration-${lever}`">DURATION</label>
            <div class="value-control">
              <button 
                class="stepper-btn"
                :disabled="duration <= 100"
                @click="decreaseDuration"
                title="Decrease by 10ms"
              >
                ◀
              </button>
              <div class="duration-wrapper">
                <input 
                  type="number" 
                  :id="`push-duration-${lever}`" 
                  v-model.number="duration" 
                  min="100" 
                  max="2000" 
                  step="10"
                  class="duration-input"
                  @wheel="handleDurationWheel"
                  @mousedown="handleDurationMouseDown"
                  @touchstart="handleDurationTouchStart"
                  @touchmove="handleDurationTouchMove"
                  @touchend="handleDurationTouchEnd"
                /><span class="unit-label">ms</span>
              </div>
              <button 
                class="stepper-btn"
                :disabled="duration >= 2000"
                @click="increaseDuration"
                title="Increase by 10ms"
              >
                ▶
              </button>
            </div>
          </div>
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { type CCEntry } from '../data/ccMap'
import ValueControl from './ValueControl.vue'
import LevelMeter from './LevelMeter.vue'
import OptionWheelPicker from './OptionWheelPicker.vue'

const BASE_PATH = import.meta.env.BASE_URL || '/'

type ProfileType = 'lin' | 'exp' | 'log' | 'pd' | 'inc'

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
  (e: 'profileChanged', profileName: string): void
  (e: 'behaviourChanged', behaviourName: string): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

// Function mode constants
const FUNCTION_MODE_INTERPOLATED = 0
const FUNCTION_MODE_PEAK_DECAY = 1
const FUNCTION_MODE_RESET = 3

// Initialize selectedCategory from current ccNumber's category (fallback to first available category)
const initialCategory = computed(() => {
  const cat = props.ccMapByNumber.get(model.value.ccNumber)?.category
  return cat || props.categories[0] || 'Global'
})
const selectedCategory = ref<string>(initialCategory.value)
const categoryPickerOpen = ref(false)
const categoryTriggerRef = ref<HTMLElement | null>(null)

// Convert categories to dropdown options, adding Reset at the end
const categoryOptions = computed(() => {
  const cats = props.categories.map(cat => ({ label: cat, value: cat }))
  cats.push({ label: 'Reset', value: 'Reset' })
  return cats
})

// Parameter wheel picker state
const parameterPickerOpen = ref(false)
const parameterTriggerRef = ref<HTMLElement | null>(null)

// Get selected parameter label
const selectedParameterLabel = computed(() => {
  const option = filteredOptions.value.find(opt => opt.value === model.value.ccNumber)
  return option?.label || 'None'
})

// Watch for ccMapByNumber changes to initialize category when map loads
watch(() => props.ccMapByNumber.size, () => {
  const cat = props.ccMapByNumber.get(model.value.ccNumber)?.category
  if (cat && cat !== selectedCategory.value) {
    selectedCategory.value = cat
  }
}, { immediate: true })

// Filter options by selected category
const filteredOptions = computed(() => {
  // Special case: Reset category shows all CC options
  if (selectedCategory.value === 'Reset') {
    return props.ccOptions
  }
  
  const list = props.ccOptions.filter(opt => opt.group === selectedCategory.value)
  const none = props.ccOptions.find(o => o.value === -1)
  return none ? [none, ...list] : list
})

// Watch ccNumber to keep Category in sync
watch(() => model.value.ccNumber, (cc) => {
  // Don't override if we're in Reset mode
  if (model.value.functionMode === FUNCTION_MODE_RESET) return
  
  const cat = props.ccMapByNumber.get(cc)?.category
  if (cat && cat !== 'Reset') selectedCategory.value = cat
})

// Watch selectedCategory to handle Reset mode and parameter selection
watch(selectedCategory, (cat) => {
  // Special case: Reset category sets functionMode to Reset
  if (cat === 'Reset') {
    model.value.functionMode = FUNCTION_MODE_RESET
    // Keep current parameter selection
    return
  }
  
  // If we were in Reset mode, exit it when selecting another category
  if (model.value.functionMode === FUNCTION_MODE_RESET) {
    model.value.functionMode = FUNCTION_MODE_INTERPOLATED
  }
  
  // If "None" is selected, keep it
  if (model.value.ccNumber === -1) return
  
  const ok = props.ccMapByNumber.get(model.value.ccNumber)?.category === cat
  if (!ok) {
    const first = filteredOptions.value.find(o => o.value >= 0)
    if (first) model.value.ccNumber = first.value
  }
})

// Watch functionMode to sync category when Reset mode is set externally
watch(() => model.value.functionMode, (mode) => {
  if (mode === FUNCTION_MODE_RESET && selectedCategory.value !== 'Reset') {
    selectedCategory.value = 'Reset'
  } else if (mode !== FUNCTION_MODE_RESET && selectedCategory.value === 'Reset') {
    // Exit Reset category if mode changed
    const cat = props.ccMapByNumber.get(model.value.ccNumber)?.category
    if (cat) selectedCategory.value = cat
    else selectedCategory.value = props.categories[0] || 'Global'
  }
})

// Momentary/Latch Toggle (using offset time: 0 = momentary, >0 = latched)
const isMomentary = computed(() => model.value.offsetTime === 0)
const toggleHovered = ref(false)

const toggleImage = computed(() => {
  const mode = isMomentary.value ? 'l' : 'r'
  
  if (toggleHovered.value) {
    return `${BASE_PATH}mom_lat_toggle/${mode}_flot.svg`
  }
  return `${BASE_PATH}mom_lat_toggle/${mode}_activ.svg`
})

const toggleTooltip = computed(() => 
  isMomentary.value ? 'Momentary (Click for Latched)' : 'Latched (Click for Momentary)'
)

function handleToggleClick() {
  // Toggle between momentary (offsetTime=0) and latched (offsetTime=same as onsetTime)
  if (isMomentary.value) {
    // Switch to latched - set offsetTime to match onsetTime
    // If onsetTime is 0, use a sensible default (100ms)
    const timeValue = model.value.onsetTime || 100
    model.value.onsetTime = timeValue
    model.value.offsetTime = timeValue
    emit('behaviourChanged', 'Latched')
  } else {
    // Switch to momentary - set offsetTime to 0
    model.value.offsetTime = 0
    emit('behaviourChanged', 'Momentary')
  }
}

// Profile selection 
const isProfileActive = (profile: ProfileType) => {
  if (profile === 'inc') {
    return model.value.functionMode === 2 // STATIC
  } else if (profile === 'pd') {
    return model.value.functionMode === 1 // PEAK_DECAY
  } else if (model.value.functionMode === 0) { // INTERPOLATED
    if (model.value.onsetType === 1) return profile === 'exp'
    if (model.value.onsetType === 2) return profile === 'log'
    return profile === 'lin'
  }
  return false
}

// Active profile name (full description)
const activeProfileName = computed(() => {
  if (model.value.functionMode === 3) {
    return 'Reset'
  } else if (model.value.functionMode === 2) {
    return 'Static'
  } else if (model.value.functionMode === 1) {
    return 'Peak & Decay'
  } else if (model.value.functionMode === 0) {
    if (model.value.onsetType === 1) return 'Exponential'
    if (model.value.onsetType === 2) return 'Logarithmic'
    return 'Linear'
  }
  return 'Linear'
})

const selectProfile = (profile: ProfileType) => {
  if (profile === 'inc') {
    model.value.functionMode = 2 // STATIC
  } else if (profile === 'pd') {
    model.value.functionMode = 1 // PEAK_DECAY
  } else {
    model.value.functionMode = 0 // INTERPOLATED
    
    // Set onsetType and offsetType based on profile
    if (profile === 'exp') {
      model.value.onsetType = 1
      model.value.offsetType = 1
    } else if (profile === 'log') {
      model.value.onsetType = 2
      model.value.offsetType = 2
    } else {
      // lin
      model.value.onsetType = 0
      model.value.offsetType = 0
    }
  }
  
  // Emit profile change event
  emit('profileChanged', activeProfileName.value)
}

// Profile visualization
const profileImage = computed(() => {
  let profile = 'lin' // default
  
  if (model.value.functionMode === 3) {
    // Reset mode - show reset.svg
    return `${BASE_PATH}lever_profiles/reset.svg`
  } else if (model.value.functionMode === 2) {
    profile = 'inc'
  } else if (model.value.functionMode === 1) {
    profile = 'pd'
  } else if (model.value.functionMode === 0) {
    // Interpolated mode - check type
    if (model.value.onsetType === 1) profile = 'exp'
    else if (model.value.onsetType === 2) profile = 'log'
    else profile = 'lin'
  }
  
  // Push profile SVG files use _p suffix
  return `${BASE_PATH}lever_profiles/${profile}_p.svg`
})

// Computed properties to determine which controls to show
const isResetMode = computed(() => model.value.functionMode === FUNCTION_MODE_RESET)
const showTimingControls = computed(() => {
  return model.value.functionMode === FUNCTION_MODE_INTERPOLATED || model.value.functionMode === FUNCTION_MODE_PEAK_DECAY
})

// Min/max range (always unipolar for Press)
const minRange = 0
const maxRange = 100

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
    // Only update offsetTime if we're in latched mode (offsetTime > 0)
    if (model.value.offsetTime > 0) {
      model.value.offsetTime = value
    }
  }
})

// Touch tracking for duration input
const durationDragging = ref(false)
const durationDragStartX = ref(0)
const durationDragStartValue = ref(0)

// Mouse wheel scroll for duration
function handleDurationWheel(event: WheelEvent) {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -10 : 10
  const newValue = Math.max(100, Math.min(2000, duration.value + delta))
  duration.value = newValue
}

// Mouse drag support for duration
function handleDurationMouseDown(event: MouseEvent) {
  event.preventDefault()
  durationDragging.value = true
  durationDragStartX.value = event.clientX
  durationDragStartValue.value = duration.value
  
  document.addEventListener('mousemove', handleDurationMouseMove)
  document.addEventListener('mouseup', handleDurationMouseUp)
}

function handleDurationMouseMove(event: MouseEvent) {
  if (!durationDragging.value) return
  
  const deltaX = event.clientX - durationDragStartX.value
  // Scale: 2 pixels of movement = 10ms change
  const change = Math.round(deltaX / 2) * 10
  const newValue = Math.max(100, Math.min(2000, durationDragStartValue.value + change))
  duration.value = newValue
}

function handleDurationMouseUp() {
  durationDragging.value = false
  document.removeEventListener('mousemove', handleDurationMouseMove)
  document.removeEventListener('mouseup', handleDurationMouseUp)
}

// Touch gesture support for duration (horizontal drag)
function handleDurationTouchStart(event: TouchEvent) {
  if (!event.touches[0]) return
  durationDragging.value = true
  durationDragStartX.value = event.touches[0].clientX
  durationDragStartValue.value = duration.value
}

function handleDurationTouchMove(event: TouchEvent) {
  if (!durationDragging.value || !event.touches[0]) return
  event.preventDefault()
  
  const deltaX = event.touches[0].clientX - durationDragStartX.value
  // Scale: 2 pixels of movement = 10ms change
  const change = Math.round(deltaX / 2) * 10
  const newValue = Math.max(100, Math.min(2000, durationDragStartValue.value + change))
  duration.value = newValue
}

function handleDurationTouchEnd() {
  durationDragging.value = false
}

// Arrow button functions for duration
function decreaseDuration() {
  const newValue = Math.max(100, duration.value - 10)
  duration.value = newValue
}

function increaseDuration() {
  const newValue = Math.min(2000, duration.value + 10)
  duration.value = newValue
}

// Cleanup duration drag event listeners on unmount
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleDurationMouseMove)
  document.removeEventListener('mouseup', handleDurationMouseUp)
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
  overflow: visible; /* Allow dropdowns to extend beyond bounds */
  position: relative; /* For popup positioning */
}

@media (max-width: 768px) {
  .settings-leverpush {
    padding: 0.75rem;
  }
}

.controls-row {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  flex-wrap: nowrap;
}

.toggle-container {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-right: 1rem;
}

.toggle-image {
  display: block;
  height: 22px;
  width: auto;
  cursor: pointer;
  transition: opacity 0.3s ease-in-out;
}

.toggle-image:hover {
  opacity: 0.85;
}

.profile-selector {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex-shrink: 1;
}

.profile-btn {
  background: none;
  border: none;
  padding: 0.5rem 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #848484;
  cursor: pointer;
  position: relative;
  transition: color 0.2s ease;
  font-family: 'Roboto Mono';
}

.profile-btn:hover:not(:disabled) {
  color: #CDCDCD;
}

.profile-btn:disabled {
  color: #4A4A4A;
  cursor: not-allowed;
  opacity: 0.5;
}

.profile-btn.active {
  color: #CDCDCD;
}

.profile-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #CDCDCD;
}

.profile-visualization {
  margin: 0.5rem 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: auto;
}

.profile-visualization img {
  width: 100%;
  height: auto;
  display: block;
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

/* Duration Container with border */
.duration-container {
  border: 1px solid var(--color-divider);
  border-radius: 6px;
  padding: 0.5rem 1rem;
  margin-top: 0.5rem;
  margin-left: -1rem;
  margin-right: -1rem;
}

.duration-container .group {
  padding: 0.35rem 0 0.5rem 0;
}

/* Duration Meter Styles */
.duration-meter {
  width: 100%;
  padding: 0.5rem 0 0.35rem 0;
}

.meter-bar-container {
  display: flex;
  align-items: center;
  gap: 0;
  height: 9px;
  width: 100%;
}

.meter-bar-wrapper {
  position: relative;
  height: 9px;
  flex: 1;
  border-radius: 4.5px;
  overflow: visible;
}

.meter-bar {
  height: 9px;
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 4.5px;
}

/* Base bar at 40% opacity */
.pink-bar-base {
  width: 100%;
  background: #1F498E;
  opacity: 0.4;
}

/* Active bar at 100% opacity */
.pink-bar-active {
  background: #1F498E;
  opacity: 1;
  z-index: 1;
}

.meter-divider {
  width: 2px;
  height: 17px;
  background: #FFA500;
  flex-shrink: 0;
}

.meter-divider.thick {
  width: 5px;
}

.latch-indicator {
  width: 2px;
  height: 17px;
  background: #F9AC20;
  flex-shrink: 0;
  margin-left: 4px;
}

.latch-indicator-end {
  position: absolute;
  top: -4px;
  width: 5px;
  height: 17px;
  background: #F9AC20;
  z-index: 2;
}

.duration-wrapper {
  display: flex;
  align-items: center;
  gap: 0; /* No gap */
}

.duration-input {
  width: 75px;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  color: #EAEAEA;
  font-size: 0.8125rem;
  font-family: 'Roboto Mono';
  font-weight: 400;
  text-align: right; /* Right-align to be flush with unit */
  cursor: ew-resize !important;
  touch-action: none;
  user-select: none;
  /* Aggressive iOS Safari number input suppression */
  -webkit-appearance: none !important;
  -moz-appearance: textfield !important;
  appearance: none !important;
}

.duration-input::-webkit-textfield-decoration-container {
  display: none !important;
}

.duration-input::-webkit-contacts-auto-fill-button,
.duration-input::-webkit-credentials-auto-fill-button {
  display: none !important;
}

.duration-input:focus {
  outline: none;
}

/* Hide number input spinners for duration */
.duration-input::-webkit-inner-spin-button,
.duration-input::-webkit-outer-spin-button {
  -webkit-appearance: none !important;
  appearance: none !important;
  margin: 0 !important;
  display: none !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

.duration-input[type=number] {
  -moz-appearance: textfield !important;
  appearance: none !important;
  -webkit-appearance: none !important;
}

.unit-label {
  font-size: 0.8125rem;
  color: #EAEAEA;
  font-family: 'Roboto Mono';
  font-weight: 400;
}

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
  /* Aggressive iOS Safari number input suppression */
  -webkit-appearance: none !important;
  -moz-appearance: textfield !important;
  appearance: none !important;
}

.number-with-unit input::-webkit-textfield-decoration-container {
  display: none !important;
}

.number-with-unit input::-webkit-contacts-auto-fill-button,
.number-with-unit input::-webkit-credentials-auto-fill-button {
  display: none !important;
}

.number-with-unit input:focus {
  outline: none;
}

/* Hide number input spinners */
.number-with-unit input::-webkit-inner-spin-button,
.number-with-unit input::-webkit-outer-spin-button {
  -webkit-appearance: none !important;
  appearance: none !important;
  margin: 0 !important;
  display: none !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

.number-with-unit input[type=number] {
  -moz-appearance: textfield !important;
  appearance: none !important;
  -webkit-appearance: none !important;
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

/* CustomDropdown right-justification */
.group :deep(.custom-dropdown) {
  flex: 1;
}

.group :deep(.dropdown-label) {
  text-align: right;
}
</style>