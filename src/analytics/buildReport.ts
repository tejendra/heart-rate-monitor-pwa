import type { UserSettings, WorkoutReport, WorkoutSession, ZoneConfig } from '../types';
import { APP_VERSION } from '../types';
import { estimateCalories } from './calories';
import { computeHrvFromSamples } from './hrv';
import {
  aggregateZoneTime,
  buildZoneSeries,
  calculateDurationSec,
  calculateHeartRateStats,
} from './stats';

export function buildWorkoutReport(
  session: WorkoutSession,
  zoneConfig: ZoneConfig,
  settings: UserSettings,
): WorkoutReport {
  const endedAt = session.endedAt ?? session.startedAt;
  const durationSec = calculateDurationSec(session);
  const { avgHeartRate, maxHeartRate } = calculateHeartRateStats(
    session.samples,
  );

  return {
    id: session.id,
    startedAt: new Date(session.startedAt).toISOString(),
    endedAt: new Date(endedAt).toISOString(),
    durationSec,
    avgHeartRate,
    maxHeartRate,
    caloriesBurned: estimateCalories({
      durationSec,
      avgHeartRate,
      settings,
      zoneConfig,
    }),
    zoneConfig,
    userSettings: { ...settings },
    zoneTimeSec: aggregateZoneTime(session.samples, zoneConfig, endedAt),
    zoneSeries: buildZoneSeries(session.samples, zoneConfig),
    hrv: computeHrvFromSamples(session.samples),
    samples: session.samples,
    appVersion: APP_VERSION,
  };
}
