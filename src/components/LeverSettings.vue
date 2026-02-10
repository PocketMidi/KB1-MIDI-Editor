<template>
  <div class="settings-lever" :class="`lever-${lever}`">
    <div class="title">
      <h2>{{ title }} {{ lever }}</h2>
      <div v-if="isValidCC">
        <span>MIDI CC</span>
        <span>{{ model.ccNumber }}</span>
      </div>
    </div>

    <div class="inputs">
      <div class="group">
        <label :for="`lever-ccNumber-${lever}`">Parameter</label>
        <select :id="`lever-ccNumber-${lever}`" v-model.number="model.ccNumber">
          <option v-for="opt in ccOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="group">
        <label :for="`lever-functionMode-${lever}`">Function Mode</label>
        <select :id="`lever-functionMode-${lever}`" v-model.number="model.functionMode">
          <option v-for="opt in functionModes" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="group">
        <label :for="`lever-valueMode-${lever}`">Value Mode</label>
        <select :id="`lever-valueMode-${lever}`" v-model.number="model.valueMode">
          <option v-for="opt in valueModes" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="group">
        <label :for="`lever-stepSize-${lever}`">Steps</label>
        <input type="number" :id="`lever-stepSize-${lever}`" v-model.number="model.stepSize" min="1" max="127" />
      </div>

      <div class="group">
        <label :for="`lever-maxCCValue-${lever}`">CC Max</label>
        <input type="number" :id="`lever-maxCCValue-${lever}`" v-model.number="model.maxCCValue" min="0" max="127" />
      </div>

      <div class="group">
        <label :for="`lever-minCCValue-${lever}`">CC Min</label>
        <input type="number" :id="`lever-minCCValue-${lever}`" v-model.number="model.minCCValue" min="0" max="127" />
      </div>

      <div class="group">
        <label :for="`lever-onsetType-${lever}`">Attack Type</label>
        <select :id="`lever-onsetType-${lever}`" v-model.number="model.onsetType">
          <option v-for="opt in interpolations" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="group">
        <label :for="`lever-onsetTime-${lever}`">Attack Time</label>
        <div class="number-with-unit">
          <input type="number" :id="`lever-onsetTime-${lever}`" v-model.number="model.onsetTime" min="0" max="10000" step="10" />
          <span>ms</span>
        </div>
      </div>

      <div class="group">
        <label :for="`lever-offsetType-${lever}`">Decay Type</label>
        <select :id="`lever-offsetType-${lever}`" v-model.number="model.offsetType">
          <option v-for="opt in interpolations" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="group">
        <label :for="`lever-offsetTime-${lever}`">Decay Time</label>
        <div class="number-with-unit">
          <input type="number" :id="`lever-offsetTime-${lever}`" v-model.number="model.offsetTime" min="0" max="10000" step="10" />
          <span>ms</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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
  ccOptions: { value: number, label: string }[]
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

const isValidCC = computed(() => model.value.ccNumber >= 0 && model.value.ccNumber <= 127)
</script>

<style scoped>
.settings-lever {
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
</style>