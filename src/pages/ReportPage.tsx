import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ReportSummary } from '../components/ReportSummary';
import { useWorkoutSession } from '../context/WorkoutContext';
import { downloadWorkoutReport } from '../export/jsonExporter';
import { deleteWorkout, getWorkout } from '../storage/workoutStore';
import type { WorkoutReport } from '../types';

export function ReportPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { lastReport } = useWorkoutSession();
  const [report, setReport] = useState<WorkoutReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      setLoading(true);

      if (id) {
        const saved = await getWorkout(id);
        if (!cancelled) {
          setReport(saved ?? null);
        }
      } else if (lastReport) {
        setReport(lastReport);
      } else {
        setReport(null);
      }

      if (!cancelled) {
        setLoading(false);
      }
    }

    void loadReport();

    return () => {
      cancelled = true;
    };
  }, [id, lastReport]);

  async function handleDelete() {
    if (!report) {
      return;
    }

    const shouldDelete = window.confirm('Delete this workout report?');
    if (!shouldDelete) {
      return;
    }

    await deleteWorkout(report.id);
    navigate('/history');
  }

  return (
    <section className="page">
      <h2>Workout Report</h2>
      <p className="page-description">
        Summary stats, zone breakdown, and HRV from your completed workout.
      </p>

      {loading ? (
        <div className="card">
          <p className="empty-state">Loading report...</p>
        </div>
      ) : report ? (
        <>
          <ReportSummary report={report} />
          <div className="quick-links">
            <button
              type="button"
              className="button button--primary"
              onClick={() => downloadWorkoutReport(report)}
            >
              Export JSON
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => void handleDelete()}
            >
              Delete Workout
            </button>
          </div>
        </>
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
