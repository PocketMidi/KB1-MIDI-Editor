<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

export type ValueMode = 'unipolar' | 'bipolar';
export type Parameter = {
  id: string;
  label: string;
  cc: number;
  min: number;
  max: number;
  step?: number;
  defaultValue: number;
  color: string;
  valueMode?: ValueMode;
  morphAmount?: number;
  settings?: { curve?: 'linear' | 'log' | 'exp'; invert?: boolean };
};

const DEFAULT_PARAMETERS: Parameter[] = [
  { id: 'volume', label: 'Volume', cc: 7, min: 0, max: 127, defaultValue: 80, color: '#F97316', valueMode: 'unipolar', morphAmount: 1 },
  { id: 'pan', label: 'Panning', cc: 10, min: -64, max: 64, defaultValue: 0, color: '#A16207', valueMode: 'bipolar', morphAmount: 0.8 },
  { id: 'tune', label: 'Tune', cc: 1, min: -100, max: 100, defaultValue: 0, color: '#6B4423', valueMode: 'bipolar', morphAmount: 0.5 },
  { id: 'lowpass', label: 'Low Pass', cc: 74, min: 0, max: 127, defaultValue: 40, color: '#10B981', valueMode: 'unipolar', morphAmount: 1 },
  { id: 'highpass', label: 'High Pass', cc: 71, min: 0, max: 127, defaultValue: 20, color: '#0EA5E9', valueMode: 'unipolar', morphAmount: 1 },
  { id: 'delay', label: 'Delay', cc: 12, min: 0, max: 100, defaultValue: 25, color: '#7C3AED', valueMode: 'unipolar', morphAmount: 0.6 },
  { id: 'reverb', label: 'Reverb', cc: 91, min: 0, max: 100, defaultValue: 40, color: '#8B5CF6', valueMode: 'unipolar', morphAmount: 0.7 },
  { id: 'position', label: 'Position', cc: 16, min: 0, max: 100, defaultValue: 15, color: '#A78BFA', valueMode: 'unipolar', morphAmount: 0.4 },
  { id: 'playback', label: 'Playback', cc: 17, min: 0, max: 100, defaultValue: 50, color: '#C084FC', valueMode: 'unipolar', morphAmount: 0.6 },
  { id: 'volLfo', label: 'Volume LFO', cc: 18, min: 0, max: 100, defaultValue: 20, color: '#D946EF', valueMode: 'unipolar', morphAmount: 0.5 },
];

const ALL_PARAMS_KEY = 'kb1.availableParams';
const SELECTED_KEY = 'kb1.selectedParams';

const availableParams = ref<Parameter[]>([]);
const selectedIds = ref<string[]>([]);

onMounted(() => {
  const storedParams = localStorage.getItem(ALL_PARAMS_KEY);
  const storedSelected = localStorage.getItem(SELECTED_KEY);

  if (storedParams) {
    availableParams.value = JSON.parse(storedParams);
  } else {
    availableParams.value = DEFAULT_PARAMETERS;
    localStorage.setItem(ALL_PARAMS_KEY, JSON.stringify(DEFAULT_PARAMETERS));
  }

  if (storedSelected) {
    selectedIds.value = JSON.parse(storedSelected);
  }
});

watch(selectedIds, (newValue) => {
  localStorage.setItem(SELECTED_KEY, JSON.stringify(newValue));
}, { deep: true });

function toggleParam(id: string) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((x) => x !== id);
  } else {
    selectedIds.value = [...selectedIds.value, id];
  }
}

function updateParam(id: string, updater: (p: Parameter) => Parameter) {
  const next = availableParams.value.map((ap) => (ap.id === id ? updater(ap) : ap));
  availableParams.value = next;
  localStorage.setItem(ALL_PARAMS_KEY, JSON.stringify(next));
}
</script>

<template>
  <div>
    <h2>Settings</h2>
    <div style="display: grid; gap: 6px">
      <label
        v-for="p in availableParams"
        :key="p.id"
        :style="{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 8px',
          borderRadius: '6px',
          background: selectedIds.includes(p.id) ? '#eef2ff' : '#f9fafb',
          border: '1px solid #e5e7eb',
        }"
      >
        <input
          type="checkbox"
          :checked="selectedIds.includes(p.id)"
          @change="toggleParam(p.id)"
        />
        <span style="font-weight: 500">{{ p.label }}</span>
      </label>
    </div>
    <div style="margin-top: 16px">
      <h3>Parameter Settings</h3>
      <details
        v-for="p in availableParams.filter((p) => selectedIds.includes(p.id))"
        :key="p.id"
        style="margin-bottom: 10px"
      >
        <summary>{{ p.label }} advanced settings</summary>
        <div
          style="
            padding: 8px 12px;
            border: 1px dashed #e5e7eb;
            border-radius: 6px;
          "
        >
          <div style="display: grid; gap: 8px">
            <label style="display: flex; gap: 8px; align-items: center">
              Curve:
              <select
                :value="p.settings?.curve ?? 'linear'"
                @change="
                  (e) =>
                    updateParam(p.id, (ap) => ({
                      ...ap,
                      settings: {
                        ...(ap.settings ?? {}),
                        curve: (e.target as HTMLSelectElement).value as any,
                      },
                    }))
                "
              >
                <option value="linear">Linear</option>
                <option value="log">Log</option>
                <option value="exp">Exp</option>
              </select>
            </label>
            <label style="display: flex; gap: 8px; align-items: center">
              <input
                type="checkbox"
                :checked="p.settings?.invert ?? false"
                @change="
                  (e) =>
                    updateParam(p.id, (ap) => ({
                      ...ap,
                      settings: {
                        ...(ap.settings ?? {}),
                        invert: (e.target as HTMLInputElement).checked,
                      },
                    }))
                "
              />
              Invert
            </label>
            <label style="display: flex; gap: 8px; align-items: center">
              Mode:
              <select
                :value="p.valueMode ?? 'unipolar'"
                @change="
                  (e) =>
                    updateParam(p.id, (ap) => ({
                      ...ap,
                      valueMode: (e.target as HTMLSelectElement).value as any,
                    }))
                "
              >
                <option value="unipolar">Unipolar</option>
                <option value="bipolar">Bipolar</option>
              </select>
            </label>
            <label style="display: flex; gap: 8px; align-items: center">
              Morph Amount:
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                :value="p.morphAmount ?? 1"
                @input="
                  (e) =>
                    updateParam(p.id, (ap) => ({
                      ...ap,
                      morphAmount: Math.max(
                        0,
                        Math.min(1, Number((e.target as HTMLInputElement).value))
                      ),
                    }))
                "
              />
            </label>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>
