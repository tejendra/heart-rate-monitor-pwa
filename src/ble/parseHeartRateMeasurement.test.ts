import { describe, expect, it } from 'vitest';
import {
  parseHeartRateMeasurement,
  toHeartRateSample,
} from './parseHeartRateMeasurement';

function toBuffer(bytes: number[]): ArrayBuffer {
  return Uint8Array.from(bytes).buffer;
}

describe('parseHeartRateMeasurement', () => {
  it('parses UINT8 heart rate without optional fields', () => {
    const result = parseHeartRateMeasurement(toBuffer([0x00, 0x4c]));

    expect(result).toEqual({
      bpm: 76,
      rrIntervalsMs: undefined,
      contactDetected: undefined,
    });
  });

  it('parses UINT16 heart rate format', () => {
    const result = parseHeartRateMeasurement(toBuffer([0x01, 0x2c, 0x01]));

    expect(result).toEqual({
      bpm: 300,
      rrIntervalsMs: undefined,
      contactDetected: undefined,
    });
  });

  it('parses sensor contact detected', () => {
    const result = parseHeartRateMeasurement(toBuffer([0x06, 0x78]));

    expect(result).toEqual({
      bpm: 120,
      rrIntervalsMs: undefined,
      contactDetected: true,
    });
  });

  it('parses sensor contact not detected', () => {
    const result = parseHeartRateMeasurement(toBuffer([0x04, 0x78]));

    expect(result).toEqual({
      bpm: 120,
      rrIntervalsMs: undefined,
      contactDetected: false,
    });
  });

  it('skips energy expended and parses RR intervals', () => {
    const result = parseHeartRateMeasurement(
      toBuffer([0x18, 0x50, 0x00, 0x10, 0xe8, 0x03]),
    );

    expect(result.bpm).toBe(80);
    expect(result.contactDetected).toBeUndefined();
    expect(result.rrIntervalsMs).toEqual([977]);
  });

  it('parses multiple RR intervals', () => {
    const result = parseHeartRateMeasurement(
      toBuffer([0x10, 0x4b, 0xd0, 0x07, 0xd0, 0x07]),
    );

    expect(result).toEqual({
      bpm: 75,
      rrIntervalsMs: [1953, 1953],
      contactDetected: undefined,
    });
  });

  it('throws when the payload is too short', () => {
    expect(() => parseHeartRateMeasurement(toBuffer([0x00]))).toThrow(
      RangeError,
    );
  });

  it('maps parsed values into a heart rate sample', () => {
    const sample = toHeartRateSample(toBuffer([0x06, 0x78]), 1_700_000_000_000);

    expect(sample).toEqual({
      timestamp: 1_700_000_000_000,
      bpm: 120,
      rrIntervalsMs: undefined,
      contactDetected: true,
    });
  });
});
