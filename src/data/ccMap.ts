/**
 * Polyend CC Mapping - Parameter-centric MIDI CC mapping utilities
 * 
 * This module loads and parses the Polyend Tracker MIDI CC CSV file,
 * providing utilities to map between CC numbers and parameter names,
 * and to convert MIDI values (0-127) to Polyend parameter ranges.
 */

import Papa from 'papaparse';
import { reactive } from 'vue';

/**
 * Range definition for a Polyend parameter
 */
export interface PolyendRange {
  min: number;
  max: number;
  text: string; // Original text like "-50 to +50"
}

/**
 * CC entry from the Polyend CSV
 */
export interface CCEntry {
  ccNumber: number;
  parameter: string;
  category: string;
  range?: PolyendRange;
}

/**
 * Grouped CC entries by category
 */
export interface CCGroup {
  category: string;
  entries: CCEntry[];
}

/**
 * CC Map state
 */
interface CCMapState {
  ccMap: Map<number, CCEntry>;
  groups: CCGroup[];
  loaded: boolean;
  error: string | null;
}

// Global state - made reactive for Vue components
const state: CCMapState = reactive({
  ccMap: new Map(),
  groups: [],
  loaded: false,
  error: null,
});

/**
 * Parse a range string like "0 to 100" or "-50 to +50"
 */
function parseRange(rangeText: string): PolyendRange | undefined {
  if (!rangeText || rangeText.trim() === '') {
    return undefined;
  }

  const text = rangeText.trim();
  
  // Match patterns like "0 to 100", "-50 to +50", "-100 to +100"
  const match = text.match(/^(-?\+?\d+)\s+to\s+(-?\+?\d+)$/i);
  
  if (match && match[1] && match[2]) {
    const min = parseInt(match[1].replace('+', ''), 10);
    const max = parseInt(match[2].replace('+', ''), 10);
    
    if (!isNaN(min) && !isNaN(max)) {
      return { min, max, text };
    }
  }
  
  return undefined;
}

/**
 * Normalize parameter name (remove embedded newlines)
 */
function normalizeParameterName(name: string): string {
  return name.replace(/\s*\n\s*/g, ' ').trim();
}

/**
 * Normalize category name (remove embedded newlines)
 */
function normalizeCategoryName(name: string): string {
  return name.replace(/\s*\n\s*/g, ' ').trim();
}

/**
 * Parse the Polyend CSV and populate the CC map
 */
async function parsePolyendCSV(csvText: string): Promise<void> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const newCCMap = new Map<number, CCEntry>();
          const newGroups: CCGroup[] = [];
          let currentCategory = '';
          let currentGroup: CCGroup | null = null;

          for (const row of results.data as any[]) {
            const ccNumberStr = row['CC Number']?.trim();
            const parameter = row['Parameter']?.trim();
            const rangeText = row['Polyend Range']?.trim();

            // Check if this is a category row (CC Number field contains non-numeric text)
            if (ccNumberStr && isNaN(parseInt(ccNumberStr, 10))) {
              // This is a category header
              currentCategory = normalizeCategoryName(ccNumberStr);
              currentGroup = {
                category: currentCategory,
                entries: [],
              };
              newGroups.push(currentGroup);
              continue;
            }

            // Parse parameter entry
            if (ccNumberStr && parameter) {
              const ccNumber = parseInt(ccNumberStr, 10);
              
              // Support CC 0-128 (128 is used for Velocity)
              if (!isNaN(ccNumber) && ccNumber >= 0 && ccNumber <= 128) {
                const normalizedParam = normalizeParameterName(parameter);
                const range = parseRange(rangeText);
                
                const entry: CCEntry = {
                  ccNumber,
                  parameter: normalizedParam,
                  category: currentCategory,
                  range,
                };
                
                newCCMap.set(ccNumber, entry);
                
                if (currentGroup) {
                  currentGroup.entries.push(entry);
                }
              }
            }
          }

          state.ccMap = newCCMap;
          state.groups = newGroups;
          state.loaded = true;
          state.error = null;
          
          console.log('Polyend CC map loaded:', {
            entries: newCCMap.size,
            groups: newGroups.length,
          });
          
          resolve();
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          state.error = errorMsg;
          reject(new Error(`Failed to parse CSV: ${errorMsg}`));
        }
      },
      error: (error: Error) => {
        const errorMsg = error.message || String(error);
        state.error = errorMsg;
        reject(new Error(`CSV parsing error: ${errorMsg}`));
      },
    });
  });
}

/**
 * Load the Polyend CC CSV file
 */
export async function loadPolyendCCMap(): Promise<void> {
  if (state.loaded) {
    return;
  }

  try {
    // Use import.meta.env.BASE_URL for GitHub Pages compatibility
    const baseUrl = import.meta.env.BASE_URL || '/';
    const url = `${baseUrl}Polyend`;
    
    console.log('Loading Polyend CC map from:', url);
    
    // Fetch with cache: 'no-store' to ensure fresh data
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    await parsePolyendCSV(csvText);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    state.error = errorMsg;
    console.error('Failed to load Polyend CC map:', errorMsg);
    throw error;
  }
}

/**
 * Get CC entry by CC number
 */
export function getCCEntry(ccNumber: number): CCEntry | undefined {
  return state.ccMap.get(ccNumber);
}

/**
 * Get all CC groups with Velocity pinned to the top
 */
export function getCCGroups(): CCGroup[] {
  return state.groups;
}

/**
 * Category overrides for specific CCs when needed
 * Reserved for future use - currently all CCs use their CSV-defined categories.
 * If overrides are added, ensure the category name matches the exact casing used in the CSV.
 */
const FACTORY_DEFAULT_CATEGORY_OVERRIDES: Record<number, string> = {
  // Example: 24: 'GLOBAL', // Would override CC 24 to GLOBAL category
};

/**
 * Get sorted CC options with Velocity first
 * This ensures Velocity (CC 128) always appears at the top of parameter dropdowns
 */
export function getSortedCCOptions(): Array<{ value: number; label: string; group?: string }> {
  const options: Array<{ value: number; label: string; group?: string }> = [];
  
  // Add "None" option first
  options.push({ value: -1, label: 'None' });
  
  // Add Velocity (CC 128) first if it exists
  const velocityEntry = state.ccMap.get(128);
  if (velocityEntry) {
    options.push({
      value: 128,
      label: velocityEntry.parameter,
      group: FACTORY_DEFAULT_CATEGORY_OVERRIDES[128] ?? velocityEntry.category,
    });
  }
  
  // Add all other entries in order
  for (const group of state.groups) {
    for (const entry of group.entries) {
      // Skip Velocity as we already added it
      if (entry.ccNumber !== 128) {
        options.push({
          value: entry.ccNumber,
          label: entry.parameter,
          group: FACTORY_DEFAULT_CATEGORY_OVERRIDES[entry.ccNumber] ?? group.category,
        });
      }
    }
  }
  
  return options;
}

/**
 * Check if CC map is loaded
 */
export function isCCMapLoaded(): boolean {
  return state.loaded;
}

/**
 * Get CC map error
 */
export function getCCMapError(): string | null {
  return state.error;
}

/**
 * Map a MIDI value (0-127) to a Polyend parameter value
 * using linear interpolation across the parameter's range
 */
export function midiToRelative(midiValue: number, min: number, max: number): number {
  // Clamp MIDI value to 0-127
  const clampedMidi = Math.max(0, Math.min(127, midiValue));
  
  // Linear interpolation from MIDI range (0-127) to parameter range (min-max)
  const normalized = clampedMidi / 127;
  const relativeValue = min + normalized * (max - min);
  
  // Round to 2 decimal places for cleaner display
  return Math.round(relativeValue * 100) / 100;
}

/**
 * Get the full CC map with category overrides applied
 */
export function getCCMap(): Map<number, CCEntry> {
  const map = new Map<number, CCEntry>();
  
  // Copy entries from state.ccMap with category overrides applied
  for (const [ccNumber, entry] of state.ccMap.entries()) {
    const overrideCategory = FACTORY_DEFAULT_CATEGORY_OVERRIDES[ccNumber];
    if (overrideCategory) {
      map.set(ccNumber, {
        ...entry,
        category: overrideCategory,
      });
    } else {
      map.set(ccNumber, entry);
    }
  }
  
  return map;
}
