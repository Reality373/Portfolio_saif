# Abhyuday DBW (2025 Season) — Forensic Engineering War Stories & Retrospectives

---

### 1. The "Last-Moment Plan Change" Panic: Emergency Fallback from STM32 HAL to Arduino Uno

- **Category:** Hardware Crisis & Embedded (Paddock Log / War Story)
- **Key Metrics / Impact:** System bring-up rescued within 48 hours of vehicle testing | Latency: 200 ms control loop preserved | 0 to 40 bar hydraulic actuation maintained
- **Tech Stack & Hardware Involved:** STM32F446RE (ARM Cortex-M4), Arduino Uno (ATmega328P), MCP2515 SPI CAN Controller, TJA1050 Transceiver, ACS712 Current Sensor, 12V Hydraulic Linear Actuator, BTS7960 43A H-Bridge

#### 1. The Situation & Setup
During the 2025 E-BAJA season, the team designed an ambitious centralized Brake-By-Wire (BBW) and Throttle-By-Wire (TBW) control architecture based on the STM32F446RE Nucleo-64 microcontroller running STM32Cube HAL firmware (`STM32_F446RE/BrakeByWire`). The STM32 was intended to handle 12-bit ADC multi-channel sampling for hydraulic pressure sensors and current transducers, 500 kbps CAN communication via bxCAN (CAN1), and hardware timer-driven PWM generation on TIM3 Channel 1 (`PB4`/`PB14`/`PB5`) to drive a high-current BTS7960 H-bridge motor driver controlling a linear hydraulic brake actuator.

#### 2. The Anomaly & The Mistake (The Symptom)
Days before full vehicle track testing, the STM32 firmware began exhibiting intermittent freezes and silent fails during rapid CAN burst reception. When brake demand frames (`CAN ID 0x201`) were transmitted by the supervisory node while ADC DMA conversions and TIM3 PWM updates were active, the STM32 entered hard-fault handlers or became permanently trapped in `HAL_CAN_RxFifo0MsgPendingCallback` interrupts. Worse, 3.3V GPIO logic levels on STM32 PB pins struggled to reliably trigger the optocoupled input stages of certain 5V BTS7960 driver boards without active level shifting, leading to inconsistent actuator clamping force.

```text
[Critical Paddock Failure]
STM32F446RE (3.3V Logic) ---> [Optocoupled 5V BTS7960 Gate] ---> Incomplete switching / brownouts
CAN1 + ADC1 Interrupts ---> Nested HAL Vector Latency ---> Unresponsive Brake Actuator
```

#### 3. Forensic Investigation (The Root Cause)
Forensic inspection of `STM32_F446RE/BBW-w-PIDnCAN/Core/Src/main.c` and `errorBBW.c` revealed two intertwined failure mechanisms:
1. **Interrupt Starvation & Mailbox Contention:** The HAL CAN driver (`stm32f4xx_hal_can.c`) was configured with `HAL_CAN_ActivateNotification(&hcan1, CAN_IT_RX_FIFO0_MSG_PENDING)`. When high-frequency CAN traffic flooded FIFO 0 while `HAL_ADC_PollForConversion(&hadc1, 10)` blocked CPU execution in the main loop for 10 sequential samples (~100–200 µs), interrupt latency cascaded, corrupting the HAL state machine.
2. **Logic Threshold Margin:** The BTS7960 optoisolators required a forward diode voltage ($V_f$) and current that 3.3V STM32 output pins barely satisfied under cold paddock conditions.

#### 4. The Engineering Breakthrough (The Fix)
Under severe timeline pressure, the team executed an emergency architecture pivot, memorialized in the codebase directory `LastMomentPlanChange/`:
- The complex STM32 HAL codebase was immediately ported to dedicated, rugged 5V **Arduino Uno (ATmega328P)** microcontrollers paired with external **MCP2515 SPI CAN controllers** and **MCP_CAN** libraries (`LastMomentPlanChange/BBW_arduino_can.cpp` and `TBW_arduino_CAN.cpp`).
- Pinouts were directly mapped: `EN_PIN = 7` (replacing `PB5`), `RPWM_PIN = 6` (replacing `PB14`), `LPWM_PIN = 5` (replacing `PB4`), with ADC lines mapped to 5V analog pins `A0` (Current) and `A1` (Pressure).
- The 5V TTL logic native to the ATmega328P provided rock-solid gate drive to the BTS7960 optocouplers without level-shifter jitter.
- The control loop was decoupled into a strict 200 ms non-blocking execution window with deterministic MCP2515 polling (`CAN_MSGAVAIL == CAN.checkReceive()`).

#### 5. The Core Engineering Lesson
Never deploy complex, multi-peripheral 3.3V ARM HAL firmware to safety-critical actuators on the eve of testing without exhaustive bench stress-testing under simulated bus floods. When emergency reliability is demanded, a rugged, 5V-native microcontroller with dedicated SPI offload controllers beats an over-complicated, uncharacterized HAL state machine.

#### 6. Representative Code / Circuit Logic

```cpp
// Excerpt from: LastMomentPlanChange/BBW_arduino_can.cpp
#include <SPI.h>
#include <mcp_can.h>

// Emergency 5V Pin Mapping replacing STM32 PB4/PB5/PB14
const int EN_PIN   = 7;   // Replaced STM32 PB5 (5V gate drive)
const int RPWM_PIN = 6;   // Replaced STM32 PB14
const int LPWM_PIN = 5;   // Replaced STM32 PB4
const int currentSensorPin  = A0; // ACS712 Current Sensing
const int pressureSensorPin = A1; // 5V Ratiometric Transducer

#define MCP2515_CS_PIN 10
MCP_CAN CAN(MCP2515_CS_PIN);

void loop() {
  float pressureBar = readFilteredPressureBar();

  long unsigned int rxId;
  unsigned char len = 0;
  unsigned char rxBuf[8];
  
  // Non-blocking deterministic CAN poll
  if (CAN_MSGAVAIL == CAN.checkReceive()) {
    CAN.readMsgBuf(&rxId, &len, rxBuf);
    if (rxId == 0x201 && len >= 1) {
      uint8_t brakePercent = constrain(rxBuf[0], 0, 100);
      float newTarget = brakePercent * (maxBrakePressure / 100.0f);
      
      // Fast retraction if brake released
      if (newTarget < targetPressureBar) {
        if (newTarget == 0) analogWrite(LPWM_PIN, 254);
        else analogWrite(LPWM_PIN, 100);
        digitalWrite(RPWM_PIN, LOW);
        actuatorOn = true;
        actuatorStartTime = millis();
      }
      targetPressureBar = newTarget;
      brCommandTime = millis();
    }
  }
  // Deterministic 200ms Actuation Window
  if (millis() - lastControlTime >= controlInterval) {
    lastControlTime = millis();
    float error = targetPressureBar - pressureBar;
    if (abs(error) > pressureTolerance && (millis() - brCommandTime <= brakeAdjustmentWindow)) {
      if (error > 0) {
        digitalWrite(RPWM_PIN, HIGH);
        digitalWrite(LPWM_PIN, LOW);
        actuatorOn = true;
        actuatorStartTime = millis();
      }
    } else {
      stopActuator();
    }
  }
}
```

---

### 2. The Ghost in the Transceiver: Resolving the ESP32 TWAI Bus-Off Lockup via Non-Volatile Boot Resets

- **Category:** Defensive Engineering & Reliability
- **Key Metrics / Impact:** 100% CAN initialization recovery from cold battery disconnects | Automatic Bus-Off unwedge within 2000 ms | Zero manual re-flashes in the paddock
- **Tech Stack & Hardware Involved:** ESP32-WROOM-32, TWAI (Two-Wire Automotive Interface), SN65HVD230 CAN Transceiver, ESP32 NVS (Non-Volatile Storage / `Preferences.h`)

#### 1. The Situation & Setup
As the 2025 development transitioned towards ESP32-based ECUs (`TBW/ESP32/TBWCAN_BootReset.cpp` and `BBW/ESP/BBWCAN_ColdBootReset.cpp`), the team connected the ESP32's internal Two-Wire Automotive Interface (TWAI) peripheral to SN65HVD230 3.3V CAN transceivers communicating at 500 kbps (`CAN_TX GPIO21`, `CAN_RX GPIO22`). The TBW ECU was responsible for broadcasting throttle feedback (`0x102`), node heartbeats (`0x700`), and sampling the pulse counter (`PCNT`) on GPIO35.

#### 2. The Anomaly & The Mistake (The Symptom)
When powering the vehicle via the main low-voltage battery disconnect switch (cold boot), the ESP32 would power up, but the TWAI peripheral frequently initialized in an unresponsive state or immediately entered `TWAI_STATE_BUS_OFF`. The ECU failed to send heartbeats or process throttle commands. However, pressing the manual EN/RST button on the ESP32 development board (warm boot) immediately resolved the issue and brought the CAN bus online perfectly.

```text
[Cold Power Switch ON] ---> ESP32 boots faster than CAN Bus stabilizes ---> Transceiver Glitch ---> TWAI Bus-Off Lockup (Silent Death)
[Manual RST Button Pressed] ---> Warm Reboot with stable bus power ---> TWAI starts OK!
```

#### 3. Forensic Investigation (The Root Cause)
When the vehicle main contactor closed, the 12V-to-5V/3.3V buck converters had a finite slew rate (~10–50 ms), and inductive transients from the contactor coil induced transient noise on the CAN differential lines ($CAN_H$/$CAN_L$) while other ECUs were still in undefined reset states.
1. The ESP32 booted extremely quickly (<15 ms from power rail reaching minimum $V_{DD}$).
2. Upon executing `twai_driver_install()` and `twai_start()`, the TWAI controller detected an active dominant glitch or missing ACK during its initial transmission attempts.
3. The internal error counter exceeded 255 TEC (Transmit Error Count), immediately latching the hardware into `TWAI_STATE_BUS_OFF`.
4. The standard ESP32 Arduino driver lacked an autonomous bus-off recovery callback in the early 2025 firmware revision.

#### 4. The Engineering Breakthrough (The Fix)
The team devised a dual-layer defensive solution combining Non-Volatile Memory (NVS) boot-state tracking with automated runtime driver recovery:
1. **NVS-Tracked Single-Shot Self-Reset:** Using `Preferences.h`, the firmware recorded `bootCount` in flash upon startup. On a genuine cold boot (`bootCount == 1`), the ECU delayed 1000 ms to allow vehicle power rails and bus transceivers to reach electrical equilibrium, and deliberately issued `esp_restart()`. The reboot cleared all peripheral registers with clean bus conditions, resetting `bootCount` to 0.
2. **Runtime Auto-Recovery Watchdog:** In the main loop, every 2000 ms, `twai_get_status_info()` was queried. If `TWAI_STATE_BUS_OFF` was detected, the driver executed an active teardown and reinstall sequence: `twai_stop()`, `twai_driver_uninstall()`, delay 100 ms, and `setupTWAI()`.

#### 5. The Core Engineering Lesson
Power-up sequences in automotive environments are dirty, noisy, and non-instantaneous. Microcontrollers boot faster than physical power supplies stabilize. Hardware initialization must either wait for rail stability or implement non-volatile reboot discrimination and runtime bus-off recovery state machines.

#### 6. Representative Code / Circuit Logic

```cpp
// Excerpt from: TBW/ESP32/TBWCAN_BootReset.cpp & BBW/ESP/BBWCAN_ColdBootReset.cpp
#include <Arduino.h>
#include <Preferences.h>
#include "driver/twai.h"
#include "esp_system.h"

Preferences prefs;
int bootCount = 0;

void checkCANRecovery() {
  twai_status_info_t status;
  if (twai_get_status_info(&status) == ESP_OK) {
    if (status.state == TWAI_STATE_BUS_OFF) {
      Serial.println("[WARN] CAN Bus-Off detected. Attempting recovery...");
      twai_stop();
      twai_driver_uninstall();
      delay(100);
      if (setupTWAI()) {
        Serial.println("[INFO] CAN successfully recovered.");
      } else {
        Serial.println("[ERROR] CAN recovery failed, will retry...");
      }
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(100);

  // Read and increment NVS boot counter
  prefs.begin("bootData", false);
  bootCount = prefs.getInt("bootCount", 0);
  bootCount++;
  prefs.putInt("bootCount", bootCount);
  prefs.end();

  // Cold boot detected -> intentional 1s stabilization restart
  if (bootCount == 1) {
    Serial.println("Cold boot detected -> restarting ECU in 1s for bus stabilization...");
    delay(1000);
    esp_restart();
  }

  // Clear boot count once cleanly operational
  prefs.begin("bootData", false);
  prefs.putInt("bootCount", 0);
  prefs.end();

  setupPCNT_rising();
  setupTWAI();
}
```

---

### 3. Hydraulic Non-Linearity & Stall Detection: Pressure-Mapped Brake-by-Wire Control

- **Category:** Defensive Engineering & Reliability
- **Key Metrics / Impact:** Actuation time: 1.37 s full stroke at 18V | Peak clamping pressure: 38.0 bar | Stall cutoff: 1500 ms current-variance watchdog (<0.05A delta)
- **Tech Stack & Hardware Involved:** STM32 / ESP32, PR12 5V Ratiometric Pressure Transducer (0–500 PSI), ACS712 Hall-Effect Current Sensor, BTS7960 Driver, Hydraulic Master Cylinder

#### 1. The Situation & Setup
The 2025 Brake-by-Wire actuator (`BBW/pressuremappedbrakes.cpp`) mechanically couples a high-power DC motor driven through a reduction gearbox to a hydraulic master cylinder. The brake system operates at up to 38.0–40.0 bar (approx. 550 PSI) hydraulic pressure. Brake commands are received as target percentages (0–100%), which must be mapped to target pressures and converted to directional PWM commands on the H-Bridge.

```text
[Brake Cmd: 0-100%] ---> [Mapping: 0 to 38.0 Bar] ---> [H-Bridge RPWM/LPWM] ---> [Hydraulic Caliper]
                                                                ^                       |
                                                                |-- [PR12 Pressure] <---|
                                                                |-- [ACS712 Current] <--|
```

#### 2. The Anomaly & The Mistake (The Symptom)
During initial testing:
1. When full braking was commanded, the actuator drove against the physical mechanical stops of the master cylinder once the fluid became incompressible. The motor stalled, drawing upwards of 25A, overheating the BTS7960 MOSFETs and risking melted wiring.
2. At low brake pressures (0–5 bar), the linear mapping produced zero braking due to mechanical slop and caliper piston seal friction, while at high pressures (>30 bar), pressure spiked exponentially with microscopic actuator displacement.
3. The pressure sensor reported noisy ADC readings that triggered rapid back-and-forth chattering of the H-bridge relays/MOSFETs.

#### 3. Forensic Investigation (The Root Cause)
1. **Hydraulic Non-Linearity:** Hydraulic compliance is highly non-linear. Free caliper travel requires low force, while pad-to-rotor contact causes an abrupt stiffness jump ($dP/dx \to \infty$).
2. **Current Signature of Mechanical Stall:** When the actuator reaches end-of-stroke or locks the rotor, motor back-EMF drops to zero ($V_{bemf} = 0$), and current rises to $I_{stall} = V_{supply} / R_{winding}$. However, minor current fluctuations still occur due to brush noise. If current variance $\Delta I < 0.05\text{ A}$ over a 1500 ms window while `RPWM` is active, the actuator is physically jammed.
3. **Sensor Scaling Physics:** The PR12 transducer is a 5V ratiometric sensor ($0.5\text{V} = 0\text{ PSI}$, $4.5\text{V} = 500\text{ PSI}$). When connected to a 3.3V ADC via a voltage divider or directly to a 5V ADC, the transfer function required exact mathematical formulation:

$$\text{PSI} = \frac{(V_{sensor} / V_{supply}) - 0.1}{0.00032}$$

$$\text{Bar} = \text{PSI} \times 0.0689476$$

#### 4. The Engineering Breakthrough (The Fix)
The team implemented a three-tier defensive control scheme (`BBW/pressuremappedbrakes.cpp` and `BBW/BBWpid.cpp`):
1. **Current-Variance Stall Watchdog:** The firmware continuously tracked the current derivative. If current remained static within `currentStallThreshold = 0.05A` for `stallTimeout = 1500ms`, the H-bridge was immediately forced LOW (`RPWM = LOW`), cutting motor power to prevent burnout.
2. **Asymmetric Retraction Dynamics:** Full retraction (`br0` / 0% brake) was decoupled from PID: it commanded maximum PWM (`LPWM = 254`) for 1.37–1.5 seconds to guarantee the master cylinder completely disengaged, preventing brake drag.
3. **Non-Intrusive Electrical Fault Detection:** In `errorBBW.c`, ADC boundaries were enforced ($20 \le \text{ADC} \le 4075$). Any voltage outside this band signaled an open-circuit or short-circuit fault, asserting dedicated hardware `FAULT_PIN` (PA9) and disabling actuation.

#### 5. The Core Engineering Lesson
Never drive a high-force linear actuator against a hydraulic column without closed-loop current sensing and timeout watchdogs. When incompressible fluid resistance is reached, stall currents will destroy power stages in seconds unless the firmware actively detects the stall condition.

#### 6. Representative Code / Circuit Logic

```cpp
// Excerpt from: BBW/pressuremappedbrakes.cpp
const float currentSensitivity = 0.1;        // ACS712: 100 mV/A
const float currentStallThreshold = 0.05;   // 50 mA current delta threshold
const unsigned long stallTimeout = 1500;     // 1.5s stall timeout

void loop() {
  float currentVoltage = analogRead(currentSensorPin) * Vref / ADC_MAX_VALUE;
  float currentAmps = (currentVoltage - zeroCurrentVoltage) / currentSensitivity;

  // Active Stall Detection Watchdog
  if (digitalRead(RPWM_PIN) == HIGH) {
    if (abs(currentAmps - lastCurrent) < currentStallThreshold) {
      if (stableStartTime == 0) {
        stableStartTime = millis();
      } else if (millis() - stableStartTime >= stallTimeout) {
        digitalWrite(RPWM_PIN, LOW); // Hard power cut on stall
        brActive = false;
        Serial.println("!!! STALL DETECTED: RPWM FORCED OFF !!!");
      }
    } else {
      stableStartTime = 0;
      lastCurrent = currentAmps;
    }
  }
}
```

---

### 4. The Remote Kill Long-Press Safety Dilemma & RTDS State Machine

- **Category:** Defensive Engineering & Reliability
- **Key Metrics / Impact:** Elimination of false kill-switch activations caused by touch bounce | Precise 1000 ms hold threshold | Mandatory 2000 ms Ready-To-Drive Sound (RTDS) acoustic arming
- **Tech Stack & Hardware Involved:** ESP32, Arduino, Relay Actuation Stages, Web Interface / Physical Button Debounce, Acoustic Buzzer

#### 1. The Situation & Setup
For vehicle safety compliance in collegiate automotive competitions (BAJA SAE), an autonomous/drive-by-wire vehicle must have an infallible Remote Kill mechanism and a Ready-To-Drive Sound (RTDS) system (`Overall/RemoteKill.cpp`, `RTDS_Arduino_Sketch.cpp`). If wireless link drops or the remote kill button is pressed, the vehicle must drop high-voltage contactors and apply brakes immediately.

#### 2. The Anomaly & The Mistake (The Symptom)
During early testing with a wireless web UI and touch-screen buttons (`Overall/wirelesscomm.cpp`), team members accidentally triggered vehicle shutdowns simply by brushing against the phone screen or because of capacitive touch bounce. Conversely, when attempting to intentionally kill the vehicle during a runaway condition, a 2-second hold requirement proved dangerously sluggish, allowing the vehicle to travel multiple meters before shutdown.

#### 3. Forensic Investigation (The Root Cause)
Commit history analysis across `734b32a`, `8ea5356`, `eec7c72`, and `f8abdd7` reveals the iterative tuning conflict:
1. Instant click handlers (`onclick`) fired on unintended finger touches and browser DOM text-selection events.
2. A 2000 ms long-press was safe against accidental touches but breached dynamic braking safety stopping distance budgets.
3. CSS user-select was enabled, causing the browser to highlight text on touch-down instead of executing the press timer.

#### 4. The Engineering Breakthrough (The Fix)
1. **1000 ms Hold Threshold with CSS Touch Isolation:** The hold timeout was calibrated to exactly 1000 ms, with CSS `-webkit-user-select: none` to prevent browser gesture interference.
2. **Deterministic Hardware RTDS Tone Sequence:** On vehicle arming, the RTDS module executed a blocking 2-second audible acoustic warning (minimum 70 dBA at 2m) using hardware PWM before closing motor contactors:

```text
[Arming Trigger] ---> [RTDS Horn 2000ms Tone] ---> [Contactor Enable High] ---> [Drive-By-Wire Active]
[Kill Trigger / Timeout > 1000ms] ---> [Instant Contactor Open] ---> [Actuator Safe Retract]
```

#### 5. The Core Engineering Lesson
Safety interlocks must balance two opposing hazards: false-positive disconnections (which ruin test runs and cause erratic stops) and false-negative delays (which cause collisions). Calibrate human-interface timeouts against vehicle stopping distance at top speed.

---

### Summary of 2025 Repository Artifacts & Files

| Module / Script | Path | Core Responsibility |
|---|---|---|
| **Last-Moment BBW** | `LastMomentPlanChange/BBW_arduino_can.cpp` | Emergency Arduino Uno + MCP2515 5V fallback brake controller |
| **Last-Moment TBW** | `LastMomentPlanChange/TBW_arduino_CAN.cpp` | Emergency Arduino Uno throttle controller with PCNT speed sensing |
| **NVS Boot Reset** | `TBW/ESP32/TBWCAN_BootReset.cpp` | ESP32 TWAI CAN auto-recovery & NVS cold-boot reset state machine |
| **STM32 Fault BBW** | `STM32_F446RE/errorBBW.c` | STM32F446RE ADC boundary checks & hardware FAULT pin latching |
| **Pressure BBW** | `BBW/pressuremappedbrakes.cpp` | ACS712 current-variance stall detection & PR12 pressure mapping |
| **Remote Failsafe** | `Overall/RemoteKill.cpp` | Long-press safety interlock and wireless kill switch handler |
