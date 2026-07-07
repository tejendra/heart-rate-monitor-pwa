import type { WeightUnit } from '../types';

const LB_PER_KG = 2.2046226218;

export function toKg(weight: number, unit: WeightUnit): number {
  return unit === 'lb' ? weight / LB_PER_KG : weight;
}

export function fromKg(weightKg: number, unit: WeightUnit): number {
  const converted = unit === 'lb' ? weightKg * LB_PER_KG : weightKg;
  return unit === 'lb' ? Math.round(converted) : Math.round(converted * 10) / 10;
}

export function formatWeight(weight: number, unit: WeightUnit): string {
  return unit === 'lb' ? `${Math.round(weight)} lb` : `${weight} kg`;
}

export function getWeightKg(
  weight: number | undefined,
  unit: WeightUnit,
): number | undefined {
  if (weight === undefined) {
    return undefined;
  }

  return toKg(weight, unit);
}
