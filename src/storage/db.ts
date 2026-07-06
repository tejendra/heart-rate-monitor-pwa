import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { UserSettings, WorkoutReport } from '../types';
import { DEFAULT_USER_SETTINGS } from '../types';

export const DB_NAME = 'heart-rate-monitor';
export const DB_VERSION = 1;

export const STORES = {
  workouts: 'workouts',
  settings: 'settings',
} as const;

export const SETTINGS_KEY = 'user';

interface HeartRateMonitorDB extends DBSchema {
  workouts: {
    key: string;
    value: WorkoutReport;
    indexes: {
      'by-startedAt': string;
    };
  };
  settings: {
    key: string;
    value: UserSettings;
  };
}

let dbPromise: Promise<IDBPDatabase<HeartRateMonitorDB>> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<HeartRateMonitorDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORES.workouts)) {
          const workoutStore = db.createObjectStore(STORES.workouts, {
            keyPath: 'id',
          });
          workoutStore.createIndex('by-startedAt', 'startedAt');
        }

        if (!db.objectStoreNames.contains(STORES.settings)) {
          db.createObjectStore(STORES.settings);
        }
      },
    });
  }

  return dbPromise;
}

export async function getDefaultSettings(): Promise<UserSettings> {
  return { ...DEFAULT_USER_SETTINGS };
}
