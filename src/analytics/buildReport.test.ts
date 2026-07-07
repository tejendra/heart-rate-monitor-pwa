import { describe, expect, it } from 'vitest';
import { buildWorkoutReport } from './buildReport';
import { buildZoneConfig } from './zones';
import { DEFAULT_USER_SETTINGS } from '../types';
import type { WorkoutSession } from '../types';

describe('buildWorkoutReport', () => {
  it('builds a complete report from a workout session', () => {
    const zoneConfig = buildZoneConfig(DEFAULT_USER_SETTINGS);
    const session: WorkoutSession = {
      id: 'workout-1',
      startedAt: Date.parse('2026-07-06T12:00:00.000Z'),
      endedAt: Date.parse('2026-07-06T12:30:00.000Z'),
      deviceName: 'Polar H10',
      samples: [
        { timestamp: Date.parse('2026-07-06T12:00:00.000Z'), bpm: 130 },
        {
          timestamp: Date.parse('2026-07-06T12:05:00.000Z'),
          bpm: 145,
          rrIntervalsMs: [900, 920, 910],
        },
        { timestamp: Date.parse('2026-07-06T12:10:00.000Z'), bpm: 160 },
        { timestamp: Date.parse('2026-07-06T12:30:00.000Z'), bpm: 150 },
      ],
    };

    const report = buildWorkoutReport(session, zoneConfig, {
      ...DEFAULT_USER_SETTINGS,
      age: 30,
      weight: 70,
      weightUnit: 'kg',
    });

    expect(report.id).toBe('workout-1');
    expect(report.durationSec).toBe(1800);
    expect(report.avgHeartRate).toBe(146);
    expect(report.maxHeartRate).toBe(160);
    expect(report.caloriesBurned).toBeGreaterThan(0);
    expect(report.userSettings).toEqual({
      ...DEFAULT_USER_SETTINGS,
      age: 30,
      weight: 70,
      weightUnit: 'kg',
    });
    expect(report.zoneTimeSec[2]).toBeGreaterThan(0);
    expect(report.zoneSeries.length).toBeGreaterThan(0);
    expect(report.samples).toHaveLength(4);
    expect(report.appVersion).toBe('1.0.0');
  });
});
