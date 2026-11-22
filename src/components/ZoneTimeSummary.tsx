import { ZONE_LABELS } from '../analytics/zones';
import type { HeartRateZone, WorkoutReport } from '../types';

const ZONES: HeartRateZone[] = [1, 2, 3, 4, 5];

function formatZoneTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

type ZoneTimeSummaryProps = {
  report: WorkoutReport;
  titleId?: string;
};

export function ZoneTimeSummary({
  report,
  titleId = 'zone-time-summary-title',
}: ZoneTimeSummaryProps) {
  const zoneSummary = ZONES.map(
    (zone) => `${ZONE_LABELS[zone]}: ${formatZoneTime(report.zoneTimeSec[zone])}`,
  ).join(', ');

  return (
    <div
      className="zone-time-summary"
      role="img"
      aria-labelledby={titleId}
      aria-label={`Zone time breakdown. ${zoneSummary}`}
    >
      <p id={titleId} className="zone-time-summary__heading">
        Time in zones
      </p>

      <ul className="zone-time-legend">
        {ZONES.map((zone) => (
          <li key={zone} className="zone-time-legend__item">
            <span className={`zone-pill zone-pill--${zone}`}>Z{zone}</span>
            <span className="zone-time-legend__time">
              {formatZoneTime(report.zoneTimeSec[zone])}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}