<template>
  <div class="settings-lever" :class="`lever-${lever}`">
    <div class="title">
      <h2>{{ title }} {{ lever }}</h2>
      <div v-if="isValidCC" class="parameter-header">
        <div class="parameter-name">{{ parameterDisplayName }}</div>
        <div v-if="parameterRange" class="parameter-range">{{ parameterRange }}</div>
        <div class="cc-reference">MIDI CC {{ model.ccNumber }}</div>
      </div>
    </div>

    <div class="inputs">
      <div class="group">
        <label :for="`lever-category-${lever}`">Category</label>
        <select :id="`lever-category-${lever}`" v-model="selectedCategory">
          <option v-for="cat in props.categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>

      <div class="group">
        <label :for="`lever-ccNumber-${lever}`">Parameter</label>
        <select :id="`lever-ccNumber-${lever}`" v-model.number="model.ccNumber">
          <option v-for="opt in filteredOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="group">
        <label :for="`lever-functionMode-${lever}`">Function Mode</label>
        <select :id="`lever-functionMode-${lever}`" v-model.number="model.functionMode">
          <option v-for="opt in functionModes" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div class="group">
        <label :for="`lever-valueMode-${lever}`">Mode</label>
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
        <label :for="`lever-relativeMin-${lever}`">Relative Min</label>
        <input type="text" :id="`lever-relativeMin-${lever}`" :value="relativeMin" readonly class="readonly-field" />
      </div>

      <div class="group">
        <label :for="`lever-relativeMax-${lever}`">Relative Max</label>
        <input type="text" :id="`lever-relativeMax-${lever}`" :value="relativeMax" readonly class="readonly-field" />
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
import { computed, ref, watch } from 'vue'
import { midiToRelative, type CCEntry } from '../data/ccMap'

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
  ccOptions: Array<{ value: number; label: string; group?: string }>
  ccMapByNumber: Map<number, CCEntry>
  categories: string[]
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

const isValidCC = computed(() => model.value.ccNumber >= 0 && model.value.ccNumber <= 128)

// Initialize selectedCategory from current ccNumber's category (fallback to first available category)
const initialCategory = computed(() => {
  const cat = props.ccMapByNumber.get(model.value.ccNumber)?.category
  return cat || props.categories[0] || 'Global'
})
const selectedCategory = ref<string>(initialCategory.value)

// Watch for ccMapByNumber changes to initialize category when map loads
watch(() => props.ccMapByNumber.size, () => {
  const cat = props.ccMapByNumber.get(model.value.ccNumber)?.category
  if (cat && cat !== selectedCategory.value) {
    selectedCategory.value = cat
  }
}, { immediate: true })

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

.readonly-field {
  background: var(--color-background-mute) !important;
  cursor: not-allowed;
  color: var(--color-text-muted);
}
</style>