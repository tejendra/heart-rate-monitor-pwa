import type { HeartRateSample } from '../types';
import {
  BATTERY_LEVEL_UUID,
  BATTERY_SERVICE_UUID,
  DEVICE_INFORMATION_SERVICE_UUID,
  HEART_RATE_MEASUREMENT_UUID,
  HEART_RATE_SERVICE_UUID,
} from './constants';
import {
  formatMonitorDisplayName,
  readMonitorDeviceDetails,
} from './monitorDeviceDetails';
import { parseBatteryLevel } from './parseBatteryLevel';
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
  batteryLevelPercent?: number;
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

    this.updateStatus({
      state: 'connecting',
      error: undefined,
      batteryLevelPercent: undefined,
      latestSample: undefined,
    });

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [HEART_RATE_SERVICE_UUID] }],
        optionalServices: [
          HEART_RATE_SERVICE_UUID,
          BATTERY_SERVICE_UUID,
          DEVICE_INFORMATION_SERVICE_UUID,
        ],
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

      await Promise.all([
        this.setupBatteryLevel(server),
        this.setupDeviceIdentity(server),
      ]);

      this.updateStatus({
        state: 'connected',
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
        batteryLevelPercent: undefined,
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
      batteryLevelPercent: undefined,
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
        batteryLevelPercent: undefined,
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

  private async setupBatteryLevel(server: BluetoothRemoteGATTServer) {
    try {
      const service = await server.getPrimaryService(BATTERY_SERVICE_UUID);
      const characteristic = await service.getCharacteristic(BATTERY_LEVEL_UUID);
      const value = await characteristic.readValue();
      const percent = parseBatteryLevel(value);
      this.updateStatus({ batteryLevelPercent: percent });
    } catch {
      // Many heart rate monitors do not expose the Battery Service.
    }
  }

  private async setupDeviceIdentity(server: BluetoothRemoteGATTServer) {
    const details = await readMonitorDeviceDetails(server);
    const displayName = formatMonitorDisplayName(this.status.deviceName, details);
    this.updateStatus({ deviceName: displayName });
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

  private notifySample(sample: HeartRateSample) {
    for (const listener of this.sampleListeners) {
      listener(sample);
    }
  }
}

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
