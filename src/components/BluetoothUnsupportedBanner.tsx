import { useHeartRateMonitor } from '../context/HeartRateContext';

export function BluetoothUnsupportedBanner() {
  const { support, bluetoothAvailable } = useHeartRateMonitor();

  if (support.supported && bluetoothAvailable !== false) {
    return null;
  }

  const title =
    support.reason === 'ios-unsupported'
      ? 'iPhone and iPad not supported for Bluetooth'
      : 'Bluetooth connection unavailable';

  const message =
    bluetoothAvailable === false
      ? 'Bluetooth is turned off or unavailable on this device.'
      : support.message;

  return (
    <div className="banner banner--warning" role="status" aria-live="polite">
      <p className="banner__title">{title}</p>
      <p className="banner__text">{message}</p>
    </div>
  );
}
