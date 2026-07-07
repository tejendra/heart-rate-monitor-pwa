import { useId, useState, type ReactNode } from 'react';

type FieldTooltipProps = {
  label: string;
  children: ReactNode;
};

export function FieldTooltip({ label, children }: FieldTooltipProps) {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);

  return (
    <span className="tooltip">
      <button
        type="button"
        className="tooltip__trigger"
        aria-label={label}
        aria-expanded={open}
        aria-controls={tooltipId}
        onClick={() => setOpen((current) => !current)}
      >
        ?
      </button>
      {open && (
        <span id={tooltipId} role="tooltip" className="tooltip__content">
          {children}
        </span>
      )}
    </span>
  );
}
