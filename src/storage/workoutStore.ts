import type { UserSettings, WorkoutReport, ZoneConfig } from '../types';
import {
  haveReportZonesChanged,
  refreshReportZones,
} from '../analytics/buildReport';
import { getDb, getDefaultSettings, SETTINGS_KEY, STORES } from './db';

type StoredUserSettings = UserSettings & { weightKg?: number };

function userSettingsFromZoneConfig(zoneConfig: ZoneConfig): UserSettings {
  const settings: UserSettings = {
    maxHeartRate: zoneConfig.maxHeartRate,
    restingHeartRate: zoneConfig.restingHeartRate,
    weightUnit: 'kg',
    zoneMethod: zoneConfig.method,
    weight: null,
    age: null,
  };

  if (zoneConfig.method === 'manual') {
    settings.manualZoneBounds = [
      zoneConfig.bounds[1].maxBpm,
      zoneConfig.bounds[2].maxBpm,
      zoneConfig.bounds[3].maxBpm,
      zoneConfig.bounds[4].maxBpm,
    ];
  }

  return settings;
}

export function getReportUserSettings(report: WorkoutReport): UserSettings {
  if (report.userSettings) {
    return normalizeUserSettings(report.userSettings);
  }

  return userSettingsFromZoneConfig(report.zoneConfig);
}

export function normalizeUserSettings(
  settings: StoredUserSettings,
): UserSettings {
  const weightUnit = settings.weightUnit ?? 'kg';
  const weight = settings.weight ?? settings.weightKg;

  return {
    maxHeartRate: settings.maxHeartRate,
    restingHeartRate: settings.restingHeartRate,
    weight,
    weightUnit,
    age: settings.age,
    sex: settings.sex,
    zoneMethod: settings.zoneMethod,
    manualZoneBounds: settings.manualZoneBounds,
  };
}

export async function saveWorkout(report: WorkoutReport): Promise<void> {
  const db = await getDb();
  await db.put(STORES.workouts, report);
}

export async function getWorkout(id: string): Promise<WorkoutReport | undefined> {
  const db = await getDb();
  const report = await db.get(STORES.workouts, id);
  if (!report) {
    return undefined;
  }

  const refreshed = refreshReportZones(report);
  if (haveReportZonesChanged(report, refreshed)) {
    await saveWorkout(refreshed);
  }

  return refreshed;
}

export async function getAllWorkouts(): Promise<WorkoutReport[]> {
  const db = await getDb();
  const workouts = await db.getAllFromIndex(STORES.workouts, 'by-startedAt');
  return workouts.reverse();
}

export async function getRecentWorkouts(limit: number): Promise<WorkoutReport[]> {
  const workouts = await getAllWorkouts();
  return workouts.slice(0, limit);
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
  return settings ? normalizeUserSettings(settings) : getDefaultSettings();
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
