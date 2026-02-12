# KB1 Config Lab Theme - Designer Workflow

## Overview

The KB1 Config Lab now uses a **CSS-only theme system** that allows designers to update visuals without touching any code. All visual assets are referenced through CSS variables in a single theme file.

## Quick Start for Designers

### Updating Visuals

1. **Export assets from Figma** to `src/assets/ui/`
   - Use SVG format (preferred) or PNG/WebP
   - Name files according to the variables below

2. **Edit `src/styles/themes/kb1.css`**
   - Update the URL paths to reference your new assets
   - No code changes needed anywhere else!

3. **Preview changes**
   - Run `npm run dev`
   - Changes appear automatically in the browser

## Available Theme Variables

### Panel Backgrounds
Located in `src/styles/themes/kb1.css`, these control the background images for each settings section:

```css
--lever-panel-bg: url('/src/assets/ui/lever-panel.svg');
--lever-push-panel-bg: url('/src/assets/ui/lever-push-panel.svg');
--touch-panel-bg: url('/src/assets/ui/touch-panel.svg');
--scale-panel-bg: url('/src/assets/ui/scale-panel.svg');
```

**What they do:** These images appear behind the Lever 1/2, Lever Push 1/2, Touch Sensor, and Scales sections respectively.

### Fader Elements
For custom fader controls (if added):

```css
--fader-track-bg: url('/src/assets/ui/fader-track.svg');
--fader-thumb-bg: url('/src/assets/ui/fader-thumb.svg');
--fader-track-height: 200px;
--fader-thumb-size: 24px;
```

### Button Styles
Primary buttons (Apply, Save to Flash):
```css
--btn-primary-bg: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
--btn-primary-bg-hover: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
--btn-primary-color: #ffffff;
```

Secondary buttons (Load, Reset):
```css
--btn-secondary-bg: var(--color-background-mute);
--btn-secondary-bg-hover: var(--color-background-soft);
--btn-secondary-border: 1px solid var(--color-border);
```

### Color Tokens
All major colors used in the theme:

```css
--kb1-color-primary: #3b82f6;
--kb1-color-accent: #8b5cf6;
--kb1-color-success: #10b981;
--kb1-color-warning: #f59e0b;
--kb1-color-error: #ef4444;
```

### Typography
Font sizing scale:

```css
--kb1-font-size-xs: 0.75rem;   /* 12px */
--kb1-font-size-sm: 0.875rem;  /* 14px */
--kb1-font-size-base: 1rem;     /* 16px */
--kb1-font-size-lg: 1.125rem;   /* 18px */
--kb1-font-size-xl: 1.25rem;    /* 20px */
--kb1-font-size-2xl: 1.5rem;    /* 24px */
```

### Spacing
Consistent spacing values:

```css
--kb1-spacing-xs: 0.25rem;  /* 4px */
--kb1-spacing-sm: 0.5rem;   /* 8px */
--kb1-spacing-md: 1rem;     /* 16px */
--kb1-spacing-lg: 1.5rem;   /* 24px */
--kb1-spacing-xl: 2rem;     /* 32px */
```

## File Structure

```
src/
├── assets/
│   └── ui/                    # Put your exported images here
│       ├── lever-panel.svg
│       ├── lever-push-panel.svg
│       ├── touch-panel.svg
│       ├── scale-panel.svg
│       ├── fader-track.svg
│       └── fader-thumb.svg
├── styles/
│   └── themes/
│       └── kb1.css            # Edit this file to update theme
└── components/
    ├── LeverSettings.vue      # Uses theme variables (no edits needed)
    ├── LeverPushSettings.vue  # Uses theme variables (no edits needed)
    ├── TouchSettings.vue      # Uses theme variables (no edits needed)
    └── ScaleSettings.vue      # Uses theme variables (no edits needed)
```

## Example: Updating Panel Backgrounds

### Step 1: Export from Figma
1. Select your lever panel design in Figma
2. Export as SVG: `lever-panel.svg`
3. Save to: `src/assets/ui/lever-panel.svg`

### Step 2: Update Theme CSS
Open `src/styles/themes/kb1.css` and find:

```css
--lever-panel-bg: url('/src/assets/ui/lever-panel.svg');
```

If you saved your file as `lever-panel-new.svg`, update to:

```css
--lever-panel-bg: url('/src/assets/ui/lever-panel-new.svg');
```

### Step 3: See Changes
The app automatically picks up the new image. No component code changes needed!

## Tips for Designers

### Image Formats
- **SVG** (recommended): Scalable, small file size, crisp at any resolution
- **PNG**: Good for photos or complex gradients
- **WebP**: Modern format with excellent compression

### Naming Convention
Use descriptive, kebab-case names:
- ✅ `lever-panel-dark-mode.svg`
- ✅ `button-primary-hover.svg`
- ❌ `Panel1.svg`
- ❌ `image_final_v3.svg`

### Asset Organization
Keep related assets together:
```
src/assets/ui/
├── panels/
│   ├── lever.svg
│   ├── lever-push.svg
│   └── touch.svg
├── buttons/
│   ├── primary.svg
│   └── secondary.svg
└── faders/
    ├── track.svg
    └── thumb.svg
```

Then update paths in CSS:
```css
--lever-panel-bg: url('/src/assets/ui/panels/lever.svg');
--btn-primary-bg: url('/src/assets/ui/buttons/primary.svg');
```

### Colors vs Images
- Use **CSS variables** for solid colors (faster, easier to adjust)
- Use **images** for gradients, textures, or complex designs

### Testing Your Changes
1. Run `npm run dev` 
2. Open http://localhost:5173/KB1-Config-Lab/
3. Navigate to Device Settings tab
4. Check your visuals at different window sizes

## Troubleshooting

### My image doesn't appear
- ✅ Check the file path in the CSS matches the actual file location
- ✅ Make sure the file extension is correct (.svg vs .SVG)
- ✅ Verify the image file isn't corrupted

### Colors look wrong
- Check if you're editing the right color variable
- Some elements inherit from base CSS variables (like `--color-background`)

### Need help?
1. Check this file first
2. Review `src/styles/themes/kb1.css` for all available variables
3. Ask a developer if you need new variables added

## Future Enhancements

If you need additional theme variables (e.g., for new UI elements), ask a developer to:
1. Add the variable to `src/styles/themes/kb1.css`
2. Update this documentation
3. Modify the relevant component to use the new variable

The goal is to keep all visual updates in the CSS file, never in component code!
