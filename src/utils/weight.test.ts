import { describe, expect, it } from 'vitest';
import { fromKg, getWeightKg, toKg } from './weight';

describe('weight utils', () => {
  it('converts between kg and lb', () => {
    expect(toKg(154, 'lb')).toBeCloseTo(69.85, 1);
    expect(fromKg(70, 'lb')).toBe(154);
    expect(getWeightKg(70, 'kg')).toBe(70);
  });
});
