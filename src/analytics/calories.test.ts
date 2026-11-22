import { describe, expect, it } from 'vitest';
import { estimateCalories } from './calories';
import { buildZoneConfig } from './zones';
import { DEFAULT_USER_SETTINGS } from '../types';

describe('estimateCalories', () => {
  it('uses the full Keytel formula (including intercept) for men', () => {
    const settings = {
      ...DEFAULT_USER_SETTINGS,
      age: 30,
      weight: 70,
      weightUnit: 'kg' as const,
      sex: 'male' as const,
    };
    const zoneConfig = buildZoneConfig(settings);

  const calories = estimateCalories({
      durationSec: 55 * 60,
      avgHeartRate: 146,
      settings,
      zoneConfig,
    });

    expect(calories).toBe(749);
  });

  it('uses the Keytel formula for women when sex is set', () => {
    const settings = {
      ...DEFAULT_USER_SETTINGS,
      age: 30,
      weight: 62,
      weightUnit: 'kg' as const,
      sex: 'female' as const,
    };
    const zoneConfig = buildZoneConfig(settings);

    const calories = estimateCalories({
      durationSec: 30 * 60,
      avgHeartRate: 145,
      settings,
      zoneConfig,
    });

    expect(calories).toBe(278);
  });

  it('defaults to the male Keytel equation when sex is unset', () => {
    const settings = {
      ...DEFAULT_USER_SETTINGS,
      age: 30,
      weight: 70,
      weightUnit: 'kg' as const,
    };
    const zoneConfig = buildZoneConfig(settings);

    const calories = estimateCalories({
      durationSec: 60 * 60,
      avgHeartRate: 140,
      settings,
      zoneConfig,
    });

    expect(calories).toBe(763);
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
    expect(calories).toBeLessThan(400);
  });
});