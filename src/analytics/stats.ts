import type {
  HeartRateSample,
  HeartRateZone,
  WorkoutSession,
  ZoneConfig,
  ZoneSeriesPoint,
} from '../types';
import { classifyBpm } from './zones';

const EMPTY_ZONE_TIME: Record<HeartRateZone, number> = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
};

export function calculateDurationSec(session: WorkoutSession): number {
  const endedAt = session.endedAt ?? session.startedAt;
  return Math.max(0, Math.round((endedAt - session.startedAt) / 1000));
}

export function calculateHeartRateStats(samples: HeartRateSample[]): {
  avgHeartRate: number;
  maxHeartRate: number;
} {
  if (samples.length === 0) {
    return { avgHeartRate: 0, maxHeartRate: 0 };
  }

  const total = samples.reduce((sum, sample) => sum + sample.bpm, 0);
  const maxHeartRate = samples.reduce(
    (max, sample) => Math.max(max, sample.bpm),
    samples[0].bpm,
  );

  return {
    avgHeartRate: Math.round(total / samples.length),
    maxHeartRate,
  };
}

export function aggregateZoneTime(
  samples: HeartRateSample[],
  zoneConfig: ZoneConfig,
  endedAt: number,
): Record<HeartRateZone, number> {
  if (samples.length === 0) {
    return { ...EMPTY_ZONE_TIME };
  }

  const zoneTimeSec = { ...EMPTY_ZONE_TIME };

  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index];
    const nextTimestamp =
      index < samples.length - 1
        ? samples[index + 1].timestamp
        : endedAt;
    const deltaSec = Math.max(0, (nextTimestamp - sample.timestamp) / 1000);
    const zone = classifyBpm(sample.bpm, zoneConfig);

    if (zone !== 'below') {
      zoneTimeSec[zone] += deltaSec;
    }
  }

  return zoneTimeSec;
}

export function buildZoneSeries(
  samples: HeartRateSample[],
  zoneConfig: ZoneConfig,
  bucketMs = 5000,
): ZoneSeriesPoint[] {
  if (samples.length === 0) {
    return [];
  }

  const series: ZoneSeriesPoint[] = [];
  let bucketStart = samples[0].timestamp;
  let bucketSample = samples[0];

  const pushBucket = (sample: HeartRateSample) => {
    const zone = classifyBpm(sample.bpm, zoneConfig);
    if (zone === 'below') {
      return;
    }

    series.push({
      timestamp: new Date(sample.timestamp).toISOString(),
      bpm: sample.bpm,
      zone,
    });
  };

  for (let index = 1; index < samples.length; index += 1) {
    const sample = samples[index];

    if (sample.timestamp - bucketStart >= bucketMs) {
      pushBucket(bucketSample);
      bucketStart = sample.timestamp;
      bucketSample = sample;
    } else {
      bucketSample = sample;
    }
  }

  pushBucket(bucketSample);
  return series;
}

export interface HeartRateSeriesPoint {
  timestamp: string;
  bpm: number;
}

export function buildHeartRateSeries(
  samples: HeartRateSample[],
  bucketMs = 5000,
): HeartRateSeriesPoint[] {
  if (samples.length === 0) {
    return [];
  }

  const series: HeartRateSeriesPoint[] = [];
  let bucketStart = samples[0].timestamp;
  let bucketSample = samples[0];

  const pushBucket = (sample: HeartRateSample) => {
    series.push({
      timestamp: new Date(sample.timestamp).toISOString(),
      bpm: sample.bpm,
    });
  };

  for (let index = 1; index < samples.length; index += 1) {
    const sample = samples[index];

    if (sample.timestamp - bucketStart >= bucketMs) {
      pushBucket(bucketSample);
      bucketStart = sample.timestamp;
      bucketSample = sample;
    } else {
      bucketSample = sample;
    }
  }

  pushBucket(bucketSample);
  return series;
}

export function createEmptyZoneTime(): Record<HeartRateZone, number> {
  return { ...EMPTY_ZONE_TIME };
}
