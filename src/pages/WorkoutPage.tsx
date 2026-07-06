import { Link } from 'react-router-dom';
import { useHeartRateMonitor } from '../context/HeartRateContext';

function formatBpm(bpm?: number) {
  return bpm !== undefined ? String(bpm) : '--';
}

export function WorkoutPage() {
  const { status, isConnected } = useHeartRateMonitor();
  const latestBpm = status.latestSample?.bpm;
  const contactDetected = status.latestSample?.contactDetected;

  return (
    <section className="page">
      <h2>Live Workout</h2>
      <p className="page-description">
        Real-time heart rate, zone, and elapsed time will appear here during an
        active session.
      </p>

      {!isConnected && (
        <div className="banner banner--warning" role="status">
          Connect a heart rate monitor on the Home screen before starting a
          workout.
          <Link to="/" className="inline-link">
            Go to Connect
          </Link>
        </div>
      )}

      <div className="card card--centered">
        <p className="bpm-placeholder">{formatBpm(latestBpm)}</p>
        <p className="bpm-label">BPM</p>
        {contactDetected === false && (
          <p className="hint hint--warning">Sensor contact not detected</p>
        )}
        <p className="metric-row">
          <span>Elapsed</span>
          <strong>00:00</strong>
        </p>
        <p className="metric-row">
          <span>Zone</span>
          <strong>--</strong>
        </p>
        <button type="button" className="button button--primary" disabled>
          Start Workout
        </button>
        <p className="hint">Workout recording will be enabled in Phase 3.</p>
      </div>
    </section>
  );
}
