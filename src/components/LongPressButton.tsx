import { type CSSProperties, useEffect, useRef, useState } from 'react';

const DEFAULT_HOLD_DURATION_MS = 5000;

type LongPressButtonProps = {
  onComplete: () => void;
  label: string;
  ariaLabel: string;
  className?: string;
  holdDurationMs?: number;
};

export function LongPressButton({
  onComplete,
  label,
  ariaLabel,
  className = 'button button--hold',
  holdDurationMs = DEFAULT_HOLD_DURATION_MS,
}: LongPressButtonProps) {
  const [holding, setHolding] = useState(false);
  const completeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);

  onCompleteRef.current = onComplete;

  useEffect(() => {
    return () => {
      if (completeTimeoutRef.current !== null) {
        clearTimeout(completeTimeoutRef.current);
      }
    };
  }, []);

  function cancelHold() {
    if (completeTimeoutRef.current !== null) {
      clearTimeout(completeTimeoutRef.current);
      completeTimeoutRef.current = null;
    }
    setHolding(false);
  }

  function startHold() {
    cancelHold();
    setHolding(true);

    completeTimeoutRef.current = setTimeout(() => {
      completeTimeoutRef.current = null;
      setHolding(false);
      onCompleteRef.current();
    }, holdDurationMs);
  }

  return (
    <button
      type="button"
      className={`${className}${holding ? ' button--hold--active' : ''}`}
      style={
        { '--hold-duration': `${holdDurationMs}ms` } as CSSProperties
      }
      aria-label={ariaLabel}
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
      <span className="button--hold__progress" aria-hidden="true" />
      <span className="button--hold__label">{label}</span>
    </button>
  );
}