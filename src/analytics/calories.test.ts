import { describe, expect, it } from 'vitest';
import { estimateCalories } from './calories';
import { buildZoneConfig } from './zones';
import { DEFAULT_USER_SETTINGS } from '../types';

describe('estimateCalories', () => {
  it('uses the Keytel formula when age and weight are available', () => {
    const settings = {
      ...DEFAULT_USER_SETTINGS,
      age: 30,
      weight: 70,
      weightUnit: 'kg' as const,
    };
    const zoneConfig = buildZoneConfig(settings);

    const calories = estimateCalories({
      durationSec: 3600,
      avgHeartRate: 140,
      settings,
      zoneConfig,
    });

    expect(calories).toBeGreaterThan(0);
  });

  it('falls back to a MET estimate when profile data is missing', () => {
    const zoneConfig = buildZoneConfig(DEFAULT_USER_SETTINGS);

    const calories = estimateCalories({
      durationSec: 1800,
      avgHeartRate: 150,
      settings: DEFAULT_USER_SETTINGS,
      zoneConfig,
    });

    expect(calories).toBeGreaterThan(0);
  });
});
