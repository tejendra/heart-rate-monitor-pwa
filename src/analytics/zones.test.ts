import { describe, expect, it } from 'vitest';
import {
  buildZoneConfig,
  classifyBpm,
  recommendMaxHeartRateFromAge,
} from './zones';
import { DEFAULT_USER_SETTINGS } from '../types';

describe('zones', () => {
  it('recommends max heart rate from age using the Gellish formula', () => {
    expect(recommendMaxHeartRateFromAge(30)).toBe(186);
  });

  it('builds Karvonen zone bounds from settings max heart rate', () => {
    const config = buildZoneConfig({
      ...DEFAULT_USER_SETTINGS,
      maxHeartRate: 190,
      restingHeartRate: 60,
      age: 30,
    });

    expect(config.maxHeartRate).toBe(190);
    expect(config.hrr).toBe(130);
    expect(config.bounds[1]).toEqual({ minBpm: 125, maxBpm: 138 });
    expect(config.bounds[5]).toEqual({ minBpm: 177, maxBpm: 190 });
  });

  it('classifies BPM into Karvonen zones', () => {
    const config = buildZoneConfig({
      ...DEFAULT_USER_SETTINGS,
      maxHeartRate: 190,
      restingHeartRate: 60,
    });

    expect(classifyBpm(120, config)).toBe('below');
    expect(classifyBpm(130, config)).toBe(1);
    expect(classifyBpm(145, config)).toBe(2);
    expect(classifyBpm(160, config)).toBe(3);
    expect(classifyBpm(170, config)).toBe(4);
    expect(classifyBpm(185, config)).toBe(5);
  });
});
