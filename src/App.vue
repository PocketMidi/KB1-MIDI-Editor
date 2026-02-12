<script setup lang="ts">
import { ref } from 'vue';
import ConnectionStatus from './components/ConnectionStatus.vue';
import MidiEditor from './pages/MidiEditor.vue';
import DeviceSettings from './pages/DeviceSettings.vue';
import LandingPage from './pages/LandingPage.vue';
import MobileHeader from './components/MobileHeader.vue';
import MobileTabNav from './components/MobileTabNav.vue';
import BottomNav from './components/BottomNav.vue';
import MobileControls from './pages/MobileControls.vue';
import MobileScales from './pages/MobileScales.vue';
import MobileSliders from './pages/MobileSliders.vue';
import { useDeviceState } from './composables/useDeviceState';
import './styles/themes/kb1.css';

const { 
  isBluetoothAvailable, 
  isConnected, 
  deviceName, 
  connectionStatus,
  connect, 
  disconnect,
  isLoading,
  handleLoad,
  saveToFlash
} = useDeviceState();

// Desktop tabs
type DesktopTab = 'midi-editor' | 'device-settings' | 'live-sliders';
const activeDesktopTab = ref<DesktopTab>('midi-editor');

// Mobile tabs
type MobileTab = 'controls' | 'scales' | 'sliders';
const activeMobileTab = ref<MobileTab>('controls');

const mobileTabs = [
  { id: 'controls', label: 'Controls' },
  { id: 'scales', label: 'Scales' },
  { id: 'sliders', label: 'Sliders' }
];

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

// Handler functions for mobile header actions
// Note: Back and Menu buttons are placeholders for future functionality
// Back: Could navigate to a home/landing screen or previous view
// Menu: Could open a settings drawer or additional options menu
function handleBack() {
  // TODO: Implement navigation to home screen or previous view
  console.log('Back button clicked - navigation not yet implemented');
}

function handleMenu() {
  // TODO: Implement settings menu or options drawer
  console.log('Menu button clicked - menu not yet implemented');
}

async function handleBottomSync() {
  if (!isConnected) return;
  try {
    await handleLoad();
    alert('Settings synced from device');
  } catch (error) {
    console.error('Sync failed:', error);
    alert('Failed to sync settings');
  }
}

async function handleBottomSave() {
  if (!isConnected) return;
  try {
    await saveToFlash();
    alert('Settings saved to device');
  } catch (error) {
    console.error('Save failed:', error);
    alert('Failed to save settings');
  }
}

function handleBottomHome() {
  activeMobileTab.value = 'controls';
}
</script>

<template>
  <div class="app theme-kb1">
    <!-- Mobile Layout (< 769px) -->
    <div class="mobile-layout">
      <MobileHeader
        :is-connected="isConnected"
        :device-name="deviceName"
        @back="handleBack"
        @menu="handleMenu"
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
        v-model="activeMobileTab"
      />
      
      <main class="mobile-main">
        <MobileControls v-if="activeMobileTab === 'controls'" />
        <MobileScales v-if="activeMobileTab === 'scales'" />
        <MobileSliders v-if="activeMobileTab === 'sliders'" />
      </main>
      
      <BottomNav
        :is-connected="isConnected"
        :disabled="isLoading"
        @home="handleBottomHome"
        @sync="handleBottomSync"
        @save="handleBottomSave"
      />
    </div>
    
    <!-- Desktop Layout (>= 769px) -->
    <div class="desktop-layout">
      <header class="app-header">
        <div class="header-content">
          <div class="logo-section">
            <h1>KB1 MIDI Editor</h1>
            <p class="tagline">Wireless Bluetooth Configuration</p>
          </div>
          
          <div class="header-actions">
            <ConnectionStatus 
              :is-connected="isConnected"
              :device-name="deviceName"
              :error="connectionStatus.error"
            />
            
            <button 
              v-if="!isConnected"
              class="btn btn-connect"
              @click="handleConnect"
              :disabled="!isBluetoothAvailable || isLoading"
            >
              <span v-if="isLoading">Connecting...</span>
              <span v-else>Connect Device</span>
            </button>
            
            <button 
              v-else
              class="btn btn-disconnect"
              @click="handleDisconnect"
              :disabled="isLoading"
            >
              Disconnect
            </button>
          </div>
        </div>
        
        <div v-if="!isBluetoothAvailable" class="warning-banner">
          ⚠️ Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.
        </div>
      </header>
      
      <nav class="app-nav">
        <button 
          class="nav-tab"
          :class="{ active: activeDesktopTab === 'midi-editor' }"
          @click="activeDesktopTab = 'midi-editor'"
        >
          FADERS
        </button>
        <button 
          class="nav-tab"
          :class="{ active: activeDesktopTab === 'live-sliders' }"
          @click="activeDesktopTab = 'live-sliders'"
        >
          LIVE SLIDERS
        </button>
        <button 
          class="nav-tab"
          :class="{ active: activeDesktopTab === 'device-settings' }"
          @click="activeDesktopTab = 'device-settings'"
        >
          SETTINGS
        </button>
      </nav>
      
      <main class="app-main">
        <MidiEditor v-if="activeDesktopTab === 'midi-editor'" />
        <LandingPage v-if="activeDesktopTab === 'live-sliders'" />
        <DeviceSettings v-if="activeDesktopTab === 'device-settings'" />
      </main>
      
      <footer class="app-footer">
        <p>KB1 MIDI Editor - Web Bluetooth Configuration Tool</p>
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
  --color-background: #1a1a1a;
  --color-background-soft: #242424;
  --color-background-mute: #2a2a2a;
  --color-border: #3a3a3a;
  --color-border-hover: #4a4a4a;
  --color-text: #ffffff;
  --color-text-muted: #a0a0a0;
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
  background: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.logo-section h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tagline {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
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
  background: var(--color-background-mute);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  gap: 0;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 0 2rem;
}

.nav-tab {
  padding: 1rem 1.5rem;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.nav-tab:hover {
  color: var(--color-text);
  background: var(--color-background-soft);
}

.nav-tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.app-main {
  flex: 1;
  background: var(--color-background);
}

.app-footer {
  background: var(--color-background-soft);
  border-top: 1px solid var(--color-border);
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
