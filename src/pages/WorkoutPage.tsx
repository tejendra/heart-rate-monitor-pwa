import { Link } from 'react-router-dom';
import { ZONE_LABELS } from '../analytics/zones';
import type { HeartRateZone } from '../types';
import { useHeartRateMonitor } from '../context/HeartRateContext';
import { useWorkoutSession } from '../context/WorkoutContext';
import { formatElapsed } from '../workout/sessionManager';

function formatBpm(bpm?: number) {
  return bpm !== undefined ? String(bpm) : '--';
}

function formatZone(zone: HeartRateZone | 'below' | null) {
  if (zone === null) {
    return '--';
  }

  if (zone === 'below') {
    return 'Below zone 1';
  }

  return `Zone ${zone} · ${ZONE_LABELS[zone]}`;
}

function zoneClassName(zone: HeartRateZone | 'below' | null) {
  if (zone === null) {
    return '';
  }

  return zone === 'below' ? 'zone-pill zone-pill--below' : `zone-pill zone-pill--${zone}`;
}

export function WorkoutPage() {
  const { status, isConnected } = useHeartRateMonitor();
  const {
    elapsedMs,
    currentZone,
    isRecording,
    isCompleted,
    session,
    startWorkout,
    stopWorkout,
    resetWorkout,
  } = useWorkoutSession();

  const latestBpm = status.latestSample?.bpm;
  const contactDetected = status.latestSample?.contactDetected;

  async function handleStart() {
    await startWorkout(status.deviceName);
  }

  function handleStop() {
    if (isRecording && elapsedMs < 30_000) {
      const shouldStop = window.confirm(
        'This workout is under 30 seconds. Stop anyway?',
      );
      if (!shouldStop) {
        return;
      }
    }

    stopWorkout();
  }

  return (
    <section className="page">
      <h2>Live Workout</h2>
      <p className="page-description">
        Record heart rate samples while you train. Zones use your Karvonen
        settings.
      </p>

      {!isConnected && (
        <div className="banner banner--warning" role="status">
          Connect a heart rate monitor on the Home screen before starting a
          workout.
          <Link to="/" className="inline-link">
            Go to Connect
          </Link>
        </div>
      )}

      <div className="card card--centered">
        <p className="bpm-placeholder">{formatBpm(latestBpm)}</p>
        <p className="bpm-label">BPM</p>
        {contactDetected === false && (
          <p className="hint hint--warning">Sensor contact not detected</p>
        )}

        <p className="metric-row">
          <span>Elapsed</span>
          <strong>{formatElapsed(elapsedMs)}</strong>
        </p>

        <div className="metric-row metric-row--zone">
          <span>Zone</span>
          <strong className={zoneClassName(currentZone)}>
            {formatZone(currentZone)}
          </strong>
        </div>

        {isRecording ? (
          <button
            type="button"
            className="button button--primary"
            onClick={handleStop}
          >
            Stop Workout
          </button>
        ) : (
          <button
            type="button"
            className="button button--primary"
            onClick={() => void handleStart()}
            disabled={!isConnected || isCompleted}
          >
            Start Workout
          </button>
        )}

        {isCompleted && session && (
          <div className="workout-complete">
            <p className="workout-complete__title">Workout recorded</p>
            <p className="hint">
              {session.samples.length} samples over {formatElapsed(elapsedMs)}.
              Report generation arrives in Phase 4.
            </p>
            <button
              type="button"
              className="button button--secondary"
              onClick={resetWorkout}
            >
              Record Another
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
