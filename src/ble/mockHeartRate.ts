export const MOCK_DEVICE_NAME = 'Mock HR Monitor (dev)';

export function isMockHeartRateEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_MOCK_HEART_RATE === 'true';
}