<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import MobileScales from './pages/MobileScales.vue';
import MobileSliders from './pages/MobileSliders.vue';
import FirstTimeOverlay from './components/FirstTimeOverlay.vue';
import ContextualConnectionModal from './components/ContextualConnectionModal.vue';
import ToastNotification from './components/ToastNotification.vue';
import ConfirmDialog from './components/ConfirmDialog.vue';
import { useDeviceState } from './composables/useDeviceState';
import { useToast } from './composables/useToast';
import { useConfirm } from './composables/useConfirm';
import { FIRST_TIME_BLE_INTRO_KEY } from './constants';
import './styles/themes/kb1.css';

const { 
  isBluetoothAvailable, 
  isConnected, 
  connect,
  disconnect,
  devMode,
  setDevMode,
} = useDeviceState();
const { dialogs, remove: removeDialog } = useConfirm();

const { toasts, remove } = useToast();

// Single unified tab state
type Tab = 'settings' | 'sliders';
const activeTab = ref<Tab>('settings');

const tabs = [
  { id: 'settings' as Tab, label: 'SETTINGS' },
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

// Secret dev mode toggle (tap logo 5 times)
const logoClickCount = ref(0);
const logoClickTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const showDevModeModal = ref(false);
const modalJustOpened = ref(false);

// Show counter after 2nd tap
const showTapCounter = computed(() => logoClickCount.value >= 2 && logoClickCount.value < 5);

function handleLogoClick(event?: Event) {
  // Prevent default behavior and stop propagation
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  logoClickCount.value++;
  
  // Reset timer
  if (logoClickTimer.value) clearTimeout(logoClickTimer.value);
  
  // If 5 clicks reached, toggle dev mode and show modal
  if (logoClickCount.value >= 5) {
    showDevModeModal.value = true;
    logoClickCount.value = 0;
    // Prevent modal from closing immediately
    modalJustOpened.value = true;
    setTimeout(() => {
      modalJustOpened.value = false;
    }, 300);
    return;
  }
  
  // Reset count after 2 seconds of no clicks
  logoClickTimer.value = setTimeout(() => {
    logoClickCount.value = 0;
    logoClickTimer.value = null;
  }, 2000);
}

function toggleDevMode() {
  setDevMode(!devMode.value);
}

function closeDevModeModal() {
  // Prevent closing if modal just opened
  if (modalJustOpened.value) return;
  showDevModeModal.value = false;
}

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
    if (tabId === 'settings') {
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
        <div class="logo-section logo-tap-zone" @click="handleLogoClick" @touchend.prevent="handleLogoClick">
          <img src="/kb1_title.svg" alt="KB1 CONFIGURATOR" class="header-logo" />
          <!-- Tap counter (shows after 2nd tap) -->
          <div v-if="showTapCounter" class="tap-counter">{{ logoClickCount }}</div>
        </div>
      </div>
      
      <div v-if="!isBluetoothAvailable" class="warning-banner">
        ⚠️ Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.
      </div>
    </header>
    
    <!-- Unified Tab Navigation with Bluetooth Controls -->
    <div v-if="!hideUI" class="tab-nav-wrapper">
      <nav class="app-nav">
        <!-- Theme toggle button (far left) -->
        <button 
          class="theme-toggle"
          @click="toggleTheme"
          :title="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        >
          <img :src="themeIcon" :alt="isDarkMode ? 'Light Mode' : 'Dark Mode'" class="theme-icon" />
        </button>
        
        <!-- Vertical divider after theme -->
        <div class="separator"></div>
        
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
        </div>
        
        <!-- Vertical divider before Bluetooth -->
        <div class="separator"></div>
        
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
      <MobileScales v-if="activeTab === 'settings'" ref="mobileScalesRef" />
      <MobileSliders v-if="activeTab === 'sliders'" ref="mobileSlidersRef" />
    </main>
    
    <!-- Pulsing Red Dot - Dev Mode Indicator -->
    <div v-if="devMode" class="dev-mode-indicator" title="Developer Mode Active">
      <div class="pulse-dot"></div>
    </div>
    
    <!-- Secret Dev Mode Modal -->
    <div v-if="showDevModeModal" class="dev-mode-modal-overlay" @click.self="closeDevModeModal">
      <div class="dev-mode-modal">
        <h2>🔧 Developer Mode</h2>
        <div class="modal-content">
          <div class="dev-mode-warning">
            <p><strong>⚠️ Warning:</strong> Developer mode simulates device connection with mock data.</p>
            <p>This is intended for development and testing purposes only.</p>
            <p class="status-line"><strong>Current Status:</strong> <span :class="{ 'status-enabled': devMode, 'status-disabled': !devMode }">{{ devMode ? 'ENABLED' : 'DISABLED' }}</span></p>
          </div>
          
          <div class="dev-mode-toggle">
            <label class="toggle-switch">
              <input type="checkbox" :checked="devMode" @change="toggleDevMode" />
              <span class="toggle-slider"></span>
            </label>
            <span class="toggle-label">{{ devMode ? 'Disable' : 'Enable' }} Developer Mode</span>
          </div>
          
          <div class="modal-note">
            <p>💡 Tip: Tap the logo 5 times to toggle this menu</p>
          </div>
        </div>
        
        <div class="dev-mode-actions">
          <button class="btn-modal-close" @click="closeDevModeModal">Close</button>
        </div>
      </div>
    </div>
    
    <!-- Toast Notifications Container -->
    <div class="toast-container">
      <ToastNotification
        v-for="toast in toasts"
        :key="toast.id"
        :message="toast.message"
        :type="toast.type"
        :duration="toast.duration"
        @close="remove(toast.id)"
      />
    </div>
    
    <!-- Confirm Dialogs -->
    <ConfirmDialog
      v-for="dialog in dialogs"
      :key="dialog.id"
      :message="dialog.message"
      :position="dialog.position"
      @confirm="removeDialog(dialog.id, true)"
      @cancel="removeDialog(dialog.id, false)"
    />
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
  touch-action: manipulation; /* Disable double-tap zoom */
  -webkit-text-size-adjust: 100%; /* Prevent font scaling */
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
  touch-action: manipulation; /* Disable double-tap zoom */
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

.logo-tap-zone {
  cursor: pointer;
  position: relative;
  touch-action: manipulation; /* Disable double-tap zoom */
  user-select: none; /* Prevent text selection */
  -webkit-user-select: none;
  -webkit-touch-callout: none; /* Disable iOS callout */
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
  gap: 0.5rem;
}

.nav-tab {
  padding: 1rem 1rem;
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
  font-size: 0.8125rem;
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
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s, transform 0.2s;
  opacity: 0.6;
  flex-shrink: 0;
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

/* Vertical separator (divider) between theme and tabs */
.separator {
  width: 2px;
  height: 18px;
  background: var(--color-divider);
  align-self: center;
  flex-shrink: 0;
  margin: 0 0.25rem;
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

/* ===== Dev Mode Components ===== */

/* Tap Counter */
.tap-counter {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #F9AC20;
  color: #0F0F0F;
  font-size: 0.75rem;
  font-weight: 700;
  font-family: 'Roboto Mono', monospace;
  padding: 0.25rem 0.5rem;
  border-radius: 50%;
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: bounce-in 0.2s ease-out;
  box-shadow: 0 2px 8px rgba(249, 172, 32, 0.4);
}

@keyframes bounce-in {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* Pulsing Red Dot Indicator */
.dev-mode-indicator {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 10000;
  pointer-events: none;
}

.pulse-dot {
  width: 12px;
  height: 12px;
  background: #ef4444;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
  animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.3);
  }
}

/* Dev Mode Modal */
.dev-mode-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
  backdrop-filter: blur(4px);
  touch-action: manipulation; /* Prevent zoom on mobile */
  user-select: none;
  -webkit-user-select: none;
}

.dev-mode-modal {
  background: var(--color-background);
  border: 2px solid #F9AC20;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  animation: modal-slide-in 0.3s ease-out;
  touch-action: manipulation; /* Prevent zoom */
  user-select: none;
  -webkit-user-select: none;
}

@keyframes modal-slide-in {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dev-mode-modal h2 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #F9AC20;
  font-family: 'Roboto Mono', monospace;
  text-align: center;
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.dev-mode-warning {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  padding: 1rem;
  font-size: 0.8125rem;
  line-height: 1.6;
}

.dev-mode-warning p {
  margin: 0 0 0.5rem 0;
}

.dev-mode-warning p:last-child {
  margin-bottom: 0;
}

.status-line {
  font-size: 0.875rem;
  margin-top: 0.75rem !important;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(239, 68, 68, 0.2);
}

.status-enabled {
  color: #10b981;
  font-weight: 700;
}

.status-disabled {
  color: #ef4444;
  font-weight: 700;
}

.dev-mode-toggle {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(249, 172, 32, 0.1);
  border: 1px solid rgba(249, 172, 32, 0.3);
  border-radius: 6px;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: 0.3s;
  border-radius: 28px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #F9AC20;
  border-color: #F9AC20;
}

input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

.toggle-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.modal-note {
  background: rgba(249, 172, 32, 0.05);
  border: 1px solid rgba(249, 172, 32, 0.2);
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-align: center;
}

.modal-note p {
  margin: 0;
}

.dev-mode-actions {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.btn-modal-close {
  padding: 0.5rem 2rem;
  background: rgba(249, 172, 32, 0.2);
  border: 1px solid rgba(249, 172, 32, 0.4);
  color: var(--color-text);
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Roboto Mono', monospace;
}

.btn-modal-close:hover {
  background: rgba(249, 172, 32, 0.3);
  border-color: rgba(249, 172, 32, 0.6);
  box-shadow: 0 0 8px rgba(249, 172, 32, 0.3);
}

.btn-modal-close:active {
  transform: scale(0.98);
}

/* Toast Notifications Container */
.toast-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
  align-items: center;
}

@media (max-width: 640px) {
  .toast-container {
    width: 90vw;
  }
}
</style>
