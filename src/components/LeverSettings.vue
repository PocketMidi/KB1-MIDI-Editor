<template>
  <div class="settings-lever" :class="`lever-${lever}`">
    <!-- Toggle and Profile Selection -->
    <div class="controls-row">
      <!-- Unipolar/Bipolar Toggle -->
      <div class="toggle-container">
        <img 
          :src="toggleImage" 
          alt="Polarity Toggle"
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
          @click="selectProfile('lin')"
          title="Linear"
        >
          Lin
        </button>
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('exp') }"
          @click="selectProfile('exp')"
          title="Exponential"
        >
          Exp
        </button>
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('log') }"
          @click="selectProfile('log')"
          title="Logarithmic"
        >
          Log
        </button>
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('pd') }"
          @click="selectProfile('pd')"
          title="Peak & Decay"
        >
          P&D
        </button>
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('inc') }"
          @click="selectProfile('inc')"
          title="Incremental"
        >
          Inc
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
      :is-bipolar="model.valueMode === 1"
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
        <CustomDropdown
          v-model="model.ccNumber"
          :options="filteredOptions"
        />
      </div>
      <div class="input-divider"></div>

      <div class="group">
        <label :for="`lever-min-${lever}`">MIN</label>
        <ValueControl
          v-model="userMin"
          :min="minRange"
          :max="maxRange"
          :step="1"
          :small-step="5"
          :large-step="10"
        />
      </div>
      <div class="input-divider"></div>

      <div class="group">
        <label :for="`lever-max-${lever}`">MAX</label>
        <ValueControl
          v-model="userMax"
          :min="minRange"
          :max="maxRange"
          :step="1"
          :small-step="5"
          :large-step="10"
        />
      </div>

      <!-- Duration for non-incremental modes, Steps for incremental mode -->
      <template v-if="!isIncrementalMode">
        <div class="duration-container">
          <!-- Duration Meter Visual -->
          <div class="duration-meter">
            <div class="meter-bar-container">
              <!-- Bipolar mode: blue and pink bars -->
              <template v-if="model.valueMode === 1">
                <div class="meter-bar-wrapper">
                  <div class="meter-bar blue-bar-base"></div>
                  <div 
                    class="meter-bar blue-bar-active"
                    :style="{ width: `${10 + ((duration - 100) / 1900) * 90}%` }"
                  ></div>
                </div>
                <div class="meter-divider"></div>
                <div class="meter-bar-wrapper">
                  <div class="meter-bar pink-bar-base"></div>
                  <div 
                    class="meter-bar pink-bar-active"
                    :style="{ width: `${10 + ((duration - 100) / 1900) * 90}%` }"
                  ></div>
                </div>
              </template>
              <!-- Unipolar mode: only pink bar -->
              <template v-else>
                <div class="meter-divider"></div>
                <div class="meter-bar-wrapper">
                  <div class="meter-bar pink-bar-base"></div>
                  <div 
                    class="meter-bar pink-bar-active"
                    :style="{ width: `${10 + ((duration - 100) / 1900) * 90}%` }"
                  ></div>
                </div>
              </template>
            </div>
          </div>

          <div class="group">
            <label :for="`lever-duration-${lever}`">DURATION</label>
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
                :id="`lever-duration-${lever}`" 
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

      <!-- Steps for Incremental mode -->
      <template v-else>
        <div class="group">
          <label :for="`lever-steps-${lever}`">STEPS</label>
          <div class="value-control">
            <button 
              class="stepper-btn"
              :disabled="isStepsAtMin"
              @click="decreaseSteps"
              title="Previous step value"
            >
              ◀
            </button>
            <div 
              class="draggable-value-inline"
              @mousedown="handleStepsMouseDown"
              @touchstart="handleStepsTouchStart"
              @touchmove="handleStepsTouchMove"
              @touchend="handleStepsTouchEnd"
              @wheel="handleStepsWheel"
            >
              {{ stepsValue }}
            </div>
            <button 
              class="stepper-btn"
              :disabled="isStepsAtMax"
              @click="increaseSteps"
              title="Next step value"
            >
              ▶
            </button>
          </div>
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { type CCEntry } from '../data/ccMap'
import ValueControl from './ValueControl.vue'
import LevelMeter from './LevelMeter.vue'
import CustomDropdown from './CustomDropdown.vue'
import OptionWheelPicker from './OptionWheelPicker.vue'

type LeverModel = {
  ccNumber: number
  minCCValue: number
  maxCCValue: number
  stepSize: number
  functionMode: number
  valueMode: number
  onsetTime: number
  offsetTime: number
  onsetType: number
  offsetType: number
}

const props = defineProps<{
  title?: string
  lever: number
  modelValue: LeverModel
  ccOptions: Array<{ value: number; label: string; group?: string }>
  ccMapByNumber: Map<number, CCEntry>
  categories: string[]
  functionModes: { value: number, label: string }[]
  valueModes: { value: number, label: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: LeverModel): void
  (e: 'profileChanged', profileName: string): void
  (e: 'valueModeChanged', modeName: string): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

// Constants
const BASE_PATH = '/KB1-config'
const TOGGLE_ANIMATION_DURATION = 60 // milliseconds for toggle transition

// Toggle state and animation
// toggleHovered: tracks hover state for visual feedback (shows float state)
// isAnimating: prevents rapid toggle clicks during transition animation
// transitionDirection: tracks the direction of transition ('left-to-right' or 'right-to-left')
const toggleHovered = ref(false)
const isAnimating = ref(false)
const animationTimeoutId = ref<number | null>(null)
const transitionDirection = ref<'left-to-right' | 'right-to-left' | null>(null)

const toggleImage = computed(() => {
  const isUnipolar = model.value.valueMode === 0
  
  if (isAnimating.value && transitionDirection.value) {
    // During animation, show transition frames based on direction
    return transitionDirection.value === 'left-to-right'
      ? `${BASE_PATH}/uni_bi_toggle/l-r_trans.svg`
      : `${BASE_PATH}/uni_bi_toggle/r-l_trans.svg`
  }
  
  if (toggleHovered.value) {
    return isUnipolar 
      ? `${BASE_PATH}/uni_bi_toggle/l_float.svg`
      : `${BASE_PATH}/uni_bi_toggle/r_float.svg`
  }
  
  return isUnipolar 
    ? `${BASE_PATH}/uni_bi_toggle/l_active.svg`
    : `${BASE_PATH}/uni_bi_toggle/r_active.svg`
})

const toggleTooltip = computed(() => {
  // Show the mode you're about to switch TO, not the current mode
  return model.value.valueMode === 0 ? 'Bipolar' : 'Unipolar'
})

const handleToggleClick = () => {
  if (isAnimating.value) return
  
  // Determine transition direction based on current state
  const isCurrentlyUnipolar = model.value.valueMode === 0
  transitionDirection.value = isCurrentlyUnipolar ? 'left-to-right' : 'right-to-left'
  
  isAnimating.value = true
  
  // Animate for specified duration then switch
  animationTimeoutId.value = window.setTimeout(() => {
    model.value.valueMode = model.value.valueMode === 0 ? 1 : 0
    isAnimating.value = false
    transitionDirection.value = null
    animationTimeoutId.value = null
    
    // Emit the new mode name for parent to display
    const newModeName = model.value.valueMode === 0 ? 'Unipolar' : 'Bipolar'
    emit('valueModeChanged', newModeName)
  }, TOGGLE_ANIMATION_DURATION)
}

// Cleanup timeout on unmount to prevent memory leaks
onBeforeUnmount(() => {
  if (animationTimeoutId.value !== null) {
    clearTimeout(animationTimeoutId.value)
  }
  // Cleanup duration drag event listeners
  document.removeEventListener('mousemove', handleDurationMouseMove)
  document.removeEventListener('mouseup', handleDurationMouseUp)
  // Cleanup steps drag event listeners
  document.removeEventListener('mousemove', handleStepsMouseMove)
  document.removeEventListener('mouseup', handleStepsMouseUp)
})

// Profile selection logic
type ProfileType = 'lin' | 'exp' | 'log' | 'pd' | 'inc'

const isProfileActive = (profile: ProfileType): boolean => {
  if (model.value.functionMode === 2) {
    return profile === 'inc'
  } else if (model.value.functionMode === 1) {
    return profile === 'pd'
  } else if (model.value.functionMode === 0) {
    if (model.value.onsetType === 1) return profile === 'exp'
    if (model.value.onsetType === 2) return profile === 'log'
    return profile === 'lin'
  }
  return false
}

// Active profile name (full description)
const activeProfileName = computed(() => {
  if (model.value.functionMode === 2) {
    return 'Incremental'
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
    model.value.functionMode = 2
  } else if (profile === 'pd') {
    model.value.functionMode = 1
  } else {
    model.value.functionMode = 0
    
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
  const polarity = model.value.valueMode === 1 ? 'bi' : 'uni'
  let profile = 'lin' // default
  
  if (model.value.functionMode === 2) {
    profile = 'inc'
  } else if (model.value.functionMode === 1) {
    profile = 'pd'
  } else if (model.value.functionMode === 0) {
    // Interpolated mode - check type
    if (model.value.onsetType === 1) profile = 'exp'
    else if (model.value.onsetType === 2) profile = 'log'
    else profile = 'lin'
  }
  
  // All lever profile SVG files use underscore separator
  return `${BASE_PATH}/lever_profiles/${profile}_${polarity}.svg`
})

// Initialize selectedCategory from current ccNumber's category (fallback to first available category)
const initialCategory = computed(() => {
  const cat = props.ccMapByNumber.get(model.value.ccNumber)?.category
  return cat || props.categories[0] || 'Global'
})
const selectedCategory = ref<string>(initialCategory.value)
const categoryPickerOpen = ref(false)
const categoryTriggerRef = ref<HTMLElement | null>(null)

// Convert categories to dropdown options
const categoryOptions = computed(() => 
  props.categories.map(cat => ({ label: cat, value: cat }))
)

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

// Computed properties for mode detection
const isIncrementalMode = computed(() => model.value.functionMode === 2)

// Map between displayed step count and firmware stepSize
const stepSizeMap: Record<number, number> = {
  4: 32,   // 4 steps × 32 = 128 MIDI values
  8: 16,   // 8 steps × 16 = 128 MIDI values
  16: 8,   // 16 steps × 8 = 128 MIDI values
  32: 4,   // 32 steps × 4 = 128 MIDI values
  64: 2    // 64 steps × 2 = 128 MIDI values
}

// Reverse map from stepSize to step count
const stepCountMap: Record<number, number> = {
  32: 4,
  16: 8,
  8: 16,
  4: 32,
  2: 64
}

// Computed property for Steps that converts between user-friendly step count and firmware stepSize
const stepsValue = computed({
  get: () => {
    // Convert from stepSize to step count
    return stepCountMap[model.value.stepSize] || 16
  },
  set: (stepCount: number) => {
    // Convert from step count to stepSize
    model.value.stepSize = stepSizeMap[stepCount] || 8
  }
})

// Value mode constants
const VALUE_MODE_UNIPOLAR = 0
const VALUE_MODE_BIPOLAR = 1

// Determine min/max range based on polarity
const minRange = computed(() => model.value.valueMode === VALUE_MODE_BIPOLAR ? -100 : 0)
const maxRange = computed(() => 100)

// Conversion functions
function unipolarToMidi(userValue: number): number {
  return Math.round((userValue / 100) * 127)
}

function bipolarToMidi(userValue: number): number {
  return Math.round(((userValue + 100) / 200) * 127)
}

function midiToUnipolar(midiValue: number): number {
  return Math.round((midiValue / 127) * 100)
}

function midiToBipolar(midiValue: number): number {
  return Math.round((midiValue / 127) * 200) - 100
}

// User-facing Min value (0-100 or -100 to +100)
const userMin = computed({
  get: () => {
    if (model.value.valueMode === VALUE_MODE_BIPOLAR) {
      return midiToBipolar(model.value.minCCValue)
    } else {
      return midiToUnipolar(model.value.minCCValue)
    }
  },
  set: (userValue: number) => {
    if (model.value.valueMode === VALUE_MODE_BIPOLAR) {
      model.value.minCCValue = bipolarToMidi(userValue)
    } else {
      model.value.minCCValue = unipolarToMidi(userValue)
    }
  }
})

// User-facing Max value (0-100 or -100 to +100)
const userMax = computed({
  get: () => {
    if (model.value.valueMode === VALUE_MODE_BIPOLAR) {
      return midiToBipolar(model.value.maxCCValue)
    } else {
      return midiToUnipolar(model.value.maxCCValue)
    }
  },
  set: (userValue: number) => {
    if (model.value.valueMode === VALUE_MODE_BIPOLAR) {
      model.value.maxCCValue = bipolarToMidi(userValue)
    } else {
      model.value.maxCCValue = unipolarToMidi(userValue)
    }
  }
})

// Watch polarity changes and adjust min/max values accordingly
watch(() => model.value.valueMode, (newMode, oldMode) => {
  if (oldMode === undefined) return // Skip initial watch trigger
  
  if (newMode === VALUE_MODE_BIPOLAR && oldMode === VALUE_MODE_UNIPOLAR) {
    // Switching from Unipolar to Bipolar
    // Map 50 → 0 (center), maintaining MIDI equivalents
    const currentMinMidi = model.value.minCCValue
    const currentMaxMidi = model.value.maxCCValue
    
    // Keep MIDI values the same, they'll just display differently
    model.value.minCCValue = currentMinMidi
    model.value.maxCCValue = currentMaxMidi
  } else if (newMode === VALUE_MODE_UNIPOLAR && oldMode === VALUE_MODE_BIPOLAR) {
    // Switching from Bipolar to Unipolar
    // Map 0 → 50 (center), clamp negatives to 0
    const currentMinMidi = model.value.minCCValue
    const currentMaxMidi = model.value.maxCCValue
    
    // Keep MIDI values the same, they'll just display differently
    model.value.minCCValue = currentMinMidi
    model.value.maxCCValue = currentMaxMidi
  }
})

// Computed property to gang attack and decay times together as "Duration"
const duration = computed({
  get: () => model.value.onsetTime,
  set: (value: number) => {
    model.value.onsetTime = value
    model.value.offsetTime = value
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

// Steps drag support
const stepsDragging = ref(false)
const stepsDragStartX = ref(0)
const stepsDragStartIndex = ref(0)
const stepsOptions = [4, 8, 16, 32, 64]

// Mouse wheel for steps
function handleStepsWheel(event: WheelEvent) {
  event.preventDefault()
  const currentIndex = stepsOptions.indexOf(stepsValue.value)
  const delta = event.deltaY > 0 ? -1 : 1
  const newIndex = Math.max(0, Math.min(stepsOptions.length - 1, currentIndex + delta))
  stepsValue.value = stepsOptions[newIndex]!
}

// Mouse drag for steps
function handleStepsMouseDown(event: MouseEvent) {
  event.preventDefault()
  stepsDragging.value = true
  stepsDragStartX.value = event.clientX
  stepsDragStartIndex.value = stepsOptions.indexOf(stepsValue.value)
  
  document.addEventListener('mousemove', handleStepsMouseMove)
  document.addEventListener('mouseup', handleStepsMouseUp)
}

function handleStepsMouseMove(event: MouseEvent) {
  if (!stepsDragging.value) return
  
  const deltaX = event.clientX - stepsDragStartX.value
  // Scale: 30 pixels of movement = 1 step in the array
  const indexChange = Math.round(deltaX / 30)
  const newIndex = Math.max(0, Math.min(stepsOptions.length - 1, stepsDragStartIndex.value + indexChange))
  stepsValue.value = stepsOptions[newIndex]!
}

function handleStepsMouseUp() {
  stepsDragging.value = false
  document.removeEventListener('mousemove', handleStepsMouseMove)
  document.removeEventListener('mouseup', handleStepsMouseUp)
}

// Touch drag for steps
function handleStepsTouchStart(event: TouchEvent) {
  if (!event.touches[0]) return
  stepsDragging.value = true
  stepsDragStartX.value = event.touches[0].clientX
  stepsDragStartIndex.value = stepsOptions.indexOf(stepsValue.value)
}

function handleStepsTouchMove(event: TouchEvent) {
  if (!stepsDragging.value || !event.touches[0]) return
  event.preventDefault()
  
  const deltaX = event.touches[0].clientX - stepsDragStartX.value
  // Scale: 30 pixels of movement = 1 step in the array
  const indexChange = Math.round(deltaX / 30)
  const newIndex = Math.max(0, Math.min(stepsOptions.length - 1, stepsDragStartIndex.value + indexChange))
  stepsValue.value = stepsOptions[newIndex]!
}

function handleStepsTouchEnd() {
  stepsDragging.value = false
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

// Computed properties for steps min/max
const isStepsAtMin = computed(() => {
  const currentIndex = stepsOptions.indexOf(stepsValue.value)
  return currentIndex <= 0
})

const isStepsAtMax = computed(() => {
  const currentIndex = stepsOptions.indexOf(stepsValue.value)
  return currentIndex >= stepsOptions.length - 1
})

// Arrow button functions for steps
function decreaseSteps() {
  const currentIndex = stepsOptions.indexOf(stepsValue.value)
  if (currentIndex > 0) {
    stepsValue.value = stepsOptions[currentIndex - 1]!
  }
}

function increaseSteps() {
  const currentIndex = stepsOptions.indexOf(stepsValue.value)
  if (currentIndex < stepsOptions.length - 1) {
    stepsValue.value = stepsOptions[currentIndex + 1]!
  }
}
</script>

<style scoped>

.settings-lever {
  padding: 1rem 1rem 1rem 0; /* Bottom padding back to 16px */
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-family: 'Roboto Mono';
  font-size: 0.8125rem; /* 13px */
  width: 100%; /* Ensure it takes available width */
  max-width: 100%; /* Don't exceed container */
  box-sizing: border-box; /* Include padding in width calculation */
  overflow: visible; /* Allow dropdowns to extend beyond bounds */
  position: relative; /* For popup positioning */
}

@media (max-width: 768px) {
  .settings-lever {
    padding: 0.75rem 0.75rem 0.75rem 0; /* Keep left padding at 0 */
  }
}

.controls-row {
  display: flex;
  justify-content: flex-start; /* Align to left for flush alignment */
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  flex-wrap: nowrap; /* Keep in one row but allow shrinking */
}

.toggle-container {
  display: flex;
  align-items: center;
  flex-shrink: 0; /* Don't let it shrink too much */
  margin-right: 1rem; /* Add spacing after toggle to separate from profile buttons */
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
  gap: 1.5rem; /* Internal spacing between Lin, Exp, Log, Inc buttons */
  align-items: center;
  flex-shrink: 1; /* Allow buttons to shrink if needed */
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

.profile-btn:hover {
  color: #CDCDCD;
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
  margin: 0.5rem 0; /* Reduced from 1.5rem to 0.5rem */
  padding: 0; /* Remove padding that creates space */
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden; /* Contain the image */
  /* NO min-width - allow it to scale down */
}

.profile-visualization img {
  width: 100%;
  height: auto;
  display: block;
  max-width: 100%;
  /* NO min-width - allow scaling */
}

/* Tablet and mobile-specific sizing */
@media (max-width: 768px) {
  .controls-row {
    gap: 0.75rem; /* 12px gap on tablets */
  }
  
  .profile-visualization {
    margin: 1rem 0;
    padding: 0;
  }
}

@media (max-width: 480px) {
  .controls-row {
    gap: 0.5rem; /* 8px gap on very small screens */
  }
}

.inputs {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  margin-top: 1.5rem;
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
  overflow: hidden;
}

.meter-bar {
  height: 9px;
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 4.5px;
}

/* Base bars at 40% opacity */
.blue-bar-base {
  width: 100%;
  background: #1F498E;
  opacity: 0.4;
}

.pink-bar-base {
  width: 100%;
  background: #B638B4;
  opacity: 0.4;
}

/* Active bars at 100% opacity */
.blue-bar-active {
  background: #1F498E;
  opacity: 1;
  z-index: 1;
  left: auto;
  right: 0;
}

.pink-bar-active {
  background: #B638B4;
  opacity: 1;
  z-index: 1;
}

.meter-divider {
  width: 2px;
  height: 17px;
  background: #FFA500;
  flex-shrink: 0;
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

/* CustomDropdown right-justification */
.group :deep(.custom-dropdown) {
  flex: 1;
}

.group :deep(.dropdown-label) {
  text-align: right;
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
  text-align: center;
  cursor: ew-resize; /* Indicates horizontal dragging */
  touch-action: none; /* Prevent default touch behaviors */
  user-select: none; /* Prevent text selection while dragging */
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

.draggable-value {
  padding: 0;
  border: none;
  background: transparent;
  color: #EAEAEA;
  font-size: 0.8125rem; /* 13px */
  font-family: 'Roboto Mono';
  font-weight: 400;
  text-align: right;
  cursor: ew-resize; /* Indicates horizontal dragging */
  touch-action: none; /* Prevent default touch behaviors */
  user-select: none; /* Prevent text selection while dragging */
  min-width: 60px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.draggable-value:hover {
  opacity: 0.8;
}

.draggable-value-inline {
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
  width: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.draggable-value-inline:hover {
  opacity: 0.8;
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

.value-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
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
  cursor: default; /* Normal cursor on unit label */
  user-select: none; /* Prevent text selection */
}

.readonly-field {
  background: var(--color-background-mute) !important;
  cursor: not-allowed;
  color: var(--color-text-muted);
}
</style>
