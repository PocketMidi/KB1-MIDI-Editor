<script setup lang="ts">
import { ref } from 'vue';
import MobileHeader from './components/MobileHeader.vue';
import MobileTabNav from './components/MobileTabNav.vue';
import MobileControls from './pages/MobileControls.vue';
import MobileScales from './pages/MobileScales.vue';
import MobileSliders from './pages/MobileSliders.vue';
import { useDeviceState } from './composables/useDeviceState';
import './styles/themes/kb1.css';

const { 
  isBluetoothAvailable, 
  isConnected, 
  deviceName, 
  connect, 
  disconnect,
  isLoading
} = useDeviceState();

// Desktop tabs - now matching mobile structure
type DesktopTab = 'controls' | 'scales' | 'sliders';
const activeDesktopTab = ref<DesktopTab>('controls');

// Mobile tabs
type MobileTab = 'controls' | 'scales' | 'sliders';
const activeMobileTab = ref<MobileTab>('controls');

const mobileTabs = [
  { id: 'controls', label: 'CONTROLS' },
  { id: 'scales', label: 'SCALES' },
  { id: 'sliders', label: 'SLIDERS' }
];

// Hover state for bluetooth status text
const isHoveringStatus = ref(false);

async function handleConnect() {
  try {
    await connect();
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

async function handleDisconnect() {
  try {
    await disconnect();
  } catch (error) {
    console.error('Disconnect failed:', error);
  }
}


</script>

<template>
  <div class="app theme-kb1">
    <!-- Mobile Layout (< 769px) -->
    <div class="mobile-layout">
      <MobileHeader
        :is-connected="isConnected"
        :device-name="deviceName"
        @connect="handleConnect"
      />
      
      <div v-if="!isBluetoothAvailable" class="warning-banner">
        ⚠️ Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.
      </div>
      
      <div class="mobile-connect-section" v-if="!isConnected">
        <button 
          class="btn btn-connect mobile-connect-btn"
          @click="handleConnect"
          :disabled="!isBluetoothAvailable || isLoading"
        >
          <span v-if="isLoading">Connecting...</span>
          <span v-else>Connect Device</span>
        </button>
      </div>
      
      <button 
        v-if="isConnected"
        class="btn btn-disconnect mobile-disconnect-btn"
        @click="handleDisconnect"
        :disabled="isLoading"
      >
        Disconnect
      </button>
      
      <MobileTabNav
        :tabs="mobileTabs"
        :is-connected="isConnected"
        v-model="activeMobileTab"
      />
      
      <main class="mobile-main">
        <MobileControls v-if="activeMobileTab === 'controls'" />
        <MobileScales v-if="activeMobileTab === 'scales'" />
        <MobileSliders v-if="activeMobileTab === 'sliders'" />
      </main>
    </div>
    
    <!-- Desktop Layout (>= 769px) -->
    <div class="desktop-layout">
      <header class="app-header">
        <div class="header-content">
          <!-- Always show KB1 logo - centered, no button -->
          <div class="logo-section">
            <img src="/kb1-title.svg" alt="KB1 CONFIGURATOR" class="header-logo" />
          </div>
        </div>
        
        <div v-if="!isBluetoothAvailable" class="warning-banner">
          ⚠️ Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.
        </div>
      </header>
      
      <nav class="app-nav">
        <div class="nav-tabs">
          <button 
            class="nav-tab"
            :class="{ active: activeDesktopTab === 'controls' }"
            @click="activeDesktopTab = 'controls'"
          >
            CONTROLS
          </button>
          <button 
            class="nav-tab"
            :class="{ active: activeDesktopTab === 'scales' }"
            @click="activeDesktopTab = 'scales'"
          >
            SCALES
          </button>
          <button 
            class="nav-tab"
            :class="{ active: activeDesktopTab === 'sliders' }"
            @click="activeDesktopTab = 'sliders'"
          >
            SLIDERS
          </button>
        </div>
        
        <!-- Bluetooth status section -->
        <div class="bluetooth-status">
          <div class="separator"></div>
          <span 
            class="status-text" 
            :class="{ connected: isConnected, hoverable: !isConnected }"
            @click="!isConnected && handleConnect()"
            @mouseenter="!isConnected && (isHoveringStatus = true)"
            @mouseleave="isHoveringStatus = false"
          >
            {{ isConnected ? 'CONNECTED' : (isHoveringStatus ? 'CONNECT' : 'DISCONNECTED') }}
          </span>
          <img src="/bluetooth-icon.svg" alt="Bluetooth" class="bluetooth-icon" />
        </div>
      </nav>
      
      <!-- Horizontal divider under navigation -->
      <div class="nav-divider"></div>
      
      <main class="app-main">
        <MobileControls v-if="activeDesktopTab === 'controls'" />
        <MobileScales v-if="activeDesktopTab === 'scales'" />
        <MobileSliders v-if="activeDesktopTab === 'sliders'" />
      </main>
      
      <footer class="app-footer">
        <p>KB1 config - Web Bluetooth Configuration Tool</p>
        <p class="footer-note">
          <strong>Note:</strong> This app requires HTTPS and a Bluetooth-enabled device. 
          Ensure your browser supports Web Bluetooth API.
        </p>
      </footer>
    </div>
  </div>
</template>

<style>
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
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

/* But keep form controls disabled when disconnected */
.disconnected-state .form-control,
.disconnected-state input,
.disconnected-state select,
.disconnected-state button:not(.accordion-header),
.disconnected-state .group input,
.disconnected-state .group select {
  pointer-events: none !important;
  cursor: not-allowed !important;
}
</style>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Mobile Layout - Show by default, hide on desktop */
.mobile-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.mobile-connect-section {
  padding: 1rem;
  display: flex;
  justify-content: center;
}

.mobile-connect-btn {
  width: 100%;
  max-width: 400px;
}

.mobile-disconnect-btn {
  margin: 0.5rem 1rem;
  width: calc(100% - 2rem);
}

.mobile-main {
  flex: 1;
  overflow-y: auto;
  background: var(--color-background);
}

/* Desktop Layout - Hidden by default, show on tablet/desktop */
.desktop-layout {
  display: none;
}

@media (min-width: 769px) {
  .mobile-layout {
    display: none;
  }
  
  .desktop-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
}

.app-header {
  background: #0F0F0F;
  border-bottom: none;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
}

.logo-section {
  display: flex;
  align-items: center;
}

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
}

.nav-tabs {
  display: flex;
  gap: 0;
}

.nav-tab {
  padding: 1rem 1.5rem;
  background: transparent;
  border: none;
  border-radius: 0;
  color: #EAEAEA;
  font-family: 'Roboto Mono', monospace;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  opacity: 0.32;
  transition: all 0.2s;
  position: relative;
}

.nav-tab:hover {
  opacity: 0.6;
  background: transparent;
}

.nav-tab.active {
  color: #EAEAEA;
  opacity: 1;
}

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

/* Bluetooth status section in nav */
.bluetooth-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  white-space: nowrap;
}

.separator {
  width: 2px;
  height: 1.25rem;
  background: rgba(234, 234, 234, 0.3);
  align-self: center;
}

.status-text {
  font-family: 'Roboto Mono', monospace;
  font-weight: 700;
  font-size: 0.875rem;
  color: #47708E;
  opacity: 0.5;
  transition: all 0.2s;
}

.status-text.hoverable {
  cursor: pointer;
}

.status-text.hoverable:hover {
  color: #74C4FF;
  opacity: 1;
}

.status-text.connected {
  opacity: 1;
}

.bluetooth-icon {
  height: 32px;
  width: auto;
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
}

.app-footer {
  background: var(--color-background-soft);
  border-top: none;
  padding: 2rem;
  text-align: center;
  margin-top: auto;
}

.app-footer p {
  margin: 0.5rem 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.footer-note {
  font-size: 0.75rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-height: 44px; /* Mobile touch target */
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-bluetooth-connect {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 2px solid #47708E;
  border-radius: 6px;
  color: #47708E;
  font-family: 'Roboto Mono', monospace;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-bluetooth-connect:hover:not(:disabled) {
  background: rgba(71, 112, 142, 0.1);
}

.btn-bluetooth-connect:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-bluetooth-connect:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-connect {
  background: #3b82f6;
  color: white;
}

.btn-connect:hover:not(:disabled) {
  background: #2563eb;
}

.btn-connect:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-disconnect {
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-disconnect:hover:not(:disabled) {
  background: var(--color-background-mute);
}

.btn-disconnect:active:not(:disabled) {
  transform: scale(0.98);
}
</style>
