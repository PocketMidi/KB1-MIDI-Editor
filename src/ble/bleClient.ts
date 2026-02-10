/**
 * BLE Client - Web Bluetooth transport layer for KB1 device
 * 
 * This module handles the low-level BLE connection and communication
 * using the Web Bluetooth API. It provides a clean interface for
 * connecting, disconnecting, and sending/receiving data.
 */

// TODO: Replace these placeholder UUIDs with actual KB1 service and characteristic UUIDs
const KB1_SERVICE_UUID = '00000000-0000-0000-0000-000000000000'; // TODO: Update with actual UUID
const KB1_CHARACTERISTIC_UUID = '00000000-0000-0000-0000-000000000000'; // TODO: Update with actual UUID

export interface BLEConnectionStatus {
  connected: boolean;
  device: BluetoothDevice | null;
  error: string | null;
}

export class BLEClient {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private onStatusChange: ((status: BLEConnectionStatus) => void) | null = null;
  private onDataReceived: ((data: DataView) => void) | null = null;

  /**
   * Register a callback for connection status changes
   */
  setStatusChangeCallback(callback: (status: BLEConnectionStatus) => void): void {
    this.onStatusChange = callback;
  }

  /**
   * Register a callback for incoming data
   */
  setDataReceivedCallback(callback: (data: DataView) => void): void {
    this.onDataReceived = callback;
  }

  /**
   * Check if Web Bluetooth is available in this browser
   */
  isBluetoothAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Request connection to a KB1 device
   * This must be called from a user gesture (e.g., button click)
   */
  async connect(): Promise<void> {
    if (!this.isBluetoothAvailable()) {
      const error = 'Web Bluetooth is not supported in this browser';
      this.notifyStatusChange(false, error);
      throw new Error(error);
    }

    try {
      // Request device with KB1 service filter
      // TODO: Update filters when KB1 service UUID is known
      this.device = await navigator.bluetooth.requestDevice({
        // acceptAllDevices: true, // For testing - remove in production
        filters: [
          { namePrefix: 'KB1' }, // TODO: Update with actual device name prefix
          // { services: [KB1_SERVICE_UUID] } // Uncomment when UUID is known
        ],
        optionalServices: [KB1_SERVICE_UUID] // TODO: Update with actual service UUID
      });

      if (!this.device) {
        throw new Error('No device selected');
      }

      // Listen for disconnection
      this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

      // Connect to GATT server
      this.server = await this.device.gatt!.connect();

      // Get KB1 service
      // TODO: Update service UUID when known
      const service = await this.server.getPrimaryService(KB1_SERVICE_UUID);

      // Get characteristic for read/write
      // TODO: Update characteristic UUID when known
      this.characteristic = await service.getCharacteristic(KB1_CHARACTERISTIC_UUID);

      // Start notifications if supported
      try {
        await this.characteristic.startNotifications();
        this.characteristic.addEventListener('characteristicvaluechanged', 
          this.onCharacteristicValueChanged.bind(this));
      } catch (e) {
        console.warn('Notifications not supported:', e);
      }

      this.notifyStatusChange(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.notifyStatusChange(false, errorMessage);
      throw error;
    }
  }

  /**
   * Disconnect from the current device
   */
  async disconnect(): Promise<void> {
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.cleanup();
    this.notifyStatusChange(false);
  }

  /**
   * Send data to the connected device
   */
  async sendData(data: ArrayBuffer): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Not connected to device');
    }

    try {
      await this.characteristic.writeValue(data);
    } catch (error) {
      console.error('Failed to send data:', error);
      throw error;
    }
  }

  /**
   * Read data from the connected device
   */
  async readData(): Promise<DataView> {
    if (!this.characteristic) {
      throw new Error('Not connected to device');
    }

    try {
      const value = await this.characteristic.readValue();
      return value;
    } catch (error) {
      console.error('Failed to read data:', error);
      throw error;
    }
  }

  /**
   * Get current connection status
   */
  getStatus(): BLEConnectionStatus {
    return {
      connected: this.device?.gatt?.connected ?? false,
      device: this.device,
      error: null
    };
  }

  /**
   * Handle characteristic value changes (notifications)
   */
  private onCharacteristicValueChanged(event: Event): void {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const value = characteristic.value;
    if (value && this.onDataReceived) {
      this.onDataReceived(value);
    }
  }

  /**
   * Handle device disconnection
   */
  private onDisconnected(): void {
    console.log('Device disconnected');
    this.cleanup();
    this.notifyStatusChange(false);
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.characteristic) {
      this.characteristic.removeEventListener('characteristicvaluechanged', 
        this.onCharacteristicValueChanged.bind(this));
    }
    this.characteristic = null;
    this.server = null;
    // Note: We don't set device to null to preserve device info
  }

  /**
   * Notify status change callback
   */
  private notifyStatusChange(connected: boolean, error: string | null = null): void {
    if (this.onStatusChange) {
      this.onStatusChange({
        connected,
        device: this.device,
        error
      });
    }
  }
}

// Export singleton instance
export const bleClient = new BLEClient();
