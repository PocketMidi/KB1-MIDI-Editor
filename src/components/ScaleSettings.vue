<template>
  <div class="settings-scale">
    <div class="title">
      <h2>{{ title }}</h2>
    </div>

    <div class="inputs">
      <div class="group">
        <label for="scale-scaletype">Scale</label>
        <select id="scale-scaletype" v-model.number="model.scaleType">
          <option v-for="opt in scales" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="group">
        <label for="scale-rootnote">Root Note</label>
        <select id="scale-rootnote" v-model.number="model.rootNote">
          <option v-for="opt in rootNotes" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type ScaleModel = {
  scaleType: number
  rootNote: number
}

const props = defineProps<{
  title?: string
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
</script>

<style scoped>
.settings-scale {
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

.inputs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
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

.group select {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 1rem;
}

.group select:focus {
  outline: none;
  border-color: var(--color-border-hover);
}
</style>