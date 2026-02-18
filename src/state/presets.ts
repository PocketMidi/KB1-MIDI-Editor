/**
 * Preset Store - localStorage-based preset management for complete device settings
 */

import type { DeviceSettings } from '../ble/kb1Protocol';

type Snapshot = Record<string, number>;
const SNAPSHOT_PREFIX = 'kb1.snapshot.';
const PRESET_PREFIX = 'kb1.preset.';
const PRESET_LIST_KEY = 'kb1.presets.list';
const ACTIVE_PRESET_KEY = 'kb1.presets.active';

export interface Preset {
  id: string;
  name: string;
  settings: DeviceSettings;
  createdAt: number;
  modifiedAt: number;
}

export const PresetStore = {
  // Legacy snapshot methods (for sliders)
  saveSnapshot(name: string, values: Snapshot): void {
    localStorage.setItem(SNAPSHOT_PREFIX + name, JSON.stringify(values));
  },

  loadSnapshot(name: string): Snapshot | null {
    try {
      const raw = localStorage.getItem(SNAPSHOT_PREFIX + name);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // Preset management methods
  getAllPresets(): Preset[] {
    try {
      const listRaw = localStorage.getItem(PRESET_LIST_KEY);
      const ids: string[] = listRaw ? JSON.parse(listRaw) : [];
      
      return ids
        .map(id => this.getPreset(id))
        .filter((p): p is Preset => p !== null)
        .sort((a, b) => b.modifiedAt - a.modifiedAt); // Most recent first
    } catch {
      return [];
    }
  },

  getPreset(id: string): Preset | null {
    try {
      const raw = localStorage.getItem(PRESET_PREFIX + id);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  savePreset(preset: Preset): void {
    // Save the preset
    localStorage.setItem(PRESET_PREFIX + preset.id, JSON.stringify(preset));
    
    // Update the list
    const listRaw = localStorage.getItem(PRESET_LIST_KEY);
    const ids: string[] = listRaw ? JSON.parse(listRaw) : [];
    
    if (!ids.includes(preset.id)) {
      ids.push(preset.id);
      localStorage.setItem(PRESET_LIST_KEY, JSON.stringify(ids));
    }
  },

  createPreset(name: string, settings: DeviceSettings): Preset {
    const now = Date.now();
    const preset: Preset = {
      id: `preset-${now}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      settings: JSON.parse(JSON.stringify(settings)), // Deep clone
      createdAt: now,
      modifiedAt: now,
    };
    
    this.savePreset(preset);
    return preset;
  },

  updatePreset(id: string, updates: Partial<Preset>): Preset | null {
    const preset = this.getPreset(id);
    if (!preset) return null;
    
    const updated: Preset = {
      ...preset,
      ...updates,
      modifiedAt: Date.now(),
    };
    
    this.savePreset(updated);
    return updated;
  },

  deletePreset(id: string): void {
    // Remove from storage
    localStorage.removeItem(PRESET_PREFIX + id);
    
    // Update the list
    const listRaw = localStorage.getItem(PRESET_LIST_KEY);
    const ids: string[] = listRaw ? JSON.parse(listRaw) : [];
    const filtered = ids.filter((presetId) => presetId !== id);
    localStorage.setItem(PRESET_LIST_KEY, JSON.stringify(filtered));
    
    // Clear active preset if it was deleted
    if (this.getActivePresetId() === id) {
      this.setActivePresetId(null);
    }
  },

  duplicatePreset(id: string, newName?: string): Preset | null {
    const original = this.getPreset(id);
    if (!original) return null;
    
    const name = newName || `${original.name} (copy)`;
    return this.createPreset(name, original.settings);
  },

  getActivePresetId(): string | null {
    return localStorage.getItem(ACTIVE_PRESET_KEY);
  },

  setActivePresetId(id: string | null): void {
    if (id === null) {
      localStorage.removeItem(ACTIVE_PRESET_KEY);
    } else {
      localStorage.setItem(ACTIVE_PRESET_KEY, id);
    }
  },

  getActivePreset(): Preset | null {
    const id = this.getActivePresetId();
    return id ? this.getPreset(id) : null;
  },

  exportPreset(id: string): string | null {
    const preset = this.getPreset(id);
    return preset ? JSON.stringify(preset, null, 2) : null;
  },

  importPreset(json: string): Preset | null {
    try {
      const data = JSON.parse(json);
      
      // Validate structure
      if (!data.name || !data.settings) {
        throw new Error('Invalid preset format');
      }
      
      // Create new preset with imported data
      return this.createPreset(data.name, data.settings);
    } catch {
      return null;
    }
  },

  exportAllPresets(): string {
    const presets = this.getAllPresets();
    return JSON.stringify(presets, null, 2);
  },

  importAllPresets(json: string): number {
    try {
      const presets: Preset[] = JSON.parse(json);
      let count = 0;
      
      for (const preset of presets) {
        if (preset.name && preset.settings) {
          this.createPreset(preset.name, preset.settings);
          count++;
        }
      }
      
      return count;
    } catch {
      return 0;
    }
  },
};

/**
 * Random Name Generator - Adjective + Noun combinations
 */
const ADJECTIVES = [
  'Swift', 'Bright', 'Dark', 'Silent', 'Bold', 'Gentle', 'Wild', 'Calm',
  'Mystic', 'Cosmic', 'Electric', 'Smooth', 'Sharp', 'Deep', 'Light', 'Heavy',
  'Crystal', 'Golden', 'Silver', 'Crimson', 'Azure', 'Emerald', 'Violet', 'Amber',
  'Thunder', 'Whisper', 'Echo', 'Shadow', 'Storm', 'Dream', 'Fire', 'Ice',
  'Ancient', 'Modern', 'Classic', 'Future', 'Neon', 'Retro', 'Digital', 'Analog',
  'Lunar', 'Solar', 'Stellar', 'Nebula', 'Nova', 'Quantum', 'Phase', 'Wave',
];

const NOUNS = [
  'Dragon', 'Phoenix', 'Wolf', 'Eagle', 'Tiger', 'Lion', 'Falcon', 'Raven',
  'Arrow', 'Blade', 'Hammer', 'Shield', 'Spear', 'Bow', 'Sword', 'Axe',
  'Mountain', 'River', 'Ocean', 'Forest', 'Desert', 'Valley', 'Peak', 'Canyon',
  'Thunder', 'Lightning', 'Storm', 'Breeze', 'Gale', 'Wind', 'Rain', 'Snow',
  'Pulse', 'Beat', 'Rhythm', 'Tempo', 'Echo', 'Chord', 'Note', 'Key',
  'Synth', 'Bass', 'Lead', 'Pad', 'Arp', 'Drone', 'Filter', 'Reverb',
  'Crystal', 'Prism', 'Plasma', 'Circuit', 'Signal', 'Voltage', 'Current', 'Flux',
];

export function generateRandomName(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adjective} ${noun}`;
}
