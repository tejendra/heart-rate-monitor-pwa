import type {
  HeartRateZone,
  UserSettings,
  ZoneBound,
  ZoneConfig,
} from '../types';

export type ZoneClassification = 0 | HeartRateZone;

const HRR_FRACTIONS: Array<{ zone: HeartRateZone; min: number; max: number }> =
  [
    { zone: 1, min: 0.5, max: 0.6 },
    { zone: 2, min: 0.6, max: 0.7 },
    { zone: 3, min: 0.7, max: 0.8 },
    { zone: 4, min: 0.8, max: 0.9 },
    { zone: 5, min: 0.9, max: 1.0 },
  ];

export function recommendMaxHeartRateFromAge(age: number): number {
  return Math.round(207 - 0.7 * age);
}

function buildKarvonenBounds(
  maxHeartRate: number,
  restingHeartRate: number,
): Record<HeartRateZone, ZoneBound> {
  const hrr = maxHeartRate - restingHeartRate;
  const bounds = {} as Record<HeartRateZone, ZoneBound>;

  for (const { zone, min, max } of HRR_FRACTIONS) {
    bounds[zone] = {
      minBpm: Math.round(restingHeartRate + hrr * min),
      maxBpm: Math.round(restingHeartRate + hrr * max),
    };
  }

  return bounds;
}

function buildManualBounds(
  manualZoneBounds: [number, number, number, number],
  maxHeartRate: number,
): Record<HeartRateZone, ZoneBound> {
  const [z1Max, z2Max, z3Max, z4Max] = manualZoneBounds;
  return {
    1: { minBpm: 0, maxBpm: z1Max },
    2: { minBpm: z1Max, maxBpm: z2Max },
    3: { minBpm: z2Max, maxBpm: z3Max },
    4: { minBpm: z3Max, maxBpm: z4Max },
    5: { minBpm: z4Max, maxBpm: maxHeartRate },
  };
}

export function buildZoneConfig(settings: UserSettings): ZoneConfig {
  const maxHeartRate = settings.maxHeartRate;
  const restingHeartRate = settings.restingHeartRate;
  const hrr = maxHeartRate - restingHeartRate;

  const bounds =
    settings.zoneMethod === 'manual' && settings.manualZoneBounds
      ? buildManualBounds(settings.manualZoneBounds, maxHeartRate)
      : buildKarvonenBounds(maxHeartRate, restingHeartRate);

  return {
    method: settings.zoneMethod,
    maxHeartRate,
    restingHeartRate,
    hrr,
    bounds,
  };
}

export function classifyBpm(
  bpm: number,
  zoneConfig: ZoneConfig,
): ZoneClassification {
  if (zoneConfig.method === 'karvonen') {
    const zone1Min = zoneConfig.bounds[1].minBpm;
    if (bpm < zone1Min) {
      return 0;
    }
  }

  for (const zone of [1, 2, 3, 4] as const) {
    const { minBpm, maxBpm } = zoneConfig.bounds[zone];
    if (bpm >= minBpm && bpm < maxBpm) {
      return zone;
    }
  }

  const zone5 = zoneConfig.bounds[5];
  if (bpm >= zone5.minBpm) {
    return 5;
  }

  if (zoneConfig.method === 'manual' && bpm < zoneConfig.bounds[1].maxBpm) {
    return 1;
  }

  return 0;
}

export function isAboveZone5Target(
  bpm: number,
  zoneConfig: ZoneConfig,
): boolean {
  return bpm > zoneConfig.bounds[5].maxBpm;
}

export const ZONE_LABELS: Record<HeartRateZone, string> = {
  1: 'Recovery',
  2: 'Aerobic base',
  3: 'Aerobic',
  4: 'Threshold',
  5: 'Max',
};

export const ZONE_COLORS: Record<HeartRateZone, string> = {
  1: '#2f5f8f',
  2: '#2f8f5a',
  3: '#8f8a2f',
  4: '#8f5a2f',
  5: '#c41e3a',
};
