<template>
  <div class="cc-mapping-card">
    <div class="card-header">
      <h3>Fader {{ mapping.faderIndex + 1 }}</h3>
      <div v-if="currentEntry" class="parameter-info">
        {{ currentEntry.parameter }}
        <span v-if="currentEntry.range" class="range-text">
          ({{ currentEntry.range.text }})
        </span>
      </div>
    </div>
    
    <div class="card-body">
      <div class="form-group">
        <label :for="`param-${mapping.faderIndex}`">Parameter</label>
        <select
          :id="`param-${mapping.faderIndex}`"
          :value="mapping.ccNumber"
          @change="updateParameter"
          :disabled="disabled || !ccMapLoaded"
        >
          <option v-if="!ccMapLoaded" value="" disabled>
            {{ ccMapError ? 'Failed to load parameters' : 'Loading parameters...' }}
          </option>
          <optgroup
            v-for="group in ccGroups"
            :key="group.category"
            :label="group.category"
          >
            <option
              v-for="entry in group.entries"
              :key="entry.ccNumber"
              :value="entry.ccNumber"
            >
              {{ entry.parameter }} (CC {{ entry.ccNumber }})
            </option>
          </optgroup>
        </select>
      </div>
      
      <div class="form-group">
        <label :for="`cc-${mapping.faderIndex}`">CC Number</label>
        <input
          :id="`cc-${mapping.faderIndex}`"
          type="number"
          min="0"
          max="127"
          :value="mapping.ccNumber"
          readonly
          disabled
        />
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label :for="`min-${mapping.faderIndex}`">Min Value</label>
          <input
            :id="`min-${mapping.faderIndex}`"
            type="number"
            min="0"
            max="127"
            :value="mapping.minValue"
            @input="updateField('minValue', $event)"
            :disabled="disabled"
          />
        </div>
        
        <div class="form-group">
          <label :for="`max-${mapping.faderIndex}`">Max Value</label>
          <input
            :id="`max-${mapping.faderIndex}`"
            type="number"
            min="0"
            max="127"
            :value="mapping.maxValue"
            @input="updateField('maxValue', $event)"
            :disabled="disabled"
          />
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label :for="`rel-min-${mapping.faderIndex}`">Relative Min</label>
          <input
            :id="`rel-min-${mapping.faderIndex}`"
            type="text"
            :value="relativeMin"
            readonly
            disabled
          />
        </div>
        
        <div class="form-group">
          <label :for="`rel-max-${mapping.faderIndex}`">Relative Max</label>
          <input
            :id="`rel-max-${mapping.faderIndex}`"
            type="text"
            :value="relativeMax"
            readonly
            disabled
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import type { CCMapping } from '../ble/kb1Protocol';
import {
  loadPolyendCCMap,
  getCCEntry,
  getCCGroups,
  isCCMapLoaded,
  getCCMapError,
  midiToRelative,
  type CCGroup,
} from '../data/ccMap';

interface Props {
  mapping: CCMapping;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  update: [mapping: CCMapping];
}>();

// Load CC map on mount
onMounted(async () => {
  try {
    await loadPolyendCCMap();
  } catch (error) {
    console.error('Failed to load CC map:', error);
  }
});

// Computed properties
const ccMapLoaded = computed(() => isCCMapLoaded());
const ccMapError = computed(() => getCCMapError());

// Group options by category for display
const ccGroups = computed<CCGroup[]>(() => {
  if (!ccMapLoaded.value) {
    return [];
  }
  
  // Get groups but reorder to ensure Global with Velocity is first
  const groups = getCCGroups();
  const globalGroup = groups.find(g => g.category === 'Global');
  const otherGroups = groups.filter(g => g.category !== 'Global');
  
  if (globalGroup) {
    // Ensure Velocity is first in Global
    const velocityEntry = globalGroup.entries.find(e => e.ccNumber === 128);
    const otherEntries = globalGroup.entries.filter(e => e.ccNumber !== 128);
    
    const reorderedGlobal = {
      ...globalGroup,
      entries: velocityEntry ? [velocityEntry, ...otherEntries] : otherEntries,
    };
    
    return [reorderedGlobal, ...otherGroups];
  }
  
  return groups;
});

const currentEntry = computed(() => getCCEntry(props.mapping.ccNumber));

const relativeMin = computed(() => {
  const entry = currentEntry.value;
  if (!entry?.range) {
    return '—';
  }
  const value = midiToRelative(
    props.mapping.minValue,
    entry.range.min,
    entry.range.max
  );
  return String(value);
});

const relativeMax = computed(() => {
  const entry = currentEntry.value;
  if (!entry?.range) {
    return '—';
  }
  const value = midiToRelative(
    props.mapping.maxValue,
    entry.range.min,
    entry.range.max
  );
  return String(value);
});

function updateParameter(event: Event) {
  const target = event.target as HTMLSelectElement;
  const ccNumber = parseInt(target.value, 10);
  
  if (isNaN(ccNumber)) return;
  
  emit('update', {
    ...props.mapping,
    ccNumber,
  });
}

function updateField(field: keyof CCMapping, event: Event) {
  const target = event.target as HTMLInputElement;
  const value = parseInt(target.value, 10);
  
  if (isNaN(value)) return;
  
  emit('update', {
    ...props.mapping,
    [field]: value,
  });
}
</script>

<style scoped>
.cc-mapping-card {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-background-soft);
}

.card-header {
  padding: 0.75rem 1rem;
  background: var(--color-background-mute);
  border-bottom: 1px solid var(--color-border);
}

.card-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.parameter-info {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-text-mute);
}

.range-text {
  color: var(--color-text-mute);
  font-style: italic;
}

.card-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

input[type="number"],
input[type="text"],
select {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.875rem;
}

input[type="number"]:focus,
input[type="text"]:focus,
select:focus {
  outline: none;
  border-color: var(--color-border-hover);
}

input[type="number"]:disabled,
input[type="text"]:disabled,
select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

select {
  cursor: pointer;
}

select:disabled {
  cursor: not-allowed;
}
</style>
