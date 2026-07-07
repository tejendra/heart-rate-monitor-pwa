import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/PageState';
import { deleteWorkout, getAllWorkouts } from '../storage/workoutStore';
import { formatElapsed } from '../workout/sessionManager';
import type { WorkoutReport } from '../types';

function formatWorkoutDate(startedAt: string): string {
  return new Date(startedAt).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function HistoryPage() {
  const [workouts, setWorkouts] = useState<WorkoutReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkouts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const savedWorkouts = await getAllWorkouts();
      setWorkouts(savedWorkouts);
    } catch {
      setError('Unable to load saved workouts from this device.');
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkouts();
  }, [loadWorkouts]);

  async function handleDelete(id: string) {
    const shouldDelete = window.confirm('Delete this workout report?');
    if (!shouldDelete) {
      return;
    }

    try {
      await deleteWorkout(id);
      await loadWorkouts();
    } catch {
      setError('Unable to delete this workout.');
    }
  }

  return (
    <section className="page" aria-labelledby="history-title">
      <h2 id="history-title">History</h2>
      <p className="page-description">
        Saved workouts are stored on this device using IndexedDB.
      </p>

      {loading ? (
        <LoadingState message="Loading workouts..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void loadWorkouts()} />
      ) : workouts.length === 0 ? (
        <EmptyState
          title="No saved workouts yet."
          description="Workout reports will appear here after you complete and save a session."
        />
      ) : (
        <ul className="history-list" aria-label="Saved workouts">
          {workouts.map((workout) => (
            <li key={workout.id} className="history-item card">
              <Link
                to={`/report/${workout.id}`}
                className="history-item__link"
                aria-label={`View workout from ${formatWorkoutDate(workout.startedAt)}`}
              >
                <p className="history-item__date">
                  {formatWorkoutDate(workout.startedAt)}
                </p>
                <p className="history-item__stats">
                  {formatElapsed(workout.durationSec * 1000)} · avg{' '}
                  {workout.avgHeartRate} bpm · max {workout.maxHeartRate} bpm
                </p>
              </Link>
              <button
                type="button"
                className="button button--secondary button--compact"
                aria-label={`Delete workout from ${formatWorkoutDate(workout.startedAt)}`}
                onClick={() => void handleDelete(workout.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <Link to="/" className="button button--secondary">
        Start a Workout
      </Link>
    </section>
  );
}
