import {
  buildZoneConfig,
  type ZoneClassification,
} from '../analytics/zones';
import { DEFAULT_USER_SETTINGS, type HeartRateSample } from '../types';
import { formatMonitorDisplayName } from './monitorDeviceDetails';
import { MOCK_DEVICE_NAME } from './mockHeartRate';
import type { HeartRateConnectionStatus } from './heartRateService';

type StatusListener = (status: HeartRateConnectionStatus) => void;
type SampleListener = (sample: HeartRateSample) => void;

const SAMPLE_INTERVAL_MS = 1_000;
const CONNECT_DELAY_MS = 400;
const MOCK_ZONE_DWELL_MIN_MS = 3_000;
const MOCK_ZONE_DWELL_MAX_MS = 5_000;
const MOCK_ZONE_SEQUENCE: ZoneClassification[] = [0, 1, 2, 3, 4, 5];
const MOCK_BATTERY_LEVEL_PERCENT = 87;

const defaultZoneConfig = buildZoneConfig(DEFAULT_USER_SETTINGS);

function randomZoneDwellMs(): number {
  return (
    MOCK_ZONE_DWELL_MIN_MS +
    Math.random() * (MOCK_ZONE_DWELL_MAX_MS - MOCK_ZONE_DWELL_MIN_MS)
  );
}

function bpmForMockZone(zone: ZoneClassification): number {
  if (zone === 0) {
    return defaultZoneConfig.bounds[1].minBpm - 8;
  }

  const { minBpm, maxBpm } = defaultZoneConfig.bounds[zone];
  return Math.round((minBpm + maxBpm) / 2);
}

function buildMockSample(zone: ZoneClassification): HeartRateSample {
  const now = Date.now();
  const baseBpm = bpmForMockZone(zone);
  const bpm = baseBpm + Math.round((Math.random() - 0.5) * 4);
  const rrMs = Math.round(60_000 / bpm);

  return {
    timestamp: now,
    bpm,
    rrIntervalsMs: [
      rrMs + Math.round((Math.random() - 0.5) * 24),
      rrMs + Math.round((Math.random() - 0.5) * 24),
    ],
    contactDetected: true,
  };
}

export class MockHeartRateService {
  private status: HeartRateConnectionStatus = { state: 'disconnected' };
  private listeners = new Set<StatusListener>();
  private sampleListeners = new Set<SampleListener>();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private mockZoneIndex = 0;
  private mockZoneUntil = 0;

  subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => {
      this.listeners.delete(listener);
    };
  }

  onSample(listener: SampleListener): () => void {
    this.sampleListeners.add(listener);
    return () => {
      this.sampleListeners.delete(listener);
    };
  }

  getStatus(): HeartRateConnectionStatus {
    return this.status;
  }

  async connect(): Promise<void> {
    if (this.status.state === 'connecting' || this.status.state === 'connected') {
      return;
    }

    this.updateStatus({ state: 'connecting', error: undefined });

    await new Promise((resolve) => setTimeout(resolve, CONNECT_DELAY_MS));

    this.resetMockZoneCycle();
    this.startSampling();

    this.updateStatus({
      state: 'connected',
      deviceName: formatMonitorDisplayName(MOCK_DEVICE_NAME, {
        manufacturer: 'Mock BLE',
        model: 'HR Strap (development)',
      }),
      batteryLevelPercent: MOCK_BATTERY_LEVEL_PERCENT,
      error: undefined,
    });
  }

  async disconnect(): Promise<void> {
    this.stopSampling();
    this.updateStatus({
      state: 'disconnected',
      deviceName: undefined,
      latestSample: undefined,
      batteryLevelPercent: undefined,
      error: undefined,
    });
  }

  private startSampling() {
    this.stopSampling();
    this.emitSample();
    this.intervalId = setInterval(() => this.emitSample(), SAMPLE_INTERVAL_MS);
  }

  private stopSampling() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private resetMockZoneCycle() {
    this.mockZoneIndex = 0;
    this.mockZoneUntil = Date.now() + randomZoneDwellMs();
  }

  private currentMockZone(): ZoneClassification {
    const now = Date.now();
    if (now >= this.mockZoneUntil) {
      this.mockZoneIndex =
        (this.mockZoneIndex + 1) % MOCK_ZONE_SEQUENCE.length;
      this.mockZoneUntil = now + randomZoneDwellMs();
    }
    return MOCK_ZONE_SEQUENCE[this.mockZoneIndex] ?? 0;
  }

  private emitSample() {
    const sample = buildMockSample(this.currentMockZone());
    for (const listener of this.sampleListeners) {
      listener(sample);
    }
    this.updateStatus({
      state: 'connected',
      deviceName: formatMonitorDisplayName(MOCK_DEVICE_NAME, {
        manufacturer: 'Mock BLE',
        model: 'HR Strap (development)',
      }),
      latestSample: sample,
      error: undefined,
    });
  }

  private updateStatus(patch: Partial<HeartRateConnectionStatus>) {
    this.status = {
      ...this.status,
      ...patch,
    };
    for (const listener of this.listeners) {
      listener(this.status);
    }
  }
}