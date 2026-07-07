import { describe, expect, it } from 'vitest';
import {
  createWorkoutExport,
  getWorkoutExportFilename,
} from './jsonExporter';
import { buildWorkoutReport } from '../analytics/buildReport';
import { buildZoneConfig } from '../analytics/zones';
import { DEFAULT_USER_SETTINGS } from '../types';
import type { WorkoutSession } from '../types';

describe('jsonExporter', () => {
  const session: WorkoutSession = {
    id: 'abc-123',
    startedAt: Date.parse('2026-07-06T12:00:00.000Z'),
    endedAt: Date.parse('2026-07-06T12:10:00.000Z'),
    samples: [{ timestamp: Date.parse('2026-07-06T12:00:00.000Z'), bpm: 130 }],
  };

  const settings = {
    ...DEFAULT_USER_SETTINGS,
    weight: 70,
    age: 30,
  };

  const report = buildWorkoutReport(
    session,
    buildZoneConfig(settings),
    settings,
  );

  it('creates export payload matching the schema', () => {
    const payload = createWorkoutExport(report);

    expect(payload.schemaVersion).toBe('1.0');
    expect(payload.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(payload.report).toEqual(report);
  });

  it('builds a stable download filename', () => {
    expect(getWorkoutExportFilename(report)).toBe(
      'workout-abc-123-2026-07-06.json',
    );
  });
});
