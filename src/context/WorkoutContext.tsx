import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { buildZoneConfig } from '../analytics/zones';
import { heartRateService } from '../ble/heartRateService';
import { getUserSettings } from '../storage/workoutStore';
import type { WorkoutSession } from '../types';
import {
  workoutSessionManager,
  type WorkoutSessionSnapshot,
} from '../workout/sessionManager';

interface WorkoutContextValue extends WorkoutSessionSnapshot {
  startWorkout: (deviceName?: string) => Promise<void>;
  stopWorkout: () => WorkoutSession;
  resetWorkout: () => void;
  isRecording: boolean;
  isCompleted: boolean;
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<WorkoutSessionSnapshot>(() =>
    workoutSessionManager.getSnapshot(),
  );

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
    workoutSessionManager.start(deviceName, zoneConfig);
  }, []);

  const stopWorkout = useCallback(() => {
    return workoutSessionManager.stop();
  }, []);

  const resetWorkout = useCallback(() => {
    workoutSessionManager.reset();
  }, []);

  const value = useMemo(
    () => ({
      ...snapshot,
      startWorkout,
      stopWorkout,
      resetWorkout,
      isRecording: snapshot.recordingState === 'recording',
      isCompleted: snapshot.recordingState === 'completed',
    }),
    [snapshot, startWorkout, stopWorkout, resetWorkout],
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
