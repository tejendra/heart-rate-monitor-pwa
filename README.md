# Heart Rate Monitor PWA

A browser-based Progressive Web App that connects to a standard Bluetooth heart rate monitor, records workouts, and generates reports with heart rate zones, calories, and HRV.

## Features

- Connect to a heart rate monitor without installing a native app
- Record workouts with live BPM and Karvonen heart rate zones
- Workout reports with exercise time, average/max heart rate, calories, zone time, and HRV
- Heart rate over time chart and zone breakdown
- Save workouts locally on your device
- Export workout reports as JSON
- Installable PWA with offline access to saved history

## Supported browsers and devices

| Platform | Browser | BLE heart rate | Notes |
|----------|---------|----------------|-------|
| Android | Chrome | Yes | Recommended for testing with a physical HR strap |
| Desktop | Chrome | Yes | Works on macOS/Windows/Linux with a BLE adapter |
| iPhone / iPad | Safari, Chrome | No | Web Bluetooth is not available on iOS |
| Firefox, Edge, Opera | Any | No | Not supported in v1.0 |

Requirements:

- **HTTPS** (or `localhost`) for Web Bluetooth
- A standard **Bluetooth LE heart rate monitor** (Heart Rate GATT profile)
- **Chrome** for connecting to a monitor

On iOS you can still open the app, but you cannot connect a monitor. Saved workout history remains readable if it was created on another device.

## Getting started

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in Chrome.

### Test on a phone (same Wi‑Fi)

Web Bluetooth on a phone requires a **secure context**. Use an HTTPS tunnel or LAN HTTPS dev server.

**Option A — Cloudflare tunnel (quick HTTPS):**

```bash
npm run dev
cloudflared tunnel --url http://localhost:5173
```

Open the `https://*.trycloudflare.com` URL in **Chrome on Android**.

**Option B — LAN access (UI only over HTTP):**

```bash
npm run dev -- --host
```

Use the Network URL shown in the terminal. BLE will **not** work over plain `http://192.168.x.x` on a phone; use HTTPS for monitor testing.

The dev server is configured with `allowedHosts: true` for tunnel hostnames and disables PWA caching in development so changes show up immediately.

### Build for production

```bash
npm run build
npm run preview
```

### Run tests

```bash
npm test
```

## Usage

1. Open the app in **Chrome**
2. Go to **Settings** and set resting heart rate, age, weight (kg or lb), and max HR if needed
3. On **Home**, tap **Connect Heart Rate Monitor** and select your strap
4. Go to **Workout**, tap **Start Workout**, then **Stop Workout** when finished
5. Review the report, **Export JSON**, or find it later in **History**

## Heart rate zones

Zones use the **Karvonen method** (Heart Rate Reserve):

```
HRR = max heart rate − resting heart rate
zone BPM = resting HR + (HRR × zone %)
```

Default zone ranges: 50–60%, 60–70%, 70–80%, 80–90%, and 90–100% of HRR.

Time below zone 1 is excluded from zone totals but still appears on the heart rate chart.

## JSON export format

```json
{
  "schemaVersion": "1.0",
  "exportedAt": "2026-07-06T23:00:00.000Z",
  "report": { }
}
```

Exported files are named `workout-{id}-{date}.json`.

## Data storage

- Workouts and settings are stored in **IndexedDB** in your browser
- No cloud sync in v1.0
- Use **Settings → Clear All Data** to remove everything on this device

## Known limitations

- iOS does not support Web Bluetooth
- Calorie estimates are approximations
- HRV requires RR intervals from the monitor (many chest straps provide this; some wrist devices do not)
- PWA offline mode supports the app shell and saved history; connecting a monitor still requires a supported browser

## Manual QA checklist

Use this before calling a build v1.0-ready:

- [ ] Connect HR monitor, see live BPM within 2s of contact
- [ ] 5+ minute workout produces coherent zone breakdown (zone times ≈ duration)
- [ ] Max HR ≥ avg HR during workout
- [ ] HRV shown when RR data present; graceful message when absent
- [ ] Report persists after page refresh
- [ ] JSON export opens and validates against the schema above
- [ ] PWA install works on Android Chrome
- [ ] App shell loads offline; saved history readable offline

## Test devices

Verified during development with:

- Chrome on Android over HTTPS (Cloudflare tunnel or secure dev host)
- Standard BLE chest straps using the Bluetooth Heart Rate Service (`0x180D`)

Any monitor that exposes the standard Heart Rate GATT profile should work.

## Project structure

```
src/
  ble/          Web Bluetooth connection and GATT parsing
  workout/      Session recording
  analytics/    Zones, stats, calories, HRV, report builder
  storage/      IndexedDB persistence
  export/       JSON export
  pages/        App screens
```

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for the full v1.0 plan.
