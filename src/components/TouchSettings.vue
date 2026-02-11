<template>
  <div class="settings-touch">
    <div class="title">
      <h2>{{ title }}</h2>
      <div v-if="isValidCC" class="parameter-header">
        <div class="parameter-name">{{ parameterDisplayName }}</div>
        <div v-if="parameterRange" class="parameter-range">{{ parameterRange }}</div>
        <div class="cc-reference">MIDI CC {{ model.ccNumber }}</div>
      </div>
    </div>

    <div class="inputs">
      <div class="group">
        <label for="touch-category">Category</label>
        <select id="touch-category" v-model="selectedCategory">
          <option v-for="cat in props.categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>

      <div class="group">
        <label for="touch-ccNumber">Parameter</label>
        <select id="touch-ccNumber" v-model.number="model.ccNumber">
          <option v-for="opt in filteredOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
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

      <div class="group">
        <label for="touch-relativeMin">Relative Min</label>
        <input type="text" id="touch-relativeMin" :value="relativeMin" readonly class="readonly-field" />
      </div>

      <div class="group">
        <label for="touch-relativeMax">Relative Max</label>
        <input type="text" id="touch-relativeMax" :value="relativeMax" readonly class="readonly-field" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { midiToRelative, type CCEntry } from '../data/ccMap'

type TouchModel = {
  ccNumber: number
  minCCValue: number
  maxCCValue: number
  functionMode: number
}

const props = defineProps<{
  title?: string
  modelValue: TouchModel
  ccOptions: Array<{ value: number; label: string; group?: string }>
  ccMapByNumber: Map<number, CCEntry>
  categories: string[]
  functionModes: { value: number, label: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: TouchModel): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const isValidCC = computed(() => model.value.ccNumber >= 0 && model.value.ccNumber <= 128)

// Initialize selectedCategory from current ccNumber's category (fallback to "Global")
const initialCategory = props.ccMapByNumber.get(model.value.ccNumber)?.category ?? 'Global'
const selectedCategory = ref<string>(initialCategory)

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

// Get current parameter entry from ccMapByNumber
const currentEntry = computed(() => {
  return props.ccMapByNumber.get(model.value.ccNumber)
})

// Display parameter name or fallback to CC number
const parameterDisplayName = computed(() => {
  const entry = currentEntry.value
  if (entry) {
    return entry.parameter
  }
  return `CC ${model.value.ccNumber}`
})

// Display Polyend range if available
const parameterRange = computed(() => {
  const entry = currentEntry.value
  if (entry?.range) {
    return entry.range.text
  }
  return undefined
})

// Compute relative min value
const relativeMin = computed(() => {
  const entry = currentEntry.value
  if (!entry?.range) {
    return '—'
  }
  const value = midiToRelative(
    model.value.minCCValue,
    entry.range.min,
    entry.range.max
  )
  return String(value)
})

// Compute relative max value
const relativeMax = computed(() => {
  const entry = currentEntry.value
  if (!entry?.range) {
    return '—'
  }
  const value = midiToRelative(
    model.value.maxCCValue,
    entry.range.min,
    entry.range.max
  )
  return String(value)
})
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

.parameter-header {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  font-size: 0.875rem;
}

.parameter-name {
  font-weight: 600;
  color: var(--color-text);
}

.parameter-range {
  color: var(--color-text-muted);
  font-style: italic;
}

.cc-reference {
  color: var(--color-text-muted);
  font-size: 0.75rem;
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

.readonly-field {
  background: var(--color-background-mute) !important;
  cursor: not-allowed;
  color: var(--color-text-muted);
}
</style>