import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/PageState';
import { ReportSummary } from '../components/ReportSummary';
import { formatWorkoutDate } from '../components/WorkoutList';
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      setLoading(true);
      setError(null);

      try {
        if (id) {
          const saved = await getWorkout(id);
          if (!cancelled) {
            setReport(saved ?? null);
            if (!saved) {
              setError('Workout report not found. It may have been deleted.');
            }
          }
        } else if (lastReport) {
          setReport(lastReport);
        } else {
          setReport(null);
        }
      } catch {
        if (!cancelled) {
          setReport(null);
          setError('Unable to load this workout report.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
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
    <section className="page" aria-labelledby="report-title">
      <h2 id="report-title">
        {report ? formatWorkoutDate(report.startedAt) : 'Workout Report'}
      </h2>
      <p className="page-description">
        Summary stats, zone breakdown, and HRV from your completed workout.
      </p>

      {loading ? (
        <LoadingState message="Loading report..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => navigate('/history')} />
      ) : report ? (
        <>
          <ReportSummary report={report} />
          <div className="quick-links">
            <button
              type="button"
              className="button button--secondary"
              aria-label="Export workout report as JSON"
              onClick={() => downloadWorkoutReport(report)}
            >
              Export JSON
            </button>
            <button
              type="button"
              className="button button--primary"
              aria-label="Delete workout report"
              onClick={() => void handleDelete()}
            >
              Delete Workout
            </button>
          </div>
        </>
      ) : (
        <EmptyState
          title="No report selected."
          description="Complete a workout to generate duration, average/max heart rate, calories, zone time, and HRV."
        />
      )}
    </section>
  );
}
