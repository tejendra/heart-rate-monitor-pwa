import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { buildWorkoutReport } from '../analytics/buildReport';
import { buildZoneConfig } from '../analytics/zones';
import { heartRateService } from '../ble/heartRateService';
import { getUserSettings, saveWorkout } from '../storage/workoutStore';
import type { WorkoutReport, WorkoutSession } from '../types';
import {
  workoutSessionManager,
  type WorkoutSessionSnapshot,
} from '../workout/sessionManager';

interface StopWorkoutResult {
  session: WorkoutSession;
  report: WorkoutReport;
}

interface WorkoutContextValue extends WorkoutSessionSnapshot {
  lastReport: WorkoutReport | null;
  startWorkout: (deviceName?: string) => Promise<void>;
  stopWorkout: () => Promise<StopWorkoutResult>;
  resetWorkout: () => void;
  isRecording: boolean;
  isCompleted: boolean;
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<WorkoutSessionSnapshot>(() =>
    workoutSessionManager.getSnapshot(),
  );
  const [lastReport, setLastReport] = useState<WorkoutReport | null>(null);

  useEffect(() => {
    return workoutSessionManager.subscribe(setSnapshot);
  }, []);

  useEffect(() => {
    return heartRateService.onSample((sample) => {
      workoutSessionManager.addSample(sample);
    });
  }, []);

  const startWorkout = useCallback(async (deviceName?: string) => {
    const settings = await getUserSettings();
    const zoneConfig = buildZoneConfig(settings);
    setLastReport(null);
    workoutSessionManager.start(deviceName, zoneConfig);
  }, []);

  const stopWorkout = useCallback(async () => {
    const zoneConfig = workoutSessionManager.getSnapshot().zoneConfig;
    if (!zoneConfig) {
      throw new Error('Workout zone configuration is missing.');
    }

    const session = workoutSessionManager.stop();
    const settings = await getUserSettings();
    const report = buildWorkoutReport(session, zoneConfig, settings);
    await saveWorkout(report);
    setLastReport(report);

    return { session, report };
  }, []);

  const resetWorkout = useCallback(() => {
    workoutSessionManager.reset();
  }, []);

  const value = useMemo(
    () => ({
      ...snapshot,
      lastReport,
      startWorkout,
      stopWorkout,
      resetWorkout,
      isRecording: snapshot.recordingState === 'recording',
      isCompleted: snapshot.recordingState === 'completed',
    }),
    [snapshot, lastReport, startWorkout, stopWorkout, resetWorkout],
  );

  return (
    <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>
  );
}

export function useWorkoutSession() {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkoutSession must be used within WorkoutProvider');
  }
  return context;
}
