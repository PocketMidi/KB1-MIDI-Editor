<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import MobileControls from './pages/MobileControls.vue';
import MobileScales from './pages/MobileScales.vue';
import MobileSliders from './pages/MobileSliders.vue';
import FirstTimeOverlay from './components/FirstTimeOverlay.vue';
import ContextualConnectionModal from './components/ContextualConnectionModal.vue';
import { useDeviceState } from './composables/useDeviceState';
import { FIRST_TIME_BLE_INTRO_KEY } from './constants';
import './styles/themes/kb1.css';

const { 
  isBluetoothAvailable, 
  isConnected, 
  connect,
  disconnect,
} = useDeviceState();

// Single unified tab state
type Tab = 'settings' | 'controls' | 'sliders';
const activeTab = ref<Tab>('settings');

const tabs = [
  { id: 'settings' as Tab, label: 'SETTINGS' },
  { id: 'controls' as Tab, label: 'CONTROLS' },
  { id: 'sliders' as Tab, label: 'SLIDERS' }
];

// Hover state for bluetooth connection section (text and icon)
const isHoveringStatus = ref(false);

// Modal states
const showFirstTimeOverlay = ref(false);
const showContextualModal = ref(false);

// Theme state
const THEME_KEY = 'kb1-theme-preference';
const isDarkMode = ref(localStorage.getItem(THEME_KEY) !== 'light');

// Computed property for theme icon
const themeIcon = computed(() => {
  const baseUrl = import.meta.env.BASE_URL || '/';
  return isDarkMode.value ? `${baseUrl}lite.svg` : `${baseUrl}dark.svg`;
});

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem(THEME_KEY, isDarkMode.value ? 'dark' : 'light');
  console.log('Theme toggled to:', isDarkMode.value ? 'dark' : 'light');
}

// Computed property for bluetooth status text
const bluetoothStatusText = computed(() => {
  if (isConnected.value) {
    return isHoveringStatus.value ? 'DISCONNECT' : 'CONNECTED';
  }
  return isHoveringStatus.value ? 'CONNECT' : 'DISCONNECTED';
});

// Computed property to check if in live mode
const isInLiveMode = computed(() => {
  return activeTab.value === 'sliders' && mobileSlidersRef.value?.isInLiveMode();
});

// Detect if mobile device
const isMobile = computed(() => {
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 768;
  return hasTouch && isSmallScreen;
});

// Only hide header/footer on mobile live mode
const hideUI = computed(() => {
  return isMobile.value && isInLiveMode.value;
});

// Check if first-time overlay should be shown
onMounted(() => {
  const hasSeenIntro = localStorage.getItem(FIRST_TIME_BLE_INTRO_KEY);
  if (!hasSeenIntro && !isConnected.value) {
    showFirstTimeOverlay.value = true;
  }
});

async function handleConnect() {
  try {
    await connect();
    // Close any open modals on successful connection
    showFirstTimeOverlay.value = false;
    showContextualModal.value = false;
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

async function handleDisconnect() {
  try {
    await disconnect();
  } catch (error) {
    console.error('Disconnection failed:', error);
  }
}

function handleFirstTimeDismiss() {
  showFirstTimeOverlay.value = false;
  localStorage.setItem(FIRST_TIME_BLE_INTRO_KEY, 'true');
}

function handleContextualDismiss() {
  showContextualModal.value = false;
}

/**
 * Check if a click event was on a disabled control that should trigger the contextual modal.
 * 
 * Detects clicks on:
 * - Input elements (text, number, etc.)
 * - Select dropdowns
 * - Buttons (excluding accordion headers)
 * - Elements with .value-control class (custom value controls)
 * - Elements with .slider-control class (sliders)
 * - Elements with .form-control class (general form controls)
 * 
 * @param target - The HTML element that was clicked
 * @returns true if the click should trigger the contextual modal
 */
function isDisabledControlClick(target: HTMLElement): boolean {
  // Check for basic form elements
  const isBasicControl = target.tagName === 'INPUT' || 
                         target.tagName === 'SELECT' || 
                         target.tagName === 'BUTTON';
  
  // Check for custom control components
  const isCustomControl = target.closest('.value-control') ||
                          target.closest('.slider-control') ||
                          target.closest('.form-control');
  
  // Don't trigger for accordion headers (they should still work when disconnected)
  const isAccordionHeader = target.closest('.accordion-header');
  
  return (isBasicControl || Boolean(isCustomControl)) && !isAccordionHeader;
}

function handleMainClick(event: MouseEvent) {
  if (!isConnected.value) {
    const target = event.target as HTMLElement;
    
    if (isDisabledControlClick(target)) {
      event.preventDefault();
      event.stopPropagation();
      showContextualModal.value = true;
    }
  }
}

// Refs for page components
const mobileControlsRef = ref<InstanceType<typeof MobileControls> | null>(null);
const mobileScalesRef = ref<InstanceType<typeof MobileScales> | null>(null);
const mobileSlidersRef = ref<InstanceType<typeof MobileSliders> | null>(null);

function handleTabClick(tabId: Tab) {
  // If clicking on sliders tab while in live mode, exit live mode
  if (tabId === 'sliders' && activeTab.value === 'sliders') {
    if (mobileSlidersRef.value?.isInLiveMode()) {
      mobileSlidersRef.value?.exitLiveMode();
      return;
    }
  }
  
  // If clicking on already active tab, close all accordions
  if (activeTab.value === tabId) {
    if (tabId === 'controls') {
      mobileControlsRef.value?.closeAllAccordions();
    } else if (tabId === 'settings') {
      mobileScalesRef.value?.closeAllAccordions();
    }
  } else {
    // Switch to the new tab
    activeTab.value = tabId;
  }
}

</script>

<template>
  <div class="app" :class="isDarkMode ? 'theme-kb1-dark' : 'theme-kb1-light'">
    <!-- First-Time Overlay -->
    <FirstTimeOverlay
      :show="showFirstTimeOverlay"
      @connect="handleConnect"
      @dismiss="handleFirstTimeDismiss"
    />
    
    <!-- Contextual Connection Modal -->
    <ContextualConnectionModal
      :show="showContextualModal"
      @connect="handleConnect"
      @dismiss="handleContextualDismiss"
    />
    
    <!-- Unified Responsive Layout -->
    <header v-if="!hideUI" class="app-header">
      <div class="header-content">
        <!-- KB1 logo - centered, no buttons -->
        <div class="logo-section">
          <img src="/kb1_title.svg" alt="KB1 CONFIGURATOR" class="header-logo" />
        </div>
      </div>
      
      <div v-if="!isBluetoothAvailable" class="warning-banner">
        ⚠️ Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.
      </div>
    </header>
    
    <!-- Unified Tab Navigation with Bluetooth Controls -->
    <div v-if="!hideUI" class="tab-nav-wrapper">
      <nav class="app-nav">
        <div class="nav-tabs">
          <button 
            v-for="tab in tabs"
            :key="tab.id"
            class="nav-tab"
            :class="{ active: activeTab === tab.id }"
            @click="handleTabClick(tab.id)"
          >
            {{ tab.label }}
          </button>
          
          <!-- Theme toggle button -->
          <button 
            class="theme-toggle"
            @click="toggleTheme"
            :title="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          >
            <img :src="themeIcon" :alt="isDarkMode ? 'Light Mode' : 'Dark Mode'" class="theme-icon" />
          </button>
          
          <!-- Vertical divider after tabs -->
          <div class="separator"></div>
        </div>
        
        <!-- Bluetooth status section -->
        <div 
          class="bluetooth-status" 
          :class="{ connected: isConnected, hoverable: true }"
          @click="isConnected ? handleDisconnect() : handleConnect()"
          @touchstart="isHoveringStatus = true"
          @touchend="isHoveringStatus = false"
          @mouseenter="isHoveringStatus = true"
          @mouseleave="isHoveringStatus = false"
        >
          <span class="status-text">
            {{ bluetoothStatusText }}
          </span>
          <img src="/bluetooth-icon.svg" alt="Bluetooth" class="bluetooth-icon" />
        </div>
      </nav>
      
      <!-- Horizontal divider under navigation -->
      <div class="nav-divider"></div>
    </div>
    
    <main class="app-main" :class="{ 'live-fullscreen': hideUI }" @click="handleMainClick">
      <MobileControls v-if="activeTab === 'controls'" ref="mobileControlsRef" />
      <MobileScales v-if="activeTab === 'settings'" ref="mobileScalesRef" />
      <MobileSliders v-if="activeTab === 'sliders'" ref="mobileSlidersRef" />
    </main>
  </div>
</template>

<style>
/* Import Roboto Mono font */
@import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap');

/* ===== NOTE: Theme-specific color variables are defined in /src/styles/themes/kb1.css ===== */
/* The .theme-kb1-dark and .theme-kb1-light classes contain all color definitions */

:root {
  /* Default to dark mode colors for fallback */
  --color-background: #0F0F0F;
  --color-background-soft: #0F0F0F;
  --color-background-mute: #0F0F0F;
  --color-border: transparent;
  --color-border-hover: transparent;
  --color-divider: rgba(234, 234, 234, 0.2);
  --color-text: #EAEAEA;
  --color-text-muted: rgba(234, 234, 234, 0.32);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Roboto Mono';
  font-size: 13px;
  background: var(--color-background);
  color: var(--color-text);
  line-height: 1.6;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Main disconnected state styling */
.disconnected-state {
  filter: grayscale(100%);
  position: relative;
  opacity: 0.8;
}

.disconnected-state::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(128, 128, 128, 0.05);
  z-index: 1;
  pointer-events: none;
}

/* Subtle connection status bar */
.connection-status-bar {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--color-background-mute);
  border-bottom: 1px solid var(--color-border);
  font-size: 0.8125rem; /* 13px */
  color: var(--color-text-muted);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.status-dot.disconnected {
  background: #ef4444;
  animation: pulse-subtle 2s infinite;
}

@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Allow accordion header interaction when disconnected */
.disconnected-state .accordion-header,
.disconnected-state .accordion-header * {
  pointer-events: auto !important;
  cursor: pointer !important;
}

/* Enhanced disabled state for form controls when disconnected */
.disconnected-state .form-control,
.disconnected-state input,
.disconnected-state select,
.disconnected-state button:not(.accordion-header),
.disconnected-state .group input,
.disconnected-state .group select {
  opacity: 0.4;
  cursor: not-allowed;
  position: relative;
}
</style>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header - Unified for all screen sizes */
.app-header {
  background-color: var(--color-background);
  border-bottom: none;
  position: relative;
  z-index: 100; /* Lower than sticky tabs */
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
}

/* Logo - consistent size across all screens (mobile size from original) */
.header-logo {
  width: 100%;
  height: 40px;
}

/* Invert logo for light mode for better visibility */
.theme-kb1-light .header-logo {
  filter: invert(1) hue-rotate(180deg);
  opacity: 0.85;
}

.warning-banner {
  padding: 1rem 2rem;
  background: rgba(239, 68, 68, 0.1);
  border-top: 1px solid #ef4444;
  color: #fca5a5;
  text-align: center;
  font-size: 0.8125rem; /* 13px */
}

/* Tab Navigation Wrapper - sticky with background */
.tab-nav-wrapper {
  position: sticky;
  top: 0;
  z-index: 200; /* High z-index to stay above header */
  background-color: var(--color-background);
}

/* Tab Navigation - Unified responsive layout */
.app-nav {
  background-color: var(--color-background);
  border-bottom: none;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 0 2rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  
  /* Hide scrollbar while keeping scroll functionality */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

/* Hide scrollbar for Chrome, Safari and Opera */
.app-nav::-webkit-scrollbar {
  display: none;
}

.nav-tabs {
  display: flex;
  align-items: stretch;
  gap: 0;
}

.nav-tab {
  padding: 1rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: 0;
  color: var(--color-text);
  font-family: var(--kb1-font-family-mono);
  font-weight: 400;
  text-transform: uppercase;
  cursor: pointer;
  opacity: 0.32;
  transition: opacity 0.2s, font-weight 0.2s;
  position: relative;
  white-space: nowrap;
  font-size: 0.875rem;
}

.nav-tab:hover {
  opacity: 0.6;
  background: transparent;
}

.nav-tab.active {
  color: var(--color-text);
  opacity: 1;
  font-weight: 700;
}

/* Active tab underline */
.nav-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-text);
  border-radius: 1px;
}

/* Inactive tab underline */
.nav-tab:not(.active)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-text);
  opacity: 0.32;
  border-radius: 1px;
}

/* Theme toggle button */
.theme-toggle {
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s, transform 0.2s;
  opacity: 0.6;
}

.theme-toggle:hover {
  opacity: 1;
  transform: scale(1.1);
}

.theme-icon {
  height: 28px;
  width: 28px;
  display: block;
  /* Ensure icon is always visible regardless of theme */
  filter: opacity(0.8);
}

.theme-kb1-light .theme-icon {
  /* In light mode, ensure dark icon is visible */
  filter: opacity(1);
}

.theme-kb1-dark .theme-icon {
  /* In dark mode, ensure light icon is visible */
  filter: opacity(1);
}

/* Vertical separator (divider) after tabs */
.separator {
  width: 2px;
  height: 50%;
  background: var(--color-divider);
  align-self: center;
  flex-shrink: 0;
  margin: 0 0.5rem;
}

/* Bluetooth status section in nav */
.bluetooth-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  white-space: nowrap;
}

.bluetooth-status.hoverable {
  cursor: pointer;
}

.status-text {
  font-family: var(--kb1-font-family-mono);
  font-weight: 400;
  font-size: 0.8125rem; /* 13px */
  color: var(--bluetooth-status-inactive);
  opacity: 0.5;
  transition: color 0.5s ease-in-out, 
              opacity 0.5s ease-in-out, 
              font-weight 0.5s ease-in-out;
  transform-origin: center;
}

.bluetooth-status.hoverable:hover .status-text,
.bluetooth-status.hoverable:active .status-text {
  color: var(--bluetooth-status-active);
  opacity: 1;
  font-weight: 700;
  /* NO transform scale */
}

.bluetooth-status.connected .status-text {
  color: var(--bluetooth-status-active);
  opacity: 1;
  font-weight: 700;
  animation: breathe 3s ease-in-out infinite;
}

.bluetooth-status.connected.hoverable:hover .status-text,
.bluetooth-status.connected.hoverable:active .status-text {
  animation: none; /* Disable breathing on hover/active */
}

.bluetooth-icon {
  height: 32px; /* Scaled up ~60% from typical 20px base for better visibility */
  width: auto;
  transition: filter 0.5s ease-in-out, 
              transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  transform-origin: center;
  filter: var(--bluetooth-icon-filter-inactive);
}

/* Bluetooth icon hover effect - with bounce animation */
.bluetooth-status.hoverable:hover .bluetooth-icon,
.bluetooth-status.hoverable:active .bluetooth-icon {
  filter: var(--bluetooth-icon-filter-active);
  transform: scale(1.15);
}

.bluetooth-status.connected .bluetooth-icon {
  filter: var(--bluetooth-icon-filter-active);
  animation: breatheScale 3s ease-in-out infinite;
}

.bluetooth-status.connected.hoverable:hover .bluetooth-icon {
  filter: var(--bluetooth-icon-filter-active);
  transform: scale(1.15);
  animation: none; /* Disable breathing animation on hover */
}

/* Breathing animations for connected state */
@keyframes breathe {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

@keyframes breatheScale {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}

/* Horizontal divider under navigation */
.nav-divider {
  height: 2px;
  background: var(--color-divider);
  max-width: 1400px;
  margin: -2px auto 0;
  width: 100%;
}

.app-main {
  flex: 1;
  background: var(--color-background);
  padding-bottom: 100px; /* Add padding to account for fixed footer bar */
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.app-main.live-fullscreen {
  padding-bottom: 0;
}

/* Responsive adjustments using CSS media queries only */
@media (max-width: 640px) {
  .app-nav {
    padding: 0 1rem;
  }
  
  .nav-tab {
    font-size: 0.8125rem;
    padding: 0.75rem 0.5rem;
  }
  
  .bluetooth-status {
    padding: 0.75rem 1rem;
    gap: 0.5rem;
  }
  
  .status-text {
    font-size: 0.8125rem;
  }
  
  .bluetooth-icon {
    height: 28px;
  }
  
  .separator {
    margin: 0 0.25rem;
  }
  
  .theme-toggle {
    padding: 0.5rem 0.5rem;
  }
  
  .theme-icon {
    height: 24px;
    width: 24px;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 1rem 1.5rem;
  }
  
  .header-logo {
    width: 100%;
    height: 40px;
  }
  
  .nav-tab {
    font-size: 0.8125rem; /* 13px */
    padding: 0.75rem 0.5rem;
  }
  
  .bluetooth-status {
    padding: 0.75rem 0.75rem;
    gap: 0.4rem;
  }
  
  .status-text {
    font-size: 0.8125rem; /* 13px */
  }
  
  .bluetooth-icon {
    height: 24px;
  }
}
</style>
