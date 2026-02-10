/**
 * KB1 Protocol - Device-specific encoding and decoding
 * 
 * This module handles the KB1-specific protocol for encoding and decoding
 * messages sent to/from the device. It provides a clean abstraction over
 * the raw BLE data transfer.
 */

/**
 * MIDI CC (Continuous Controller) mapping configuration
 */
export interface CCMapping {
  faderIndex: number;
  ccNumber: number;
  channel: number;
  minValue: number;
  maxValue: number;
}

/**
 * Lever settings model
 */
export interface LeverModel {
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

/**
 * Lever Push settings model
 */
export interface LeverPushModel {
  ccNumber: number;
  minCCValue: number;
  maxCCValue: number;
  functionMode: number;
  onsetTime: number;
  offsetTime: number;
  onsetType: number;
  offsetType: number;
}

/**
 * Touch sensor settings model
 */
export interface TouchModel {
  ccNumber: number;
  minCCValue: number;
  maxCCValue: number;
  functionMode: number;
}

/**
 * Scale settings model
 */
export interface ScaleModel {
  scaleType: number;
  rootNote: number;
}

/**
 * Device settings configuration
 */
export interface DeviceSettings {
  lever1: LeverModel;
  leverPush1: LeverPushModel;
  lever2: LeverModel;
  leverPush2: LeverPushModel;
  touch: TouchModel;
  scale: ScaleModel;
}

/**
 * Complete device state
 */
export interface KB1DeviceState {
  ccMappings: CCMapping[];
  settings: DeviceSettings;
}

/**
 * Message types for KB1 protocol
 */
export enum KB1MessageType {
  // TODO: Define actual KB1 message types
  GET_CC_MAPPING = 0x01,
  SET_CC_MAPPING = 0x02,
  GET_SETTINGS = 0x03,
  SET_SETTINGS = 0x04,
  SAVE_TO_FLASH = 0x05,
  // Add more as protocol is defined
}

export class KB1Protocol {
  /**
   * Encode a request to get CC mappings from the device
   */
  encodeGetCCMappings(): ArrayBuffer {
    // TODO: Implement actual KB1 protocol encoding
    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);
    view.setUint8(0, KB1MessageType.GET_CC_MAPPING);
    view.setUint8(1, 0); // Placeholder
    return buffer;
  }

  /**
   * Encode a CC mapping to send to the device
   */
  encodeSetCCMapping(mapping: CCMapping): ArrayBuffer {
    // TODO: Implement actual KB1 protocol encoding
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setUint8(0, KB1MessageType.SET_CC_MAPPING);
    view.setUint8(1, mapping.faderIndex);
    view.setUint8(2, mapping.ccNumber);
    view.setUint8(3, mapping.channel);
    view.setUint8(4, mapping.minValue);
    view.setUint8(5, mapping.maxValue);
    return buffer;
  }

  /**
   * Encode a request to get device settings
   */
  encodeGetSettings(): ArrayBuffer {
    // TODO: Implement actual KB1 protocol encoding for getting settings
    // This method should encode a request to retrieve all device settings from the KB1
    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);
    view.setUint8(0, KB1MessageType.GET_SETTINGS);
    view.setUint8(1, 0); // Placeholder
    return buffer;
  }

  /**
   * Encode device settings to send to the device
   */
  encodeSetSettings(settings: DeviceSettings): ArrayBuffer {
    // TODO: Implement actual KB1 protocol encoding for setting device settings
    // This method should encode all settings (lever1, leverPush1, lever2, leverPush2, touch, scale)
    // into the binary format expected by the KB1 device
    console.log('TODO: Encode settings:', settings); // Placeholder to avoid unused param error
    const buffer = new ArrayBuffer(128); // Placeholder size, adjust based on actual protocol
    const view = new DataView(buffer);
    view.setUint8(0, KB1MessageType.SET_SETTINGS);
    // TODO: Encode all lever, lever push, touch, and scale settings
    return buffer;
  }

  /**
   * Encode a save command to persist settings to flash
   */
  encodeSaveToFlash(): ArrayBuffer {
    // TODO: Implement actual KB1 protocol encoding for save to flash command
    // This method should encode a command to save current RAM settings to flash memory
    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);
    view.setUint8(0, KB1MessageType.SAVE_TO_FLASH);
    view.setUint8(1, 0); // Placeholder
    return buffer;
  }

  /**
   * Decode a message received from the device
   */
  decodeMessage(data: DataView): any {
    // TODO: Implement actual KB1 protocol decoding
    if (data.byteLength === 0) {
      return null;
    }

    const messageType = data.getUint8(0);

    switch (messageType) {
      case KB1MessageType.GET_CC_MAPPING:
        return this.decodeCCMapping(data);
      case KB1MessageType.GET_SETTINGS:
        return this.decodeSettings(data);
      default:
        console.warn('Unknown message type:', messageType);
        return null;
    }
  }

  /**
   * Decode CC mapping from device response
   */
  private decodeCCMapping(data: DataView): CCMapping | null {
    // TODO: Implement actual KB1 protocol decoding
    if (data.byteLength < 6) {
      return null;
    }

    return {
      faderIndex: data.getUint8(1),
      ccNumber: data.getUint8(2),
      channel: data.getUint8(3),
      minValue: data.getUint8(4),
      maxValue: data.getUint8(5),
    };
  }

  /**
   * Decode device settings from device response
   */
  private decodeSettings(data: DataView): DeviceSettings | null {
    // TODO: Implement actual KB1 protocol decoding for device settings
    // This method should decode the binary response from the KB1 into the DeviceSettings structure
    if (data.byteLength < 3) {
      return null;
    }

    // Return defaults as placeholder
    return this.createDefaultSettings();
  }

  /**
   * Create default CC mapping
   */
  createDefaultCCMapping(faderIndex: number): CCMapping {
    return {
      faderIndex,
      ccNumber: faderIndex, // Default: fader index = CC number
      channel: 1,
      minValue: 0,
      maxValue: 127,
    };
  }

  /**
   * Create default lever settings
   */
  createDefaultLeverSettings(): LeverModel {
    return {
      ccNumber: 1,
      minCCValue: 0,
      maxCCValue: 127,
      stepSize: 1,
      functionMode: 0,
      valueMode: 0,
      onsetTime: 0,
      offsetTime: 0,
      onsetType: 0,
      offsetType: 0,
    };
  }

  /**
   * Create default lever push settings
   */
  createDefaultLeverPushSettings(): LeverPushModel {
    return {
      ccNumber: 2,
      minCCValue: 0,
      maxCCValue: 127,
      functionMode: 0,
      onsetTime: 0,
      offsetTime: 0,
      onsetType: 0,
      offsetType: 0,
    };
  }

  /**
   * Create default touch sensor settings
   */
  createDefaultTouchSettings(): TouchModel {
    return {
      ccNumber: 3,
      minCCValue: 0,
      maxCCValue: 127,
      functionMode: 0,
    };
  }

  /**
   * Create default scale settings
   */
  createDefaultScaleSettings(): ScaleModel {
    return {
      scaleType: 0, // Chromatic
      rootNote: 0, // C
    };
  }

  /**
   * Create default device settings
   */
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

  /**
   * Validate CC mapping values
   */
  validateCCMapping(mapping: CCMapping): boolean {
    return (
      mapping.faderIndex >= 0 &&
      mapping.ccNumber >= 0 && mapping.ccNumber <= 127 &&
      mapping.channel >= 1 && mapping.channel <= 16 &&
      mapping.minValue >= 0 && mapping.minValue <= 127 &&
      mapping.maxValue >= 0 && mapping.maxValue <= 127 &&
      mapping.minValue <= mapping.maxValue
    );
  }

  /**
   * Validate device settings
   */
  validateSettings(settings: DeviceSettings): boolean {
    // Basic validation for all settings
    return (
      settings.lever1 !== undefined &&
      settings.leverPush1 !== undefined &&
      settings.lever2 !== undefined &&
      settings.leverPush2 !== undefined &&
      settings.touch !== undefined &&
      settings.scale !== undefined &&
      // Validate CC numbers are in valid range (-1 for "Off" or 0-127 for valid CC)
      this.isValidCC(settings.lever1.ccNumber) &&
      this.isValidCC(settings.lever2.ccNumber) &&
      this.isValidCC(settings.leverPush1.ccNumber) &&
      this.isValidCC(settings.leverPush2.ccNumber) &&
      this.isValidCC(settings.touch.ccNumber)
    );
  }

  /**
   * Check if CC number is valid (-1 for "Off" or 0-127)
   */
  private isValidCC(ccNumber: number): boolean {
    return ccNumber === -1 || (ccNumber >= 0 && ccNumber <= 127);
  }
}

// Export singleton instance
export const kb1Protocol = new KB1Protocol();
