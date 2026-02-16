<template>
  <div class="level-meter">
    <!-- Dots container -->
    <div class="dots-container">
      <div 
        v-for="(dot, index) in dots" 
        :key="index"
        class="dot"
        :style="{ 
          left: `${dot.position}%`,
          opacity: dot.highlighted ? 1 : 0.4
        }"
      ></div>
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

const props = defineProps<{
  min: number
  max: number
  isBipolar: boolean
}>()

interface Dot {
  position: number
  value: number
  highlighted: boolean
}

interface Label {
  value: number
  position: number
  text: string
}

// Generate dots based on polarity
const dots = computed<Dot[]>(() => {
  const totalDots = 41 // Creates dots at every 5% interval (0, 2.5%, 5%, ... 100%)
  const rangeMin = props.isBipolar ? -100 : 0
  const rangeMax = 100
  const rangeSpan = rangeMax - rangeMin
  
  const result: Dot[] = []
  for (let i = 0; i < totalDots; i++) {
    const position = (i / (totalDots - 1)) * 100 // Position in percentage (0% to 100%)
    const value = rangeMin + (position / 100) * rangeSpan // Actual value in user range
    
    // Determine if this dot should be highlighted (closest to min or max)
    // Calculate distance to min and max values
    const distanceToMin = Math.abs(value - props.min)
    const distanceToMax = Math.abs(value - props.max)
    
    // Highlight if within 5 units of min or max (allowing for some tolerance)
    const tolerance = 6
    const highlighted = distanceToMin <= tolerance || distanceToMax <= tolerance
    
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
  padding: 1rem 0 0.5rem;
  position: relative;
}

.dots-container {
  position: relative;
  height: 5px;
  width: 100%;
  margin-bottom: 1rem;
}

.dot {
  position: absolute;
  width: 5px;
  height: 5px;
  background: #F9AC20;
  border-radius: 50%;
  transform: translateX(-50%);
  transition: opacity 0.2s ease;
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
