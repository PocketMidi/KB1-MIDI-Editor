/**
 * BLE MIDI Service for real-time CC control
 * Writes ASCII "CC_NUMBER,VALUE" to KB1's MIDI characteristic
 */

type MidiBleState = {
  device?: BluetoothDevice;
  server?: BluetoothRemoteGATTServer;
  characteristic?: BluetoothRemoteGATTCharacteristic;
  lastSendMs: number;
  minIntervalMs: number;
};

const state: MidiBleState = {
  device: undefined,
  server: undefined,
  characteristic: undefined,
  lastSendMs: 0,
  minIntervalMs: 8,
};

const SERVICE_UUID = 'f22b99e8-81ab-4e46-abff-79a74a1f2ff3';
const MIDI_CHARACTERISTIC_UUID = 'eb58b31b-d963-4c7d-9a11-e8aabec2fe32';
const enc = new TextEncoder();

export const midiBle = {
  async connect(): Promise<void> {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth not supported.');
    }

    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'KB1' }],
      optionalServices: [SERVICE_UUID as BluetoothServiceUUID],
    });

    const server = await device.gatt?.connect();
    if (!server) {
      throw new Error('Failed to connect to GATT server.');
    }

    const service = await server.getPrimaryService(SERVICE_UUID);
    const characteristic = await service.getCharacteristic(MIDI_CHARACTERISTIC_UUID);

    state.device = device;
    state.server = server;
    state.characteristic = characteristic;

    device.addEventListener('gattserverdisconnected', () => {
      state.device = undefined;
      state.server = undefined;
      state.characteristic = undefined;
    });
  },

  async disconnect(): Promise<void> {
    state.server?.disconnect();
    state.device = undefined;
    state.server = undefined;
    state.characteristic = undefined;
  },

  async sendControlChange(cc: number, value: number): Promise<void> {
    const now = performance.now();
    if (now - state.lastSendMs < state.minIntervalMs) {
      return;
    }
    state.lastSendMs = now;

    const ch = state.characteristic;
    if (!ch) {
      throw new Error('Not connected');
    }

    await ch.writeValueWithoutResponse(enc.encode(`${cc},${value}`));
  },
};
