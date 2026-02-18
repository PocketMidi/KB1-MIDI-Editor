/**
 * Slider Preset Store - localStorage-based preset management for performance sliders
 */

export interface SliderConfig {
  cc: number;
  color: string;
  bipolar: boolean;
  momentary: boolean;
  gangId: number;
  value: number;
}

export interface SliderPreset {
  sliders: SliderConfig[];
  links: boolean[];
}

export interface NamedSliderPreset {
  id: string;
  name: string;
  preset: SliderPreset;
  createdAt: number;
  modifiedAt: number;
}

const SLIDER_PRESET_PREFIX = 'kb1.sliderPreset.';
const SLIDER_PRESET_LIST_KEY = 'kb1.sliderPresets.list';
const ACTIVE_SLIDER_PRESET_KEY = 'kb1.sliderPresets.active';
const CURRENT_SLIDER_STATE_KEY = 'kb1.performanceSliders.preset'; // Legacy key for current state

export const SliderPresetStore = {
  /**
   * Save current slider state (used by PerformanceSliders component)
   */
  saveCurrentState(preset: SliderPreset): void {
    localStorage.setItem(CURRENT_SLIDER_STATE_KEY, JSON.stringify(preset));
  },

  /**
   * Load current slider state (used by PerformanceSliders component)
   */
  loadCurrentState(): SliderPreset | null {
    try {
      const raw = localStorage.getItem(CURRENT_SLIDER_STATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Get all saved slider presets
   */
  getAllPresets(): NamedSliderPreset[] {
    try {
      const listRaw = localStorage.getItem(SLIDER_PRESET_LIST_KEY);
      const ids: string[] = listRaw ? JSON.parse(listRaw) : [];
      
      return ids
        .map(id => this.getPreset(id))
        .filter((p): p is NamedSliderPreset => p !== null)
        .sort((a, b) => b.modifiedAt - a.modifiedAt); // Most recent first
    } catch {
      return [];
    }
  },

  /**
   * Get a specific preset by ID
   */
  getPreset(id: string): NamedSliderPreset | null {
    try {
      const raw = localStorage.getItem(SLIDER_PRESET_PREFIX + id);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Save a named preset
   */
  savePreset(preset: NamedSliderPreset): void {
    // Save the preset
    localStorage.setItem(SLIDER_PRESET_PREFIX + preset.id, JSON.stringify(preset));
    
    // Update the list
    const listRaw = localStorage.getItem(SLIDER_PRESET_LIST_KEY);
    const ids: string[] = listRaw ? JSON.parse(listRaw) : [];
    
    if (!ids.includes(preset.id)) {
      ids.push(preset.id);
      localStorage.setItem(SLIDER_PRESET_LIST_KEY, JSON.stringify(ids));
    }
  },

  /**
   * Create a new named preset
   */
  createPreset(name: string, sliderPreset: SliderPreset): NamedSliderPreset {
    const now = Date.now();
    const preset: NamedSliderPreset = {
      id: `slider-preset-${now}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      preset: JSON.parse(JSON.stringify(sliderPreset)), // Deep clone
      createdAt: now,
      modifiedAt: now,
    };
    
    this.savePreset(preset);
    return preset;
  },

  /**
   * Update an existing preset
   */
  updatePreset(id: string, updates: Partial<NamedSliderPreset>): NamedSliderPreset | null {
    const preset = this.getPreset(id);
    if (!preset) return null;
    
    const updated: NamedSliderPreset = {
      ...preset,
      ...updates,
      modifiedAt: Date.now(),
    };
    
    this.savePreset(updated);
    return updated;
  },

  /**
   * Delete a preset
   */
  deletePreset(id: string): void {
    // Remove from storage
    localStorage.removeItem(SLIDER_PRESET_PREFIX + id);
    
    // Update the list
    const listRaw = localStorage.getItem(SLIDER_PRESET_LIST_KEY);
    const ids: string[] = listRaw ? JSON.parse(listRaw) : [];
    const filtered = ids.filter((presetId) => presetId !== id);
    localStorage.setItem(SLIDER_PRESET_LIST_KEY, JSON.stringify(filtered));
    
    // Clear active preset if it was deleted
    if (this.getActivePresetId() === id) {
      this.setActivePresetId(null);
    }
  },

  /**
   * Duplicate a preset
   */
  duplicatePreset(id: string, newName?: string): NamedSliderPreset | null {
    const original = this.getPreset(id);
    if (!original) return null;
    
    const name = newName || `${original.name} (copy)`;
    return this.createPreset(name, original.preset);
  },

  /**
   * Get active preset ID
   */
  getActivePresetId(): string | null {
    return localStorage.getItem(ACTIVE_SLIDER_PRESET_KEY);
  },

  /**
   * Set active preset ID
   */
  setActivePresetId(id: string | null): void {
    if (id === null) {
      localStorage.removeItem(ACTIVE_SLIDER_PRESET_KEY);
    } else {
      localStorage.setItem(ACTIVE_SLIDER_PRESET_KEY, id);
    }
  },

  /**
   * Get active preset
   */
  getActivePreset(): NamedSliderPreset | null {
    const id = this.getActivePresetId();
    return id ? this.getPreset(id) : null;
  },

  /**
   * Export preset as JSON
   */
  exportPreset(id: string): string | null {
    const preset = this.getPreset(id);
    return preset ? JSON.stringify(preset, null, 2) : null;
  },

  /**
   * Import preset from JSON
   */
  importPreset(json: string): NamedSliderPreset | null {
    try {
      const data = JSON.parse(json);
      
      // Validate structure
      if (!data.name || !data.preset || !data.preset.sliders) {
        throw new Error('Invalid slider preset format');
      }
      
      // Create new preset with imported data
      return this.createPreset(data.name, data.preset);
    } catch {
      return null;
    }
  },
};

/**
 * Random Name Generator for slider presets
 */
const SLIDER_ADJECTIVES = [
  'Smooth', 'Dynamic', 'Expressive', 'Fluid', 'Reactive', 'Balanced',
  'Precision', 'Creative', 'Organic', 'Controlled', 'Flowing', 'Rhythmic',
];

const SLIDER_NOUNS = [
  'Performance', 'Expression', 'Control', 'Response', 'Motion', 'Flow',
  'Feel', 'Touch', 'Gesture', 'Movement', 'Action', 'Dynamics',
];

export function generateRandomSliderName(): string {
  const adjective = SLIDER_ADJECTIVES[Math.floor(Math.random() * SLIDER_ADJECTIVES.length)];
  const noun = SLIDER_NOUNS[Math.floor(Math.random() * SLIDER_NOUNS.length)];
  return `${adjective} ${noun}`;
}
