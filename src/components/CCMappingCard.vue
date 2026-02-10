<template>
  <div class="cc-mapping-card">
    <div class="card-header">
      <h3>Fader {{ mapping.faderIndex + 1 }}</h3>
    </div>
    
    <div class="card-body">
      <div class="form-group">
        <label :for="`cc-${mapping.faderIndex}`">CC Number</label>
        <input
          :id="`cc-${mapping.faderIndex}`"
          type="number"
          min="0"
          max="127"
          :value="mapping.ccNumber"
          @input="updateField('ccNumber', $event)"
          :disabled="disabled"
        />
      </div>
      
      <div class="form-group">
        <label :for="`channel-${mapping.faderIndex}`">MIDI Channel</label>
        <input
          :id="`channel-${mapping.faderIndex}`"
          type="number"
          min="1"
          max="16"
          :value="mapping.channel"
          @input="updateField('channel', $event)"
          :disabled="disabled"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CCMapping } from '../ble/kb1Protocol';

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

input[type="number"] {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.875rem;
}

input[type="number"]:focus {
  outline: none;
  border-color: var(--color-border-hover);
}

input[type="number"]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
