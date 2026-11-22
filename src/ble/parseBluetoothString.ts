export function parseBluetoothString(data: ArrayBuffer | DataView): string {
  const view = data instanceof DataView ? data : new DataView(data);
  if (view.byteLength === 0) {
    return '';
  }

  const bytes = new Uint8Array(
    view.buffer,
    view.byteOffset,
    view.byteLength,
  );
  return new TextDecoder('utf-8').decode(bytes).replace(/\0/g, '').trim();
}