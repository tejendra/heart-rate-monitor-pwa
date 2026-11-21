import { describe, expect, it } from 'vitest';
import { parseBatteryLevel } from './parseBatteryLevel';

describe('parseBatteryLevel', () => {
  it('parses a battery percentage byte', () => {
    expect(parseBatteryLevel(new Uint8Array([72]).buffer)).toBe(72);
  });

  it('clamps out-of-range values', () => {
    expect(parseBatteryLevel(new Uint8Array([255]).buffer)).toBe(100);
  });
});