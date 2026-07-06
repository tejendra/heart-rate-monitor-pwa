import { describe, expect, it } from 'vitest';
import {
  computeHrvFromSamples,
  computeRmssd,
  computeSdnn,
  filterRRArtifacts,
  isHrvAvailable,
} from './hrv';
import type { HeartRateSample } from '../types';

describe('hrv', () => {
  it('filters RR artifacts outside valid bounds and large jumps', () => {
    const filtered = filterRRArtifacts([900, 950, 200, 960, 1400]);

    expect(filtered).toEqual([900, 950, 960]);
  });

  it('computes RMSSD and SDNN', () => {
    const intervals = [900, 950, 920, 940];

    expect(computeRmssd(intervals)).toBe(36);
    expect(computeSdnn(intervals)).toBe(19);
  });

  it('builds HRV summary from workout samples', () => {
    const samples: HeartRateSample[] = [
      { timestamp: 0, bpm: 70, rrIntervalsMs: [900, 950] },
      { timestamp: 1000, bpm: 71, rrIntervalsMs: [920, 940] },
    ];

    const summary = computeHrvFromSamples(samples);

    expect(isHrvAvailable(summary)).toBe(true);
    expect(summary.sampleCount).toBeGreaterThan(1);
    expect(summary.rmssd).toBeGreaterThan(0);
    expect(summary.sdnn).toBeGreaterThan(0);
  });

  it('returns unavailable HRV when RR intervals are missing', () => {
    const summary = computeHrvFromSamples([
      { timestamp: 0, bpm: 120 },
      { timestamp: 1000, bpm: 125 },
    ]);

    expect(isHrvAvailable(summary)).toBe(false);
    expect(summary.sampleCount).toBe(0);
  });
});
