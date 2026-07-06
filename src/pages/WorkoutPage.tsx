export function WorkoutPage() {
  return (
    <section className="page">
      <h2>Live Workout</h2>
      <p className="page-description">
        Real-time heart rate, zone, and elapsed time will appear here during an
        active session.
      </p>

      <div className="card card--centered">
        <p className="bpm-placeholder">--</p>
        <p className="bpm-label">BPM</p>
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
      </div>
    </section>
  );
}
