export function parseBatteryLevel(data: ArrayBuffer | DataView): number {
  const view = data instanceof DataView ? data : new DataView(data);
  if (view.byteLength < 1) {
    throw new RangeError('Battery level must include one byte');
  }

  const percent = view.getUint8(0);
  return Math.min(100, Math.max(0, percent));
}