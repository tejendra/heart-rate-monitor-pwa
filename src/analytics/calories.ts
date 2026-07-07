import type { UserSettings, ZoneConfig } from '../types';
import { getWeightKg } from '../utils/weight';
import { resolveMaxHeartRate } from './zones';

interface CalorieEstimateInput {
  durationSec: number;
  avgHeartRate: number;
  settings: UserSettings;
  zoneConfig: ZoneConfig;
}

export function estimateCalories({
  durationSec,
  avgHeartRate,
  settings,
  zoneConfig,
}: CalorieEstimateInput): number {
  if (durationSec <= 0 || avgHeartRate <= 0) {
    return 0;
  }

  const durationMin = durationSec / 60;
  const maxHeartRate = resolveMaxHeartRate(settings);
  const restingHeartRate = zoneConfig.restingHeartRate;
  const weightKg = getWeightKg(settings.weight, settings.weightUnit);

  if (weightKg !== undefined && settings.age !== undefined) {
    const kilojoules =
      durationMin *
      (0.6309 * avgHeartRate + 0.1988 * weightKg + 0.2017 * settings.age);
    return Math.round(kilojoules / 4.184);
  }

  const fallbackWeightKg = weightKg ?? 70;
  const reserve = Math.max(maxHeartRate - restingHeartRate, 1);
  const intensity = Math.min(
    Math.max((avgHeartRate - restingHeartRate) / reserve, 0),
    1,
  );
  const met = 1 + intensity * 8;
  const hours = durationSec / 3600;

  return Math.round(met * fallbackWeightKg * hours);
}
