import { useCallback, useEffect, useState } from 'react';
import { WorkoutList } from '../components/WorkoutList';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components/PageState';
import { getAllWorkouts } from '../storage/workoutStore';
import type { WorkoutReport } from '../types';

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

  return (
    <section className="page" aria-label="History">
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
        <WorkoutList workouts={workouts} ariaLabel="Saved workouts" />
      )}
    </section>
  );
}
