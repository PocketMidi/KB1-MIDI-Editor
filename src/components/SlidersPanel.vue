<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { Parameter } from './SettingsPanel.vue';
import SliderControl from './SliderControl.vue';
import { midiBle } from '../services/midiBle';
import { PresetStore } from '../state/presets';
import SnapshotBar from './SnapshotBar.vue';
import GroupMorph from './GroupMorph.vue';

const props = defineProps<{
  liveMode?: boolean;
}>();

const emit = defineEmits<{
  enterLiveMode: [];
}>();

const ALL_PARAMS_KEY = 'kb1.availableParams';
const SELECTED_KEY = 'kb1.selectedParams';
const VALUES_KEY = 'kb1.sliderValues';

const availableParams = ref<Parameter[]>([]);
const selectedIds = ref<string[]>([]);
const values = ref<Record<string, number>>({});
const locked = ref<Record<string, boolean>>({});
const connected = ref<boolean>(false);
const fineMode = ref<boolean>(false);

onMounted(() => {
  const storedParams = localStorage.getItem(ALL_PARAMS_KEY);
  const storedSelected = localStorage.getItem(SELECTED_KEY);
  const storedValues = localStorage.getItem(VALUES_KEY);

  if (storedParams) {
    availableParams.value = JSON.parse(storedParams);
  }
  if (storedSelected) {
    selectedIds.value = JSON.parse(storedSelected);
  }
  if (storedValues) {
    values.value = JSON.parse(storedValues);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
});

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Shift') {
    fineMode.value = true;
  }
}

function onKeyUp(e: KeyboardEvent) {
  if (e.key === 'Shift') {
    fineMode.value = false;
  }
}

const selectedParams = computed(() => {
  return availableParams.value.filter((p) => selectedIds.value.includes(p.id));
});

function mapUiToCc(uiValue: number, p: Parameter): number {
  const curve = p.settings?.curve ?? 'linear';
  const invert = p.settings?.invert ?? false;
  const ratioRaw = (uiValue - p.min) / (p.max - p.min);
  let ratio = Math.min(1, Math.max(0, ratioRaw));

  if (curve === 'log') {
    ratio = Math.log1p(ratio * 9) / Math.log1p(9);
  }
  if (curve === 'exp') {
    ratio = Math.pow(ratio, 2);
  }
  if (invert) {
    ratio = 1 - ratio;
  }

  return Math.round(ratio * 127);
}

async function onChangeValue(param: Parameter, newValue: number) {
  if (locked.value[param.id]) {
    return;
  }

  values.value = { ...values.value, [param.id]: newValue };
  localStorage.setItem(VALUES_KEY, JSON.stringify(values.value));

  try {
    await midiBle.sendControlChange(param.cc, mapUiToCc(newValue, param));
  } catch (e) {
    console.error('Failed to send CC', e);
  }
}

async function connect() {
  try {
    await midiBle.connect();
    connected.value = true;
  } catch (e) {
    console.error('BLE connect failed', e);
    connected.value = false;
  }
}

async function disconnect() {
  await midiBle.disconnect();
  connected.value = false;
}

function saveSnapshotLast() {
  PresetStore.saveSnapshot('last', values.value);
}

function resetToPrevious() {
  const snap = PresetStore.loadSnapshot('last');
  if (!snap) {
    return;
  }

  values.value = snap;

  // Send CC messages for all selected parameters
  (async () => {
    for (const p of selectedParams.value) {
      const val = snap[p.id] ?? p.defaultValue;
      await midiBle.sendControlChange(p.cc, mapUiToCc(val, p));
    }
  })();
}

function toggleLock(id: string) {
  locked.value = { ...locked.value, [id]: !locked.value[id] };
}

function centerValue(p: Parameter) {
  const center = Math.round((p.min + p.max) / 2);
  onChangeValue(p, center);
}

function calculateStep(param: Parameter, isFineMode: boolean): number {
  const baseStep = param.step ?? Math.max(1, Math.round((param.max - param.min) / 100));
  return isFineMode ? Math.max(1, Math.round(baseStep / 5)) : baseStep;
}

function handleSnapshotRecall(snap: Record<string, number>) {
  values.value = snap;
}

function handleGroupMorphSetValues(next: Record<string, number>) {
  values.value = next;
  
  // Send CC messages for all selected parameters
  (async () => {
    for (const p of selectedParams.value) {
      const val = next[p.id] ?? p.defaultValue;
      await midiBle.sendControlChange(p.cc, mapUiToCc(val, p));
    }
  })();
}

</script>

<template>
  <div>
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px">
      <h2 style="margin-right: auto">{{ liveMode ? 'Live' : 'Sliders' }}</h2>
      <button @click="connected ? disconnect() : connect()">
        {{ connected ? 'Disconnect KB1' : 'Connect KB1' }}
      </button>
      <template v-if="!liveMode">
        <button @click="saveSnapshotLast">Save Snapshot</button>
        <button @click="resetToPrevious">Reset to Previous</button>
        <button @click="$emit('enterLiveMode')">Enter Live Mode</button>
      </template>
    </div>

    <SnapshotBar
      v-if="!liveMode"
      :current-values="values"
      @recall="handleSnapshotRecall"
    />

    <GroupMorph
      v-if="!liveMode"
      :selected-params="selectedParams"
      :values="values"
      @set-values="handleGroupMorphSetValues"
    />

    <p v-if="selectedParams.length === 0" style="color: #6b7280">
      Select parameters in the Settings panel to show sliders here.
    </p>
    <div v-else :class="['slider-grid', { 'slider-grid-live': liveMode }]">
      <SliderControl
        v-for="p in selectedParams"
        :key="p.id"
        :parameter="p"
        :value="values[p.id] ?? p.defaultValue"
        :step="calculateStep(p, fineMode)"
        :locked="!!locked[p.id]"
        @lock="toggleLock(p.id)"
        @center="centerValue(p)"
        @change="(val) => onChangeValue(p, val)"
      />
    </div>

    <p v-if="!liveMode" style="color: #6b7280; margin-top: 12px">
      Sliders are real-time only controls. No "load from device".
    </p>
  </div>
</template>
