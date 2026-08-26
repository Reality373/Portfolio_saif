import { Story } from '@/types';

export const STORIES: Story[] = [
  {
    id: 'abaja-crisis-migration',
    title: 'The 8-Hour aBAJA Silicon Crisis',
    subtitle: 'Emergency STM32 to ESP32 bare-metal rewrite before national vehicle inspection',
    category: 'Embedded & Crisis',
    date: 'Jan 2025 – Feb 2026',
    badge: 'National 1st Place',
    summary:
      'When our primary STM32 steering & throttle ECU suffered critical hardware failure hours before competition scrutineering, I led an overnight bare-metal rewrite to ESP32 FreeRTOS over CAN, winning 1st Place in Autonomous Emergency Braking.',
    context:
      'Team Abhyuday was preparing our off-road autonomous vehicle for the national autonomous BAJA (aBAJA) engineering competition. The steer-by-wire and throttle-by-wire modules relied on an STM32 Nucleo microcontroller communicating with the NVIDIA Jetson compute node over CAN.',
    crisisOrChallenge:
      'During final electrical pre-inspection at 10:00 PM, the STM32 board suffered a fatal hardware brownout/MCU latch-up. We had less than 8 hours until final scrutineering gates closed. No spare STM32 boards with identical pinouts were available in the paddock.',
    engineeringSolution:
      'I grabbed an ESP32-WROOM module and led an emergency overnight re-architecture sprint:\n\n1. Pinout & Peripheral Remapping: Mapped dual DAC outputs (MCP4725) for throttle voltages, direct I2C registers for AS5600 magnetic encoders, and FlySky IBUS failsafe scaling onto ESP32 GPIOs.\n2. FreeRTOS Dual-Core Threading: Replaced single-threaded control loops with prioritized FreeRTOS tasks (Core 0 for TWAI/CAN bus transmission at 500kbps, Core 1 for 100Hz PID steer-by-wire actuation).\n3. Failsafe Watchdogs: Built a dual-stage hardware/software heartbeat monitor — if CAN packet jitter exceeds 50ms, throttle instantly pulls to zero and mechanical emergency brakes engage.\n\nBy 6:00 AM, the ESP32 ECU was bench-tested, mounted into the enclosure, and calibrated on the vehicle.',
    takeaway:
      'Strict modularity and hardware abstraction layers (HAL) aren\'t just software engineering best practices — they are the only reason an entire racing team survived a sudden silicon swap under impossible deadlines.',
    metrics: [
      { label: 'Rewrite Window', value: '8 hrs' },
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
    title: 'Squeezing Anomaly Detection to 5.92 µs',
    subtitle: 'Slashing Mahalanobis distance calculation by 2.7x to meet 200 µs automotive deadlines',
    category: 'Performance & Security',
    date: 'Aug 2026 – Ongoing',
    badge: '99.9% Block Rate',
    summary:
      'Safety-critical automotive CAN buses have 200 µs frame deadlines. By pruning redundant features and leveraging CMSIS-DSP SIMD intrinsics on an STM32F446RE, I reduced dual-gate IPS inspection to 5.92 µs — using only 3% of the real-time budget.',
    context:
      'Vehicles lack packet authentication at the CAN layer, making them vulnerable to rogue OBD-II or wireless gateway injection. We engineered an inline, hardware-isolated Intrusion Prevention System on STM32F446RE (180 MHz Cortex-M4).',
    crisisOrChallenge:
      'Our Gate 2 Mahalanobis-distance anomaly detector initially consumed 2,284 CPU cycles per frame. Under burst traffic (100% bus utilization at 500 kbps), frames queue every ~200 µs. A 2,284-cycle overhead created dangerous latency spikes on legitimate ECU transmissions (engine, brakes, steering).',
    engineeringSolution:
      'I tackled the optimization through empirical validation and bare-metal tuning:\n\n1. Empirical Feature Pruning: Benchmarked 4 features (inter-arrival time, payload entropy, ID frequency, directional variance) against HCRL attack captures. Proved that timing/entropy added noise without improving precision. Pruning from 4D → 2D reduced covariance matrix operations exponentially.\n2. CMSIS-DSP & SIMD Vectorization: Replaced floating-point loops with single-cycle CMSIS-DSP intrinsics and fixed-point math.\n3. Compiler Tuning: Profiled `-Og` vs `-O2` vs `-O3` with link-time optimization, eliminating register spills.\n\nGate 2 dropped from 2,284 to 832 cycles. Total dual-gate inspection reached 1,065 cycles (5.92 µs) with 99.9% block rate against RPM spoofing.',
    takeaway:
      'Algorithmic feature pruning combined with ARM CMSIS-DSP SIMD acceleration consistently outperforms raw CPU frequency scaling in hard real-time systems.',
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
    title: 'Sniffing Packets in the Dark: 24S BMS',
    subtitle: 'Reverse-engineering an undocumented BLE serial protocol for real-time EV telemetry',
    category: 'Reverse Engineering',
    date: 'May – Jun 2026',
    badge: 'Zero Docs Telemetry',
    summary:
      'When our off-road EV needed real-time 24-cell thermal and voltage telemetry from an undocumented JBD/Xiaoxiang BMS, I sniffed raw BLE packets, fixed MTU drops on Linux, and decoded the proprietary serial protocol.',
    context:
      'For our electric off-road vehicle, monitoring the health of the 24S Lithium battery pack in real time was vital to prevent thermal runaway. We sourced a JBD/Xiaoxiang smart BMS, but the manufacturer provided no public API, SDK, or protocol sheet.',
    crisisOrChallenge:
      'Connecting over BLE on Fedora Linux led to frequent packet fragmentation, dropped frames, and connection resets. The vendor mobile app worked over Bluetooth, but our NVIDIA Jetson and telemetry dashboard were completely locked out.',
    engineeringSolution:
      'I extracted the communication protocol through packet capture and reverse analysis:\n\n1. HCI BLE Snooping: Captured Bluetooth HCI packets during vendor app connection cycles in Wireshark.\n2. Frame Structure Decoding: Identified the frame start byte (`0xDD`), command read register (`0xA5`), response marker (`0xAA`), payload length, 24 individual 16-bit cell voltage registers, and the trailing 16-bit checksum algorithm.\n3. MTU & Connection Tuning: Configured Linux BlueZ MTU negotiation to prevent frame slicing and wrote an automated reconnect supervisor in C++.\n\nThe telemetry daemon continuously streamed individual cell voltages and 4-point pack temperatures into the Jetson Orin NX at sub-10ms latency.',
    takeaway:
      'When vendor documentation is a total black box, logic analyzers, Wireshark HCI logs, and byte-level packet captures never lie.',
    metrics: [
      { label: 'Cells Monitored', value: '24 Cells' },
      { label: 'Vendor Docs', value: '0 pages' },
      { label: 'Telemetry Stream', value: '<10 ms' },
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
    title: '252 Commits Solo: 5,000+ Installs',
    subtitle: 'Architecting a recursive optical engine, map route-bending, and crash-proof offline sync',
    category: 'Solo Shipping',
    date: 'Dec 2025 – Present',
    badge: '5,000+ Installs',
    summary:
      'Built a telecommunications engineering platform from zero to 5,000+ Play Store installs as a solo developer: recursive optical budget calculations, real-time map route-bending, and crash-proof atomic persistence.',
    context:
      'Field technicians and optical network designers regularly navigate complex Passive Optical Networks (PON) using clunky spreadsheets. FiberOpticCalc was designed to give engineers an all-in-one mobile toolkit with math, maps, and fault simulation.',
    crisisOrChallenge:
      'Field workers frequently work underground or in remote areas with zero cell connectivity. A crashed write during a map design or power calculation would corrupt days of field surveys. Furthermore, complex PON splits (1:2 to 1:128 asymmetric couplers) created recursive power calculations that naive algorithms choked on.',
    engineeringSolution:
      'I engineered the app from scratch over 252 commits:\n\n1. Recursive Loss Engine: Built a depth-first traversal engine calculating insertion loss, splice attenuation, connector degradation, and optical margins across full PON trees with custom `.loss` profile imports.\n2. Draggable Route-Bending: Integrated OpenStreetMap and Google Maps with a custom Haversine multi-segment distance engine, letting engineers snap and bend cables along actual street curves.\n3. Atomic Local Persistence: Implemented two-stage write-ahead atomic file transactions with checksums, guaranteeing zero corrupted files if battery dies mid-save.\n4. Full Monetization Stack: Integrated Google Play Billing subscriptions, multi-identifier auth, and serverless Google Cloud Functions.',
    takeaway:
      'Building for real-world professionals requires equal obsession with theoretical precision (optical loss formulas) and defensive offline-first engineering.',
    metrics: [
      { label: 'Commits Shipped', value: '252' },
      { label: 'Google Play Installs', value: '5,000+' },
      { label: 'Active Users', value: '2,000+' },
    ],
    tags: ['Kotlin', 'Jetpack Compose', 'MVVM', 'Geospatial Maps', 'GCP Serverless', 'Play Billing'],
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
    title: 'Midnight Hackathon Pivot: CottonX',
    subtitle: 'Migrating to GCP & Gemini at 3 AM to deliver 4 autonomous on-chain Web3 agents',
    category: 'AI & Web3',
    date: 'Apr 2026',
    badge: 'DevClash Pune',
    summary:
      'When our multi-agent Web3 platform hit asynchronous state deadlocks during the DevClash hackathon, I orchestrated a 3 AM pivot to GCP + Google Gemini + Coinbase CDP, deploying verified contracts live on Base network.',
    context:
      'At DevClash Pune (a 48-hour sprint), our team was building CottonX — an orchestration platform where autonomous AI agents communicate recursively, make market decisions, and execute live on-chain trades with dedicated Coinbase CDP wallets.',
    crisisOrChallenge:
      'At 3:00 AM on the final night, our initial agent orchestration layer suffered recursive async race conditions and context window overflow. With judging in 8 hours and a live on-chain demo required, our core chat system was freezing.',
    engineeringSolution:
      'I made the call to execute a complete midnight architecture refactor:\n\n1. Event-Driven Message Bus: Replaced tangled async promises with a clean Firestore stream and event-driven recursive message router coordinating the 4 specialized agents (Market Analyst, Trader, Smart Contract Engineer, Growth).\n2. Gemini Structured Outputs: Switched prompt pipelines to Google Gemini 1.5 with strict JSON schema outputs for deterministic tool invocation.\n3. Coinbase CDP Wallet Tooling: Built plug-and-play wallet execution tools letting agents check balances, deploy ERC-20/ERC-721 contracts, and interact with Uniswap pools.\n\nDuring our live presentation, the system executed an autonomous prompt-to-contract deployment verified live on Basescan.',
    takeaway:
      'In high-stakes hackathons, the most valuable engineering skill is rapid root-cause diagnosis and the courage to pivot cleanly rather than patching a sinking architecture.',
    metrics: [
      { label: 'Autonomous Agents', value: '4' },
      { label: 'Sprint Window', value: '48 hrs' },
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
