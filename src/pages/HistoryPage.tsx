import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

  const loadWorkouts = useCallback(async () => {
    setLoading(true);
    const savedWorkouts = await getAllWorkouts();
    setWorkouts(savedWorkouts);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadWorkouts();
  }, [loadWorkouts]);

  async function handleDelete(id: string) {
    const shouldDelete = window.confirm('Delete this workout report?');
    if (!shouldDelete) {
      return;
    }

    await deleteWorkout(id);
    await loadWorkouts();
  }

  return (
    <section className="page">
      <h2>History</h2>
      <p className="page-description">
        Saved workouts are stored on this device using IndexedDB.
      </p>

      {loading ? (
        <div className="card">
          <p className="empty-state">Loading workouts...</p>
        </div>
      ) : workouts.length === 0 ? (
        <div className="card">
          <p className="empty-state">No saved workouts yet.</p>
          <p className="hint">
            Workout reports will appear here after you complete and save a
            session.
          </p>
        </div>
      ) : (
        <ul className="history-list">
          {workouts.map((workout) => (
            <li key={workout.id} className="history-item card">
              <Link to={`/report/${workout.id}`} className="history-item__link">
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
