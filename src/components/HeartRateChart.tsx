import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { WorkoutReport } from '../types';
import { buildHeartRateSeries } from '../analytics/stats';
import { ZONE_COLORS } from '../analytics/zones';

const ZONES = [1, 2, 3, 4, 5] as const;

function formatTimeLabel(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function HeartRateChart({ report }: { report: WorkoutReport }) {
  const data = buildHeartRateSeries(report.samples).map((point) => ({
    ...point,
    label: formatTimeLabel(point.timestamp),
  }));

  if (data.length === 0) {
    return (
      <div className="chart-card">
        <h3 id="heart-rate-chart-title">Heart rate over time</h3>
        <p className="empty-state">Not enough data to chart heart rate.</p>
      </div>
    );
  }

  const chartSummary = `Heart rate ranged from ${Math.min(...data.map((point) => point.bpm))} to ${Math.max(...data.map((point) => point.bpm))} beats per minute across ${data.length} points.`;

  return (
    <div className="chart-card">
      <h3 id="heart-rate-chart-title">Heart rate over time</h3>
      <div
        className="chart-container"
        role="img"
        aria-labelledby="heart-rate-chart-title"
        aria-label={chartSummary}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            {ZONES.map((zone) => {
              const bounds = report.zoneConfig.bounds[zone];
              return (
                <ReferenceArea
                  key={zone}
                  y1={bounds.minBpm}
                  y2={bounds.maxBpm}
                  fill={ZONE_COLORS[zone]}
                  fillOpacity={0.38}
                  strokeOpacity={0}
                />
              );
            })}
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3742" />
            <XAxis
              dataKey="label"
              minTickGap={24}
              stroke="#9aa7b5"
              tick={{ fontSize: 11 }}
            />
            <YAxis
              domain={[
                (dataMin: number) => Math.max(0, dataMin - 10),
                (dataMax: number) => dataMax + 10,
              ]}
              stroke="#9aa7b5"
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              formatter={(value) => [`${Number(value ?? 0)} bpm`, 'Heart rate']}
              labelFormatter={(label) => String(label)}
              contentStyle={{
                background: '#171d24',
                border: '1px solid #2d3742',
                borderRadius: '0.75rem',
              }}
            />
            <Line
              type="monotone"
              dataKey="bpm"
              stroke="#ffffff"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
