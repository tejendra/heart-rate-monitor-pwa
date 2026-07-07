import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ZONE_LABELS } from '../analytics/zones';
import type { HeartRateZone, WorkoutReport } from '../types';

const ZONE_COLORS: Record<HeartRateZone, string> = {
  1: '#2f5f8f',
  2: '#2f8f5a',
  3: '#8f8a2f',
  4: '#8f5a2f',
  5: '#c41e3a',
};

function formatZoneTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

export function ZoneTimeChart({ report }: { report: WorkoutReport }) {
  const data = (Object.keys(report.zoneTimeSec) as unknown as HeartRateZone[]).map(
    (zone) => ({
      zone: `Z${zone}`,
      label: ZONE_LABELS[zone],
      seconds: Math.round(report.zoneTimeSec[zone]),
      fill: ZONE_COLORS[zone],
    }),
  );

  const chartSummary = data
    .map((entry) => `${entry.label}: ${formatZoneTime(entry.seconds)}`)
    .join(', ');

  return (
    <div className="chart-card">
      <h3 id="zone-time-chart-title">Time in zones</h3>
      <div
        className="chart-container chart-container--bar"
        role="img"
        aria-labelledby="zone-time-chart-title"
        aria-label={`Zone time breakdown. ${chartSummary}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3742" />
            <XAxis
              type="number"
              tickFormatter={(value: number) => formatZoneTime(value)}
              stroke="#9aa7b5"
            />
            <YAxis
              type="category"
              dataKey="zone"
              width={36}
              stroke="#9aa7b5"
            />
            <Tooltip
              formatter={(value) => formatZoneTime(Number(value ?? 0))}
              labelFormatter={(_, payload) => {
                const item = payload?.[0]?.payload as { label?: string } | undefined;
                return item?.label ?? '';
              }}
              contentStyle={{
                background: '#171d24',
                border: '1px solid #2d3742',
                borderRadius: '0.75rem',
              }}
            />
            <Bar dataKey="seconds" radius={[0, 6, 6, 0]}>
              {data.map((entry) => (
                <Cell key={entry.zone} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
