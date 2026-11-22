import type { UserSettings, ZoneConfig } from '../types';
import { getWeightKg } from '../utils/weight';

interface CalorieEstimateInput {
  durationSec: number;
  avgHeartRate: number;
  settings: UserSettings;
  zoneConfig: ZoneConfig;
}

/** Keytel et al. (2005), without VO2max — energy in kJ per minute. */
const KEYTEL_MALE = {
  intercept: -55.0969,
  hr: 0.6309,
  weight: 0.1988,
  age: 0.2017,
} as const;

const KEYTEL_FEMALE = {
  intercept: -20.4022,
  hr: 0.4472,
  weight: -0.1263,
  age: 0.074,
} as const;

const KJ_PER_KCAL = 4.184;

function keytelKilojoulesPerMinute(
  avgHeartRate: number,
  weightKg: number,
  age: number,
  sex: UserSettings['sex'] = 'male',
): number {
  const coeffs = sex === 'female' ? KEYTEL_FEMALE : KEYTEL_MALE;
  const kjPerMin =
    coeffs.intercept +
    coeffs.hr * avgHeartRate +
    coeffs.weight * weightKg +
    coeffs.age * age;

  return Math.max(kjPerMin, 0);
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
  const maxHeartRate = settings.maxHeartRate;
  const restingHeartRate = zoneConfig.restingHeartRate;
  const weightKg = getWeightKg(settings.weight, settings.weightUnit);

  if (weightKg !== undefined && settings.age != null) {
    const kjPerMin = keytelKilojoulesPerMinute(
      avgHeartRate,
      weightKg,
      settings.age,
      settings.sex ?? 'male',
    );
    const kilojoules = durationMin * kjPerMin;
    return Math.round(kilojoules / KJ_PER_KCAL);
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