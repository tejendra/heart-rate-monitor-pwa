import { useHeartRateMonitor } from '../context/HeartRateContext';

export function BluetoothUnsupportedBanner() {
  const { support, bluetoothAvailable } = useHeartRateMonitor();

  if (support.supported && bluetoothAvailable !== false) {
    return null;
  }

  const message =
    bluetoothAvailable === false
      ? 'Bluetooth is turned off or unavailable on this device.'
      : support.message;

  return (
    <div className="banner banner--warning" role="status">
      {message}
    </div>
  );
}
