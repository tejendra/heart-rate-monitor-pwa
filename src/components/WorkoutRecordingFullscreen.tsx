import { type CSSProperties } from 'react';
import {
  getWorkoutZoneTheme,
  type ZoneClassification,
} from '../analytics/zones';
import { LongPressStopButton } from './LongPressStopButton';
import { LiveWorkoutMetrics, type LiveWorkoutMetricsProps } from './LiveWorkoutMetrics';

type WorkoutRecordingFullscreenProps = LiveWorkoutMetricsProps & {
  disconnectMessage?: string;
  onStop: () => void;
};

export function WorkoutRecordingFullscreen({
  disconnectMessage,
  onStop,
  currentZone,
  ...metrics
}: WorkoutRecordingFullscreenProps) {
  const theme = getWorkoutZoneTheme(currentZone);
  const zoneKey: ZoneClassification | 'idle' = currentZone ?? 'idle';

  return (
    <div
      className="workout-recording-fullscreen"
      data-zone={zoneKey}
      style={
        {
          '--workout-zone-bg': theme.background,
          '--workout-zone-fg': theme.fg,
          '--workout-zone-fg-muted': theme.fgMuted,
          '--workout-zone-gradient-highlight': theme.gradientHighlight,
        } as CSSProperties
      }
      role="dialog"
      aria-modal="true"
      aria-label="Workout in progress"
    >
      <div className="workout-recording-fullscreen__content">
        {disconnectMessage && (
          <div className="banner banner--warning" role="alert">
            <p className="banner__title">Heart rate monitor disconnected</p>
            <p className="banner__text">{disconnectMessage}</p>
          </div>
        )}

        <div className="card card--centered workout-recording-fullscreen__card">
          <LiveWorkoutMetrics
            currentZone={currentZone}
            {...metrics}
            bpmSize="large"
          />
          <LongPressStopButton onStop={onStop} />
        </div>
      </div>
    </div>
  );
}