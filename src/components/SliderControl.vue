<script setup lang="ts">
import { computed } from 'vue';
import type { Parameter } from './SettingsPanel.vue';

const props = defineProps<{
  parameter: Parameter;
  value: number;
  step: number;
  locked: boolean;
}>();

const emit = defineEmits<{
  lock: [];
  center: [];
  change: [value: number];
}>();

const percent = computed(() => {
  const r = (props.value - props.parameter.min) / (props.parameter.max - props.parameter.min);
  return Math.min(100, Math.max(0, Math.round(r * 100)));
});

function handleChange(e: Event) {
  emit('change', Number((e.target as HTMLInputElement).value));
}

function handleInput(e: Event) {
  emit('change', Number((e.target as HTMLInputElement).value));
}
</script>

<template>
  <div class="slider-item" @dblclick="$emit('center')">
    <div
      class="slider-bar"
      :style="{
        '--slider-color': parameter.color,
        '--slider-percent': `${percent}%`,
      }"
    >
      <input
        type="range"
        :min="parameter.min"
        :max="parameter.max"
        :step="step"
        :value="value"
        @change="handleChange"
        @input="handleInput"
        class="slider-range"
        :aria-label="parameter.label"
        :disabled="locked"
      />
      <button
        :class="['slider-lock', { locked: locked }]"
        type="button"
        @click.stop="$emit('lock')"
        :title="locked ? 'Unlock' : 'Lock'"
      >
        {{ locked ? '🔒' : '🔓' }}
      </button>
      <button
        class="slider-center"
        type="button"
        @click.stop="$emit('center')"
        title="Center"
      >
        ⊙
      </button>
    </div>
    <div class="slider-label">{{ parameter.label }}</div>
  </div>
</template>
