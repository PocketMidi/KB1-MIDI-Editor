<template>
  <div class="settings-system">
    <div class="inputs">
      <div class="group">
        <label for="light-sleep">LIGHT SLEEP</label>
        <span class="time-display">{{ formatTime(model.lightSleepTimeout) }}</span>
        <ValueControl
          v-model="model.lightSleepTimeout"
          :min="30"
          :max="lightSleepMax"
          :step="5"
          :small-step="15"
          :large-step="30"
          unit="s"
        />
      </div>
      <div class="input-divider"></div>

      <div class="group">
        <label for="deep-sleep">DEEP SLEEP</label>
        <span class="time-display">{{ formatTime(model.deepSleepTimeout) }}</span>
        <ValueControl
          v-model="model.deepSleepTimeout"
          :min="deepSleepMin"
          :max="deepSleepMax"
          :step="30"
          :small-step="60"
          :large-step="300"
          unit="s"
        />
      </div>
      <div class="input-divider"></div>

      <div class="group">
        <label for="ble-timeout">BT CONNECTION</label>
        <span class="time-display">{{ formatTime(model.bleTimeout) }}</span>
        <ValueControl
          v-model="model.bleTimeout"
          :min="btConnectionMin"
          :max="600"
          :step="10"
          :small-step="30"
          :large-step="60"
          unit="s"
        />
      </div>
      
      <div class="hint-text">Timers: Light → Deep (+30s) → BT (+30s). Each must have 30s buffer from previous.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ValueControl from './ValueControl.vue'

type SystemModel = {
  lightSleepTimeout: number
  deepSleepTimeout: number
  bleTimeout: number
}

const props = defineProps<{
  modelValue: SystemModel
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: SystemModel): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

// Dynamic constraints to prevent conflicting timer values
// Light Sleep: max must be at least 30s before deep sleep
const lightSleepMax = computed(() => {
  const maxFromDeep = model.value.deepSleepTimeout - 30
  return Math.min(300, Math.max(30, maxFromDeep))
})

// Deep Sleep: min must be 30s+ after light sleep, max limited by BT connection - 30s
const deepSleepMin = computed(() => {
  return Math.max(120, model.value.lightSleepTimeout + 30)
})

const deepSleepMax = computed(() => {
  // Can't exceed BT connection timeout - 30s buffer
  const maxFromBle = model.value.bleTimeout - 30
  return Math.min(1800, Math.max(120, maxFromBle))
})

// BT Connection: must be at least 30s after deep sleep timeout
const btConnectionMin = computed(() => {
  return Math.max(30, model.value.deepSleepTimeout + 30)
})

// Format seconds into human-readable time (e.g., "1m 30s" or "45s")
const formatTime = (seconds: number): string => {
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs.toString().padStart(2, '0')}s`
  }
  return `${seconds}s`
}
</script>

<style scoped>
.settings-system {
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
  .settings-system {
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

.time-display {
  font-family: 'Roboto Mono';
  font-size: 0.8125rem; /* 13px */
  color: #EAEAEA;
  font-weight: 400;
  margin-right: auto;
  padding-left: 1rem;
}

.hint-text {
  font-size: 0.8125rem; /* 13px */
  font-style: italic;
  color: var(--color-text-muted);
  padding: 0.5rem 0 1rem 0;
  font-family: 'Roboto Mono';
}
</style>
