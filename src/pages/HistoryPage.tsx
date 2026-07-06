import { Link } from 'react-router-dom';

export function HistoryPage() {
  return (
    <section className="page">
      <h2>History</h2>
      <p className="page-description">
        Saved workouts are stored on this device using IndexedDB.
      </p>

      <div className="card">
        <p className="empty-state">No saved workouts yet.</p>
        <p className="hint">
          Workout reports will appear here after you complete and save a session.
        </p>
      </div>

      <Link to="/" className="button button--secondary">
        Start a Workout
      </Link>
    </section>
  );
}
