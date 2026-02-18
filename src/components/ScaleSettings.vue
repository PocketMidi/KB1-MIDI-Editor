<template>
  <div class="settings-scale">
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

    <!-- Mapping Toggle and Visualization -->
    <div class="mapping-toggle-row">
      <div class="toggle-container" :class="{ disabled: isChromatic }">
        <img 
          :src="toggleImage" 
          alt="Mapping Toggle"
          :title="toggleTooltip"
          class="toggle-image"
          :class="{ disabled: isChromatic }"
          @click="handleToggleClick"
          @mouseenter="toggleHovered = true"
          @mouseleave="toggleHovered = false"
        />
      </div>
      
      <div class="dots-visualization" :class="{ 'wide-spacing': isNatural }">
        <div v-for="i in 12" :key="i" class="dot"></div>
      </div>
    </div>

    <div class="inputs">
      <div class="group">
        <label>SCALE</label>
        <CustomDropdown
          v-model.number="model.scaleType"
          :options="scales"
        />
      </div>
      <div class="input-divider"></div>

      <div class="group">
        <label>ROOT NOTE</label>
        <NotePickerControl
          v-model.number="model.rootNote"
          :notes="rootNotes"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'
import CustomDropdown from './CustomDropdown.vue'
import NotePickerControl from './NotePickerControl.vue'

type ScaleModel = {
  scaleType: number
  rootNote: number
  keyMapping: number
}

const props = defineProps<{
  modelValue: ScaleModel
  scales: { value: number, label: string }[]
  rootNotes: { value: number, label: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: ScaleModel): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

// Constants
const BASE_PATH = '/KB1-config'
const TOGGLE_ANIMATION_DURATION = 60 // milliseconds for toggle transition

// Toggle state and animation
const toggleHovered = ref(false)
const isAnimating = ref(false)
const animationTimeoutId = ref<number | null>(null)
const transitionDirection = ref<'left-to-right' | 'right-to-left' | null>(null)

// Computed properties for toggle state
const isNatural = computed(() => model.value.keyMapping === 0)
const isChromatic = computed(() => model.value.scaleType === 0)

const toggleImage = computed(() => {
  const mode = isNatural.value ? 'l' : 'r'
  
  if (isAnimating.value && transitionDirection.value) {
    // During animation, show transition frames
    return transitionDirection.value === 'left-to-right'
      ? `${BASE_PATH}/keys_toggle/l-r.svg`
      : `${BASE_PATH}/keys_toggle/r-l.svg`
  }
  
  if (toggleHovered.value && !isChromatic.value) {
    return `${BASE_PATH}/keys_toggle/${mode}_flot.svg`
  }
  
  return `${BASE_PATH}/keys_toggle/${mode}_activ.svg`
})

const toggleTooltip = computed(() => {
  if (isChromatic.value) {
    return 'Mapping mode disabled in Chromatic scale'
  }
  // Show the mode you're about to switch TO
  return isNatural.value ? 'Switch to Compact' : 'Switch to Natural'
})

const handleToggleClick = () => {
  if (isAnimating.value || isChromatic.value) return
  
  const isCurrentlyNatural = isNatural.value
  transitionDirection.value = isCurrentlyNatural ? 'left-to-right' : 'right-to-left'
  
  isAnimating.value = true
  
  animationTimeoutId.value = window.setTimeout(() => {
    model.value.keyMapping = isCurrentlyNatural ? 1 : 0
    isAnimating.value = false
    transitionDirection.value = null
    animationTimeoutId.value = null
  }, TOGGLE_ANIMATION_DURATION)
}

// Cleanup timeout on unmount
onBeforeUnmount(() => {
  if (animationTimeoutId.value !== null) {
    clearTimeout(animationTimeoutId.value)
  }
})

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

// Keyboard layout - starting from B (MIDI 59) for ~2 octaves
// Top row: Black keys (sharps/flats)
const topRowNotes = [
  { midi: 61, sharp: 'C#', flat: 'Db', gapAfter: false },
  { midi: 63, sharp: 'D#', flat: 'Eb', gapAfter: true }, // Gap after D#
  { midi: 66, sharp: 'F#', flat: 'Gb', gapAfter: false },
  { midi: 68, sharp: 'G#', flat: 'Ab', gapAfter: false },
  { midi: 70, sharp: 'A#', flat: 'Bb', gapAfter: true }, // Gap after A#
  { midi: 73, sharp: 'C#', flat: 'Db', gapAfter: false },
  { midi: 75, sharp: 'D#', flat: 'Eb', gapAfter: false },
]

// Bottom row: White keys (naturals)
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

// Check if a specific MIDI note is active in the current scale
function isNoteActive(midiNote: number): boolean {
  const scaleType = props.modelValue.scaleType
  const rootNote = props.modelValue.rootNote
  
  // Get the intervals for this scale type
  const intervals = scaleIntervals[scaleType] || []
  
  // Calculate the note relative to the root (modulo 12 for octave equivalence)
  const noteOffset = (midiNote - rootNote + 120) % 12
  
  // Check if this interval is in the scale
  return intervals.includes(noteOffset)
}

// Check if a specific MIDI note is the root note (across octaves)
function isRootNote(midiNote: number): boolean {
  const rootNote = props.modelValue.rootNote
  // Check if the note is the same pitch class as the root (modulo 12)
  return (midiNote % 12) === (rootNote % 12)
}
</script>

<style scoped>
.settings-scale {
  padding: 1.5rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: visible;
}

/* Keyboard Visualization */
.keyboard-visual {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 5px; /* Add padding to prevent outline clipping */
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
  font-size: 0.6875rem; /* 11px */
  font-weight: 500;
  transition: background-color 0.2s ease, color 0.2s ease;
  flex-shrink: 0;
}

/* Inactive keys - dark gray */
.key {
  background-color: #1A1A1A;
  color: rgba(255, 255, 255, 0.3);
}

/* Active keys - green */
.key.active {
  background-color: #0BA873;
  color: #0F0F0F;
}

/* Root note outline */
.key.root-note {
  box-shadow: 
    inset 0 0 0 2px #0F0F0F,  /* Inner dark outline - 2px */
    0 0 0 1px #F9AC20;         /* Outer orange outline - 1px */
}

/* Add gap after certain keys to mimic piano layout */
.key.gap-after {
  margin-right: 1.5rem;
}

.note-label {
  line-height: 1;
}

.note-label-alt {
  line-height: 1;
  font-size: 0.625rem; /* 10px */
}

/* Top row (sharps/flats) styling */
.top-row {
  /* Centered along with bottom row */
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

/* Dots Visualization */
.dots-visualization {
  display: flex;
  align-items: center;
  gap: 2px; /* Close spacing for compact mode */
  transition: gap 0.3s ease;
  flex-shrink: 0;
}

.dots-visualization.wide-spacing {
  gap: 8px; /* Wide spacing for natural mode */
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: #F9AC20;
  flex-shrink: 0;
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
</style>