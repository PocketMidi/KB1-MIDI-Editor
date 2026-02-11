<script setup lang="ts">
import { PresetStore } from '../state/presets';

const props = defineProps<{
  currentValues: Record<string, number>;
}>();

const emit = defineEmits<{
  recall: [values: Record<string, number>];
}>();

const slots = ['A', 'B', 'C', 'D'];

function save(slot: string) {
  PresetStore.saveSnapshot(`slot-${slot}`, props.currentValues);
}

function recall(slot: string) {
  const snap = PresetStore.loadSnapshot(`slot-${slot}`);
  if (snap) {
    emit('recall', snap);
  }
}
</script>

<template>
  <div style="display: flex; gap: 8px; align-items: center">
    <span style="font-weight: 600">Snapshots:</span>
    <div
      v-for="s in slots"
      :key="s"
      style="display: flex; gap: 4px; align-items: center"
    >
      <button @click="save(s)" :title="`Save to ${s}`">Save {{ s }}</button>
      <button @click="recall(s)" :title="`Recall ${s}`">Recall {{ s }}</button>
    </div>
  </div>
</template>
