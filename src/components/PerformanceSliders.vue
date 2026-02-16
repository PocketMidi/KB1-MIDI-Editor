<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { midiBle } from '../services/midiBle';

// Slider configuration
interface SliderConfig {
  cc: number;
  zone: number;
  color: string;
  bipolar: boolean;
  momentary: boolean;
  value: number;
}

// Preset structure
interface Preset {
  sliders: SliderConfig[];
}

// Color zones configuration
const ZONE_COLORS = [
  { zone: 1, color: '#9400D3', name: 'Violet', ccStart: 51 },
  { zone: 2, color: '#0000FF', name: 'Blue', ccStart: 54 },
  { zone: 3, color: '#00FF00', name: 'Green', ccStart: 57 },
  { zone: 4, color: '#FF7F00', name: 'Orange', ccStart: 60 },
];

// Initialize sliders with default configuration
const PRESET_KEY = 'kb1.performanceSliders.preset';
const settingsVisible = ref(false);
const sliders = ref<SliderConfig[]>([]);
const dragging = ref<number | null>(null);
const isDragging = ref(false);

// Initialize sliders
function initializeSliders() {
  const savedPreset = localStorage.getItem(PRESET_KEY);
  if (savedPreset) {
    try {
      const preset: Preset = JSON.parse(savedPreset);
      sliders.value = preset.sliders;
      
      // Load settings visibility separately
      const savedVisibility = localStorage.getItem(PRESET_KEY + '.settingsVisible');
      if (savedVisibility) {
        settingsVisible.value = JSON.parse(savedVisibility);
      }
      return;
    } catch (e) {
      console.error('Failed to load saved preset', e);
    }
  }
  
  // Default configuration
  sliders.value = [];
  for (let i = 0; i < 12; i++) {
    const zone = Math.floor(i / 3) + 1;
    const zoneColor = ZONE_COLORS.find(z => z.zone === zone);
    sliders.value.push({
      cc: 51 + i,
      zone,
      color: zoneColor?.color || '#9400D3',
      bipolar: false,
      momentary: false,
      value: 0,
    });
  }
}

onMounted(() => {
  initializeSliders();
});

// Group sliders by zone
const slidersByZone = computed(() => {
  const groups: Record<number, SliderConfig[]> = {};
  for (let i = 1; i <= 4; i++) {
    groups[i] = sliders.value.filter(s => s.zone === i);
  }
  return groups;
});

// Map slider value to CC value (0-127)
function valueToCC(slider: SliderConfig): number {
  if (slider.bipolar) {
    // Bipolar: -100 to +100 maps to 0-127
    return Math.round(((slider.value + 100) / 200) * 127);
  } else {
    // Unipolar: 0 to +100 maps to 0-127
    return Math.round((slider.value / 100) * 127);
  }
}

// Map CC value (0-127) back to slider value (unused for now, reserved for future use)
// function ccToValue(cc: number, bipolar: boolean): number {
//   if (bipolar) {
//     // 0-127 maps to -100 to +100
//     return Math.round((cc / 127) * 200 - 100);
//   } else {
//     // 0-127 maps to 0 to +100
//     return Math.round((cc / 127) * 100);
//   }
// }

// Get default value based on mode (always 0 for both bipolar center and unipolar bottom)
function getDefaultValue(_slider: SliderConfig): number {
  return 0;
}

// Handle slider change with optional flag to skip save
async function handleSliderChange(index: number, newValue: number, skipSave = false) {
  const slider = sliders.value[index];
  if (!slider) return;
  
  slider.value = newValue;
  
  // Send MIDI CC
  try {
    const ccValue = valueToCC(slider);
    await midiBle.sendControlChange(slider.cc, ccValue);
  } catch (e) {
    console.error('Failed to send CC', e);
  }
  
  // Only save preset when explicitly requested (not during animations)
  if (!skipSave) {
    savePreset();
  }
}

// Handle slider mouse down
function handleMouseDown(index: number) {
  dragging.value = index;
  isDragging.value = true;
}

// Handle slider mouse up (for momentary behavior)
function handleMouseUp(index: number) {
  isDragging.value = false;
  const slider = sliders.value[index];
  if (!slider) return;
  
  if (slider.momentary && dragging.value === index) {
    // Spring back to default with smooth animation
    const defaultValue = getDefaultValue(slider);
    
    // Animate the spring-back over 300ms
    const startValue = slider.value;
    const startTime = performance.now();
    const duration = 300; // ms
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic curve for natural spring feel
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (defaultValue - startValue) * easeOut;
      
      // Skip save during animation frames, only MIDI updates
      handleSliderChange(index, Math.round(currentValue), true);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Save preset only at the end of animation
        savePreset();
      }
    };
    
    requestAnimationFrame(animate);
  }
  
  dragging.value = null;
}

// Handle double-click reset (LAT mode only)
function handleDoubleClick(index: number) {
  const slider = sliders.value[index];
  if (!slider) return;
  
  if (!slider.momentary) {
    const defaultValue = getDefaultValue(slider);
    handleSliderChange(index, defaultValue);
  }
}

// Toggle bipolar/unipolar
function toggleBipolar(index: number) {
  const slider = sliders.value[index];
  if (!slider) return;
  
  slider.bipolar = !slider.bipolar;
  
  // Reset to appropriate default when switching modes
  slider.value = getDefaultValue(slider);
  
  // Send MIDI update
  handleSliderChange(index, slider.value);
}

// Toggle momentary/latching
function toggleMomentary(index: number) {
  const slider = sliders.value[index];
  if (!slider) return;
  
  slider.momentary = !slider.momentary;
  savePreset();
}

// Toggle settings visibility
function toggleSettings() {
  settingsVisible.value = !settingsVisible.value;
  savePreset();
}

// Save preset to localStorage
function savePreset() {
  const preset: Preset = {
    sliders: sliders.value,
  };
  localStorage.setItem(PRESET_KEY, JSON.stringify(preset));
  
  // Also save settings visibility separately
  localStorage.setItem(PRESET_KEY + '.settingsVisible', JSON.stringify(settingsVisible.value));
}

// Load preset (placeholder for future implementation)
function loadPreset() {
  initializeSliders();
}

// Calculate slider percentage for visual display
function getSliderPercent(slider: SliderConfig): number {
  if (slider.bipolar) {
    // -100 to +100 maps to 0-100%
    return ((slider.value + 100) / 200) * 100;
  } else {
    // 0 to +100 maps to 0-100%
    return slider.value;
  }
}
</script>

<template>
  <div class="performance-sliders">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <h2>Performance FX Control</h2>
      </div>
      <div class="header-right">
        <button class="btn-settings" @click="toggleSettings">
          ⚙️ SETTINGS {{ settingsVisible ? '▲' : '▼' }}
        </button>
        <button class="btn-action" @click="savePreset">SAVE</button>
        <button class="btn-action" @click="loadPreset">LOAD</button>
      </div>
    </div>
    
    <!-- Main sliders container -->
    <div class="sliders-container">
      <div 
        v-for="zoneNum in [1, 2, 3, 4]" 
        :key="zoneNum"
        class="zone-group"
      >
        <!-- Color bar -->
        <div 
          class="color-bar"
          :style="{ backgroundColor: ZONE_COLORS.find(z => z.zone === zoneNum)?.color || '#9400D3' }"
        ></div>
        
        <!-- Sliders in this zone -->
        <div class="sliders-row">
          <div 
            v-for="slider in slidersByZone[zoneNum]"
            :key="slider.cc"
            class="slider-wrapper"
          >
            <div 
              class="slider-track"
              @dblclick="handleDoubleClick(sliders.indexOf(slider))"
            >
              <!-- Center marker for bipolar mode -->
              <div 
                v-if="slider.bipolar"
                class="center-marker"
              ></div>
              
              <!-- Slider fill -->
              <div 
                class="slider-fill"
                :style="{
                  height: `${getSliderPercent(slider)}%`,
                  backgroundColor: slider.color,
                }"
              ></div>
              
              <!-- Slider input -->
              <input
                type="range"
                class="slider-input"
                :min="slider.bipolar ? -100 : 0"
                :max="100"
                :value="slider.value"
                @input="handleSliderChange(sliders.indexOf(slider), Number(($event.target as HTMLInputElement).value))"
                @mousedown="handleMouseDown(sliders.indexOf(slider))"
                @mouseup="handleMouseUp(sliders.indexOf(slider))"
                @touchstart="handleMouseDown(sliders.indexOf(slider))"
                @touchend="handleMouseUp(sliders.indexOf(slider))"
              />
            </div>
            
            <!-- CC label (only visible in settings mode) -->
            <div v-if="settingsVisible" class="cc-label">CC {{ slider.cc }}</div>
          </div>
        </div>
        
        <!-- Settings bar (accordion) -->
        <transition name="settings-slide">
          <div v-if="settingsVisible" class="settings-bar">
            <div 
              v-for="slider in slidersByZone[zoneNum]"
              :key="slider.cc"
              class="settings-cell"
            >
              <button 
                class="setting-label"
                :class="{ active: slider.bipolar }"
                @click="toggleBipolar(sliders.indexOf(slider))"
              >
                {{ slider.bipolar ? 'BI' : 'UNI' }}
              </button>
              <button 
                class="setting-label"
                :class="{ active: slider.momentary }"
                @click="toggleMomentary(sliders.indexOf(slider))"
              >
                {{ slider.momentary ? 'MOM' : 'LAT' }}
              </button>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.performance-sliders {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-background, #1a1a1a);
  color: var(--color-text, #ffffff);
  padding: 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border, #3a3a3a);
}

.header-left h2 {
  margin: 0;
  font-size: 0.8125rem; /* 13px */
  font-weight: 600;
}

.header-right {
  display: flex;
  gap: 0.75rem;
}

.btn-settings,
.btn-action {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border, #3a3a3a);
  border-radius: 6px;
  background: var(--color-background-soft, #242424);
  color: var(--color-text, #ffffff);
  font-size: 0.8125rem; /* 13px */
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-settings:hover,
.btn-action:hover {
  background: var(--color-background-mute, #2a2a2a);
  border-color: var(--color-border-hover, #4a4a4a);
}

.sliders-container {
  display: flex;
  gap: 2rem;
  flex: 1;
  justify-content: center;
  align-items: flex-start;
  padding: 1rem 0;
}

.zone-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.color-bar {
  height: 3px;
  border-radius: 2px;
  box-shadow: 0 0 8px currentColor;
  opacity: 0.9;
}

.sliders-row {
  display: flex;
  gap: 1rem;
}

.slider-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.slider-track {
  position: relative;
  width: 80px;
  height: 350px;
  background: var(--color-background-mute, #2a2a2a);
  border: 2px solid var(--color-border, #3a3a3a);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s;
}

.slider-track:hover {
  border-color: var(--color-border-hover, #4a4a4a);
}

.center-marker {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.5);
  transform: translateY(-50%);
  z-index: 1;
  pointer-events: none;
}

.slider-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  transition: height 0.15s ease-out;
  pointer-events: none;
  opacity: 0.8;
  box-shadow: 0 0 10px currentColor;
}

.slider-input {
  position: absolute;
  top: 0;
  left: 50%;
  width: 350px;
  height: 80px;
  transform: translateX(-50%) rotate(-90deg);
  transform-origin: center;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
  z-index: 2;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 60px;
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.slider-input::-moz-range-thumb {
  width: 20px;
  height: 60px;
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  border-radius: 4px;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.slider-input::-webkit-slider-runnable-track {
  background: transparent;
}

.slider-input::-moz-range-track {
  background: transparent;
}

.cc-label {
  font-size: 0.8125rem; /* 13px */
  color: var(--color-text-muted, #a0a0a0);
}

.settings-bar {
  display: flex;
  gap: 1rem;
  padding: 0.5rem;
  background: var(--color-background-soft, #242424);
  border: 1px solid var(--color-border, #3a3a3a);
  border-radius: 6px;
}

.settings-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 80px;
}

.setting-label {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--color-border, #3a3a3a);
  border-radius: 4px;
  background: var(--color-background-mute, #2a2a2a);
  color: var(--color-text-muted, #a0a0a0);
  font-size: 0.8125rem; /* 13px */
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.setting-label.active {
  font-weight: 700;
  color: var(--color-text, #ffffff);
  background: var(--color-background-soft, #242424);
  border-color: var(--color-border-hover, #4a4a4a);
}

.setting-label:hover {
  background: var(--color-background-soft, #242424);
  border-color: var(--color-border-hover, #4a4a4a);
}

/* Settings slide animation */
.settings-slide-enter-active,
.settings-slide-leave-active {
  transition: all 0.2s ease-out;
  max-height: 100px;
  opacity: 1;
}

.settings-slide-enter-from,
.settings-slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}
</style>
