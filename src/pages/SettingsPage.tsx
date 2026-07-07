import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  buildZoneConfig,
  resolveMaxHeartRate,
  ZONE_LABELS,
} from '../analytics/zones';
import {
  clearAllData,
  getUserSettings,
  saveUserSettings,
} from '../storage/workoutStore';
import {
  DEFAULT_USER_SETTINGS,
  type HeartRateZone,
  type UserSettings,
  type WeightUnit,
} from '../types';
import { fromKg, toKg } from '../utils/weight';

const ZONES: HeartRateZone[] = [1, 2, 3, 4, 5];

function parseOptionalNumber(value: string): number | undefined {
  if (value.trim() === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getWeightInputBounds(unit: WeightUnit) {
  return unit === 'lb'
    ? { min: 66, max: 551, step: 1, label: 'Weight (lb, optional)' }
    : { min: 30, max: 250, step: 0.1, label: 'Weight (kg, optional)' };
}

export function SettingsPage() {
  const [form, setForm] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    void getUserSettings().then((settings) => {
      setForm(settings);
      setLoading(false);
    });
  }, []);

  const zoneConfig = useMemo(() => buildZoneConfig(form), [form]);
  const effectiveMaxHeartRate = resolveMaxHeartRate(form);
  const weightBounds = getWeightInputBounds(form.weightUnit);

  function handleWeightUnitChange(nextUnit: WeightUnit) {
    setForm((current) => {
      if (current.weightUnit === nextUnit) {
        return current;
      }

      if (current.weight === undefined) {
        return { ...current, weightUnit: nextUnit };
      }

      const weightKg = toKg(current.weight, current.weightUnit);
      return {
        ...current,
        weightUnit: nextUnit,
        weight: fromKg(weightKg, nextUnit),
      };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveUserSettings(form);
    setSavedMessage('Settings saved.');
  }

  async function handleClearAllData() {
    const shouldClear = window.confirm(
      'Delete all saved workouts and reset settings on this device?',
    );
    if (!shouldClear) {
      return;
    }

    await clearAllData();
    setForm(DEFAULT_USER_SETTINGS);
    setSavedMessage('All local data cleared.');
  }

  if (loading) {
    return (
      <section className="page">
        <h2>Settings</h2>
        <div className="card">
          <p className="empty-state">Loading settings...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <h2>Settings</h2>
      <p className="page-description">
        Personalize Karvonen heart rate zones and calorie estimates.
      </p>

      <form className="card form" onSubmit={(event) => void handleSubmit(event)}>
        <label className="form-field">
          <span>Resting heart rate (bpm)</span>
          <input
            type="number"
            min={30}
            max={120}
            required
            value={form.restingHeartRate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                restingHeartRate: Number(event.target.value),
              }))
            }
          />
        </label>

        <label className="form-field">
          <span>Age (optional)</span>
          <input
            type="number"
            min={10}
            max={100}
            value={form.age ?? ''}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                age: parseOptionalNumber(event.target.value),
              }))
            }
          />
        </label>

        <label className="form-field">
          <span>Max heart rate override (bpm)</span>
          <input
            type="number"
            min={100}
            max={220}
            value={form.maxHeartRate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                maxHeartRate: Number(event.target.value),
              }))
            }
          />
          <span className="hint">
            Used when age is not set. Effective max HR: {effectiveMaxHeartRate}{' '}
            bpm
          </span>
        </label>

        <div className="form-field">
          <span>{weightBounds.label}</span>
          <div className="unit-toggle" role="group" aria-label="Weight unit">
            <button
              type="button"
              className={
                form.weightUnit === 'kg'
                  ? 'unit-toggle__button unit-toggle__button--active'
                  : 'unit-toggle__button'
              }
              onClick={() => handleWeightUnitChange('kg')}
            >
              kg
            </button>
            <button
              type="button"
              className={
                form.weightUnit === 'lb'
                  ? 'unit-toggle__button unit-toggle__button--active'
                  : 'unit-toggle__button'
              }
              onClick={() => handleWeightUnitChange('lb')}
            >
              lb
            </button>
          </div>
          <input
            type="number"
            min={weightBounds.min}
            max={weightBounds.max}
            step={weightBounds.step}
            value={form.weight ?? ''}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                weight: parseOptionalNumber(event.target.value),
              }))
            }
          />
        </div>

        <div className="form-section">
          <h3>Karvonen zone preview</h3>
          <p className="hint">
            HRR = {zoneConfig.hrr} bpm ({zoneConfig.maxHeartRate} max −{' '}
            {zoneConfig.restingHeartRate} resting)
          </p>
          <div className="zone-preview">
            {ZONES.map((zone) => (
              <div key={zone} className="zone-preview__row">
                <span className={`zone-pill zone-pill--${zone}`}>Zone {zone}</span>
                <span>{ZONE_LABELS[zone]}</span>
                <strong>
                  {zoneConfig.bounds[zone].minBpm}–{zoneConfig.bounds[zone].maxBpm}{' '}
                  bpm
                </strong>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="button button--primary">
          Save Settings
        </button>
        {savedMessage && <p className="hint hint--success">{savedMessage}</p>}
      </form>

      <div className="card">
        <h3>Data</h3>
        <p className="hint">
          Workouts and settings are stored locally in your browser.
        </p>
        <button
          type="button"
          className="button button--secondary"
          onClick={() => void handleClearAllData()}
        >
          Clear All Data
        </button>
      </div>
    </section>
  );
}
