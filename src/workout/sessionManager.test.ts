import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildZoneConfig } from '../analytics/zones';
import { DEFAULT_USER_SETTINGS } from '../types';
import { WorkoutSessionManager, formatElapsed } from './sessionManager';

describe('WorkoutSessionManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-06T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('records samples with timestamps during a workout', () => {
    const manager = new WorkoutSessionManager();
    const zoneConfig = buildZoneConfig(DEFAULT_USER_SETTINGS);

    manager.start('Polar H10', zoneConfig);
    manager.addSample({ timestamp: 1_000, bpm: 120 });
    manager.addSample({ timestamp: 2_000, bpm: 145 });

    vi.advanceTimersByTime(5_000);

    const session = manager.stop();

    expect(session.deviceName).toBe('Polar H10');
    expect(session.samples).toHaveLength(2);
    expect(session.samples[0]).toEqual({ timestamp: 1_000, bpm: 120 });
    expect(session.endedAt).toBe(Date.now());
    expect(manager.getSnapshot().recordingState).toBe('completed');
  });

  it('tracks elapsed time while recording', () => {
    const manager = new WorkoutSessionManager();
    const zoneConfig = buildZoneConfig(DEFAULT_USER_SETTINGS);

    manager.start(undefined, zoneConfig);
    vi.advanceTimersByTime(65_000);

    expect(manager.getSnapshot().elapsedMs).toBe(65_000);
  });

  it('ignores samples when not recording', () => {
    const manager = new WorkoutSessionManager();

    manager.addSample({ timestamp: 1_000, bpm: 120 });

    expect(manager.getSnapshot().session).toBeNull();
  });
});

describe('formatElapsed', () => {
  it('formats minutes and seconds', () => {
    expect(formatElapsed(65_000)).toBe('01:05');
  });

  it('formats hours when needed', () => {
    expect(formatElapsed(3_661_000)).toBe('1:01:01');
  });
});
