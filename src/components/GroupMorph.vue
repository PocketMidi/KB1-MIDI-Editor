<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Parameter } from './SettingsPanel.vue';
import { PresetStore } from '../state/presets';

const props = defineProps<{
  selectedParams: Parameter[];
  values: Record<string, number>;
}>();

const emit = defineEmits<{
  setValues: [next: Record<string, number>];
}>();

const mix = ref<number>(0);

const morphA = computed(() => PresetStore.loadSnapshot('morph-A') ?? {});
const morphB = computed(() => PresetStore.loadSnapshot('morph-B') ?? {});

function captureA() {
  PresetStore.saveSnapshot('morph-A', props.values);
}

function captureB() {
  PresetStore.saveSnapshot('morph-B', props.values);
}

function applyMorph(t: number) {
  const next: Record<string, number> = { ...props.values };
  props.selectedParams.forEach((p) => {
    const a = morphA.value[p.id] ?? props.values[p.id] ?? p.defaultValue;
    const b = morphB.value[p.id] ?? props.values[p.id] ?? p.defaultValue;
    const weight = p.morphAmount ?? 1;
    next[p.id] = Math.round(a + (b - a) * (t / 100) * weight);
  });
  emit('setValues', next);
}

function handleMorphChange(e: Event) {
  const t = Number((e.target as HTMLInputElement).value);
  mix.value = t;
  applyMorph(t);
}
</script>

<template>
  <div style="display: grid; gap: 8px">
    <div style="display: flex; gap: 8px">
      <button @click="captureA">Capture A</button>
      <button @click="captureB">Capture B</button>
    </div>
    <label style="display: flex; gap: 8px; align-items: center">
      Morph:
      <input
        type="range"
        min="0"
        max="100"
        :value="mix"
        @input="handleMorphChange"
      />
    </label>
  </div>
</template>
