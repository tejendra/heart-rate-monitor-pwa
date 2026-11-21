import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { heartRateService } from '../ble/heartRateClient';
import type { HeartRateConnectionStatus } from '../ble/heartRateService';
import { isMockHeartRateEnabled } from '../ble/mockHeartRate';
import {
  getBluetoothAvailability,
  getBluetoothSupportStatus,
  type BluetoothSupportStatus,
} from '../ble/support';

interface HeartRateContextValue {
  support: BluetoothSupportStatus;
  bluetoothAvailable: boolean | null;
  status: HeartRateConnectionStatus;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  isConnected: boolean;
}

const HeartRateContext = createContext<HeartRateContextValue | null>(null);

export function HeartRateProvider({ children }: { children: ReactNode }) {
  const [support] = useState((): BluetoothSupportStatus => {
    if (isMockHeartRateEnabled()) {
      return {
        supported: true,
        reason: 'supported',
        message:
          'Mock heart rate monitor is enabled (VITE_MOCK_HEART_RATE). No Bluetooth device is required.',
      };
    }
    return getBluetoothSupportStatus();
  });
  const [bluetoothAvailable, setBluetoothAvailable] = useState<boolean | null>(
    null,
  );
  const [status, setStatus] = useState<HeartRateConnectionStatus>(() =>
    heartRateService.getStatus(),
  );

  useEffect(() => {
    return heartRateService.subscribe(setStatus);
  }, []);

  useEffect(() => {
    if (!support.supported) {
      return;
    }

    void getBluetoothAvailability().then(setBluetoothAvailable);
  }, [support.supported]);

  const connect = useCallback(async () => {
    await heartRateService.connect();
  }, []);

  const disconnect = useCallback(async () => {
    await heartRateService.disconnect();
  }, []);

  const value = useMemo(
    () => ({
      support,
      bluetoothAvailable,
      status,
      connect,
      disconnect,
      isConnecting: status.state === 'connecting',
      isConnected: status.state === 'connected',
    }),
    [support, bluetoothAvailable, status, connect, disconnect],
  );

  return (
    <HeartRateContext.Provider value={value}>{children}</HeartRateContext.Provider>
  );
}

export function useHeartRateMonitor() {
  const context = useContext(HeartRateContext);
  if (!context) {
    throw new Error('useHeartRateMonitor must be used within HeartRateProvider');
  }
  return context;
}
