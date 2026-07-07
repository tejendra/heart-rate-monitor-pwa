import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildZoneConfig,
  recommendMaxHeartRateFromAge,
  ZONE_LABELS,
} from '../analytics/zones';
import {
  clearAllData,
  getUserSettings,
  saveUserSettings,
} from '../storage/workoutStore';
import { ErrorState, LoadingState } from '../components/PageState';
import { FieldTooltip } from '../components/FieldTooltip';
import {
  DEFAULT_USER_SETTINGS,
  type HeartRateZone,
  type UserSettings,
  type WeightUnit,
} from '../types';
import { fromKg, toKg } from '../utils/weight';

const ZONES: HeartRateZone[] = [1, 2, 3, 4, 5];
const SAVE_DEBOUNCE_MS = 400;

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

function canSaveSettings(settings: UserSettings): boolean {
  return (
    Number.isFinite(settings.restingHeartRate) &&
    settings.restingHeartRate >= 30 &&
    settings.restingHeartRate <= 120 &&
    Number.isFinite(settings.maxHeartRate) &&
    settings.maxHeartRate >= 100 &&
    settings.maxHeartRate <= 220
  );
}

export function SettingsPage() {
  const [form, setForm] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const skipNextSave = useRef(true);

  useEffect(() => {
    void getUserSettings()
      .then((settings) => {
        setForm(settings);
        setIsHydrated(true);
      })
      .catch(() => {
        setLoadError('Unable to load settings from this device.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    if (!canSaveSettings(form)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveUserSettings(form)
        .then(() => {
          setError(null);
        })
        .catch(() => {
          setError('Unable to save settings. Please try again.');
        });
    }, SAVE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [form, isHydrated]);

  const zoneConfig = useMemo(() => buildZoneConfig(form), [form]);
  const recommendedMaxHeartRate =
    form.age !== undefined ? recommendMaxHeartRateFromAge(form.age) : null;
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

  async function handleClearAllData() {
    const shouldClear = window.confirm(
      'Delete all saved workouts and reset settings on this device?',
    );
    if (!shouldClear) {
      return;
    }

    await clearAllData();
    skipNextSave.current = true;
    setForm(DEFAULT_USER_SETTINGS);
    setError(null);
  }

  if (loading) {
    return (
      <section className="page" aria-label="Settings">
        <LoadingState message="Loading settings..." />
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="page" aria-label="Settings">
        <ErrorState
          message={loadError}
          onRetry={() => window.location.reload()}
        />
      </section>
    );
  }

  return (
    <section className="page" aria-label="Settings">
      <p className="page-description">
        Personalize Karvonen heart rate zones and calorie estimates.
      </p>

      <div className="card form">
        <label className="form-field">
          <span className="form-field__label">
            Resting heart rate (bpm)
            <FieldTooltip label="How to measure resting heart rate">
              Connect your monitor, start a workout, and sit quietly for 5
              minutes. Stop the session and use the average heart rate from the
              report. Repeat on several mornings and enter your typical
              reading.
            </FieldTooltip>
          </span>
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
          <span className="form-field__label">
            Age (optional)
            <FieldTooltip label="What age is used for">
              Shows a Gellish max heart rate recommendation below and enables a more accurate calorie estimate on workout reports.
            </FieldTooltip>
          </span>
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
          <span className="form-field__label">
            Max heart rate (bpm)
            <FieldTooltip label="How max heart rate is used">
              Used for Karvonen zones and calorie estimates. The Gellish formula
              (207 − 0.7 × age) is a common age-based estimate—update this field
              to that value if you want to use it.
            </FieldTooltip>
          </span>
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
          {recommendedMaxHeartRate !== null && (
            <span className="hint">
              Recommended for your age (Gellish): {recommendedMaxHeartRate} bpm
            </span>
          )}
        </label>

        <div className="form-field">
          <span className="form-field__label">
            {weightBounds.label}
            <FieldTooltip label="What weight is used for">
              Calories on workout reports are estimated from your
              session duration and average heart rate:
              <br />
              <br />
              <strong>Weight + age:</strong> Keytel formula using heart rate,
              weight, age, and time.
              <br />
              <br />
              <strong>Weight only:</strong> MET estimate from workout intensity,
              scaled by your weight.
              <br />
              <br />
              <strong>Neither set:</strong> same MET method, assuming 70 kg or
              154 lbs.
            </FieldTooltip>
          </span>
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

        {error && (
          <p className="hint hint--error" role="alert">
            {error}
          </p>
        )}
      </div>

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
