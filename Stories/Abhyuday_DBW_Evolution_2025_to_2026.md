# Abhyuday DBW — The 2025 to 2026 Architectural Evolution & Engineering Retrospectives

---

### Executive Summary: The Two-Season Paradigm Shift

The transition from the 2025 season (`Abhyuday_DBW`) to the 2026 season (`Abhyuday_DBW_2026` / `DBW_2026_LOG`) represents a comprehensive transformation from early-stage prototype bring-up under competition pressure into an automotive-grade, distributed embedded drive-by-wire platform.

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 THE ARCHITECTURAL EVOLUTION                                 │
├──────────────────────────────┬──────────────────────────────────────────────────────────────┤
│ 2025 Season (Prototype)      │ 2026 Season (Engineered Platform)                           │
├──────────────────────────────┼──────────────────────────────────────────────────────────────┤
│ Single-Threaded Polling Loop │ Dual-Core FreeRTOS Task Pinning (Core 0: Sensors, Core 1: CAN)│
│ Shared Dirty/LV Ground Loops │ Full Galvanic Isolation (B1205S DC-DC + ISO7721 CAN Barrier)  │
│ 8-Bit Noisy Internal DAC     │ 12-Bit MCP4725 I2C DAC with 1.3V Dead-Zone Step Mapping      │
│ Single-Threshold Deadband    │ Dual-Threshold Hysteresis (10° Engage / 5° Disengage)       │
│ 50 RPM Discrete Steps        │ Hardware Glitch Filter (1023) + Exponential Moving Average   │
│ Fragile Text WiFi Sockets    │ Hardened 500 kbps CAN Network with Formal DBC & DBC Parsers  │
│ Ad-hoc Python Terminal Print │ Automated Dual-Sequence CAN Test Harness + 800x480 LVGL GUI  │
└──────────────────────────────┴──────────────────────────────────────────────────────────────┘
```

---

### Story 1: Conquering Real-Time Jitter — The Shift from Single-Threaded Polling to Multi-Core FreeRTOS Task Pinning

- **Category:** Architecture & Paradigm Shifts
- **Key Metrics / Impact:** CAN message latency jitter reduced from $>80\text{ ms}$ to $<2\text{ ms}$ | Sensor sample rate locked at deterministic 100 Hz | Zero CPU blocking from I2C bus stalls or slow ADC conversions
- **Tech Stack & Hardware Involved:** ESP32 Dual-Core Xtensa LX6 / ESP32-C3 RISC-V, FreeRTOS, FreeRTOS Mutexes & Critical Sections (`portMUX_TYPE`), Hardware Task Watchdog (TWDT)

#### 1. The Situation & Setup
In the 2025 firmware (`Abhyuday_DBW/BBW/BBWnCANwPID.cpp` and `TBW/ESP32/speednthrottleCAN.cpp`), all subsystem functions—ADC sampling, CAN frame reception, PID calculations, DAC writes, and serial debugging—were executed sequentially within a single `loop()` function.

#### 2. The Anomaly & The Mistake (The Symptom)
Whenever the microcontroller had to sample an analog sensor (e.g., averaging 10 ADC readings with `delay(2)` per sample for 20 ms total) or transmit diagnostic text over USB UART, the main loop stalled. Consequently:
- High-frequency incoming CAN messages were dropped due to hardware FIFO overflow.
- Steer-by-wire encoder readings fell out of synchronization during fast wheel rotations, causing erroneous multi-turn position estimates.
- Closed-loop control loops suffered from severe timing jitter ($\Delta t$ varied between 20 ms and 180 ms), causing unpredictable derivative spikes in PID controllers.

#### 3. Forensic Investigation (The Root Cause)
1. **Execution Serialization:** In a single-threaded loop, execution time is the arithmetic sum of the worst-case execution times (WCET) of every peripheral call.
2. **Blocking I/O:** Serial prints, ADC conversions, and I2C transactions block the CPU pipeline. If an I2C sensor (e.g., AS5600) experienced bus noise, the standard `Wire` library stalled the entire loop until timeout.

#### 4. The Engineering Breakthrough (The Fix)
In 2026 (`Abhyuday_DBW_2026/DBW_final_2026/OTA/SBW.cpp` and `ESP32_Wroom/TBW_CAN.cpp`), the architecture was completely refactored into dedicated, prioritized FreeRTOS tasks pinned across the ESP32's dual cores:
1. **Core 0 Dedicated Sensor Engine (`encoderTaskCode` / `SpeedCalculationTask`):** Priority 3 task running at 100 Hz. It communicates with the AS5600 encoder over I2C with strict bus timeouts (`Wire.setTimeOut(20)`), unwrapping multi-turn angular position and updating volatile state.
2. **Core 1 Deterministic CAN Engine (`canRxTask` & `canTxTask`):** Priority 2 RX task continuously draining the TWAI queue with `twai_receive()`, and Priority 1 TX task transmitting telemetry and node heartbeats at precisely timed 20 ms intervals via `vTaskDelayUntil()`.
3. **Core 1 Supervisory & Actuation Loop:** Consumes thread-safe sensor state protected by FreeRTOS mutexes (`speedDataMutex`) and executes closed-loop motor driving.
4. **Hardware Task Watchdog Timer (TWDT):** All tasks are registered to `esp_task_wdt_add(NULL)`. If any task hangs for $>2000\text{ ms}$, the hardware WDT triggers a system reset to prevent runaway conditions.

#### 5. Representative Code / Architecture

```cpp
// Excerpt from: Abhyuday_DBW_2026/DBW_final_2026/OTA/SBW.cpp

// Core 0: Asynchronous Sensor Acquisition Task
void encoderTaskCode(void *pvParameters) {
  esp_task_wdt_add(NULL);
  for(;;) {
    esp_task_wdt_reset(); // Pet task watchdog
    
    int currentRaw = encoder.readAngle();
    int delta = currentRaw - lastRawAngle;
    if (delta > 2048) delta -= 4096;
    else if (delta < -2048) delta += 4096;
    
    continuousPosition += delta;
    continuousDegrees = continuousPosition * (360.0 / 4096.0);
    lastRawAngle = currentRaw;

    vTaskDelay(pdMS_TO_TICKS(10)); // 100 Hz strict period
  }
}

// Core 1: Jitter-Free Deterministic CAN Broadcast Task
void canTxTask(void *pvParameters) {
  esp_task_wdt_add(NULL);
  TickType_t xLastWakeTime = xTaskGetTickCount();
  for(;;) {
    esp_task_wdt_reset();
    
    twai_message_t tx_msg = {.identifier = 260, .data_length_code = 2};
    int16_t encoded_angle = (int16_t)(continuousDegrees * 100.0f);
    tx_msg.data[0] = encoded_angle & 0xFF;
    tx_msg.data[1] = (encoded_angle >> 8) & 0xFF;
    twai_transmit(&tx_msg, pdMS_TO_TICKS(5));

    vTaskDelayUntil(&xLastWakeTime, pdMS_TO_TICKS(20)); // Exact 50 Hz timing
  }
}
```

---

### Story 2: The Electrical Isolation Revolution — Eliminating Traction Ground Loops with Galvanic Barriers

- **Category:** Hardware Crisis & Embedded (Paddock Log / War Story)
- **Key Metrics / Impact:** 1500V DC Galvanic Isolation between 72V/5kW Traction Inverter and 12V LV Bus | Complete elimination of ground bounce resets | Zero blown USB host controllers
- **Tech Stack & Hardware Involved:** B1205S-3W Isolated DC-DC Converter, ISO7721 High-Speed Digital Isolator (100 Mbps), SN65HVD230 CAN Transceiver, 2N2222A NPN BJT

#### 1. The Situation & Setup
In 2025, the vehicle's low-voltage electronic control units shared a common chassis ground with the 12V/24V high-power actuator battery systems and the 5kW traction motor controller ground.

#### 2. The Anomaly & The Mistake (The Symptom)
Under hard acceleration or emergency braking:
- Massive current surges ($>100\text{A}$ through the motor phase wires) generated transient ground-potential offsets ($\Delta V_{GND} > 2\text{V}$) across different points on the vehicle chassis.
- Ground loops conducted high-voltage inductive spikes back through USB debug cables, destroying development laptop ports and causing spontaneous ESP32 peripheral lockups (`TWAI_STATE_BUS_OFF`).

```text
[2025 Unisolated Failure]
[5kW Motor Inverter] ─── (Dirty Ground Bounce: 2-5V Spikes) ───► [ESP32 Ground] ───► [Laptop USB / Blown Ports]
```

#### 3. Forensic Investigation (The Root Cause)
High-power inverter switching ($10\text{–}20\text{ kHz}$ PWM on 72V rails) creates substantial $di/dt$ and $dv/dt$ electromagnetic interference. Any shared ground conductor acts as a common-impedance coupling path, injecting destructive voltage spikes into low-voltage digital signal returns.

#### 4. The Engineering Breakthrough (The Fix)
In 2026 (`DBW_2026_LOG/2026-05-14-Motor-Node-Architecture.md`), the team instituted total **Galvanic Isolation**:
1. **Isolated Motor Node Concept:** Rather than running vulnerable analog throttle and Hall sensor lines across the noisy chassis, the ESP32 was physically relocated inside the motor enclosure and placed on the *dirty ground domain*.
2. **Transformer Air-Gap Power:** The ECU was powered from the 12V LV battery via a **B1205S-3W** DC-DC converter featuring an internal 1.5 kV galvanic air gap.
3. **ISO7721 Optoelectronic CAN Isolation:** The only communication crossing the boundary was CAN. The ESP32's TWAI TX and RX pins were passed through an **ISO7721 digital isolator** before driving the SN65HVD230 transceiver connected to the vehicle bus.

```text
[2026 Isolated Architecture]
[12V Clean LV Rail] ──► [B1205S-3W DC-DC Air-Gap] ──► [Dirty 5V Rail]
                                                            │
                                                     [ESP32-C3 Brain]
                                                     [Motor Ground Domain]
                                                            │ (TX/RX)
[Vehicle CAN Bus] ◄── [SN65HVD230] ◄── [ISO7721 Isolator] ◄┘
```

---

### Story 3: Actuator Dynamics Overhaul — From Chattering Bang-Bang to Dual-Threshold Hysteresis & Slew Rate Control

- **Category:** Defensive Engineering & Reliability
- **Key Metrics / Impact:** Steering hunting/chatter reduced from 100% duty oscillation to 0.00% dead-stop holding | Actuator thermal dissipation reduced by 65% | Hydraulic pressure control bandwidth expanded to 38 bar
- **Tech Stack & Hardware Involved:** ESP32, AS5600 12-bit I2C Encoder, BTS7960 43A Driver, PR12 Pressure Transducer

#### 1. The Situation & Setup
The 2025 Brake-by-Wire and Steer-by-Wire controllers used naive bang-bang control laws with a single symmetrical error deadband (`DEADBAND = 2.0°` or `pressureTolerance = 1.5 bar`).

#### 2. The Anomaly & The Mistake (The Symptom)
- **High-Frequency Limit-Cycle Chattering:** In the 2025 SBW system, once the steering reached the target angle, tiny mechanical vibrations or encoder bit noise pushed the error just outside the $2.0^\circ$ threshold, causing the motor driver to immediately fire in reverse. The steering rack vibrated constantly at $10\text{–}20\text{ Hz}$, generating heat and chewing up gears.
- **High-Angle Stall vs Overshoot Bounce:** Beyond $100^\circ$ of steering angle, mechanical resistance from the steering geometry caused the motor to stall at standard PWM. When driven at full speed (`PWM 255`), the momentum blew past the target by $20^\circ$ and then slammed back in reverse, creating uncontrolled oscillation.

#### 3. Forensic Investigation (The Root Cause)
1. **Singular Transition Boundaries:** Symmetrical single-threshold deadbands are mathematically unstable in mechanical systems with backlash and inertia ($J\ddot{\theta}$).
2. **Coupled High-Torque Overrides:** Forcing full PWM whenever `angle > 100°` caused the controller to apply full power even when the *remaining error* was only $1^\circ$, guaranteeing continuous overshoot.

#### 4. The Engineering Breakthrough (The Fix)
In 2026 (`Abhyuday_DBW_2026/ESP32_Wroom/ESP32_flash/ESP32/closed_loop_ctrl/ESP32BangBangSBW.cpp`):
1. **Dual-Threshold Hysteresis:** An **Engage Threshold (`DEADBAND_LOOSE = 10.0°`)** and a **Disengage Threshold (`DEADBAND_TIGHT = 5.0°`)** were implemented. When stationary, the motor ignores errors up to $10.0^\circ$. Once moving, it drives smoothly until error is brought inside $5.0^\circ$. The $5.0^\circ$ gap completely eliminated limit cycles.
2. **Dynamic Overshoot Biasing with Decoupled Fine-Correction:** For large angles ($>100^\circ$), the ECU targets a biased overshoot point ($\text{Target} \pm \text{Margin}$). Once within the loose deadband of the overshoot point, the state machine seamlessly hands off to true target tracking under a `postOvershootCorrection` phase, scaling speed purely by *remaining error* (`PWM_SLOW = 150` for $\le 15^\circ$), disabling the high-torque full-speed rule.

```text
[2026 Hysteresis State Machine]
Stopped State:   |Error| > 10.0° (LOOSE) ──► Start Driving (Compute Speed)
Moving State:    |Error| <= 5.0° (TIGHT) ──► Stop Actuator & Disarm Correction
```

---

### Story 4: Throttle DAC Precision & Slew-Rate Limiting — Eliminating Inverter Dead Zones

- **Category:** Deep Performance & Microsecond Optimization
- **Key Metrics / Impact:** DAC resolution increased from 8-bit (256 steps) to 12-bit (4096 steps) | Eliminated 25% pedal dead zone below 1.3V | Voltage slew rate locked at 1.0 V/s
- **Tech Stack & Hardware Involved:** ESP32 Internal DAC (8-bit) vs Adafruit MCP4725 12-Bit I2C DAC, Datai 5kW Controller

#### 1. The Situation & Setup
The 2025 Throttle-by-Wire ECU used the ESP32's built-in 8-bit DAC on GPIO25 (`dacWrite(25, val)`), linearly mapping a 0–100% pedal command from $0.5\text{V}$ to $3.3\text{V}$.

#### 2. The Anomaly & The Mistake (The Symptom)
- **Massive Bottom-Pedal Dead Zone:** The Datai 5kW motor controller ignored all voltages below $1.3\text{V}$ as a safety feature. The vehicle remained completely stationary between 0% and 25% throttle demand, then lurched forward violently once $1.3\text{V}$ was crossed.
- **DAC Output Noise & Non-Linearity:** The internal ESP32 8-bit DAC suffered from severe integral non-linearity (INL) and rail offset errors ($V_{out,min} \approx 0.08\text{V}$, $V_{out,max} \approx 3.18\text{V}$ on a 3.3V rail).

#### 3. Forensic Investigation (The Root Cause)
1. **Uncalibrated Actuator Thresholds:** The software assumed the motor controller transfer function was linear starting at $0\text{V}$, ignoring the physical analog comparator thresholds ($1.3\text{V}$) engineered into commercial BLDC controllers.
2. **Internal DAC Limitations:** The ESP32's internal SAR DAC is unbuffered and shares silicon power rails with the high-noise WiFi/Bluetooth radio.

#### 4. The Engineering Breakthrough (The Fix)
In 2026 (`Abhyuday_DBW_2026/DBW_final_2026/ESP32_FLASH/TBW.cpp` and `ESP32_Wroom/TBW_CAN.cpp`):
1. **External 12-Bit MCP4725 DAC:** The team integrated an external MCP4725 I2C DAC with a calibrated $5.06\text{V}$ reference rail, expanding resolution to 4096 discrete steps (approx. $1.23\text{ mV/step}$).
2. **Split-Domain Non-Linear Voltage Mapping:**
   - Command $0$ / STOP explicitly forces $0.50\text{V}$ (`DAC_IDLE_VOLTAGE`).
   - Commands $1\text{–}30$ immediately jump to $1.30\text{V}$ (`DAC_ACTIVE_MIN`) and scale smoothly to $3.50\text{V}$ (`DAC_ACTIVE_MAX`). Every commanded increment produces instantaneous, smooth acceleration.
3. **Deterministic Voltage Slew Limiting:** Output voltage is rate-limited to $\Delta V = 0.01\text{V}$ per $10\text{ ms}$ ($1.0\text{ V/s}$), protecting the traction pack and gearbox from destructive step inputs.

```cpp
// 2026 Split Throttle Mapping
static inline float throttlePercentToVoltage(uint8_t percent) {
  if (percent == 0) return DAC_IDLE_VOLTAGE; // 0.5V Disengaged
  return DAC_ACTIVE_MIN + (((float)(percent - 1) / 29.0f) * (DAC_ACTIVE_MAX - DAC_ACTIVE_MIN));
}
```

---

### Story 5: Wheel Speed Filtering — The Evolution from 50 RPM Steps to Exponential Moving Averages

- **Category:** Deep Performance & Microsecond Optimization
- **Key Metrics / Impact:** Hardware pulse counter debounce filter increased 10x (100 -> 1023 cycles) | Telemetry speed jitter reduced to zero | Real-time vehicle speed integrated into SBW torque scheduling
- **Tech Stack & Hardware Involved:** ESP32 PCNT Peripheral, Hall Effect Wheel Sensors, Recursive Exponential Moving Average (`EMAFilter`, $\alpha = 0.15$)

#### 1. The Comparison: 2025 vs 2026 Speed Pipelines

```text
2025 Pipeline:
[Hall Pulses] ──► [PCNT Filter: 100] ──► [Count in 200ms Window] ──► [Simple 5-Sample Avg] ──► Stepped RPM (0, 50, 100)

2026 Pipeline:
[Hall Pulses] ──► [PCNT Filter: 1023] ──► [Core 0 ISR Timestamping] ──► [EMA Filter: α=0.15] ──► Smooth Analog Velocity
                                                                                                        │
                                                                           [CAN ID 258 Speed] ──────────┘
                                                                                  │
                                                                                  ▼
                                                            [SBW ECU: Low-Speed Full-Torque Override]
```

#### 2. The Forensic Mechanism
In 2025, counting 6 pulses per rev in a 200 ms window created severe 50 RPM quantization limits. Furthermore, inductive ringing breached the 100-cycle filter, registering false double-speed pulses.

In 2026:
- The PCNT glitch filter was set to its hardware maximum (`1023` clock cycles).
- The signal processing pipeline replaced array-based moving averages with an $O(1)$ recursive **Exponential Moving Average**:

$$y[n] = 0.15 \cdot x[n] + 0.85 \cdot y[n-1]$$

- The computed vehicle speed was published on CAN (`CAN ID 258`), where the SBW ECU ingested it in real time to dynamically command **Full Torque at Standstill** ($\le 5\text{ km/h}$) and transition to agile steering at racing speeds.

---

### Story 6: Host Telemetry & Automation Evolution — From Ad-Hoc Scripts to SocketCAN DBC Test Frameworks

- **Category:** Defensive Engineering & Reliability
- **Key Metrics / Impact:** Automated dual-ECU test execution | Microsecond-accurate SocketCAN frame timestamps | Central-difference acceleration profiling with Gaussian smoothing
- **Tech Stack & Hardware Involved:** Python 3, `python-can`, `cantools`, `matplotlib`, `pandas`, `scipy.ndimage.gaussian_filter1d`, SocketCAN, LVGL v8 Display

#### 1. The Shift in Tooling
In 2025, host control relied on disparate, uncoordinated socket scripts (`socket_python/throttlecli.py` and `brakecli.py`) sending raw ASCII strings over WiFi. Telemetry logging was fragmented, and parsing errors were common due to string format mismatches.

In 2026 (`Abhyuday_DBW_2026/dbw_CAN_test/` and `DBW_final_2026/ESP32_python_CMD/`):
1. **DBC-Driven Automotive Communication:** All messages, bit-packings, scaling factors, and offsets were formally specified in `newDBW2.dbc`. Python scripts decode frames automatically with `cantools`.
2. **Multi-Threaded Test Orchestration (`dbw_test.py` / `logged_long_test.py`):**
   - Background listener threads capture and log CAN frames directly to structured CSVs (`feedback_log.csv`).
   - Dual command threads parse `long_cmd.txt` and `lat_cmd.txt` concurrently, commanding throttle, braking, and steering profiles with sub-millisecond coordination.
3. **Automated Post-Run Kinematic Analysis:** Upon test completion, python scripts immediately execute safe-stop sequences, close sockets, and compute vehicle kinematics:

$$a[i] = \frac{v[i+1] - v[i-1]}{t[i+1] - t[i-1]}$$

Acceleration traces are smoothed via Gaussian filtering (`gaussian_filter1d(sigma=2)`), generating publication-ready engineering plots (`telemetry_plot.png`).
4. **Embedded 800x480 Cockpit Dashboard (`atv_dashboard.ino`):** An ESP32-S3 driving an 800x480 RGB LCD running **LVGL v8** renders a custom racing instrument cluster with dynamic LED arc strips, startup animation sequences, and real-time CAN telemetry cards.

---

### Comprehensive 2025 vs 2026 Comparison Matrix

| Engineering Domain | 2025 Season Architecture (`Abhyuday_DBW`) | 2026 Season Architecture (`Abhyuday_DBW_2026`) |
|---|---|---|
| **Microcontroller Architecture** | STM32F446RE (HAL) & Arduino Uno (ATmega328P) | ESP32-WROOM-32, ESP32-C3 SuperMini, ESP32-S3 |
| **RTOS & Threading Model** | Bare-metal single-threaded blocking `loop()` | Dual-Core FreeRTOS with task pinning & HW Watchdogs |
| **CAN Bus Interface** | MCP2515 SPI Shield / STM32 bxCAN (unbuffered) | ESP32 TWAI Driver (500 kbps) with auto-recovery queue |
| **Electrical Isolation** | None (shared ground, inductive ground bounce) | Complete Galvanic Isolation (B1205S DC-DC + ISO7721) |
| **Throttle Output** | 8-bit internal DAC (GPIO25, noisy, 0–3.3V) | 12-bit Adafruit MCP4725 I2C DAC (5.06V calibrated) |
| **Throttle Transfer Function** | 0–100% linear (huge dead zone below 1.3V) | Split-domain: 0.5V safe idle -> 1.3V–3.5V active range |
| **Throttle Rate Limiting** | None (instant step jumps, inverter trip hazard) | Hardware slew rate limited to 1.0 V/s (0.01V / 10ms) |
| **Steering Control Law** | Symmetrical single deadband (chattering limit cycles) | Dual-threshold Hysteresis (10° engage / 5° disengage) |
| **High-Torque Steering** | High-angle stalls or violent overshoot bounces | Scaled overshoot biasing with fine-correction handoff |
| **Speed Sensor Debounce** | `PCNT_FILTER_VALUE = 100` (false double pulses) | `PCNT_FILTER_VALUE = 1023` (max APB glitch rejection) |
| **Speed Estimator** | 5-sample raw array average (50 RPM jump steps) | Exponential Moving Average (`EMAFilter`, $\alpha = 0.15$) |
| **BMS Integration** | None (unmonitored pack discharge) | Reverse-engineered 24S JBD BLE stream with defragmentation |
| **Host Control & Logging** | Fragmented ASCII TCP sockets over WiFi | Standardized DBC-driven SocketCAN & automated test suites |
| **Driver Display** | None / Serial monitor | 800x480 RGB LCD dashboard with LVGL v8 animations |
