import { afterEach, describe, expect, it, vi } from 'vitest';
import { getBluetoothSupportStatus, isIosDevice } from './support';

describe('bluetooth support', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns supported on secure Chrome desktop', () => {
    vi.stubGlobal('window', { isSecureContext: true });
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      platform: 'MacIntel',
      maxTouchPoints: 0,
      bluetooth: {},
    });

    expect(getBluetoothSupportStatus().supported).toBe(true);
  });

  it('detects iOS devices', () => {
    vi.stubGlobal('window', { isSecureContext: true });
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      platform: 'iPhone',
      maxTouchPoints: 5,
    });

    expect(isIosDevice()).toBe(true);
    expect(getBluetoothSupportStatus().reason).toBe('ios-unsupported');
  });
});
