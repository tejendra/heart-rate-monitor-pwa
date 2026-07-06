import type { HeartRateSample, HrvSummary } from '../types';

const MIN_RR_MS = 300;
const MAX_RR_MS = 2000;
const MAX_RR_DEVIATION = 0.25;

export function extractRRIntervals(samples: HeartRateSample[]): number[] {
  return samples.flatMap((sample) => sample.rrIntervalsMs ?? []);
}

export function filterRRArtifacts(intervals: number[]): number[] {
  const filtered: number[] = [];

  for (const interval of intervals) {
    if (interval < MIN_RR_MS || interval > MAX_RR_MS) {
      continue;
    }

    const previous = filtered.at(-1);
    if (
      previous !== undefined &&
      Math.abs(interval - previous) / previous > MAX_RR_DEVIATION
    ) {
      continue;
    }

    filtered.push(interval);
  }

  return filtered;
}

export function computeRmssd(intervals: number[]): number {
  if (intervals.length < 2) {
    return 0;
  }

  let sumSquares = 0;
  for (let index = 1; index < intervals.length; index += 1) {
    const diff = intervals[index] - intervals[index - 1];
    sumSquares += diff * diff;
  }

  return Math.round(Math.sqrt(sumSquares / (intervals.length - 1)));
}

export function computeSdnn(intervals: number[]): number {
  if (intervals.length < 2) {
    return 0;
  }

  const mean =
    intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  const variance =
    intervals.reduce((sum, interval) => sum + (interval - mean) ** 2, 0) /
    intervals.length;

  return Math.round(Math.sqrt(variance));
}

export function computeHrvFromSamples(samples: HeartRateSample[]): HrvSummary {
  const intervals = filterRRArtifacts(extractRRIntervals(samples));

  if (intervals.length < 2) {
    return {
      rmssd: 0,
      sdnn: 0,
      sampleCount: intervals.length,
    };
  }

  return {
    rmssd: computeRmssd(intervals),
    sdnn: computeSdnn(intervals),
    sampleCount: intervals.length,
  };
}

export function isHrvAvailable(hrv: HrvSummary): boolean {
  return hrv.sampleCount >= 2;
}
