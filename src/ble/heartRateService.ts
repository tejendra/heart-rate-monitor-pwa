import type { HeartRateSample } from '../types';
import {
  HEART_RATE_MEASUREMENT_UUID,
  HEART_RATE_SERVICE_UUID,
} from './constants';
import { toHeartRateSample } from './parseHeartRateMeasurement';

export type HeartRateConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export interface HeartRateConnectionStatus {
  state: HeartRateConnectionState;
  deviceName?: string;
  error?: string;
  latestSample?: HeartRateSample;
}

type StatusListener = (status: HeartRateConnectionStatus) => void;
type SampleListener = (sample: HeartRateSample) => void;

export class HeartRateService {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private status: HeartRateConnectionStatus = { state: 'disconnected' };
  private listeners = new Set<StatusListener>();
  private sampleListeners = new Set<SampleListener>();
  private onCharacteristicValue: ((event: Event) => void) | null = null;
  private onDeviceDisconnect: ((event: Event) => void) | null = null;

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

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [HEART_RATE_SERVICE_UUID] }],
        optionalServices: [HEART_RATE_SERVICE_UUID],
      });

      this.attachDevice(device);
      this.updateStatus({
        state: 'connecting',
        deviceName: device.name ?? 'Heart rate monitor',
        error: undefined,
      });

      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('GATT server unavailable');
      }

      const service = await server.getPrimaryService(HEART_RATE_SERVICE_UUID);
      const characteristic = await service.getCharacteristic(
        HEART_RATE_MEASUREMENT_UUID,
      );

      this.characteristic = characteristic;
      this.onCharacteristicValue = (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        const value = target.value;
        if (!value) {
          return;
        }

        const bytes = value.buffer.slice(
          value.byteOffset,
          value.byteOffset + value.byteLength,
        );
        const sample = toHeartRateSample(bytes);
        this.notifySample(sample);
        this.updateStatus({
          state: 'connected',
          deviceName: this.device?.name ?? 'Heart rate monitor',
          latestSample: sample,
          error: undefined,
        });
      };

      characteristic.addEventListener(
        'characteristicvaluechanged',
        this.onCharacteristicValue,
      );
      await characteristic.startNotifications();

      this.updateStatus({
        state: 'connected',
        deviceName: device.name ?? 'Heart rate monitor',
        error: undefined,
      });
    } catch (error) {
      const message = formatBluetoothError(error);
      const isCancelled = error instanceof DOMException && error.name === 'NotFoundError';

      this.cleanupDeviceReferences();

      this.updateStatus({
        state: isCancelled ? 'disconnected' : 'error',
        deviceName: undefined,
        latestSample: undefined,
        error: isCancelled ? undefined : message,
      });

      if (!isCancelled) {
        throw new Error(message);
      }
    }
  }

  async disconnect(): Promise<void> {
    const device = this.device;
    this.cleanupDeviceReferences();

    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }

    this.updateStatus({
      state: 'disconnected',
      deviceName: undefined,
      latestSample: undefined,
      error: undefined,
    });
  }

  private attachDevice(device: BluetoothDevice) {
    this.device = device;
    this.onDeviceDisconnect = () => {
      this.cleanupDeviceReferences();
      this.updateStatus({
        state: 'disconnected',
        deviceName: undefined,
        latestSample: undefined,
        error: 'Heart rate monitor disconnected',
      });
    };
    device.addEventListener('gattserverdisconnected', this.onDeviceDisconnect);
  }

  private cleanupDeviceReferences() {
    if (this.characteristic && this.onCharacteristicValue) {
      this.characteristic.removeEventListener(
        'characteristicvaluechanged',
        this.onCharacteristicValue,
      );
    }

    if (this.device && this.onDeviceDisconnect) {
      this.device.removeEventListener(
        'gattserverdisconnected',
        this.onDeviceDisconnect,
      );
    }

    this.characteristic = null;
    this.onCharacteristicValue = null;
    this.onDeviceDisconnect = null;
    this.device = null;
  }

  private updateStatus(next: HeartRateConnectionStatus) {
    this.status = next;
    for (const listener of this.listeners) {
      listener(this.status);
    }
  }

  private notifySample(sample: HeartRateSample) {
    for (const listener of this.sampleListeners) {
      listener(sample);
    }
  }
}

export const heartRateService = new HeartRateService();

function formatBluetoothError(error: unknown): string {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotFoundError':
        return 'No heart rate monitor was selected.';
      case 'SecurityError':
        return 'Bluetooth access requires a secure connection (HTTPS).';
      case 'NetworkError':
        return 'Lost connection to the heart rate monitor.';
      case 'NotSupportedError':
        return 'This browser does not support Web Bluetooth.';
      case 'InvalidStateError':
        return 'Bluetooth is already connecting or connected.';
      default:
        return error.message || 'Bluetooth connection failed.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Bluetooth connection failed.';
}
