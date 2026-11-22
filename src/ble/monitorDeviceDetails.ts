import {
  DEVICE_INFORMATION_SERVICE_UUID,
  MANUFACTURER_NAME_UUID,
  MODEL_NUMBER_UUID,
} from './constants';
import { parseBluetoothString } from './parseBluetoothString';

export interface MonitorDeviceDetails {
  manufacturer?: string;
  model?: string;
}

async function readStringCharacteristic(
  service: BluetoothRemoteGATTService,
  characteristicUuid: string,
): Promise<string | undefined> {
  try {
    const characteristic = await service.getCharacteristic(characteristicUuid);
    const value = await characteristic.readValue();
    const text = parseBluetoothString(value);
    return text || undefined;
  } catch {
    return undefined;
  }
}

export function formatMonitorDisplayName(
  fallbackDeviceName: string | undefined,
  details: MonitorDeviceDetails | undefined,
): string {
  const parts = [details?.manufacturer, details?.model].filter(
    (value): value is string => Boolean(value),
  );
  if (parts.length > 0) {
    return parts.join(' ');
  }
  return fallbackDeviceName ?? 'heart rate monitor';
}

export async function readMonitorDeviceDetails(
  server: BluetoothRemoteGATTServer,
): Promise<MonitorDeviceDetails> {
  const details: MonitorDeviceDetails = {};

  try {
    const infoService = await server.getPrimaryService(
      DEVICE_INFORMATION_SERVICE_UUID,
    );

    const [manufacturer, model] = await Promise.all([
      readStringCharacteristic(infoService, MANUFACTURER_NAME_UUID),
      readStringCharacteristic(infoService, MODEL_NUMBER_UUID),
    ]);

    if (manufacturer) {
      details.manufacturer = manufacturer;
    }
    if (model) {
      details.model = model;
    }
  } catch {
    // Device Information Service is common but not guaranteed.
  }

  return details;
}