import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ZONE_LABELS } from '../analytics/zones';
import { BluetoothUnsupportedBanner } from '../components/BluetoothUnsupportedBanner';
import { ConnectionIndicator } from '../components/ConnectionIndicator';
import { LongPressStopButton } from '../components/LongPressStopButton';
import { PwaInstallPrompt } from '../components/PwaInstallPrompt';
import { WorkoutList } from '../components/WorkoutList';
import { useHeartRateMonitor } from '../context/HeartRateContext';
import { useWorkoutSession } from '../context/WorkoutContext';
import { useWakeLock } from '../hooks/useWakeLock';
import { getRecentWorkouts } from '../storage/workoutStore';
import type { HeartRateZone, WorkoutReport } from '../types';
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

export function HomePage() {
  const navigate = useNavigate();
  const {
    support,
    status,
    connect,
    disconnect,
    isConnecting,
    isConnected,
  } = useHeartRateMonitor();
  const {
    elapsedMs,
    currentZone,
    isRecording,
    isCompleted,
    startWorkout,
    stopWorkout,
    resetWorkout,
  } = useWorkoutSession();

  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutReport[]>([]);

  useWakeLock(isRecording);

  const latestBpm = status.latestSample?.bpm;
  const contactDetected = status.latestSample?.contactDetected;
  const disconnectedDuringWorkout =
    isRecording && !isConnected && Boolean(status.error);

  const showWorkoutCard = isConnected || isRecording;

  useEffect(() => {
    if (isCompleted) {
      resetWorkout();
    }
  }, [isCompleted, resetWorkout]);

  useEffect(() => {
    void getRecentWorkouts(3).then(setRecentWorkouts).catch(() => {
      setRecentWorkouts([]);
    });
  }, []);

  async function handleConnect() {
    try {
      await connect();
    } catch {
      // Error state is handled by the service subscription.
    }
  }

  async function handleDisconnect() {
    await disconnect();
  }

  async function handleStart() {
    await startWorkout(status.deviceName);
  }

  async function handleStop() {
    if (isRecording && elapsedMs < 30_000) {
      const shouldStop = window.confirm(
        'This workout is under 30 seconds. Stop anyway?',
      );
      if (!shouldStop) {
        return;
      }
    }

    const { report } = await stopWorkout();
    resetWorkout();
    navigate(`/report/${report.id}`);
  }

  function connectionLabel() {
    switch (status.state) {
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return `Connected to ${status.deviceName ?? 'heart rate monitor'}`;
      case 'error':
        return 'Connection error';
      default:
        return 'Not connected';
    }
  }

  return (
    <section className="page" aria-label="Workout">
      {isConnected && (
        <div className="page-toolbar">
          <ConnectionIndicator
            deviceName={status.deviceName}
            onDisconnect={() => void handleDisconnect()}
          />
        </div>
      )}
      {!isConnected && (
        <p className="page-description">
          Pair a Bluetooth heart rate monitor and record workouts with live BPM
          and Karvonen heart rate zones.
        </p>
      )}

      <PwaInstallPrompt />
      <BluetoothUnsupportedBanner />

      {disconnectedDuringWorkout && (
        <div className="banner banner--warning" role="alert">
          <p className="banner__title">Heart rate monitor disconnected</p>
          <p className="banner__text">
            {status.error} Samples recorded so far are kept until you stop the
            workout.
          </p>
        </div>
      )}

      {!isConnected && (
        <div className="card">
          <p className="status-label" id="connection-status-label">
            Connection status
          </p>
          <p
            className={`status-value ${
              status.state === 'connected' ? 'status-value--connected' : ''
            }`}
            role="status"
            aria-live="polite"
            aria-labelledby="connection-status-label"
          >
            {connectionLabel()}
          </p>

          {status.error && (
            <p className="hint hint--error" role="alert">
              {status.error}
            </p>
          )}

          <button
            type="button"
            className="button button--primary"
            aria-label="Connect heart rate monitor"
            aria-busy={isConnecting}
            onClick={() => void handleConnect()}
            disabled={!support.supported || isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect Heart Rate Monitor'}
          </button>
        </div>
      )}

      {showWorkoutCard && (
        <div className="card card--centered">
          <div
            className="live-bpm-display"
            aria-live="polite"
            aria-label={`Current heart rate ${formatBpm(latestBpm)} beats per minute`}
          >
            <p className="bpm-placeholder">{formatBpm(latestBpm)}</p>
            <p className="bpm-label">BPM</p>
          </div>
          {contactDetected === false && (
            <p className="hint hint--warning" role="status">
              Sensor contact not detected. Adjust your strap.
            </p>
          )}

          <p className="metric-row">
            <span>Elapsed</span>
            <strong aria-live="polite">{formatElapsed(elapsedMs)}</strong>
          </p>

          <div className="metric-row metric-row--zone">
            <span>Zone</span>
            <strong className={zoneClassName(currentZone)} aria-live="polite">
              {formatZone(currentZone)}
            </strong>
          </div>

          {isRecording ? (
            <LongPressStopButton onStop={() => void handleStop()} />
          ) : (
            <button
              type="button"
              className="button button--start"
              aria-label="Start workout recording"
              onClick={() => void handleStart()}
              disabled={!isConnected}
            >
              Start Workout
            </button>
          )}
        </div>
      )}

      {recentWorkouts.length > 0 && (
        <section aria-labelledby="recent-workouts-title">
          <h3 id="recent-workouts-title" className="section-title">
            Recent workouts
          </h3>
          <WorkoutList workouts={recentWorkouts} ariaLabel="Recent workouts" />
        </section>
      )}
    </section>
  );
}
