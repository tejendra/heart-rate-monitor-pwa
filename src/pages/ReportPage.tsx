import { Link } from 'react-router-dom';
import { isHrvAvailable } from '../analytics/hrv';
import { formatElapsed } from '../workout/sessionManager';
import { HeartRateChart } from '../components/HeartRateChart';
import { ZoneTimeChart } from '../components/ZoneTimeChart';
import { useWorkoutSession } from '../context/WorkoutContext';
import type { WorkoutReport } from '../types';

function formatCalories(calories: number): string {
  return `${calories} kcal (estimate)`;
}

function ReportSummary({ report }: { report: WorkoutReport }) {
  const hrvAvailable = isHrvAvailable(report.hrv);

  return (
    <>
      <div className="summary-grid">
        <article className="summary-card">
          <p className="summary-card__label">Exercise time</p>
          <p className="summary-card__value">
            {formatElapsed(report.durationSec * 1000)}
          </p>
        </article>
        <article className="summary-card">
          <p className="summary-card__label">Avg heart rate</p>
          <p className="summary-card__value">{report.avgHeartRate} bpm</p>
        </article>
        <article className="summary-card">
          <p className="summary-card__label">Max heart rate</p>
          <p className="summary-card__value">{report.maxHeartRate} bpm</p>
        </article>
        <article className="summary-card">
          <p className="summary-card__label">Calories burned</p>
          <p className="summary-card__value">
            {formatCalories(report.caloriesBurned)}
          </p>
        </article>
      </div>

      <div className="card">
        <h3>Heart rate variability</h3>
        {hrvAvailable ? (
          <dl className="settings-list">
            <div className="settings-row">
              <dt>RMSSD</dt>
              <dd>{report.hrv.rmssd} ms</dd>
            </div>
            <div className="settings-row">
              <dt>SDNN</dt>
              <dd>{report.hrv.sdnn} ms</dd>
            </div>
            <div className="settings-row">
              <dt>RR intervals used</dt>
              <dd>{report.hrv.sampleCount}</dd>
            </div>
          </dl>
        ) : (
          <p className="hint">
            HRV unavailable — device did not provide RR data.
          </p>
        )}
      </div>

      <ZoneTimeChart report={report} />
      <HeartRateChart report={report} />
    </>
  );
}

export function ReportPage() {
  const { lastReport } = useWorkoutSession();

  return (
    <section className="page">
      <h2>Workout Report</h2>
      <p className="page-description">
        Summary stats, zone breakdown, and HRV from your completed workout.
      </p>

      {lastReport ? (
        <ReportSummary report={lastReport} />
      ) : (
        <div className="card">
          <p className="empty-state">No report selected.</p>
          <p className="hint">
            Complete a workout to generate duration, average/max heart rate,
            calories, zone time, and HRV.
          </p>
        </div>
      )}

      <div className="quick-links">
        <Link to="/workout" className="button button--secondary">
          New Workout
        </Link>
        <Link to="/history" className="button button--secondary">
          View History
        </Link>
      </div>
    </section>
  );
}
