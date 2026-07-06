import { describe, expect, it } from 'vitest';
import { buildZoneConfig } from './zones';
import {
  aggregateZoneTime,
  buildHeartRateSeries,
  buildZoneSeries,
  calculateDurationSec,
  calculateHeartRateStats,
} from './stats';
import { DEFAULT_USER_SETTINGS } from '../types';
import type { WorkoutSession } from '../types';

const zoneConfig = buildZoneConfig(DEFAULT_USER_SETTINGS);

const fixtureSession: WorkoutSession = {
  id: 'session-1',
  startedAt: 0,
  endedAt: 60_000,
  samples: [
    { timestamp: 0, bpm: 120 },
    { timestamp: 20_000, bpm: 130 },
    { timestamp: 40_000, bpm: 145 },
    { timestamp: 60_000, bpm: 160 },
  ],
};

describe('stats', () => {
  it('calculates duration and heart rate stats', () => {
    expect(calculateDurationSec(fixtureSession)).toBe(60);
    expect(calculateHeartRateStats(fixtureSession.samples)).toEqual({
      avgHeartRate: 139,
      maxHeartRate: 160,
    });
  });

  it('aggregates zone time from sample intervals', () => {
    const zoneTimeSec = aggregateZoneTime(
      fixtureSession.samples,
      zoneConfig,
      fixtureSession.endedAt!,
    );

    expect(zoneTimeSec[1]).toBe(20);
    expect(zoneTimeSec[2]).toBe(20);
    expect(zoneTimeSec[3]).toBe(0);
    expect(zoneTimeSec[4]).toBe(0);
    expect(zoneTimeSec[5]).toBe(0);
  });

  it('builds a downsampled zone series', () => {
    const longSession: WorkoutSession = {
      ...fixtureSession,
      samples: Array.from({ length: 12 }, (_, index) => ({
        timestamp: index * 5000,
        bpm: 130 + index,
      })),
      endedAt: 55_000,
    };

    const series = buildZoneSeries(longSession.samples, zoneConfig, 5000);

    expect(series.length).toBeGreaterThan(0);
    expect(series[0]).toMatchObject({
      bpm: expect.any(Number),
      zone: expect.any(Number),
    });
  });

  it('includes below-zone heart rate in the heart rate series', () => {
    const belowZoneSamples = [
      { timestamp: 0, bpm: 100 },
      { timestamp: 15_000, bpm: 110 },
      { timestamp: 30_000, bpm: 115 },
      { timestamp: 46_000, bpm: 118 },
    ];

    expect(buildZoneSeries(belowZoneSamples, zoneConfig)).toHaveLength(0);
    expect(buildHeartRateSeries(belowZoneSamples).length).toBeGreaterThan(0);
  });
});
