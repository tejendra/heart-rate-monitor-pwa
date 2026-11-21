import { describe, expect, it } from 'vitest';
import { getWorkoutZoneForeground, relativeLuminance } from './colorContrast';
import { ZONE_COLORS } from '../analytics/zones';

describe('colorContrast', () => {
  it('rates olive zone 3 brighter than zone 1 blue', () => {
    expect(relativeLuminance(ZONE_COLORS[3])).toBeGreaterThan(
      relativeLuminance(ZONE_COLORS[1]),
    );
  });

  it('uses dark text on bright zone backgrounds', () => {
    const theme = getWorkoutZoneForeground(ZONE_COLORS[3]);
    expect(theme.fg).toBe('#0f1419');
  });

  it('uses light text on dark zone backgrounds', () => {
    const theme = getWorkoutZoneForeground(ZONE_COLORS[1]);
    expect(theme.fg).toBe('#ffffff');
  });
});