# KB1 MIDI Editor

KB1 MIDI Editor is a browser-based configuration tool for the PocketMidi KB1 device. Configure MIDI CC mappings, customize faders and controls, and manage device settings wirelessly over Bluetooth directly from your browser.

## Features

- 🎹 **MIDI Editor** - Configure CC mappings for each fader
- 🎚️ **Live Sliders** - Real-time BLE MIDI control with vertical sliders
  - Select parameters from 10 preset controls (Volume, Panning, Tune, Filters, Effects)
  - Lock/unlock individual sliders
  - Center bipolar values with double-click
  - Fine control mode with Shift key
  - A/B/C/D snapshot slots for instant recall
  - Group Morph between two captured states with per-parameter weights
  - Live Performance fullscreen mode (toggle with F key, exit with Esc)
  - Advanced per-parameter settings (curve, invert, mode)
- ⚙️ **Device Settings** - Customize device name, MIDI channel, brightness
- 📡 **Web Bluetooth** - Wireless connection using Web Bluetooth API
- 🔒 **HTTPS Ready** - Compatible with GitHub Pages deployment
- 📱 **Responsive** - Works on desktop and mobile devices

## Technology Stack

- **Vue 3** with Composition API
- **TypeScript** for type safety
- **Vite** for fast development and optimized builds
- **Web Bluetooth API** for device communication
- **GitHub Actions** for automated deployment

## Project Structure

```
src/
├── ble/
│   ├── bleClient.ts       # Web Bluetooth transport layer
│   └── kb1Protocol.ts     # KB1 device protocol encoding/decoding
├── components/
│   ├── ConnectionStatus.vue  # Connection status indicator
│   ├── CCMappingCard.vue    # CC mapping configuration card
│   ├── SettingsPanel.vue    # Parameter selection and configuration
│   ├── SlidersPanel.vue     # Real-time slider grid
│   ├── SliderControl.vue    # Individual vertical slider
│   ├── SnapshotBar.vue      # A/B/C/D snapshot management
│   └── GroupMorph.vue       # Group morphing between states
├── pages/
│   ├── MidiEditor.vue       # MIDI editor page
│   ├── DeviceSettings.vue   # Device settings page
│   └── LandingPage.vue      # Live Sliders page
├── services/
│   └── midiBle.ts           # BLE MIDI real-time control
├── state/
│   └── presets.ts           # Snapshot persistence
├── composables/
│   └── useDeviceState.ts    # Central device state management
├── styles/
│   └── slider.css           # Slider visual styles
├── App.vue                   # Main application component
└── main.ts                   # Application entry point
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A browser with Web Bluetooth support (Chrome, Edge, Opera)
- HTTPS connection (required for Web Bluetooth API)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/PocketMidi/KB1-MIDI-Editor.git
cd KB1-MIDI-Editor
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173` (or the URL shown in terminal)

**Note:** For Web Bluetooth to work in development, you may need to:
- Use `localhost` (works over HTTP)
- Or set up HTTPS for your dev server
- Or use Chrome flags for testing: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment.

### Preview Production Build

```bash
npm run preview
```

## Usage

### Connecting to Your KB1 Device

1. Click the "Connect Device" button in the header
2. Select your KB1 device from the browser's Bluetooth pairing dialog
3. Once connected, the status indicator will turn green

### MIDI Editor (Faders Tab)

- Configure CC numbers, MIDI channels, and value ranges for each fader
- Click "Load from Device" to fetch current settings
- Make your changes in the UI
- Click "Apply to Device" to send changes to the KB1
- Click "Save to Flash" to persist settings on the device

### Live Sliders

The Live Sliders interface provides real-time MIDI CC control with an intuitive visual interface:

**Getting Started:**
1. Navigate to the "LIVE SLIDERS" tab
2. In the Settings panel (left), check the parameters you want to control
3. Sliders appear instantly in the main panel (right)
4. Click "Connect KB1" to establish real-time BLE MIDI connection

**Slider Features:**
- **Real-time Control**: Move sliders to send MIDI CC messages instantly
- **Lock/Unlock**: Click 🔓/🔒 button to prevent accidental changes
- **Center**: Double-click slider or click ⊙ button to center bipolar values
- **Fine Control**: Hold Shift while adjusting for fine-grained control
- **Color-coded**: Each parameter has a unique color for easy identification

**Snapshots:**
- **A/B/C/D Slots**: Save up to 4 snapshot presets
- **Save**: Click "Save A/B/C/D" to store current slider positions
- **Recall**: Click "Recall A/B/C/D" to restore saved positions
- **Last**: Use "Save Snapshot" / "Reset to Previous" for quick undo

**Group Morph:**
- **Capture A**: Save current state as morph point A
- **Capture B**: Save current state as morph point B
- **Morph Slider**: Smoothly interpolate between A and B
- **Per-Parameter Weights**: Advanced settings allow different morph amounts per parameter

**Live Performance Mode:**
- **Enter**: Click "Enter Live Mode" button or press **F** key
- **Fullscreen**: Hides settings panel, maximizes sliders for performance
- **Exit**: Click "Exit" pill button or press **Esc** key
- **Toggle**: Press **F** to quickly toggle Live Mode on/off

**Advanced Settings:**
- Expand parameter details to configure:
  - **Curve**: Linear, Log, or Exp response
  - **Invert**: Reverse slider direction
  - **Mode**: Unipolar (0-max) or Bipolar (-max to +max)
  - **Morph Amount**: Control per-parameter morphing weight (0-1)

**Note**: Live Sliders are real-time controls only. There is no "load from device" - all changes are sent immediately.

### Device Settings

- Configure device name, default MIDI channel, and display brightness
- Click "Load from Device" to fetch current settings
- Make your changes
- Click "Apply to Device" to update the device
- Click "Save to Flash" to persist settings

## Development Notes

### KB1 Protocol Implementation

The current implementation includes placeholder code for the KB1 protocol. To complete the integration:

1. **Update BLE UUIDs** in `src/ble/bleClient.ts`:
   - Replace `KB1_SERVICE_UUID` with the actual service UUID
   - Replace `KB1_CHARACTERISTIC_UUID` with the actual characteristic UUID
   - Update device name filter if needed

2. **Implement Protocol Encoding** in `src/ble/kb1Protocol.ts`:
   - Complete the `encode*` methods with actual KB1 message format
   - Complete the `decode*` methods to parse device responses
   - Update message types and structures as needed

3. **Test with Real Device**:
   - Test connection and data transfer
   - Verify CC mappings are applied correctly
   - Verify settings are saved to flash

### Browser Compatibility

Web Bluetooth API is supported in:
- ✅ Chrome/Chromium 56+
- ✅ Edge 79+
- ✅ Opera 43+
- ❌ Firefox (requires flag)
- ❌ Safari (not supported)

For the best experience, use Chrome, Edge, or Opera.

### HTTPS Requirement

The Web Bluetooth API requires a secure context (HTTPS) except for `localhost`. When deploying:

- GitHub Pages provides HTTPS automatically
- Use a service with HTTPS support
- Or set up SSL certificates for your domain

## Deployment

### GitHub Pages (Automated)

This repository includes a GitHub Actions workflow that automatically deploys to GitHub Pages when you push to the `main` branch.

**To enable:**

1. Go to your repository Settings → Pages
2. Set Source to "GitHub Actions"
3. Push to the `main` branch
4. The site will be available at `https://pocketmidi.github.io/KB1-MIDI-Editor/`

### Manual Deployment

Build the project and deploy the `dist/` folder to any static hosting service that supports HTTPS.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

See the [LICENSE](LICENSE) file for details.

## Acknowledgments

Built with Vue 3, Vite, and the Web Bluetooth API to provide a seamless wireless configuration experience for the PocketMidi KB1 device.
