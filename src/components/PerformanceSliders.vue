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

// Mobile detection and fullscreen state
const isMobile = ref(false);
const isIOS = ref(false);
const isPortrait = ref(false);
const showExitButton = ref(false); // Control X button visibility
const showRotateBackPrompt = ref(false); // Show "rotate back" prompt on exit

// Touch tracking for slider dragging
const activeTouchSlider = ref<number | null>(null);
const activeTouchTrack = ref<HTMLElement | null>(null);
const swipeStartX = ref<number | null>(null);
const swipeStartY = ref<number | null>(null);

// Initialize sliders
const sliders = ref<SliderConfig[]>([]);
const dragging = ref<number | null>(null);
const isDragging = ref(false);

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

// === UTILITY FUNCTIONS (must be declared first) ===

// Save preset to localStorage
function savePreset() {
  const preset: Preset = {
    sliders: sliders.value,
    links: links.value,
  };
  SliderPresetStore.saveCurrentState(preset);
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

// Convert hex color to rgba with alpha
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Calculate slider fill height for visual display
function getSliderFillHeight(slider: SliderConfig): number {
  const trackHeight = 490;
  const minFillHeight = 20;
  const minPercent = (minFillHeight / trackHeight) * 100;
  
  if (slider.bipolar) {
    const halfHeight = Math.abs(slider.value) / 2;
    if (halfHeight < minPercent / 2) {
      return minPercent;
    }
    return halfHeight;
  } else {
    return Math.max(slider.value, minPercent);
  }
}

// Calculate slider fill bottom position (only for bipolar)
function getSliderFillBottom(slider: SliderConfig): number {
  if (!slider.bipolar) return 0;
  
  const trackHeight = 490;
  const minFillHeight = 20;
  const minPercent = (minFillHeight / trackHeight) * 100;
  const halfHeight = Math.abs(slider.value) / 2;
  
  if (halfHeight < minPercent / 2) {
    return 50 - minPercent / 2;
  }
  
  if (slider.value >= 0) {
    return 50;
  } else {
    return 50 - halfHeight;
  }
}

// === END UTILITY FUNCTIONS ===

// Handle touch drag on slider track (for mobile)
function handleTrackTouchStart(event: TouchEvent, index: number) {
  if (!isMobile.value || viewMode.value !== 'live') return;
  event.preventDefault();
  
  const touch = event.touches[0];
  if (!touch) return;
  
  // Store swipe start position
  swipeStartX.value = touch.clientX;
  swipeStartY.value = touch.clientY;
  
  // Get the track that was touched directly
  const track = event.currentTarget as HTMLElement;
  if (!track) return;
  
  // Lock to this slider and track
  activeTouchSlider.value = index;
  activeTouchTrack.value = track;
  
  // Process the initial touch position
  handleTrackTouchMove(event, index);
}

function handleTrackTouchMove(event: TouchEvent, index: number) {
  if (!isMobile.value || viewMode.value !== 'live') return;
  
  // Only process if this is the active slider
  if (activeTouchSlider.value !== index || !activeTouchTrack.value) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  const touch = event.touches[0];
  if (!touch) return;
  
  // Use the stored track element for accurate bounds
  const track = activeTouchTrack.value;
  const trackRect = track.getBoundingClientRect();
  
  // Calculate position from bottom (0 = bottom, 1 = top)
  const y = touch.clientY - trackRect.top;
  const height = trackRect.height;
  const positionFromTop = Math.max(0, Math.min(1, y / height));
  const positionFromBottom = 1 - positionFromTop;
  
  const slider = sliders.value[index];
  if (!slider) return;
  
  let newValue;
  if (slider.bipolar) {
    // Bipolar: -100 to +100
    newValue = Math.round((positionFromBottom * 200) - 100);
  } else {
    // Unipolar: 0 to 100
    newValue = Math.round(positionFromBottom * 100);
  }
  
  handleSliderChange(index, newValue, false);
}

function handleTrackTouchEnd(event: TouchEvent) {
  // Store the active slider before checking swipe
  const wasActiveSlider = activeTouchSlider.value;
  
  // Check for horizontal swipe to exit
  if (swipeStartX.value !== null && swipeStartY.value !== null) {
    const touch = event.changedTouches[0];
    if (touch) {
      const deltaX = Math.abs(touch.clientX - swipeStartX.value);
      const deltaY = Math.abs(touch.clientY - swipeStartY.value);
      
      // If horizontal swipe > 100px and more horizontal than vertical, exit
      if (deltaX > 100 && deltaX > deltaY * 2) {
        exitLiveMode();
        return;
      }
    }
  }
  
  // Handle momentary bounce-back before resetting
  if (wasActiveSlider !== null) {
    const slider = sliders.value[wasActiveSlider];
    if (slider && slider.momentary) {
      // Spring back to default with smooth animation
      const defaultValue = getDefaultValue(slider);
      
      // Animate the spring-back over 300ms
      const startValue = slider.value;
      const startTime = performance.now();
      const duration = 300; // ms
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth easing function (ease-out cubic)
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        const currentValue = startValue + (defaultValue - startValue) * easeProgress;
        handleSliderChange(wasActiveSlider, Math.round(currentValue), false);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }
  
  activeTouchSlider.value = null;
  activeTouchTrack.value = null;
  swipeStartX.value = null;
  swipeStartY.value = null;
}

// Reset to defaults (full reset - colors, settings, values)
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

// Reset values to zero (only values, keep colors/settings)
function resetValuesToZero() {
  for (const slider of sliders.value) {
    slider.value = 0;
  }
  savePreset();
  showExplainerText('Values Reset to Zero');
}

onMounted(() => {
  initializeSliders();
  
  // Add global listeners for color swatch dragging
  document.addEventListener('mousemove', handleColorSwatchMove);
  document.addEventListener('mouseup', handleColorSwatchEnd);
  document.addEventListener('touchmove', handleColorSwatchMove);
  document.addEventListener('touchend', handleColorSwatchEnd);
  
  // Listen for fullscreen changes (handle ESC key, etc.)
  document.addEventListener('fullscreenchange', handleFullscreenChange);
});

onUnmounted(() => {
  // Remove global listeners
  document.removeEventListener('mousemove', handleColorSwatchMove);
  document.removeEventListener('mouseup', handleColorSwatchEnd);
  document.removeEventListener('touchmove', handleColorSwatchMove);
  document.removeEventListener('touchend', handleColorSwatchEnd);
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
});

// Handle fullscreen exit via ESC or other means
function handleFullscreenChange() {
  if (!document.fullscreenElement && viewMode.value === 'live' && isMobile.value) {
    // User exited fullscreen, so exit live mode
    exitLiveMode();
  }
}

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
// Detect if device is mobile (touch + small screen)
function detectMobile() {
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 768;
  isMobile.value = hasTouch && isSmallScreen;
  
  // Detect iOS
  const userAgent = navigator.userAgent.toLowerCase();
  isIOS.value = /iphone|ipad|ipod/.test(userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // Check orientation
  checkOrientation();
}

function checkOrientation() {
  isPortrait.value = window.innerHeight > window.innerWidth;
}

async function enterLiveMode() {
  detectMobile();
  viewMode.value = 'live';
  showExitButton.value = false; // Start with X hidden
  
  // Platform-specific mobile handling
  if (isMobile.value) {
    if (isIOS.value) {
      // iOS: No fullscreen API support, just use viewport optimization
      // Portrait prompt will show if needed
      window.addEventListener('resize', checkOrientation);
      window.addEventListener('orientationchange', checkOrientation);
    } else {
      // Android: Full fullscreen + orientation lock support
      try {
        // Request fullscreen (removes ALL browser UI)
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        }
        
        // Lock orientation to landscape
        if (screen.orientation && 'lock' in screen.orientation) {
          try {
            await (screen.orientation as any).lock('landscape');
          } catch (e) {
            console.log('Orientation lock not supported:', e);
          }
        }
      } catch (e) {
        console.error('Fullscreen error:', e);
      }
    }
  }
}

async function exitLiveMode() {
  // Show rotate-back prompt for iOS mobile users
  if (isMobile.value && isIOS.value && !isPortrait.value) {
    showRotateBackPrompt.value = true;
    // Wait 3 seconds or until portrait orientation detected
    const checkInterval = setInterval(() => {
      if (window.innerHeight > window.innerWidth) {
        clearInterval(checkInterval);
        completeExit();
      }
    }, 100);
    // Auto-complete after 3 seconds regardless
    setTimeout(() => {
      clearInterval(checkInterval);
      completeExit();
    }, 3000);
  } else {
    completeExit();
  }
}

async function completeExit() {
  showRotateBackPrompt.value = false;
  viewMode.value = 'setup';
  showExitButton.value = false; // Reset button visibility
  activeTouchSlider.value = null; // Reset active slider
  
  // Platform-specific cleanup
  if (isMobile.value) {
    if (isIOS.value) {
      // iOS: Remove orientation listeners
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    } else {
      // Android: Exit fullscreen and unlock orientation
      try {
        // Exit fullscreen
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
        
        // Unlock orientation
        if (screen.orientation && 'unlock' in screen.orientation) {
          (screen.orientation as any).unlock();
        }
      } catch (e) {
        console.error('Exit fullscreen error:', e);
      }
    }
  }
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

// Expose functions for parent component
defineExpose({
  resetToDefaults,
  resetValuesToZero,
  getCurrentPreset,
  loadPreset,
  viewMode,
  exitLiveMode,
});
</script>

<template>
  <div 
    class="performance-sliders"
    :class="{ 'live-mode': viewMode === 'live' }"
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
              <span class="cc-label-text">CC </span><span class="cc-label">{{ slider.cc }}</span>
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
    <div 
      v-if="viewMode === 'live'" 
      class="live-mode" 
      :class="{ 'mobile-landscape': isMobile }"
    >
      <!-- iOS Portrait Prompt -->
      <div v-if="isMobile && isIOS && isPortrait" class="portrait-prompt">
        <div class="prompt-content">
          <img src="/rotate.gif" alt="Rotate device" class="rotate-icon-img" />
          <div class="prompt-text">Please rotate your device [23:12]</div>
          <div class="prompt-subtext">Landscape orientation required</div>
          <div class="prompt-subtext" style="margin-top: 0.5rem; font-size: 0.7rem; opacity: 0.6;">Swipe left or right to exit</div>
        </div>
      </div>
      
      <!-- Rotate Back Prompt (on exit) -->
      <div v-if="showRotateBackPrompt" class="portrait-prompt">
        <div class="prompt-content">
          <img src="/rotate.gif" alt="Rotate device" class="rotate-icon-img" />
          <div class="prompt-text">Rotate back to portrait [23:12]</div>
          <div class="prompt-subtext">or wait 3 seconds</div>
        </div>
      </div>
      
      <!-- Sliders container -->
      <div class="live-sliders-container">
        <div 
          v-for="(slider, index) in sliders"
          :key="slider.cc"
          class="live-slider-wrapper"
        >
          <!-- Center markers for bipolar mode (outside track) -->
          <template v-if="slider.bipolar">
            <div 
              class="center-marker-left"
              :style="{ backgroundColor: slider.color }"
            ></div>
            <div 
              class="center-marker-right"
              :style="{ backgroundColor: slider.color }"
            ></div>
          </template>
          
          <!-- Slider track -->
          <div 
            class="live-slider-track"
            @dblclick="handleDoubleClick(index)"
            @touchstart="handleTrackTouchStart($event, index)"
            @touchmove="handleTrackTouchMove($event, index)"
            @touchend="handleTrackTouchEnd($event)"
            @touchcancel="handleTrackTouchEnd($event)"
            :style="{
              backgroundColor: hexToRgba(slider.color, 0.2)
            }"
          >
            <!-- CC number inside track (top) -->
            <div class="live-slider-cc-inside">{{ slider.cc }}</div>
            
            <!-- Slider fill -->
            <div 
              class="live-slider-fill"
              :class="{ 'bipolar': slider.bipolar }"
              :style="{
                height: `${getSliderFillHeight(slider)}%`,
                bottom: slider.bipolar ? `${getSliderFillBottom(slider)}%` : '0',
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
  height: 100%;
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
  padding: 0.5rem 1.25rem;
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
  margin-left: -0.5rem;
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

/* Portrait Prompt (iOS) */
.portrait-prompt {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-background, #0F0F0F);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.prompt-content {
  text-align: center;
  padding: 2rem;
}

.rotate-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: rotate-hint 2s ease-in-out infinite;
}

.rotate-icon-img {
  width: 120px;
  height: 120px;
  margin-bottom: 1rem;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

@keyframes rotate-hint {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(90deg); }
}

.prompt-text {
  font-family: 'Roboto Mono';
  font-size: 1.5rem;
  color: #74C4FF;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.prompt-subtext {
  font-family: 'Roboto Mono';
  font-size: 0.875rem;
  color: rgba(234, 234, 234, 0.6);
}

/* Long press indicator (mobile) */
.mobile-exit-button {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 32px;
  height: 32px;
  background: rgba(15, 15, 15, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(234, 234, 234, 0.4);
  cursor: pointer;
  z-index: 100;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  touch-action: manipulation; /* Allow tap but prevent other gestures */
  -webkit-touch-callout: none; /* Prevent iOS context menu */
  -webkit-user-select: none;
  user-select: none;
}

.mobile-exit-button:active {
  background: rgba(15, 15, 15, 0.9);
  color: #74C4FF;
  transform: scale(1.1);
}

.mobile-exit-button svg {
  width: 16px;
  height: 16px;
}

/* Mobile Landscape Optimizations */
.live-mode.mobile-landscape {
  padding: 0;
  touch-action: none; /* Prevent iOS scrolling */
  -webkit-touch-callout: none; /* Prevent iOS context menu */
  -webkit-user-select: none;
  user-select: none;
  overflow: hidden;
  overscroll-behavior: none; /* Prevent pull-to-refresh */
}

.live-mode.mobile-landscape .live-sliders-container {
  padding: 0.5rem;
  gap: 1.5rem; /* Increased spacing to fill screen */
  overflow: hidden;
  min-height: 0;
  height: 100dvh;
  height: 100vh;
  touch-action: pan-y; /* Allow vertical panning */
}

.live-mode.mobile-landscape .live-slider-wrapper {
  flex: 1;
  min-width: 0;
  max-width: 36px; /* Split difference - was 32px, now 36px */
  gap: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  touch-action: auto; /* Allow default touch behavior for slider */
}

.live-mode.mobile-landscape .live-slider-track {
  width: 100%;
  height: 100%;
  min-height: 0;
  flex: 1;
  border-radius: 8px;
  touch-action: none; /* Prevent default, we handle touch manually */
  -webkit-touch-callout: none;
  cursor: pointer;
}

.live-mode.mobile-landscape .live-slider-input {
  pointer-events: none; /* Disable input interaction, use custom touch handlers */
  display: none; /* Hide completely in mobile mode */
}

.live-mode.mobile-landscape .center-marker-left,
.live-mode.mobile-landscape .center-marker-right {
  top: 50%; /* Use percentage for dynamic height */
}

.live-sliders-container {
  display: flex;
  flex: 1;
  gap: 1.75rem;
  padding: 3rem 1rem 1rem;
  justify-content: center;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  min-height: 490px;
}

.live-slider-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 42px;
}

.live-slider-track {
  position: relative;
  width: 42px;
  height: 490px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
}

/* Bipolar center markers - positioned outside track */
.center-marker-left,
.center-marker-right {
  position: absolute;
  top: 245px; /* Center of 490px track */
  transform: translateY(-50%);
  width: 3px;
  height: 25px;
  border-radius: 1.5px;
  z-index: 2;
  pointer-events: none;
}

.center-marker-left {
  left: -6px;
}

.center-marker-right {
  right: -6px;
}

.live-slider-fill {
  position: absolute;
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 1;
}

.live-slider-cc-inside {
  position: absolute;
  top: 0.5rem;
  left: 0;
  right: 0;
  text-align: center;
  color: rgba(234, 234, 234, 0.5); /* Changed from 0.8 to 0.5 */
  font-size: 0.75rem;
  font-family: 'Roboto Mono';
  font-weight: 600;
  pointer-events: none;
  z-index: 2;
}

.live-slider-input {
  touch-action: auto !important; /* Allow default range input behavior */
  -webkit-touch-callout: none;
  position: absolute;
  top: 0;
  left: 0;
  width: 42px;
  height: 490px;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
  z-index: 3;
  writing-mode: bt-lr;
  -webkit-writing-mode: bt-lr;
  -webkit-appearance: slider-vertical;
  opacity: 0;
}

.live-slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 42px;
  height: 8px;
  background: transparent;
  cursor: pointer;
  border: none;
  opacity: 0;
}

.live-slider-input::-moz-range-thumb {
  width: 42px;
  height: 8px;
  background: transparent;
  cursor: pointer;
  border: none;
  opacity: 0;
}

.live-slider-input::-webkit-slider-runnable-track {
  background: transparent;
  border: none;
  box-shadow: none;
}

.live-slider-input::-moz-range-track {
  background: transparent;
  border: none;
  box-shadow: none;
}

.live-cc-label {
  display: none; /* Hidden - CC numbers now shown inside sliders */
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

