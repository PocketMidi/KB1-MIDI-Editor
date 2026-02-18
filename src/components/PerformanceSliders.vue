<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { midiBle } from '../services/midiBle';
import { SliderPresetStore, type SliderPreset } from '../state/sliderPresets';

// Slider configuration
interface SliderConfig {
  cc: number;
  color: string;
  bipolar: boolean;
  momentary: boolean;
  gangId: number; // Each slider belongs to a gang (solo = unique ID, linked = shared ID)
  value: number;
}

// Preset structure
interface Preset {
  sliders: SliderConfig[];
  links: boolean[]; // 11 booleans for links between adjacent sliders
}

// 12 rainbow colors for grouping
const RAINBOW_COLORS = [
  { id: 1, color: '#FF0000', name: 'Red' },
  { id: 2, color: '#FF7F00', name: 'Orange' },
  { id: 3, color: '#FFFF00', name: 'Yellow' },
  { id: 4, color: '#7FFF00', name: 'Chartreuse' },
  { id: 5, color: '#00FF00', name: 'Green' },
  { id: 6, color: '#00FF7F', name: 'Spring Green' },
  { id: 7, color: '#00FFFF', name: 'Cyan' },
  { id: 8, color: '#007FFF', name: 'Azure' },
  { id: 9, color: '#0000FF', name: 'Blue' },
  { id: 10, color: '#7F00FF', name: 'Violet' },
  { id: 11, color: '#FF00FF', name: 'Magenta' },
  { id: 12, color: '#FF007F', name: 'Rose' },
];

// Default colors: 4 sets of 3 (Red, Chartreuse, Cyan, Violet)
const DEFAULT_COLORS = [
  '#FF0000', // Red 1
  '#FF0000', // Red 2
  '#FF0000', // Red 3
  '#7FFF00', // Chartreuse 1
  '#7FFF00', // Chartreuse 2
  '#7FFF00', // Chartreuse 3
  '#00FFFF', // Cyan 1
  '#00FFFF', // Cyan 2
  '#00FFFF', // Cyan 3
  '#7F00FF', // Violet 1
  '#7F00FF', // Violet 2
  '#7F00FF', // Violet 3
];

// View mode
type ViewMode = 'setup' | 'live';
const viewMode = ref<ViewMode>('setup');

// Initialize sliders
const sliders = ref<SliderConfig[]>([]);
const dragging = ref<number | null>(null);
const isDragging = ref(false);

// Touch tracking for swipe-to-exit in live mode
const touchStartY = ref<number>(0);
const touchStartTime = ref<number>(0);

// Color swatch dragging
const colorDragStartY = ref<number>(0);
const colorDragIndex = ref<number | null>(null);
const currentColorIndex = ref<number>(0);

// Color picker state
const showColorPicker = ref<number | null>(null); // Index of slider showing picker

// Explainer text for toggle changes
const explainerText = ref('');
const explainerFading = ref(false);
let explainerTimeout: number | null = null;

// Link state - 11 links between 12 sliders
const links = ref<boolean[]>(new Array(11).fill(false));

// Initialize sliders
function initializeSliders() {
  const savedPreset = SliderPresetStore.loadCurrentState();
  if (savedPreset && savedPreset.sliders && savedPreset.links) {
    sliders.value = savedPreset.sliders;
    links.value = savedPreset.links;
    return;
  }
  
  // Default configuration - 12 sliders with 4 sets of 3 colors, each solo
  sliders.value = [];
  for (let i = 0; i < 12; i++) {
    sliders.value.push({
      cc: 51 + i,
      color: DEFAULT_COLORS[i] || '#FF0000',
      bipolar: false,
      momentary: false,
      gangId: i, // Each starts in its own gang
      value: 0,
    });
  }
  links.value = new Array(11).fill(false);
}

// Reset to defaults
function resetToDefaults() {
  sliders.value = [];
  for (let i = 0; i < 12; i++) {
    sliders.value.push({
      cc: 51 + i,
      color: DEFAULT_COLORS[i] || '#FF0000',
      bipolar: false,
      momentary: false,
      gangId: i,
      value: 0,
    });
  }
  links.value = new Array(11).fill(false);
  savePreset();
  showExplainerText('Reset to Defaults');
}

// Expose functions for parent component
defineExpose({
  resetToDefaults,
  getCurrentPreset,
  loadPreset,
});

onMounted(() => {
  initializeSliders();
  
  // Add global listeners for color swatch dragging
  document.addEventListener('mousemove', handleColorSwatchMove);
  document.addEventListener('mouseup', handleColorSwatchEnd);
  document.addEventListener('touchmove', handleColorSwatchMove);
  document.addEventListener('touchend', handleColorSwatchEnd);
});

onUnmounted(() => {
  // Remove global listeners
  document.removeEventListener('mousemove', handleColorSwatchMove);
  document.removeEventListener('mouseup', handleColorSwatchEnd);
  document.removeEventListener('touchmove', handleColorSwatchMove);
  document.removeEventListener('touchend', handleColorSwatchEnd);
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
  
  // Update all sliders in the same gang
  const linkedSliders = sliders.value.filter(
    (s, i) => i !== index && s.gangId === slider.gangId
  );
  
  for (const linkedSlider of linkedSliders) {
    linkedSlider.value = newValue;
    try {
      const ccValue = valueToCC(linkedSlider);
      await midiBle.sendControlChange(linkedSlider.cc, ccValue);
    } catch (e) {
      console.error('Failed to send linked CC', e);
    }
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
  
  // Show explainer text
  showExplainerText(slider.bipolar ? 'Bipolar' : 'Unipolar');
  
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
  
  // Show explainer text
  showExplainerText(slider.momentary ? 'Momentary' : 'Latched');
  
  savePreset();
}

// Toggle link between adjacent sliders
function toggleLink(linkIndex: number) {
  const currentlyLinked = links.value[linkIndex];
  
  if (currentlyLinked) {
    // Unlinking - split the gang
    unlinkSliders(linkIndex);
    showExplainerText('Unlinked');
  } else {
    // Linking - merge gangs and adopt settings
    linkSliders(linkIndex);
    showExplainerText('Linked');
  }
  
  savePreset();
}

// Link two adjacent sliders
function linkSliders(linkIndex: number) {
  const upperIndex = linkIndex;
  const lowerIndex = linkIndex + 1;
  
  const upper = sliders.value[upperIndex];
  const lower = sliders.value[lowerIndex];
  
  if (!upper || !lower) return;
  
  // Lower slider adopts upper slider's settings
  lower.color = upper.color;
  lower.bipolar = upper.bipolar;
  lower.momentary = upper.momentary;
  
  // Merge gangs - all sliders with lower's gangId now get upper's gangId
  const lowerGangId = lower.gangId;
  const upperGangId = upper.gangId;
  
  sliders.value.forEach(slider => {
    if (slider.gangId === lowerGangId) {
      slider.gangId = upperGangId;
    }
  });
  
  // Set link
  links.value[linkIndex] = true;
}

// Unlink two adjacent sliders
function unlinkSliders(linkIndex: number) {
  const upperIndex = linkIndex;
  const lowerIndex = linkIndex + 1;
  
  const upper = sliders.value[upperIndex];
  const lower = sliders.value[lowerIndex];
  
  if (!upper || !lower) return;
  
  // Clear the link
  links.value[linkIndex] = false;
  
  // Find all sliders connected through links starting from upper
  const connectedIndices = new Set<number>();
  
  // Find all sliders connected through links starting from upper
  function findConnected(startIndex: number, visited: Set<number>) {
    if (visited.has(startIndex)) return;
    visited.add(startIndex);
    
    // Check link to previous slider
    if (startIndex > 0 && links.value[startIndex - 1]) {
      findConnected(startIndex - 1, visited);
    }
    
    // Check link to next slider
    if (startIndex < 11 && links.value[startIndex]) {
      findConnected(startIndex + 1, visited);
    }
  }
  
  findConnected(upperIndex, connectedIndices);
  
  // If lower is not in the connected set, give it a new gang ID
  if (!connectedIndices.has(lowerIndex)) {
    const newGangId = Math.max(...sliders.value.map(s => s.gangId)) + 1;
    
    // Find all sliders connected to lower
    const lowerConnectedIndices = new Set<number>();
    findConnected(lowerIndex, lowerConnectedIndices);
    
    // Assign new gang ID to lower and its connected sliders
    lowerConnectedIndices.forEach(idx => {
      if (sliders.value[idx]) {
        sliders.value[idx].gangId = newGangId;
      }
    });
  }
}

// Change slider color
function changeSliderColor(index: number, colorId: number) {
  const slider = sliders.value[index];
  if (!slider) return;
  
  const color = RAINBOW_COLORS.find(c => c.id === colorId);
  if (color) {
    slider.color = color.color;
    savePreset();
  }
}

// Color swatch drag handlers
function handleColorSwatchClick(index: number, event: MouseEvent | TouchEvent) {
  event.stopPropagation();
  const wasOpen = showColorPicker.value === index;
  
  // Toggle picker for this slider
  showColorPicker.value = wasOpen ? null : index;
  
  // If opening the picker, scroll to selected color
  if (!wasOpen) {
    nextTick(() => {
      const slider = sliders.value[index];
      if (!slider) return;
      
      const colorIndex = RAINBOW_COLORS.findIndex(c => c.color === slider.color);
      const scrollContainer = document.querySelector(`[data-picker-index="${index}"] .color-picker-scroll`) as HTMLElement;
      
      if (scrollContainer && colorIndex >= 0) {
        // Scroll to center the selected item (32px item height + 4px margin)
        scrollContainer.scrollTop = colorIndex * 34;
        
        // Trigger initial opacity/blur calculation
        const scrollEvent = new Event('scroll');
        Object.defineProperty(scrollEvent, 'target', { value: scrollContainer, writable: false });
        handlePickerScroll(scrollEvent);
      }
    });
  }
}

function selectColorFromPicker(index: number, colorId: number) {
  changeSliderColor(index, colorId);
  showColorPicker.value = null;
}

function closeColorPicker() {
  showColorPicker.value = null;
}

function handlePickerScroll(event: Event) {
  const scrollContainer = event.target as HTMLElement | null;
  if (!scrollContainer) return;
  const items = scrollContainer.querySelectorAll('.color-picker-item');
  const containerCenter = scrollContainer.offsetHeight / 2;
  
  items.forEach((item: Element) => {
    const htmlItem = item as HTMLElement;
    const itemRect = htmlItem.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();
    const itemCenter = itemRect.top - containerRect.top + itemRect.height / 2;
    const distance = Math.abs(itemCenter - containerCenter);
    
    // Calculate opacity and blur based on distance from center
    const maxDistance = 60; // Max distance for full fade
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    
    const opacity = 1 - (normalizedDistance * 0.7); // 1 at center, 0.3 at max distance
    const blur = normalizedDistance * 2; // 0px at center, 2px at max distance
    
    htmlItem.style.opacity = opacity.toString();
    htmlItem.style.filter = `blur(${blur}px)`;
  });
}

function handleColorSwatchMove(event: MouseEvent | TouchEvent) {
  if (colorDragIndex.value === null) return;
  
  const slider = sliders.value[colorDragIndex.value];
  if (!slider) return;
  
  // Get current Y position
  let currentY = 0;
  if (event instanceof MouseEvent) {
    currentY = event.clientY;
  } else if (event.touches.length > 0) {
    const touch = event.touches[0];
    if (touch) {
      currentY = touch.clientY;
    }
  }
  
  // Calculate delta and determine color index change
  const deltaY = colorDragStartY.value - currentY; // Inverted: drag up = next color
  const colorSteps = Math.floor(deltaY / 30); // 30px per color change
  
  if (colorSteps !== 0) {
    let newColorIndex = currentColorIndex.value + colorSteps;
    
    // Wrap around
    if (newColorIndex < 0) {
      newColorIndex = RAINBOW_COLORS.length + (newColorIndex % RAINBOW_COLORS.length);
    } else if (newColorIndex >= RAINBOW_COLORS.length) {
      newColorIndex = newColorIndex % RAINBOW_COLORS.length;
    }
    
    // Update color
    const newColor = RAINBOW_COLORS[newColorIndex];
    if (newColor) {
      slider.color = newColor.color;
    }
    
    // Reset drag start for next increment
    colorDragStartY.value = currentY;
    currentColorIndex.value = newColorIndex;
    
    savePreset();
  }
}

function handleColorSwatchEnd() {
  colorDragIndex.value = null;
}

// Mode switching
function enterLiveMode() {
  viewMode.value = 'live';
}

function exitLiveMode() {
  viewMode.value = 'setup';
}

// Show explainer text with fade effect
function showExplainerText(text: string) {
  // Clear any existing timeout
  if (explainerTimeout) {
    clearTimeout(explainerTimeout);
  }
  
  // Reset fade state
  explainerFading.value = false;
  explainerText.value = text;
  
  // Start fade out after 2 seconds
  explainerTimeout = window.setTimeout(() => {
    explainerFading.value = true;
  }, 2000);
}

// Touch/swipe handling for exiting live mode
function handleTouchStart(event: TouchEvent) {
  if (viewMode.value === 'live' && event.touches.length === 1) {
    const touch = event.touches[0];
    if (touch) {
      touchStartY.value = touch.clientY;
      touchStartTime.value = Date.now();
    }
  }
}

function handleTouchEnd(event: TouchEvent) {
  if (viewMode.value === 'live' && event.changedTouches.length === 1) {
    const touch = event.changedTouches[0];
    if (!touch) return;
    const touchEndY = touch.clientY;
    const deltaY = touchEndY - touchStartY.value;
    const deltaTime = Date.now() - touchStartTime.value;
    
    // Swipe down from top: deltaY > 100px, within 500ms, starting near top
    if (deltaY > 100 && deltaTime < 500 && touchStartY.value < 100) {
      exitLiveMode();
    }
  }
}

// Toggle settings visibility (removed - no longer needed in setup mode)
// function toggleSettings() {
//   settingsVisible.value = !settingsVisible.value;
//   savePreset();
// }

// Save preset to localStorage
function savePreset() {
  const preset: Preset = {
    sliders: sliders.value,
    links: links.value,
  };
  SliderPresetStore.saveCurrentState(preset);
}

// Get current preset state
function getCurrentPreset(): SliderPreset {
  return {
    sliders: sliders.value,
    links: links.value,
  };
}

// Load preset from external source
function loadPreset(preset: SliderPreset) {
  sliders.value = JSON.parse(JSON.stringify(preset.sliders)); // Deep clone
  links.value = [...preset.links];
  savePreset();
  showExplainerText('Preset Loaded');
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
  <div 
    class="performance-sliders"
    :class="{ 'live-mode': viewMode === 'live' }"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <!-- SETUP MODE -->
    <div v-if="viewMode === 'setup'" class="setup-mode" @click="closeColorPicker">
      <!-- Header -->
      <div class="setup-header">
        <button class="btn-live" @click="enterLiveMode">ENTER LIVE MODE</button>
        <div class="explainer-text" :class="{ fading: explainerFading }">
          {{ explainerText }}
        </div>
      </div>
      
      <!-- Sliders list -->
      <div class="sliders-list">
        <template v-for="(slider, index) in sliders" :key="slider.cc">
          <div class="slider-row">
            <!-- Color swatch (clickable) -->
            <div class="color-section">
              <div 
                class="color-swatch-wrapper"
              >
                <div 
                  class="color-swatch"
                  :style="{ backgroundColor: slider.color }"
                  @click="handleColorSwatchClick(index, $event)"
                ></div>
                
                <!-- Color picker overlay -->
                <Transition name="picker-fade">
                  <div 
                    v-if="showColorPicker === index"
                    class="color-picker-overlay"
                    :data-picker-index="index"
                    @click.stop
                  >
                    <div class="color-picker-container">
                      <div class="color-picker-center-indicator"></div>
                      <div class="color-picker-scroll" @scroll="handlePickerScroll">
                        <div class="color-picker-spacer"></div>
                        <div
                          v-for="color in RAINBOW_COLORS"
                          :key="color.id"
                          class="color-picker-item"
                          :class="{ selected: slider.color === color.color }"
                          :style="{ backgroundColor: color.color }"
                          :data-color-id="color.id"
                          @click="selectColorFromPicker(index, color.id)"
                        ></div>
                        <div class="color-picker-spacer"></div>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
            
            <!-- CC Number -->
            <div class="cc-section">
              <span class="cc-label-text">MIDI CC </span><span class="cc-label">{{ slider.cc }}</span>
            </div>
            
            <!-- Inline toggles -->
            <div class="slider-toggle-inline">
              <!-- Polarity toggle -->
              <img 
                :src="`/KB1-config/uni_bi_toggle/${slider.bipolar ? 'r' : 'l'}_active.svg`"
                alt="Polarity Toggle"
                class="slider-toggle-image"
                @click="toggleBipolar(index)"
              />
              
              <!-- Mom/Lat toggle -->
              <img 
                :src="`/KB1-config/mom_lat_toggle/${slider.momentary ? 'l' : 'r'}_activ.svg`"
                alt="Mode Toggle"
                class="slider-toggle-image"
                @click="toggleMomentary(index)"
              />
            </div>
          </div>
          
          <!-- Link icon between sliders (not after last slider) -->
          <div v-if="index < sliders.length - 1" class="link-icon-container">
            <img 
              :src="`/KB1-config/${links[index] ? 'link' : 'unlink'}.svg`"
              :alt="links[index] ? 'Linked' : 'Unlinked'"
              class="link-icon"
              :class="{ linked: links[index] }"
              @click="toggleLink(index)"
            />
          </div>
        </template>
      </div>
    </div>
    
    <!-- LIVE MODE -->
    <div v-if="viewMode === 'live'" class="live-mode">
      <!-- Exit hint -->
      <div class="exit-hint">Swipe down to exit</div>
      
      <!-- Sliders container -->
      <div class="live-sliders-container">
        <div 
          v-for="(slider, index) in sliders"
          :key="slider.cc"
          class="live-slider-wrapper"
        >
          <!-- Slider track -->
          <div 
            class="live-slider-track"
            @dblclick="handleDoubleClick(index)"
          >
            <!-- Center marker for bipolar mode -->
            <div 
              v-if="slider.bipolar"
              class="center-marker"
            ></div>
            
            <!-- Slider fill -->
            <div 
              class="live-slider-fill"
              :style="{
                height: `${getSliderPercent(slider)}%`,
                backgroundColor: slider.color,
              }"
            ></div>
            
            <!-- Slider input -->
            <input
              type="range"
              class="live-slider-input"
              :min="slider.bipolar ? -100 : 0"
              :max="100"
              :value="slider.value"
              @input="handleSliderChange(index, Number(($event.target as HTMLInputElement).value))"
              @mousedown="handleMouseDown(index)"
              @mouseup="handleMouseUp(index)"
              @touchstart="handleMouseDown(index)"
              @touchend="handleMouseUp(index)"
            />
          </div>
          
          <!-- CC label -->
          <div class="live-cc-label">{{ slider.cc }}</div>
        </div>
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
  background: var(--color-background, #0F0F0F);
  color: var(--color-text, #EAEAEA);
  overflow: hidden;
}

/* === SETUP MODE === */
.setup-mode {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1rem;
  overflow: auto;
}

.setup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.setup-header h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  font-family: 'Roboto Mono';
  text-transform: uppercase;
}

.btn-live {
  flex: 0 0 auto;
  padding: 0.25rem 1.25rem;
  background: rgba(106, 104, 83, 0.2);
  border: none;
  color: #EAEAEA;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Roboto Mono';
  text-transform: uppercase;
  text-align: left;
  white-space: nowrap;
}

.btn-live:hover {
  background: rgba(106, 104, 83, 0.3);
  font-weight: 700;
}

.btn-live:active {
  background: rgba(106, 104, 83, 0.45);
}

.explainer-text {
  color: #F9AC20;
  font-size: 0.8125rem;
  font-family: 'Roboto Mono';
  font-weight: 500;
  opacity: 1;
  transition: opacity 2s ease-out;
  min-height: 1rem;
  flex: 1;
}

.explainer-text.fading {
  opacity: 0;
}

.sliders-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 0.01rem;
  padding: 0.25rem 1rem;
  background: rgba(106, 104, 83, 0.2);
  border-radius: 6px;
  transition: background 0.2s;
}

.slider-row:hover {
  background: rgba(106, 104, 83, 0.3);
}

.color-section {
  display: flex;
  align-items: center;
  min-width: 60px;
}

.color-swatch-wrapper {
  position: relative;
  display: inline-block;
}

.color-swatch {
  width: 20px;
  height: 30px;
  border-radius: 6px;
  border: 2px solid rgba(234, 234, 234, 0.3);
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.color-swatch:hover {
  border-color: rgba(234, 234, 234, 0.5);
  transform: scale(1.05);
}

.color-swatch:active {
  transform: scale(0.95);
}

/* Color Picker Overlay */
.color-picker-overlay {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  padding: 0.5rem;
  background: rgba(15, 15, 15, 0.95);
  border: none;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
}

.color-picker-container {
  position: relative;
  width: 20px;
  height: 220px;
}

.color-picker-center-indicator {
  position: absolute;
  left: -8px;
  right: -8px;
  top: 50%;
  height: 30px;
  transform: translateY(-50%);
  border-top: 2px solid rgba(116, 196, 255, 0.5);
  border-bottom: 2px solid rgba(116, 196, 255, 0.5);
  pointer-events: none;
  z-index: 2;
}

.color-picker-scroll {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.color-picker-scroll::-webkit-scrollbar {
  display: none;
}

.color-picker-spacer {
  height: 95px;
  flex-shrink: 0;
}

.color-picker-item {
  height: 30px;
  width: 20px;
  border-radius: 6px;
  cursor: pointer;
  scroll-snap-align: center;
  transition: opacity 0.1s, filter 0.1s;
  border: none;
  margin: 2px 0;
}

.color-picker-item:hover {
  opacity: 1 !important;
  filter: blur(0px) !important;
}

.color-picker-item.selected {
  box-shadow: 0 0 10px rgba(116, 196, 255, 0.5);
}

/* Picker fade transition */
.picker-fade-enter-active,
.picker-fade-leave-active {
  transition: opacity 0.2s ease;
}

.picker-fade-enter-from,
.picker-fade-leave-to {
  opacity: 0;
}

.cc-section {
  min-width: 80px;
}

.cc-label-text {
  font-size: 0.8125rem;
  font-family: 'Roboto Mono';
  color: #848484;
  font-weight: 400;
}

.cc-label {
  font-size: 0.8125rem;
  font-family: 'Roboto Mono';
  color: #F9AC20;
  font-weight: 600;
}

.slider-toggle-inline {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  margin-left: 1rem;
}

.slider-toggle-image {
  width: auto;
  height: auto;
  cursor: pointer;
  transition: opacity 0.2s;
  user-select: none;
  display: block;
}

.slider-toggle-image:hover {
  opacity: 0.8;
}

.slider-toggle-image:active {
  opacity: 0.6;
}

.link-icon-container {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 0;
  margin-left: 2.25rem;
  margin-top: -0.5rem;
  margin-bottom: -0.5rem;
  height: 16px;
}

.link-icon {
  width: 28px;
  height: 28px;
  opacity: 0.4;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.link-icon:hover {
  opacity: 0.6;
  transform: scale(1.1);
}

.link-icon:active {
  transform: scale(0.95);
}

.link-icon.linked {
  opacity: 1;
}

/* === LIVE MODE === */
.live-mode {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: #0F0F0F;
  position: relative;
}

.exit-hint {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 0.5rem;
  text-align: center;
  background: rgba(116, 196, 255, 0.1);
  color: #74C4FF;
  font-size: 0.75rem;
  font-family: 'Roboto Mono';
  z-index: 10;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.exit-hint:hover {
  opacity: 1;
}

.live-sliders-container {
  display: flex;
  flex: 1;
  gap: 1rem;
  padding: 3rem 1rem 1rem;
  justify-content: center;
  align-items: stretch;
  overflow-x: auto;
  overflow-y: hidden;
}

.live-slider-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 60px;
}

.live-slider-track {
  position: relative;
  width: 60px;
  flex: 1;
  min-height: 200px;
  background: rgba(234, 234, 234, 0.05);
  border: 2px solid rgba(234, 234, 234, 0.2);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s;
}

.live-slider-track:hover {
  border-color: rgba(234, 234, 234, 0.4);
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

.live-slider-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  transition: height 0.1s ease-out;
  pointer-events: none;
  opacity: 0.9;
}

.live-slider-input {
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(100% - 4px);
  height: calc(100% - 4px);
  transform: translate(-50%, -50%) rotate(-90deg);
  transform-origin: center;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
  z-index: 2;
}

.live-slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 50px;
  background: rgba(255, 255, 255, 0.95);
  cursor: pointer;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.live-slider-input::-moz-range-thumb {
  width: 16px;
  height: 50px;
  background: rgba(255, 255, 255, 0.95);
  cursor: pointer;
  border-radius: 4px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.live-slider-input::-webkit-slider-runnable-track {
  background: transparent;
}

.live-slider-input::-moz-range-track {
  background: transparent;
}

.live-cc-label {
  font-size: 0.8125rem;
  font-family: 'Roboto Mono';
  color: rgba(234, 234, 234, 0.6);
  font-weight: 600;
}

/* Landscape optimization for live mode */
@media (orientation: landscape) and (max-height: 600px) {
  .live-sliders-container {
    padding: 2rem 1rem 0.5rem;
  }
  
  .live-slider-track {
    min-height: 150px;
  }
}
</style>

