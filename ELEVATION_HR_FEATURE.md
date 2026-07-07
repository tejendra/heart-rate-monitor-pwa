# Elevation ↔ Heart Rate Analysis — Technical Implementation Plan

## Overview

Add an **optional outdoor workout mode** that records GPS coordinates during a heart rate session, derives elevation and grade from a **Digital Elevation Model (DEM)** (not phone GPS altitude), and produces a post-workout report showing **how heart rate differs on uphill, flat, and downhill segments**.

Primary user outcome: a new datapoint alongside zones, calories, and HRV — e.g. “avg HR was 148 bpm on climbs vs 132 bpm on flats.”

This feature stays in the **PWA** (no native Android rewrite required for v1). It builds on the existing workout pipeline:

```
BLE samples → WorkoutSessionManager → buildWorkoutReport → IndexedDB → ReportPage
```

Reference DEM background: [NASA Earthdata — Digital Elevation/Terrain Model (DEM)](https://www.earthdata.nasa.gov/topics/land-surface/digital-elevation-terrain-model-dem).

---

## Goals (v1)

- Opt-in **“Track elevation”** setting and per-workout enablement
- Record **latitude/longitude + timestamp** during recording (ignore `coords.altitude`)
- After workout ends, resolve elevation from DEM, compute **grade**, align with HR samples
- Report summary:
  - Total distance (optional), elevation gain/loss
  - **Avg / max HR by terrain bucket**: downhill, flat, uphill
  - Simple chart: HR over time with terrain color band or secondary grade series
- Persist terrain analysis on `WorkoutReport`; include in JSON export
- Graceful degradation when location denied, insufficient GPS points, or DEM lookup fails

## Non-Goals (v1)

- Map UI, route polyline drawing, or turn-by-turn
- Real-time grade display during workout (post-process only is fine for v1)
- Barometer fusion or native Android background GPS
- Cloud sync, segment leaderboards, or pace/speed analysis
- Re-analyzing old workouts unless they stored GPS tracks (no retroactive magic)

---

## Why DEM + GPS, Not Phone Altitude

| Source | Problem |
|--------|---------|
| `GeolocationPosition.coords.altitude` | Often null; vertical accuracy typically ±10–30 m |
| Barometer (web) | Not reliably exposed in browsers |
| **DEM at (lat, lon)** | Consistent MSL reference; horizontal GPS is the limiting factor |

Phone provides the **track**; DEM provides the **height**. Smoothing is applied to both the track and derived elevation before grade and gain calculations.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│  UI: Settings (opt-in) │ Home (terrain toggle) │ Report (terrain) │
└───────────────────────────────┬────────────────────────────────────┘
                                │
┌───────────────────────────────▼────────────────────────────────────┐
│  WorkoutSessionManager                                              │
│  + locationTracker (Geolocation watchPosition)                      │
│  + trackPoints: TrackPoint[]                                        │
└───────────────┬───────────────────────────────┬──────────────────────┘
                │                               │
┌───────────────▼──────────┐    ┌───────────────▼──────────────────────┐
│  ble/heartRateService    │    │  terrain/locationTracker              │
│  (unchanged)             │    │  watchPosition, accuracy filter       │
└──────────────────────────┘    └───────────────┬──────────────────────┘
                                                │
                                ┌───────────────▼──────────────────────┐
                                │  terrain/buildTerrainAnalysis (async) │
                                │  DEM lookup → grade → HR alignment    │
                                └───────────────┬──────────────────────┘
                                                │
                                ┌───────────────▼──────────────────────┐
                                │  analytics/buildWorkoutReport         │
                                │  WorkoutReport + terrain?: Terrain... │
                                └───────────────┬──────────────────────┘
                                                │
                                ┌───────────────▼──────────────────────┐
                                │  IndexedDB (workouts store)           │
                                └──────────────────────────────────────┘
```

### New modules

| Module | Responsibility |
|--------|----------------|
| `terrain/locationTracker.ts` | Start/stop `watchPosition`, accuracy filtering, in-memory buffer |
| `terrain/demProvider.ts` | Elevation lookup interface + concrete provider (API or tile decoder) |
| `terrain/trackProcessing.ts` | Resample, smooth elevation, compute grade, gain/loss |
| `terrain/alignHeartRate.ts` | Map each HR sample to grade/terrain bucket at timestamp |
| `terrain/buildTerrainAnalysis.ts` | Orchestrates post-workout pipeline; returns `TerrainAnalysis \| null` |
| `terrain/constants.ts` | Thresholds (grade buckets, min climb, resample distance) |
| `components/TerrainHrSummary.tsx` | Report UI for bucket stats and chart |
| `hooks/useLocationTracking.ts` | React hook wiring tracker to recording state |

---

## Data Models

Extend `src/types/index.ts`.

### `TrackPoint`

Recorded during workout; stored on session and copied to report for re-analysis if DEM provider changes later.

```ts
export interface TrackPoint {
  timestamp: number;       // ms since epoch (aligned with HeartRateSample)
  latitude: number;
  longitude: number;
  accuracyM?: number;        // horizontal accuracy from Geolocation API
}
```

### `WorkoutSession` (extend)

```ts
export interface WorkoutSession {
  id: string;
  startedAt: number;
  endedAt?: number;
  deviceName?: string;
  samples: HeartRateSample[];
  terrainEnabled?: boolean;
  trackPoints?: TrackPoint[];
}
```

### Terrain buckets

Use fixed grade thresholds (percent):

| Bucket | Grade range |
|--------|-------------|
| `downhill` | < −3% |
| `flat` | −3% to +3% |
| `uphill` | > +3% |

Constants should live in `terrain/constants.ts` and be documented in the report UI.

### `TerrainBucketStats`

```ts
export type TerrainBucket = 'downhill' | 'flat' | 'uphill';

export interface TerrainBucketStats {
  bucket: TerrainBucket;
  sampleCount: number;       // HR samples in this bucket
  durationSec: number;       // time attributed to bucket
  avgHeartRate: number;
  maxHeartRate: number;
  avgGradePct: number;       // mean grade of aligned track segments
}
```

### `TerrainAnalysis`

Attached to report when terrain was enabled and processing succeeded (or partially succeeded).

```ts
export type TerrainAnalysisStatus =
  | 'complete'
  | 'insufficient_gps'
  | 'dem_unavailable'
  | 'permission_denied';

export interface TerrainSeriesPoint {
  timestamp: string;         // ISO, matches zoneSeries convention
  bpm: number;
  gradePct: number;
  bucket: TerrainBucket;
  elevationM?: number;
}

export interface TerrainAnalysis {
  status: TerrainAnalysisStatus;
  pointCount: number;          // raw GPS points kept after filtering
  distanceM: number;
  elevationGainM: number;
  elevationLossM: number;
  bucketStats: TerrainBucketStats[];
  series: TerrainSeriesPoint[]; // downsampled for chart (~1 point / 15–30 s)
  demSource: string;           // e.g. 'open-elevation-srtm' | 'mapbox-terrain-rgb'
  processedAt: string;         // ISO timestamp
}
```

### `WorkoutReport` (extend)

```ts
export interface WorkoutReport {
  // ... existing fields ...
  trackPoints?: TrackPoint[];
  terrain?: TerrainAnalysis;
}
```

### `UserSettings` (extend)

```ts
export interface UserSettings {
  // ... existing fields ...
  terrainTrackingEnabled?: boolean;  // default false — explicit opt-in
}
```

### Export schema

Bump `WorkoutExport.schemaVersion` to `'1.1'` when terrain fields are present. Keep backward compatibility: v1.0 exports omit `terrain` and `trackPoints`.

---

## GPS Capture

### Geolocation API

Use `navigator.geolocation.watchPosition` with:

```ts
{
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 15_000,
}
```

**Do not use** `coords.altitude` or `coords.altitudeAccuracy`.

### Sampling strategy

- Accept a fix when `coords.accuracy <= 50` m (configurable; reject worse fixes)
- Store at most **one point every 5 s** or **every 10 m** (whichever comes first) to limit memory and DEM API calls
- Cap in-memory buffer at ~4 hours of hiking (~2,880 points at 5 s) — sufficient for v1

### Lifecycle

| Event | Action |
|-------|--------|
| `startWorkout()` + terrain enabled | Request permission if needed; start `watchPosition` |
| Each fix | Append to `session.trackPoints` |
| `stopWorkout()` | Clear watch; pass `trackPoints` into report builder |
| Permission denied | Continue HR-only workout; set `terrain.status = 'permission_denied'` |

### Integration with `WorkoutSessionManager`

Option A (recommended): keep GPS out of the manager — `useLocationTracking(isRecording && terrainEnabled)` in `WorkoutProvider` pushes points via `workoutSessionManager.addTrackPoint(point)`.

Add to `WorkoutSessionManager`:

```ts
addTrackPoint(point: TrackPoint): void
```

Mirror `addSample` guard: only while `recording`.

### Wake lock

Existing `useWakeLock(isRecording)` on `HomePage` helps keep the tab active on Android. Document in UI that **screen-off recording is best-effort** in a PWA; recommend keeping screen on for reliable GPS.

---

## DEM Elevation Lookup

### Provider interface

```ts
export interface DemProvider {
  readonly id: string;
  getElevations(points: Array<{ lat: number; lon: number }>): Promise<number[]>;
}
```

Returns elevation in **meters MSL** for each input point, same order.

### v1 provider recommendation: Open-Elevation–style API

Simplest path for a PWA prototype:

- Batch lat/lon to a public elevation API (self-hosted or third-party)
- Example pattern: POST/GET with `{ locations: [{ latitude, longitude }] }` → `{ results: [{ elevation }] }`
- **Production:** self-host [Open Topo Data](https://www.opentopodata.org/) with SRTM 30 m or Copernicus DEM tiles to avoid rate limits and keep user tracks off third parties

Alternatives for v2:

| Provider | Notes |
|----------|-------|
| **Mapbox Terrain-RGB** | Decode elevation client-side from tiles; needs API key; good for offline tile cache |
| **Self-hosted COG/raster** | Best privacy/offline; more infra |
| **NASA Earthdata bulk DEM** | Source data for hosting, not a runtime per-point API |

### Batching and network

- Run DEM resolution **after** `stopWorkout()`, before or during `saveWorkout()`
- Show report loading state: “Analyzing elevation…”
- Batch lookups in chunks of 50–100 points with short delay to respect rate limits
- On failure: save report without `terrain` or with `status: 'dem_unavailable'`; HR data still intact

### Interpolation

For each track point, DEM returns center-of-cell elevation. Optional bilinear interpolation across four neighboring DEM cells if the provider supports it (Mapbox tiles); point sampling is acceptable for v1.

---

## Track Processing Pipeline

All logic in pure functions under `terrain/` for unit testing (no DOM, no Geolocation).

### Step 1 — Filter track

Remove points with `accuracyM > 50`. Remove speed outliers if computed (optional v1).

### Step 2 — Resample by distance

Resample polyline to roughly **every 15 m** using haversine distance along the path. Reduces GPS jitter before grade calculation.

```ts
function haversineM(a: TrackPoint, b: TrackPoint): number
function resampleTrack(points: TrackPoint[], intervalM: number): TrackPoint[]
```

### Step 3 — DEM elevation per resampled point

```ts
elevations = await demProvider.getElevations(resampled.map(p => ({ lat, lon })))
```

### Step 4 — Smooth elevation

Apply **moving median** (window 5) or **moving average** (window 3) on elevation series. Median is more robust to single-point DEM/GPS spikes.

### Step 5 — Grade between consecutive points

```ts
gradePct = ((elev[i] - elev[i-1]) / horizontalDistanceM) * 100
```

Clamp extreme grades to ±45% for display; exclude from buckets if distance < 5 m.

### Step 6 — Elevation gain / loss

Sum positive smoothed deltas where `delta >= 4` m (noise gate). Sum negative deltas similarly for loss. Do **not** use max − min altitude.

```ts
const MIN_CLIMB_M = 4;
```

### Step 7 — Align heart rate samples

For each `HeartRateSample`:

1. Find the resampled track segment whose time range contains `sample.timestamp` (linear search or binary search on timestamps).
2. Assign that segment’s `gradePct` and `bucket`.
3. If no track point within ±15 s, exclude sample from terrain stats (HR chart still shows full HR).

```ts
function alignHeartRateToTerrain(
  samples: HeartRateSample[],
  segments: Array<{ startTime: number; endTime: number; gradePct: number; bucket: TerrainBucket; elevationM: number }>,
): TerrainSeriesPoint[]
```

### Step 8 — Aggregate bucket stats

For each bucket, compute:

- `sampleCount`, `durationSec` (from consecutive aligned sample timestamps or segment overlap)
- `avgHeartRate`, `maxHeartRate`
- `avgGradePct`

Also compute **overall** `avgHeartRate` on flat-only segments as a baseline reference in UI copy.

---

## Report Builder Changes

### `buildWorkoutReport`

Keep synchronous HR stats unchanged. Terrain analysis is **async**:

```ts
// workout/context or buildReport wrapper
const report = buildWorkoutReport(session, zoneConfig, settings);
report.trackPoints = session.trackPoints;

if (session.terrainEnabled && session.trackPoints?.length) {
  report.terrain = await buildTerrainAnalysis({
    trackPoints: session.trackPoints,
    samples: session.samples,
    demProvider,
  });
}
```

Update `WorkoutContext.stopWorkout()` to await terrain analysis before `saveWorkout()`.

### `buildTerrainAnalysis`

Returns `TerrainAnalysis | undefined`. Minimum GPS points for `complete`: **10** resampled points spanning **≥ 3 minutes** (avoid labeling a short walk to the car).

---

## UI Changes

### Settings (`SettingsPage.tsx`)

- Toggle: **“Track elevation during outdoor workouts”** (`terrainTrackingEnabled`)
- Short explanation: requires location permission; used only to analyze how hills affect heart rate; data stays on device
- Link to privacy note: raw lat/lon stored in workout JSON export

### Home (`HomePage.tsx`)

When `terrainTrackingEnabled` and workout not started:

- Show checkbox **“Include elevation analysis”** (default on when setting enabled)
- During recording: small status — “GPS: acquiring / N points / weak signal”
- If permission denied mid-flow: non-blocking banner; HR recording continues

### Report (`ReportSummary.tsx` + `TerrainHrSummary.tsx`)

New section **“Heart rate & terrain”** when `report.terrain?.status === 'complete'`:

**Summary cards:**

| Card | Example |
|------|---------|
| Elevation gain | +412 m |
| Distance | 8.2 km |
| Uphill avg HR | 158 bpm |
| Flat avg HR | 134 bpm |
| Downhill avg HR | 141 bpm |

**Table:** bucket, duration, avg HR, max HR, avg grade

**Chart:** extend `HeartRateChart` or add `TerrainHeartRateChart`:

- X: time
- Y: BPM line
- Background bands colored by bucket (downhill / flat / uphill)

**Non-complete statuses:**

| Status | User message |
|--------|----------------|
| `permission_denied` | Location was blocked; connect HR-only next time or enable permission |
| `insufficient_gps` | Not enough GPS data — keep phone in view with clear sky |
| `dem_unavailable` | Could not load elevation data — try again on Wi‑Fi |

---

## IndexedDB

No schema migration required if `WorkoutReport` JSON shape is extended — IndexedDB stores full objects.

Optional: bump `DB_VERSION` to 2 only if adding indexes (e.g. `by-hasTerrain`); not needed for v1.

---

## Testing Strategy

### Unit tests (Vitest)

| Module | Cases |
|--------|-------|
| `trackProcessing.ts` | haversine, resample, gain with noise gate, grade on known slope |
| `alignHeartRate.ts` | timestamp alignment, bucket assignment |
| `buildTerrainAnalysis.ts` | mock `DemProvider` returning synthetic ramp: verify uphill avg HR > flat |
| `constants.ts` | bucket boundaries |

Use fixture: flat track + synthetic DEM ramp (+5% grade for 500 m) + HR samples 130 flat / 160 uphill.

### Integration

- Mock `navigator.geolocation` in Playwright (optional)
- Manual QA on Android Chrome: outdoor walk with HTTPS tunnel, verify report buckets

### DEM provider

- Mock provider in all CI tests
- Manual smoke test against real API in dev only

---

## Implementation Phases

### Phase 1 — Data capture (M)

- Types, `addTrackPoint`, `locationTracker`, settings toggle
- Store `trackPoints` on session/report
- No DEM yet; verify points recorded and exported in JSON

### Phase 2 — Processing pipeline (L)

- `trackProcessing`, `alignHeartRate`, mock DEM tests
- Integrate Open Topo Data or self-hosted endpoint via env var `VITE_ELEVATION_API_URL`

### Phase 3 — Report UI (M)

- `TerrainHrSummary`, loading state on stop
- Bucket summary cards + chart bands

### Phase 4 — Polish (S)

- GPS status on Home, error copy, README section
- Export schema 1.1, IMPLEMENTATION_PLAN cross-link

**Estimated effort:** ~1–2 weeks part-time for Phases 1–3 with existing codebase familiarity.

---

## Configuration

```env
# .env.example
VITE_ELEVATION_API_URL=https://your-opentopodata-instance/v1/srtm30m
VITE_TERRAIN_ENABLED=true
```

Feature flag `VITE_TERRAIN_ENABLED` hides UI until DEM endpoint is configured.

---

## Platform Matrix

| Platform | HR (existing) | GPS track | DEM lookup | Practical use |
|----------|---------------|-----------|------------|---------------|
| Android Chrome | Yes | Yes (foreground) | Yes (online) | **Primary target** |
| Desktop Chrome | Yes | Limited value | Yes | Dev/testing |
| iOS | No BLE | Partial | Yes | Not a v1 target |

Recommend documenting: **Android phone, Chrome, screen on, outdoor workout, HTTPS.**

---

## Privacy & Security

- Location is sensitive: **opt-in only**, never enabled by default
- Store tracks locally in IndexedDB; user controls export/delete
- Prefer self-hosted DEM API so lat/lon tracks are not sent to unknown third parties
- Do not log raw coordinates to analytics services

---

## Future Enhancements (post-v1)

- Finer grade buckets (e.g. 0–3%, 3–8%, 8%+) or continuous grade ↔ HR scatter plot
- Re-process saved workouts when DEM provider improves (raw `trackPoints` already stored)
- Mapbox Terrain-RGB + tile cache for offline DEM
- Pace from GPS speed → normalize HR by effort (grade + speed)
- Capacitor wrapper for background GPS if PWA limits prove unacceptable

---

## Key Design Decisions

1. **Post-process DEM after workout** — simpler than live tiles; acceptable latency for the user’s goal (retrospective insight).
2. **Store raw track points** — enables re-analysis without re-walking.
3. **Terrain buckets over raw grade** — easier to interpret than a scatter plot for a “datapoint” feature.
4. **Keep HR pipeline unchanged** — terrain is an optional orthogonal module; failed terrain never blocks saving HR reports.
5. **PWA first** — validates the feature before investing in native Android for background GPS.

---

## References

- [NASA Earthdata — DEM overview](https://www.earthdata.nasa.gov/topics/land-surface/digital-elevation-terrain-model-dem)
- [Geolocation API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [Open Topo Data](https://www.opentopodata.org/) — self-hostable elevation API over SRTM/Copernicus
- Existing app modules: `workout/sessionManager.ts`, `analytics/buildReport.ts`, `context/WorkoutContext.tsx`
