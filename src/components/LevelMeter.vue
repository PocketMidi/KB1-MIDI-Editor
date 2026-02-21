<template>
  <div class="level-meter">
    <!-- Dots/Triangles container -->
    <div 
      class="markers-container"
      @mousedown="handleMarkerMouseDown"
      @touchstart="handleMarkerTouchStart"
    >
      <!-- Reset mode: triangles -->
      <template v-if="mode === 'reset'">
        <div 
          v-for="(marker, index) in markers" 
          :key="index"
          class="triangle"
          :class="{ highlighted: marker.highlighted }"
          :style="{ left: `${marker.position}%` }"
        ></div>
      </template>
      <!-- Range mode: dots -->
      <template v-else>
        <div 
          v-for="(marker, index) in markers" 
          :key="index"
          class="dot"
          :style="{ 
            left: `${marker.position}%`,
            opacity: marker.highlighted ? 1 : 0.4
          }"
        ></div>
      </template>
    </div>
    
    <!-- Labels container -->
    <div class="labels-container">
      <span 
        v-for="label in labels" 
        :key="label.value"
        class="label"
        :style="{ left: `${label.position}%` }"
      >
        {{ label.text }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  min: number
  max: number
  isBipolar: boolean
  mode?: 'range' | 'reset'
  value?: number
}>(), {
  mode: 'range',
  value: 70
})

const emit = defineEmits<{
  'update:min': [value: number]
  'update:max': [value: number]
  'update:value': [value: number]
}>()

// Direct marker interaction handlers
const updateValueFromPosition = (clientX: number, rect: DOMRect) => {
  const rangeMin = props.isBipolar ? -100 : 0
  const rangeMax = 100
  const rangeSpan = rangeMax - rangeMin
  
  const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
  const clickedValue = rangeMin + (percentage / 100) * rangeSpan
  
  if (props.mode === 'reset') {
    // In reset mode, update the single value
    emit('update:value', Math.round(clickedValue))
  } else {
    // In range mode, update whichever is closer (min or max)
    const distToMin = Math.abs(clickedValue - props.min)
    const distToMax = Math.abs(clickedValue - props.max)
    
    if (distToMin < distToMax) {
      // Update min, but don't go above max
      const newMin = Math.min(Math.round(clickedValue), props.max)
      emit('update:min', newMin)
    } else {
      // Update max, but don't go below min
      const newMax = Math.max(Math.round(clickedValue), props.min)
      emit('update:max', newMax)
    }
  }
}

const handleMarkerMouseDown = (e: MouseEvent) => {
  e.preventDefault()
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  updateValueFromPosition(e.clientX, rect)
  
  const handleMouseMove = (e: MouseEvent) => {
    updateValueFromPosition(e.clientX, rect)
  }
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleMarkerTouchStart = (e: TouchEvent) => {
  if (e.touches.length !== 1) return
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  updateValueFromPosition(e.touches[0].clientX, rect)
  
  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length !== 1) return
    e.preventDefault()
    updateValueFromPosition(e.touches[0].clientX, rect)
  }
  
  const handleTouchEnd = () => {
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  }
  
  document.addEventListener('touchmove', handleTouchMove, { passive: false })
  document.addEventListener('touchend', handleTouchEnd)
}

interface Marker {
  position: number
  value: number
  highlighted: boolean
}

interface Label {
  value: number
  position: number
  text: string
}

// Generate markers (dots or triangles) based on mode and polarity
const markers = computed<Marker[]>(() => {
  const totalMarkers = 41 // Creates markers at every 5% interval (0, 2.5%, 5%, ... 100%)
  const rangeMin = props.isBipolar ? -100 : 0
  const rangeMax = 100
  const rangeSpan = rangeMax - rangeMin
  
  const result: Marker[] = []
  for (let i = 0; i < totalMarkers; i++) {
    const position = (i / (totalMarkers - 1)) * 100 // Position in percentage (0% to 100%)
    const value = rangeMin + (position / 100) * rangeSpan // Actual value in user range
    
    let highlighted = false
    
    if (props.mode === 'reset') {
      // Reset mode: highlight only the marker closest to the reset value
      const distanceToValue = Math.abs(value - props.value)
      const tolerance = 1
      highlighted = distanceToValue <= tolerance
    } else {
      // Range mode: highlight markers near min or max
      const distanceToMin = Math.abs(value - props.min)
      const distanceToMax = Math.abs(value - props.max)
      const tolerance = 6
      highlighted = distanceToMin <= tolerance || distanceToMax <= tolerance
    }
    
    result.push({
      position,
      value,
      highlighted
    })
  }
  return result
})

// Generate labels based on polarity
const labels = computed<Label[]>(() => {
  if (props.isBipolar) {
    return [
      { value: -100, position: 0, text: '-100' },
      { value: -50, position: 25, text: '-50' },
      { value: 0, position: 50, text: '0' },
      { value: 50, position: 75, text: '50' },
      { value: 100, position: 100, text: '100' }
    ]
  } else {
    return [
      { value: 0, position: 0, text: '0' },
      { value: 25, position: 25, text: '25' },
      { value: 50, position: 50, text: '50' },
      { value: 75, position: 75, text: '75' },
      { value: 100, position: 100, text: '100' }
    ]
  }
})
</script>

<style scoped>
.level-meter {
  width: 100%;
  padding: 0.5rem 0 0.5rem;
  position: relative;
}

.markers-container {
  position: relative;
  height: 13px;
  width: 100%;
  margin-bottom: 1rem;
  cursor: pointer;
  user-select: none;
}

.dot {
  position: absolute;
  width: 5px;
  height: 5px;
  background: var(--accent-highlight);
  border-radius: 50%;
  transform: translateX(-50%) translateY(4px);
  transition: opacity 0.2s ease;
}

.triangle {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 3.5px solid transparent;
  border-right: 3.5px solid transparent;
  border-bottom: 9px solid #4A4A4A;
  transform: translateX(-50%);
  opacity: 0.3;
}

.triangle.highlighted {
  border-bottom-color: var(--accent-highlight);
  opacity: 1;
}

.labels-container {
  position: relative;
  width: 100%;
  height: 20px;
}

.label {
  position: absolute;
  transform: translateX(-50%);
  font-family: 'Roboto Mono';
  font-size: 0.8125rem; /* 13px */
  color: var(--color-text-muted);
  white-space: nowrap;
}

/* Adjust first and last labels to prevent overflow */
.label:first-child {
  transform: translateX(0);
}

.label:last-child {
  transform: translateX(-100%);
}

@media (max-width: 768px) {
  .level-meter {
    padding: 0.75rem 0 0.5rem;
  }
  
  .dots-container {
    margin-bottom: 0.75rem;
  }
}
</style>
