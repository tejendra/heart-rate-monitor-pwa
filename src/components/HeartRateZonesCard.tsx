import { HeartRateChart } from './HeartRateChart';
import { ZoneTimeSummary } from './ZoneTimeSummary';
import type { WorkoutReport } from '../types';

export function HeartRateZonesCard({ report }: { report: WorkoutReport }) {
  return (
    <div className="chart-card heart-rate-zones-card">
      <h3 id="heart-rate-zones-card-title">Heart rate &amp; zones</h3>
      <HeartRateChart
        report={report}
        embedded
        titleId="heart-rate-zones-card-title"
      />
      <ZoneTimeSummary
        report={report}
        titleId="zone-time-summary-title"
      />
    </div>
  );
}