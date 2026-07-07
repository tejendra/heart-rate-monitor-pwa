import { ZONE_LABELS } from '../analytics/zones';
import type { HeartRateZone, WorkoutReport } from '../types';

const ZONES: HeartRateZone[] = [1, 2, 3, 4, 5];

function formatZoneTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

export function ZoneTimeChart({ report }: { report: WorkoutReport }) {
  const zoneSummary = ZONES.map(
    (zone) => `${ZONE_LABELS[zone]}: ${formatZoneTime(report.zoneTimeSec[zone])}`,
  ).join(', ');

  return (
    <div className="chart-card">
      <h3 id="zone-time-chart-title">Time in zones</h3>
      <div
        className="zone-preview"
        role="img"
        aria-labelledby="zone-time-chart-title"
        aria-label={`Zone time breakdown. ${zoneSummary}`}
      >
        {ZONES.map((zone) => (
          <div key={zone} className="zone-preview__row">
            <span className={`zone-pill zone-pill--${zone}`}>Zone {zone}</span>
            <span>{ZONE_LABELS[zone]}</span>
            <strong>{formatZoneTime(report.zoneTimeSec[zone])}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
