import { Story } from '@/types';

export const STORIES: Story[] = [
  {
    id: 'abaja-crisis-migration',
    title: 'The 8-Hour Circuit Rebuild & The Phase 2 Evaluation',
    subtitle: 'What happens when an electrical transient kills your primary ECU one week before Phase 2 DBW evaluation',
    category: 'Embedded & Crisis',
    date: 'Jan 2025 – Feb 2026',
    readTime: '3 min read',
    badge: 'National 1st Place',
    storyType: 'paddock-log',
    summary:
      'During pre-competition track testing, an electrical transient fried our primary STM32 ECU just one week before our critical Phase 2 DBW evaluation. With no matching spares, I designed a new circuit and migrated the DBW architecture to ESP32 FreeRTOS in an 8-hour overnight sprint, clearing Phase 2 and paving the way to 1st Place in ACC at the Phase 3 national event.',
    theMistake:
      'I trusted our off-the-shelf buck converter without adding transient voltage suppression (TVS) diodes on the 12V rail. Under sudden motor back-EMF during testing, a voltage spike fried the 3.3V LDO on our primary STM32.',
    theLesson:
      'Hardware is brutal: never trust a power rail without transient protection. But good software architecture is forgiving: because our control algorithms were decoupled from hardware registers via clean abstraction, we could design a new circuit and rewrite the entire low-level driver layer in 8 hours without touching our PID math.',
    sections: [
      {
        heading: 'One Week to Phase 2 Evaluation',
        content:
          'We were out on the testing grounds with exactly one week left before Phase 2 evaluation — the high-stakes qualifying round where our drive-by-wire (DBW) systems were to be formally inspected and tested. During a full-throttle transient test, the car suddenly went dead. Multimeter showed 0.2V on the 3.3V rail. The main STM32 Nucleo microcontroller had latched up and died, and we had no identical spare Nucleo boards in our inventory.',
        type: 'text',
      },
      {
        heading: 'The Panic & The Pivot',
        content:
          'With only days remaining before the evaluation that would decide if our car could compete, failing Phase 2 meant disqualification before even reaching the Phase 3 national finals. We checked our workshop components and found an unused $4 ESP32-WROOM module. It had completely different pinouts, different peripheral registers, and a dual-core FreeRTOS architecture instead of bare-metal HAL. But it had a hardware TWAI CAN controller.',
        callout:
          'We had two choices: abandon Phase 2 DBW evaluation, or design a new circuit from scratch and pull an all-nighter to migrate the entire firmware.',
        type: 'mistake',
      },
      {
        heading: '8-Hour Circuit Redesign & FreeRTOS Migration',
        content:
          'Over an intense 8-hour overnight sprint, I designed a new circuit board, soldered the prototype daughterboard, and remapped our AS5600 12-bit magnetic angle encoders and dual MCP4725 throttle DACs. Migrating to the ESP32’s dual cores turned out to be an upgrade: we pinned CAN bus transmission to Core 0 and our 100Hz PID steer-by-wire loop to Core 1, completely eliminating interrupt contention.',
        type: 'breakthrough',
      },
      {
        heading: 'Clearing Phase 2 & National Victory at Phase 3',
        content:
          'We tested the new circuit the following afternoon, verified deterministic CAN telemetry, and cleared the Phase 2 DBW evaluation with flying colors. That emergency redesign gave our vehicle rock-solid stability, carrying us into the Phase 3 national event where our DBW system won 1st Place in Adaptive Cruise Control (ACC) and later 1st Place in Autonomous Emergency Braking (AEB).',
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
    date: 'Aug 2026 – Ongoing',
    readTime: '2 min read',
    badge: '99.9% Block Rate',
    storyType: 'reflection',
    summary:
      'When building our CAN bus intrusion firewall, I thought packing more mathematical features made it smarter. In reality, a 4D covariance matrix ate 2,284 clock cycles and clogged our automotive frame budget. Pruning it down to 2D taught me the power of simplicity.',
    theMistake:
      'I fell into the trap of academic over-engineering: I assumed a 4-variable Mahalanobis anomaly model (payload, entropy, frequency, jitter) would be superior. I didn’t profile its CPU cycle cost until burst traffic started dropping real brake frames.',
    theLesson:
      'True engineering maturity isn’t about how much complexity you can shoehorn into a microcontroller; it’s about discovering how much redundant math you can strip away while preserving 100% reliability.',
    sections: [
      {
        heading: 'The 2,284-Cycle Bottleneck',
        content:
          'Automotive CAN buses have strict 200 µs frame deadlines at 500 kbps. When I flashed my first version of the Gate 2 Mahalanobis anomaly detector onto the STM32F446RE, it took 2,284 CPU cycles (~12.7 µs) per frame. Under normal load, it looked fine. But the moment we simulated an adversarial burst of RPM spoofing frames, the RX mailboxes overflowed. My security firewall had become the primary point of failure.',
        type: 'mistake',
      },
      {
        heading: 'The Collinearity Realization',
        content:
          'I sat down with HCRL attack datasets and plotted correlation matrices across the features. The data slapped me in the face: inter-arrival timing jitter and payload entropy were mathematically collinear. Calculating entropy wasn’t giving us extra security — it was just burning floating-point cycles.',
        callout:
          'A 4×4 matrix inversion requires 16 multiplications and 12 additions per frame. Collapsing down to 2D turned it into a trivial 2×2 matrix with pre-computed inverse constants in flash.',
        type: 'breakthrough',
      },
      {
        heading: 'Down to 5.92 µs with CMSIS-DSP',
        content:
          'I rewrote the 2D distance calculation using ARM CMSIS-DSP SIMD intrinsics and tuned compiler flags (`-O3 -flto`) to keep values in FPU registers. Cycle count plummeted from 2,284 to 832 cycles (5.92 µs total inspection). The firewall dropped to using only 3% of our real-time budget while retaining a 99.9% block rate against RPM attacks.',
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
    id: 'fibercalc-precision-kmp-engine',
    title: 'The IEEE-754 Precision Trap: BigDecimal to Pure KMP Math',
    subtitle: 'How floating-point drift and a JVM BigDecimal trap forced the creation of a zero-dependency cross-platform math engine',
    category: 'Architecture & KMP',
    date: 'Jan – Aug 2026',
    readTime: '4 min read',
    badge: 'KMP · 100% Shared Math',
    storyType: 'deep-dive',
    summary:
      'In Passive Optical Network (PON) engineering, precision power calculations dictate whether an optical terminal receives sufficient light or degrades. When IEEE-754 floats accumulated drift and JVM BigDecimal broke our iOS and Web ports, I engineered an iterative, zero-dependency pure Kotlin Multiplatform math engine.',
    theMistake:
      'When floating-point drift produced unsightly fractions like -22.000000000004 dBm, I migrated the engine to java.math.BigDecimal without considering cross-platform targets. Months later, when compiling for iOS and Next.js Kotlin/JS, the entire multiplatform domain build imploded with unresolved reference errors.',
    theLesson:
      'Never leak platform standard library classes (java.math.*, java.text.*) into domain business logic. Pure arithmetic abstractions ensure your calculation engine runs identically across Android, iOS, Web, or embedded microcontrollers without mathematical discrepancy.',
    sections: [
      {
        heading: 'The -22.000000000004 dBm Precision Trap',
        content:
          'Passive Optical Networks cascade splitters (1:2 to 1:64) and asymmetric couplers across miles of fiber. Technicians need exact decibel-milliwatt (dBm) figures to verify that customer ONTs stay within strict optical windows (-8 dBm to -27 dBm). Our initial V1 engine used standard Double subtraction. Due to IEEE-754 binary floating-point representation, deep 12-tier cascaded branches accumulated precision drift, printing values like -22.000000000004 dBm on field reports.',
        type: 'mistake',
      },
      {
        heading: 'The BigDecimal Trap & Recursion Stack Overflow',
        content:
          'In our second release, I swapped the math to java.math.BigDecimal with HALF_UP rounding. It looked clean on Android, but it hid two massive architectural landmines. First, when modeling 100+ node enterprise networks, our naive recursive tree traversal threw java.lang.StackOverflowError. Second, when we extracted our domain core (:core) for Kotlin Multiplatform to support iOS and Web, java.math.* completely broke Kotlin Native and Kotlin/JS compilation.',
        callout:
          'java.math.BigDecimal does not exist in Kotlin/Native or Kotlin/JS. Adding a JVM package to domain logic completely killed multiplatform portability.',
        type: 'text',
      },
      {
        heading: 'Unit Scaling & The 38% Imperial Loss Distortion',
        content:
          'To make matters worse, field testing in North America revealed Bug #14: when users switched measurement units from Kilometers to Miles, the attenuation constant (0.35) stayed unmodified in storage. The engine treated 0.35 dB/km as 0.35 dB/mile. Because 1 mile = 1.609 km, fiber loss was underestimated by 38%, risking optical failure in real-world deployments.',
        type: 'mistake',
      },
      {
        heading: 'The Zero-Dependency Iterative Math Engine',
        content:
          'I completely rewrote the engine from scratch. I replaced recursion with an iterative, stack-based depth-first traversal in NetworkEngine.kt to eliminate stack overflows. I built MathUtils using pure Kotlin arithmetic (kotlin.math.pow, kotlin.math.round) and normalized internal storage to always store dB/km, converting dynamically for UI presentation. We strictly gated the :core module with Detekt static analysis (maxIssues: 0) to ensure zero platform dependencies ever enter.',
        type: 'breakthrough',
      },
      {
        heading: '100% Shared Parity on Android, iOS & Web',
        content:
          'Today, that exact same pure Kotlin :core engine is compiled to a JavaScript library (web/packages/engine) running in Next.js 15 with Dexie IndexedDB. Android field technicians and desktop office planners can import and export the same .fiber files with zero mathematical discrepancy down to 2 decimal places.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Optical Precision', value: '2 Decimals' },
      { label: 'Platforms Shared', value: '3 Targets' },
      { label: 'Calculation Drift', value: '0.00 dB' },
    ],
    tags: ['Kotlin Multiplatform', 'IEEE-754', 'KMP :core', 'Next.js 15', 'Dexie IndexedDB'],
    relatedProjectId: 'fiberopticcalc',
    snippet: {
      title: 'Iterative Stack Calculation Engine (Pure KMP)',
      language: 'kotlin',
      code: `// Stack-based DFS engine eliminating recursion and JVM BigDecimal
fun calculatePowerBudget(root: NetworkNode, inputDbm: Double): Map<String, PowerResult> {
    val results = mutableMapOf<String, PowerResult>()
    val stack = mutableListOf(NodeState(root, inputDbm))
    
    while (stack.isNotEmpty()) {
        val (currentNode, powerIn) = stack.removeAt(stack.size - 1)
        val fiberLoss = MathUtils.roundTo(currentNode.lengthKm * fiberLossPerKm, 2)
        val totalLoss = MathUtils.roundTo(fiberLoss + currentNode.spliceLoss + currentNode.insertionLoss, 2)
        val powerOut = MathUtils.roundTo(powerIn - totalLoss, 2)
        
        results[currentNode.id] = PowerResult(powerIn, powerOut, totalLoss)
        currentNode.children.reversed().forEach { child ->
            stack.add(NodeState(child, powerOut))
        }
    }
    return results
}`,
    },
  },
  {
    id: 'fibercalc-otdr-graph-traversal',
    title: 'The OTDR Reverse-Traversal Engine: Graph Cycles & Frankenstein Coordinates',
    subtitle: 'Reversing physical optical pulses on live maps without freezing the UI thread or launching the canvas into outer space',
    category: 'Architecture & KMP',
    date: 'Feb – Aug 2026',
    readTime: '3 min read',
    badge: '±2m Fault Pinpoint',
    storyType: 'war-story',
    summary:
      'An Optical Time-Domain Reflectometer (OTDR) measures the distance to a physical cable break. To turn raw meters into a precise GPS repair pin on OpenStreetMap and Google Maps, I engineered a cycle-safe reverse-traversal engine while solving coordinate space distortion on the canvas.',
    theMistake:
      'I assumed outside-plant fiber topologies were always simple acyclic trees and that canvas screen coordinates after graphicsLayer zoom could be used directly to calculate viewport centering.',
    theLesson:
      'Physical infrastructure is messier than graph theory. Graph traversals in physical domain modeling must guard against real-world cycles, acknowledge physical optical divergence points, and strictly decouple logical model coordinates from rendered screen-space transformations.',
    sections: [
      {
        heading: 'Mapping Laser Pulses to GPS Coordinates',
        content:
          'When an underground optical fiber is severed by an excavator, an OTDR instrument shoots a light pulse and measures the reflection delay, outputting a scalar distance (e.g. 1,420 meters). Field crews need to see exactly where that break is on a live map. Our engine had to trace that exact distance along geographic cable spans and drop an interactive GPS pin for field repair teams.',
        type: 'text',
      },
      {
        heading: 'The Graph Cycle ANR & Splitter Ambiguity',
        content:
          'When field engineers modeled ring-protected feeder lines or test loops, our recursive graph traversal entered an infinite loop, freezing the Android UI thread with an Application Not Responding (ANR) error. Worse, when the laser pulse reached a 1:8 splitter, the pulse physically traveled down all 8 branches simultaneously. The initial algorithm picked Branch 0 arbitrarily, dropping repair pins on the completely wrong street!',
        type: 'mistake',
      },
      {
        heading: 'The "Frankenstein Rect" Viewport Teleportation',
        content:
          'Simultaneously, we tackled a bizarre canvas UX glitch: searching for a node and tapping the result caused the diagram to vanish into empty black space. The camera centering function read the node\'s bounding rectangle in screen coordinates after graphicsLayer scaling had already applied 2.5x zoom, and then multiplied by zoom again. At 2.5x zoom, this caused an exponential coordinate offset, catapulting the viewport thousands of pixels away.',
        callout:
          'Never mix transformed screen-space coordinates with logical layout coordinates when calculating camera pan and zoom offsets.',
        type: 'breakthrough',
      },
      {
        heading: 'Cycle Protection & Power-Aware Heuristics',
        content:
          'I re-architected the OTDR engine with a visited-node cycle detector. For asymmetric optical couplers (90/10, 80/20), the engine automatically follows the high-power THRU (90%) trunk line. For symmetric 1:N splitters, it halts and prompts the technician to pick the active downstream fiber strand. On the Canvas, we separated unscaled logical layout coordinates from camera transforms and implemented a hardware-accelerated 50dp infinite grid using drawWithCache.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Fault Accuracy', value: '±2.0 m' },
      { label: 'Traversal Speed', value: '<1.2 ms' },
      { label: 'Canvas Grid', value: '60 fps' },
    ],
    tags: ['Graph Algorithms', 'OTDR Fault Locator', 'GIS Mapping', 'Jetpack Compose', 'Coordinate Transforms'],
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
            else -> null // Symmetric splitter requires technician branch selection
        }
    }
    return null
}`,
    },
  },
  {
    id: 'fibercalc-defensive-mobile-hardening',
    title: 'The 108MP Camera Heap Crash & The Android Lifecycle Minefield',
    subtitle: 'What happens when 120MB bitmap allocations, unclosed Skia graphics handles, and Jetpack Compose Context wrapping collide on low-RAM devices',
    category: 'Defensive Engineering',
    date: 'Apr – Aug 2026',
    readTime: '4 min read',
    badge: '0.00% ANR · Sub-1.3% Crash',
    storyType: 'deep-dive',
    summary:
      'Field technicians use 108MP cameras in harsh outdoor environments on budget devices. When uncompressed photo byte arrays exhausted the JVM heap, native Skia PDF handles leaked memory, and Compose context wrapping broke activity result contracts, I led a full defensive hardening overhaul.',
    theMistake:
      'I treated mobile device resources like unlimited desktop RAM — decoding 108MP camera photos with raw BitmapFactory.decodeFile(), wrapping Compose contexts with ContextImpl, and letting native MapViews and PDF Skia documents escape lifecycle disposal.',
    theLesson:
      'Mobile defensive engineering means assuming the device is always on the verge of running out of memory, losing power, or rotating screens. Never allocate un-sampled bitmaps, never let native C++ handles escape try-finally, and never trigger UI windows without verifying lifecycle state.',
    sections: [
      {
        heading: 'The 108MP Field Photo Heap Exhaustion',
        content:
          'Field technicians document physical pole tags, splice trays, and cable damage using modern smartphone cameras (48MP, 64MP, 108MP). When attaching photos to nodes, our original code called BitmapFactory.decodeFile(path). Decoding a 108MP photo directly attempted to allocate 120MB uncompressed ARGB_8888 byte arrays into the process heap. On budget 2GB–3GB RAM devices, taking two photos triggered instant java.lang.OutOfMemoryError.',
        type: 'mistake',
      },
      {
        heading: 'The Native Skia Leak & Dynamic Localization Crash',
        content:
          'Our PDF export engine created PdfDocument() instances to render technical BOM sheets. If an IOException occurred during disk write, the method exited before reaching document.close(), permanently locking Android’s native Skia C++ rendering context and leaking 15MB+ per failure. Meanwhile, attempting in-app language switching by overriding LocalContext with context.createConfigurationContext() stripped ActivityResultRegistryOwner, crashing photo attachments and Google Sign-In with an IllegalStateException!',
        callout:
          'ContextImpl is not an Activity and does not implement ActivityResultRegistryOwner. Overriding Compose LocalContext with a wrapped configuration context breaks all activity result contracts.',
        type: 'text',
      },
      {
        heading: 'The Lock-Screen Black Overlay & 23 (!!) Traps',
        content:
          'If a technician locked their phone right as an interstitial ad completed loading, the callback attempted to attach a window token to a destroyed activity, throwing BadTokenException and leaving a pitch-black overlay on unlock. A full stability audit also uncovered 23 forced unwrap (!!) operators waiting to trigger NullPointerExceptions on malformed imported files.',
        type: 'mistake',
      },
      {
        heading: 'Two-Pass Sub-Sampling & Strict Lifecycle Gates',
        content:
          'I implemented two-pass sub-sampled bitmap decoding with inJustDecodeBounds, calculating inSampleSize to bound memory consumption at 1920x1080 (~6MB). I wrapped PdfDocument and MapView instances in strict try-finally and DisposableEffect lifecycle hooks. We preserved MainActivity as LocalContext, eliminated all 23 forced unwraps in favor of elvis operators, and guarded all ad displays with lifecycle.isAtLeast(RESUMED).',
        type: 'breakthrough',
      },
    ],
    metrics: [
      { label: 'Photo Memory', value: '120MB → 6MB' },
      { label: 'Native Leaks', value: '0 KB' },
      { label: 'Null-Safety', value: '0 (!!) Traps' },
    ],
    tags: ['Android Vitals', 'Memory Profiling', 'Jetpack Compose', 'Skia Graphics', 'Defensive Coding'],
    relatedProjectId: 'fiberopticcalc',
    snippet: {
      title: 'Memory-Safe Sub-Sampled Bitmap Decoding',
      language: 'kotlin',
      code: `// Two-pass memory-safe decoding bounding 108MP photos to ~6MB
fun decodeSampledBitmapFromFile(file: File, reqWidth: Int = 1920, reqHeight: Int = 1080): Bitmap? {
    return try {
        val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(file.absolutePath, options)
        
        options.inSampleSize = calculateInSampleSize(options, reqWidth, reqHeight)
        options.inJustDecodeBounds = false
        options.inPreferredConfig = Bitmap.Config.RGB_565
        
        BitmapFactory.decodeFile(file.absolutePath, options)
    } catch (e: Throwable) {
        Log.e("PhotoStorageManager", "Defensive allocation fallback triggered", e)
        null
    }
}`,
    },
  },
  {
    id: 'fibercalc-security-and-recomposition',
    title: 'From Silent Data Wipes to 60fps: Safety, Security & High-Density Compose',
    subtitle: 'Neutralizing CWE-1236 CSV spreadsheet exploits, preventing accidental fiber port decimation, and curing 12fps typing lag in 64-port splitters',
    category: 'Performance & Security',
    date: 'Apr – Aug 2026',
    readTime: '3 min read',
    badge: 'CWE-1236 Patched · 60fps',
    storyType: 'reflection',
    summary:
      'When field reports risked spreadsheet command execution and 1,400-line monolithic Compose sheets dropped typing framerates to 12fps, I implemented strict formula sanitization, dynamic luminance borders, and virtualized LazyColumn decomposition.',
    theMistake:
      'I trusted user text fields when exporting CSV Bill of Materials (BOM) files, and built complex 64-port splitter editor forms as a single 1,400-line monolithic Column Composable.',
    theLesson:
      'Every external export is an attack surface, and every dynamic UI list is a performance bottleneck. Sanitize user data before writing to spreadsheets, and virtualize/decompose UI hierarchies before forms scale to dozens of interactive inputs.',
    sections: [
      {
        heading: 'The CSV Formula Injection Vulnerability (CWE-1236)',
        content:
          'FiberOpticCalc exports Bill of Materials (BOM), optical loss budgets, and splice schedules as CSV files for contractors to open in Excel or Google Sheets. During our pre-production security audit, we discovered that user-entered node names were written raw into CSV cells. If a shared design contained a node name starting with "=", "+", "-", or "@", opening the report in Excel executed the formula, potentially running arbitrary commands or exfiltrating data.',
        type: 'mistake',
      },
      {
        heading: 'The 12fps Recomposition Stutter in 64-Port Splitters',
        content:
          'In the node editor, configuring large 1:64 splitters or 288-core fiber ribbon closures required rendering dozens of color swatches, loss inputs, and labels. NodeEditSheet.kt was written as a massive 1,400-line monolithic Composable in a standard Column. Typing a single character into a label caused the entire sheet and all 64 port sub-items to recompose, dropping framerate from 60fps to 12fps on mid-range phones.',
        type: 'text',
      },
      {
        heading: 'The Silent Downsizing Decimation & White Swatch Bug',
        content:
          'Two subtle UX bugs also hurt field usability. First, downsizing a 1:8 splitter to 1:4 automatically sliced the array, silently deleting downstream subtrees of 15 customer drop terminals with zero confirmation. Second, in EIA/TIA-598 fiber coding, Core #12 is pure White (#FFFFFF). On light theme devices, White fiber swatches had no border, making Fiber #12 completely invisible in outdoor sunlight!',
        callout:
          'Downsizing multi-port hardware components must always enforce destructive confirmation barriers when child nodes exist on pruned ports.',
        type: 'breakthrough',
      },
      {
        heading: 'Sanitization, Virtualization & Luminance-Aware Borders',
        content:
          'I engineered a CSV sanitization layer that detects leading trigger characters and prepends an apostrophe (\'), forcing spreadsheet engines to treat all fields as literal string text. I decomposed NodeEditSheet into virtualized LazyColumn subcomponents with memoized lambdas, restoring silky 60fps. Finally, I built luminance-aware swatch borders and a proactive BranchManagementDialog to block accidental branch deletion.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'UI Framerate', value: '12 → 60 fps' },
      { label: 'Max Splitter', value: '1:64 Ports' },
      { label: 'Vulnerability', value: 'CWE-1236 Patched' },
    ],
    tags: ['App Security', 'CWE-1236', 'Jetpack Compose', 'LazyColumn', 'State Recomposition'],
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
    id: 'fibercalc-zero-dollar-cloud',
    title: 'The Zero-Dollar Cloud: Scaling to 25K MAU on Free Tier & Drive OAuth Modernization',
    subtitle: 'How eliminating 3.75M monthly database reads, modernizing Google Identity, and auditing UX flows achieved $0.00 cloud infrastructure costs',
    category: 'Solo Shipping',
    date: 'Jan – Aug 2026',
    readTime: '3 min read',
    badge: '$0.00 Infra · 25K MAU',
    storyType: 'deep-dive',
    summary:
      'Building an independent utility means keeping server overhead at zero. By migrating from real-time database listeners to Remote Config edge caching, modernizing Google Drive OAuth, and fixing monetization UX traps, I engineered a sustainable zero-cost cloud architecture.',
    theMistake:
      'Early cloud architecture drafted real-time Firestore listeners for developer announcements and community polls. At 25,000 MAU, active listeners would generate 3.75 million reads per month, blowing past free tiers into recurring monthly bills.',
    theLesson:
      'Cost optimization is an architectural discipline. You don\'t need expensive backends when you leverage edge caches, Remote Config, client-side compute, and user-owned storage (Google Drive). Build systems that can scale 10x without billing surprises.',
    sections: [
      {
        heading: 'The Economic Constraint: Sustainable Zero-Cost Scale',
        content:
          'FiberOpticCalc was deliberately engineered with an architectural constraint: $0.00 ongoing infrastructure costs up to 25,000 Monthly Active Users. By keeping server bills at zero, the app remains permanently sustainable on low subscription pricing and non-intrusive ads without venture capital or recurring server maintenance overhead.',
        type: 'text',
      },
      {
        heading: 'The 3.75 Million Read Threat & Deprecated OAuth Trap',
        content:
          'Early architectural drafts considered real-time Firestore listeners for developer broadcasts and community feedback. Calculations revealed that 25,000 MAU would generate 3.75 million Firestore reads per month, exceeding the 50,000/day free limit within hours. Meanwhile, our cloud backup system relied on legacy GoogleAccountCredential, which began throwing ApiException: 10 (Developer Error) on Android 14 and 15 devices.',
        type: 'mistake',
      },
      {
        heading: 'The Zero-Client-Read Pipeline & Drive REST API v3',
        content:
          'I replaced Firestore announcement listeners with Firebase Remote Config parameters ($0 cost, infinite cached fetches). Community poll submissions were routed to a write-only Firestore collection with strict security rules — achieving 0 client reads at scale. I modernized DriveManager to use Google Identity AuthorizationClient combined with direct HTTP REST API v3 Bearer token exchanges, resolving all Android 14/15 authentication failures.',
        type: 'breakthrough',
      },
      {
        heading: 'Monetization Fairness & Dead Code Purge',
        content:
          'We also audited monetization flows to fix Bug #13: quota-exhausted users were forced to watch a rewarded ad to open the report wizard AND a second ad to generate the PDF! We moved the single ad gate strictly to the final export button. Finally, we purged 37 unused tutorial steps and 5 orphaned flows, reducing APK payload and maintenance surface.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Monthly Cloud Cost', value: '$0.00 / mo' },
      { label: 'Client Firestore Reads', value: '0 Reads' },
      { label: 'Drive Backup Sync', value: 'REST API v3' },
    ],
    tags: ['Serverless', 'Firebase Remote Config', 'Google Drive API', 'Zero-Cost Infra', 'Cloud Architecture'],
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
    id: 'solo-shipping-fiberopticcalc',
    title: 'The Loneliness of 259 Commits & The Vault Crash',
    subtitle: 'How a user email about a lost survey in an underground vault forced me to master atomic file persistence',
    category: 'Solo Shipping',
    date: 'Jan – Aug 2026',
    readTime: '3 min read',
    badge: '5.73K+ Installs · 4.6★',
    storyType: 'reflection',
    summary:
      'Building an app solo means there is no QA team or senior engineer to catch your bugs. When a field technician emailed me about losing work underground, it reshaped my entire philosophy around offline-first defensive architecture.',
    theMistake:
      'In early versions, I saved survey files using standard direct file overwrite asynchronously on Dispatchers.IO. Because Dispatchers.IO is a multi-threaded pool, rapid consecutive edits caused thread write inversion, and battery drops left half-written corrupted JSON files.',
    theLesson:
      'Software craftsmanship isn’t just shiny UI or complex graph math. It’s obsessing over the invisible edge cases so the tool never lets down a technician standing in the rain in an underground vault with 4% battery.',
    sections: [
      {
        heading: 'The Email That Stung',
        content:
          'About a month after publishing FiberOpticCalc, I received an email from a fiber technician: "I was in an underground utility vault with no cell reception. The app closed when my battery dropped to 2%, and my 2-hour fiber survey file was corrupted." That felt like a punch in the gut.',
        type: 'mistake',
      },
      {
        heading: 'The Concurrency Race Condition in Dispatchers.IO',
        content:
          'Digging into logcat and storage traces revealed the root cause: when technicians made rapid edits (dragging GPS pins or typing node names), multiple coroutines launched on Dispatchers.IO. Because it is an unconstrained thread pool, Thread B (older snapshot) could finish writing after Thread A (newer snapshot), silently reverting edits. If the OS killed the process mid-write, direct file.writeText() left a truncated, unparseable JSON file.',
        type: 'text',
      },
      {
        heading: 'Building the Serialized Atomic Write Engine',
        content:
          'I stopped feature work for two weeks and rewrote the storage layer. I enforced single-threaded I/O serialization using Dispatchers.IO.limitedParallelism(1). Surveys are serialized to a temporary .tmp file with a CRC32 checksum, flushed to physical flash memory via fsync(), and only then atomically renamed over the main database file via the OS kernel.',
        type: 'breakthrough',
      },
      {
        heading: '5.73K+ Installs & 0.00% ANR',
        content:
          'Today, FiberOpticCalc has scaled to 5.73K+ installs and 2.09K+ active devices with a 4.6★ rating on Google Play. More importantly, our Android Vitals crash rate is sub-1.3% and ANR rate is 0.00%. That painful email was the best thing that ever happened to the project.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Total Installs', value: '5.73K+' },
      { label: 'Active Devices', value: '2.09K+' },
      { label: 'ANR Rate', value: '0.00%' },
    ],
    tags: ['Kotlin', 'Jetpack Compose', 'Solo Shipping', 'Atomic Storage', 'Play Store'],
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
    id: 'reverse-engineering-24s-bms',
    title: 'No Documentation, A Multimeter, and Wireshark',
    subtitle: 'Extracting 24-cell battery telemetry from an uncooperative vendor Bluetooth protocol',
    category: 'Reverse Engineering',
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
          'We had a 24S Lithium pack wired to a JBD/Xiaoxiang smart BMS. The vendor’s mobile app showed cell voltages, but they wouldn’t respond to emails requesting protocol documentation or APIs. Commercial CAN-based BMS units were $1,500+ — well beyond our team’s budget. Our NVIDIA Jetson autonomous supervisor was completely blind to cell temperatures.',
        type: 'text',
      },
      {
        heading: 'Staring at Hex Streams in the Dark',
        content:
          'I turned on Android Bluetooth HCI snoop logging, recorded app sessions, and pulled btsnoop_hci.log into Wireshark. At first, it looked like random garbage. On Linux, BlueZ was slicing packets and dropping connections every few seconds.',
        type: 'mistake',
      },
      {
        heading: 'Finding the 0xDD Pattern',
        content:
          'I started comparing the voltages on the phone screen with raw hex values in Wireshark. Suddenly, the structure revealed itself: frames always began with 0xDD and ended with 0x77. Command 0x04 returned 48 bytes — exactly 24 two-byte big-endian cell millivolts. The trailing two bytes were a 16-bit two’s complement checksum.',
        type: 'breakthrough',
      },
      {
        heading: 'Sub-10ms Linux Daemon',
        content:
          'I wrote a lightweight C++ daemon with custom MTU negotiation and an auto-reconnect supervisor. It continuously fed 24 cell voltages and 4 thermal probes into our Jetson compute stack with sub-10ms latency.',
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
          'With judging 5 hours away at DevClash Pune, our 4 autonomous agents (Market Analyst, Trader, Contract Engineer, Growth) were frozen. When Agent 1 passed a prompt to Agent 2, recursive async promises locked the Node event loop. My teammates wanted to add setTimeout delays to force execution ordering.',
        type: 'mistake',
      },
      {
        heading: 'The Courage to Delete Bad Code',
        content:
          'I knew band-aids would fail during a live presentation in front of judges. I made the executive call: we hit git stash, deleted 350 lines of tangled promise chains, and redesigned the core as an event-driven Firestore message queue.',
        type: 'breakthrough',
      },
      {
        heading: 'Live Deployment on Base',
        content:
          'By decoupling agents into discrete event listeners and enforcing strict Gemini 1.5 JSON schemas, each agent executed predictably. During our live demo at 10:30 AM, CottonX autonomously generated, compiled, and deployed a verified smart contract on the Base testnet with zero hiccups.',
        type: 'lesson',
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
];
