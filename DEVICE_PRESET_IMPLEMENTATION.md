# KB1 Web App - Device Preset Integration

This guide describes the web app changes needed to support 8 firmware preset slots.

## Overview

- **Device presets** - 8 slots stored on KB1 ESP32
- **Browser presets** - Unlimited, stored in localStorage (existing)
- **Community sharing** - Export to GitHub-ready JSON format

## Implementation Plan

### Phase 1: Add BLE Preset Protocol

File: `src/ble/kb1Protocol.ts`

Add new interfaces and constants:

```typescript
/**
 * Device preset metadata (from firmware)
 */
export interface DevicePresetMetadata {
  slot: number;           // 0-7
  name: string;           // Max 32 chars
  timestamp: number;      // Unix timestamp
  isValid: boolean;       // true if slot has data
}

/**
 * Device preset system constants
 */
export const DEVICE_PRESET = {
  MAX_SLOTS: 8,
  NAME_MAX_LENGTH: 32,
  EMPTY_SLOT_NAME: '[Empty]',
} as const;

/**
 * BLE Characteristic UUIDs for presets
 */
export const PRESET_CHARACTERISTIC_UUIDS = {
  SAVE: 'd3a7b321-0001-4000-8000-000000000009',
  LOAD: 'd3a7b321-0001-4000-8000-00000000000a',
  LIST: 'd3a7b321-0001-4000-8000-00000000000b',
  DELETE: 'd3a7b321-0001-4000-8000-00000000000c',
} as const;
```

Add encoding/decoding functions:

```typescript
/**
 * Encode preset save command
 * Format: [slot#(1 byte)][name(32 bytes)]
 */
export function encodePresetSave(slot: number, name: string): Uint8Array {
  if (slot < 0 || slot >= DEVICE_PRESET.MAX_SLOTS) {
    throw new Error(`Invalid slot: ${slot}`);
  }
  
  const buffer = new Uint8Array(33);
  buffer[0] = slot;
  
  // Encode name (truncate/pad to 32 bytes)
  const nameBytes = new TextEncoder().encode(name.slice(0, DEVICE_PRESET.NAME_MAX_LENGTH));
  buffer.set(nameBytes, 1);
  
  return buffer;
}

/**
 * Encode preset load command
 * Format: [slot#(1 byte)]
 */
export function encodePresetLoad(slot: number): Uint8Array {
  if (slot < 0 || slot >= DEVICE_PRESET.MAX_SLOTS) {
    throw new Error(`Invalid slot: ${slot}`);
  }
  
  return new Uint8Array([slot]);
}

/**
 * Encode preset delete command
 * Format: [slot#(1 byte)]
 */
export function encodePresetDelete(slot: number): Uint8Array {
  if (slot < 0 || slot >= DEVICE_PRESET.MAX_SLOTS) {
    throw new Error(`Invalid slot: ${slot}`);
  }
  
  return new Uint8Array([slot]);
}

/**
 * Decode preset list response
 * Format: [meta0][meta1]...[meta7] (37 bytes each)
 */
export function decodePresetList(data: DataView): DevicePresetMetadata[] {
  const METADATA_SIZE = 40; // 32 (name) + 4 (timestamp) + 1 (isValid) + 3 (padding)
  const presets: DevicePresetMetadata[] = [];
  
  for (let slot = 0; slot < DEVICE_PRESET.MAX_SLOTS; slot++) {
    const offset = slot * METADATA_SIZE;
    
    // Extract name (32 bytes, null-terminated)
    const nameBytes = new Uint8Array(data.buffer, offset, 32);
    const nullIndex = nameBytes.indexOf(0);
    const name = new TextDecoder().decode(
      nullIndex >= 0 ? nameBytes.slice(0, nullIndex) : nameBytes
    );
    
    // Extract timestamp (4 bytes, little-endian)
    const timestamp = data.getUint32(offset + 32, true);
    
    // Extract isValid (1 byte)
    const isValid = data.getUint8(offset + 36) === 1;
    
    presets.push({
      slot,
      name: name || DEVICE_PRESET.EMPTY_SLOT_NAME,
      timestamp,
      isValid,
    });
  }
  
  return presets;
}
```

### Phase 2: Add BLE Client Support

File: `src/ble/bleClient.ts` (add to existing BLEClient class)

Add characteristic properties:

```typescript
private presetSaveCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
private presetLoadCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
private presetListCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
private presetDeleteCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
```

Add to `connect()` method (after discovering existing characteristics):

```typescript
// Discover preset characteristics
try {
  this.presetSaveCharacteristic = await service.getCharacteristic(PRESET_CHARACTERISTIC_UUIDS.SAVE);
  this.presetLoadCharacteristic = await service.getCharacteristic(PRESET_CHARACTERISTIC_UUIDS.LOAD);
  this.presetListCharacteristic = await service.getCharacteristic(PRESET_CHARACTERISTIC_UUIDS.LIST);
  this.presetDeleteCharacteristic = await service.getCharacteristic(PRESET_CHARACTERISTIC_UUIDS.DELETE);
  console.log('Device preset characteristics discovered');
} catch (error) {
  console.warn('Device preset characteristics not available (older firmware?)');
}
```

Add new public methods:

```typescript
/**
 * Save current settings to device preset slot
 */
async saveDevicePreset(slot: number, name: string): Promise<void> {
  if (!this.presetSaveCharacteristic) {
    throw new Error('Device presets not supported');
  }
  
  const data = encodePresetSave(slot, name);
  await this.presetSaveCharacteristic.writeValue(data);
  console.log(`Saved to device preset slot ${slot}: ${name}`);
}

/**
 * Load settings from device preset slot
 */
async loadDevicePreset(slot: number): Promise<void> {
  if (!this.presetLoadCharacteristic) {
    throw new Error('Device presets not supported');
  }
  
  const data = encodePresetLoad(slot);
  await this.presetLoadCharacteristic.writeValue(data);
  console.log(`Loaded from device preset slot ${slot}`);
  
  // After loading, read back all settings
  await this.loadFromDevice();
}

/**
 * List all device preset slots
 */
async listDevicePresets(): Promise<DevicePresetMetadata[]> {
  if (!this.presetListCharacteristic) {
    throw new Error('Device presets not supported');
  }
  
  const dataView = await this.presetListCharacteristic.readValue();
  return decodePresetList(dataView);
}

/**
 * Delete device preset slot
 */
async deleteDevicePreset(slot: number): Promise<void> {
  if (!this.presetDeleteCharacteristic) {
    throw new Error('Device presets not supported');
  }
  
  const data = encodePresetDelete(slot);
  await this.presetDeleteCharacteristic.writeValue(data);
  console.log(`Deleted device preset slot ${slot}`);
}

/**
 * Check if device supports presets
 */
hasDevicePresetSupport(): boolean {
  return this.presetSaveCharacteristic !== null;
}
```

### Phase 3: Update Device State Composable

File: `src/composables/useDeviceState.ts`

Add reactive state:

```typescript
const devicePresets = ref<DevicePresetMetadata[]>([]);
const hasDevicePresetSupport = ref(false);
```

Add methods to return object:

```typescript
return {
  // ... existing exports
  
  // Device preset management
  devicePresets: readonly(devicePresets),
  hasDevicePresetSupport: readonly(hasDevicePresetSupport),
  
  async refreshDevicePresets() {
    if (!bleClient.hasDevicePresetSupport()) {
      devicePresets.value = [];
      hasDevicePresetSupport.value = false;
      return;
    }
    
    hasDevicePresetSupport.value = true;
    try {
      devicePresets.value = await bleClient.listDevicePresets();
    } catch (error) {
      console.error('Failed to refresh device presets:', error);
    }
  },
  
  async saveDevicePreset(slot: number, name: string) {
    await bleClient.saveDevicePreset(slot, name);
    await this.refreshDevicePresets();
  },
  
  async loadDevicePreset(slot: number) {
    await bleClient.loadDevicePreset(slot);
    // Settings will auto-update via existing listeners
  },
  
  async deleteDevicePreset(slot: number) {
    await bleClient.deleteDevicePreset(slot);
    await this.refreshDevicePresets();
  },
};
```

Update connection handler to check for preset support:

```typescript
// In connect() success handler, add:
hasDevicePresetSupport.value = bleClient.hasDevicePresetSupport();
if (hasDevicePresetSupport.value) {
  await this.refreshDevicePresets();
}
```

### Phase 4: Update PresetManager Component

File: `src/components/PresetManager.vue`

Add device preset section to template (before browser presets):

```vue
<template>
  <div class="preset-manager">
    <!-- Device Presets Section (if supported) -->
    <div v-if="hasDevicePresetSupport && isConnected" class="preset-section">
      <h4 class="section-title">Device Presets (On KB1)</h4>
      <p class="section-subtitle">Stored in KB1 flash memory • 8 slots</p>
      
      <div class="device-presets-grid">
        <div
          v-for="slot in 8"
          :key="`device-${slot - 1}`"
          class="device-preset-slot"
          :class="{ 
            empty: !getDevicePreset(slot - 1).isValid,
            active: activeDeviceSlot === (slot - 1)
          }"
        >
          <div class="slot-number">{{ slot }}</div>
          
          <div v-if="getDevicePreset(slot - 1).isValid" class="slot-content">
            <div class="slot-name">{{ getDevicePreset(slot - 1).name }}</div>
            <div class="slot-actions">
              <button class="btn-small" @click="loadFromDevice(slot - 1)">
                Load
              </button>
              <button class="btn-small" @click="saveToDevice(slot - 1)">
                Save
              </button>
              <button class="btn-small btn-danger" @click="deleteFromDevice(slot - 1)">
                Delete
              </button>
            </div>
          </div>
          
          <div v-else class="slot-empty">
            <button class="btn-small btn-create" @click="saveToDevice(slot - 1)">
              + Save Here
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Divider between device and browser presets -->
    <div v-if="hasDevicePresetSupport && isConnected" class="section-divider">
      <span>Browser Presets (Local Storage)</span>
    </div>
    
    <!-- Existing browser preset UI... -->
  </div>
</template>
```

Add script updates:

```typescript
import { useDeviceState } from '../composables/useDeviceState';

const { 
  isConnected,
  hasDevicePresetSupport,
  devicePresets,
  saveDevicePreset,
  loadDevicePreset,
  deleteDevicePreset,
  refreshDevicePresets,
} = useDeviceState();

const activeDeviceSlot = ref<number | null>(null);

function getDevicePreset(slot: number) {
  return devicePresets.value[slot] || { 
    slot, 
    name: '[Empty]', 
    timestamp: 0, 
    isValid: false 
  };
}

async function saveToDevice(slot: number) {
  const name = prompt('Enter preset name (max 32 characters):', `Preset ${slot + 1}`);
  if (!name) return;
  
  try {
    await saveDevicePreset(slot, name.slice(0, 32));
    activeDeviceSlot.value = slot;
  } catch (error) {
    console.error('Failed to save device preset:', error);
    alert('Failed to save to device');
  }
}

async function loadFromDevice(slot: number) {
  try {
    await loadDevicePreset(slot);
    activeDeviceSlot.value = slot;
    emit('preset-activated', null); // Clear browser preset active state
  } catch (error) {
    console.error('Failed to load device preset:', error);
    alert('Failed to load from device');
  }
}

async function deleteFromDevice(slot: number) {
  const preset = getDevicePreset(slot);
  if (!confirm(`Delete "${preset.name}" from slot ${slot + 1}?`)) return;
  
  try {
    await deleteDevicePreset(slot);
    if (activeDeviceSlot.value === slot) {
      activeDeviceSlot.value = null;
    }
  } catch (error) {
    console.error('Failed to delete device preset:', error);
    alert('Failed to delete device preset');
  }
}

// Refresh device presets when connected
watch(isConnected, async (connected) => {
  if (connected && hasDevicePresetSupport.value) {
    await refreshDevicePresets();
  }
});
```

Add styles:

```css
.preset-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-text);
  margin-bottom: 0.25rem;
}

.section-subtitle {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.device-presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.device-preset-slot {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0.75rem;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: border-color 0.2s;
}

.device-preset-slot.active {
  border-color: var(--accent-highlight);
  background: rgba(var(--accent-highlight-rgb), 0.05);
}

.device-preset-slot.empty {
  opacity: 0.5;
}

.slot-number {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text-muted);
}

.slot-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.slot-name {
  font-size: 0.8125rem;
  font-weight: 600;
  word-break: break-word;
}

.slot-actions {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.slot-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-divider {
  margin: 2rem 0;
  text-align: center;
  position: relative;
}

.section-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--color-divider);
}

.section-divider span {
  position: relative;
  background: var(--color-background);
  padding: 0 1rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
}
```

### Phase 5: Add Community Export Format

Update `src/state/presets.ts` to add GitHub-ready export:

```typescript
/**
 * Export preset in GitHub community format
 */
exportForCommunity(id: string, author: string = 'Anonymous'): string | null {
  const preset = this.getPreset(id);
  if (!preset) return null;
  
  const communityPreset = {
    name: preset.name,
    author,
    date: new Date(preset.modifiedAt).toISOString().split('T')[0],
    description: '', // User can fill this in
    tags: [],
    version: '1.0',
    settings: preset.settings,
  };
  
  return JSON.stringify(communityPreset, null, 2);
}
```

Add "Share to Community" button in PresetManager that generates GitHub-ready markdown:

```typescript
function exportForCommunity(presetId: string) {
  const preset = PresetStore.getPreset(presetId);
  if (!preset) return;
  
  const author = prompt('Your name/username:', 'Anonymous');
  const json = PresetStore.exportForCommunity(presetId, author || 'Anonymous');
  
  const markdown = `## ${preset.name}

**Author:** ${author}  
**Date:** ${new Date().toISOString().split('T')[0]}  
**Tags:** (add tags here)

### Description
(Add description here)

### Settings
\`\`\`json
${json}
\`\`\`

### Installation
1. Copy the JSON above
2. In KB1 Configurator, click "Import Preset"
3. Paste and import
`;
  
  // Copy to clipboard
  navigator.clipboard.writeText(markdown);
  alert('Community preset markdown copied to clipboard!\n\nPaste it into a GitHub Discussion post.');
}
```

## Testing Checklist

- [ ] Device preset list loads on connection
- [ ] Can save to any of 8 slots
- [ ] Can load from device slots
- [ ] Can delete device slots
- [ ] Device presets survive disconnect/reconnect
- [ ] Device presets survive device power cycle
- [ ] Browser presets still work independently
- [ ] Community export format generates valid JSON
- [ ] UI shows clear distinction between device/browser presets

## Future Enhancements

- [ ] Drag-and-drop to move presets between device/browser
- [ ] Bulk operations (copy all to device, backup all from device)
- [ ] Preset comparison view
- [ ] In-app GitHub preset browser (via GitHub API)

