# Heart Rate Monitor PWA — Implementation Plan (v1.0)

## Overview

Build a browser-based Progressive Web App that connects to a standard Bluetooth Low Energy (BLE) heart rate monitor, records workouts, computes summary statistics, and persists reports on the device. Version 1.0 focuses on a reliable end-to-end workout flow with offline-capable local storage and JSON export.

## v1.0 Goals

- Connect to a BLE heart rate monitor from the browser (no native app install)
- Start/stop workout recording with live heart rate display
- Generate a post-workout report with:
  - Exercise duration
  - Average heart rate
  - Max heart rate
  - Estimated calories burned
  - Heart rate zone chart over time
  - Time spent in each zone (zones 1–5)
  - Heart rate variability (HRV) summary
- Save workout reports locally on the device
- Export a single workout report as JSON
- Installable as a PWA with basic offline support for viewing saved reports

## v1.0 Non-Goals

- User accounts, cloud sync, or multi-device backup
- GPS route tracking or map integration
- Social sharing, leaderboards, or coaching plans
- Support for non-standard proprietary BLE devices beyond the Heart Rate GATT profile
- Apple Watch / HealthKit integration
- Advanced HRV analytics (sleep staging, readiness scores, trend dashboards)
- CSV/PDF export (JSON only in v1.0)
- Editing or merging past workouts

---

## Recommended Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Vite + React + TypeScript** | Fast dev experience, strong typing for BLE/event data |
| Styling | **CSS Modules or Tailwind** | Lightweight, mobile-first UI |
| BLE | **Web Bluetooth API** | Required for browser-native HR monitor connection |
| Charts | **Chart.js** or **Recharts** | Zone-over-time visualization |
| Local storage | **IndexedDB** (via `idb` or Dexie) | Structured workout history, larger payloads than localStorage |
| PWA | **vite-plugin-pwa** (Workbox) | Manifest, service worker, install prompt |
| Testing | **Vitest** + **Playwright** (optional E2E) | Unit tests for stats/HRV math; E2E limited by BLE in CI |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│  Connect │ Live Workout │ Report │ History │ Export         │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                     Application State                        │
│  workout session │ live samples │ user profile (zones)      │
└──────────┬───────────────────────────────┬──────────────────┘
           │                               │
┌──────────▼──────────┐         ┌──────────▼──────────────────┐
│   BLE Service       │         │   Workout Engine             │
│   GATT HR Profile   │         │   sampling, zones, HRV,      │
│   connect/disconnect│         │   calories, report builder   │
└─────────────────────┘         └──────────┬──────────────────┘
                                           │
                                ┌──────────▼──────────────────┐
                                │   Persistence (IndexedDB)    │
                                │   workouts, settings         │
                                └─────────────────────────────┘
```

### Core Modules

1. **`ble/heartRateService`** — Web Bluetooth connection, GATT notifications, sample normalization
2. **`workout/sessionManager`** — Start/stop/pause, in-memory sample buffer, session metadata
3. **`analytics/stats`** — Duration, avg/max HR, zone time, calorie estimate
4. **`analytics/hrv`** — RR-interval extraction and HRV metrics from BLE Heart Rate Measurement characteristic
5. **`analytics/zones`** — Karvonen (HRR) zone boundary calculation and per-sample classification
6. **`storage/workoutStore`** — CRUD for saved workouts and user settings
7. **`export/jsonExporter`** — Serialize workout report to downloadable JSON

---

## BLE Integration

### Standard Profile

Use the **Bluetooth Heart Rate Service**:

- Service UUID: `0x180D` (`0000180d-0000-1000-8000-00805f9b34fb`)
- Characteristic UUID: `0x2A37` Heart Rate Measurement (`00002a37-0000-1000-8000-00805f9b34fb`)

### Parsed Fields

From each notification, extract:

- **Heart rate** (UINT8 or UINT16 depending on flags)
- **RR intervals** (when present in flags bit 4) — required for HRV
- **Contact status** (optional UX hint when sensor not on skin)
- **Timestamp** (client-side `performance.now()` or `Date.now()` at receipt)

### Connection Flow

1. Check `navigator.bluetooth` availability; show unsupported-browser message if absent
2. `requestDevice({ filters: [{ services: ['heart_rate'] }] })`
3. Connect GATT server → get Heart Rate service → subscribe to notifications
4. On disconnect/error: update UI, optionally attempt reconnect (manual in v1.0)
5. Request `navigator.bluetooth.getAvailability()` where supported for UX messaging

### Browser Support (v1.0 target)

- **Supported:** Chrome
- **Not supported:** Edge, Opera on Android/desktop; Chrome on macOS, iOS Safari (no Web Bluetooth) — show clear fallback message
- **Requires:** HTTPS (or `localhost` for development)

---

## Data Models

### `HeartRateSample`

```ts
{
  timestamp: number;      // ms since epoch
  bpm: number;
  rrIntervalsMs?: number[];  // 0..n RR intervals from one notification
  contactDetected?: boolean;
}
```

### `WorkoutSession` (in progress)

```ts
{
  id: string;
  startedAt: number;
  endedAt?: number;
  deviceName?: string;
  samples: HeartRateSample[];
}
```

### `WorkoutReport` (persisted)

```ts
{
  id: string;
  startedAt: string;       // ISO 8601
  endedAt: string;
  durationSec: number;
  avgHeartRate: number;
  maxHeartRate: number;
  caloriesBurned: number;
  zoneConfig: ZoneConfig;
  zoneTimeSec: Record<1 | 2 | 3 | 4 | 5, number>;
  zoneSeries: { timestamp: string; bpm: number; zone: 1 | 2 | 3 | 4 | 5 }[];
  hrv: {
    rmssd: number;         // ms
    sdnn: number;          // ms
    sampleCount: number;   // number of valid RR intervals used
  };
  samples: HeartRateSample[];  // optional: include full series in export
  appVersion: "1.0.0";
}
```

### `ZoneConfig` (snapshot stored on each report)

```ts
{
  method: "karvonen" | "manual";
  maxHeartRate: number;
  restingHeartRate: number;       // required for Karvonen
  hrr: number;                    // maxHeartRate - restingHeartRate
  bounds: Record<1 | 2 | 3 | 4 | 5, { minBpm: number; maxBpm: number }>;
}
```

### `UserSettings`

```ts
{
  maxHeartRate: number;           // default: 220 - age, or manual override
  restingHeartRate: number;       // required for Karvonen zones; default: 60 if unset at first run
  weightKg?: number;              // for calorie estimate
  age?: number;
  zoneMethod: "karvonen" | "manual";
  manualZoneBounds?: [number, number, number, number]; // upper bounds for zones 1-4
}
```

---

## Analytics Specifications

### Heart Rate Zones (1–5)

Default **Karvonen method** (Heart Rate Reserve / HRR):

```
HRR = maxHeartRate − restingHeartRate
targetBpm = restingHeartRate + (HRR × intensityFraction)
```

Zone boundaries are defined as **percent of HRR** (not percent of max HR):

| Zone | % of HRR | Typical label | BPM range (inclusive lower, exclusive upper) |
|------|----------|---------------|---------------------------------------------|
| 1 | 50–60% | Recovery | `[RHR + 0.50×HRR, RHR + 0.60×HRR)` |
| 2 | 60–70% | Aerobic base | `[RHR + 0.60×HRR, RHR + 0.70×HRR)` |
| 3 | 70–80% | Aerobic | `[RHR + 0.70×HRR, RHR + 0.80×HRR)` |
| 4 | 80–90% | Threshold | `[RHR + 0.80×HRR, RHR + 0.90×HRR)` |
| 5 | 90–100% | Max | `[RHR + 0.90×HRR, RHR + 1.00×HRR]` |

Example: age 30, max HR 190, resting HR 60 → HRR = 130:

| Zone | BPM range |
|------|-----------|
| 1 | 125–138 |
| 2 | 138–151 |
| 3 | 151–164 |
| 4 | 164–177 |
| 5 | 177–190 |

Implementation notes:

- **Max HR:** from settings (`maxHeartRate` or `220 − age`)
- **Resting HR:** required for Karvonen; collect in Settings before first workout (default 60 with prompt to personalize)
- **Below zone 1:** samples with BPM `< RHR + 0.50×HRR` are excluded from zone time totals (shown as "below zone 1" in live UI only)
- Classify each sample's BPM into a zone using the bounds above
- Persist computed `ZoneConfig` on each `WorkoutReport` so historical reports stay accurate if settings change
- **Zone time:** integrate time between consecutive samples (assign full delta to current sample's zone)
- **Zone series:** downsample for chart if needed (e.g., 1 point per 5s) while keeping raw samples for export
- **Manual override:** `zoneMethod: "manual"` bypasses Karvonen and uses user-defined BPM upper bounds for zones 1–4 (zone 5 = above zone 4 max)

### Calories Burned (v1.0 estimate)

Use a simple, transparent formula (document in UI as estimate):

- **Keytel et al. gender-neutral approximation** or simplified:
  - `calories = durationMin * (0.6309 * avgHR + 0.1988 * weightKg + 0.2017 * age) / 4.184 / genderFactor`
- If weight/age missing: fall back to MET-based estimate using avg HR zone intensity, flagged as low confidence in report

### Heart Rate Variability (HRV)

Compute from **RR intervals** in BLE notifications:

1. Collect consecutive RR intervals (ms), filter artifacts:
   - Remove RR < 300ms or > 2000ms
   - Remove intervals deviating > 20–25% from preceding interval (simple consecutive check)
2. Compute on workout segment (or last N minutes — v1.0: **full workout**):
   - **RMSSD:** `sqrt(mean(diff(RR)^2))`
   - **SDNN:** standard deviation of all valid RR intervals
3. If device does not send RR intervals: show "HRV unavailable — device did not provide RR data" in report

---

## UI / Screens (v1.0)

### 1. Home / Connect

- PWA install hint (when `beforeinstallprompt` fires)
- "Connect Heart Rate Monitor" button
- Connection status (device name, signal/disconnected)
- Link to settings and workout history
- Unsupported browser banner on non Chrome browsers (i.e. iOS / Firefox)

### 2. Live Workout

- Large current BPM display
- Elapsed time
- Current zone indicator (color + zone number)
- Mini sparkline of recent BPM (last 2–5 min)
- Start / Stop / (optional Pause — defer pause to v1.1 if needed)
- Confirm before stopping if session < 30s

### 3. Workout Report

- Summary cards: duration, avg, max, calories, HRV (RMSSD, SDNN)
- **Zone bar chart:** horizontal stacked bar of time per zone
- **HR over time chart:** line chart with zone-colored background bands
- Save automatically on completion; "Export JSON" button
- "Done" → history or new workout

### 4. History

- List of saved workouts (date, duration, avg/max HR)
- Tap to view report (read-only)
- Delete workout (with confirmation)
- Storage usage indicator (optional, nice-to-have)

### 5. Settings

- Age, weight, **resting HR** (required for Karvonen zones), max HR override
- Karvonen zone preview table (shows HRR and computed BPM range per zone)
- Optional manual zone bounds override (`zoneMethod: "manual"`)
- Clear all data (with confirmation)

---

## PWA Requirements

### Web App Manifest

- `name`, `short_name`, `description`
- `start_url`, `display: standalone`
- Theme/background colors
- Icons: 192×192, 512×512 (maskable)

### Service Worker (v1.0 scope)

- Precache app shell (HTML, JS, CSS, icons)
- Cache-first for static assets
- **Do not** cache BLE or IndexedDB operations
- Offline: app loads; user can view saved history; connect requires network/BLE as usual

---

## JSON Export Format

Single file per workout: `workout-{id}-{date}.json`

```json
{
  "schemaVersion": "1.0",
  "exportedAt": "2026-07-06T23:00:00.000Z",
  "report": { /* WorkoutReport object */ }
}
```

Export via `Blob` + `<a download>` or Web Share API when available.

---

## Project Structure

```
heart-rate-monitor-pwa/
├── public/
│   ├── icons/
│   └── manifest.webmanifest
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── ble/
│   │   ├── heartRateService.ts
│   │   └── parseHeartRateMeasurement.ts
│   ├── workout/
│   │   └── sessionManager.ts
│   ├── analytics/
│   │   ├── zones.ts
│   │   ├── stats.ts
│   │   ├── hrv.ts
│   │   └── calories.ts
│   ├── storage/
│   │   ├── db.ts
│   │   └── workoutStore.ts
│   ├── export/
│   │   └── jsonExporter.ts
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── types/
├── index.html
├── vite.config.ts
├── package.json
├── IMPLEMENTATION_PLAN.md
└── README.md
```

---

## Development Phases

### Phase 1 — Project Scaffold (Day 1)

- [x] Initialize Vite + React + TypeScript project
- [x] Add PWA plugin, manifest, icons, mobile viewport meta
- [x] Basic routing: Home, Workout, Report, History, Settings
- [x] Define TypeScript types and IndexedDB schema

**Exit criteria:** App installs as PWA shell; navigates between empty screens.

### Phase 2 — BLE Connection (Days 2–3)

- [x] Implement Heart Rate GATT parser (UINT8/UINT16, RR intervals)
- [x] Connect/disconnect UI with error handling
- [x] Live BPM display from real device
- [x] Unit tests for parser with spec byte arrays

**Exit criteria:** Stable live BPM from a physical HR strap/chest monitor on Chrome/Android.

### Phase 3 — Workout Recording (Days 3–4)

- [x] Session start/stop with sample buffer
- [x] Elapsed timer and current zone display
- [x] Wire sample ingestion from BLE into session manager

**Exit criteria:** Complete workout produces in-memory sample array with timestamps.

### Phase 4 — Analytics & Report (Days 4–6)

- [ ] Karvonen (HRR) zone boundary calculation, classification, and zone time aggregation
- [ ] Avg/max HR, duration
- [ ] Calorie estimation (settings-aware)
- [ ] HRV (RMSSD, SDNN) with artifact filtering
- [ ] Zone-over-time chart and zone summary chart
- [ ] Unit tests for all analytics (fixed fixture data)

**Exit criteria:** Stop workout → report shows all required metrics with plausible values.

### Phase 5 — Persistence & Export (Days 6–7)

- [ ] Save `WorkoutReport` to IndexedDB on workout completion
- [ ] History list and report detail views
- [ ] Delete workout
- [ ] JSON export download
- [ ] Settings persisted (age, weight, resting HR, max HR)

**Exit criteria:** Workouts survive page reload; export produces valid JSON matching schema.

### Phase 6 — Polish & Release (Days 7–8)

- [ ] Loading/error/empty states
- [ ] iOS unsupported-browser messaging
- [ ] Accessibility: focus order, aria labels on charts/buttons
- [ ] README: setup, HTTPS dev, supported browsers, test devices
- [ ] Manual QA checklist (below)

**Exit criteria:** v1.0 tagged; README documents usage and limitations.

---

## Testing Strategy

### Unit Tests (required)

- HR measurement byte parsing (with/without RR, UINT16)
- Karvonen zone boundary calculation and time-in-zone aggregation
- HRV RMSSD/SDNN on known RR sequences
- Calorie formula with fixture inputs
- Report builder output shape

### Manual QA Checklist

- [ ] Connect HR monitor, see live BPM within 2s of contact
- [ ] 5+ minute workout produces coherent zone breakdown (sums ≈ duration)
- [ ] Max HR ≥ avg HR ≥ reasonable min during workout
- [ ] HRV shown when RR present; graceful message when absent
- [ ] Report persists after refresh
- [ ] JSON export opens and validates
- [ ] PWA install works on Android Chrome
- [ ] App shell loads offline; history readable offline

### CI Note

Web Bluetooth cannot run in headless CI. Gate E2E BLE tests behind manual runs; automate pure functions only.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| iOS lacks Web Bluetooth | Large mobile audience blocked | Prominent unsupported notice; future native wrapper out of v1.0 scope |
| Device omits RR intervals | No HRV | Detect and message; still deliver HR/zones/calories |
| BLE disconnect mid-workout | Lost data | Buffer in memory; auto-save partial on disconnect prompt |
| Calorie formula inaccuracy | User trust | Label as estimate; optional weight/age inputs |
| Chart performance on long workouts | Janky UI | Downsample series for display; keep full data in export |
| HTTPS requirement for BLE | Dev friction | Document `vite --host` + mkcert or ngrok for device testing |

---

## v1.0 Definition of Done

All README features are implemented and manually verified:

1. Connect to heart rate monitor without downloading apps
2. Record workouts
3. Report: exercise time, avg HR, max HR, calories burned
4. Map heart rate zone over time
5. Track time in each zone (1–5)
6. Measure heart rate variability
7. Export workout report as JSON
8. Save workout reports on device

Additionally:

- Installable PWA with offline shell
- Settings for personalization (max HR, resting HR, weight, age)
- Documented browser/device support and known limitations

---

## Post–v1.0 Backlog (not in scope)

- Pause/resume workouts
- CSV export and share sheet integration
- Weekly/monthly HRV and zone trends
- Custom zone names and colors
- Multiple concurrent BLE sensors
- Cloud backup and account sync
- Workout title/notes/tags
