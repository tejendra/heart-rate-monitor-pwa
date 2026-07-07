import { Link } from 'react-router-dom';
import { formatElapsed } from '../workout/sessionManager';
import type { WorkoutReport } from '../types';

export function formatWorkoutDate(startedAt: string): string {
  return new Date(startedAt).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

type WorkoutListProps = {
  workouts: WorkoutReport[];
  ariaLabel: string;
};

export function WorkoutList({ workouts, ariaLabel }: WorkoutListProps) {
  return (
    <ul className="history-list" aria-label={ariaLabel}>
      {workouts.map((workout) => (
        <li key={workout.id} className="history-item">
          <Link
            to={`/report/${workout.id}`}
            className="history-item__link"
            aria-label={`View workout from ${formatWorkoutDate(workout.startedAt)}`}
          >
            <span className="history-item__date">
              {formatWorkoutDate(workout.startedAt)}
            </span>
            <span className="history-item__stats">
              {formatElapsed(workout.durationSec * 1000)} · avg{' '}
              {workout.avgHeartRate} bpm · max {workout.maxHeartRate} bpm
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
