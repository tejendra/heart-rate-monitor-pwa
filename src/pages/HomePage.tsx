import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWorkoutZoneTheme, isAboveZone5Target } from '../analytics/zones';
import { BluetoothUnsupportedBanner } from '../components/BluetoothUnsupportedBanner';
import { ConnectionIndicator } from '../components/ConnectionIndicator';
import { LiveWorkoutMetrics } from '../components/LiveWorkoutMetrics';
import { PwaInstallPrompt } from '../components/PwaInstallPrompt';
import { WorkoutList } from '../components/WorkoutList';
import { WorkoutRecordingFullscreen } from '../components/WorkoutRecordingFullscreen';
import { useHeartRateMonitor } from '../context/HeartRateContext';
import { useWorkoutSession } from '../context/WorkoutContext';
import { useWakeLock } from '../hooks/useWakeLock';
import { getRecentWorkouts } from '../storage/workoutStore';
import type { WorkoutReport } from '../types';

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
    zoneConfig,
    isRecording,
    isCompleted,
    startWorkout,
    stopWorkout,
    resetWorkout,
  } = useWorkoutSession();

  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutReport[]>([]);

  useWakeLock(isRecording);

  useEffect(() => {
    if (!isRecording) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousBackground = document.body.style.background;
    document.body.style.overflow = 'hidden';
    document.body.style.background = getWorkoutZoneTheme(currentZone).background;

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.background = previousBackground;
    };
  }, [isRecording, currentZone]);

  const latestBpm = status.latestSample?.bpm;
  const contactDetected = status.latestSample?.contactDetected;
  const aboveZone5Target =
    latestBpm !== undefined &&
    zoneConfig !== null &&
    isAboveZone5Target(latestBpm, zoneConfig);
  const disconnectedDuringWorkout =
    isRecording && !isConnected && Boolean(status.error);

  const showIdleWorkoutCard = isConnected && !isRecording;

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

  const metricsProps = {
    latestBpm,
    contactDetected,
    elapsedMs,
    currentZone,
    aboveZone5Target,
  };

  return (
  <>
      {isRecording && (
        <WorkoutRecordingFullscreen
          {...metricsProps}
          disconnectMessage={
            disconnectedDuringWorkout
              ? `${status.error} Samples recorded so far are kept until you stop the workout.`
              : undefined
          }
          onStop={() => void handleStop()}
        />
      )}

      <section
        className={`page${isRecording ? ' page--workout-recording' : ''}`}
        aria-label="Workout"
        aria-hidden={isRecording}
      >
      {isConnected && !isRecording && (
        <div className="page-toolbar">
          <ConnectionIndicator
            deviceName={status.deviceName}
            batteryLevelPercent={status.batteryLevelPercent}
            onDisconnect={() => void handleDisconnect()}
          />
        </div>
      )}
      <PwaInstallPrompt />
      <BluetoothUnsupportedBanner />

      {!isConnected && (
        <div className="card">
          <p className="page-description card__intro">
            Pair a Bluetooth heart rate monitor and record workouts with live BPM
            and Karvonen heart rate zones.
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

      {showIdleWorkoutCard && (
        <div className="card card--centered">
          <LiveWorkoutMetrics {...metricsProps} showSessionDetails={false} />
          <button
            type="button"
            className="button button--start"
            aria-label="Start workout recording"
            onClick={() => void handleStart()}
            disabled={!isConnected}
          >
            Start Workout
          </button>
        </div>
      )}

      {!isRecording && recentWorkouts.length > 0 && (
        <section aria-labelledby="recent-workouts-title">
          <h3 id="recent-workouts-title" className="section-title">
            Recent workouts
          </h3>
          <WorkoutList workouts={recentWorkouts} ariaLabel="Recent workouts" />
        </section>
      )}
    </section>
  </>
  );
}