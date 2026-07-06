import { Link } from 'react-router-dom';

export function ReportPage() {
  return (
    <section className="page">
      <h2>Workout Report</h2>
      <p className="page-description">
        Summary stats, zone breakdown, and HRV will display after a completed
        workout.
      </p>

      <div className="card">
        <p className="empty-state">No report selected.</p>
        <p className="hint">
          Complete a workout to generate duration, average/max heart rate,
          calories, zone time, and HRV.
        </p>
      </div>

      <Link to="/history" className="button button--secondary">
        Back to History
      </Link>
    </section>
  );
}
