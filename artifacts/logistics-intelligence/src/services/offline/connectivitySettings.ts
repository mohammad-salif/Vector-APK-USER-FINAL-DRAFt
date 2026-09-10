/**
 * CONNECTIVITY SETTINGS SERVICE
 *
 * Manages user preferences and hardware/permission states for:
 * - Bluetooth Mode (Master switch for BLE communication capability)
 * - Relay Mode (Store-and-forward participation switch)
 *
 * Requirements:
 * - Default preferences: ON for both (bluetoothModeEnabled = true, relayModeEnabled = true).
 * - Persisted in localStorage keys: 'bluetoothModeEnabled' and 'relayModeEnabled'.
 * - When Bluetooth Mode is OFF:
 *   - Relay Mode is visually and functionally disabled/unavailable.
 *   - The saved Relay Mode preference is remembered and restored when Bluetooth Mode is turned back ON.
 *   - Bluetooth communication or relay communication cannot be initiated.
 * - Truthful hardware & permission reporting:
 *   - Respects Android runtime permissions via NativeBlePlugin.
 *   - If permission is denied, Bluetooth Mode cannot be activated and a clean notice is presented.
 *   - If Bluetooth adapter is disabled, no fake activity is reported.
 */

import { Capacitor } from '@capacitor/core';
import { NativeBle } from './nativeBlePlugin';
import { bluetoothTransport } from './bluetoothTransport';

const PREF_BLUETOOTH_MODE_KEY = 'bluetoothModeEnabled';
const PREF_RELAY_MODE_KEY = 'relayModeEnabled';

type ConnectivityChangeListener = (settings: {
  bluetoothModeEnabled: boolean;
  relayModeEnabled: boolean;
}) => void;

const listeners = new Set<ConnectivityChangeListener>();

function notifyListeners(): void {
  const current = {
    bluetoothModeEnabled: getBluetoothModePreference(),
    relayModeEnabled: getRelayModePreference(),
  };
  for (const listener of listeners) {
    try {
      listener(current);
    } catch {
      // Safe dispatch
    }
  }
}

export function subscribeConnectivitySettings(listener: ConnectivityChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Returns saved preference for Bluetooth Mode (default: true).
 */
export function getBluetoothModePreference(): boolean {
  try {
    const raw = localStorage.getItem(PREF_BLUETOOTH_MODE_KEY);
    if (raw === null) return true;
    return raw === 'true';
  } catch {
    return true;
  }
}

/**
 * Saves Bluetooth Mode preference.
 */
export function setBluetoothModePreference(enabled: boolean): void {
  try {
    localStorage.setItem(PREF_BLUETOOTH_MODE_KEY, String(enabled));
  } catch {
    // Ignore storage quota errors
  }

  // When turned OFF, terminate any active BLE operations immediately
  if (!enabled) {
    try {
      if (bluetoothTransport.isAdvertising()) {
        bluetoothTransport.stopAdvertising().catch(() => {});
      }
      bluetoothTransport.stopScan().catch(() => {});
      bluetoothTransport.disconnect().catch(() => {});
    } catch {
      // Ignore
    }
  }

  notifyListeners();
}

/**
 * Returns saved preference for Relay Mode (default: true).
 */
export function getRelayModePreference(): boolean {
  try {
    const raw = localStorage.getItem(PREF_RELAY_MODE_KEY);
    if (raw === null) return true;
    return raw === 'true';
  } catch {
    return true;
  }
}

/**
 * Saves Relay Mode preference without altering Bluetooth Mode.
 */
export function setRelayModePreference(enabled: boolean): void {
  try {
    localStorage.setItem(PREF_RELAY_MODE_KEY, String(enabled));
  } catch {
    // Ignore storage quota errors
  }
  notifyListeners();
}

/**
 * Returns whether Bluetooth Mode is actively permitted by the master switch.
 */
export function isBluetoothModeActive(): boolean {
  return getBluetoothModePreference();
}

/**
 * Returns whether Relay Mode is actively operational (governed by the master Bluetooth Mode switch).
 */
export function isRelayModeActive(): boolean {
  return getBluetoothModePreference();
}

/**
 * Inspects real Android Bluetooth hardware state and triggers runtime permission flow if needed.
 */
export async function verifyBluetoothPrerequisites(): Promise<{
  isNative: boolean;
  isSupported: boolean;
  adapterEnabled: boolean;
  permissionGranted: boolean;
  errorMessage?: string;
}> {
  const isNative = Capacitor.isNativePlatform();

  if (!isNative) {
    // Browser / web fallback environment
    return {
      isNative: false,
      isSupported: true,
      adapterEnabled: true,
      permissionGranted: true,
    };
  }

  try {
    const support = await NativeBle.isSupported();
    if (!support || !support.isSupported) {
      return {
        isNative: true,
        isSupported: false,
        adapterEnabled: false,
        permissionGranted: false,
        errorMessage: 'Bluetooth Low Energy hardware not available on this device.',
      };
    }

    const enabledStatus = await NativeBle.isEnabled();
    const adapterEnabled = !!enabledStatus?.isEnabled;

    let permissionGranted = false;
    try {
      const perm = await NativeBle.requestPermissions();
      permissionGranted = !!perm?.granted;
    } catch (permErr: any) {
      permissionGranted = false;
      return {
        isNative: true,
        isSupported: true,
        adapterEnabled,
        permissionGranted: false,
        errorMessage: permErr?.message || 'Bluetooth permission was denied.',
      };
    }

    return {
      isNative: true,
      isSupported: true,
      adapterEnabled,
      permissionGranted,
      errorMessage: !adapterEnabled
        ? 'Device Bluetooth adapter is turned off.'
        : !permissionGranted
        ? 'Bluetooth permission was denied.'
        : undefined,
    };
  } catch (err: any) {
    return {
      isNative: true,
      isSupported: false,
      adapterEnabled: false,
      permissionGranted: false,
      errorMessage: err?.message || 'Bluetooth initialization check failed.',
    };
  }
}
