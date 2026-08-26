import { Story } from '@/types';

export const STORIES: Story[] = [
  {
    id: 'abaja-crisis-migration',
    title: 'The Midnight Silicon Swap & A Lesson in Redundancy',
    subtitle: 'What happens when a 12V transient kills your primary ECU 8 hours before national scrutineering',
    category: 'Embedded & Crisis',
    date: 'Jan 2025 – Feb 2026',
    readTime: '3 min read',
    badge: 'National 1st Place',
    storyType: 'paddock-log',
    summary:
      'I made a rookie mistake trusting our power rails under high motor vibration. When the STM32 fried at 10 PM in the racetrack paddock, our modular software architecture was the only thing that allowed an emergency overnight port to an ESP32.',
    theMistake:
      'I trusted our off-the-shelf buck converter without adding transient voltage suppression (TVS) diodes on the 12V rail. Under sudden motor back-EMF, a voltage spike fried the 3.3V LDO on our primary STM32.',
    theLesson:
      'Hardware is brutal: never trust a power rail without hardware protection. But good software architecture is forgiving: because our control algorithms were decoupled from hardware registers via clean abstraction, we could rewrite the entire low-level driver layer in 7 hours without touching our PID math.',
    sections: [
      {
        heading: '10:15 PM in the Paddock',
        content:
          'It was 11°C in the paddock pits, grease on our hands, and national technical inspection was scheduled for 6:00 AM sharp. We were running a final high-vibration throttle test when the car suddenly went dead. Multimeter showed 0.2V on the 3.3V rail. The main STM32 Nucleo microcontroller had latched up and died. There were no spare Nucleo boards in our toolbox with the same pinout.',
        type: 'text',
      },
      {
        heading: 'The Panic & The Pivot',
        content:
          'For ten minutes, the entire team went silent. A year of building the vehicle was on the line. We looked through the spares bin and found an unused $4 ESP32-WROOM module. It had completely different pinouts, different peripheral registers, and a dual-core FreeRTOS architecture instead of bare-metal HAL. But it had a TWAI CAN controller.',
        callout:
          'We had two choices: surrender the dynamic autonomous brake tests and forfeit the championship, or pull an all-nighter rewiring and rewriting the entire ECU from scratch.',
        type: 'mistake',
      },
      {
        heading: 'Wiring and Flashing by Flashlight',
        content:
          'We grabbed breadboard wires, soldered an emergency daughterboard, and remapped our AS5600 12-bit magnetic angle encoders and dual MCP4725 throttle DACs. The breakthrough came when I realized the ESP32’s dual cores actually solved a lingering timing issue: we pinned CAN bus transmission to Core 0 and our 100Hz PID steer-by-wire loop to Core 1, completely eliminating interrupt contention.',
        type: 'breakthrough',
      },
      {
        heading: '5:30 AM: Track Verification',
        content:
          'As the sun came up, we rolled the car onto the gravel. We armed the linear actuator attached parallel to the tandem master cylinder, triggered an autonomous emergency run at 30 km/h, and watched the car build 40 bar hydraulic pressure to stop cleanly at 6.2 meters. We passed inspection with 30 minutes to spare and took 1st Place Nationally.',
        type: 'lesson',
      },
    ],
    photo: {
      caption: '3:30 AM paddock bench: Solder smoke, multimeters, and breadboarding the ESP32 TWAI transceiver.',
      location: 'aBAJA Racing Paddock',
      timestamp: '03:30 AM',
    },
    metrics: [
      { label: 'Rewrite Window', value: '7.5 hrs' },
      { label: 'AEB Halt Distance', value: '6.2m' },
      { label: 'Hydraulic Pressure', value: '40 bar' },
    ],
    tags: ['ESP32', 'FreeRTOS', 'CAN Bus', 'Paddock Debugging', 'Failsafe Design'],
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
          'I turned on Android Bluetooth HCI snoop logging, recorded app sessions, and pulled `btsnoop_hci.log` into Wireshark. At first, it looked like random garbage. On Linux, BlueZ was slicing packets and dropping connections every few seconds.',
        type: 'mistake',
      },
      {
        heading: 'Finding the 0xDD Pattern',
        content:
          'I started comparing the voltages on the phone screen with raw hex values in Wireshark. Suddenly, the structure revealed itself: frames always began with `0xDD` and ended with `0x77`. Command `0x04` returned 48 bytes — exactly 24 two-byte big-endian cell millivolts. The trailing two bytes were a 16-bit two’s complement checksum.',
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
    id: 'solo-shipping-fiberopticcalc',
    title: 'The Loneliness of 252 Commits',
    subtitle: 'How a user email about a lost survey in an underground vault forced me to master atomic file persistence',
    category: 'Solo Shipping',
    date: 'Dec 2025 – Present',
    readTime: '3 min read',
    badge: '5.73K+ Installs · 4.6★',
    storyType: 'reflection',
    summary:
      'Building an app solo means there is no QA team or senior engineer to catch your bugs. When a field technician emailed me about losing work underground, it reshaped my entire philosophy around offline-first defensive architecture.',
    theMistake:
      'In early versions, I saved survey files using standard direct file overwrite. If the phone battery died mid-write or the OS killed the process in background, the survey file was corrupted.',
    theLesson:
      'Software craftsmanship isn’t just shiny UI or complex recursive graph math. It’s obsessing over the invisible edge cases so the tool never lets down a technician standing in the rain with 4% battery.',
    sections: [
      {
        heading: 'The Email That Stung',
        content:
          'About a month after publishing FiberOpticCalc, I received an email from a fiber technician: "I was in an underground utility vault with no cell reception. The app closed when my battery dropped to 2%, and my 2-hour fiber survey file was corrupted." That felt like a punch in the gut.',
        type: 'mistake',
      },
      {
        heading: 'The Discipline of Solo Development',
        content:
          'When you build a production application alone over 252 commits, nobody forces you to write tests or handle obscure edge cases. It is easy to cut corners. But field engineers in remote areas don’t have cloud backups to rescue them. I stopped feature work for two weeks and rewrote the storage layer.',
        type: 'text',
      },
      {
        heading: 'Building the Atomic Write-Ahead Engine',
        content:
          'I implemented two-stage atomic persistence: surveys are serialized to a temporary `.tmp` buffer with a CRC32 checksum, flushed to physical flash memory via `fsync()`, and only then atomically renamed over the main file. If the device loses power at any millisecond, the last valid survey remains 100% intact.',
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
          'With judging 5 hours away at DevClash Pune, our 4 autonomous agents (Market Analyst, Trader, Contract Engineer, Growth) were frozen. When Agent 1 passed a prompt to Agent 2, recursive async promises locked the Node event loop. My teammates wanted to add `setTimeout` delays to force execution ordering.',
        type: 'mistake',
      },
      {
        heading: 'The Courage to Delete Bad Code',
        content:
          'I knew band-aids would fail during a live presentation in front of judges. I made the executive call: we hit `git stash`, deleted 350 lines of tangled promise chains, and redesigned the core as an event-driven Firestore message queue.',
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
