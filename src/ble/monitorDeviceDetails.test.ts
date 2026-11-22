import { describe, expect, it } from 'vitest';
import { formatMonitorDisplayName } from './monitorDeviceDetails';

describe('formatMonitorDisplayName', () => {
  it('uses manufacturer and model when available', () => {
    expect(
      formatMonitorDisplayName('Polar H10 12345', {
        manufacturer: 'Polar Electro',
        model: 'H10',
      }),
    ).toBe('Polar Electro H10');
  });

  it('falls back to the Bluetooth device name', () => {
    expect(formatMonitorDisplayName('Polar H10 12345', {})).toBe(
      'Polar H10 12345',
    );
  });
});