export type BluetoothSupportReason =
  | 'supported'
  | 'missing-api'
  | 'not-chrome'
  | 'insecure-context';

export interface BluetoothSupportStatus {
  supported: boolean;
  reason: BluetoothSupportReason;
  message: string;
}

function isChromeBrowser(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent;
  const isChromium = /Chrome|CriOS/i.test(userAgent);
  const isOtherChromiumBrowser = /Edg|OPR|Brave/i.test(userAgent);
  return isChromium && !isOtherChromiumBrowser;
}

export function getBluetoothSupportStatus(): BluetoothSupportStatus {
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return {
      supported: false,
      reason: 'insecure-context',
      message:
        'Web Bluetooth requires HTTPS. Use localhost, an HTTPS tunnel, or a secure dev server.',
    };
  }

  if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
    return {
      supported: false,
      reason: 'missing-api',
      message:
        'Web Bluetooth is not available in this browser. Use Chrome on Android or desktop.',
    };
  }

  if (!isChromeBrowser()) {
    return {
      supported: false,
      reason: 'not-chrome',
      message:
        'This app currently supports Chrome only. Edge, Opera, Safari, and Firefox are not supported for BLE.',
    };
  }

  return {
    supported: true,
    reason: 'supported',
    message: 'Web Bluetooth is available.',
  };
}

export async function getBluetoothAvailability(): Promise<boolean | null> {
  if (!('bluetooth' in navigator) || !navigator.bluetooth.getAvailability) {
    return null;
  }

  try {
    return await navigator.bluetooth.getAvailability();
  } catch {
    return null;
  }
}
