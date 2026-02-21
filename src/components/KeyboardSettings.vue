<template>
  <div class="settings-keyboard">
    <!-- Mode Selector -->
    <div class="mode-selector">
      <button 
        class="mode-btn"
        :class="{ active: playMode === 'scale' }"
        @click="selectMode('scale')"
        title="Scale Mode"
      >
        Scale
      </button>
      <button 
        class="mode-btn"
        :class="{ active: playMode === 'chord' }"
        @click="selectMode('chord')"
        title="Chord Mode"
      >
        Chord
      </button>
    </div>

    <!-- Keyboard Visualization -->
    <div class="keyboard-visual">
      <!-- Top row: Sharps/Flats -->
      <div class="keyboard-row top-row">
        <div 
          v-for="note in topRowNotes" 
          :key="note.midi"
          class="key sharp-key"
          :class="{ 
            active: isNoteActive(note.midi),
            'gap-after': note.gapAfter,
            'root-note': isRootNote(note.midi)
          }"
        >
          <div class="note-label">{{ note.sharp }}</div>
          <div class="note-label-alt">{{ note.flat }}</div>
        </div>
      </div>
      
      <!-- Bottom row: Naturals -->
      <div class="keyboard-row bottom-row">
        <div 
          v-for="note in bottomRowNotes" 
          :key="note.midi"
          class="key natural-key"
          :class="{ 
            active: isNoteActive(note.midi),
            'gap-after': note.gapAfter,
            'root-note': isRootNote(note.midi)
          }"
        >
          <div class="note-label">{{ note.name }}</div>
        </div>
      </div>
    </div>

    <!-- Scale Mode: Mapping Toggle and Visualization -->
    <div v-if="playMode === 'scale'" class="mapping-toggle-row">
      <div class="toggle-container" :class="{ disabled: isChromatic }">
        <img 
          :src="scaleToggleImage" 
          alt="Mapping Toggle"
          :title="scaleToggleTooltip"
          class="toggle-image"
          :class="{ disabled: isChromatic }"
          @click="handleScaleToggleClick"
          @mouseenter="scaleToggleHovered = true"
          @mouseleave="scaleToggleHovered = false"
        />
      </div>
      
      <div class="dots-visualization" :class="{ 'wide-spacing': isNatural }">
        <div v-for="i in 12" :key="i" class="dot"></div>
      </div>
    </div>

    <!-- Chord Mode: Chord/Strum Toggle and Smart Slider -->
    <div v-else-if="playMode === 'chord'" class="chord-controls">
      <!-- Chord/Strum Toggle -->
      <div class="mapping-toggle-row">
        <div class="toggle-container">
          <img 
            :src="chordToggleImage" 
            alt="Chord/Strum Toggle"
            :title="chordToggleTooltip"
            class="toggle-image"
            @click="handleChordToggleClick"
            @mouseenter="chordToggleHovered = true"
            @mouseleave="chordToggleHovered = false"
          />
        </div>
        
        <!-- Visual indicator: line for chord, dots for strum -->
        <div class="chord-visualization">
          <div v-if="isChordStyle" class="chord-line"></div>
          <div v-else class="strum-dots">
            <div v-for="i in 12" :key="i" class="dot"></div>
          </div>
        </div>
      </div>

      <!-- Smart Slider: Velocity Spread or Strum Speed -->
      <div class="smart-slider-section">
        <!-- Duration Meter Visual -->
        <div class="duration-meter">
          <div class="meter-bar-container">
            <div class="meter-divider"></div>
            <div class="meter-bar-wrapper">
              <div class="meter-bar green-bar-base"></div>
              <div 
                class="meter-bar green-bar-active"
                :style="{ width: `${sliderPercentage}%` }"
              ></div>
            </div>
          </div>
        </div>

        <div class="group">
          <label>{{ smartSliderLabel }}</label>
          <div class="duration-control-wrapper">
            <ValueControl
              v-model="smartSliderValue"
              :min="smartSliderMin"
              :max="smartSliderMax"
              :step="1"
              :small-step="5"
              :large-step="10"
            />
            <span class="unit-label">{{ smartSliderUnit }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Type/Root Note Selectors -->
    <div class="inputs">
      <div class="group">
        <label>{{ leftLabel }}</label>
        <button 
          ref="typeTriggerRef"
          class="picker-trigger"
          :class="{ 'picker-open': typePickerOpen }"
          @click="typePickerOpen = true"
        >
          {{ selectedTypeLabel }}
        </button>
      </div>
      <div class="input-divider"></div>

      <div class="group">
        <label>ROOT NOTE</label>
        <NotePickerControl
          v-model.number="rootNoteValue"
          :notes="rootNotes"
        />
      </div>
    </div>

    <!-- Scale/Chord Type Wheel Picker Modal -->
    <OptionWheelPicker
      v-model="typeValue"
      v-model:isOpen="typePickerOpen"
      :options="typeOptions"
      :trigger-el="typeTriggerRef"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'
import NotePickerControl from './NotePickerControl.vue'
import OptionWheelPicker from './OptionWheelPicker.vue'
import ValueControl from './ValueControl.vue'

type ScaleModel = {
  scaleType: number
  rootNote: number
  keyMapping: number
}

type ChordModel = {
  chordType: number
  rootNote: number
  velocitySpread: number
  strumMode: boolean
  strumSpeed: number
}

type KeyboardModel = {
  mode: 'scale' | 'chord'
  scale: ScaleModel
  chord: ChordModel
}

const props = defineProps<{
  modelValue: KeyboardModel
  scales: { value: number, label: string }[]
  chordTypes: { value: number, label: string }[]
  rootNotes: { value: number, label: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: KeyboardModel): void
  (e: 'mappingChanged', mappingName: string): void
  (e: 'chordStyleChanged', styleName: string): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

// Play mode
const playMode = computed({
  get: () => model.value.mode,
  set: (v: 'scale' | 'chord') => {
    model.value = { ...model.value, mode: v }
  }
})

function selectMode(mode: 'scale' | 'chord') {
  playMode.value = mode
}

// Wheel picker state
const typePickerOpen = ref(false)
const typeTriggerRef = ref<HTMLElement | null>(null)

// Dynamic labels and values based on mode
const leftLabel = computed(() => {
  return playMode.value === 'scale' ? 'SCALE TYPE' : 'CHORD TYPE'
})

const typeOptions = computed(() => {
  return playMode.value === 'scale' ? props.scales : props.chordTypes
})

const typeValue = computed({
  get: () => playMode.value === 'scale' ? model.value.scale.scaleType : model.value.chord.chordType,
  set: (v: number) => {
    if (playMode.value === 'scale') {
      model.value.scale.scaleType = v
    } else {
      model.value.chord.chordType = v
    }
  }
})

const rootNoteValue = computed({
  get: () => playMode.value === 'scale' ? model.value.scale.rootNote : model.value.chord.rootNote,
  set: (v: number) => {
    if (playMode.value === 'scale') {
      model.value.scale.rootNote = v
    } else {
      model.value.chord.rootNote = v
    }
  }
})

const selectedTypeLabel = computed(() => {
  const option = typeOptions.value.find(o => o.value === typeValue.value)
  return option?.label || 'Unknown'
})

// Constants
const BASE_PATH = '/KB1-config'
const TOGGLE_ANIMATION_DURATION = 60 // milliseconds for toggle transition

// ===== SCALE MODE TOGGLE =====
const scaleToggleHovered = ref(false)
const scaleToggleAnimating = ref(false)
const scaleAnimationTimeoutId = ref<number | null>(null)
const scaleTransitionDirection = ref<'left-to-right' | 'right-to-left' | null>(null)

const isNatural = computed(() => model.value.scale.keyMapping === 0)
const isChromatic = computed(() => model.value.scale.scaleType === 0)

const scaleToggleImage = computed(() => {
  const mode = isNatural.value ? 'l' : 'r'
  
  if (scaleToggleAnimating.value && scaleTransitionDirection.value) {
    return scaleTransitionDirection.value === 'left-to-right'
      ? `${BASE_PATH}/keys_toggle/l-r.svg`
      : `${BASE_PATH}/keys_toggle/r-l.svg`
  }
  
  if (scaleToggleHovered.value && !isChromatic.value) {
    return `${BASE_PATH}/keys_toggle/${mode}_flot.svg`
  }
  
  return `${BASE_PATH}/keys_toggle/${mode}_activ.svg`
})

const scaleToggleTooltip = computed(() => {
  if (isChromatic.value) {
    return 'Mapping mode disabled in Chromatic scale'
  }
  return isNatural.value ? 'Switch to Compact' : 'Switch to Natural'
})

const handleScaleToggleClick = () => {
  if (scaleToggleAnimating.value || isChromatic.value) return
  
  const isCurrentlyNatural = isNatural.value
  scaleTransitionDirection.value = isCurrentlyNatural ? 'left-to-right' : 'right-to-left'
  
  scaleToggleAnimating.value = true
  
  const newMappingName = isCurrentlyNatural ? 'Dense (all keys used)' : 'Spaced (keys repeat)'
  emit('mappingChanged', newMappingName)
  
  scaleAnimationTimeoutId.value = window.setTimeout(() => {
    model.value.scale.keyMapping = isCurrentlyNatural ? 1 : 0
    scaleToggleAnimating.value = false
    scaleTransitionDirection.value = null
    scaleAnimationTimeoutId.value = null
  }, TOGGLE_ANIMATION_DURATION)
}

// ===== CHORD MODE TOGGLE =====
const chordToggleHovered = ref(false)
const chordToggleAnimating = ref(false)
const chordAnimationTimeoutId = ref<number | null>(null)
const chordTransitionDirection = ref<'left-to-right' | 'right-to-left' | null>(null)

const isChordStyle = computed(() => !model.value.chord.strumMode)

const chordToggleImage = computed(() => {
  const mode = isChordStyle.value ? 'l' : 'r'
  
  if (chordToggleAnimating.value && chordTransitionDirection.value) {
    return chordTransitionDirection.value === 'left-to-right'
      ? `${BASE_PATH}/chord_strum_toggle/l-r.svg`
      : `${BASE_PATH}/chord_strum_toggle/r-l.svg`
  }
  
  if (chordToggleHovered.value) {
    return `${BASE_PATH}/chord_strum_toggle/${mode}_flot.svg`
  }
  
  return `${BASE_PATH}/chord_strum_toggle/${mode}_activ.svg`
})

const chordToggleTooltip = computed(() => {
  return isChordStyle.value ? 'Switch to Strum' : 'Switch to Chord'
})

const handleChordToggleClick = () => {
  if (chordToggleAnimating.value) return
  
  const isCurrentlyChord = isChordStyle.value
  chordTransitionDirection.value = isCurrentlyChord ? 'left-to-right' : 'right-to-left'
  
  chordToggleAnimating.value = true
  
  const newStyleName = isCurrentlyChord ? 'Strum' : 'Chord'
  emit('chordStyleChanged', newStyleName)
  
  chordAnimationTimeoutId.value = window.setTimeout(() => {
    model.value.chord.strumMode = isCurrentlyChord
    chordToggleAnimating.value = false
    chordTransitionDirection.value = null
    chordAnimationTimeoutId.value = null
  }, TOGGLE_ANIMATION_DURATION)
}

// ===== SMART SLIDER =====
const smartSliderValue = computed({
  get: () => isChordStyle.value ? model.value.chord.velocitySpread : model.value.chord.strumSpeed,
  set: (v: number) => {
    if (isChordStyle.value) {
      model.value.chord.velocitySpread = v
    } else {
      model.value.chord.strumSpeed = v
    }
  }
})

const smartSliderMin = computed(() => isChordStyle.value ? 0 : 5)
const smartSliderMax = computed(() => 100)

const smartSliderLabel = computed(() => {
  return isChordStyle.value ? 'VELOCITY SPREAD' : 'STRUM SPEED'
})

const smartSliderUnit = computed(() => {
  return isChordStyle.value ? '%' : 'ms'
})

const sliderPercentage = computed(() => {
  const range = smartSliderMax.value - smartSliderMin.value
  const value = smartSliderValue.value - smartSliderMin.value
  return (value / range) * 100
})

// Cleanup timeouts on unmount
onBeforeUnmount(() => {
  if (scaleAnimationTimeoutId.value !== null) {
    clearTimeout(scaleAnimationTimeoutId.value)
  }
  if (chordAnimationTimeoutId.value !== null) {
    clearTimeout(chordAnimationTimeoutId.value)
  }
})

// ===== KEYBOARD VISUALIZATION =====

// Scale theory - intervals in semitones from root note
const scaleIntervals: Record<number, number[]> = {
  0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // Chromatic - all notes
  1: [0, 2, 4, 5, 7, 9, 11], // Major
  2: [0, 2, 3, 5, 7, 8, 10], // Minor (Natural Minor)
  3: [0, 2, 3, 5, 7, 9, 10], // Dorian
  4: [0, 1, 3, 5, 7, 8, 10], // Phrygian
  5: [0, 2, 4, 6, 7, 9, 11], // Lydian
  6: [0, 2, 4, 5, 7, 9, 10], // Mixolydian
  7: [0, 2, 3, 5, 7, 8, 10], // Aeolian (same as Natural Minor)
  8: [0, 1, 3, 5, 6, 8, 10], // Locrian
  9: [0, 2, 4, 7, 9], // Pentatonic Major
  10: [0, 3, 5, 7, 10], // Pentatonic Minor
}

// Chord theory - intervals in semitones from root note
const chordIntervals: Record<number, number[]> = {
  0: [0], // Off (single note)
  1: [0, 4, 7], // Major
  2: [0, 3, 7], // Minor
  3: [0, 3, 6], // Diminished
  4: [0, 4, 8], // Augmented
  5: [0, 2, 7], // Sus2
  6: [0, 5, 7], // Sus4
  7: [0, 7, 12], // Power (root, 5th, octave)
}

// Keyboard layout - starting from B (MIDI 59) for ~2 octaves
const topRowNotes = [
  { midi: 61, sharp: 'C#', flat: 'Db', gapAfter: false },
  { midi: 63, sharp: 'D#', flat: 'Eb', gapAfter: true },
  { midi: 66, sharp: 'F#', flat: 'Gb', gapAfter: false },
  { midi: 68, sharp: 'G#', flat: 'Ab', gapAfter: false },
  { midi: 70, sharp: 'A#', flat: 'Bb', gapAfter: true },
  { midi: 73, sharp: 'C#', flat: 'Db', gapAfter: false },
  { midi: 75, sharp: 'D#', flat: 'Eb', gapAfter: false },
]

const bottomRowNotes = [
  { midi: 59, name: 'B', gapAfter: false },
  { midi: 60, name: 'C', gapAfter: false },
  { midi: 62, name: 'D', gapAfter: false },
  { midi: 64, name: 'E', gapAfter: false },
  { midi: 65, name: 'F', gapAfter: false },
  { midi: 67, name: 'G', gapAfter: false },
  { midi: 69, name: 'A', gapAfter: false },
  { midi: 71, name: 'B', gapAfter: false },
  { midi: 72, name: 'C', gapAfter: false },
  { midi: 74, name: 'D', gapAfter: false },
  { midi: 76, name: 'E', gapAfter: false },
  { midi: 77, name: 'F', gapAfter: false },
]

function isNoteActive(midiNote: number): boolean {
  if (playMode.value === 'scale') {
    // Scale mode: show active scale notes
    const scaleType = model.value.scale.scaleType
    const rootNote = model.value.scale.rootNote
    const intervals = scaleIntervals[scaleType] || []
    const noteOffset = (midiNote - rootNote + 120) % 12
    return intervals.includes(noteOffset)
  } else {
    // Chord mode: show chord tones
    const chordType = model.value.chord.chordType
    const rootNote = model.value.chord.rootNote
    const intervals = chordIntervals[chordType] || []
    const noteOffset = (midiNote - rootNote + 120) % 12
    return intervals.includes(noteOffset)
  }
}

function isRootNote(midiNote: number): boolean {
  const rootNote = playMode.value === 'scale' ? model.value.scale.rootNote : model.value.chord.rootNote
  return (midiNote % 12) === (rootNote % 12)
}
</script>

<style scoped>
.settings-keyboard {
  padding: 1.5rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: visible;
}

/* Mode Selector (like Touch) */
.mode-selector {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-divider);
}

.mode-btn {
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

.mode-btn:hover {
  color: #CDCDCD;
}

.mode-btn.active {
  color: #CDCDCD;
}

.mode-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #CDCDCD;
}

/* Keyboard Visualization */
.keyboard-visual {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 5px;
  overflow: visible;
}

.keyboard-row {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: nowrap;
  overflow: visible;
}

.key {
  width: 24px;
  height: 60px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'Roboto Mono';
  font-size: 0.6875rem;
  font-weight: 500;
  transition: background-color 0.2s ease, color 0.2s ease;
  flex-shrink: 0;
}

.key {
  background-color: #1A1A1A;
  color: rgba(255, 255, 255, 0.3);
}

.key.active {
  background-color: #0BA873;
  color: #0F0F0F;
}

.key.root-note {
  box-shadow:
    inset 0 0 0 2px #0F0F0F,
    0 0 0 1px var(--accent-highlight);
}

.key.gap-after {
  margin-right: 1.5rem;
}

.note-label {
  line-height: 1;
}

.note-label-alt {
  line-height: 1;
  font-size: 0.625rem;
}

/* Mapping Toggle Row */
.mapping-toggle-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-top: 1rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-top: 1px solid var(--color-divider);
}

.toggle-container {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.toggle-container.disabled {
  opacity: 0.3;
  pointer-events: none;
}

.toggle-image {
  display: block;
  height: 22px;
  width: auto;
  cursor: pointer;
  transition: opacity 0.3s ease-in-out;
}

.toggle-image:hover:not(.disabled) {
  opacity: 0.85;
}

.toggle-image.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Dots Visualization (Scale mode) */
.dots-visualization {
  display: flex;
  align-items: center;
  gap: 2px;
  transition: gap 0.3s ease;
  flex-shrink: 0;
}

.dots-visualization.wide-spacing {
  gap: 8px;
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: var(--accent-highlight);
  flex-shrink: 0;
}

/* Chord/Strum Visualization */
.chord-visualization {
  display: flex;
  align-items: center;
  flex: 1;
}

.chord-line {
  width: 100%;
  height: 2px;
  background-color: var(--accent-highlight);
  border-radius: 1px;
}

.strum-dots {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

/* Chord Controls Section */
.chord-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Smart Slider (Duration style) */
.smart-slider-section {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-divider);
}

.duration-meter {
  padding: 0.75rem 0;
}

.meter-bar-container {
  display: flex;
  align-items: center;
  gap: 0;
  height: 17px;
}

.meter-bar-wrapper {
  position: relative;
  width: 100%;
  height: 9px;
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

.green-bar-base {
  width: 100%;
  background: #0BA873;
  opacity: 0.4;
}

.green-bar-active {
  background: #0BA873;
  opacity: 1;
  z-index: 1;
}

.meter-divider {
  width: 2px;
  height: 17px;
  background: var(--accent-highlight);
  flex-shrink: 0;
}

.duration-control-wrapper {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  justify-content: flex-end;
}

.unit-label {
  font-size: 0.8125rem;
  color: #EAEAEA;
  font-family: 'Roboto Mono';
  font-weight: 400;
  cursor: default;
  user-select: none;
}

/* Inputs Section */
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
  font-size: 0.8125rem;
  color: var(--label-gray);
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
  font-size: 0.8125rem;
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
</style>
