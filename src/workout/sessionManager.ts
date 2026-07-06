import type { HeartRateSample, WorkoutSession, ZoneConfig } from '../types';
import { classifyBpm, type ZoneClassification } from '../analytics/zones';

export type WorkoutRecordingState = 'idle' | 'recording' | 'completed';

export interface WorkoutSessionSnapshot {
  recordingState: WorkoutRecordingState;
  session: WorkoutSession | null;
  elapsedMs: number;
  currentZone: ZoneClassification | null;
  zoneConfig: ZoneConfig | null;
}

type SessionListener = (snapshot: WorkoutSessionSnapshot) => void;

function createSessionId(): string {
  return crypto.randomUUID();
}

export class WorkoutSessionManager {
  private session: WorkoutSession | null = null;
  private recordingState: WorkoutRecordingState = 'idle';
  private zoneConfig: ZoneConfig | null = null;
  private listeners = new Set<SessionListener>();
  private timerId: ReturnType<typeof setInterval> | null = null;

  subscribe(listener: SessionListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): WorkoutSessionSnapshot {
    return {
      recordingState: this.recordingState,
      session: this.session,
      elapsedMs: this.getElapsedMs(),
      currentZone: this.getCurrentZone(),
      zoneConfig: this.zoneConfig,
    };
  }

  start(deviceName: string | undefined, zoneConfig: ZoneConfig): WorkoutSession {
    if (this.recordingState === 'recording') {
      throw new Error('A workout is already in progress.');
    }

    this.zoneConfig = zoneConfig;
    this.session = {
      id: createSessionId(),
      startedAt: Date.now(),
      deviceName,
      samples: [],
    };
    this.recordingState = 'recording';
    this.startTimer();
    this.emit();
    return this.session;
  }

  addSample(sample: HeartRateSample): void {
    if (this.recordingState !== 'recording' || !this.session) {
      return;
    }

    this.session.samples.push(sample);
    this.emit();
  }

  stop(): WorkoutSession {
    if (this.recordingState !== 'recording' || !this.session) {
      throw new Error('No workout is currently in progress.');
    }

    this.session.endedAt = Date.now();
    this.recordingState = 'completed';
    this.stopTimer();
    this.emit();
    return this.session;
  }

  reset(): void {
    this.stopTimer();
    this.session = null;
    this.recordingState = 'idle';
    this.zoneConfig = null;
    this.emit();
  }

  private getElapsedMs(): number {
    if (!this.session) {
      return 0;
    }

    const end = this.session.endedAt ?? Date.now();
    return Math.max(0, end - this.session.startedAt);
  }

  private getCurrentZone(): ZoneClassification | null {
    if (!this.session || !this.zoneConfig || this.session.samples.length === 0) {
      return null;
    }

    const latestSample = this.session.samples.at(-1);
    if (!latestSample) {
      return null;
    }

    return classifyBpm(latestSample.bpm, this.zoneConfig);
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerId = setInterval(() => {
      if (this.recordingState === 'recording') {
        this.emit();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private emit(): void {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

export const workoutSessionManager = new WorkoutSessionManager();

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
