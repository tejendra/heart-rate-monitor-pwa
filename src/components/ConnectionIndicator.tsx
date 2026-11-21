type ConnectionIndicatorProps = {
  deviceName?: string;
  batteryLevelPercent?: number;
  onDisconnect: () => void;
};

function BluetoothIcon() {
  return (
    <svg
      className="connection-indicator__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M17.71 7.71 12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"
      />
    </svg>
  );
}

export function ConnectionIndicator({
  deviceName,
  batteryLevelPercent,
  onDisconnect,
}: ConnectionIndicatorProps) {
  const label = deviceName ?? 'heart rate monitor';
  const statusLabel =
    batteryLevelPercent !== undefined
      ? `Connected to ${label}, battery ${batteryLevelPercent} percent`
      : `Connected to ${label}`;

  return (
    <div
      className="connection-indicator"
      role="status"
      aria-live="polite"
      aria-label={statusLabel}
    >
      <span className="connection-indicator__signal" aria-hidden="true">
        <BluetoothIcon />
        <span className="connection-indicator__dot" />
      </span>
      <span className="connection-indicator__name">{label}</span>
      {batteryLevelPercent !== undefined && (
        <span className="connection-indicator__battery">
          {batteryLevelPercent}%
        </span>
      )}
      <button
        type="button"
        className="connection-indicator__disconnect"
        aria-label={`Disconnect ${label}`}
        onClick={onDisconnect}
      >
        ×
      </button>
    </div>
  );
}
