import type { UserSettings, WorkoutReport } from '../types';
import { getDb, getDefaultSettings, SETTINGS_KEY, STORES } from './db';

export async function saveWorkout(report: WorkoutReport): Promise<void> {
  const db = await getDb();
  await db.put(STORES.workouts, report);
}

export async function getWorkout(id: string): Promise<WorkoutReport | undefined> {
  const db = await getDb();
  return db.get(STORES.workouts, id);
}

export async function getAllWorkouts(): Promise<WorkoutReport[]> {
  const db = await getDb();
  const workouts = await db.getAllFromIndex(STORES.workouts, 'by-startedAt');
  return workouts.reverse();
}

export async function deleteWorkout(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORES.workouts, id);
}

export async function clearAllWorkouts(): Promise<void> {
  const db = await getDb();
  await db.clear(STORES.workouts);
}

export async function getUserSettings(): Promise<UserSettings> {
  const db = await getDb();
  const settings = await db.get(STORES.settings, SETTINGS_KEY);
  return settings ?? getDefaultSettings();
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  const db = await getDb();
  await db.put(STORES.settings, settings, SETTINGS_KEY);
}

export async function clearAllData(): Promise<void> {
  const db = await getDb();
  await db.clear(STORES.workouts);
  await db.clear(STORES.settings);
}
