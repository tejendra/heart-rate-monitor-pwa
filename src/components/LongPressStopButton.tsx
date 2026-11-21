import { useEffect, useRef, useState } from 'react';

const HOLD_DURATION_MS = 5000;

type LongPressStopButtonProps = {
  onStop: () => void;
};

export function LongPressStopButton({ onStop }: LongPressStopButtonProps) {
  const [progress, setProgress] = useState(0);
  const holdingRef = useRef(false);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  function cancelHold() {
    holdingRef.current = false;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    setProgress(0);
  }

  function startHold() {
    holdingRef.current = true;
    const startTime = performance.now();

    function tick(now: number) {
      if (!holdingRef.current) {
        return;
      }

      const elapsed = now - startTime;
      const nextProgress = Math.min(elapsed / HOLD_DURATION_MS, 1);
      setProgress(nextProgress);

      if (nextProgress >= 1) {
        holdingRef.current = false;
        frameRef.current = null;
        setProgress(0);
        onStop();
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
  }

  return (
    <div className="workout-stop-controls">
      <button
        type="button"
        className="button button--primary button--stop-hold"
        aria-label="Long hold for 5 seconds to stop workout recording"
        onPointerDown={(event) => {
          event.preventDefault();
          startHold();
        }}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        onContextMenu={(event) => {
          event.preventDefault();
        }}
      >
        <span
          className="button--stop-hold__progress"
          style={{ transform: `scaleX(${progress})` }}
          aria-hidden="true"
        />
        <span className="button--stop-hold__label">Long hold to Stop</span>
      </button>
    </div>
  );
}
