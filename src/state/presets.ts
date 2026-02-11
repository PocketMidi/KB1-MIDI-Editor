/**
 * Preset Store - localStorage-based snapshot management
 */

type Snapshot = Record<string, number>;
const SNAPSHOT_PREFIX = 'kb1.snapshot.';

export const PresetStore = {
  saveSnapshot(name: string, values: Snapshot): void {
    localStorage.setItem(SNAPSHOT_PREFIX + name, JSON.stringify(values));
  },

  loadSnapshot(name: string): Snapshot | null {
    const raw = localStorage.getItem(SNAPSHOT_PREFIX + name);
    return raw ? JSON.parse(raw) : null;
  },
};
