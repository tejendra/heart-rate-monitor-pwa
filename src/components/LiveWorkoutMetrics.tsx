import {
  ZONE_LABELS,
  type ZoneClassification,
} from '../analytics/zones';
import { formatElapsed } from '../workout/sessionManager';

function formatBpm(bpm?: number) {
  return bpm !== undefined ? String(bpm) : '--';
}

function formatZone(zone: ZoneClassification | null) {
  if (zone === null) {
    return '--';
  }

  if (zone === 0) {
    return 'Zone 0';
  }

  return `Zone ${zone} · ${ZONE_LABELS[zone]}`;
}

function zoneClassName(zone: ZoneClassification | null) {
  if (zone === null) {
    return '';
  }

  return `zone-pill zone-pill--${zone}`;
}

export type LiveWorkoutMetricsProps = {
  latestBpm?: number;
  contactDetected?: boolean;
  elapsedMs: number;
  currentZone: ZoneClassification | null;
  aboveZone5Target: boolean;
  bpmSize?: 'default' | 'large';
  showBpm?: boolean;
  showSessionDetails?: boolean;
  showContactHint?: boolean;
  showZone5Hint?: boolean;
  sessionDetailLayout?: 'default' | 'above-bpm';
};

export function LiveWorkoutMetrics({
  latestBpm,
  contactDetected,
  elapsedMs,
  currentZone,
  aboveZone5Target,
  bpmSize = 'default',
  showBpm = true,
  showSessionDetails = true,
  showContactHint = true,
  showZone5Hint = true,
  sessionDetailLayout = 'default',
}: LiveWorkoutMetricsProps) {
  const compactSessionAboveBpm =
    sessionDetailLayout === 'above-bpm' && showSessionDetails;

  return (
    <>
      {compactSessionAboveBpm && (
        <div
          className="live-workout-session-above-bpm"
          aria-label={`Elapsed ${formatElapsed(elapsedMs)}. ${formatZone(currentZone)}`}
        >
          <span className="live-workout-session-above-bpm__elapsed" aria-live="polite">
            {formatElapsed(elapsedMs)}
          </span>
          <strong
            className={zoneClassName(currentZone)}
            aria-live="polite"
          >
            {formatZone(currentZone)}
          </strong>
        </div>
      )}
      {showBpm && (
        <div
          className={`live-bpm-display ${
            bpmSize === 'large' ? 'live-bpm-display--large' : ''
          }`}
          aria-live="polite"
          aria-label={`Current heart rate ${formatBpm(latestBpm)} beats per minute`}
        >
          <p className="bpm-placeholder">{formatBpm(latestBpm)}</p>
          <p className="bpm-label">BPM</p>
        </div>
      )}
      {showContactHint && contactDetected === false && (
        <p className="hint hint--warning" role="status">
          Sensor contact not detected. Adjust your strap.
        </p>
      )}

      {showSessionDetails && sessionDetailLayout === 'default' && (
        <>
          <p className="metric-row">
            <span>Elapsed</span>
            <strong aria-live="polite">{formatElapsed(elapsedMs)}</strong>
          </p>

          <div className="metric-row metric-row--zone">
            <span>Zone</span>
            <strong className={zoneClassName(currentZone)} aria-live="polite">
              {formatZone(currentZone)}
            </strong>
          </div>

          {showZone5Hint && aboveZone5Target && (
            <p className="hint hint--warning" role="status">
              Heart rate is above your zone 5 target — consider slowing down.
            </p>
          )}
        </>
      )}
    </>
  );
}