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
 * Lever settings configuration
 */
export interface LeverSettings {
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
 * Lever Push settings configuration
 */
export interface LeverPushSettings {
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
 * Touch Sensor settings configuration
 */
export interface TouchSettings {
  ccNumber: number;
  minCCValue: number;
  maxCCValue: number;
  functionMode: number;
  /** Touch threshold value (0-65535). Default: 24000. Lower = more sensitive */
  threshold?: number;
}

/**
 * Scale settings configuration
 */
export interface ScaleSettings {
  scaleType: number;
  rootNote: number;
}

/**
 * Type aliases for component models
 */
export type LeverModel = LeverSettings;
export type LeverPushModel = LeverPushSettings;
export type TouchModel = TouchSettings;
export type ScaleModel = ScaleSettings;

/**
 * Device settings configuration
 */
export interface DeviceSettings {
  lever1: LeverSettings;
  leverPush1: LeverPushSettings;
  lever2: LeverSettings;
  leverPush2: LeverPushSettings;
  touch: TouchSettings;
  scale: ScaleSettings;
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

/**
 * Function mode constants (from firmware)
 * Note: Different sections use different numeric values for their modes
 */
export enum FunctionMode {
  // Generic/shared modes
  CONTINUOUS = 0,
  TOGGLE = 1,
  MOMENTARY = 2,
  INTERPOLATED = 3,
  RESET = 4,
}

/**
 * Lever Function Mode constants (firmware values)
 */
export enum LeverFunctionMode {
  INTERPOLATED = 0,
  PEAK_DECAY = 1,
  INCREMENTAL = 2,
}

/**
 * Lever Push Function Mode constants (firmware values)
 */
export enum LeverPushFunctionMode {
  INTERPOLATED = 0,
  PEAK_DECAY = 1,
  STATIC = 2,
  RESET = 3,
}

/**
 * Touch Function Mode constants (firmware values)
 */
export enum TouchFunctionMode {
  HOLD = 0,
  TOGGLE = 1,
  CONTINUOUS = 2,
}

/**
 * Value mode constants (from firmware)
 */
export enum ValueMode {
  ABSOLUTE = 0,
  BIPOLAR = 1,
}

/**
 * Interpolation type constants (from firmware)
 */
export enum InterpolationType {
  LINEAR = 0,
  EXPONENTIAL = 1,
  LOGARITHMIC = 2,
}

/**
 * Scale type constants (from firmware)
 */
export enum ScaleType {
  CHROMATIC = 0,
  MAJOR = 1,
  MINOR = 2,
  DORIAN = 3,
  PHRYGIAN = 4,
  LYDIAN = 5,
  MIXOLYDIAN = 6,
  AEOLIAN = 7,
  LOCRIAN = 8,
  PENTATONIC_MAJOR = 9,
  PENTATONIC_MINOR = 10,
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
  encodeSetSettings(_settings: DeviceSettings): ArrayBuffer {
    // TODO: Implement actual KB1 protocol encoding when binary format is finalized
    const buffer = new ArrayBuffer(128);
    const view = new DataView(buffer);
    view.setUint8(0, KB1MessageType.SET_SETTINGS);
    // TODO: Encode all lever, push, touch, and scale settings
    // Placeholder to maintain compilation
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
  private decodeSettings(_data: DataView): DeviceSettings | null {
    // TODO: Implement actual KB1 protocol decoding when binary format is finalized
    // For now, return default settings structure
    return this.createDefaultSettings();
  }

  /**
   * Create default CC mapping
   */
  createDefaultCCMapping(faderIndex: number): CCMapping {
    return {
      faderIndex,
      ccNumber: faderIndex, // Default: fader index = CC number
      channel: 1, // Always channel 1
      minValue: 0,
      maxValue: 127,
    };
  }

  /**
   * Create default device settings aligned with firmware defaults
   * Based on firmware/src/main.cpp
   * Uses section-specific function mode enums to match firmware numeric values
   */
  createDefaultDeviceSettings(): DeviceSettings {
    return {
      lever1: {
        ccNumber: 3,
        minCCValue: 0,
        maxCCValue: 127,
        stepSize: 1,
        functionMode: 0, // Interpolated
        valueMode: ValueMode.BIPOLAR,
        onsetTime: 100,
        offsetTime: 100,
        onsetType: InterpolationType.LINEAR,
        offsetType: InterpolationType.LINEAR,
      },
      leverPush1: {
        ccNumber: 24,
        minCCValue: 31,
        maxCCValue: 127,
        functionMode: 0, // Interpolated
        onsetTime: 100,
        offsetTime: 100,
        onsetType: InterpolationType.LINEAR,
        offsetType: InterpolationType.LINEAR,
      },
      lever2: {
        ccNumber: 128,
        minCCValue: 15,
        maxCCValue: 127,
        stepSize: 8,
        functionMode: 2, // Incremental
        valueMode: ValueMode.BIPOLAR,
        onsetTime: 100,
        offsetTime: 100,
        onsetType: InterpolationType.LINEAR,
        offsetType: InterpolationType.LINEAR,
      },
      leverPush2: {
        ccNumber: 128,
        minCCValue: 87,
        maxCCValue: 87,
        functionMode: 3, // Reset
        onsetTime: 100,
        offsetTime: 100,
        onsetType: InterpolationType.LINEAR,
        offsetType: InterpolationType.LINEAR,
      },
      touch: {
        ccNumber: 1,
        minCCValue: 64,
        maxCCValue: 127,
        functionMode: 2, // Continuous
        threshold: 24000,
      },
      scale: {
        scaleType: ScaleType.CHROMATIC,
        rootNote: 60,
      },
    };
  }

  /**
   * Create default device settings
   * @deprecated Use createDefaultDeviceSettings() instead
   */
  createDefaultSettings(): DeviceSettings {
    return this.createDefaultDeviceSettings();
  }

  /**
   * Validate CC mapping values
   */
  validateCCMapping(mapping: CCMapping): boolean {
    return (
      mapping.faderIndex >= 0 &&
      mapping.ccNumber >= 0 && mapping.ccNumber <= 128 && // Support CC 128 for Velocity
      mapping.channel === 1 &&
      mapping.minValue >= 0 && mapping.minValue <= 127 &&
      mapping.maxValue >= 0 && mapping.maxValue <= 127 &&
      mapping.minValue <= mapping.maxValue
    );
  }

  /**
   * Validate device settings
   */
  validateSettings(settings: DeviceSettings): boolean {
    // Helper to validate lever settings
    const validateLever = (lever: LeverSettings): boolean => {
      return (
        lever.ccNumber >= -1 && lever.ccNumber <= 128 && // Support CC 128 for Velocity
        lever.minCCValue >= 0 && lever.minCCValue <= 127 &&
        lever.maxCCValue >= 0 && lever.maxCCValue <= 127 &&
        lever.minCCValue <= lever.maxCCValue &&
        lever.stepSize >= 1 &&
        lever.onsetTime >= 0 &&
        lever.offsetTime >= 0
      );
    };

    // Helper to validate lever push settings
    const validateLeverPush = (leverPush: LeverPushSettings): boolean => {
      return (
        leverPush.ccNumber >= -1 && leverPush.ccNumber <= 128 && // Support CC 128 for Velocity
        leverPush.minCCValue >= 0 && leverPush.minCCValue <= 127 &&
        leverPush.maxCCValue >= 0 && leverPush.maxCCValue <= 127 &&
        leverPush.minCCValue <= leverPush.maxCCValue &&
        leverPush.onsetTime >= 0 &&
        leverPush.offsetTime >= 0
      );
    };

    // Helper to validate touch settings
    const validateTouch = (touch: TouchSettings): boolean => {
      return (
        touch.ccNumber >= -1 && touch.ccNumber <= 128 && // Support CC 128 for Velocity
        touch.minCCValue >= 0 && touch.minCCValue <= 127 &&
        touch.maxCCValue >= 0 && touch.maxCCValue <= 127 &&
        touch.minCCValue <= touch.maxCCValue
      );
    };

    // Helper to validate scale settings
    const validateScale = (scale: ScaleSettings): boolean => {
      return (
        scale.scaleType >= 0 &&
        scale.rootNote >= 0 && scale.rootNote <= 11
      );
    };

    return (
      settings.lever1 !== undefined && validateLever(settings.lever1) &&
      settings.leverPush1 !== undefined && validateLeverPush(settings.leverPush1) &&
      settings.lever2 !== undefined && validateLever(settings.lever2) &&
      settings.leverPush2 !== undefined && validateLeverPush(settings.leverPush2) &&
      settings.touch !== undefined && validateTouch(settings.touch) &&
      settings.scale !== undefined && validateScale(settings.scale)
    );
  }


}

// Export singleton instance
export const kb1Protocol = new KB1Protocol();
