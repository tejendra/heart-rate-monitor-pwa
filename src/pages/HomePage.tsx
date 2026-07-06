import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <section className="page">
      <h2>Connect</h2>
      <p className="page-description">
        Pair a Bluetooth heart rate monitor and start recording workouts in your
        browser.
      </p>

      <div className="card">
        <p className="status-label">Connection status</p>
        <p className="status-value">Not connected</p>
        <button type="button" className="button button--primary" disabled>
          Connect Heart Rate Monitor
        </button>
        <p className="hint">BLE connection will be enabled in Phase 2.</p>
      </div>

      <div className="quick-links">
        <Link to="/workout" className="button button--secondary">
          Go to Workout
        </Link>
        <Link to="/history" className="button button--secondary">
          View History
        </Link>
      </div>
    </section>
  );
}
