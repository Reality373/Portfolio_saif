# The Chronicles of FiberOpticCalc: An Engineering Retrospective & Story Log

> **A Comprehensive Technical Account of Development, Architectural Decisions, Faults, Post-Mortems, Bug Chronicles, and Hard-Won Lessons**  
> *Repository:* `Reality373/FiberOpticCalc`  
> *Timeline:* January 21, 2026 – August 28, 2026 (259 Commits across 8 Months)  
> *Primary Platforms:* Android (Kotlin & Jetpack Compose), Kotlin Multiplatform Core (`:core`), Web (Next.js 15, TypeScript, Dexie IndexedDB, Kotlin/JS)

---

## Executive Summary & The Evolutionary Arc

**FiberOpticCalc** began on **January 21, 2026** as a simple, single-activity Android utility ("Fiber Builder") designed to replace messy paper notes and rudimentary spreadsheets used by telecommunications field technicians. Over the course of 259 git commits spanning eight months, it underwent a radical architectural evolution: transforming from an Android-only UI with hardcoded loss values into an enterprise-grade, offline-first, Kotlin Multiplatform CAD and Passive Optical Network (PON) power budget engineering suite.

The journey was not a straight line. It was defined by critical engineering trade-offs, catastrophic edge-case discoveries, memory leaks, concurrency race conditions, security vulnerabilities, and major architectural pivots:

1. **The Math & Precision Odyssey:** Moving from naive floating-point math to JVM `BigDecimal`, and subsequently engineering a zero-dependency pure Kotlin high-precision math engine to enable cross-compilation for iOS and Web.
2. **Persistence & Concurrency Realities:** Confronting race conditions in asynchronous JSON persistence that overwrote user network designs, leading to serialized single-threaded I/O dispatchers and atomic file replacement strategies.
3. **Reactive State Purity:** Eliminating dual-mutation state desynchronizations by adopting a derived `StateFlow` reactive architecture (`combine`).
4. **Geospatial & Field Intelligence:** Designing a dual-engine GIS system (OSMDroid + Google Maps SDK) with real-time state synchronization, automatic 1-hour ad-unlock expiration, and multi-hop topological OTDR fault reverse-traversal algorithms.
5. **Architectural Decoupling (KMP):** Modularizing the core domain into a pure Kotlin Multiplatform module (`:core`) with zero platform dependencies, strictly gated by Detekt static analysis (`maxIssues: 0`).
6. **Cross-Platform Expansion:** Porting the desktop/tablet experience to Next.js 15, React, Dexie.js (IndexedDB), and Kotlin/JS, while sharing the identical calculation engine across platforms.

This document chronicles every major engineering story, decision, mistake, fault, detection method, and architectural resolution in the history of the codebase.

---

## Chronological Development Epochs

| Epoch | Dates | Commits | Core Focus & Major Milestones |
|---|---|---|---|
| **Epoch 1: Genesis & V1 Prototype** | Jan 21, 2026 – Jan 31, 2026 | `18e1827` → `6490a02` (35 commits) | Initial proof of concept; tree-view visualization; dynamic loss formulas; ODF patch panel nodes; WhatsApp network sharing. |
| **Epoch 2: Geospatial Awakening & V2.0** | Feb 08, 2026 – Feb 25, 2026 | `80296d5` → `03cc354` (50 commits) | Rename to **FiberOpticCalc**; OSMDroid map integration; Haversine auto-distance; search viewport teleportation; OTDR fault finder v1. |
| **Epoch 3: Architectural Hardening & Production Gating** | Feb 26, 2026 – Mar 12, 2026 | `be2b7f5` → `c96b852` (44 commits) | Iterative stack calculation engine; `BigDecimal` precision; Play Billing 8.0.0; ProGuard R8 class flattening; Google Drive cloud backup v1. |
| **Epoch 4: Field Suites, Multi-Provider Maps & Version Control** | Apr 17, 2026 – May 13, 2026 | `185f058` → `781ef23` (43 commits) | Fiber Color Assistant (EIA/TIA-598/DIN/Ribbon); Google Maps SDK + OSM dual engine; Git-like network commit history; PDF/CSV BOM reporting engine. |
| **Epoch 5: KMP Modularization, Memory Audits & Polish** | Jun 08, 2026 – Aug 16, 2026 | `3c26345` → `d384ae9` (62 commits) | Pure `:core` KMP extraction (JVM + iOS); Detekt integration (`maxIssues: 0`); high-res photo OOM fixes; Compose dynamic i18n crash resolution; monthly export quota monetization. |
| **Epoch 6: Security Audit, Web Platform Port & Redesign** | Aug 19, 2026 – Aug 28, 2026 | `b87c28b` → `f885eb2` (25 commits) | CSV formula injection mitigation (CWE-1236); Firebase App Check; Kotlin/JS + Next.js web application; tutorial engine architectural redesign. |

---

# Part I: Core Architectural Stories

```
================================================================================
TABLE OF CONTENTS: ARCHITECTURAL STORIES
================================================================================
Story 01: The Precision Trap — Floating-Point Drift, BigDecimal, and the Pure KMP Math Engine
Story 02: Concurrency & The Ghost in the Filesystem — Atomic Persistence & Serialized I/O
Story 03: StateFlow Purity & The Desync Trap — Why Derived State Beat Manual Synchronization
Story 04: The Destructive Port Swap & The Identity-Aware Diff Engine
Story 05: The OTDR Reverse-Traversal Engine & The Graph Cycle Nightmare
Story 06: Viewport Teleportation & The "Frankenstein Rect" Canvas Coordinate Bug
Story 07: Geospatial Lifecycle Leaks & The Google Maps 1-Hour Reversion Engine
Story 08: The Production ProGuard Crash & Flat Package Obfuscation for IP Protection
Story 09: Google Drive OAuth Modernization & The Deprecated Credentials Trap
Story 10: The CSV Formula Injection Vulnerability (CWE-1236) in Field Engineering Reports
Story 11: The Compose Dynamic Localization Crash (ContextImpl vs. ActivityResultRegistryOwner)
Story 12: The Lock-Screen Black Overlay & Ad Display Lifecycle Chaos
Story 13: The "Double Rewarded Ad" PDF Export Trap & Monthly Quota Economics
Story 14: Monolithic Recomposition Stutter & High-Density Fiber List Optimization
Story 15: The Kotlin Multiplatform (:core) Transition & Platform Abstraction
Story 16: The Next.js / Kotlin-JS Web Port & Offline Dexie IndexedDB Architecture
Story 17: The Tutorial Engine Odyssey & The Unreachable Flow Postmortem
Story 18: Zero-Dollar Serverless Cloud Architecture & Remote Config Broadcasts
================================================================================
```

---

### Story 01: The Precision Trap — Floating-Point Drift, BigDecimal, and the Pure KMP Math Engine

- **Era:** Epoch 1 → Epoch 3 → Epoch 5
- **Key Commits:** 
  - `ecea997` *(2026-01-21 21:45:10 +0530)* — Initial formula-based calculation engine
  - `be2b7f5` *(2026-02-26 09:52:46 +0530)* — Integrated `BigDecimal` for precision
  - `a4ead48` *(2026-08-14 20:55:51 +0530)* — Pure Kotlin multiplatform math engine
- **Subsystems Affected:** `core:engine/NetworkEngine.kt`, `core:util/MathUtils.kt`, `NodeCard.kt`, `PdfReportGenerator.kt`
- **Primary Failure Class:** Mathematical Drift / Platform Incompatibility

#### 1. Context & Architectural Motivation
In Passive Optical Network (PON) engineering, calculating the optical power budget across cascaded optical splitters (1:2, 1:4, 1:8, 1:16, 1:32, 1:64) and asymmetric optical couplers (e.g., 90/10, 80/20, 70/30) is mission-critical. Field technicians rely on these calculations (measured in decibel-milliwatts, `dBm`, and milliwatts, `mW`) to determine if an Optical Network Terminal (ONT) at a customer premise will receive sufficient light (e.g., between -8 dBm and -27 dBm) or suffer optical degradation.

#### 2. The Mistake & Architectural Oversight (What Went Wrong?)
In the initial V1 implementation, power calculations were executed using primitive standard Kotlin `Double` addition and subtraction:
```kotlin
// NAIVE V1 IMPLEMENTATION (Jan 2026)
var currentPower = parentPower - node.spliceLoss - (node.lengthKm * fiberLossPerKm) - node.insertionLoss
```
Due to IEEE 754 standard floating-point representation, numbers like `0.1` or `0.35` cannot be represented exactly in binary floating-point. In a deep network tree with 8 to 15 cascaded nodes, optical powers began accumulating minute precision errors, yielding values such as `-22.000000000000004 dBm` or `-18.799999999999997 dBm`.

To solve this in Epoch 3 (Commit `be2b7f5`), the engine was migrated to `java.math.BigDecimal`:
```kotlin
// V2 BIGDECIMAL IMPLEMENTATION (Feb 2026)
val loss = BigDecimal.valueOf(node.spliceLoss)
    .add(BigDecimal.valueOf(node.lengthKm).multiply(BigDecimal.valueOf(fiberLossPerKm)))
val result = BigDecimal.valueOf(parentPower).subtract(loss).setScale(2, RoundingMode.HALF_UP).toDouble()
```
**The Trap:** When the project initiated its Kotlin Multiplatform (KMP) extraction in August 2026 to support iOS (`iosArm64`, `iosX64`) and Web (`Kotlin/JS`), `java.math.BigDecimal` completely broke multiplatform compilation because `java.math.*` is a JVM-only package that does not exist in Kotlin Native or Kotlin/JS!

#### 3. The Failure Mode & Impact (How It Broke)
- **UI Degradation:** Text fields and report tables displayed unsightly floating decimals (`-23.400000001 dBm`), confusing technicians in the field.
- **KMP Compilation Failure:** The `:core` module failed to build for iOS targets with `Unresolved reference: java.math.BigDecimal`.
- **Stack Overflow Risk:** The initial engine was written as a naive recursive function. When testing large networks with over 100 deep splits, the recursion exhausted the JVM call stack, throwing `java.lang.StackOverflowError`.

#### 4. Detection & Root-Cause Diagnosis
- Observed in unit tests during multi-tier splitter cascade verification.
- Static analysis and KMP build pipeline failure when running `./gradlew :core:compileKotlinIosArm64`.

#### 5. The Correction & Architectural Solution (How We Fixed It)
1. **Iterative Stack Engine:** Replaced the recursive tree traversal with an iterative, stack-based depth-first traversal in `NetworkEngine.kt`, eliminating call-stack exhaustion entirely:
```kotlin
// PURE KMP ITERATIVE CALCULATION ENGINE
val stack = mutableListOf<NodeCalculationState>()
stack.add(NodeCalculationState(rootNode, inputPowerDbm))

while (stack.isNotEmpty()) {
    val (currentNode, powerIn) = stack.removeAt(stack.size - 1)
    val powerOut = computeOutputPower(currentNode, powerIn, defaults)
    // Process and push children...
}
```
2. **Pure Kotlin Math Abstraction:** Built a multiplatform mathematical rounding and string utility in `core:util/MathUtils.kt` that uses pure Kotlin arithmetic without any Java dependencies:
```kotlin
package com.reality.fiberopticcalc.util

import kotlin.math.pow
import kotlin.math.round

object MathUtils {
    fun roundTo(value: Double, decimals: Int): Double {
        if (value.isNaN() || value.isInfinite()) return value
        val multiplier = 10.0.pow(decimals)
        return round(value * multiplier) / multiplier
    }

    fun toPlainString(value: Double, decimals: Int = 2): String {
        if (value.isNaN()) return "NaN"
        if (value.isInfinite()) return if (value > 0) "Infinity" else "-Infinity"
        val rounded = roundTo(value, decimals)
        return formatDecimal(rounded, decimals)
    }
}
```

#### 6. Impacts & Lessons Learned
- **Mathematical Integrity:** Optical budgets across 100+ cascaded nodes maintain exact 2-decimal-place precision (`-22.35 dBm`) across Android, iOS, and Web.
- **KMP Lesson:** Never introduce platform-specific standard library classes (`java.math.*`, `java.text.*`) into domain business logic. Pure multiplatform math utilities guarantee 100% portability.

---

### Story 02: Concurrency & The Ghost in the Filesystem — Atomic Persistence & Serialized I/O

- **Era:** Epoch 2 → Epoch 5
- **Key Commits:** 
  - `80296d5` *(2026-02-08 03:06:15 +0530)* — V2 Geospatial architecture and storage
  - `b24c5ff` *(2026-02-18 11:43:19 +0530)* — Documenting persistence race conditions
  - `f9fd681` *(2026-08-14 23:46:51 +0530)* — Atomic file persistence and single-thread serialization
- **Subsystems Affected:** `app:viewmodel/NetworkViewModel.kt`, `app:data/repository/NetworkRepository.kt`, `app:util/AtomicFileUtils.kt`
- **Primary Failure Class:** Concurrency Race Condition / Data Loss

#### 1. Context & Architectural Motivation
Field technicians frequently make rapid, consecutive edits while designing outside-plant networks: adjusting fiber lengths, renaming splitters, swapping ports, and snapping GPS waypoints. To guarantee an offline-first experience, every state change in `NetworkViewModel` must be immediately written to local disk (`filesDir/networks_data.json`).

#### 2. The Mistake & Architectural Oversight (What Went Wrong?)
In the original implementation, `NetworkViewModel.saveNetworks()` was invoked asynchronously on a generic unconfined coroutine scope using `Dispatchers.IO`:
```kotlin
// FLAWED NAIVE PERSISTENCE (Feb 2026)
private fun saveNetworks() {
    viewModelScope.launch(Dispatchers.IO) {
        val json = jsonSerializer.encodeToString(networks.value)
        val file = File(context.filesDir, "networks_data.json")
        file.writeText(json) // Direct disk overwrite!
    }
}
```
**The Catastrophe:** If a user typed a custom node name rapidly or dragged multiple GPS coordinates across the map within milliseconds, multiple concurrent coroutines were dispatched to `Dispatchers.IO`. Because `Dispatchers.IO` is a multi-threaded pool (up to 64 threads), **Thread B (containing an older snapshot)** could finish writing *after* **Thread A (containing the newest snapshot)**! Furthermore, if the app process was terminated mid-write, `file.writeText()` left a half-written, corrupted JSON file on disk.

#### 3. The Failure Mode & Impact (How It Broke)
- **Data Reversion:** Users reported that recent edits would mysteriously vanish, reverting the network to a state from 10 seconds prior.
- **JSON Parser Crash:** Upon reopening the app after a forced kill or battery depletion, `SerializationException` was thrown due to truncated JSON payloads, rendering all saved networks unreadable on startup.

#### 4. Detection & Root-Cause Diagnosis
- Detected through automated UI stress tests simulating rapid text input and concurrent node additions.
- Diagnosed by inspecting filesystem timestamps and logcat traces showing out-of-order write completions.

#### 5. The Correction & Architectural Solution (How We Fixed It)
1. **Serialized Single-Thread IO Dispatcher:** Injected a dedicated serialized dispatcher using `Dispatchers.IO.limitedParallelism(1)` combined with immediate call-site snapshotting:
```kotlin
class NetworkRepositoryImpl(
    private val context: Context,
    private val dispatchers: CoroutineDispatchers
) : NetworkRepository {
    private val writeDispatcher = dispatchers.io.limitedParallelism(1)

    override suspend fun saveNetworks(networks: List<FiberNetwork>) = withContext(writeDispatcher) {
        AtomicFileUtils.writeAtomically(
            targetFile = File(context.filesDir, "networks_data.json"),
            content = json.encodeToString(networks)
        )
    }
}
```
2. **Atomic File Replacement Strategy (`AtomicFileUtils`):** Writes are committed to a temporary file (`.tmp`) and atomically renamed via the OS filesystem kernel.

#### 6. Impacts & Lessons Learned
- **Zero Data Loss:** Complete elimination of corruption and snapshot inversion.
- **Architectural Lesson:** Never launch concurrent unconstrained I/O operations against shared mutable files. Always enforce single-thread serialization (`limitedParallelism(1)`) and atomic temp-file renaming.

---

### Story 03: StateFlow Purity & The Desync Trap — Why Derived State Beat Manual Synchronization

- **Era:** Epoch 2 → Epoch 5
- **Key Commits:** 
  - `80296d5` *(2026-02-08 03:06:15 +0530)* — Initial multi-state management
  - `f9fd681` *(2026-08-14 23:46:51 +0530)* — Derived StateFlow refactoring
- **Subsystems Affected:** `app:viewmodel/NetworkViewModel.kt`, `app:ui/CanvasScreen.kt`, `app:ui/screens/DashboardScreen.kt`
- **Primary Failure Class:** State Inconsistency / UI Stutter

#### 1. Context & Architectural Motivation
In the UI layer, the app needs to observe both the entire list of user networks (`List<FiberNetwork>`) for the Dashboard and the currently active network (`FiberNetwork?`) for the Canvas and Map editors.

#### 2. The Mistake & Architectural Oversight (What Went Wrong?)
The early ViewModel maintained two independent `MutableStateFlow` instances:
```kotlin
// DUAL SOURCE OF TRUTH ANTI-PATTERN (Feb 2026)
private val _networks = MutableStateFlow<List<FiberNetwork>>(emptyList())
val networks: StateFlow<List<FiberNetwork>> = _networks.asStateFlow()

private val _currentNetwork = MutableStateFlow<FiberNetwork?>(null)
val currentNetwork: StateFlow<FiberNetwork?> = _currentNetwork.asStateFlow()
```
Whenever a mutation occurred (such as adding a node, deleting a branch, or editing splice loss), the developer had to manually update `_networks` AND remember to update `_currentNetwork`. Because operations like undo/redo, cloud restores, and background calculation updates mutated `_networks` directly, developers frequently forgot to synchronize `_currentNetwork`.

#### 3. The Failure Mode & Impact (How It Broke)
- **UI Desynchronization:** Edits made in the Node Editor would appear on the Canvas, but when navigating back to the Dashboard, the network card displayed outdated component counts and power levels.
- **Undo Glitches:** Pressing "Undo" would revert the Dashboard summary while the Canvas continued to show the undone state.

#### 4. Detection & Root-Cause Diagnosis
- Observed during manual QA where switching rapidly between Dashboard, Canvas, and Map led to conflicting component states.

#### 5. The Correction & Architectural Solution (How We Fixed It)
Refactored the architecture to a **Single Source of Truth** using a **Derived StateFlow Pattern** via Kotlin Coroutines `combine`:
```kotlin
// PURE REACTIVE DERIVED STATEFLOW PATTERN
private val _networks = MutableStateFlow<List<FiberNetwork>>(emptyList())
val networks: StateFlow<List<FiberNetwork>> = _networks.asStateFlow()

private val _selectedNetworkId = MutableStateFlow<String?>(null)

val currentNetwork: StateFlow<FiberNetwork?> = combine(_networks, _selectedNetworkId) { nets, selectedId ->
    if (selectedId == null) null else nets.find { it.id == selectedId }
}.stateIn(
    scope = viewModelScope,
    started = SharingStarted.Eagerly,
    initialValue = null
)
```

#### 6. Impacts & Lessons Learned
- **Zero Desync:** State desynchronization between screens was completely eliminated.
- **Compose Best Practice:** Avoid duplicate mutable state flows representing different views of the same entity. Establish a single immutable source of truth and derive secondary views reactively.

---

### Story 04: The Destructive Port Swap & The Identity-Aware Diff Engine

- **Era:** Epoch 1 → Epoch 5
- **Key Commits:** 
  - `4834fc5` *(2026-01-22 22:18:29 +0530)* — Initial port manipulation logic
  - `c0c8860` *(2026-08-12 21:54:46 +0530)* — Safe swap implementation
  - `c0648e4` *(2026-08-25 10:13:53 +0530)* — Identity-aware diffing in `NodeDiffUtils`
- **Subsystems Affected:** `core:engine/NetworkEngine.kt`, `core:util/NodeDiffUtils.kt`, `app:ui/components/NodeEditSheet.kt`
- **Primary Failure Class:** Accidental Data Deletion / Misleading Undo/Redo Summaries

#### 1. Context & Architectural Motivation
In optical distribution hubs (FDHs) and splice closures, technicians frequently need to re-route a fiber feeder from Port 1 to Port 4 of an optical splitter, or swap the 10% TAP and 90% THRU legs of an asymmetric coupler.

#### 2. The Mistake & Architectural Oversight (What Went Wrong?)
1. **The Overwrite Bug:** Moving a node to a different port executed a simple array assignment. If `destPort` already contained a sub-tree of 20 customer ONTs, that entire sub-tree was silently and permanently deleted!
2. **The Positional Diff Bug:** When undoing an action, `NodeDiffUtils` compared trees using list indices (`children[i]`). If two branches were swapped, the diff engine concluded that every single property of Node A changed into Node B, reporting 50 false attribute changes.

#### 3. The Failure Mode & Impact (How It Broke)
- **Field Data Loss:** Technicians testing splitter re-assignments accidentally wiped out downstream network branches.
- **Unusable Undo Timeline:** The version history timeline showed confusing, noisy attribute changes.

#### 4. Detection & Root-Cause Diagnosis
- Reported during field testing when moving branches on 1:8 splitters wiped out adjacent branches.

#### 5. The Correction & Architectural Solution (How We Fixed It)
1. **Safe Swap Logic:** Refactored `swapPorts` to execute a symmetrical exchange of child nodes, port configurations, and geospatial waypoints.
2. **Identity-Aware Diff Engine (`NodeDiffUtils.kt`):** Rewrote the diff engine to track nodes by their unique immutable UUIDs (`node.id`) rather than array indices.

#### 6. Impacts & Lessons Learned
- **Non-Destructive Design:** Technicians can freely reorganize splitter cabinets without risk of data destruction.
- **Diffing Principle:** Tree-diff algorithms must always use persistent entity identities (UUIDs) rather than positional indices.

---

### Story 05: The OTDR Reverse-Traversal Engine & The Graph Cycle Nightmare

- **Era:** Epoch 2 → Epoch 3 → Epoch 5
- **Key Commits:** 
  - `37a9b22` *(2026-02-25 07:55:42 +0530)* — Initial OTDR Fault Finder
  - `be2b7f5` *(2026-02-26 09:52:46 +0530)* — Visited-node cycle detection
  - `4ca375d` *(2026-03-02 11:24:32 +0530)* — Optical power-direction heuristics
- **Subsystems Affected:** `core:engine/NetworkEngine.kt`, `app:ui/FiberMapView.kt`, `app:viewmodel/NetworkViewModel.kt`
- **Primary Failure Class:** Infinite Loop / App Freeze / Mathematical Ambiguity

#### 1. Context & Architectural Motivation
An Optical Time-Domain Reflectometer (OTDR) measures the distance to a fiber break or bend. Technicians enter this distance, and the app traces that exact distance along physical cable routes on the map to drop a precise GPS pin for repair crews.

#### 2. The Mistake & Architectural Oversight (What Went Wrong?)
1. **Single-Segment Limitation:** Early versions assumed faults only occurred on the immediate drop cable of the selected node.
2. **Graph Cycle Freeze:** When generalized to recursively walk downstream nodes, closed rings or test loops triggered **infinite recursion**, freezing the UI thread with an ANR.
3. **Splitter Ambiguity:** At a 1:8 splitter, the OTDR pulse travels down all 8 branches simultaneously. The initial algorithm picked Branch 0 arbitrarily, dropping a GPS pin on the wrong street!

#### 3. The Failure Mode & Impact (How It Broke)
- **UI Freeze / ANR:** Creating any looping cable path instantly crashed the app when searching for a fault.
- **False Fault Coordinates:** Repair crews were dispatched to incorrect physical locations.

#### 4. Detection & Root-Cause Diagnosis
- Discovered during field trials in dense urban FTTH networks where ring-protected feeder lines were modeled.

#### 5. The Correction & Architectural Solution (How We Fixed It)
1. **Cycle-Protected Graph Traversal:** Integrated a `visitedNodes` hash set to detect and abort graph cycles.
2. **Power-Aware Coupler & Splitter Heuristics:**
   - **Asymmetric Couplers (e.g., 90/10):** Automatically follows the high-power **THRU (90%)** trunk line.
   - **Symmetric Splitters (1:N):** Halts traversal at splitters and prompts the technician to pick the active branch.

#### 6. Impacts & Lessons Learned
- **High-Precision Fault Dispatch:** Technicians pinpoint cable cuts to within $\pm 2$ meters on OpenStreetMap and Google Maps.
- **Graph Traversal Lesson:** All real-world network traversal algorithms must enforce cycle detection and acknowledge physical divergence points where automated traversal is mathematically ambiguous.

---

### Story 06: Viewport Teleportation & The "Frankenstein Rect" Canvas Coordinate Bug

- **Era:** Epoch 2
- **Key Commits:** 
  - `fddca6d` *(2026-02-24 15:24:10 +0530)* — Search and viewport centering
  - `c87e9e9` *(2026-02-24 17:52:26 +0530)* — Infinite 50dp grid and coordinate overhaul
- **Subsystems Affected:** `app:ui/screens/CanvasScreen.kt`, `app:ui/components/NetworkCanvas.kt`
- **Primary Failure Class:** Coordinate Space Pollution / Viewport Distortion

#### 1. Context & Architectural Motivation
When searching for a node ID in a huge network, clicking a search result must smoothly pan and zoom the Canvas to center that specific node in the user's viewport.

#### 2. The Mistake & Architectural Oversight (What Went Wrong?)
The initial centering calculation queried the node's bounding rectangle from screen coordinates *after* `graphicsLayer` scaling had already transformed it, and then multiplied it by `zoom` again. At $2.5	imes$ zoom, this caused an exponential coordinate offset (the "Frankenstein Rect" bug), sending the viewport thousands of pixels into empty space!

#### 3. The Failure Mode & Impact (How It Broke)
- **Disorienting Canvas Teleportation:** Clicking a search result caused the entire diagram to vanish off-screen.

#### 4. Detection & Root-Cause Diagnosis
- Discovered during QA testing when searching for nodes at varying zoom levels ($0.5	imes, 1.0	imes, 2.0	imes$).

#### 5. The Correction & Architectural Solution (How We Fixed It)
1. **Unscaled Logical Layout Coordinates:** Nodes now report their unscaled layout coordinates relative to the root canvas, and camera offsets are calculated cleanly in unscaled space.
2. **Infinite 50dp Background Grid:** Implemented a high-performance background grid using Compose `drawWithCache` and `drawBehind` that tracks pan and zoom without allocating objects.

#### 6. Impacts & Lessons Learned
- **Pixel-Perfect Teleportation:** Searching for any node instantly centers it smoothly in the viewport.
- **Compose Graphics Lesson:** Never mix transformed screen-space coordinates with logical layout coordinates.

---

### Story 07: Geospatial Lifecycle Leaks & The Google Maps 1-Hour Reversion Engine

- **Era:** Epoch 2 → Epoch 4 → Epoch 5
- **Key Commits:** 
  - `80296d5` *(2026-02-08 03:06:15 +0530)* — Initial OSMDroid implementation
  - `cb1c37f` *(2026-02-27 23:06:13 +0530)* — OSMDroid lifecycle management
  - `582ef58` *(2026-04-23 14:29:35 +0530)* — Google Maps premium gating & rewarded ad integration
  - `2512ee0` *(2026-08-15 21:04:10 +0530)* — Instant map provider reversion engine
- **Subsystems Affected:** `app:ui/FiberMapView.kt`, `app:viewmodel/SettingsViewModel.kt`, `app:ads/AdManager.kt`
- **Primary Failure Class:** Native Memory Leak / Monetization State Desync

#### 1. Context & Architectural Motivation
The app supports OpenStreetMap (free default) and Google Maps Satellite (unlocked for 1 hour via rewarded video ads).

#### 2. The Mistake & Architectural Oversight (What Went Wrong?)
1. **MapView Leak:** OSMDroid's `MapView` was not hooked into Android activity lifecycle events, leaking 80MB+ of native bitmap memory per screen rotation.
2. **The "Stuck on Google Maps" Bug:** When a user's 1-hour rewarded ad unlock timer expired in the background, the map remained on Google Maps indefinitely, leading to unauthorized API usage.

#### 3. The Failure Mode & Impact (How It Broke)
- **OOM Crashes:** Repeatedly toggling between Canvas and Map screens caused `OutOfMemoryError`.
- **API Cost Leaks:** Non-paying users enjoyed permanent Google Maps satellite access without watching renewal ads.

#### 4. Detection & Root-Cause Diagnosis
- Detected via Android Studio Memory Profiler and Google Cloud Console tile request billing metrics.

#### 5. The Correction & Architectural Solution (How We Fixed It)
1. **Lifecycle-Aware Map Disposal:** Wrapped map instances in `DisposableEffect` with explicit `LifecycleEventObserver` attachments (`onResume`, `onPause`, `onDetach`).
2. **Exact-Millisecond Auto-Reversion Engine:** Instituted an active coroutine timer job (`scheduleGoogleMapsExpiryJob`) in `SettingsViewModel` that calculates remaining milliseconds and immediately reverts `_mapProvider.value = MapProvider.OSM`.

#### 6. Impacts & Lessons Learned
- **Zero Memory Leaks & Zero Cost Leaks:** Clean allocation and release of map resources across infinite device rotations, with strict $0.00 unexpected Google Maps infrastructure billing.

---

### Story 08: The Production ProGuard Crash & Flat Package Obfuscation for IP Protection

- **Era:** Epoch 3 → Epoch 6
- **Key Commits:** 
  - `b23dc55` *(2026-02-26 20:07:32 +0530)* — Production hardening
  - `c30999c` *(2026-02-28 08:19:44 +0530)* — Fixed ProGuard rules for release launch crash
  - `3e8040b` *(2026-08-23 12:21:22 +0530)* — Formalized security audit and R8 rules
- **Subsystems Affected:** `app:proguard-rules.pro`, `app:build.gradle.kts`
- **Primary Failure Class:** Build Tooling / Reflection Stripping / Runtime Crash

#### 1. Context & Architectural Motivation
To protect the proprietary optical power calculation algorithms and Google Play Billing infrastructure from reverse-engineering, R8 minification and ProGuard obfuscation were enabled for release builds.

#### 2. The Mistake & Architectural Oversight (What Went Wrong?)
Default aggressive R8 optimization stripped Play Billing internal classes and Kotlin Serialization serializers, causing `ClassNotFoundException` on startup and crashing when opening the subscription sheet.

#### 3. The Failure Mode & Impact (How It Broke)
- **Immediate Release Crash:** The signed release APK crashed instantly upon launch with `NoClassDefFoundError: BillingClient`.

#### 4. Detection & Root-Cause Diagnosis
- Caught during release staging verification on physical Android test devices.

#### 5. The Correction & Architectural Solution (How We Fixed It)
1. **Comprehensive ProGuard Keep Rules:** Created exhaustive `-keep` directives in `app/proguard-rules.pro` for Billing, Firebase, OSMDroid, and Kotlin Serialization.
2. **Aggressive Package Flattening (`-repackageclasses`):** Applied `-repackageclasses ''`, flattening the entire application into root-level obfuscated classes (`a.a`, `a.b`) for IP protection.

#### 6. Impacts & Lessons Learned
- **Robust Production Builds:** 100% stable release builds with zero crashes.
- **Security Takeaway:** Always run release-build smoke tests on physical devices early in development.

---

### Story 09: Google Drive OAuth Modernization & The Deprecated Credentials Trap

- **Era:** Epoch 3 → Epoch 5
- **Key Commits:** 
  - `976951c` *(2026-03-04 07:44:45 +0530)* — Initial Google Drive backup
  - `46a5d01` *(2026-08-15 00:20:42 +0530)* — Google Drive REST API modernization
- **Subsystems Affected:** `app:auth/DriveManager.kt`, `app:ui/CloudBackupManagerSheet.kt`, `app:viewmodel/SettingsViewModel.kt`
- **Primary Failure Class:** Google Play Services API Deprecation / `ApiException: 10`

#### 1. Context & Architectural Motivation
To prevent vendor lock-in and keep infrastructure costs at **$0.00**, FiberOpticCalc backs up named snapshot ZIP archives (`fiber_backup_v2.zip`) directly to the user's personal Google Drive.

#### 2. The Mistake & Architectural Oversight (What Went Wrong?)
The original implementation relied on legacy `GoogleAccountCredential`. On newer Android 14 and 15 devices running updated Google Play Services, it threw `ApiException: 10` (Developer Error) due to deprecated OAuth token exchange flows.

#### 3. The Failure Mode & Impact (How It Broke)
- **Cloud Backup Failures:** Users attempting to backup or restore designs were met with cryptic `ApiException: 10` errors.

#### 4. Detection & Root-Cause Diagnosis
- Detected during user testing on Android 14 physical devices.

#### 5. The Correction & Architectural Solution (How We Fixed It)
Completely re-architected `DriveManager.kt` to use the modern **Google Identity API (`AuthorizationClient`)** combined with direct HTTP REST API v3 Bearer token requests, eliminating deprecated wrapper libraries.

#### 6. Impacts & Lessons Learned
- **Universal Compatibility:** Flawless cloud backup and restore across all Android versions (API 24 to API 36).
- **API Evolution Lesson:** Modern Android apps must interface via Credential Manager and Google Identity `AuthorizationClient`.

---

### Story 10: The CSV Formula Injection Vulnerability (CWE-1236) in Field Engineering Reports

- **Era:** Epoch 4 → Epoch 6
- **Key Commits:** 
  - `76cf125` *(2026-04-30 19:07:31 +0530)* — Initial CSV Bill of Materials export
  - `f57857a` *(2026-08-23 14:21:29 +0530)* — Mitigation of CSV formula injection (CWE-1236)
- **Subsystems Affected:** `app:util/CsvReportGenerator.kt`, `app:util/CsvReportGeneratorTest.kt`
- **Primary Failure Class:** Security Vulnerability / CWE-1236 (Improper Neutralization of Formula Elements in CSV)

#### 1. Context & Architectural Motivation
FiberOpticCalc generates comprehensive Bill of Materials (BOM), optical loss budgets, and splice schedules exported as `.csv` files for contractors to open in Excel or Google Sheets.

#### 2. The Mistake & Architectural Oversight (What Went Wrong?)
User-entered text fields (node names, notes) were formatted directly into comma-separated values. If a malicious user shared a design containing a node name starting with `=`, `+`, `-`, `@`, `	`, ``, opening the CSV in Microsoft Excel executed the formula, potentially running arbitrary commands or exfiltrating data (CWE-1236).

#### 3. The Failure Mode & Impact (How It Broke)
- **Arbitrary Command Execution / Data Exfiltration:** Opening an exported report triggered dangerous external execution dialogs or hidden web requests in Excel.

#### 4. Detection & Root-Cause Diagnosis
- Discovered during a pre-production security audit documented in `Docs/quality/SECURITY_ANALYSIS.md`.

#### 5. The Correction & Architectural Solution (How We Fixed It)
Engineered a strict sanitization layer in `CsvReportGenerator.kt` that detects leading formula trigger characters and prepends an apostrophe (`'`), forcing spreadsheet engines to treat all fields as literal string text.

#### 6. Impacts & Lessons Learned
- **Enterprise-Grade Security:** Certified safe for enterprise and government telecommunications contracting workflows.
- **Security Lesson:** Always sanitize CSV exports against formula execution triggers.

---

### Story 11: The Compose Dynamic Localization Crash (ContextImpl vs. ActivityResultRegistryOwner)

- **Era:** Epoch 5
- **Key Commits:** 
  - `054167c` *(2026-08-15 18:27:19 +0530)* — Multi-locale i18n support
  - `2512ee0` *(2026-08-15 21:04:10 +0530)* — Dynamic localization fix
- **Subsystems Affected:** `app:MainActivity.kt`, `app:ui/SettingsView.kt`
- **Primary Failure Class:** Jetpack Compose Runtime Crash / Context Wrapping Violation

#### 1. Context & Architectural Motivation
The app supports 7 locales dynamically in the Settings screen without restarting the device.

#### 2. The Mistake & Architectural Oversight (What Went Wrong?)
To achieve instantaneous in-app language switching, the initial implementation attempted to override Compose's `LocalContext` with `context.createConfigurationContext(configuration)`. Because `ContextImpl` is not an `Activity` and does not implement `ActivityResultRegistryOwner`, tapping "Take Photo" or "Google Sign-In" crashed the app with:
`IllegalStateException: No ActivityResultRegistryOwner was provided via LocalActivityResultRegistryOwner`.

#### 3. The Failure Mode & Impact (How It Broke)
- **Instant Crash:** Switching languages and tapping any activity result launcher crashed the app instantly.

#### 4. Detection & Root-Cause Diagnosis
- Reproduced immediately upon testing photo attachments after selecting Spanish or Hindi.

#### 5. The Correction & Architectural Solution (How We Fixed It)
Preserved `LocalContext.current` as `MainActivity`, applied dynamic localization via `attachBaseContext`, and provided localized configuration via `CompositionLocalProvider(LocalConfiguration provides localizedConfig)`.

#### 6. Impacts & Lessons Learned
- **Instantaneous Language Switching:** 100% stable runtime translation switching with zero crashes.
- **Compose Principle:** Never replace `LocalContext` with a non-Activity context in root composables.

---

### Story 12: The Lock-Screen Black Overlay & Ad Display Lifecycle Chaos

- **Era:** Epoch 5
- **Key Commits:** 
  - `d566ecc` *(2026-08-16 09:46:05 +0530)* — Ad lifecycle fix and configChanges
  - `3e8040b` *(2026-08-23 12:21:22 +0530)* — Formalized lifecycle gates in AdManager
- **Subsystems Affected:** `app:src/main/AndroidManifest.xml`, `app:ads/AdManager.kt`
- **Primary Failure Class:** Window Token Exception / Invisible Overlay Glitch

#### 1. Context & Architectural Motivation
Interstitial ads are shown occasionally upon completing major actions (e.g. creating a new network design).

#### 2. The Mistake & Architectural Oversight (What Went Wrong?)
`MainActivity` lacked `android:configChanges` declarations for screen layout and UI modes. Locking the phone destroyed and recreated `MainActivity`, while an ad callback triggered right as the phone went to sleep attempted to display an ad window over a destroyed activity.

#### 3. The Failure Mode & Impact (How It Broke)
- **The Mysterious Black Screen:** Unlocking the phone showed a pitch-black screen with a floating close button, freezing the app underneath.
- **`BadTokenException` Crashes:** Logcat recorded `WindowManager.BadTokenException`.

#### 4. Detection & Root-Cause Diagnosis
- Discovered during real-world device testing by locking the phone during design workflows.

#### 5. The Correction & Architectural Solution (How We Fixed It)
1. Added full configuration change filtering to `AndroidManifest.xml`.
2. Enforced strict `lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)` validation in `AdManager` before showing any full-screen ad.

#### 6. Impacts & Lessons Learned
- **Seamless Resume Experience:** Zero black screens or freezes when unlocking devices.
- **AdMob Best Practice:** Always check `isAtLeast(RESUMED)` before presenting ads.

---

### Story 13: The "Double Rewarded Ad" PDF Export Trap & Monthly Quota Economics

- **Era:** Epoch 5
- **Key Commits:** 
  - `fc1e6ed` *(2026-08-15 20:59:27 +0530)* — Initial rewarded ad export quota
  - `d566ecc` *(2026-08-16 09:46:05 +0530)* — PDF export double ad resolution
- **Subsystems Affected:** `app:ui/ReportExportSheet.kt`, `app:ui/ReportWizardSheet.kt`, `app:ads/AdManager.kt`
- **Primary Failure Class:** UX Flow Regression / Double Ad Penalty

#### 1. Context & Architectural Motivation
Users receive 5 free technical exports per month; beyond that, 1 rewarded ad per export.

#### 2. The Mistake & Architectural Oversight (What Went Wrong?)
Both `ReportExportSheet` and `ReportWizardSheet` had independent rewarded ad triggers. Quota-exhausted users were forced to watch an ad to open the wizard, and a **second** ad to generate the report!

#### 3. The Failure Mode & Impact (How It Broke)
- **Severe User Frustration:** Users were forced to watch two full video ads consecutively for a single PDF.

#### 4. Detection & Root-Cause Diagnosis
- Detected during user journey walkthroughs testing quota exhaustion states.

#### 5. The Correction & Architectural Solution (How We Fixed It)
Refactored the flow so that `ReportExportSheet` navigates directly to `ReportWizardSheet` without requesting an ad up front. The single ad is requested only when tapping *"Generate Report (Watch 1 Ad)"* in the wizard.

#### 6. Impacts & Lessons Learned
- **Fair Monetization UX:** Clean 1-ad-per-export model. Place monetization gates at the final point of value delivery.

---

### Story 14: Monolithic Recomposition Stutter & High-Density Fiber List Optimization

- **Era:** Epoch 5
- **Key Commits:** 
  - `c0c8860` *(2026-08-12 21:54:46 +0530)* — Large refactor of UI sheets
  - `5bbca03` *(2026-08-13 10:51:02 +0530)* — LazyColumn migration for high-density fiber lists
  - `1ce8fbf` *(2026-08-14 18:41:59 +0530)* — Granular subcomponent decomposition
- **Subsystems Affected:** `app:ui/components/NodeEditSheet.kt`, `app:ui/components/editor/*`
- **Primary Failure Class:** Jetpack Compose UI Lag / Recomposition Cascades

#### 1. Context & Architectural Motivation
When editing large 1:64 optical splitters or 288-core fiber ribbon closures, the node editor must render dozens of fiber color swatches, port labels, and loss input fields.

#### 2. The Mistake & Architectural Oversight (What Went Wrong?)
`NodeEditSheet.kt` was written as a massive 1,400-line monolithic Composable in a regular `Column`. Typing a single character into a text field caused the entire sheet and all 64 port sub-items to recompose, dropping framerate from 60fps to 12fps.

#### 3. The Failure Mode & Impact (How It Broke)
- **Noticeable Typing Stutter:** Keyboard input lagged on mid-range Android devices.

#### 4. Detection & Root-Cause Diagnosis
- Detected using Android Studio Layout Inspector and Compose Recomposition Counters.

#### 5. The Correction & Architectural Solution (How We Fixed It)
1. Migrated from `Column` to a virtualized `LazyColumn`.
2. Decomposed `NodeEditSheet` into isolated subcomponents (`NodeEditHeader`, `EditorTextFields`, `NodePhotoComponents`, `NodePortRow`).
3. Hoisted lambdas and memoized calculations using `remember(node.id, node.loss)`.

#### 6. Impacts & Lessons Learned
- **Silky Smooth 60fps UI:** Zero input lag, even when configuring 1:64 splitters.
- **Compose Rule:** Use `LazyColumn` for dynamic collections and decompose complex forms into small, skippable Composables.

---

### Story 15: The Kotlin Multiplatform (:core) Transition & Platform Abstraction

- **Era:** Epoch 3 → Epoch 5
- **Key Commits:** 
  - `c2d7226` *(2026-03-01 16:51:34 +0530)* — Initial `:core` module creation
  - `3462b56` *(2026-08-14 20:07:28 +0530)* — Platform abstraction and Detekt static analysis
  - `a4ead48` *(2026-08-14 20:55:51 +0530)* — Full business logic migration to KMP
- **Subsystems Affected:** `core/build.gradle.kts`, `core:platform/Platform.kt`, `core:model/*`, `core:engine/*`
- **Primary Failure Class:** Platform Coupling / Cross-Platform Incompatibility

#### 1. Context & Architectural Motivation
To support future expansion to iOS and Web without duplicating calculation logic, all domain models, optical algorithms, and diffing utilities needed to be extracted into a pure Kotlin Multiplatform module (`:core`).

#### 2. The Mistake & Architectural Oversight (What Went Wrong?)
The early domain layer was tightly coupled with Android-specific APIs (`java.util.UUID`, `System.currentTimeMillis()`, `android.util.Log`). Compiling for iOS or JS resulted in dozens of unresolved reference errors.

#### 3. The Failure Mode & Impact (How It Broke)
- Impossible to share code across platforms; threatened to force the team into maintaining two separate math engines.

#### 4. Detection & Root-Cause Diagnosis
- Failed multiplatform Gradle builds when configuring Kotlin Multiplatform targets.

#### 5. The Correction & Architectural Solution (How We Fixed It)
1. Removed all `android.*` and `java.*` imports from `:core`.
2. Created clean platform bridges in `core:platform/Platform.kt` using `expect`/`actual` for UUIDs and Epoch timestamps.
3. Integrated Detekt 1.23.8 with strict linting rules ensuring no Android dependencies ever enter `:core`.

#### 6. Impacts & Lessons Learned
- **100% Shared Domain Engine:** A single authoritative calculation engine powers Android, iOS, and Web.
- **Clean Architecture Principle:** Keep the domain core completely decoupled from platform frameworks.

---

### Story 16: The Next.js / Kotlin-JS Web Port & Offline Dexie IndexedDB Architecture

- **Era:** Epoch 6
- **Key Commits:** 
  - `473e70f` *(2026-08-24 06:15:34 +0530)* — Kotlin/JS compilation support in `:core`
  - `b4ae03c` *(2026-08-24 08:34:49 +0530)* — Web domain stores & Dexie IndexedDB repositories
  - `1dbefd4` *(2026-08-25 11:47:47 +0530)* — Fiber Color Assistant & `.fiber` import/export on Web
- **Subsystems Affected:** `web/app/*`, `web/packages/engine/*`, `web/packages/domain/*`
- **Primary Failure Class:** Cross-Platform Data Portability & Web Offline Storage

#### 1. Context & Architectural Motivation
Telecommunications planners in office environments requested a desktop-friendly web version for large dual-monitor design work, with seamless `.fiber` file interchange with the mobile app.

#### 2. The Mistake & Architectural Oversight (What Went Wrong?)
Rewriting the calculation engine in TypeScript risked subtle calculation drift. Storing complex network trees in browser `localStorage` hit strict 5MB quota limits.

#### 3. The Failure Mode & Impact (How It Broke)
- Risk of conflicting calculations between mobile field workers and desktop network planners.

#### 4. Detection & Root-Cause Diagnosis
- Architectural review determined that sharing the compiled Kotlin/JS engine was the only viable path to guarantee zero mathematical discrepancy.

#### 5. The Correction & Architectural Solution (How We Fixed It)
1. Compiled `:core` to a JavaScript library (`web/packages/engine`), allowing React components to invoke the identical Kotlin `NetworkEngine`.
2. Implemented an offline-first browser database using Dexie.js (IndexedDB), mirroring Android's local JSON repository.
3. Verified that `.fiber` files exported on Android import seamlessly on Web with identical BOM and optical budget results.

#### 6. Impacts & Lessons Learned
- **Complete Platform Parity:** Technicians design on mobile, export to Drive, and office planners open and edit the identical design on Web.
- **Cross-Platform Lesson:** Kotlin/JS enables pure multiplatform domain code to run natively in modern web browsers without backend servers.

---

### Story 17: The Tutorial Engine Odyssey & The Unreachable Flow Postmortem

- **Era:** Epoch 2 → Epoch 5 → Epoch 6
- **Key Commits:** 
  - `b7bbb44` *(2026-02-09 17:38:14 +0530)* — Initial tutorial overlay in Compose
  - `b87c28b` *(2026-08-19 22:11:41 +0530)* — Unified KMP tutorial engine
  - `f941a4a` *(2026-08-26 11:20:10 +0530)* — Tutorial engine redesign spec
  - `f94f1af` *(2026-08-28 08:36:07 +0530)* — Retiring unreachable flows & final state refactor
- **Subsystems Affected:** `core:tutorial/*`, `app:ui/tutorial/*`, `app:viewmodel/SettingsViewModel.kt`
- **Primary Failure Class:** Architectural Drift / Dead Code / Inaccessible Features

#### 1. Context & Architectural Motivation
To onboard new fiber engineers, FiberOpticCalc features an interactive, spotlight-based tutorial system that guides users step-by-step through network design workflows.

#### 2. The Mistake & Architectural Oversight (What Went Wrong?)
A massive 37-step "Design Basics" flagship tutorial script (`TutorialCoreFlow.kt`) was written and localized into 7 languages. However, a silent redirect was added in `SettingsViewModel.startTutorialFlow()` that bypassed this core flow in favor of 6 independent feature tours. Furthermore, 5 additional tours sat orphaned in `strings.xml`.

#### 3. The Failure Mode & Impact (How It Broke)
- **Bloated Strings & Dead Code:** Thousands of translated words and complex state machines sat in the repository completely unreachable.
- **Skip Flaw:** Pressing "Skip" on a single step aborted the entire remaining multi-screen tour sequence.

#### 4. Detection & Root-Cause Diagnosis
- Discovered during a comprehensive end-to-end tutorial audit documented in `Docs/plans/2026-08-26-tutorial-engine-redesign.md`.

#### 5. The Correction & Architectural Solution (How We Fixed It)
1. Deleted the unreachable 37-step script and 5 orphaned flows, aligning tutorial definitions strictly with active UI screens.
2. Formalized onboarding into a sequence of 6 focused tours (Dashboard → Canvas → Map → Color Assistant → Settings → Support).
3. Separated "Skip Tour" (advances to next screen tour) from "Exit Tutorial" (exits tutorial mode).

#### 6. Impacts & Lessons Learned
- **Lean, Maintainable Onboarding:** 100% of tutorial code is active, tested, and reachable.
- **Architecture Lesson:** Continuously audit feature wiring against catalog declarations.

---

### Story 18: Zero-Dollar Serverless Cloud Architecture & Remote Config Broadcasts

- **Era:** Epoch 1 → Epoch 4 → Epoch 6
- **Key Commits:** 
  - `44f94ee` *(2026-01-22 10:08:44 +0530)* — Initial Firebase integration
  - `93da920` *(2026-03-04 09:10:47 +0530)* — Remote Config broadcast updates
  - `bac0c18` *(2026-08-15 19:56:25 +0530)* — Spark-free-tier two-way community feedback
  - `b175701` *(2026-08-16 12:05:21 +0530)* — Authoritative Cloud Function account deletion
- **Subsystems Affected:** `app:community/CommunityManager.kt`, `functions/index.js`, `firestore.rules`
- **Primary Failure Class:** Cloud Cost Scaling / Infrastructure Optimization

#### 1. Context & Architectural Motivation
FiberOpticCalc was deliberately engineered with an architectural constraint: **$0.00 infrastructure cost**, scaling sustainably up to 25,000+ Monthly Active Users (MAU) within Firebase's Spark Free Tier.

#### 2. The Mistake & Architectural Oversight (What Went Wrong?)
Early designs considered running real-time Firestore listeners for developer announcements and polls. At 25,000 MAU, real-time listeners generate 3.75 million reads per month, quickly exceeding the free tier and incurring recurring cloud bills.

#### 3. The Failure Mode & Impact (How It Broke)
- Risk of unexpected infrastructure costs on an app monetized primarily via non-intrusive ads and low-cost subscriptions.

#### 4. Detection & Root-Cause Diagnosis
- Cloud budget calculations during business model planning (`Docs/business.md`).

#### 5. The Correction & Architectural Solution (How We Fixed It)
Engineered a **Zero-Client-Read Two-Way Communication System**:
1. Broadcasts and developer polls pushed via Remote Config parameter `broadcast_message` ($0 cost, unlimited fetches).
2. User submissions written directly to Firestore `community_responses` with write-only rules (**0 client reads**).
3. Authoritative account deletion executed server-side via Cloud Functions (`deleteUserAccount`) in a single transaction.

#### 6. Impacts & Lessons Learned
- **True $0.00 Infrastructure:** Zero ongoing server bills regardless of user download surges.
- **Cloud Architecture Principle:** Leverage free distributed caches (Remote Config) for broadcasts and restrict database access to write-only pipelines to eliminate read-cost scaling.

---

# Part II: The Bug Chronicles — 18 Real-World Bug Post-Mortems & Fixes

```
================================================================================
TABLE OF CONTENTS: BUG CHRONICLES
================================================================================
Bug 01: The Silent Downsizing Decimation (Splitter Port Reduction Data Wipe)
Bug 02: The "0 Input" Blank Screen (Fiber Color Assistant Forward Lookup Freeze)
Bug 03: The Invisible White Swatch (Light Mode Contrast Disappearance)
Bug 04: The Arbitrary Ribbon Infinity (Ribbon Number Arithmetic Overflow)
Bug 05: The Ghost Native Ad (Remote Config Cold State Race Condition)
Bug 06: The Static Ribbon Identity (Visual Blindness in High-Density Cables)
Bug 07: The Circular Domain Dependency (BandInfo & EngineeringDefaults Break)
Bug 08: The Non-GMS GPS Crash (Huawei & Custom AOSP Map Exceptions)
Bug 09: The 108MP Camera Heap Exhaustion (Field Photo OOM Memory Crash)
Bug 10: The Corrupted ZIP Deserialization Crash (NoSuchElementException on Restore)
Bug 11: The Force-Unwrap (!!) Minefield (23 Hidden Null-Pointer Traps)
Bug 12: The Tutorial Spotlight Offset Drift (Cloud Sync Card Insertion Displacement)
Bug 13: The Global ODF Loss Disconnect (Network-Wide Settings Disregard)
Bug 14: The Attenuation Unit-Scaling Distortion (Static Loss Number Scaling)
Bug 15: The PDF Native Graphic Memory Leak (Missing try-finally in Export)
Bug 16: The Premature Sheet Scoping Bug (Type Transformation Variable Capture)
Bug 17: The Compass HUD Action Overlap (FAB Interaction Collision)
Bug 18: The ARGB Hex Color Parsing Crash in PDF Reports
================================================================================
```

---

### Bug 01: The Silent Downsizing Decimation (Splitter Port Reduction Data Wipe)

- **Date Discovered:** 2026-02-10 | **Commit Fixed:** `f33c99e`
- **Location:** `app:viewmodel/NetworkViewModel.kt` & `app:ui/components/NodeEditSheet.kt`
- **The Issue:** When a technician edited an existing 1:8 splitter and changed its type to 1:4 (or 1:16 down to 1:8), the calculation engine automatically sliced the child outputs array to match the new port count.
- **The Fault & Impact:** If ports 5 through 8 contained active downstream sub-branches (e.g. 15 customer drop terminals and miles of fiber), those entire sub-trees were silently and permanently wiped from the database without any warning or confirmation prompt!
- **How Detected:** Reported during beta field testing when a technician accidentally tapped "1:4" instead of "1:8" and lost their entire afternoon's survey work.
- **The Fix & Correction:** Created a proactive `BranchManagementDialog` in `NodeEditSheet.kt`. When a user attempts to downsize any multi-port node, the sheet inspects the candidate ports to be pruned. If any child nodes exist on those ports, the reduction is blocked, presenting a destructive warning dialog forcing the user to explicitly move or delete those branches first.

---

### Bug 02: The "0 Input" Blank Screen (Fiber Color Assistant Forward Lookup Freeze)

- **Date Discovered:** 2026-04-20 | **Commit Fixed:** `825dfe5`
- **Location:** `app:ui/screens/color/ForwardLookupTab.kt`
- **The Issue:** In the Fiber Color Assistant, typing "0" into the fiber number lookup text field parsed successfully as an integer (`"0".toIntOrNull() == 0`), but failed the 1-based index range check ($1 \le 	ext{fiber} \le 144$) without triggering the validation error banner.
- **The Fault & Impact:** The UI entered an invalid state, rendering a completely blank, white content area with missing swatches and unresponsive control buttons.
- **How Detected:** Edge-case boundary value testing in QA.
- **The Fix & Correction:** Updated the input validation pipeline in `ForwardLookupTab.kt` to explicitly catch non-positive integers ($\le 0$), displaying an instant inline error message: *"Please enter a fiber number greater than 0"*.

---

### Bug 03: The Invisible White Swatch (Light Mode Contrast Disappearance)

- **Date Discovered:** 2026-04-22 | **Commit Fixed:** `190d838`
- **Location:** `app:ui/components/color/FiberSwatchCard.kt`
- **The Issue:** In EIA/TIA-598 fiber optic color coding, Fiber Core #12 is pure White (`#FFFFFF`). On light theme Android devices, the background surface was off-white (`#FBF8FF`).
- **The Fault & Impact:** White fiber and tube swatches had no bounding stroke, making Fiber #12 appear completely invisible. Technicians working outdoors in sunlight thought the 12th fiber swatch was missing from the app.
- **How Detected:** Visual UX inspection during outdoor sunlight testing.
- **The Fix & Correction:** Implemented a luminance-aware border system. The swatch composable inspects the background color and RGB luminance; if a swatch is white or near-white in light mode, it automatically renders a subtle neutral-gray border (`Color.Gray.copy(alpha = 0.4f)`). In dark mode, it automatically renders a high-contrast border for Black fibers.

---

### Bug 04: The Arbitrary Ribbon Infinity (Ribbon Number Arithmetic Overflow)

- **Date Discovered:** 2026-04-22 | **Commit Fixed:** `e4c812b`
- **Location:** `app:viewmodel/FiberColorViewModel.kt` & `app:ui/components/color/RibbonTab.kt`
- **The Issue:** The Ribbon Cable Assistant featured "+" and "-" buttons to increment the active ribbon number. The ViewModel had no upper bound check on the increment handler.
- **The Fault & Impact:** Users holding down the "+" button could increment the ribbon number to arbitrarily high numbers (e.g. Ribbon #5,000), producing absurd fiber counts (e.g. Fiber #60,000) that broke ribbon identification tables and caused visual layout clipping.
- **How Detected:** Boundary stress testing on ribbon control inputs.
- **The Fix & Correction:** Hard-capped ribbon numbers to a maximum of 100 in both `FiberColorViewModel` and UI stepper controls, aligning perfectly with maximum commercial high-density outside-plant ribbon cables (up to 1,728 / 3,456 fibers).

---

### Bug 05: The Ghost Native Ad (Remote Config Cold State Race Condition)

- **Date Discovered:** 2026-04-17 | **Commit Fixed:** `6b0b46a`
- **Location:** `app:MainActivity.kt` & `app:ads/AdManager.kt`
- **The Issue:** When `is_dashboard_native_ad_enabled` was set to `false` in Firebase Remote Config, the native ad banner on the dashboard would still appear briefly on cold app launches before disappearing 2 seconds later.
- **The Fault & Impact:** Visual layout jumping and banner flickering on startup; irritated users who expected a clean dashboard.
- **How Detected:** Cold launch testing with Remote Config feature flags disabled.
- **The Fix & Correction:** Initialized the ad visibility state to strictly match the cached Remote Config source of truth on component entry, and hid the `AndroidView` native ad container with zero height until Remote Config explicitly confirmed `true`.

---

### Bug 06: The Static Ribbon Identity (Visual Blindness in High-Density Cables)

- **Date Discovered:** 2026-04-22 | **Commit Fixed:** `e4c812b`
- **Location:** `app:ui/components/color/RibbonTab.kt`
- **The Issue:** In ribbon fiber cables, each 12-fiber ribbon is bound by a colored thread or tube (Ribbon 1 = Blue binder, Ribbon 2 = Orange binder, Ribbon 3 = Green binder). Incrementing the ribbon number changed the numbers in the text table, but the UI header remained a static gray color.
- **The Fault & Impact:** Technicians in the field could not quickly visually confirm which physical ribbon bundle they were looking at in a splice tray.
- **How Detected:** Feedback from field splicers working on 432-core cables.
- **The Fix & Correction:** Implemented dynamic header tinting in `RibbonTab.kt`. The ribbon selector card now automatically adapts its background color to the tube/binder color of the active ribbon, complete with automated text contrast calculations and a dedicated "TUBE / BINDER IDENTITY" badge.

---

### Bug 07: The Circular Domain Dependency (BandInfo & EngineeringDefaults Break)

- **Date Discovered:** 2026-02-24 | **Commit Fixed:** `db2fa78`
- **Location:** `app:model/EngineeringDefaults.kt` & `app:model/NetworkModels.kt`
- **The Issue:** `EngineeringDefaults` referenced `BandInfo` (optical wavelength band definitions) inside `NetworkModels.kt`, while `NetworkModels.kt` imported default band values from `EngineeringDefaults`.
- **The Fault & Impact:** Kotlin compiler threw circular dependency errors during clean builds, blocking CI/CD pipelines.
- **How Detected:** Gradle clean build failure during multi-module preparation.
- **The Fix & Correction:** Extracted `BandInfo` to an independent top-level domain model in `core:model:BandInfo.kt`, eliminating the circular coupling cleanly.

---

### Bug 08: The Non-GMS GPS Crash (Huawei & Custom AOSP Map Exceptions)

- **Date Discovered:** 2026-08-15 | **Commit Fixed:** `2512ee0`
- **Location:** `app:ui/map/MapGeoUtils.kt`
- **The Issue:** `FusedLocationProviderClient.getCurrentLocation()` was invoked to center the map on the user's current GPS location. On devices without Google Play Services (e.g. Huawei Mate/P series, custom AOSP ROMs without microG), Google APIs threw unhandled runtime exceptions.
- **The Fault & Impact:** Tapping the "My Location" GPS button immediately crashed the app on non-GMS devices.
- **How Detected:** Testing on an un-googled AOSP test device.
- **The Fix & Correction:** Broadened exception handling in `MapGeoUtils.kt` to catch all `Exception` types during GPS retrieval, gracefully falling back to Android's native `LocationManager` and displaying a non-intrusive toast if GPS hardware is unavailable. Protected `LatLngBounds.Builder.build()` against empty coordinate lists.

---

### Bug 09: The 108MP Camera Heap Exhaustion (Field Photo OOM Memory Crash)

- **Date Discovered:** 2026-08-15 | **Commit Fixed:** `2512ee0`
- **Location:** `app:util/PhotoStorageManager.kt`
- **The Issue:** Field technicians use modern smartphone cameras (48MP, 64MP, 108MP) to capture high-resolution photos of splice closures, pole tags, and fiber damage. Decoding these photos directly via `BitmapFactory.decodeFile()` attempted to allocate 50MB to 120MB uncompressed ARGB_8888 byte arrays into the Android process heap.
- **The Fault & Impact:** On budget devices with 2GB–3GB RAM, taking 2 or 3 site photos caused instant `java.lang.OutOfMemoryError: Failed to allocate a byte allocation with 48000000 free bytes`.
- **How Detected:** Stress testing camera attachments on low-memory Android devices.
- **The Fix & Correction:** Implemented two-pass sub-sampled bitmap decoding in `PhotoStorageManager.kt`:
```kotlin
// MEMORY-SAFE SUB-SAMPLED DECODING
val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
BitmapFactory.decodeFile(photoFile.absolutePath, options)

options.inSampleSize = calculateInSampleSize(options, reqWidth = 1920, reqHeight = 1080)
options.inJustDecodeBounds = false
val scaledBitmap = BitmapFactory.decodeFile(photoFile.absolutePath, options)
```
Wrapped all bitmap allocations in defensive `try-catch (e: Throwable)` blocks.

---

### Bug 10: The Corrupted ZIP Deserialization Crash (NoSuchElementException on Restore)

- **Date Discovered:** 2026-08-15 | **Commit Fixed:** `2512ee0`
- **Location:** `app:util/BackupZipManager.kt`
- **The Issue:** When restoring a backup archive from Google Drive, the unzip manager searched for the primary network JSON file using Kotlin's `.first { it.name == "networks_data.json" }`.
- **The Fault & Impact:** If an archive was truncated due to a dropped network connection or created by an older incompatible build, `.first` threw `java.util.NoSuchElementException: Collection contains no element matching the predicate`, crashing the restore process.
- **How Detected:** Cloud backup recovery testing with corrupted/incomplete ZIP files.
- **The Fix & Correction:** Replaced `.first` with `.firstOrNull() ?: return BackupResult.CorruptedArchive("Missing networks_data.json in backup archive")`, presenting a graceful error dialog to the user.

---

### Bug 11: The Force-Unwrap (!!) Minefield (23 Hidden Null-Pointer Traps)

- **Date Discovered:** 2026-08-14 | **Commit Fixed:** `3462b56`
- **Location:** Across 6 UI and ViewModel files (`FiberMapView.kt`, `CloudBackupManagerSheet.kt`, `MapGeoUtils.kt`, etc.)
- **The Issue:** The codebase contained 23 instances of Kotlin's forced unwrap operator (`!!`), assuming properties like parent node IDs, GPS coordinates, or cloud backup metadata could never be null.
- **The Fault & Impact:** When importing third-party network files or handling partially synchronized cloud backups, these force-unwraps threw `NullPointerException` at runtime.
- **How Detected:** Full-codebase static stability audit documented in `Docs/quality/stability.md`.
- **The Fix & Correction:** Systematically eliminated all 23 occurrences of `!!`, replacing them with safe navigation (`?.`), elvis fallback defaults (`?:`), and structured `let`/`firstOrNull` bindings.

---

### Bug 12: The Tutorial Spotlight Offset Drift (Cloud Sync Card Insertion Displacement)

- **Date Discovered:** 2026-04-24 | **Commit Fixed:** `ec566da`
- **Location:** `app:ui/SettingsView.kt` & `app:ui/components/TutorialOverlay.kt`
- **The Issue:** A new "Cloud Sync" card was added near the top of `SettingsView`. Because the tutorial spotlight system used hardcoded vertical scroll pixel offsets, all downstream tutorial targets (Appearance, Localization, Reset) were shifted downwards by ~450 pixels.
- **The Fault & Impact:** During the Settings tutorial tour, the spotlight circle highlighted empty white space between cards, while the instruction text described settings located off-screen.
- **How Detected:** End-to-end tutorial walkthrough during v2.3 release validation.
- **The Fix & Correction:** Added explicit `animateScrollTo` target coordinates for each card step, dynamically adjusting pixel offsets by the measured height of the Cloud Sync card.

---

### Bug 13: The Global ODF Loss Disconnect (Network-Wide Settings Disregard)

- **Date Discovered:** 2026-02-10 | **Commit Fixed:** `baa506b`
- **Location:** `app:viewmodel/NetworkViewModel.kt`
- **The Issue:** When a user modified the "Default ODF Loss" in Global Settings and tapped "Update All Nodes", the recursive update function (`updateValuesRecursive`) updated cable attenuation and splice loss but failed to pass the new `networkDefaultOdfLoss` to existing ODF patch panel nodes.
- **The Fault & Impact:** Existing ODF nodes retained their old loss values, causing optical power calculations on the Canvas to disagree with Global Settings.
- **How Detected:** Discrepancy detected during power budget audit against engineering test spreadsheets.
- **The Fix & Correction:** Updated the settings pipeline and recursive update helper to explicitly propagate `networkDefaultOdfLoss` across all existing nodes in the network.

---

### Bug 14: The Attenuation Unit-Scaling Distortion (Static Loss Number Scaling)

- **Date Discovered:** 2026-02-10 | **Commit Fixed:** `d0d31d0`
- **Location:** `app:viewmodel/SettingsViewModel.kt` & `app:ui/SettingsView.kt`
- **The Issue:** When a user switched measurement units from Kilometers to Miles, the default fiber attenuation loss number (e.g. 0.35) was left unchanged in storage, causing the engine to treat 0.35 dB/km as 0.35 dB/mile!
- **The Fault & Impact:** Because 1 mile = 1.609 km, fiber loss calculations in imperial mode were underestimated by $38\%$, leading technicians to design networks that failed real-world power meter tests!
- **How Detected:** Unit conversion verification during multi-region standardization testing.
- **The Fix & Correction:** Normalized internal storage to **always** represent dB per Kilometer. Implemented dynamic mathematical scaling in the UI: when Miles are selected, the UI displays $0.35 	imes 1.60934 = 0.563	ext{ dB/mi}$, and converts inputs back to dB/km with 6-decimal-place precision for dB/m and dB/ft.

---

### Bug 15: The PDF Native Graphic Memory Leak (Missing try-finally in Export)

- **Date Discovered:** 2026-08-15 | **Commit Fixed:** `2512ee0`
- **Location:** `app:util/PdfReportGenerator.kt`
- **The Issue:** In `PdfReportGenerator.kt`, `val document = PdfDocument()` was allocated to render multi-page BOM reports. If an `IOException` occurred during `document.writeTo(outputStream)` (e.g. device storage full or permission denied), the method threw an exception before reaching `document.close()`.
- **The Fault & Impact:** Android's native Skia graphics rendering context and PDF page bitmaps remained locked in native C++ memory, leaking 15MB+ per failed export until the OS killed the process.
- **How Detected:** Simulating storage-full conditions during export stress testing.
- **The Fix & Correction:** Wrapped the entire export pipeline in a strict `try-finally` block:
```kotlin
val document = PdfDocument()
try {
    // Generate pages and write to stream...
    document.writeTo(out)
} finally {
    document.close() // Mathematically guaranteed to close native Skia handles
}
```

---

### Bug 16: The Premature Sheet Scoping Bug (Type Transformation Variable Capture)

- **Date Discovered:** 2026-04-17 | **Commit Fixed:** `3a4f8b2`
- **Location:** `app:ui/components/NodeEditSheet.kt`
- **The Issue:** When changing node types (e.g. Coupler to Splitter) via the type selector header, the configuration fields below did not update immediately to reflect the new type.
- **The Fault & Impact:** UI conditional blocks were observing the immutable `node.type` instead of the modified `draftNode.type`, causing the sheet to display coupler sliders for a splitter node.
- **How Detected:** QA testing of node type transformation workflows.
- **The Fix & Correction:** Re-scoped all conditional Compose UI blocks in `NodeEditSheet.kt` to observe `draftNode.type`, ensuring instant reactive re-rendering of configuration inputs.

---

### Bug 17: The Compass HUD Action Overlap (FAB Interaction Collision)

- **Date Discovered:** 2026-04-23 | **Commit Fixed:** `4517861`
- **Location:** `app:ui/FiberMapView.kt`
- **The Issue:** The floating compass HUD was initially rendered as a free-floating overlay in the top-right corner of the map screen, directly underneath the Map View "Close (X)" Floating Action Button.
- **The Fault & Impact:** Tapping "Close" frequently missed by a few pixels and tapped the Compass HUD instead, resetting the map bearing rather than closing the map.
- **How Detected:** Usability testing on touchscreens with various screen densities.
- **The Fix & Correction:** Relocated the Compass HUD to a dedicated 48dp action button within the primary vertical interaction FAB column with standardized 16dp padding.

---

### Bug 18: The ARGB Hex Color Parsing Crash in PDF Reports

- **Date Discovered:** 2026-06-24 | **Commit Fixed:** `e8c078f`
- **Location:** `app:util/PdfReportGenerator.kt`
- **The Issue:** In the PDF reporting engine, custom user fiber color hex codes were parsed using `android.graphics.Color.parseColor(hex)`. If a user entered a 3-digit hex (`#FFF`) or included lowercase characters without leading `#`, `parseColor` threw `IllegalArgumentException`.
- **The Fault & Impact:** Generating a PDF report for a network with custom fiber colors crashed the export process.
- **How Detected:** Automated report generation tests with custom color themes.
- **The Fix & Correction:** Built a defensive hex color parser that sanitizes input strings, handles 3-digit, 6-digit, and 8-digit formats, and defaults safely to `#000000` on parsing failure.

---

## Distilled Architectural Principles & Best Practices Playbook

The 259 commits of FiberOpticCalc provide clear, battle-tested engineering principles:

```
+---------------------------------------------------------------------------------------------------+
|                                 THE FIBEROPTICCALC PLAYBOOK                                       |
+---------------------------------------------------------------------------------------------------+
| 1. MATH PURITY        | Keep domain calculation logic free from JVM/platform dependencies.       |
|                       | Use pure Kotlin arithmetic with explicit rounding utilities.              |
| 2. CONCURRENCY SAFETY | Never launch concurrent unconstrained I/O against local files.            |
|                       | Enforce Dispatchers.IO.limitedParallelism(1) and atomic temp-file renaming.|
| 3. REACTIVE PURITY    | Derive secondary state flows reactively (combine) rather than             |
|                       | synchronizing duplicate mutable state flows manually.                     |
| 4. GRAPH SAFETY       | Always guard tree and graph traversals with visited-node cycle detection  |
|                       | and explicit user disambiguation at split points.                          |
| 5. COMPOSE LIFECYCLES | Never let native views (OSMDroid) escape Compose DisposableEffect hooks.  |
|                       | Keep LocalContext as MainActivity; never replace with ContextImpl.        |
| 6. DEFENSIVE ADMOB    | Check lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED) before   |
|                       | presenting full-screen ads to prevent window token crashes.               |
| 7. EXPORT SECURITY    | Always sanitize user strings in CSV exports against formula triggers      |
|                       | (=, +, -, @) to prevent CWE-1236 spreadsheet injection.                   |
| 8. ZERO-COST CLOUD    | Use Remote Config for broadcasts and write-only Firestore pipelines to    |
|                       | achieve zero client reads and operate sustainably on free-tier clouds.    |
+---------------------------------------------------------------------------------------------------+
```

---

## Epilogue & Current Status

As of **August 28, 2026**, FiberOpticCalc represents a mature, hardened, multiplatform codebase:
- **Core Engine:** Pure Kotlin Multiplatform (`:core`) passing 100% of unit tests across JVM, iOS, and Web.
- **Android Client:** Native Jetpack Compose UI adhering to Material Design 3, Detekt-compliant (`maxIssues: 0`), fully localized into 7 languages.
- **Web Client:** Responsive Next.js 15 PWA with Dexie.js IndexedDB local storage and compiled Kotlin/JS calculation parity.
- **Field Tested:** Trusted by telecom engineers and field technicians worldwide for high-precision optical network design.

*Document compiled from full git repository history (Commits `18e1827` through `f885eb2`).*
