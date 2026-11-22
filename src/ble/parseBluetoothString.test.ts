import { describe, expect, it } from 'vitest';
import { parseBluetoothString } from './parseBluetoothString';

describe('parseBluetoothString', () => {
  it('decodes UTF-8 device strings', () => {
    const encoded = new TextEncoder().encode('Polar Electro');
    expect(parseBluetoothString(encoded.buffer)).toBe('Polar Electro');
  });

  it('strips trailing null bytes', () => {
    const bytes = new Uint8Array([80, 111, 108, 97, 114, 0, 0]);
    expect(parseBluetoothString(bytes.buffer)).toBe('Polar');
  });
});