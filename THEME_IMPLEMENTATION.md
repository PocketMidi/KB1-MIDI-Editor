# KB1 Theme Implementation - Technical Documentation

## Architecture Overview

This implementation provides a CSS-only theme system for the KB1 Config Lab with a complete device settings UI. The design prioritizes **designer-friendliness** and **maintainability** by centralizing all visual assets in a single CSS file.

## Key Design Decisions

### 1. CSS-Only Theme (No Runtime Loader)

**Why:** Simplest possible maintenance for designers.

- All theme variables defined in `src/styles/themes/kb1.css`
- Imported once in `App.vue`
- Applied via `.theme-kb1` class on root element
- No JavaScript theme switching logic to maintain

**Alternative Considered:** Runtime theme loader with multiple themes
**Decision:** Keep it simple - single theme, CSS variables only. Multiple themes can be added later if needed.

### 2. Component-Level CSS with Theme Variables

**Why:** Components are self-contained but visual updates happen in one place.

Each component:
- Has its own scoped `<style>` section
- Uses CSS variables like `var(--settings-panel-bg)`
- Provides fallback values for graceful degradation
- References theme without hardcoding values

**Example:**
```vue
<style scoped>
.settings-lever {
  background: var(--settings-panel-bg, #242424);
  padding: var(--settings-panel-padding, 1.5rem);
}
</style>
```

### 3. Typed Models for Device Settings

**Why:** Type safety and clear structure for KB1-specific configuration.

```typescript
interface LeverModel {
  ccNumber: number;
  minCCValue: number;
  maxCCValue: number;
  stepSize: number;
  functionMode: number;
  valueMode: number;
  onsetTime: number;
  offsetTime: number;
  onsetType: number;
  offsetType: number;
}

interface DeviceSettings {
  lever1: LeverModel;
  leverPush1: LeverPushModel;
  lever2: LeverModel;
  leverPush2: LeverPushModel;
  touch: TouchModel;
  scale: ScaleModel;
}
```

Each model maps to a section in the UI and will eventually map to the binary protocol.

### 4. Protocol Encoding/Decoding as TODOs

**Why:** Decouple UI development from protocol implementation.

```typescript
encodeSetSettings(settings: DeviceSettings): ArrayBuffer {
  // TODO: Implement actual KB1 protocol encoding
  // This method should encode all settings into binary format
  console.log('TODO: Encode settings:', settings);
  const buffer = new ArrayBuffer(128);
  // ... placeholder implementation
  return buffer;
}
```

**Benefits:**
- UI can be developed and tested independently
- Protocol engineers can implement encoding/decoding later
- Type definitions ensure compatibility

### 5. v-model Pattern for Components

**Why:** Standard Vue pattern for two-way binding.

```vue
<!-- Parent (DeviceSettings.vue) -->
<LeverSettings
  v-model="localSettings.lever1"
  :cc-options="ccOptions"
  :function-modes="functionModes"
/>

<!-- Child (LeverSettings.vue) -->
const model = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
```

**Benefits:**
- Predictable data flow
- Easy to track changes
- Standard Vue convention

## File Structure

```
src/
├── styles/
│   └── themes/
│       └── kb1.css              # Single source of truth for theme
│
├── assets/
│   └── ui/                      # Designer-managed assets
│       ├── .gitkeep             # Placeholder
│       └── (future: SVG/PNG files from Figma)
│
├── components/
│   ├── LeverSettings.vue        # Lever configuration component
│   ├── LeverPushSettings.vue    # Lever push configuration component
│   ├── TouchSettings.vue        # Touch sensor configuration component
│   └── ScaleSettings.vue        # Scale configuration component
│
├── pages/
│   └── DeviceSettings.vue       # Main settings page (uses all components)
│
├── ble/
│   └── kb1Protocol.ts           # Protocol types and encoding/decoding
│
├── composables/
│   └── useDeviceState.ts        # Global state management
│
└── App.vue                      # Root component (applies theme)
```

## Data Flow

```
User Input
    ↓
Component v-model
    ↓
localSettings (DeviceSettings.vue)
    ↓
handleApply() → sendSettings()
    ↓
useDeviceState.sendSettings()
    ↓
kb1Protocol.encodeSetSettings()  ← TODO: Implement
    ↓
bleClient.sendData()
    ↓
Device Hardware
```

## Component API

### LeverSettings

```typescript
interface Props {
  title?: string;
  lever: number;                    // 1 or 2
  modelValue: LeverModel;
  ccOptions: { value: number, label: string }[];
  functionModes: { value: number, label: string }[];
  valueModes: { value: number, label: string }[];
  interpolations: { value: number, label: string }[];
}

interface Emits {
  (e: 'update:modelValue', v: LeverModel): void;
}
```

**Usage:**
```vue
<LeverSettings
  title="Lever"
  :lever="1"
  v-model="settings.lever1"
  :cc-options="ccOptions"
  :function-modes="functionModes"
  :value-modes="valueModes"
  :interpolations="interpolations"
/>
```

### LeverPushSettings

```typescript
interface Props {
  title?: string;
  lever: number;                    // 1 or 2
  modelValue: LeverPushModel;
  ccOptions: { value: number, label: string }[];
  functionModes: { value: number, label: string }[];
  interpolations: { value: number, label: string }[];
}
```

### TouchSettings

```typescript
interface Props {
  title?: string;
  modelValue: TouchModel;
  ccOptions: { value: number, label: string }[];
  functionModes: { value: number, label: string }[];
}
```

### ScaleSettings

```typescript
interface Props {
  title?: string;
  modelValue: ScaleModel;
  scales: { value: number, label: string }[];
  rootNotes: { value: number, label: string }[];
}
```

## Theme CSS Variables Reference

See `src/styles/themes/kb1.css` for the complete list. Key categories:

### Panel Backgrounds
```css
--lever-panel-bg
--lever-push-panel-bg
--touch-panel-bg
--scale-panel-bg
```

### Button States
```css
--btn-primary-bg
--btn-primary-bg-hover
--btn-secondary-bg
--btn-secondary-bg-hover
```

### Color Tokens
```css
--kb1-color-primary
--kb1-color-accent
--kb1-color-success
--kb1-color-warning
--kb1-color-error
```

### Typography
```css
--kb1-font-size-xs through --kb1-font-size-2xl
```

### Spacing
```css
--kb1-spacing-xs through --kb1-spacing-xl
```

## Validation

The protocol layer validates all settings before encoding:

```typescript
validateSettings(settings: DeviceSettings): boolean {
  return (
    // All sections exist
    settings.lever1 !== undefined &&
    // ... other checks
    
    // CC numbers are valid (-1 for "Off" or 0-127)
    this.isValidCC(settings.lever1.ccNumber) &&
    // ... other CC checks
  );
}
```

## Default Values

Default settings are created via factory methods:

```typescript
createDefaultSettings(): DeviceSettings {
  return {
    lever1: this.createDefaultLeverSettings(),
    leverPush1: this.createDefaultLeverPushSettings(),
    lever2: { ...this.createDefaultLeverSettings(), ccNumber: 4 },
    leverPush2: { ...this.createDefaultLeverPushSettings(), ccNumber: 5 },
    touch: this.createDefaultTouchSettings(),
    scale: this.createDefaultScaleSettings(),
  };
}
```

## Testing the Implementation

### Manual Testing

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to Device Settings:**
   - Click "Device Settings" tab
   - Should show "Please connect..." message when disconnected

3. **When connected (future):**
   - All 6 sections should render
   - CC numbers should display in title blocks
   - All dropdowns should be populated
   - Action buttons should enable/disable appropriately

### Build Testing

```bash
npm run build
```

Should succeed with no TypeScript errors. Warnings about missing SVG files are expected (designer assets to be added).

## Future Protocol Implementation

When implementing the binary protocol:

1. **Update `encodeSetSettings()`:**
   ```typescript
   encodeSetSettings(settings: DeviceSettings): ArrayBuffer {
     const buffer = new ArrayBuffer(PROTOCOL_SIZE);
     const view = new DataView(buffer);
     
     // Encode header
     view.setUint8(0, KB1MessageType.SET_SETTINGS);
     
     // Encode lever1
     this.encodeLever(view, 1, settings.lever1);
     
     // ... encode other sections
     
     return buffer;
   }
   ```

2. **Update `decodeSettings()`:**
   ```typescript
   private decodeSettings(data: DataView): DeviceSettings {
     return {
       lever1: this.decodeLever(data, 1),
       leverPush1: this.decodeLeverPush(data, 10),
       // ... decode other sections
     };
   }
   ```

3. **Test with hardware:**
   - Send settings to device
   - Read settings from device
   - Verify values match

## Designer Workflow Integration

See `DESIGNER_WORKFLOW.md` for complete designer documentation.

**Quick summary:**
1. Designer exports assets from Figma → `src/assets/ui/`
2. Designer updates URLs in `src/styles/themes/kb1.css`
3. Components automatically pick up new visuals
4. No code changes required

## Maintenance

### Adding a New Theme Variable

1. Add to `src/styles/themes/kb1.css`:
   ```css
   .theme-kb1 {
     --new-variable: value;
   }
   ```

2. Use in component:
   ```css
   .my-element {
     property: var(--new-variable, fallback);
   }
   ```

3. Document in `DESIGNER_WORKFLOW.md`

### Adding a New Section

1. Create model type in `kb1Protocol.ts`
2. Add to `DeviceSettings` interface
3. Create Vue component (follow existing patterns)
4. Add to `DeviceSettings.vue` template
5. Update default settings factory
6. Update validation

## References

- `DESIGNER_WORKFLOW.md` - For designers
- `IMPLEMENTATION.md` - General project documentation
- `README.md` - User-facing documentation
