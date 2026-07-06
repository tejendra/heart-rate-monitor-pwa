import { Link } from 'react-router-dom';
import { BluetoothUnsupportedBanner } from '../components/BluetoothUnsupportedBanner';
import { useHeartRateMonitor } from '../context/HeartRateContext';

function formatBpm(bpm?: number) {
  return bpm !== undefined ? String(bpm) : '--';
}

export function HomePage() {
  const {
    support,
    status,
    connect,
    disconnect,
    isConnecting,
    isConnected,
  } = useHeartRateMonitor();

  const latestBpm = status.latestSample?.bpm;
  const contactDetected = status.latestSample?.contactDetected;

  async function handleConnect() {
    try {
      await connect();
    } catch {
      // Error state is handled by the service subscription.
    }
  }

  async function handleDisconnect() {
    await disconnect();
  }

  function connectionLabel() {
    switch (status.state) {
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return `Connected to ${status.deviceName ?? 'heart rate monitor'}`;
      case 'error':
        return 'Connection error';
      default:
        return 'Not connected';
    }
  }

  return (
    <section className="page">
      <h2>Connect</h2>
      <p className="page-description">
        Pair a Bluetooth heart rate monitor and start recording workouts in your
        browser.
        <a href='https://ultimately-hoping-reaches-composition.trycloudflare.com/'>Test on a phone</a>
      </p>

      <BluetoothUnsupportedBanner />

      <div className="card">
        <p className="status-label">Connection status</p>
        <p
          className={`status-value ${status.state === 'connected' ? 'status-value--connected' : ''
            }`}
        >
          {connectionLabel()}
        </p>

        {isConnected && (
          <div className="live-bpm">
            <p className="live-bpm__value">{formatBpm(latestBpm)}</p>
            <p className="live-bpm__label">Live BPM</p>
            {contactDetected === false && (
              <p className="hint hint--warning">
                Sensor contact not detected. Adjust your strap.
              </p>
            )}
          </div>
        )}

        {status.error && <p className="hint hint--error">{status.error}</p>}

        {isConnected ? (
          <button
            type="button"
            className="button button--secondary"
            onClick={() => void handleDisconnect()}
          >
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            className="button button--primary"
            onClick={() => void handleConnect()}
            disabled={!support.supported || isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect Heart Rate Monitor'}
          </button>
        )}
      </div>

      <div className="quick-links">
        <Link
          to="/workout"
          className={`button button--secondary ${!isConnected ? 'button--disabled' : ''
            }`}
          aria-disabled={!isConnected}
          onClick={(event) => {
            if (!isConnected) {
              event.preventDefault();
            }
          }}
        >
          Go to Workout
        </Link>
        <Link to="/history" className="button button--secondary">
          View History
        </Link>
      </div>
    </section>
  );
}
