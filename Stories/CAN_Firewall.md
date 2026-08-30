# CAN Firewall — Forensic Engineering War Stories & Retrospectives

---

### 1. The $3.125\times$ Clock Frequency Discrepancy & The Silent UART Baud Divisor Lockup

- **Category:** Embedded & Crisis / Hardware Bring-up
- **Key Metrics / Impact:** Diagnostic telemetry baud rate restored to 115,200 baud | `SysTick` and `HAL_Delay` timing restored from 3.125x slow | 500ms heartbeat restored from 1.575s skew
- **Tech Stack & Hardware Involved:** STM32F446RE (ARM Cortex-M4 @ 180 MHz), 8 MHz HSE Crystal, STM32Cube HAL (`stm32f4xx_hal_conf.h`), USART2 ST-LINK Virtual COM Port

#### 1. The Situation & Setup
During initial bring-up of the inline CAN Firewall (`CAN_Firewall/Firewall_Firmware`), the STM32F446RE was clocked to its maximum operating frequency of 180 MHz utilizing an external high-speed oscillator (HSE). The firmware was designed to stream real-time Gate 1 and Gate 2 telemetry counters over USART2 (115,200 baud) through the ST-LINK Virtual COM port to host testing scripts (`hw_test/collect_metrics.py`).

#### 2. The Anomaly & The Mistake (The Symptom)
For the first several weeks of development, the debug console was completely unreadable:
- Connecting to `/dev/ttyACM0` at 115,200 baud returned garbage framing errors and corrupted character streams.
- Visual LED heartbeat pulses configured to blink every 500 ms via `HAL_Delay(500)` took approximately **1.575 seconds** per cycle.
- Inexplicably, CAN bus bit timings (500 kbps) and hardware timer `TIM5` microsecond timestamps were perfectly accurate, leading engineers to suspect damaged UART transceivers or faulty ST-LINK firmware.

#### 3. Forensic Investigation (The Root Cause)
1. **Clock Tree Split Forensics:** The Nucleo-F446RE and WeAct Studio boards both use an **8 MHz** external crystal. However, in `stm32f4xx_hal_conf.h`, `HSE_VALUE` was left at the default ST value of **25,000,000 Hz (25 MHz)**:

$$\text{Discrepancy Ratio} = \frac{25\text{ MHz}}{8\text{ MHz}} = 3.125$$

2. **Literal vs Derived Clock Registers:**
   - The PLL configuration multipliers (`PLLM = 8`, `PLLN = 360`, `PLLP = 2`) were passed directly as raw literal register masks into hardware RCC registers. Consequently, the actual core PLL genuinely ran at $180\text{ MHz}$ ($\frac{8\text{ MHz}}{8} \times \frac{360}{2} = 180\text{ MHz}$), keeping the prescaled CAN peripheral prescalers and TIM5 1 MHz tick counter 100% accurate.
   - However, the software HAL function `SystemCoreClockUpdate()` used the erroneous `#define HSE_VALUE 25000000UL` to mathematically compute `SystemCoreClock`, calculating a phantom frequency of **562.5 MHz** ($180 \times 3.125$).
   - As a result, `HAL_InitTick()` configured the SysTick timer with a reload value $3.125\times$ too large (causing `HAL_Delay(500)` to take $500 \times 3.125 = 1562.5\text{ ms}$), and the USART2 baud rate generator computed an erroneous `BRR` divider for an assumed 135 MHz APB1 clock, transmitting 115,200 baud onto physical copper at **~36,864 baud**!

#### 4. The Engineering Breakthrough (The Fix)
Corrected `HSE_VALUE` in `stm32f4xx_hal_conf.h` from `25000000U` to `8000000U` (`Docs/hardware_validation_findings.md`):
```c
#if !defined  (HSE_VALUE) 
  #define HSE_VALUE    8000000U /*!< Value of the External oscillator in Hz */
#endif
```
Instantly, `SystemCoreClock` evaluated to 180 MHz, SysTick normalized to 1,000 Hz, the 500 ms heartbeat pulsed with millisecond precision, and USART2 serial telemetry streamed at a crisp 115,200 baud without a single framing glitch.

#### 5. The Core Engineering Lesson
In embedded microcontrollers, hardware peripherals configured via raw PLL registers can function perfectly even when HAL software clock derivations are totally broken. When SysTick delays or UART baud rates drift while hardware timers run true, verify that the header `#define HSE_VALUE` matches the physical crystal soldered onto the PCB.

---

### 2. The Bidirectional State Collision & Complete Reverse-Channel Starvation

- **Category:** Architecture & Paradigm Shifts / Embedded & Crisis
- **Key Metrics / Impact:** Reverse-channel CAN forwarding delivery restored from 1.1% to 100.0% | Zero packet drops across bidirectional safety-critical links
- **Tech Stack & Hardware Involved:** STM32F446RE, Dual CAN Controllers (bxCAN: CAN1 and CAN2), C11 Firmware, SocketCAN Bench Harness

#### 1. The Situation & Setup
The CAN firewall operates as a physical gateway interposed between the Untrusted Bus (Telematics/Infotainment on `CAN1`) and the Protected Bus (Powertrain/Brakes on `CAN2`). Several diagnostic and control CAN identifiers (e.g. `0x130`, `0x153`, `0x260`) are inherently bidirectional, allowing legitimate traffic to flow from untrusted $\to$ protected and protected $\to$ untrusted (`Docs/hardware_validation_findings.md`).

#### 2. The Anomaly & The Mistake (The Symptom)
When running full-duplex traffic benchmarks across the dual CAN interfaces (`hw_test/collect_metrics.py`):
- Untrusted-to-protected traffic forwarded with a near-perfect **94.0% to 100%** delivery rate.
- Protected-to-untrusted traffic suffered catastrophic, near-total packet starvation, dropping **98.9%** of legitimate frames:

```text
BEFORE FIX:
  Untrusted -> Protected : 14,855 / 15,810 delivered (94.0%)
  Protected -> Untrusted :    162 / 15,030 delivered ( 1.1% - CRITICAL FAILURE!)
```

#### 3. Forensic Investigation (The Root Cause)
1. **Single Timestamp State Shared Across Buses:** In `gate1_statistical.c`, the state array `id_states[]` was indexed strictly by policy entry index:
   ```c
   // FLAWED IMPLEMENTATION:
   typedef struct {
       uint32_t last_timestamp_us;
   } id_state_t;
   static id_state_t id_states[GATE1_POLICY_COUNT];
   ```
2. **Race Condition Collision:** When an ECU on the untrusted bus transmitted a frame for ID `0x130`, `gate1_statistical.c` validated the inter-arrival time and recorded `id_states[idx].last_timestamp_us = T_0`. A few hundred microseconds later, an ECU on the protected bus legitimately transmitted a response frame for the same ID `0x130` at `T_0 + 300\text{ µs}`.
3. Because the policy enforced a minimum nominal gap of $10,000\text{ µs}$, the protected frame was compared against the untrusted frame's timestamp, evaluating to an apparent inter-arrival of $300\text{ µs} < 10,000\text{ µs}$. The firewall classified the reverse frame as a high-frequency DoS flood and dropped it instantly.

#### 4. The Engineering Breakthrough (The Fix)
The state structure was refactored to decouple timestamps per physical CAN interface (`(policy_entry, source_bus)`):

```c
// FIXED IMPLEMENTATION in: Firewall_Firmware/Core/Src/gate1_statistical.c
typedef struct {
    uint32_t last_timestamp_us[2]; // Index 0: CAN1 (Untrusted), Index 1: CAN2 (Protected)
} id_state_t;

uint8_t gate1_check_interarrival(uint8_t policy_idx, uint8_t bus_id, uint32_t now_us, uint32_t min_interval_us) {
    uint32_t dt = now_us - id_states[policy_idx].last_timestamp_us[bus_id];
    if (dt < min_interval_us) {
        return 0; // Drop burst on this specific bus
    }
    id_states[policy_idx].last_timestamp_us[bus_id] = now_us;
    return 1; // Accept and update bus-specific baseline
}
```
Following this fix, reverse-channel delivery leaped from **1.1% to 100.0%** (9,900 / 9,900 frames delivered) with zero dropouts.

#### 5. The Core Engineering Lesson
In bidirectional multi-port gateway architectures, statistical and rate-limiting state must never be global to an identifier. State must be strictly keyed per `(Identifier, Ingress_Port)` tuple to prevent cross-channel temporal collisions.

---

### 3. The Grand ML Pivot: Why Isolation Forest Was Fired for a 2-Feature Mahalanobis Distance

- **Category:** Architecture & Paradigm Shifts / Deep Performance & Microsecond Optimization
- **Key Metrics / Impact:** Gate 2 execution cost slashed from 2,284 cycles to 832 cycles (4.62 µs) | Model evaluation form alone takes only 56 cycles (0.31 µs) on Cortex-M4 FPU | AUC on RPM/Gear spoofing boosted from 0.30 to 0.988 | Pruned 4 features down to 2 orthogonal features
- **Tech Stack & Hardware Involved:** ARM Cortex-M4 single-precision FPU, CMSIS-DSP, Scikit-Learn (iForest vs Gaussian), Python Jupyter Pipeline (`gate2_ml_pipeline.ipynb`), C Header Generator (`export_c_header.py`)

#### 1. The Situation & Setup
Gate 2 is the machine-learning anomaly detection layer designed to catch semantic spoofing attacks that mimic legitimate timing intervals (`Docs/architecture.md`). The initial specification (commits `2fc64be` through `e29ca1a`) designed a 4-feature pipeline (Inter-arrival Timing, Shannon Byte Entropy, Payload L2 Delta, and Windowed Burst Density) running an embedded **Isolation Forest (iForest)**.

#### 2. The Anomaly & The Mistake (The Symptom)
1. **Severe Microcontroller Resource Drain:** The Isolation Forest required traversing dozens of decision trees in memory. At 180 MHz, inference took **2,284 CPU cycles**, consuming over $6.3\%$ of the entire $200\text{ µs}$ frame forwarding deadline.
2. **Entropy Overhead & Uselessness:** Calculating Shannon entropy on 8-byte payloads required floating-point logarithm computations that burned **481 cycles per frame**. Yet, feature ablation proved entropy moved Area Under the Curve (AUC) by less than $0.002$ and actually *degraded* detection on gear spoofing.
3. **Timing Feature Pathologies:** Timing variance in Gate 2 had a heavy benign tail caused by minor ECU clock jitter, which artificially inflated anomaly scores on ordinary traffic and dragged false-positive rates to an unacceptable 7–15%.

#### 3. Forensic Investigation (The Root Cause)
Comprehensive offline ablation across 988,844 benign frames and HCRL intrusion datasets revealed the empirical truth (`gate-2/results/feature_ablation.json` and `findings.md`):

| Feature Set | Fuzzing AUC | Gear Spoof AUC | RPM Spoof AUC | Cycles Cost |
|---|---|---|---|---|
| Timing + Entropy + Payload + Burst | 0.9416 | 0.9554 | 0.9615 | 2,284 cycles |
| Entropy + Payload + Burst | 0.9871 | 0.9843 | 0.9884 | 1,313 cycles |
| **Payload + Burst (Shipped)** | **0.9871** | **0.9858** | **0.9888** | **832 cycles** |
| Entropy + Payload (No Burst) | 0.9956 | **0.3050** | **0.2104** | 780 cycles |

- Without **Burst Density**, gear and RPM spoofing AUC collapsed to **0.21–0.30** (worse than a coin flip) because spoofed torque/RPM payloads look syntactically normal and are visible only as cumulative traffic density.
- Without **Payload Delta**, fuzzing detection dropped from 0.987 to 0.821.
- Both **Timing** and **Entropy** were mathematically useless and computationally wasteful.

#### 4. The Engineering Breakthrough (The Fix)
The team scrapped the Isolation Forest and replaced it with a **2-Feature Universal Mahalanobis Distance Classifier** (`gate-2/models/gate2_model.h`):
1. **2 Orthogonal Features:**
   - Feature $x_0$: Normalized L2 Byte Delta from the last forwarded frame.
   - Feature $x_1$: Normalized Burst Density in a trailing sliding window.
2. **56-Cycle Hardware FPU Execution:** With only 2 dimensions, the matrix multiplication simplifies to 4 multiply-accumulate operations:

$$D_M^2 = x_0(C_{00}x_0 + C_{01}x_1) + x_1(C_{10}x_0 + C_{11}x_1)$$

Executed directly on the STM32 Cortex-M4 hardware FPU, the Mahalanobis evaluation completes in **56 cycles (0.31 µs)**!
3. **Compiler Optimization (`-O2`):** Building firmware with `-O2` instead of `-Og` saved 1.75x overhead, reducing the full Gate 2 evaluation (including feature extraction and history updating) to **832 cycles (4.62 µs)**.

#### 5. The Core Engineering Lesson
Never force complex ensemble tree models onto microcontrollers when a closed-form statistical metric (like Mahalanobis distance) provides superior mathematical separation. Measure feature contributions ruthlessly: if a feature consumes 30% of your cycle budget but moves AUC by $<0.002$, eliminate it immediately.

#### 6. Representative Code / Circuit Logic

```c
// Excerpt from: CAN_Firewall/Firewall_Firmware/Core/Src/gate2_anomaly.c

// 56-Cycle Closed-Form Mahalanobis Distance on Cortex-M4 FPU
float gate2_compute_mahalanobis_2d(float x0, float x1, const float inv_cov[2][2]) {
    // x0: Normalized Payload L2 Delta
    // x1: Normalized Burst Density
    float term0 = inv_cov[0][0] * x0 + inv_cov[0][1] * x1;
    float term1 = inv_cov[1][0] * x0 + inv_cov[1][1] * x1;
    return (x0 * term0) + (x1 * term1);
}
```

---

### 4. The Split State-Update Rule & The Adversarial Baseline Poisoning Flaw

- **Category:** Defensive Engineering & Security / Zero-Docs Penetration Testing
- **Key Metrics / Impact:** RPM attack detection boosted from 82.9% to 100.0% | Eliminated cascading false-positive rejections on fuzzing traffic (preserved 99.5% legitimate delivery)
- **Tech Stack & Hardware Involved:** STM32F446RE, Gate 2 Anomaly Engine, Replay Test Suite

#### 1. The Situation & Setup
Gate 2 tracks two dynamic state variables for every profiled CAN ID:
1. `last_forwarded_payload[8]`: The 8-byte reference payload used to compute the L2 distance delta for the next arriving frame.
2. `burst_history`: A sliding timestamp ring buffer used to calculate instantaneous message burst density.

#### 2. The Anomaly & The Mistake (The Symptom)
During early testing with simulated spoofing attacks:
- When an attacker transmitted a sequence of spoofed RPM frames (`0x316`) carrying a fake value (e.g. `0xFF 0xFF`), the firewall caught and rejected the *first* attack frame.
- However, **all subsequent spoofed attack frames were passed through to the protected bus** as legitimate traffic! Overall attack blocking dropped to 82.9%.

#### 3. Forensic Investigation (The Root Cause)
1. **Adversarial Baseline Poisoning:** In `gate2_anomaly.c`, the firmware updated its payload reference unconditionally on *every* scored frame:
   ```c
   // VULNERABLE CODE:
   if (d2 > tau) {
       drop_frame();
   }
   memcpy(stats->last_payload, current_payload, 8); // BUG: Poisoned baseline with rejected frame!
   ```
   When the attacker sent frame #1 with fake payload $P_{bad}$, it was rejected because $|P_{bad} - P_{legit}| > \text{threshold}$. But the firmware updated `last_payload = P_bad`. When attack frame #2 arrived with the same $P_{bad}$, the delta was $|P_{bad} - P_{bad}| = 0.0$, which looked completely normal, allowing the attacker to bypass Gate 2 for the rest of the stream!
2. **The Burst Starvation Trap:** An initial naive fix withheld *both* payload reference and burst history updates on rejected frames. But this introduced an equally severe failure: because the burst history was starved of entries, subsequent legitimate frames appeared to have an abnormally low burst count, causing the firewall to reject legitimate traffic in a cascading false-positive storm (dropping 14% of legitimate traffic).

#### 4. The Engineering Breakthrough (The Fix)
The team established the **Split State-Update Rule** (`gate2_state_policy.py` and `findings.md`):
- **On Rejected Frames:** **Withhold** the payload reference (preserving the true legitimate baseline) while **advancing** the burst history (accurately tracking physical wire density).
- **On Accepted Frames:** **Advance** both the payload reference and burst history.

```text
Incoming Frame ---> Gate 2 Anomaly Classifier
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
[FRAME ACCEPTED]            [FRAME REJECTED]
  • Advance Payload Ref       • WITHHOLD Payload Ref (Prevents Poisoning)
  • Advance Burst History     • ADVANCE Burst History (Prevents Starvation)
```

With this asymmetric rule, RPM spoofing blocking jumped from 82.9% to **100.0%**, and Gear spoofing reached **99.0%**, while legitimate delivery held rock-solid at **97.4%**.

#### 5. The Core Engineering Lesson
In stateful anomaly detection systems, updating baseline references from rejected adversarial inputs allows attackers to poison your reference frame in a single step. Always decouple semantic feature baselines (which must only advance on verified data) from physical density counters (which must reflect raw channel reality).

---

### 5. The Masquerade Bimodal Dilemma & The Rate-Tier Stand-Down Engine

- **Category:** Architecture & Paradigm Shifts / Defensive Engineering
- **Key Metrics / Impact:** 0.0 pp spread across repeated masquerade runs | 99.9% legitimate traffic delivered with 0% false drops | 100% detection and diagnostic alarm firing on target identifiers (`0x130`, `0x316`, `0x43F`)
- **Tech Stack & Hardware Involved:** STM32F446RE, Rate Estimation Filter, CAN 2.0B Specification

#### 1. The Situation & Setup
A **Masquerade Attack** occurs when an attacker compromises an ECU and transmits a spoofed frame using a legitimate identifier at the *exact same nominal period* as the genuine ECU, but offset by half a phase ($\Delta t = 5\text{ ms}$ on a $10\text{ ms}$ periodic message).

#### 2. The Anomaly & The Mistake (The Symptom)
When testing Gate 1's inter-arrival bound against masquerade attacks over 4 identical runs (`Docs/hardware_validation_findings.md`):
- Delivery of legitimate traffic swung wildly between **28.4% and 100.0%** (a 71.6 percentage-point spread!).
- Blocked attack traffic swung identically between **28.5% and 100.0%**.
- The firewall acted as a pure random coin-flip: whichever transmitter happened to win bus arbitration on frame #1 captured the timing slot, causing the firewall to systematically drop 100% of the *other* transmitter's frames. Half the time, the firewall dropped legitimate safety commands while forwarding the attacker's spoofed packets!

```text
[Legitimate ECU (10ms)] ──┐
                          ├─► [CAN Bus] ──► [Firewall Timing Slot (10ms)]
[Attacker ECU   (10ms)] ──┘                     │
                                                ▼
              Slot Captured by Arrival Jitter -> 50% Coin Flip!
              (Either 100% Attack Blocked OR 100% Legitimate Dropped)
```

#### 3. Forensic Investigation (The Root Cause)
1. **CAN Protocol Identity Blindness:** Standard CAN frames carry zero transmitter address or cryptographic signature. When two nodes transmit the same CAN ID at nominal cadence, neither timing nor payload can determine which frame originated from the true ECU without hardware-level physical layer fingerprinting.
2. **Self-Inflicted Denial of Service:** Dropping half of a split stream is fatal: one spoofed frame is enough to mislead the engine controller, while dropping 50% of genuine throttle commands causes the vehicle to enter limp mode.

#### 4. The Engineering Breakthrough (The Fix)
The firewall was re-engineered around the principle of **"Detect and Alarm Rather Than Blindly Drop Where Attribution is Impossible"** (`findings.md`):
1. **Smoothed Inter-Arrival Rate Tiers:** Gate 1 tracks a continuous Exponential Moving Average of message arrival frequency.
2. **Two Distinct Rate Tiers:**
   - **Tier 1: Masquerade / Second Transmitter ($\approx 2.0\times$ nominal rate):** The firewall recognizes a duplicate transmitter collision. Both gates **stand down** from dropping (guaranteeing 99.9% legitimate command delivery with 0.0 pp spread) and immediately fire an authenticated diagnostic **Rate Alarm** naming the compromised ID (`0x130`).
   - **Tier 2: Flood / High-Rate DoS ($\ge 3.0\times$ nominal rate):** On floods (e.g. Gear/RPM floods at $4.4\times$ nominal), the stand-down does *not* engage, and Gate 1 + Gate 2 enforce full rejection (maintaining **99.0%–99.9%** attack blocking).

#### 5. The Core Engineering Lesson
When attribution is mathematically impossible, deterministic filtering degrades into a denial-of-service against the system you are defending. In safety-critical embedded gateways, know when your filters must stand down to preserve operational safety while raising high-priority diagnostic alerts.

---

### 6. The bxCAN Transmit Mailbox Wedging & Auto-Retransmission Trap

- **Category:** Hardware Crisis & Embedded / Fault Recovery
- **Key Metrics / Impact:** Identified permanent bridge deadlock vulnerability under disconnected bus states | Diagnostic logging of Transmit Error Counters (TEC) and mailbox exhaustion
- **Tech Stack & Hardware Involved:** STM32 bxCAN peripheral, `AutoRetransmission = ENABLE`, `TSR` Transmit Status Register

#### 1. The Situation & Setup
The STM32 bxCAN controller features three hardware Transmit Mailboxes (`TxMailbox0`, `TxMailbox1`, `TxMailbox2`). When forwarding a validated frame from CAN1 to CAN2, the firmware calls `HAL_CAN_AddTxMessage()`, which requests an available mailbox and queues the frame for transmission on the physical wire.

#### 2. The Anomaly & The Mistake (The Symptom)
During bench testing, if a physical DB9 connector on the protected bus was momentarily disconnected:
- The entire firewall permanently froze: `tx-mailboxes-free` dropped from 3 to 0 and remained pinned at 0 indefinitely.
- Even after reconnecting the cable, the firewall never recovered and refused to forward any further CAN messages until the microcontroller was physically power-cycled.

#### 3. Forensic Investigation (The Root Cause)
1. **Unacknowledged Frame Infinite Retry Loop:** In the STM32 bxCAN peripheral, `CAN_InitStruct.AutoRetransmission = ENABLE` is the default setting. On physical CAN networks, every transmitted frame requires an ACK bit from at least one receiving node. If the bus is open-circuit or disconnected, no ACK is received.
2. **Mailbox Starvation:** bxCAN continuously retransmits unacknowledged frames forever, never freeing the allocated mailbox. Once 3 unacknowledged frames fill all 3 hardware mailboxes, all subsequent `HAL_CAN_AddTxMessage()` calls return `HAL_CAN_STATE_ERROR`, and the Transmit Error Counter (`TEC`) pins at the error-passive threshold ($128$).

#### 4. The Engineering Breakthrough (The Fix)
The transmit queue handler was redesigned with mailbox timeout recovery (`Docs/hardware_validation_findings.md`):
1. **Mailbox Abort Watchdog:** If all 3 mailboxes remain full for $>2\text{ ms}$, the firmware calls `HAL_CAN_AbortTxRequest()` on the oldest mailbox, freeing hardware capacity for incoming real-time traffic.
2. **Error-Passive Bus Recovery:** When `TEC >= 128`, the driver logs a bus-fault alarm and gracefully resets transceiver error states without blocking the core forwarding thread.

#### 5. The Core Engineering Lesson
In inline store-and-forward gateways, hardware retransmission buffers can become a severe denial-of-service vector if downstream links fail. Always implement software abort watchdogs on hardware transmit mailboxes to prevent unacknowledged frames from deadlocking your entire bridging pipeline.
