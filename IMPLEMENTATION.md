# KB1 MIDI Editor - Implementation Notes

## Project Overview

This is a complete browser-based MIDI editor for the PocketMidi KB1 device, built with Vue 3, Vite, and TypeScript, using the Web Bluetooth API for wireless communication.

## What's Been Implemented

### 1. Project Setup ✅
- Vue 3 with Composition API
- Vite build system
- TypeScript with strict type checking
- Web Bluetooth API types (@types/web-bluetooth)
- GitHub Actions deployment workflow

### 2. Architecture ✅

**BLE Transport Layer** (`src/ble/bleClient.ts`)
- Web Bluetooth API integration
- Connection/disconnection management
- Device discovery with filters
- GATT server communication
- Characteristic read/write/notify
- Error handling and status callbacks
- Clean singleton pattern

**KB1 Protocol Layer** (`src/ble/kb1Protocol.ts`)
- Message type definitions
- CC mapping data structures
- Device settings structures
- Encode/decode methods (stubbed, ready for implementation)
- Validation functions
- Default configuration generators

**State Management** (`src/composables/useDeviceState.ts`)
- Vue 3 Composition API composable
- Reactive state for connection, CC mappings, settings
- Centralized device operations
- BLE client integration
- Protocol integration

**UI Components**
- `ConnectionStatus.vue` - Visual connection indicator
- `CCMappingCard.vue` - Individual fader configuration card
- `MidiEditor.vue` - Main MIDI editor page with grid of faders
- `DeviceSettings.vue` - Device configuration page
- `App.vue` - Main app with header, navigation, and routing

### 3. Features ✅

**Connection Management**
- User gesture requirement (security)
- Device selection dialog
- Connection status indicator
- Disconnect functionality
- Browser compatibility detection
- Error handling and display

**MIDI Editor**
- 8 fader CC mapping cards (expandable)
- Per-fader configuration:
  - CC number (0-127)
  - MIDI channel (1-16)
  - Min/Max values (0-127)
- Actions:
  - Load from Device
  - Apply to Device
  - Save to Flash
- Disabled state when disconnected
- Change tracking

**Device Settings**
- Device name input
- MIDI channel selector
- Brightness slider (0-100%)
- Actions:
  - Load from Device
  - Apply to Device
  - Reset changes
  - Save to Flash
- Form validation
- Change tracking

### 4. Deployment Configuration ✅
- Vite config with relative paths for GitHub Pages
- GitHub Actions workflow for automatic deployment
- HTTPS-ready (required for Web Bluetooth)
- Production build optimization

## What Needs KB1-Specific Implementation

### 1. BLE UUIDs (Priority: HIGH)

**File:** `src/ble/bleClient.ts`

Replace these placeholders:
```typescript
const KB1_SERVICE_UUID = '00000000-0000-0000-0000-000000000000'; // TODO
const KB1_CHARACTERISTIC_UUID = '00000000-0000-0000-0000-000000000000'; // TODO
```

With actual KB1 UUIDs. Also update the device filter:
```typescript
filters: [
  { namePrefix: 'KB1' }, // Update with actual device name
  // { services: [KB1_SERVICE_UUID] }
],
```

### 2. Protocol Implementation (Priority: HIGH)

**File:** `src/ble/kb1Protocol.ts`

Implement the actual KB1 binary protocol:

**Encoding Methods:**
- `encodeGetCCMappings()` - Request CC mappings from device
- `encodeSetCCMapping(mapping)` - Send CC mapping to device
- `encodeGetSettings()` - Request device settings
- `encodeSetSettings(settings)` - Send device settings
- `encodeSaveToFlash()` - Command to save to persistent storage

**Decoding Methods:**
- `decodeMessage(data)` - Parse incoming messages
- `decodeCCMapping(data)` - Parse CC mapping response
- `decodeSettings(data)` - Parse settings response

**Message Types:**
Update `KB1MessageType` enum with actual message IDs from KB1 spec.

### 3. Additional Settings (Priority: MEDIUM)

**File:** `src/ble/kb1Protocol.ts`

Add KB1-specific settings to `DeviceSettings` interface:
```typescript
export interface DeviceSettings {
  deviceName: string;
  midiChannel: number;
  brightness: number;
  // TODO: Add KB1-specific settings:
  // - LED color modes
  // - Velocity curves
  // - Aftertouch sensitivity
  // - etc.
}
```

Update `src/pages/DeviceSettings.vue` to add UI controls for new settings.

### 4. Fader Count (Priority: LOW)

**File:** `src/composables/useDeviceState.ts`

Update the number of faders to match KB1 hardware:
```typescript
ccMappings.value = Array.from({ length: 8 }, (_, i) => 
  kb1Protocol.createDefaultCCMapping(i)
);
```

Change `8` to the actual number of faders on the KB1 device.

## Testing Checklist

Before integration with real KB1 hardware:

- [ ] Update all KB1_*_UUID constants with real values
- [ ] Implement all encode* methods with correct binary format
- [ ] Implement all decode* methods with correct binary parsing
- [ ] Test connection with actual KB1 device
- [ ] Verify CC mappings are correctly sent/received
- [ ] Verify device settings are correctly sent/received
- [ ] Test save to flash functionality
- [ ] Test disconnect/reconnect scenarios
- [ ] Test error handling (device out of range, etc.)
- [ ] Verify all MIDI channels work (1-16)
- [ ] Verify all CC numbers work (0-127)
- [ ] Test on different browsers (Chrome, Edge, Opera)
- [ ] Test on mobile devices (Android Chrome)
- [ ] Deploy to GitHub Pages and test over HTTPS

## Browser Compatibility

**Supported:**
- Chrome/Chromium 56+
- Edge 79+
- Opera 43+

**Not Supported:**
- Firefox (requires flag, experimental)
- Safari (not supported)

**Platform Support:**
- Windows ✅
- macOS ✅
- Linux ✅
- Android ✅ (Chrome)
- iOS ❌ (no Web Bluetooth support)

## Development Workflow

1. **Local Development:**
   ```bash
   npm install
   npm run dev
   ```
   Access at `http://localhost:5173`

2. **Production Build:**
   ```bash
   npm run build
   ```
   Output in `dist/` directory

3. **Preview Production:**
   ```bash
   npm run preview
   ```

4. **Deploy to GitHub Pages:**
   - Push to `main` branch
   - GitHub Actions automatically builds and deploys
   - Access at `https://pocketmidi.github.io/KB1-MIDI-Editor/`

## Security Considerations

1. **User Gesture Requirement:**
   - Web Bluetooth API requires user interaction
   - "Connect Device" button satisfies this requirement

2. **HTTPS Requirement:**
   - Web Bluetooth only works over HTTPS (except localhost)
   - GitHub Pages provides HTTPS automatically

3. **Permissions:**
   - Browser requests Bluetooth permission from user
   - User must explicitly select device in pairing dialog

4. **Data Privacy:**
   - All communication is direct between browser and device
   - No data is sent to any server
   - All processing happens client-side

## Future Enhancements

Potential features to add after basic integration:

1. **Preset Management:**
   - Save/load multiple CC mapping presets
   - Export/import presets to JSON files
   - Preset library

2. **Advanced MIDI Features:**
   - Velocity curves
   - Aftertouch configuration
   - Program change mapping
   - SysEx support

3. **Visual Feedback:**
   - Live MIDI value display
   - Real-time fader position visualization
   - MIDI activity indicator

4. **Firmware Updates:**
   - OTA firmware update support
   - Version checking
   - Update progress indicator

5. **Analytics:**
   - Usage statistics (local only)
   - Error reporting
   - Device diagnostics

## File Structure Reference

```
KB1-MIDI-Editor/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages deployment
├── public/
│   └── vite.svg                # Vite logo
├── src/
│   ├── ble/
│   │   ├── bleClient.ts        # BLE transport layer
│   │   └── kb1Protocol.ts      # KB1 protocol
│   ├── components/
│   │   ├── CCMappingCard.vue   # Fader config card
│   │   └── ConnectionStatus.vue # Connection indicator
│   ├── composables/
│   │   └── useDeviceState.ts   # State management
│   ├── pages/
│   │   ├── MidiEditor.vue      # MIDI editor page
│   │   └── DeviceSettings.vue  # Settings page
│   ├── assets/
│   │   └── vue.svg             # Vue logo
│   ├── App.vue                 # Main app component
│   └── main.ts                 # Entry point
├── index.html                  # HTML template
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── tsconfig.app.json           # App TypeScript config
├── tsconfig.node.json          # Node TypeScript config
├── vite.config.ts              # Vite configuration
└── README.md                   # Documentation
```

## Support

For questions or issues:
1. Check the README.md for usage instructions
2. Review TODO comments in the code
3. Check browser console for errors
4. Verify Web Bluetooth API is supported
5. Ensure HTTPS is being used (except localhost)

## License

See LICENSE file for details.
