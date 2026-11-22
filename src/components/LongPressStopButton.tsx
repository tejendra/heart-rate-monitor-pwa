import { LongPressButton } from './LongPressButton';

type LongPressStopButtonProps = {
  onStop: () => void;
};

export function LongPressStopButton({ onStop }: LongPressStopButtonProps) {
  return (
    <div className="workout-stop-controls">
      <LongPressButton
        onComplete={onStop}
        label="Stop"
        ariaLabel="Long hold for 5 seconds to stop workout recording"
        className="button button--primary button--hold"
        holdDurationMs={5000}
      />
    </div>
  );
}