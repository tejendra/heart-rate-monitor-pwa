import type { HeartRateSample } from '../types';

const FLAG_HR_FORMAT_UINT16 = 0x01;
const FLAG_SENSOR_CONTACT_SUPPORTED = 0x04;
const FLAG_SENSOR_CONTACT_DETECTED = 0x02;
const FLAG_ENERGY_EXPENDED_PRESENT = 0x08;
const FLAG_RR_INTERVAL_PRESENT = 0x10;

const RR_INTERVAL_RESOLUTION_MS = 1000 / 1024;

export interface ParsedHeartRateMeasurement {
  bpm: number;
  rrIntervalsMs?: number[];
  contactDetected?: boolean;
}

export function parseHeartRateMeasurement(
  data: ArrayBuffer | DataView,
): ParsedHeartRateMeasurement {
  const view = data instanceof DataView ? data : new DataView(data);

  if (view.byteLength < 2) {
    throw new RangeError('Heart rate measurement must include flags and BPM');
  }

  const flags = view.getUint8(0);
  const isUint16 = (flags & FLAG_HR_FORMAT_UINT16) !== 0;
  let offset = 1;

  const bpm = isUint16
    ? view.getUint16(offset, true)
    : view.getUint8(offset);
  offset += isUint16 ? 2 : 1;

  let contactDetected: boolean | undefined;
  if ((flags & FLAG_SENSOR_CONTACT_SUPPORTED) !== 0) {
    contactDetected = (flags & FLAG_SENSOR_CONTACT_DETECTED) !== 0;
  }

  if ((flags & FLAG_ENERGY_EXPENDED_PRESENT) !== 0) {
    if (view.byteLength < offset + 2) {
      throw new RangeError('Energy expended field is incomplete');
    }
    offset += 2;
  }

  let rrIntervalsMs: number[] | undefined;
  if ((flags & FLAG_RR_INTERVAL_PRESENT) !== 0) {
    rrIntervalsMs = [];
    while (offset + 1 < view.byteLength) {
      const rrValue = view.getUint16(offset, true);
      rrIntervalsMs.push(Math.round(rrValue * RR_INTERVAL_RESOLUTION_MS));
      offset += 2;
    }
  }

  return {
    bpm,
    rrIntervalsMs: rrIntervalsMs?.length ? rrIntervalsMs : undefined,
    contactDetected,
  };
}

export function toHeartRateSample(
  data: ArrayBuffer,
  timestamp = Date.now(),
): HeartRateSample {
  const parsed = parseHeartRateMeasurement(data);
  return {
    timestamp,
    bpm: parsed.bpm,
    rrIntervalsMs: parsed.rrIntervalsMs,
    contactDetected: parsed.contactDetected,
  };
}
