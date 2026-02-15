<template>
  <div class="settings-lever" :class="`lever-${lever}`">
    <div class="title">
      <div class="title-left">LEVER {{ lever }}</div>
      <div class="title-right">MIDI CC <span class="cc-number">{{ model.ccNumber }}</span></div>
    </div>

    <!-- Toggle and Profile Selection -->
    <div class="controls-row">
      <!-- Unipolar/Bipolar Toggle -->
      <div class="toggle-container">
        <img 
          :src="toggleImage" 
          alt="Polarity Toggle"
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
        >
          Lin
        </button>
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('exp') }"
          @click="selectProfile('exp')"
        >
          Exp
        </button>
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('log') }"
          @click="selectProfile('log')"
        >
          Log
        </button>
        <button 
          class="profile-btn"
          :class="{ active: isProfileActive('inc') }"
          @click="selectProfile('inc')"
        >
          Inc
        </button>
      </div>
    </div>

    <!-- Profile Visualization -->
    <div class="profile-visualization">
      <img :src="profileImage" alt="Profile Graph" />
    </div>

    <div class="inputs">
      <div class="group">
        <label :for="`lever-category-${lever}`">Category</label>
        <select :id="`lever-category-${lever}`" v-model="selectedCategory">
          <option v-for="cat in props.categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>

      <div class="group">
        <label :for="`lever-ccNumber-${lever}`">Parameter</label>
        <select :id="`lever-ccNumber-${lever}`" v-model.number="model.ccNumber">
          <option v-for="opt in filteredOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="group">
        <label :for="`lever-min-${lever}`">Min</label>
        <ValueControl
          v-model="userMin"
          :min="minRange"
          :max="maxRange"
          :step="1"
          :small-step="5"
          :large-step="10"
        />
      </div>

      <div class="group">
        <label :for="`lever-max-${lever}`">Max</label>
        <ValueControl
          v-model="userMax"
          :min="minRange"
          :max="maxRange"
          :step="1"
          :small-step="5"
          :large-step="10"
        />
      </div>

      <div class="group">
        <label :for="`lever-duration-${lever}`">Duration</label>
        <div class="number-with-unit">
          <input type="number" :id="`lever-duration-${lever}`" v-model.number="duration" min="0" max="10000" step="10" />
          <span>ms</span>
        </div>
      </div>

      <!-- Mode-specific Type dropdown for Interpolated and Peak & Decay modes -->
      <div v-if="showTypeControl" class="group">
        <label :for="`lever-type-${lever}`">Type</label>
        <select :id="`lever-type-${lever}`" v-model.number="gangedType">
          <option v-for="opt in interpolations" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <!-- Mode-specific Steps dropdown for Incremental mode -->
      <div v-if="isIncrementalMode" class="group">
        <label :for="`lever-steps-${lever}`">Steps</label>
        <select :id="`lever-steps-${lever}`" v-model.number="stepsValue">
          <option v-for="opt in stepOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { type CCEntry } from '../data/ccMap'
import ValueControl from './ValueControl.vue'

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
  interpolations: { value: number, label: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: LeverModel): void
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
const toggleHovered = ref(false)
const isAnimating = ref(false)
const animationTimeoutId = ref<number | null>(null)

const toggleImage = computed(() => {
  const isUnipolar = model.value.valueMode === 0
  
  if (isAnimating.value) {
    // During animation, show transition frames
    return isUnipolar 
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

const handleToggleClick = () => {
  if (isAnimating.value) return
  
  isAnimating.value = true
  
  // Animate for specified duration then switch
  animationTimeoutId.value = window.setTimeout(() => {
    model.value.valueMode = model.value.valueMode === 0 ? 1 : 0
    isAnimating.value = false
    animationTimeoutId.value = null
  }, TOGGLE_ANIMATION_DURATION)
}

// Cleanup timeout on unmount to prevent memory leaks
onBeforeUnmount(() => {
  if (animationTimeoutId.value !== null) {
    clearTimeout(animationTimeoutId.value)
  }
})

// Profile selection logic
type ProfileType = 'lin' | 'exp' | 'log' | 'inc'

const isProfileActive = (profile: ProfileType): boolean => {
  if (model.value.functionMode === 2) {
    return profile === 'inc'
  } else if (model.value.functionMode === 0) {
    if (model.value.onsetType === 1) return profile === 'exp'
    if (model.value.onsetType === 2) return profile === 'log'
    return profile === 'lin'
  }
  return false
}

const selectProfile = (profile: ProfileType) => {
  if (profile === 'inc') {
    model.value.functionMode = 2
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
}

// Profile visualization
const profileImage = computed(() => {
  const polarity = model.value.valueMode === 1 ? 'bi' : 'uni'
  let profile = 'lin' // default
  
  if (model.value.functionMode === 2) {
    profile = 'inc'
  } else if (model.value.functionMode === 0) {
    // Interpolated mode - check type
    if (model.value.onsetType === 1) profile = 'exp'
    else if (model.value.onsetType === 2) profile = 'log'
    else profile = 'lin'
  }
  
  // Note: Asset file naming uses dash for inc-uni but underscore for all others
  // This matches the existing file naming convention in public/lever_profiles/
  // Consider standardizing to use consistent separator in future asset updates
  const separator = profile === 'inc' && polarity === 'uni' ? '-' : '_'
  return `${BASE_PATH}/lever_profiles/${profile}${separator}${polarity}.svg`
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

// Computed properties for mode detection
const isInterpolatedMode = computed(() => model.value.functionMode === 0)
const isPeakDecayMode = computed(() => model.value.functionMode === 1)
const isIncrementalMode = computed(() => model.value.functionMode === 2)

// Show Type control for Interpolated and Peak & Decay modes
const showTypeControl = computed(() => isInterpolatedMode.value || isPeakDecayMode.value)

// Step options for Incremental mode
// MIDI range is 0-127 (128 total values)
// Display: number of steps, Value: stepSize (MIDI values per step)
const stepOptions = [
  { value: 4, label: '4' },
  { value: 8, label: '8' },
  { value: 16, label: '16' },
  { value: 32, label: '32' },
  { value: 64, label: '64' },
]

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

// Computed property to gang both types together
const gangedType = computed({
  get: () => model.value.onsetType,
  set: (value: number) => {
    model.value.onsetType = value
    model.value.offsetType = value
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
</script>

<style scoped>
.settings-lever {
  padding: 1.5rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

@media (max-width: 768px) {
  .settings-lever {
    padding: 1rem;
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

.title-left {
  font-size: 1rem;
  font-weight: 500;
  color: #848484;
  text-transform: uppercase;
}

.title-right {
  font-size: 0.875rem;
  font-weight: 400;
  color: #848484;
}

.cc-number {
  color: #F9AC20;
  font-weight: 600;
}

.controls-row {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.toggle-container {
  flex-shrink: 0;
}

.toggle-image {
  display: block;
  height: 40px;
  width: auto;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.toggle-image:hover {
  opacity: 0.9;
}

.profile-selector {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.profile-btn {
  background: none;
  border: none;
  padding: 0.5rem 0;
  font-size: 1rem;
  font-weight: 500;
  color: #848484;
  cursor: pointer;
  position: relative;
  transition: color 0.2s ease;
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
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.profile-visualization img {
  max-width: 100%;
  height: auto;
  display: block;
}

.inputs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (min-width: 769px) {
  .inputs {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .inputs {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
}

@media (max-width: 480px) {
  .inputs {
    grid-template-columns: 1fr;
  }
}

.group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.group label {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--color-text);
}

.group input,
.group select {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 1rem;
}

@media (max-width: 768px) {
  .group input,
  .group select {
    padding: 0.625rem 0.5rem;
  }
}

.group input:focus,
.group select:focus {
  outline: none;
  border-color: var(--color-border-hover);
}

.number-with-unit {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.number-with-unit input {
  flex: 1;
}

.number-with-unit span {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  min-width: 2rem;
}

.readonly-field {
  background: var(--color-background-mute) !important;
  cursor: not-allowed;
  color: var(--color-text-muted);
}
</style>