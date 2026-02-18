<template>
  <div class="note-picker-control">
    <button 
      class="stepper-btn"
      :disabled="isAtMin"
      @click="decreaseNote"
      title="Previous note"
    >
      −
    </button>
    <div 
      class="note-display"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      {{ currentNoteLabel }}
    </div>
    <button 
      class="stepper-btn"
      :disabled="isAtMax"
      @click="increaseNote"
      title="Next note"
    >
      +
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'

const props = defineProps<{
  modelValue: number
  notes: { value: number, label: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

// Drag tracking
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartIndex = ref(0)
const currentIndex = computed(() => {
  return props.notes.findIndex(note => note.value === props.modelValue)
})

// Enharmonic equivalents for sharp/flat notes
const enharmonicMap: Record<string, string> = {
  'C#': 'Db',
  'D#': 'Eb',
  'F#': 'Gb',
  'G#': 'Ab',
  'A#': 'Bb',
}

const currentNoteLabel = computed(() => {
  const note = props.notes.find(n => n.value === props.modelValue)
  if (!note) return ''
  
  // If the note has a sharp and there's an enharmonic equivalent, show both
  const enharmonic = enharmonicMap[note.label]
  if (enharmonic) {
    return `${note.label}-${enharmonic}`
  }
  
  return note.label
})

const isAtMin = computed(() => currentIndex.value <= 0)
const isAtMax = computed(() => currentIndex.value >= props.notes.length - 1)

function decreaseNote() {
  if (!isAtMin.value) {
    const newIndex = currentIndex.value - 1
    const note = props.notes[newIndex]
    if (note) {
      emit('update:modelValue', note.value)
    }
  }
}

function increaseNote() {
  if (!isAtMax.value) {
    const newIndex = currentIndex.value + 1
    const note = props.notes[newIndex]
    if (note) {
      emit('update:modelValue', note.value)
    }
  }
}

function clampIndex(index: number): number {
  return Math.max(0, Math.min(props.notes.length - 1, index))
}

function setNoteByIndex(index: number) {
  const clampedIndex = clampIndex(index)
  const note = props.notes[clampedIndex]
  if (note) {
    emit('update:modelValue', note.value)
  }
}

// Mouse wheel scroll support
function handleWheel(event: WheelEvent) {
  event.preventDefault()
  const delta = event.deltaY > 0 ? 1 : -1
  const newIndex = currentIndex.value + delta
  setNoteByIndex(newIndex)
}

// Mouse drag support
function handleMouseDown(event: MouseEvent) {
  event.preventDefault()
  isDragging.value = true
  dragStartX.value = event.clientX
  dragStartIndex.value = currentIndex.value
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function handleMouseMove(event: MouseEvent) {
  if (!isDragging.value) return
  
  const deltaX = event.clientX - dragStartX.value
  // Scale: 20 pixels of movement = 1 note step
  const steps = Math.round(deltaX / 20)
  const newIndex = dragStartIndex.value + steps
  setNoteByIndex(newIndex)
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
  dragStartIndex.value = currentIndex.value
}

function handleTouchMove(event: TouchEvent) {
  if (!isDragging.value || !event.touches[0]) return
  
  const deltaX = event.touches[0].clientX - dragStartX.value
  // Scale: 20 pixels of movement = 1 note step
  const steps = Math.round(deltaX / 20)
  const newIndex = dragStartIndex.value + steps
  setNoteByIndex(newIndex)
}

function handleTouchEnd() {
  isDragging.value = false
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<style scoped>
.note-picker-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: auto;
  min-width: 120px;
}

.stepper-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  color: #EAEAEA;
  font-size: 0.75rem;
  cursor: pointer;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stepper-btn:hover:not(:disabled) {
  opacity: 0.7;
}

.stepper-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.note-display {
  width: 70px;
  text-align: center;
  font-family: 'Roboto Mono';
  font-size: 0.8125rem;
  color: #EAEAEA;
  font-weight: 400;
  padding: 1px 0.5rem;
  cursor: ew-resize;
  user-select: none;
  transition: background 0.2s ease;
  flex-shrink: 0;
}

.note-display:hover {
  background: rgba(234, 234, 234, 0.05);
}

.note-display:active {
  cursor: ew-resize;
}
</style>
