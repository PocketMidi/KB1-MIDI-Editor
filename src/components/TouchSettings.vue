<template>
  <div class="settings-touch">
    <div class="title">
      <h2>{{ title }}</h2>
      <div v-if="isValidCC">
        <span>MIDI CC</span>
        <span>{{ model.ccNumber }}</span>
      </div>
    </div>

    <div class="inputs">
      <div class="group">
        <label for="touch-ccNumber">Parameter</label>
        <select id="touch-ccNumber" v-model.number="model.ccNumber">
          <option v-for="opt in ccOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="group">
        <label for="touch-functionMode">Function Mode</label>
        <select id="touch-functionMode" v-model.number="model.functionMode">
          <option v-for="opt in functionModes" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="group">
        <label for="touch-maxCCValue">CC Max</label>
        <input type="number" id="touch-maxCCValue" v-model.number="model.maxCCValue" min="0" max="127" />
      </div>

      <div class="group">
        <label for="touch-minCCValue">CC Min</label>
        <input type="number" id="touch-minCCValue" v-model.number="model.minCCValue" min="0" max="127" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type TouchModel = {
  ccNumber: number
  minCCValue: number
  maxCCValue: number
  functionMode: number
}

const props = defineProps<{
  title?: string
  modelValue: TouchModel
  ccOptions: { value: number, label: string }[]
  functionModes: { value: number, label: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: TouchModel): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const isValidCC = computed(() => model.value.ccNumber >= 0 && model.value.ccNumber <= 127)
</script>

<style scoped>
.settings-touch {
  padding: 1.5rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.title h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.title div {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.title div span:last-child {
  font-weight: 600;
  color: #3b82f6;
}

.inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
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

.group input:focus,
.group select:focus {
  outline: none;
  border-color: var(--color-border-hover);
}
</style>