import { useEffect, useState } from 'react';
import { getUserSettings } from '../storage/workoutStore';
import type { UserSettings } from '../types';

export function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    void getUserSettings().then(setSettings);
  }, []);

  return (
    <section className="page">
      <h2>Settings</h2>
      <p className="page-description">
        Personalize Karvonen heart rate zones and calorie estimates.
      </p>

      <div className="card">
        {settings ? (
          <dl className="settings-list">
            <div className="settings-row">
              <dt>Max heart rate</dt>
              <dd>{settings.maxHeartRate} bpm</dd>
            </div>
            <div className="settings-row">
              <dt>Resting heart rate</dt>
              <dd>{settings.restingHeartRate} bpm</dd>
            </div>
            <div className="settings-row">
              <dt>Zone method</dt>
              <dd>{settings.zoneMethod}</dd>
            </div>
            <div className="settings-row">
              <dt>Age</dt>
              <dd>{settings.age ?? 'Not set'}</dd>
            </div>
            <div className="settings-row">
              <dt>Weight</dt>
              <dd>
                {settings.weightKg ? `${settings.weightKg} kg` : 'Not set'}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="empty-state">Loading settings...</p>
        )}
        <p className="hint">
          Editable settings form will be added in a later phase.
        </p>
      </div>
    </section>
  );
}
