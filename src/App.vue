<script setup lang="ts">
import { ref } from 'vue';
import ConnectionStatus from './components/ConnectionStatus.vue';
import MidiEditor from './pages/MidiEditor.vue';
import DeviceSettings from './pages/DeviceSettings.vue';
import { useDeviceState } from './composables/useDeviceState';
import './styles/themes/kb1.css';

const { 
  isBluetoothAvailable, 
  isConnected, 
  deviceName, 
  connectionStatus,
  connect, 
  disconnect,
  isLoading 
} = useDeviceState();

type Tab = 'midi-editor' | 'device-settings';
const activeTab = ref<Tab>('midi-editor');

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
        :class="{ active: activeTab === 'midi-editor' }"
        @click="activeTab = 'midi-editor'"
      >
        MIDI Editor
      </button>
      <button 
        class="nav-tab"
        :class="{ active: activeTab === 'device-settings' }"
        @click="activeTab = 'device-settings'"
      >
        Device Settings
      </button>
    </nav>
    
    <main class="app-main">
      <MidiEditor v-if="activeTab === 'midi-editor'" />
      <DeviceSettings v-if="activeTab === 'device-settings'" />
    </main>
    
    <footer class="app-footer">
      <p>KB1 MIDI Editor - Web Bluetooth Configuration Tool</p>
      <p class="footer-note">
        <strong>Note:</strong> This app requires HTTPS and a Bluetooth-enabled device. 
        Ensure your browser supports Web Bluetooth API.
      </p>
    </footer>
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

.btn-disconnect {
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-disconnect:hover:not(:disabled) {
  background: var(--color-background-mute);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    flex-direction: column;
  }
  
  .app-nav {
    padding: 0 1rem;
  }
  
  .nav-tab {
    flex: 1;
    text-align: center;
  }
}
</style>
