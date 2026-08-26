import { Story } from '@/types';

export const STORIES: Story[] = [
  {
    id: 'abaja-crisis-migration',
    title: 'The 8-Hour aBAJA Silicon Crisis',
    subtitle: 'Overnight bare-metal rewrite from fried STM32 to ESP32 FreeRTOS in the racetrack pits',
    category: 'Embedded & Crisis',
    date: 'Jan 2025 – Feb 2026',
    badge: 'National 1st Place',
    summary:
      'When our primary STM32 steering & throttle ECU suffered critical hardware brownout hours before national competition scrutineering, I led an emergency overnight re-architecture to ESP32 FreeRTOS over CAN, securing 1st Place in Autonomous Emergency Braking (AEB).',
    sceneSetting:
      'It was 10:15 PM at the aBAJA racing paddock. The temperature had dropped to 11°C, grease and solder smoke hung in the air, and our vehicle inspection gate was scheduled strictly for 6:00 AM. During our final high-vibration throttle test, our primary STM32 Nucleo board went silent — a sudden 12V transient had fried the onboard 3.3V regulator and latched the MCU.',
    context:
      'Our autonomous off-road vehicle (Team Abhyuday Racing) relied on a distributed 3-ECU network. An NVIDIA Jetson node ran lidar/radar perception, while the STM32 acted as the master drive-by-wire controller, managing 100Hz PID steering actuation, DAC throttle modulation, and CAN 2.0B arbitration.',
    crisisOrChallenge:
      'We were in a foreign pit garage with zero spare STM32 Nucleo boards matching our PCB pinout. The scrutineering deadline was an unforgiving hard wall: if the car couldn\'t steer and execute closed-loop emergency braking by dawn, a year of 25+ engineers\' work was disqualified on the spot.',
    tradeoffs: [
      {
        option: 'Field Rework with Gas Soldering Iron',
        pros: 'Kept the original STM32 firmware intact.',
        cons: 'Extremely high risk of lifted pads, unknown internal silicon damage, and catastrophic failure on the high-speed track.',
        selected: false,
      },
      {
        option: 'Lock Steering & Forfeit Autonomous Runs',
        pros: 'Avoided overnight work; guaranteed static inspection pass.',
        cons: 'Zero points for AEB and ACC dynamic events — completely throwing away months of R&D.',
        selected: false,
      },
      {
        option: 'Complete Overnight ESP32 FreeRTOS Re-Architecture',
        pros: 'Dual-core processing (Core 0 dedicated to CAN, Core 1 to PID), built-in TWAI transceiver interface, resilient hardware.',
        cons: 'Required rewriting bare-metal drivers, recalibrating PID loops, and bench-testing in less than 7 hours.',
        selected: true,
      },
    ],
    theThoughtProcess:
      'We chose the overnight rewrite because of the ESP32\'s dual-core architecture. On the STM32, we struggled with interrupt jitter between high-speed CAN packet processing and 100Hz AS5600 magnetic encoder sampling. Moving to ESP32 FreeRTOS allowed us to pin the TWAI/CAN driver to Core 0 with zero queue contention, while Core 1 ran deterministic 10ms PID control ticks.\n\nWe wired dual MCP4725 I2C DACs for redundant throttle voltage generation, implemented hardware watchdog timers to kill the throttle if CAN heartbeats lagged beyond 50ms, and flashed the new bare-metal firmware by 4:45 AM.',
    engineeringSolution:
      '1. Hardware Adaptation: Breadboarded and soldered an emergency ESP32 daughterboard, remapping I2C to AS5600 12-bit angle encoders and MCP4725 DACs.\n2. Dual-Core FreeRTOS Partitioning: Core 0 handled 500kbps TWAI CAN message queues; Core 1 executed closed-loop PID steer actuation.\n3. Fail-Safe Heartbeat Daemon: Built a hardware watchdog cutting throttle to 0.8V idle and firing pneumatic emergency brakes if CAN latency spiked above 50ms.\n\nBy 5:30 AM, the car executed a clean 30 km/h Autonomous Emergency Braking run, halting at exactly 6.2 meters to win 1st Place Nationally.',
    takeaway:
      'Strict modularity, clean hardware abstraction layers (HAL), and calm diagnostic triage under pressure are not just best practices — they are the only reason a racing car survived an impossible silicon swap overnight.',
    photos: [
      {
        url: '/images/stories/abaja-paddock.jpg',
        caption: 'Paddock workbench at 3:30 AM: Soldering ESP32 TWAI transceiver leads under paddock lamps.',
        location: 'aBAJA Racing Paddock',
        timestamp: '03:42 AM',
      },
      {
        url: '/images/stories/abaja-track.jpg',
        caption: 'Final dynamic test run: The vehicle executing full-lock steering and sub-12ms emergency braking.',
        location: 'National Test Track',
        timestamp: '07:15 AM',
      },
    ],
    metrics: [
      { label: 'Rewrite Window', value: '7.5 hrs' },
      { label: 'AEB Halt Distance', value: '6.2m / 6.0m' },
      { label: 'National Result', value: '1st Place' },
    ],
    tags: ['ESP32', 'FreeRTOS', 'CAN Bus', 'Crisis Engineering', 'Drive-by-Wire', 'Failsafe'],
    relatedProjectId: 'abhyuday-dbw',
    snippet: {
      title: 'FreeRTOS Dual-Core CAN & Actuator Loop',
      language: 'cpp',
      code: `// Core 0: Microsecond-precision CAN transmission
void TaskCAN(void *pvParameters) {
  twai_message_t tx_frame;
  tx_frame.identifier = CAN_ID_STEER_STATUS;
  tx_frame.flags = TWAI_MSG_FLAG_NONE;
  tx_frame.data_length_code = 8;
  
  for(;;) {
    if (xQueueReceive(xSteerTelemetryQueue, &tx_frame.data, portMAX_DELAY)) {
      twai_transmit(&tx_frame, pdMS_TO_TICKS(5));
      vTaskDelay(pdMS_TO_TICKS(10)); // 100Hz telemetry
    }
  }
}`,
    },
  },
  {
    id: 'can-firewall-optimization',
    title: 'Hunting Microseconds in the Assembly Weeds',
    subtitle: 'Slashing Mahalanobis distance calculation by 2.7x to protect automotive 200 µs frame deadlines',
    category: 'Performance & Security',
    date: 'Aug 2026 – Ongoing',
    badge: '99.9% Block Rate',
    summary:
      'Safety-critical automotive CAN buses operate on razor-thin 200 µs frame deadlines. By mathematically pruning collinear statistical features and vectorizing fixed-point math via ARM CMSIS-DSP SIMD intrinsics on an STM32F446RE, I compressed dual-gate inspection to 5.92 µs — consuming only 3% of the real-time budget.',
    sceneSetting:
      'Surrounded by logic analyzer clips and an oscilloscope probing CAN_H/CAN_L differential lines, I was staring at the DWT cycle counter in STM32CubeIDE. Every time we simulated a high-frequency RPM injection attack, the CAN RX mailbox overflowed. The CPU was drowning in floating-point matrix inversions while legitimate brake frames were getting queued.',
    context:
      'Modern vehicles trust all broadcast CAN frames implicitly. To stop malicious injection from compromised OBD-II dongles or telematics bridges, we designed an inline hardware firewall running on an STM32F446RE (180 MHz ARM Cortex-M4).',
    crisisOrChallenge:
      'Our initial 4-variable Mahalanobis anomaly detector took 2,284 clock cycles (12.7 µs). In automotive systems under heavy bus load (100% saturation at 500 kbps), frames arrive every ~200 µs. A 12.7 µs inspection latency created buffer congestion and delayed safety-critical steer/brake frames.',
    tradeoffs: [
      {
        option: 'Naive Static Lookup Table',
        pros: 'Executes in 0.35 µs with negligible CPU load.',
        cons: 'Zero defense against stealthy payload manipulation or RPM spoofing with valid arbitration IDs.',
        selected: false,
      },
      {
        option: 'Higher Clock Frequency Hardware (e.g. Jetson/DSP)',
        pros: 'Raw compute handles 4D matrix operations easily.',
        cons: 'Adds $150+ BoM cost, 10x power draw, and high boot latency unacceptable for microsecond gateway firewalls.',
        selected: false,
      },
      {
        option: '2D Statistical Feature Pruning + CMSIS-DSP SIMD Vectorization',
        pros: 'Preserves 99.9% anomaly detection accuracy while cutting cycle count by 2.7x on existing $8 STM32 silicon.',
        cons: 'Required rigorous offline covariance training across HCRL datasets and manual assembly register optimization.',
        selected: true,
      },
    ],
    theThoughtProcess:
      'Why did 4D Mahalanobis math choke the CPU? A 4×4 inverse covariance matrix calculation requires 16 multiplications and 12 additions per frame. When I ran correlation analysis on the HCRL attack datasets, I found that inter-arrival time and payload entropy were mathematically collinear. They added computational noise without improving detection recall.\n\nBy pruning from 4D down to 2D (Payload Delta + Inter-Arrival Jitter), the matrix collapsed to a 2×2 calculation. Combining this with ARM CMSIS-DSP `float32_t` SIMD multiply-accumulate intrinsics dropped execution from 2,284 cycles to 832 cycles (5.92 µs total with Gate 1 static filters).',
    engineeringSolution:
      '1. Mathematical Optimization: Pruned redundant dimensions, shrinking the inverse covariance matrix to 4 pre-computed constants in flash memory.\n2. SIMD Intrinsics: Replaced standard math library calls with CMSIS-DSP assembly-optimized instructions.\n3. Register Spilling Elimination: Tuned compiler optimization flags (`-O3 -flto`) and marked critical functions `__attribute__((always_inline))` to keep operands in FPU registers s0–s7.',
    takeaway:
      'When optimizing hard real-time embedded systems, algorithmic simplification and architectural hardware alignment always outperform throwing bigger processors at the problem.',
    photos: [
      {
        url: '/images/stories/firewall-oscilloscope.jpg',
        caption: 'Logic analyzer capture: Verifying 5.92 µs inspection window between CAN RX interrupt and mailbox forward.',
        location: 'Embedded Security Lab',
        timestamp: '11:20 PM',
      },
      {
        url: '/images/stories/firewall-stm32.jpg',
        caption: 'Dual-CAN transceiver test fixture on STM32F446RE with active hardware isolation relays.',
        location: 'Testing Bench 2',
        timestamp: '04:15 PM',
      },
    ],
    metrics: [
      { label: 'Frame Latency', value: '5.92 µs' },
      { label: 'Cycle Reduction', value: '2.7x' },
      { label: 'RT Frame Budget', value: '3%' },
    ],
    tags: ['STM32F446', 'CMSIS-DSP', 'Mahalanobis Distance', 'CAN Bus', 'Assembly Tuning', 'Cybersecurity'],
    relatedProjectId: 'can-firewall',
    snippet: {
      title: 'CMSIS-DSP 2D Distance Vectorization',
      language: 'c',
      code: `// Gate 2: 832 CPU cycles (down from 2,284)
static inline float32_t calculate_mahalanobis_2d(float32_t d0, float32_t d1) {
  // Pre-computed inverse covariance matrix entries
  float32_t v0 = d0 * INV_COV_00 + d1 * INV_COV_10;
  float32_t v1 = d0 * INV_COV_01 + d1 * INV_COV_11;
  // CMSIS DSP f32 multiply-accumulate
  return (d0 * v0) + (d1 * v1);
}`,
    },
  },
  {
    id: 'reverse-engineering-24s-bms',
    title: 'Sniffing Packets in the Dark: 24S BMS Telemetry',
    subtitle: 'Decoding an undocumented Bluetooth serial protocol for real-time 98.8V battery health',
    category: 'Reverse Engineering',
    date: 'May – Jun 2026',
    badge: 'Zero Docs Telemetry',
    summary:
      'When our electric off-road vehicle required continuous 24-cell thermal and voltage monitoring from an undocumented JBD smart BMS, I sniffed raw BLE HCI frames on Linux, resolved MTU slicing bugs, and decoded the proprietary serial protocol to build a sub-10ms telemetry daemon.',
    sceneSetting:
      'Sitting on the workshop floor beside a 98.8V lithium battery pack with insulated gloves, a laptop running Wireshark, and an Android smartphone. The vendor battery app displayed colorful cell graphs, but the manufacturer refused to share protocol specs or APIs with student teams. Our Jetson Orin autonomous compute node was completely blind to cell temperatures.',
    context:
      'In high-performance off-road racing, individual cell over-discharge or thermal imbalance can lead to catastrophic battery destruction. We needed automated voltage telemetry streaming directly into our ROS2 vehicle supervision daemon.',
    crisisOrChallenge:
      'Connecting to the BMS over Bluetooth on Linux resulted in truncated bytes and random disconnects. Without documentation, every byte string looked like random hexadecimal noise, and a single wrong command could trigger an unwanted BMS sleep mode.',
    tradeoffs: [
      {
        option: 'Buy Commercial Industrial BMS with CAN API',
        pros: 'Documented DBC files and plug-and-play CAN communication.',
        cons: 'Cost $1,800+ (exceeding total electrical team budget by 3x) and had a 6-week shipping lead time.',
        selected: false,
      },
      {
        option: 'Mount Smartphone to Cockpit for Visual Monitoring',
        pros: 'Zero reverse-engineering required.',
        cons: 'No programmatic integration with Jetson failsafe supervisor or emergency shutdown relays.',
        selected: false,
      },
      {
        option: 'Snoop Bluetooth HCI Packets & Reverse-Engineer Protocol',
        pros: 'Zero added cost; full programmatic control and sub-10ms Linux telemetry daemon.',
        cons: 'Required protocol reverse analysis, packet reconstruction, and custom C++ BlueZ client.',
        selected: true,
      },
    ],
    theThoughtProcess:
      'I enabled Android Developer Bluetooth HCI Snoop logging and recorded 15 minutes of app interactions: connecting, polling cell status, and triggering balancing. Loading `btsnoop_hci.log` into Wireshark revealed recurring frames beginning with `0xDD` and ending with `0x77`.\n\nBy comparing vendor app UI readouts against hex payloads, I deduced the frame format: byte 0 was the start delimiter, byte 1 was the command register (`0x04` for cell voltages), byte 2 was payload length, followed by 24 two-byte big-endian millivolt values. The trailing two bytes were a 16-bit two\'s complement additive checksum.',
    engineeringSolution:
      '1. Protocol Reverse Engineering: Mapped command registers for cell voltages (`0x04`), temperatures (`0x03`), and pack state (`0x00`).\n2. Linux BlueZ Daemon: Wrote a lightweight C++ daemon negotiating a 512-byte ATT MTU to prevent packet fragmentation.\n3. Automatic Reconnect Watchdog: Built a systemd service that auto-reconnects in <800ms upon signal loss.',
    takeaway:
      'When hardware is a black box, logic analyzers and network capture tools never lie. You don\'t need vendor permission to understand the signals crossing your own wires.',
    photos: [
      {
        url: '/images/stories/bms-pack.jpg',
        caption: 'The 24S 98.8V battery module wired to the JBD balancer harness during initial bench testing.',
        location: 'EV Powertrain Lab',
        timestamp: '02:30 PM',
      },
      {
        url: '/images/stories/bms-wireshark.jpg',
        caption: 'Wireshark BLE HCI trace: Isolating 0xDD start bytes and 24 individual 16-bit cell voltage registers.',
        location: 'Workbench Terminal',
        timestamp: '08:45 PM',
      },
    ],
    metrics: [
      { label: 'Cells Monitored', value: '24 Cells' },
      { label: 'Vendor Docs', value: '0 pages' },
      { label: 'Telemetry Latency', value: '<10 ms' },
    ],
    tags: ['BLE', 'Packet Sniffing', 'Wireshark', 'Linux BlueZ', 'Battery Management', 'EV Systems'],
    relatedProjectId: 'abhyuday-dbw',
    snippet: {
      title: 'JBD BMS Packet Frame Verification',
      language: 'cpp',
      code: `// Verify JBD BMS frame: 0xDD (Start), 0x04 (Cell Volts), Length, Payload, Checksum
bool verify_bms_frame(const uint8_t *buf, size_t len) {
  if (buf[0] != 0xDD || buf[len - 1] != 0x77) return false;
  uint16_t checksum = (buf[len - 3] << 8) | buf[len - 2];
  uint16_t calc = 0;
  for (size_t i = 2; i < len - 3; i++) calc += buf[i];
  return ((0x10000 - calc) & 0xFFFF) == checksum;
}`,
    },
  },
  {
    id: 'solo-shipping-fiberopticcalc',
    title: '252 Commits Solo: Shipping FiberOpticCalc to 5.73K+ Users',
    subtitle: 'Recursive optical graph math, street route-bending, and crash-proof atomic persistence',
    category: 'Solo Shipping',
    date: 'Dec 2025 – Present',
    badge: '5.73K+ Installs · 4.6★',
    summary:
      'Building an end-to-end telecom engineering platform from zero to 5.73K+ Google Play Store installs, 2.09K+ active devices, and a 4.6★ rating as a solo developer: solving recursive PON split attenuation, draggable geospatial route snapping, and crash-proof write-ahead storage.',
    sceneSetting:
      'Late evening in my room with multiple optical time-domain reflectometer (OTDR) trace logs open on one screen and Android Studio on the other. User feedback emails from telecom technicians in the field were coming in: "We need to calculate multi-kilometer trunk losses underground with zero cell reception."',
    context:
      'Field technicians and telecom network architects regularly calculate Passive Optical Network (PON) power budgets using fragile Excel sheets on laptops in dusty utility trenches. FiberOpticCalc was conceived as an offline-first native Android powerhouse.',
    crisisOrChallenge:
      'Underground utility vaults have zero cellular connectivity. If a field tech spends 45 minutes mapping a 20-kilometer fiber line and the phone battery dies mid-save, a corrupted file ruins an entire day\'s survey. Furthermore, complex PON splitters (1:2 to 1:128 asymmetric couplers) created recursive power equations that standard procedural loops failed to model accurately.',
    tradeoffs: [
      {
        option: 'Cloud-First Sync (Firebase/Supabase)',
        pros: 'Effortless cross-device sync and fast user account creation.',
        cons: 'Completely unusable underground or in rural fiber corridors without LTE connectivity.',
        selected: false,
      },
      {
        option: 'Flat Spreadsheet Math Engine',
        pros: 'Simple 1D formulas, easy to implement in a weekend.',
        cons: 'Cannot model real-world tree topologies, multi-tier splitters, or geospatial cable route curves.',
        selected: false,
      },
      {
        option: 'Recursive Graph Engine + Local Atomic Write-Ahead Storage',
        pros: '100% offline reliability with 0.00% ANR, accurate recursive PON loss modeling, and draggable OpenStreetMap route-bending.',
        cons: 'Significantly higher engineering complexity; required custom file serializers and crash-proof write buffers.',
        selected: true,
      },
    ],
    theThoughtProcess:
      'I prioritized defensive, offline-first reliability over flashy cloud features. For data safety, I designed a two-stage atomic persistence engine: when saving, the survey is written to a temporary `.tmp` file with a CRC32 checksum, flushed to disk via `fsync`, and only then atomically renamed over the production file. If the device dies at any millisecond, the previous valid survey is untouched.\n\nFor the math, I treated PON networks as directed acyclic graphs (DAGs), recursively calculating insertion loss, splice degradation, and connector margins with sub-meter spatial precision.',
    engineeringSolution:
      '1. Recursive Optical Graph Math: Built depth-first traversal calculating dBm power levels across asymmetric couplers and multi-stage PON splits.\n2. Draggable Route-Bending: Integrated OpenStreetMap and Google Maps SDK with a custom Haversine accumulator to snap cables along street bends.\n3. Atomic Storage Engine: Achieved 0.00% ANR (Application Not Responding) rate and zero corrupted survey files across 5.73K+ installs.\n4. Complete Production Stack: Integrated Play Billing subscriptions, ProGuard minification, and Google Drive cloud backup sync.',
    takeaway:
      'True software craftsmanship is caring just as much about the invisible defensive engineering — crash-proof file writes and zero-signal offline architecture — as the user interface.',
    photos: [
      {
        url: '/images/stories/fiber-field-testing.jpg',
        caption: 'Field testing FiberOpticCalc with a live optical power meter and OTDR launch cable.',
        location: 'Telecom Field Survey',
        timestamp: '10:00 AM',
      },
      {
        url: '/images/stories/fiber-app-screen.jpg',
        caption: 'FiberOpticCalc live UI: Multi-segment route-bending and real-time recursive loss budget graph.',
        location: 'Android Studio IDE',
        timestamp: '01:15 AM',
      },
    ],
    metrics: [
      { label: 'Total Installs', value: '5.73K+' },
      { label: 'Active Devices', value: '2.09K+' },
      { label: 'Google Play Rating', value: '4.6 / 5.0' },
    ],
    tags: ['Kotlin', 'Jetpack Compose', 'MVVM', 'Geospatial Maps', 'Offline-First', 'Play Billing'],
    relatedProjectId: 'fiberopticcalc',
    snippet: {
      title: 'Haversine Route Distance Accumulator',
      language: 'kotlin',
      code: `// Multi-segment geospatial cable distance engine
fun calculateCableRouteMeters(waypoints: List<GeoPoint>): Double {
  return waypoints.zipWithNext { a, b ->
    val dLat = Math.toRadians(b.latitude - a.latitude)
    val dLon = Math.toRadians(b.longitude - a.longitude)
    val sinLat = sin(dLat / 2).pow(2)
    val sinLon = sin(dLon / 2).pow(2)
    val h = sinLat + cos(Math.toRadians(a.latitude)) * cos(Math.toRadians(b.latitude)) * sinLon
    6371000.0 * 2 * atan2(sqrt(h), sqrt(1 - h))
  }.sum()
}`,
    },
  },
  {
    id: 'hackathon-midnight-pivot',
    title: 'The 3 AM Hackathon Architecture Surgery: CottonX',
    subtitle: 'Ditching async promise deadlocks at 3 AM to deploy 4 autonomous AI Web3 agents on Base',
    category: 'AI & Web3',
    date: 'Apr 2026',
    badge: 'DevClash Pune',
    summary:
      'When our multi-agent Web3 platform hit asynchronous state deadlocks during the 48-hour DevClash hackathon, I orchestrated a 3 AM pivot to an event-driven message bus with Google Gemini structured JSON schemas and Coinbase CDP, successfully executing live on-chain contract deployments.',
    sceneSetting:
      '3:15 AM in a crowded hackathon hall in Pune. The room was illuminated by laptop screens, empty coffee cups covered our desk, and the final judging presentation was in exactly 5.5 hours. Our multi-agent chat interface was frozen — recursive async promises were locking the event loop, and tokens were spilling over context windows.',
    context:
      'We set out to build CottonX: an autonomous orchestration ecosystem where 4 specialized AI agents (Market Analyst, Trading Strategist, Smart Contract Developer, Growth Optimizer) collaborate to analyze crypto market liquidity and deploy verified contracts on the Base network.',
    crisisOrChallenge:
      'Our initial monolithic promise-chain architecture broke under multi-agent recursion. When Agent 1 passed a prompt to Agent 2, unhandled promise rejections cascaded into UI freezes. With a live on-chain demonstration required by judges, our core system was dead in the water.',
    tradeoffs: [
      {
        option: 'Patch Broken Promises with Arbitrary Delays (setTimeout)',
        pros: 'Quickest band-aid fix to keep working on the presentation pitch.',
        cons: 'High likelihood of freezing during the live on-stage demo in front of judges.',
        selected: false,
      },
      {
        option: 'Cut 3 Agents & Present a Single-Agent Mock',
        pros: 'Guaranteed working single flow.',
        cons: 'Destroys the core hackathon value proposition of autonomous multi-agent consensus.',
        selected: false,
      },
      {
        option: 'Radical 3 AM Architecture Surgery: Event-Driven Firestore Bus',
        pros: 'Decouples all agents into independent event listeners, guarantees state immutability, and supports deterministic tool execution.',
        cons: 'Required rewriting the entire agent orchestration backend in 3 hours with zero sleep.',
        selected: true,
      },
    ],
    theThoughtProcess:
      'Band-aids always fail on stage. I made the executive call to delete 350 lines of brittle promise chains and rebuild the core as an event-driven reactive stream.\n\nWe converted agent communication into Firestore document events: when an agent posts a structured JSON payload, the orchestrator triggers the target agent\'s Gemini 1.5 tool caller. We hooked each agent to a dedicated Coinbase CDP serverless wallet, giving them isolated signing capabilities for Base testnet transactions.',
    engineeringSolution:
      '1. Event-Driven Message Stream: Replaced tangled async calls with a clean event-driven state machine coordinating all 4 autonomous agents.\n2. Gemini Structured Outputs: Enforced strict JSON schemas for predictable contract compilation and parameter extraction.\n3. Coinbase CDP Wallet Tooling: Enabled agents to autonomously query Uniswap liquidity pools and deploy verified ERC-20 token contracts live on Base.',
    takeaway:
      'Under intense hackathon pressure, the hardest and most valuable skill is having the courage to abandon a sinking architecture and rebuild cleanly rather than patching fatal flaws.',
    photos: [
      {
        url: '/images/stories/hackathon-team.jpg',
        caption: 'Team table at 4:15 AM: Refactoring agent event handlers with live Basescan testnet explorer open.',
        location: 'DevClash Hackathon Arena',
        timestamp: '04:15 AM',
      },
      {
        url: '/images/stories/hackathon-demo.jpg',
        caption: 'Live on-stage demo: CottonX autonomous multi-agent contract deployment verified on Basescan.',
        location: 'DevClash Main Stage',
        timestamp: '10:30 AM',
      },
    ],
    metrics: [
      { label: 'Autonomous Agents', value: '4' },
      { label: 'Surgery Window', value: '3 hrs' },
      { label: 'On-Chain Deploy', value: 'Live on Base' },
    ],
    tags: ['Gemini API', 'Coinbase CDP', 'Multi-Agent', 'Next.js', 'Solidity', 'Basescan'],
    relatedProjectId: 'cottonx',
    snippet: {
      title: 'Recursive Agent Tool Calling Handler',
      language: 'typescript',
      code: `// Agent tool execution router with Coinbase CDP SDK
export async function executeAgentAction(agentId: string, action: ToolAction) {
  switch (action.type) {
    case 'DEPLOY_CONTRACT':
      const wallet = await getAgentWallet(agentId);
      const contract = await wallet.deployContract({
        bytecode: action.bytecode,
        abi: action.abi,
      });
      return { status: 'SUCCESS', address: contract.getAddress() };
    case 'QUERY_MARKET':
      return await fetchUniswapPoolMetrics(action.pair);
  }
}`,
    },
  },
];
