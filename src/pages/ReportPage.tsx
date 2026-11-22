import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/PageState';
import { LongPressButton } from '../components/LongPressButton';
import { ReportSummary } from '../components/ReportSummary';
import { formatWorkoutDate } from '../components/WorkoutList';
import { useWorkoutSession } from '../context/WorkoutContext';
import { downloadWorkoutReport } from '../export/jsonExporter';
import { deleteWorkout, getWorkout, saveWorkout } from '../storage/workoutStore';
import type { WorkoutReport } from '../types';

export function ReportPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { lastReport } = useWorkoutSession();
  const [report, setReport] = useState<WorkoutReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  async function handleActivityReportChange(next: WorkoutReport) {
    setReport(next);
    setSaveError(null);

    try {
      await saveWorkout(next);
    } catch {
      setSaveError('Unable to save activity details. Try again.');
    }
  }

  async function handleDelete() {
    if (!report) {
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
      {loading ? (
        <LoadingState message="Loading report..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => navigate('/history')} />
      ) : report ? (
        <>
          <ReportSummary
            report={report}
            onActivityReportChange={(next) =>
              void handleActivityReportChange(next)
            }
            activitySaveError={saveError}
          />
          <div className="quick-links">
            <LongPressButton
              className="button button--secondary button--hold"
              label="Delete Workout"
              ariaLabel="Long hold for 3 seconds to delete this workout report"
              holdDurationMs={3000}
              onComplete={() => void handleDelete()}
            />
            <button
              type="button"
              className="button button--primary"
              aria-label="Export workout report as JSON"
              onClick={() => downloadWorkoutReport(report)}
            >
              Export JSON
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
