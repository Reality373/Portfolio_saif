import { Story } from '@/types';

export const STORIES: Story[] = [
  // ==========================================
  // 1. HARDWARE CRISIS & EMBEDDED
  // ==========================================
  {
    id: 'abaja-crisis-migration',
    title: 'The 8-Hour Circuit Rebuild & The Phase 2 Evaluation',
    subtitle: 'What happens when an electrical transient kills your primary ECU one week before Phase 2 DBW evaluation',
    category: 'Embedded & Crisis',
    categories: ['Embedded & Crisis'],
    date: 'Jan 2025 – Feb 2026',
    readTime: '2 min read',
    badge: 'National 1st Place',
    storyType: 'paddock-log',
    summary:
      'During pre-competition track testing, an electrical transient fried our primary STM32 ECU just one week before our critical Phase 2 DBW evaluation. With no matching spares, I designed a new circuit and migrated the DBW architecture to ESP32 FreeRTOS in an 8-hour overnight sprint, clearing Phase 2 and paving the way to 1st Place in ACC at Phase 3.',
    theMistake:
      'I trusted our off-the-shelf buck converter without adding transient voltage suppression (TVS) diodes on the 12V rail. Under sudden motor back-EMF, a voltage spike fried the 3.3V LDO on our primary STM32.',
    theLesson:
      'Hardware is brutal: never trust a power rail without transient protection. But clean software architecture is forgiving: because our control algorithms were decoupled from hardware registers via clean abstraction, we could design a new circuit and rewrite the entire driver layer in 8 hours without touching our PID math.',
    sections: [
      {
        heading: 'The 3.3V Rail Meltdown',
        content:
          'With exactly one week left before Phase 2 qualifying evaluation, our test car suddenly died during a full-throttle transient run. The multimeter showed 0.2V on the 3.3V rail. The main STM32 Nucleo microcontroller had latched up, and we had zero identical spares in our inventory.',
        type: 'mistake',
      },
      {
        heading: 'The 8-Hour Overnight FreeRTOS Pivot',
        content:
          'We found an unused $4 ESP32-WROOM module in the workshop. Over an 8-hour overnight sprint, I designed a replacement daughterboard, soldered the headers, and remapped our AS5600 12-bit magnetic angle encoders and MCP4725 DACs. We pinned TWAI CAN transmission to Core 0 and our 100Hz PID steer-by-wire loop to Core 1, completely eliminating interrupt jitter.',
        callout:
          'We had two choices: abandon Phase 2 DBW evaluation, or design a new circuit from scratch and pull an all-nighter to migrate the entire firmware.',
        type: 'breakthrough',
      },
      {
        heading: 'Clearing Phase 2 & National Victory',
        content:
          'We bench-tested the board the next morning, verified deterministic CAN telemetry, and cleared the Phase 2 DBW evaluation. That emergency redesign carried our vehicle into the Phase 3 national event, winning 1st Place in Adaptive Cruise Control (ACC) and later 1st Place in Autonomous Emergency Braking (AEB).',
        type: 'lesson',
      },
    ],
    photo: {
      caption: 'Overnight workbench: Solder station, oscilloscope, and prototyping the replacement ESP32 TWAI CAN circuit.',
      location: 'Team Testing Workshop',
      timestamp: '03:30 AM',
    },
    metrics: [
      { label: 'Rebuild Window', value: '8.0 hrs' },
      { label: 'Phase 2 Result', value: 'Cleared' },
      { label: 'Phase 3 Event', value: '1st Place ACC' },
    ],
    tags: ['ESP32', 'FreeRTOS', 'CAN Bus', 'Circuit Redesign', 'DBW Evaluation'],
    relatedProjectId: 'abhyuday-dbw',
    snippet: {
      title: 'Emergency FreeRTOS Dual-Core Threading',
      language: 'cpp',
      code: `// Pinning CAN to Core 0 and PID to Core 1 eliminated all interrupt latency
void TaskCAN(void *pvParameters) {
  twai_message_t tx_frame;
  tx_frame.identifier = CAN_ID_STEER_STATUS;
  tx_frame.data_length_code = 8;
  for(;;) {
    if (xQueueReceive(xSteerTelemetryQueue, &tx_frame.data, portMAX_DELAY)) {
      twai_transmit(&tx_frame, pdMS_TO_TICKS(5));
      vTaskDelay(pdMS_TO_TICKS(10));
    }
  }
}`,
    },
  },
  {
    id: 'can-firewall-optimization',
    title: 'Why 4D Math Choked Our CPU (And Why Simpler is Better)',
    subtitle: 'How over-engineering an anomaly detector caused the exact latency bottleneck I was trying to prevent',
    category: 'Performance & Security',
    categories: ['Performance & Security'],
    date: 'Aug 2026 – Ongoing',
    readTime: '2 min read',
    badge: '99.9% Block Rate',
    storyType: 'reflection',
    summary:
      'When building our CAN bus intrusion firewall, I thought packing more mathematical features made it smarter. In reality, a 4D covariance matrix ate 2,284 clock cycles and clogged our automotive frame budget. Pruning it down to 2D taught me the power of simplicity.',
    theMistake:
      'I assumed a 4-variable Mahalanobis anomaly model (payload, entropy, frequency, jitter) would be superior. I didn’t profile its CPU cycle cost until burst traffic started overflowing RX mailboxes and dropping real brake frames.',
    theLesson:
      'True engineering maturity isn’t about how much complexity you can shoehorn into a microcontroller; it’s about discovering how much redundant math you can strip away while preserving 100% reliability.',
    sections: [
      {
        heading: 'The 2,284-Cycle Bottleneck',
        content:
          'Automotive CAN buses have strict 200 µs frame deadlines at 500 kbps. When I flashed my first version of the Gate 2 Mahalanobis anomaly detector onto the STM32F446RE, it took 2,284 CPU cycles (~12.7 µs) per frame. Under adversarial burst injection, the RX mailboxes overflowed. My security firewall had become the primary point of failure.',
        type: 'mistake',
      },
      {
        heading: 'The Collinearity Realization',
        content:
          'Plotting correlation matrices across HCRL attack datasets revealed that inter-arrival timing jitter and payload entropy were mathematically collinear. Calculating entropy wasn’t giving us extra security — it was just burning floating-point cycles in a 4×4 matrix inversion.',
        callout:
          'Collapsing from 4D down to 2D turned a heavy matrix inversion into a 2×2 matrix with pre-computed inverse constants in flash.',
        type: 'breakthrough',
      },
      {
        heading: 'Down to 5.92 µs with CMSIS-DSP SIMD',
        content:
          'I rewrote the 2D distance calculation using ARM CMSIS-DSP SIMD intrinsics and compiler tuning (`-O3 -flto`). Cycle count plummeted from 2,284 to 832 cycles (5.92 µs total inspection). The firewall dropped to using only 3% of our real-time budget while retaining a 99.9% block rate against RPM attacks.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Frame Latency', value: '5.92 µs' },
      { label: 'Cycle Reduction', value: '2.7x' },
      { label: 'Budget Used', value: '3%' },
    ],
    tags: ['STM32F446', 'CMSIS-DSP', 'Simplicity', 'CAN Bus', 'Assembly Tuning'],
    relatedProjectId: 'can-firewall',
    snippet: {
      title: 'Stripped 2D SIMD Distance Calculation',
      language: 'c',
      code: `// Reduced to 832 cycles using pre-computed inverse covariance constants
static inline float32_t calculate_mahalanobis_2d(float32_t d0, float32_t d1) {
  float32_t v0 = d0 * INV_COV_00 + d1 * INV_COV_10;
  float32_t v1 = d0 * INV_COV_01 + d1 * INV_COV_11;
  return (d0 * v0) + (d1 * v1);
}`,
    },
  },
  {
    id: 'reverse-engineering-24s-bms',
    title: 'No Documentation, A Multimeter, and Wireshark',
    subtitle: 'Extracting 24-cell battery telemetry from an uncooperative vendor Bluetooth protocol',
    category: 'Reverse Engineering',
    categories: ['Reverse Engineering'],
    date: 'May – Jun 2026',
    readTime: '2 min read',
    badge: 'Zero Docs Telemetry',
    storyType: 'deep-dive',
    summary:
      'When our electric vehicle needed real-time 98.8V battery health and the manufacturer refused to share protocol sheets, I sniffed raw BLE packets on Linux, decoded the frame delimiters, and built our own telemetry daemon.',
    theMistake:
      'Initially, I wasted days trying to query generic Bluetooth GATT characteristics, expecting standardized battery service profiles. Proprietary hardware rarely follows polite standards.',
    theLesson:
      'When vendor documentation is a total black box, you don’t need permission to understand what’s happening. Wireshark, packet sniffers, and byte comparison never lie.',
    sections: [
      {
        heading: 'Locked Out by the Vendor',
        content:
          'We had a 24S Lithium pack wired to a JBD/Xiaoxiang smart BMS. The vendor’s mobile app showed cell voltages, but they wouldn’t respond to emails requesting protocol documentation. Our NVIDIA Jetson autonomous supervisor was completely blind to cell temperatures.',
        type: 'text',
      },
      {
        heading: 'Finding the 0xDD Pattern',
        content:
          'I captured Android Bluetooth HCI snoop logs into Wireshark and compared phone UI voltages with raw hex streams. The structure revealed itself: frames always began with 0xDD and ended with 0x77. Command 0x04 returned 48 bytes — exactly 24 two-byte big-endian cell millivolts followed by a 16-bit checksum.',
        type: 'breakthrough',
      },
      {
        heading: 'Sub-10ms Linux Telemetry Daemon',
        content:
          'I wrote a lightweight C++ daemon with custom MTU negotiation and an auto-reconnect supervisor. It continuously streamed 24 cell voltages and 4 thermal probes into our Jetson compute stack with sub-10ms latency.',
        type: 'lesson',
      },
    ],
    photo: {
      caption: 'Wireshark packet capture: Mapping 0xDD start headers and 24 individual cell voltage registers.',
      location: 'Powertrain Lab',
      timestamp: '08:45 PM',
    },
    metrics: [
      { label: 'Cells Monitored', value: '24 Cells' },
      { label: 'Vendor Docs', value: '0 pages' },
      { label: 'Telemetry Stream', value: '<10 ms' },
    ],
    tags: ['BLE', 'Packet Sniffing', 'Wireshark', 'Linux BlueZ', 'Battery Telematics'],
    relatedProjectId: 'abhyuday-dbw',
  },
  {
    id: 'hackathon-midnight-pivot',
    title: 'Throwing Away 350 Lines at 3 AM',
    subtitle: 'Overcoming the sunk cost fallacy to rebuild our Web3 multi-agent architecture from scratch',
    category: 'AI & Web3',
    categories: ['AI & Web3'],
    date: 'Apr 2026',
    readTime: '2 min read',
    badge: 'DevClash Pune',
    storyType: 'war-story',
    summary:
      'At 3:15 AM during a 48-hour hackathon, our multi-agent chat engine was locked in promise hell. Instead of patching a broken foundation with hacky timeouts, we deleted 350 lines of code and rebuilt a clean event-driven message bus.',
    theMistake:
      'We built our initial multi-agent coordination layer with tightly coupled chained async promises. As soon as agents started recursive tool calling, unhandled promise rejections cascaded into permanent UI deadlocks.',
    theLesson:
      'Under high-pressure deadlines, the hardest decision is abandoning a bad architecture you just spent 12 hours writing. Sunk cost fallacy kills projects; clean refactors save them.',
    sections: [
      {
        heading: '3:15 AM: The Promise Deadlock',
        content:
          'With judging 5 hours away at DevClash Pune, our 4 autonomous agents (Market Analyst, Trader, Contract Engineer, Growth) were frozen. Recursive async promises locked the Node event loop, and teammates wanted to add setTimeout delays to force execution ordering.',
        type: 'mistake',
      },
      {
        heading: 'The Courage to Delete Bad Code',
        content:
          'I made the executive call: we hit git stash, deleted 350 lines of tangled promise chains, and redesigned the core as an event-driven Firestore message queue with Gemini 1.5 JSON schemas. During the live demo at 10:30 AM, CottonX autonomously compiled and deployed a verified smart contract on Base with zero hiccups.',
        type: 'breakthrough',
      },
    ],
    metrics: [
      { label: 'Agents Orchestrated', value: '4' },
      { label: 'Sprint Window', value: '48 hrs' },
      { label: 'Live Deployment', value: 'Base Network' },
    ],
    tags: ['Gemini API', 'Coinbase CDP', 'Multi-Agent', 'Hackathon Pivot', 'Solidity'],
    relatedProjectId: 'cottonx',
  },

  // ==========================================
  // 2. AURABYTE (FIBEROPTICCALC & ANDROID DEV)
  // ==========================================
  {
    id: 'fibercalc-math-precision',
    title: 'The Floating-Point Drift: Why IEEE-754 Broke Optical Budgets',
    subtitle: 'Moving from binary float accumulation to a zero-dependency pure Kotlin Multiplatform math engine',
    category: 'AuraByte (FiberOpticCalc)',
    categories: ['AuraByte (FiberOpticCalc)', 'Architecture & KMP'],
    date: 'Jan – Aug 2026',
    readTime: '2 min read',
    badge: 'KMP · 0.00dB Drift',
    storyType: 'deep-dive',
    summary:
      'In Passive Optical Network (PON) engineering, optical power budgets are measured in decibel-milliwatts (dBm). When naive floating-point subtraction accumulated precision errors across cascaded splitters, and JVM BigDecimal broke iOS/Web builds, I engineered a zero-dependency pure Kotlin iterative math engine.',
    theMistake:
      'I migrated naive Double math to java.math.BigDecimal without considering cross-platform compilation. When porting our :core module to iOS and Kotlin/JS, java.math.* completely broke Kotlin Native builds.',
    theLesson:
      'Never leak platform standard library classes (java.math.*, java.text.*) into domain business logic. Pure Kotlin arithmetic abstractions guarantee identical calculation results across Android, iOS, and Web.',
    sections: [
      {
        heading: 'The -22.000000000004 dBm Glitch',
        content:
          'Field technicians rely on optical power numbers to verify that customer ONTs receive light between -8 dBm and -27 dBm. Using standard Double subtraction across 12 cascaded splitter tiers produced floating-point drift like -22.000000000004 dBm. Switching to java.math.BigDecimal solved Android precision, but completely broke our Kotlin Multiplatform (:core) build when compiling for iOS and Web.',
        type: 'mistake',
      },
      {
        heading: 'Pure Kotlin Iterative Stack Engine',
        content:
          'I replaced recursive tree traversal with an iterative, stack-based DFS engine in NetworkEngine.kt to eliminate stack overflows on 100+ node networks. I built MathUtils using pure Kotlin arithmetic (kotlin.math.round) with zero Java dependencies, allowing the same calculation engine to power Android and Next.js 15 Web via Kotlin/JS with 100% parity.',
        type: 'breakthrough',
      },
    ],
    metrics: [
      { label: 'Optical Precision', value: '2 Decimals' },
      { label: 'Shared Targets', value: '3 (JVM/iOS/JS)' },
      { label: 'Math Drift', value: '0.00 dB' },
    ],
    tags: ['Kotlin Multiplatform', 'IEEE-754', 'KMP :core', 'Next.js 15', 'Math Engine'],
    relatedProjectId: 'fiberopticcalc',
    snippet: {
      title: 'Pure KMP Iterative Power Calculator',
      language: 'kotlin',
      code: `// Zero JVM dependency iterative stack DFS calculation engine
fun calculatePowerBudget(root: NetworkNode, inputDbm: Double): Map<String, PowerResult> {
    val results = mutableMapOf<String, PowerResult>()
    val stack = mutableListOf(NodeState(root, inputDbm))
    while (stack.isNotEmpty()) {
        val (node, powerIn) = stack.removeAt(stack.size - 1)
        val fiberLoss = MathUtils.roundTo(node.lengthKm * fiberLossPerKm, 2)
        val totalLoss = MathUtils.roundTo(fiberLoss + node.spliceLoss + node.insertionLoss, 2)
        val powerOut = MathUtils.roundTo(powerIn - totalLoss, 2)
        results[node.id] = PowerResult(powerIn, powerOut, totalLoss)
        node.children.reversed().forEach { stack.add(NodeState(it, powerOut)) }
    }
    return results
}`,
    },
  },
  {
    id: 'fibercalc-atomic-persistence',
    title: 'The Concurrency Ghost: Fixing Write-Inversion in Dispatchers.IO',
    subtitle: 'How an email about a corrupted survey in an underground vault forced me to master atomic persistence',
    category: 'AuraByte (FiberOpticCalc)',
    categories: ['AuraByte (FiberOpticCalc)', 'Solo Shipping', 'Defensive Engineering'],
    date: 'Feb – Aug 2026',
    readTime: '2 min read',
    badge: '5.73K+ Installs · 0.00% ANR',
    storyType: 'reflection',
    summary:
      'A technician in an underground vault lost a 2-hour fiber survey when his phone battery died. Investigating the root cause revealed a concurrency race condition in Dispatchers.IO where out-of-order writes and uncommitted file streams corrupted local JSON files.',
    theMistake:
      'I launched asynchronous file saves directly onto unconstrained Dispatchers.IO. Because it is a multi-threaded pool, rapid user edits allowed older snapshot coroutines to finish writing after newer ones, overwriting recent changes.',
    theLesson:
      'Never launch concurrent unconstrained I/O against local files. Enforce single-thread serialization (limitedParallelism(1)), write to a temp file first, and execute atomic kernel renames with fsync().',
    sections: [
      {
        heading: 'The Stinging Email from the Vault',
        content:
          'A fiber technician emailed me: "I was in an underground vault with no cell reception. The app closed when my battery dropped to 2%, and my 2-hour survey file was corrupted." Direct file.writeText() had left a half-written, unparseable JSON file on disk.',
        type: 'mistake',
      },
      {
        heading: 'Serialized Dispatcher & Atomic Rename',
        content:
          'I serialized all disk writes using Dispatchers.IO.limitedParallelism(1). Surveys are now serialized to a temporary .tmp file with a CRC32 checksum, flushed to physical flash storage via fsync(), and only then atomically renamed over the main database via the OS kernel. If power cuts at any millisecond, the previous valid survey remains 100% intact.',
        type: 'breakthrough',
      },
    ],
    metrics: [
      { label: 'Total Installs', value: '5.73K+' },
      { label: 'ANR Rate', value: '0.00%' },
      { label: 'Crash Rate', value: 'Sub-1.3%' },
    ],
    tags: ['Kotlin Coroutines', 'Dispatchers.IO', 'Atomic Storage', 'Play Store', 'Defensive Android'],
    relatedProjectId: 'fiberopticcalc',
    snippet: {
      title: 'Serialized Atomic File Persistence',
      language: 'kotlin',
      code: `// Serialized single-thread dispatcher + atomic kernel rename
class NetworkRepositoryImpl(private val context: Context) : NetworkRepository {
    private val writeDispatcher = Dispatchers.IO.limitedParallelism(1)

    override suspend fun saveNetworks(networks: List<FiberNetwork>) = withContext(writeDispatcher) {
        val json = jsonSerializer.encodeToString(networks)
        AtomicFileUtils.writeAtomically(
            targetFile = File(context.filesDir, "networks_data.json"),
            content = json
        )
    }
}`,
    },
  },
  {
    id: 'fibercalc-derived-stateflow',
    title: 'The Derived StateFlow Trap: Eliminating Dual Source of Truth',
    subtitle: 'Why maintaining separate mutable state flows between Canvas and Dashboard created state desync',
    category: 'AuraByte (FiberOpticCalc)',
    categories: ['AuraByte (FiberOpticCalc)', 'Architecture & KMP'],
    date: 'Feb – Aug 2026',
    readTime: '2 min read',
    badge: 'Zero Desync Architecture',
    storyType: 'deep-dive',
    summary:
      'Maintaining two independent MutableStateFlow instances (_networks and _currentNetwork) led to subtle desync bugs between the Canvas editor and Dashboard cards. Refactoring to a single reactive derived StateFlow solved state consistency permanently.',
    theMistake:
      'I kept two duplicate state flows in NetworkViewModel. Whenever an undo/redo action or cloud restore mutated _networks, developers had to manually remember to update _currentNetwork, leading to desynchronized UI screens.',
    theLesson:
      'Avoid duplicate mutable state flows representing different projections of the same entity. Establish a single immutable source of truth and derive secondary views reactively using combine().',
    sections: [
      {
        heading: 'The Dual Source of Truth Anti-Pattern',
        content:
          'When editing a node on the Canvas, components updated immediately. But navigating back to the Dashboard showed outdated component counts because _networks and _currentNetwork required manual double-mutation. Undoing a branch edit reverted one screen while leaving the other stale.',
        type: 'mistake',
      },
      {
        heading: 'Reactive Single Source of Truth',
        content:
          'I refactored the ViewModel to hold only _networks (the master list) and _selectedNetworkId. The active network (currentNetwork) is reactively derived using combine(_networks, _selectedNetworkId) and exposed via stateIn(SharingStarted.Eagerly). State desync became mathematically impossible.',
        type: 'breakthrough',
      },
    ],
    metrics: [
      { label: 'Source of Truth', value: '1 Master Flow' },
      { label: 'Desync Bugs', value: 'Zero' },
      { label: 'Reactivity', value: 'Instant' },
    ],
    tags: ['Jetpack Compose', 'StateFlow', 'Kotlin Coroutines', 'MVI / MVVM', 'Reactive UI'],
    relatedProjectId: 'fiberopticcalc',
    snippet: {
      title: 'Derived StateFlow Pattern with combine()',
      language: 'kotlin',
      code: `// Single source of truth with derived reactive selection
private val _networks = MutableStateFlow<List<FiberNetwork>>(emptyList())
val networks: StateFlow<List<FiberNetwork>> = _networks.asStateFlow()

private val _selectedNetworkId = MutableStateFlow<String?>(null)

val currentNetwork: StateFlow<FiberNetwork?> = combine(_networks, _selectedNetworkId) { nets, selectedId ->
    if (selectedId == null) null else nets.find { it.id == selectedId }
}.stateIn(scope = viewModelScope, started = SharingStarted.Eagerly, initialValue = null)`,
    },
  },
  {
    id: 'fibercalc-otdr-traversal',
    title: 'The OTDR Reverse-Traversal: Reversing Light Pulses on Live Maps',
    subtitle: 'Tracing optical laser reflections to precise GPS coordinates across graph cycles and splitters',
    category: 'AuraByte (FiberOpticCalc)',
    categories: ['AuraByte (FiberOpticCalc)', 'Architecture & KMP'],
    date: 'Feb – Mar 2026',
    readTime: '2 min read',
    badge: '±2.0m Fault Pinpoint',
    storyType: 'war-story',
    summary:
      'An Optical Time-Domain Reflectometer (OTDR) measures the physical distance to a fiber cut. Converting that distance into an interactive GPS pin on OpenStreetMap/Google Maps required engineering a cycle-safe graph traversal engine with power-aware trunk heuristics.',
    theMistake:
      'I assumed network graphs were simple acyclic trees. When technicians modeled backup ring loops, recursive traversal entered an infinite loop, freezing the UI thread with an ANR.',
    theLesson:
      'Physical infrastructure is messier than textbook graph theory. Traversal algorithms in physical domain modeling must enforce visited-node cycle detection and acknowledge physical divergence points.',
    sections: [
      {
        heading: 'The Graph Cycle Freeze & Splitter Ambiguity',
        content:
          'When an underground cable breaks, an OTDR outputs a scalar distance (e.g. 1,420m). Tracing that distance through ring-protected lines caused infinite recursion. Furthermore, when reaching a 1:8 splitter, the pulse traveled down all 8 branches simultaneously — early code picked Branch 0 arbitrarily, dropping repair pins on the wrong street.',
        type: 'mistake',
      },
      {
        heading: 'Cycle Protection & Power-Aware Heuristics',
        content:
          'I integrated a visitedNodes set to abort cycles. For asymmetric couplers (90/10), the engine automatically follows the high-power THRU (90%) trunk line; for symmetric splitters, it halts and prompts the technician to pick the active leg, pinpointing faults to within ±2 meters.',
        type: 'breakthrough',
      },
    ],
    metrics: [
      { label: 'Fault Accuracy', value: '±2.0 m' },
      { label: 'Traversal Latency', value: '<1.2 ms' },
      { label: 'Supported Maps', value: 'OSM & Google' },
    ],
    tags: ['Graph Algorithms', 'OTDR Fault Locator', 'GIS Mapping', 'OSMDroid', 'Google Maps'],
    relatedProjectId: 'fiberopticcalc',
    snippet: {
      title: 'Cycle-Protected Optical Fault Traversal',
      language: 'kotlin',
      code: `// Cycle-safe graph traversal with power-aware trunk heuristics
fun traceOtdrFault(startNode: NetworkNode, targetDistanceMeters: Double): LatLngPoint? {
    val visited = mutableSetOf<String>()
    var remainingMeters = targetDistanceMeters
    var current: NetworkNode? = startNode
    while (current != null && visited.add(current.id)) {
        val spanMeters = current.lengthKm * 1000.0
        if (remainingMeters <= spanMeters) {
            return interpolateGeoPoint(current.startGeo, current.endGeo, remainingMeters / spanMeters)
        }
        remainingMeters -= spanMeters
        current = when {
            current.isAsymmetricCoupler -> current.children.firstOrNull { it.portType == PortType.THRU_90 }
            current.children.size == 1 -> current.children.first()
            else -> null // Symmetric splitter prompts user branch selection
        }
    }
    return null
}`,
    },
  },
  {
    id: 'fibercalc-frankenstein-coordinates',
    title: 'The "Frankenstein Rect": Double-Zoom Coordinate Teleportation',
    subtitle: 'Fixing the exponential coordinate space offset in Jetpack Compose Canvas viewport centering',
    category: 'AuraByte (FiberOpticCalc)',
    categories: ['AuraByte (FiberOpticCalc)', 'Architecture & KMP'],
    date: 'Feb 2026',
    readTime: '2 min read',
    badge: '60fps Infinite Grid',
    storyType: 'deep-dive',
    summary:
      'Searching for a node ID caused the entire CAD canvas diagram to vanish off-screen. Diagnosing the bug revealed that screen-space bounding coordinates were being multiplied by the zoom factor twice.',
    theMistake:
      'I read the target node’s bounding rectangle in screen coordinates after graphicsLayer scaling had already applied 2.5x zoom, and then multiplied by zoom again in the camera centering formula.',
    theLesson:
      'Never mix transformed screen-space coordinates with logical layout coordinates. Always calculate camera offsets in unscaled logical layout space before applying viewport matrix transformations.',
    sections: [
      {
        heading: 'Canvas Teleportation into Black Space',
        content:
          'When searching for a node at 2.5x zoom and clicking the result, the viewport shot thousands of pixels into empty space. The camera formula read the scaled bounding box and applied zoom a second time, exponentially distorting the target translation offset.',
        type: 'mistake',
      },
      {
        heading: 'Unscaled Layout Separation & Infinite Grid',
        content:
          'I decoupled logical layout coordinates from graphicsLayer transformations, calculating camera offsets strictly in unscaled canvas coordinates. I also implemented an infinite 50dp background grid using drawWithCache and drawBehind to eliminate object allocations during 60fps panning.',
        type: 'breakthrough',
      },
    ],
    metrics: [
      { label: 'Viewport Centering', value: 'Pixel-Perfect' },
      { label: 'Canvas Framerate', value: '60 fps' },
      { label: 'Allocations / Frame', value: '0 objects' },
    ],
    tags: ['Jetpack Compose', 'Canvas Graphics', 'Coordinate Spaces', 'drawWithCache', 'UI Performance'],
    relatedProjectId: 'fiberopticcalc',
  },
  {
    id: 'fibercalc-camera-oom',
    title: 'The High-Res Camera Heap Crash: Two-Pass Sub-Sampled Decoding',
    subtitle: 'Preventing 100MB+ uncompressed bitmap allocations from blowing past the 128MB Android process heap',
    category: 'AuraByte (FiberOpticCalc)',
    categories: ['AuraByte (FiberOpticCalc)', 'Defensive Engineering'],
    date: 'Aug 2026',
    readTime: '2 min read',
    badge: '120MB → 6MB Heap',
    storyType: 'deep-dive',
    summary:
      'A 108MP/48MP photo is only ~12MB on disk as a JPEG, but decoding it with BitmapFactory into uncompressed ARGB_8888 pixels requires 190MB to 430MB of raw RAM. When shared survey files with high-res photos exceeded the 128MB ART heap limit on budget devices, I built a two-pass memory-safe decoding pipeline.',
    theMistake:
      'I confused compressed file size on disk (~12MB) with uncompressed bitmap memory in RAM (width × height × 4 bytes). Calling BitmapFactory.decodeFile() directly blew past the 128MB dalvik.vm.heapgrowthlimit on budget field devices.',
    theLesson:
      'Android apps don’t get all 2GB–3GB of phone RAM; the OS caps each app process to a strict 128MB–192MB heap. Always inspect image dimensions first with inJustDecodeBounds, calculate exact inSampleSize divisors, and decode using memory-efficient RGB_565 configs.',
    sections: [
      {
        heading: 'Compressed Disk JPEG vs 200MB+ Uncompressed RAM',
        content:
          'When lead engineers attached high-res site photos (48MP/108MP) to fiber splice nodes and shared the .fiber survey with technicians, opening the survey on 2GB–3GB RAM field devices threw instant OutOfMemoryErrors. Even though a JPEG is only 12MB on disk, a 48MP image (8,000 × 6,000) uncompresses into 8000 × 6000 × 4 bytes = 192MB of raw RAM — instantly blowing past Android’s 128MB per-app process heap limit (heapgrowthlimit).',
        type: 'mistake',
      },
      {
        heading: 'Two-Pass Sub-Sampled Bitmap Pipeline',
        content:
          'I implemented two-pass decoding in PhotoStorageManager.kt using BitmapFactory.Options. The first pass reads header dimensions with inJustDecodeBounds = true; the second pass calculates inSampleSize to scale the image down to 1920x1080 (~6MB) using Bitmap.Config.RGB_565 (2 bytes/pixel), eliminating OOM crashes across all devices.',
        type: 'breakthrough',
      },
    ],
    metrics: [
      { label: 'Uncompressed RAM', value: '192MB → 6MB' },
      { label: 'Heap Safety', value: 'Sub-128MB' },
      { label: 'Decode Format', value: 'RGB_565' },
    ],
    tags: ['Android Memory', 'BitmapFactory', 'OutOfMemoryError', 'Sub-Sampling', 'ART Heap Limit'],
    relatedProjectId: 'fiberopticcalc',
    snippet: {
      title: 'Two-Pass Sub-Sampled Bitmap Decoder',
      language: 'kotlin',
      code: `// Two-pass memory-safe decoding bounding high-res photos to ~6MB
fun decodeSampledBitmapFromFile(file: File, reqWidth: Int = 1920, reqHeight: Int = 1080): Bitmap? {
    return try {
        val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(file.absolutePath, options)
        options.inSampleSize = calculateInSampleSize(options, reqWidth, reqHeight)
        options.inJustDecodeBounds = false
        options.inPreferredConfig = Bitmap.Config.RGB_565 // 2 bytes per pixel
        BitmapFactory.decodeFile(file.absolutePath, options)
    } catch (e: Throwable) {
        null
    }
}`,
    },
  },
  {
    id: 'fibercalc-csv-injection',
    title: 'CWE-1236 CSV Formula Injection in Field Engineering Reports',
    subtitle: 'Neutralizing spreadsheet command execution exploits in exported Bill of Materials files',
    category: 'AuraByte (FiberOpticCalc)',
    categories: ['AuraByte (FiberOpticCalc)', 'Performance & Security'],
    date: 'Aug 2026',
    readTime: '2 min read',
    badge: 'CWE-1236 Patched',
    storyType: 'reflection',
    summary:
      'FiberOpticCalc exports Bill of Materials (BOM) to CSV for Excel. During a security audit, we discovered that user-entered node names starting with =, +, -, or @ could execute arbitrary commands in Microsoft Excel (CWE-1236).',
    theMistake:
      'I concatenated user input strings directly into comma-separated CSV rows without checking for spreadsheet formula execution triggers.',
    theLesson:
      'Every external export is an attack surface. Treat exported files with the same sanitization rigor as web inputs by prepending apostrophes to neutralize formula triggers.',
    sections: [
      {
        heading: 'The Spreadsheet Exploit Surface',
        content:
          'If a contractor opened an exported CSV report from a shared network where a malicious node was named =CMD|\' /C calc\'!A0 or +SUM(...), spreadsheet engines like Microsoft Excel and LibreOffice executed the formula, creating command execution and data exfiltration risks.',
        type: 'mistake',
      },
      {
        heading: 'Strict Formula Sanitization Layer',
        content:
          'I built a sanitization layer in CsvReportGenerator.kt that detects leading formula trigger characters (=, +, -, @, \\t, \\r) and prepends a single apostrophe (\'), forcing spreadsheet engines to treat all fields as literal string text.',
        type: 'breakthrough',
      },
    ],
    metrics: [
      { label: 'Vulnerability', value: 'CWE-1236 Patched' },
      { label: 'Security Audit', value: 'Passed' },
      { label: 'Export Format', value: 'Safe CSV' },
    ],
    tags: ['App Security', 'CWE-1236', 'CSV Injection', 'Data Sanitization', 'Enterprise BOM'],
    relatedProjectId: 'fiberopticcalc',
    snippet: {
      title: 'CWE-1236 CSV Formula Sanitization',
      language: 'kotlin',
      code: `// Neutralize formula execution triggers in exported CSV engineering reports
fun sanitizeForCsv(cellValue: String): String {
    val formulaTriggers = charArrayOf('=', '+', '-', '@', '\\t', '\\r')
    val trimmed = cellValue.trim()
    return if (trimmed.isNotEmpty() && formulaTriggers.contains(trimmed[0])) {
        "'$trimmed" // Prepend single apostrophe to force Excel literal text
    } else {
        trimmed
    }
}`,
    },
  },
  {
    id: 'fibercalc-compose-recomposition',
    title: 'The 12fps Recomposition Stutter in 64-Port Splitters',
    subtitle: 'Decomposing a 1,400-line monolithic Composable into virtualized LazyColumn subcomponents',
    category: 'AuraByte (FiberOpticCalc)',
    categories: ['AuraByte (FiberOpticCalc)', 'Performance & Security'],
    date: 'Aug 2026',
    readTime: '2 min read',
    badge: '12fps → 60fps Silky',
    storyType: 'deep-dive',
    summary:
      'Editing high-density 1:64 splitters dropped UI framerate to 12fps because a 1,400-line monolithic Column sheet recomposed every single port row on every keystroke. Migrating to LazyColumn and hoisting lambdas restored silky 60fps.',
    theMistake:
      'I built NodeEditSheet.kt as a single monolithic Column Composable. Typing a character into one text field triggered unskippable recompositions across all 64 port sub-items.',
    theLesson:
      'Never render dynamic multi-item forms in un-virtualized Column composables. Decompose complex forms into small, skippable subcomponents and virtualize lists with LazyColumn.',
    sections: [
      {
        heading: 'Typing Stutter in High-Density Splitters',
        content:
          'When configuring large 1:64 splitters or 288-core fiber ribbon closures, keyboard input lagged severely on mid-range devices. Android Studio Layout Inspector showed that typing a single character into a label caused all 64 port rows to recompose simultaneously.',
        type: 'mistake',
      },
      {
        heading: 'Virtualized Decomposition & Memoization',
        content:
          'I decomposed the 1,400-line file into isolated subcomponents (NodeEditHeader, EditorTextFields, NodePortRow). I migrated from Column to virtualized LazyColumn with stable keys, hoisted lambdas, and memoized loss calculations with remember(node.id), restoring silky 60fps.',
        type: 'breakthrough',
      },
    ],
    metrics: [
      { label: 'Framerate', value: '12 → 60 fps' },
      { label: 'Max Splitter', value: '1:64 Ports' },
      { label: 'Recompositions', value: 'Minimal' },
    ],
    tags: ['Jetpack Compose', 'LazyColumn', 'Recomposition', 'Android Performance', 'UI Optimization'],
    relatedProjectId: 'fiberopticcalc',
  },
  {
    id: 'fibercalc-downsizing-wipe',
    title: 'The Silent Downsizing Wipe: Destructive Confirmation Barriers',
    subtitle: 'Preventing accidental splitter reduction from wiping downstream customer subtrees',
    category: 'AuraByte (FiberOpticCalc)',
    categories: ['AuraByte (FiberOpticCalc)', 'Defensive Engineering'],
    date: 'Feb 2026',
    readTime: '2 min read',
    badge: 'Zero Data Loss Guard',
    storyType: 'reflection',
    summary:
      'Changing a 1:8 splitter to a 1:4 splitter automatically sliced the child array, silently wiping active customer drop terminals on ports 5 through 8 without warning. Adding proactive confirmation barriers saved field engineers from accidental data loss.',
    theMistake:
      'I implemented port count changes as a simple array slice without checking if candidate pruned ports contained active downstream subtrees.',
    theLesson:
      'Hardware structural mutations in CAD tools must be non-destructive by default. Always inspect pruned branches and enforce destructive confirmation dialogs when child entities exist.',
    sections: [
      {
        heading: 'The Accidental 1:4 Tap Disaster',
        content:
          'During field testing, a technician accidentally tapped "1:4" instead of "1:8" on a central splitter. The calculation engine sliced the output array, permanently deleting 15 downstream customer drop terminals and miles of surveyed fiber without warning.',
        type: 'mistake',
      },
      {
        heading: 'Proactive BranchManagementDialog Barrier',
        content:
          'I created BranchManagementDialog in NodeEditSheet.kt. When downsizing any multi-port node, the sheet inspects candidate ports to be pruned. If child nodes exist, downsizing is blocked, forcing the user to explicitly move or delete those branches first.',
        type: 'breakthrough',
      },
    ],
    metrics: [
      { label: 'Data Loss Risk', value: 'Zero' },
      { label: 'Downsize Guard', value: 'Active' },
      { label: 'Field Safety', value: '100%' },
    ],
    tags: ['Defensive UX', 'CAD Architecture', 'Data Integrity', 'Jetpack Compose', 'Field Safety'],
    relatedProjectId: 'fiberopticcalc',
  },
  {
    id: 'fibercalc-context-localization',
    title: 'The Compose Dynamic Localization Crash: ContextImpl Violation',
    subtitle: 'Why overriding LocalContext with ContextImpl stripped ActivityResultRegistryOwner and crashed the app',
    category: 'AuraByte (FiberOpticCalc)',
    categories: ['AuraByte (FiberOpticCalc)', 'Defensive Engineering'],
    date: 'Aug 2026',
    readTime: '2 min read',
    badge: '7 Locales · 0 Crashes',
    storyType: 'deep-dive',
    summary:
      'To switch languages in Settings without restarting the device, overriding LocalContext with context.createConfigurationContext() stripped ActivityResultRegistryOwner, crashing photo attachments and Google Sign-In with an IllegalStateException.',
    theMistake:
      'I replaced Compose\'s LocalContext with a wrapped ConfigurationContext. Because ContextImpl is not an Activity, all activity result contracts (Camera, Auth) failed immediately.',
    theLesson:
      'Never replace LocalContext with a non-Activity context in root composables. Use attachBaseContext on Activity and provide localized configuration via CompositionLocalProvider(LocalConfiguration provides config).',
    sections: [
      {
        heading: 'The LocalActivityResultRegistryOwner Crash',
        content:
          'FiberOpticCalc supports 7 languages dynamically. To achieve instant translation switching, the initial code wrapped LocalContext in a configuration context. Tapping "Take Photo" or "Google Sign-In" crashed with IllegalStateException: No ActivityResultRegistryOwner was provided.',
        type: 'mistake',
      },
      {
        heading: 'Preserving MainActivity as LocalContext',
        content:
          'I preserved MainActivity as LocalContext.current, applied dynamic localization via attachBaseContext, and provided localized configurations via CompositionLocalProvider(LocalConfiguration provides localizedConfig), giving 100% stable runtime language switching.',
        type: 'breakthrough',
      },
    ],
    metrics: [
      { label: 'Locales Supported', value: '7 Languages' },
      { label: 'Runtime Switching', value: 'Instant' },
      { label: 'Crash Rate', value: '0.00%' },
    ],
    tags: ['Jetpack Compose', 'i18n Localization', 'LocalContext', 'ActivityResultContracts', 'Android Lifecycles'],
    relatedProjectId: 'fiberopticcalc',
  },
  {
    id: 'fibercalc-ad-lifecycle',
    title: 'The Lock-Screen Black Overlay: Lifecycle-Guarded Ad Windows',
    subtitle: 'Fixing BadTokenException and pitch-black window overlays when full-screen ads load as the phone sleeps',
    category: 'AuraByte (FiberOpticCalc)',
    categories: ['AuraByte (FiberOpticCalc)', 'Defensive Engineering'],
    date: 'Aug 2026',
    readTime: '2 min read',
    badge: 'AdMob Lifecycle Gated',
    storyType: 'reflection',
    summary:
      'When an interstitial ad loaded right as a technician locked their phone, the ad SDK attempted to attach a window token to a destroyed activity, throwing BadTokenException and leaving a mysterious black overlay upon unlocking.',
    theMistake:
      'I displayed full-screen ads in asynchronous callbacks without verifying if the host Activity was currently in a resumed lifecycle state.',
    theLesson:
      'Always gate full-screen overlay presentations with lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED) to prevent window token crashes when devices sleep or rotate.',
    sections: [
      {
        heading: 'The Mysterious Black Screen on Unlock',
        content:
          'Field technicians reported that locking the phone while creating a design caused the screen to become pitch black upon unlocking, with only a floating close button visible. An ad callback had triggered right as the phone went to sleep, attaching to a destroyed window token.',
        type: 'mistake',
      },
      {
        heading: 'Strict Lifecycle State Gating',
        content:
          'I added configuration change filtering to AndroidManifest.xml and enforced strict lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED) checks in AdManager before showing any full-screen window, guaranteeing clean device resumes.',
        type: 'breakthrough',
      },
    ],
    metrics: [
      { label: 'Window Crashes', value: '0 BadToken' },
      { label: 'Resume Experience', value: 'Seamless' },
      { label: 'Lifecycle Gate', value: 'State.RESUMED' },
    ],
    tags: ['AdMob', 'Android Lifecycle', 'BadTokenException', 'Defensive Android', 'Window Manager'],
    relatedProjectId: 'fiberopticcalc',
  },
  {
    id: 'fibercalc-map-reversion-leak',
    title: 'The 1-Hour Google Maps Auto-Reversion & Native Memory Leak',
    subtitle: 'Fixing OSMDroid 80MB bitmap leaks on rotation and enforcing exact-millisecond rewarded ad expiration',
    category: 'AuraByte (FiberOpticCalc)',
    categories: ['AuraByte (FiberOpticCalc)', 'Architecture & KMP', 'Solo Shipping'],
    date: 'Apr – Aug 2026',
    readTime: '2 min read',
    badge: '$0.00 Unexpected Billing',
    storyType: 'deep-dive',
    summary:
      'OSMDroid leaked 80MB of native bitmap memory per screen rotation, and Google Maps satellite access remained unlocked indefinitely when the 1-hour timer expired in the background. DisposableEffect lifecycle hooks and active coroutine timers solved both.',
    theMistake:
      'MapView instances were not hooked into Compose lifecycle disposal, and the map provider relied on passive checks rather than active coroutine timers to revert premium map access.',
    theLesson:
      'Never let native Android views escape Compose DisposableEffect disposal hooks, and enforce active time-based entitlement expiration jobs to prevent unauthorized API billing.',
    sections: [
      {
        heading: '80MB Rotation Leaks & Stuck Google Maps',
        content:
          'OSMDroid’s MapView leaked 80MB of native tile bitmaps on every device rotation, causing OutOfMemoryError on low-RAM phones. Meanwhile, users who unlocked Google Maps Satellite via a rewarded video ad stayed on Google Maps indefinitely after the 1-hour timer expired in the background.',
        type: 'mistake',
      },
      {
        heading: 'DisposableEffect Hooks & Active Coroutine Timers',
        content:
          'I wrapped MapView in DisposableEffect with explicit LifecycleEventObserver attachments (onResume, onPause, onDetach). In SettingsViewModel, I added scheduleGoogleMapsExpiryJob to automatically revert to OpenStreetMap the exact millisecond the 1-hour window expires, guaranteeing zero native leaks and $0.00 unexpected Google Cloud billing.',
        type: 'breakthrough',
      },
    ],
    metrics: [
      { label: 'Tile Leaks', value: '0 MB' },
      { label: 'Google Maps API Cost', value: '$0.00 Unexpected' },
      { label: 'Reversion Engine', value: 'Millisecond Exact' },
    ],
    tags: ['OSMDroid', 'Google Maps SDK', 'DisposableEffect', 'Memory Leaks', 'Monetization'],
    relatedProjectId: 'fiberopticcalc',
  },
  {
    id: 'fibercalc-zero-dollar-cloud',
    title: 'Zero-Dollar Cloud: Scaling to 25K MAU on Free-Tier Firebase',
    subtitle: 'Eliminating 3.75M monthly database reads via Remote Config edge caching and write-only pipelines',
    category: 'AuraByte (FiberOpticCalc)',
    categories: ['AuraByte (FiberOpticCalc)', 'Solo Shipping'],
    date: 'Jan – Aug 2026',
    readTime: '2 min read',
    badge: '$0.00 Infra · 25K MAU',
    storyType: 'deep-dive',
    summary:
      'To operate sustainably at $0.00 infrastructure cost, I replaced real-time Firestore listeners (which threatened 3.75M reads/month at 25K MAU) with Remote Config edge caching and write-only telemetry pipelines with zero client reads.',
    theMistake:
      'Early architecture drafted real-time Firestore listeners for developer announcements and community polls. At 25,000 MAU, active listeners would generate 3.75 million reads per month, blowing past free tiers into recurring monthly bills.',
    theLesson:
      'Cost optimization is an architectural discipline. Leverage free distributed edge caches (Remote Config) for broadcasts and restrict database access to write-only pipelines to eliminate read-cost scaling.',
    sections: [
      {
        heading: 'The 3.75 Million Read Threat',
        content:
          'Setting up real-time Firestore listeners for developer broadcasts and feedback polls would blow past Firebase Spark tier limits (50,000 reads/day) within hours at 25,000 MAU, incurring steep monthly cloud bills on a solo utility app.',
        type: 'mistake',
      },
      {
        heading: 'Zero-Client-Read Edge Architecture',
        content:
          'I pushed broadcasts via Firebase Remote Config ($0 cost, unlimited cached client fetches). User feedback and poll submissions were routed to a write-only Firestore collection — achieving 0 client reads at scale and ensuring the app runs permanently at $0.00 server cost.',
        type: 'breakthrough',
      },
    ],
    metrics: [
      { label: 'Monthly Cloud Cost', value: '$0.00 / mo' },
      { label: 'Client Firestore Reads', value: '0 Reads' },
      { label: 'Sustainable Scale', value: '25,000+ MAU' },
    ],
    tags: ['Serverless', 'Firebase Remote Config', 'Zero-Cost Infra', 'Cloud Architecture', 'Firestore Rules'],
    relatedProjectId: 'fiberopticcalc',
    snippet: {
      title: 'Write-Only Firestore Telemetry (0 Client Reads)',
      language: 'kotlin',
      code: `// Zero-client-read community feedback pipeline
fun submitFeedback(feedback: UserFeedback, onComplete: (Boolean) -> Unit) {
    // Write-only Firestore collection: zero read charges incurred at scale
    firestore.collection("community_responses")
        .document(UUID.randomUUID().toString())
        .set(feedback.toMap())
        .addOnSuccessListener { onComplete(true) }
        .addOnFailureListener { onComplete(false) }
}`,
    },
  },
  {
    id: 'fibercalc-unit-scaling',
    title: 'The 38% Imperial Loss Distortion: Attenuation Unit Scaling',
    subtitle: 'Why switching measurement units to Miles underestimated fiber loss calculations by 38%',
    category: 'AuraByte (FiberOpticCalc)',
    categories: ['AuraByte (FiberOpticCalc)', 'Architecture & KMP'],
    date: 'Feb 2026',
    readTime: '2 min read',
    badge: 'Normalized dB/km Storage',
    storyType: 'deep-dive',
    summary:
      'When users switched measurement units from Kilometers to Miles, the default fiber attenuation number (0.35) stayed unmodified in storage, causing the engine to treat 0.35 dB/km as 0.35 dB/mile and underestimating loss by 38%.',
    theMistake:
      'I stored unit-dependent display values in settings rather than normalizing internal storage to a standardized base unit.',
    theLesson:
      'Always normalize internal domain storage to standard base units (e.g. dB per Kilometer) and apply unit conversions dynamically in the presentation layer.',
    sections: [
      {
        heading: 'The 38% Optical Underestimation',
        content:
          'Because 1 mile = 1.609 km, failing to scale attenuation constants when switching to imperial mode caused the engine to calculate significantly less optical loss than physical reality, leading technicians to design networks that failed real-world power meter tests.',
        type: 'mistake',
      },
      {
        heading: 'Normalized Storage & Dynamic Presentation',
        content:
          'I normalized internal storage to always store dB/km. When Miles are selected, the UI dynamically displays 0.35 * 1.60934 = 0.563 dB/mi, and converts user inputs back to dB/km with 6-decimal precision for dB/m and dB/ft.',
        type: 'breakthrough',
      },
    ],
    metrics: [
      { label: 'Storage Standard', value: 'Strict dB/km' },
      { label: 'Loss Accuracy', value: '100.00%' },
      { label: 'Units Supported', value: 'km, mi, m, ft' },
    ],
    tags: ['Unit Conversion', 'Optical Physics', 'Settings Architecture', 'Math Precision', 'Domain Modeling'],
    relatedProjectId: 'fiberopticcalc',
  },
  {
    id: 'fibercalc-white-swatch',
    title: 'The Invisible White Swatch: Luminance-Aware Dynamic Borders',
    subtitle: 'Solving outdoor sunlight contrast disappearance for EIA/TIA-598 Fiber Core #12',
    category: 'AuraByte (FiberOpticCalc)',
    categories: ['AuraByte (FiberOpticCalc)', 'Defensive Engineering'],
    date: 'Apr 2026',
    readTime: '1 min read',
    badge: 'Luminance-Aware UX',
    storyType: 'reflection',
    summary:
      'In EIA/TIA-598 fiber optic coding, Core #12 is pure White (#FFFFFF). On light theme devices, White fiber swatches had no border, making Fiber #12 completely invisible in outdoor sunlight. A dynamic luminance border system fixed it.',
    theMistake:
      'I rendered color swatch cards without border contrast checks, assuming background surfaces would provide enough visual separation.',
    theLesson:
      'In technical field applications used under bright sunlight, color swatches must adapt dynamically to theme background luminance.',
    sections: [
      {
        heading: 'The Missing 12th Fiber',
        content:
          'Technicians working outdoors reported that Fiber #12 was missing from the app. On light theme devices with off-white card backgrounds (#FBF8FF), the pure White swatch was completely invisible without bounding strokes.',
        type: 'mistake',
      },
      {
        heading: 'Luminance-Aware Border System',
        content:
          'I implemented dynamic luminance detection in FiberSwatchCard.kt. The swatch composable inspects RGB luminance; if a swatch is near-white in light mode, it renders a subtle neutral-gray border (Color.Gray.copy(0.4f)). In dark mode, it automatically renders a high-contrast border for Black fibers.',
        type: 'breakthrough',
      },
    ],
    metrics: [
      { label: 'Sunlight Contrast', value: 'High Visibility' },
      { label: 'Theme Support', value: 'Light & Dark' },
      { label: 'Standards', value: 'EIA/TIA-598' },
    ],
    tags: ['Jetpack Compose', 'UI/UX Contrast', 'EIA/TIA-598', 'Outdoor Usability', 'Color Swatches'],
    relatedProjectId: 'fiberopticcalc',
  },
];
