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
type Tab = 'controls' | 'scales' | 'sliders';
const activeTab = ref<Tab>('controls');

const tabs = [
  { id: 'controls' as Tab, label: 'CONTROLS' },
  { id: 'scales' as Tab, label: 'SCALES' },
  { id: 'sliders' as Tab, label: 'SLIDERS' }
];

// Hover state for bluetooth connection section (text and icon)
const isHoveringStatus = ref(false);

// Modal states
const showFirstTimeOverlay = ref(false);
const showContextualModal = ref(false);

// Computed property for bluetooth status text
const bluetoothStatusText = computed(() => {
  if (isConnected.value) {
    return isHoveringStatus.value ? 'DISCONNECT' : 'CONNECTED';
  }
  return isHoveringStatus.value ? 'CONNECT' : 'DISCONNECTED';
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

</script>

<template>
  <div class="app theme-kb1">
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
    <header class="app-header">
      <div class="header-content">
        <!-- KB1 logo - centered, no buttons -->
        <div class="logo-section">
          <img src="/kb1-title.svg" alt="KB1 CONFIGURATOR" class="header-logo" />
        </div>
      </div>
      
      <div v-if="!isBluetoothAvailable" class="warning-banner">
        ⚠️ Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.
      </div>
    </header>
    
    <!-- Unified Tab Navigation with Bluetooth Controls -->
    <div class="tab-nav-wrapper">
      <nav class="app-nav">
        <div class="nav-tabs">
          <button 
            v-for="tab in tabs"
            :key="tab.id"
            class="nav-tab"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
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
    
    <main class="app-main" @click="handleMainClick">
      <MobileControls v-if="activeTab === 'controls'" />
      <MobileScales v-if="activeTab === 'scales'" />
      <MobileSliders v-if="activeTab === 'sliders'" />
    </main>
    
    <footer class="app-footer">
      <p>KB1 config - Web Bluetooth Configuration Tool</p>
      <p class="footer-note">
        <strong>Note:</strong> This app requires HTTPS and a Bluetooth-enabled device. 
        Ensure your browser supports Web Bluetooth API.
      </p>
    </footer>
  </div>
</template>

<style>
/* Import Roboto Mono font */
@import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap');

:root {
  --color-background: #0F0F0F;
  --color-background-soft: #0F0F0F;
  --color-background-mute: #0F0F0F;
  --color-border: transparent;
  --color-border-hover: transparent;
  --color-text: #EAEAEA;
  --color-text-muted: rgba(234, 234, 234, 0.32);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Roboto Mono', 'Courier New', Courier, monospace;
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
  font-size: 0.875rem;
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
  background: #0F0F0F;
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
  height: 60px;
  width: auto;
}

.warning-banner {
  padding: 1rem 2rem;
  background: rgba(239, 68, 68, 0.1);
  border-top: 1px solid #ef4444;
  color: #fca5a5;
  text-align: center;
  font-size: 0.875rem;
}

/* Tab Navigation Wrapper - sticky with background */
.tab-nav-wrapper {
  position: sticky;
  top: 0;
  z-index: 200; /* High z-index to stay above header */
  background: #0F0F0F;
}

/* Tab Navigation - Unified responsive layout */
.app-nav {
  background: #0F0F0F;
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
}

.nav-tabs {
  display: flex;
  align-items: stretch;
  gap: 0;
}

.nav-tab {
  padding: 1rem 1.5rem;
  background: transparent;
  border: none;
  border-radius: 0;
  color: #EAEAEA;
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
  color: #EAEAEA;
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
  background: #EAEAEA;
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
  background: #EAEAEA;
  opacity: 0.32;
  border-radius: 1px;
}

/* Vertical separator (divider) after tabs */
.separator {
  width: 2px;
  height: 50%;
  background: rgba(234, 234, 234, 0.3);
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
  font-size: 0.875rem;
  color: #47708E;
  opacity: 0.5;
  transition: color 0.5s ease-in-out, 
              opacity 0.5s ease-in-out, 
              font-weight 0.5s ease-in-out;
  transform-origin: center;
}

.bluetooth-status.hoverable:hover .status-text,
.bluetooth-status.hoverable:active .status-text {
  color: #74C4FF;
  opacity: 1;
  font-weight: 700;
  /* NO transform scale */
}

.bluetooth-status.connected .status-text {
  opacity: 1;
}

.bluetooth-icon {
  height: 32px; /* Scaled up ~60% from typical 20px base for better visibility */
  width: auto;
  transition: filter 0.5s ease-in-out, 
              transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  transform-origin: center;
}

/* Bluetooth icon hover effect - with bounce animation */
.bluetooth-status.hoverable:hover .bluetooth-icon,
.bluetooth-status.hoverable:active .bluetooth-icon {
  filter: brightness(0) saturate(100%) invert(65%) sepia(45%) saturate(1154%) hue-rotate(174deg) brightness(101%) contrast(101%);
  transform: scale(1.15);
}

.bluetooth-status.connected .bluetooth-icon {
  filter: none;
  transform: none;
}

.bluetooth-status.connected.hoverable:hover .bluetooth-icon {
  filter: brightness(0) saturate(100%) invert(65%) sepia(45%) saturate(1154%) hue-rotate(174deg) brightness(101%) contrast(101%);
  transform: scale(1.15);
}

/* Horizontal divider under navigation */
.nav-divider {
  height: 3px;
  background: rgba(234, 234, 234, 0.3);
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.app-main {
  flex: 1;
  background: var(--color-background);
  padding-bottom: 100px; /* Add padding to account for fixed footer bar */
}

.app-footer {
  background: var(--color-background-soft);
  border-top: none;
  padding: 2rem;
  text-align: center;
  margin-top: auto;
  margin-bottom: 80px; /* Account for fixed action bar at bottom */
}

.app-footer p {
  margin: 0.5rem 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.footer-note {
  font-size: 0.75rem;
}

/* Responsive adjustments using CSS media queries only */
@media (max-width: 640px) {
  .app-nav {
    padding: 0 1rem;
  }
  
  .nav-tab {
    font-size: 0.8125rem;
    padding: 0.75rem 1rem;
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
}

@media (max-width: 480px) {
  .header-content {
    padding: 1rem 1.5rem;
  }
  
  .header-logo {
    height: 50px;
  }
  
  .nav-tab {
    font-size: 0.75rem;
    padding: 0.75rem 0.75rem;
  }
  
  .bluetooth-status {
    padding: 0.75rem 0.75rem;
    gap: 0.4rem;
  }
  
  .status-text {
    font-size: 0.75rem;
  }
  
  .bluetooth-icon {
    height: 24px;
  }
}
</style>
