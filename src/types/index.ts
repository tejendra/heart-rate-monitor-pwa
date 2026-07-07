export type HeartRateZone = 1 | 2 | 3 | 4 | 5;

export interface HeartRateSample {
  timestamp: number;
  bpm: number;
  rrIntervalsMs?: number[];
  contactDetected?: boolean;
}

export interface WorkoutSession {
  id: string;
  startedAt: number;
  endedAt?: number;
  deviceName?: string;
  samples: HeartRateSample[];
}

export interface ZoneBound {
  minBpm: number;
  maxBpm: number;
}

export interface ZoneConfig {
  method: 'karvonen' | 'manual';
  maxHeartRate: number;
  restingHeartRate: number;
  hrr: number;
  bounds: Record<HeartRateZone, ZoneBound>;
}

export interface HrvSummary {
  rmssd: number;
  sdnn: number;
  sampleCount: number;
}

export interface ZoneSeriesPoint {
  timestamp: string;
  bpm: number;
  zone: HeartRateZone;
}

export interface WorkoutReport {
  id: string;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  avgHeartRate: number;
  maxHeartRate: number;
  caloriesBurned: number;
  zoneConfig: ZoneConfig;
  zoneTimeSec: Record<HeartRateZone, number>;
  zoneSeries: ZoneSeriesPoint[];
  hrv: HrvSummary;
  samples: HeartRateSample[];
  appVersion: '1.0.0';
}

export type ZoneMethod = 'karvonen' | 'manual';
export type WeightUnit = 'kg' | 'lb';

export interface UserSettings {
  maxHeartRate: number;
  restingHeartRate: number;
  weight?: number;
  weightUnit: WeightUnit;
  age?: number;
  zoneMethod: ZoneMethod;
  manualZoneBounds?: [number, number, number, number];
}

export interface WorkoutExport {
  schemaVersion: '1.0';
  exportedAt: string;
  report: WorkoutReport;
}

export const APP_VERSION = '1.0.0' as const;

export const DEFAULT_USER_SETTINGS: UserSettings = {
  maxHeartRate: 190,
  restingHeartRate: 60,
  weightUnit: 'kg',
  zoneMethod: 'karvonen',
};
