# Abhyuday DBW 2026 Season — Forensic Engineering War Stories & Breakthroughs

---

### 1. The 5kW Motor Controller Ground Loop & The "Isolated Motor Node" Architecture

- **Category:** Hardware Crisis & Embedded (Paddock Log / War Story)
- **Key Metrics / Impact:** 100% Galvanic Isolation between 72V Traction / 5kW Motor and Low-Voltage (LV) Electronics | Zero ground-bounce brownouts | Hall signal trigger restored from <1mA to solid 15mA opto drive
- **Tech Stack & Hardware Involved:** ESP32-C3 SuperMini, Datai 5kW Motor Controller, B1205S-3W / B0505S-1W Isolated DC-DC Converters, ISO7721 High-Speed Digital Isolator, SN65HVD230 CAN Transceiver, 2N2222A NPN Transistors

#### 1. The Situation & Setup
In the 2026 vehicle architecture (`DBW_2026_LOG/2026-05-14-Motor-Node-Architecture.md`), the powertrain utilized a high-voltage Datai 5kW BLDC motor controller. The drive-by-wire subsystem required two critical interfaces with the motor controller:
1. **Isolated RPM Sensing:** Reading the purple Hall sensor pulse line from the motor controller to calculate motor RPM and vehicle speed.
2. **Drive-by-Wire Throttle Command:** Injecting an analog acceleration signal ($0.5\text{V}$ to $3.5\text{V}$) into the motor controller's throttle input.
The low-voltage (LV) vehicle electronics (Jetson Orin, sensors, steering ECUs) operated on an isolated 12V/5V battery rail.

#### 2. The Anomaly & The Mistake (The Symptom)
Initial bench testing encountered two severe hardware failures:
1. **Dim LED / Inoperative Optocoupler:** When a PC817 optocoupler was wired directly to the purple Hall sensor wire to maintain galvanic isolation, the optocoupler completely failed to trigger. A diagnostic LED placed across the signal wire glowed dimly.
2. **Ground-Loop & EMI Hazards:** When the team attempted to power the optocoupler's motor-side LED by tapping into the motor controller's 5V throttle excitation line, high-frequency motor switching noise ($V_{EMI}$) caused erratic throttle surging and controller faults. Connecting grounds directly risked bridging 72V high-power traction ground loops into the sensitive ESP32 and USB debugging laptops.

```text
[Flawed Initial Attempt]
Datai 5kW Controller (Purple Wire: <1mA Pull-up) ---> [PC817 Opto (Needs ~10mA)] ---> Fails to Trigger!
Shared Ground Connection ---> 5kW PWM Switching Spikes ---> ESP32 Brownouts & Blown USB Ports
```

#### 3. Forensic Investigation (The Root Cause)
1. **High Internal Pull-Up Resistance:** Electrical multimeter probing revealed the Datai motor controller's internal Hall pull-up resistor was $>4.7\text{k}\Omega$, limiting current sourcing capability to under $1\text{mA}$. The PC817 optocoupler's infrared LED requires a minimum forward current $I_F \approx 10\text{mA}$ to achieve saturated optical switching across its phototransistor base.
2. **Switching Sinks vs. Sources:** The Hall sensor line is an open-collector low-side sink. Without amplification, it could not drive an optical barrier directly.
3. **Multi-Pin Isolation Complexity:** Attempting to isolate analog throttle, digital Hall pulses, reverse signals, and brake switches individually required 4+ discrete isolators, level shifters, and RC filters spanning the noisy physical chassis.

#### 4. The Engineering Breakthrough (The Fix)
The team executed a master architectural pivot: **The Isolated Motor Node** (`DBW_2026_LOG/2026-05-14-Motor-Node-Architecture.md`).
1. **Transistor Amplification Stage:** A **2N2222A NPN BJT** was placed on the purple Hall line. Because BJTs provide high DC current gain ($\beta > 100$), the micro-ampere trickle from the motor controller easily saturated the base, switching clean current from an auxiliary rail through the collector.
2. **Moving the Microcontroller to the "Dirty" Ground:** Instead of bridging individual analog and sensor pins, the team moved the entire ESP32-C3 ECU to the motor side, sharing a common reference ground with the 5kW controller.
3. **Power Isolation:** The ESP32-C3 was powered from the 12V LV battery through a **B1205S-3W** (or B0505S-1W) galvanic DC-DC converter featuring an internal toroidal transformer air-gap.
4. **Single-Point Digital Isolation via ISO7721:** The *only* interface that crossed the isolation boundary was the differential **CAN Bus**. An **ISO7721 dual-channel digital isolator** was placed between the ESP32 TWAI UART pins and the isolated SN65HVD230 CAN transceiver.

```text
[LV Battery Rail (12V Clean Ground)]
       |
  [B1205S-3W DC-DC Isolated Barrier]
       |
[MOTOR NODE (72V/5kW Dirty Ground Domain)]
  ESP32-C3 Brain <---> 2N2222A Transistor <---> Purple Hall Line
  ESP32-C3 Brain <---> RC Filter (4.7k/10uF) <---> Datai Throttle In (0.5V-3.5V)
       | (TX/RX)
  [ISO7721 Galvanic Digital Isolator]
       |
  [SN65HVD230 CAN Transceiver] <==================> CAN BUS (To Jetson / ECUs)
```

#### 5. The Core Engineering Lesson
When interfacing with high-power traction inverters, do not attempt to isolate multiple dirty analog and PWM lines individually. Move the processing node into the high-voltage ground domain and cross the isolation barrier exclusively with a robust, differential digital communication bus (CAN).

#### 6. Representative Code / Circuit Logic

```text
       MOTOR CONTROLLER (Dirty Ground)
       ┌───────────────────────────────┐
       │ [Purple Wire] (Weak Pull-Up)  │
       └──────────────┬────────────────┘
                      │
                      ▼
               1kΩ  ┌───┐
     [Wire] ───═══──┤ B │  2N2222A NPN
                    │   ├─── E ───► GND (Motor Side)
                    └───┘
                      │ C
                      ├───► ESP32-C3 GPIO (Pulse Input)
                      │
                     10kΩ
                      │
                    [+5V Isolated Rail]
```

---

### 2. Eliminating Steer-by-Wire Limit-Cycle Oscillation: Dual-Threshold Hysteresis & Scaled Overshoot

- **Category:** Architecture & Paradigm Shifts
- **Key Metrics / Impact:** Elimination of 100% of hunting/chatter at small angles | 0.00% angular hunting at standstill | Seamless high-torque navigation past 100° steering angles
- **Tech Stack & Hardware Involved:** ESP32 (Dual Core FreeRTOS), AS5600 12-Bit Magnetic Rotary Encoder (I2C), BTS7960 43A H-Bridge, High-Torque Steering Column DC Actuator

#### 1. The Situation & Setup
The Steer-by-Wire (SBW) ECU (`Abhyuday_DBW_2026/ESP32_Wroom/ESP32_flash/ESP32/closed_loop_ctrl/ESP32BangBangSBW.cpp` and `DBW_final_2026/OTA/SBW.cpp`) controls the vehicle's front steering rack using an AS5600 12-bit magnetic encoder mounted to the steering column. An ESP32 executes an asynchronous FreeRTOS background task on Core 0 (`encoderTaskCode`) sampling the encoder over I2C at 100 Hz, while Core 1 executes the closed-loop motor driving state machine (`RPWM GPIO26`, `LPWM GPIO25`).

#### 2. The Anomaly & The Mistake (The Symptom)
Two critical control anomalies crippled earlier SBW prototypes:
1. **Zero-Point Chattering (Limit-Cycle Oscillation):** Around small target angles (0° to 10°), the actuator entered violent, audible limit-cycle chatter. The motor continuously toggled between `RPWM` and `LPWM` at high frequency, drawing heavy current surges and shaking the front tie rods.
2. **High-Torque Stalls & Dynamic Overshoot Bounce:** Beyond 80°–100° of steering wheel angle, steering rack mechanical resistance increased non-linearly due to kingpin inclination, scrub radius, and tire-ground friction. A standard bang-bang drive stalled before reaching the target. When forced to maximum speed (`PWM_FAST = 255`) to overcome resistance, the actuator blew past the target and then oscillated wildly during the return stroke.

```text
[Target: 0°] ---> Measured: +2.1° (Deadband 2.0°) ---> Drive Left ---> Measured: -2.1° ---> Drive Right ---> Infinite Chatter!
[Target: 140°] ---> High Scrub Friction ---> Motor Stalls ---> Overshoot Forced ---> Blows past to 160° ---> Slams back!
```

#### 3. Forensic Investigation (The Root Cause)
1. **Single-Threshold Deadband Singularity:** In the original code, `DEADBAND = 2.0°` was used for both *engaging* and *disengaging* motor drive. When the motor cut off, mechanical backlash and rotor inertia kicked the encoder reading slightly across the boundary ($2.01^\circ \leftrightarrow 1.99^\circ$), immediately re-engaging reverse drive.
2. **Velocity-Angle Coupling in the Correction Zone:** Earlier iterations forced `PWM_FAST` whenever `currentAngle > 100.0°`. Consequently, during the fine-correction return pass after an overshoot, the controller commanded full 255 PWM to correct a tiny remaining error ($2^\circ$), guaranteeing massive overshoot in the opposite direction.

#### 4. The Engineering Breakthrough (The Fix)
The team created a multi-stage control architecture combining dual-threshold hysteresis, scaled overshoot biasing, and decoupled correction phases (`ESP32BangBangSBW.cpp`):
1. **Dual-Threshold Hysteresis Deadband:**
   - **Engage Threshold (`DEADBAND_LOOSE = 10.0°`):** When stopped, the motor will not activate until error exceeds $10.0^\circ$.
   - **Disengage Threshold (`DEADBAND_TIGHT = 5.0°`):** Once moving, the actuator continues driving until error is reduced below $5.0^\circ$. The $5.0^\circ$ dead gap completely prevents self-retriggering chatter.
2. **Scaled Overshoot Margin Function:** For targets past `HIGH_TORQUE_THRESHOLD = 100.0°`, an extra overshoot bias is calculated dynamically based on target magnitude, capped at `OVERSHOOT_MAX = 35.0°`:

$$\text{Margin} = \min\left(15.0 + 0.25 \times (\text{Target} - 100.0), 35.0\right)$$

3. **Fine-Correction Phase (`postOvershootCorrection`):** Once the actuator reaches the biased overshoot target, the state machine smoothly transitions to true target tracking without stopping. Critically, speed during this phase is computed purely from remaining error magnitude (`PWM_SLOW = 150` or `PWM_MEDIUM = 230`), explicitly disabling the high-torque full-speed override.
4. **Adaptive 4s Safety Window:** If the motor runs for 4 seconds continuously, the ECU evaluates true error. If error $>30^\circ$, it assumes valid long-distance travel and extends the window; if error $\le 30^\circ$, it latches `systemFault = true` to protect against mechanical jams.

#### 5. The Core Engineering Lesson
Bang-bang and high-gain controllers operating across mechanical linkages with backlash must incorporate hysteresis. Symmetrical on/off thresholds always oscillate. Furthermore, high-torque boosts must be decoupled during error convergence to avoid violent limit cycles.

#### 6. Representative Code / Circuit Logic

```cpp
// Excerpt from: Abhyuday_DBW_2026/ESP32_Wroom/ESP32_flash/ESP32/closed_loop_ctrl/ESP32BangBangSBW.cpp

const float DEADBAND_TIGHT = 5.0;         // Disengage threshold
const float DEADBAND_LOOSE = 10.0;        // Engage threshold
const float SLOW_THRESHOLD = 15.0;        // Fine speed transition
const float HIGH_TORQUE_THRESHOLD = 100.0;

// Speed selection decoupled from absolute angle during correction
int computeSpeed(float travelError, float currentAngleNow) {
  if (overshootActive) return PWM_FAST;
  if (postOvershootCorrection) {
    // Rely strictly on remaining error to prevent high-speed bounce
    return (abs(travelError) <= SLOW_THRESHOLD) ? PWM_SLOW : PWM_MEDIUM;
  }
  if (abs(currentAngleNow) > HIGH_TORQUE_THRESHOLD) return PWM_FAST;
  if (abs(travelError) <= SLOW_THRESHOLD) return PWM_SLOW;
  return PWM_MEDIUM;
}

void loop() {
  currentAngle = continuousDegrees;
  float activeTarget = firstCmdReceived ? targetAngle : 0.0;
  float error = activeTarget - currentAngle;
  float travelError = error;

  // Overshoot Hand-off
  if (overshootActive) {
    float biasedTarget = activeTarget + (activeTarget >= 0 ? currentOvershootMargin : -currentOvershootMargin);
    float biasedError = biasedTarget - currentAngle;
    if (abs(biasedError) <= DEADBAND_LOOSE) {
      overshootActive = false;
      postOvershootCorrection = true; // Arm fine-correction
      travelError = error;
    } else {
      travelError = biasedError;
    }
  }

  // Hysteresis State Machine
  if (systemFault) {
    stopActuator();
  } else if (actuatorOn) {
    // Currently driving -> stop only once inside TIGHT deadband
    if (abs(travelError) <= DEADBAND_TIGHT) {
      stopActuator();
      postOvershootCorrection = false;
    } else {
      activePwmSpeed = computeSpeed(travelError, currentAngle);
      if (travelError > 0) steerRight(activePwmSpeed);
      else steerLeft(activePwmSpeed);
    }
  } else {
    // Currently stopped -> engage only once outside LOOSE deadband
    if (abs(travelError) > DEADBAND_LOOSE) {
      activePwmSpeed = computeSpeed(travelError, currentAngle);
      if (travelError > 0) steerRight(activePwmSpeed);
      else steerLeft(activePwmSpeed);
    }
  }
}
```

---

### 3. The 50 RPM Quantization Step & Sensor Debounce: Evolution of the Signal Conditioning Pipeline

- **Category:** Deep Performance & Microsecond Optimization
- **Key Metrics / Impact:** Hardware pulse counter glitch filter expanded from 100 to 1023 | 50 RPM discrete quantization staircases smoothed into continuous telemetry | Slew rate limited to 1.0 V/s (0.01V / 10ms)
- **Tech Stack & Hardware Involved:** ESP32 PCNT Peripheral (Pulse Counter), Hall Effect Wheel Sensor, Inductive Proximity Sensor, Adafruit MCP4725 12-Bit DAC, I2C

#### 1. The Situation & Setup
The Throttle-by-Wire (TBW) ECU (`Abhyuday_DBW_2026/ESP32_Wroom/TBW_version_history.md`, `DBW_final_2026/ESP32_FLASH/TBW.cpp`) measures vehicle speed using wheel/shaft magnetic pulse sensors generating 6 pulses per revolution (`PULSES_PER_REV = 6`) on a 23.0-inch tire. Pulses are accumulated in hardware using the ESP32 Pulse Counter (`PCNT`) peripheral and processed every `REPORT_MS = 200` ms.

#### 2. The Anomaly & The Mistake (The Symptom)
During track runs:
1. **False Pulse Spikes:** At 50% throttle, telemetry recorded sudden instantaneous doublings in Pulses Per Second (e.g., PPS jumped from 5 to 10), causing speed readouts to spike erratically.
2. **50 RPM Quantization Staircases:** The reported engine/wheel RPM jumped exclusively in harsh geometric steps of exactly 50 RPM (0, 50, 100, 150, 200 RPM), creating stepped speed profiles that destabilized cruise control loops.
3. **Pedal Dead-Zone Inaction:** The motor controller did not begin turning the wheels until input voltage reached $1.3\text{V}$, but the ECU linear mapping mapped 1% throttle starting at $0.5\text{V}$, creating a massive dead zone over the first 25% of pedal travel.

#### 3. Forensic Investigation (The Root Cause)
1. **Sensor Contact Bounce & Inadequate PCNT Filtering:** Electrical ringing from inductive proximity sensor transitions breached the initial `PCNT_FILTER_VALUE = 100` threshold, causing the hardware counter to register double falling edges.
2. **Sampling Window Discretization Physics:** At $T_{sample} = 200\text{ ms}$ and $N = 6\text{ PPR}$, a single pulse registered in one window computes mathematically to:

$$\text{PPS} = \frac{1\text{ pulse}}{0.200\text{ s}} = 5\text{ pulses/sec}$$

$$\text{RPM} = \frac{5\text{ pulses/sec}}{6\text{ pulses/rev}} \times 60 = 50\text{ RPM}$$

Any integer counting method in a 200 ms window fundamentally cannot resolve speeds between 0 and 50 RPM without time-interval measurement or mathematical filtering.

#### 4. The Engineering Breakthrough (The Fix)
The signal processing and DAC drive pipeline evolved through four distinct architectural stages (`TBW_version_history.md`):
1. **Hardware PCNT Debounce Maxing:** `PCNT_FILTER_VALUE` was increased to `1023` (the ESP32 APB clock hardware filter ceiling), completely suppressing high-frequency inductive ringing.
2. **Cascaded Median to Exponential Moving Average (EMA):** The team evaluated simple moving averages (which dragged up on spikes) and median filters (which eliminated spikes but had phase lag), ultimately designing a custom `EMAFilter` class:

$$y[n] = \alpha \cdot x[n] + (1 - \alpha) \cdot y[n-1] \quad (\alpha = 0.15)$$

This $O(1)$ memory and time filter smoothly curved the discrete 50 RPM staircases into continuous acceleration traces.
3. **Split-Domain Throttle Voltage Mapping:** The throttle voltage transfer function was decoupled into distinct idle and active regimes:
   - **Idle State ($0\%$ or STOP):** Output clamped to $0.5\text{V}$ (`DAC_IDLE_VOLTAGE`).
   - **Active State ($1\%$ to $30\%$ scale):** Instantly steps to $1.3\text{V}$ (`DAC_ACTIVE_MIN`) and scales linearly to $3.5\text{V}$ (`DAC_ACTIVE_MAX`).
4. **Slew Rate Voltage Limiter:** Ramp rates were constrained to $\Delta V = 0.01\text{V} / 10\text{ ms}$ ($1.0\text{ V/s}$), preventing motor controller over-current trips during step inputs.

#### 5. The Core Engineering Lesson
Never rely on integer pulse counts in fixed time windows for low-speed control without analyzing quantization physics. Pair hardware-level glitch filtering with exponential recursive estimators, and always measure physical actuator response thresholds to eliminate software dead zones.

#### 6. Representative Code / Circuit Logic

```cpp
// Excerpt from: Abhyuday_DBW_2026/DBW_final_2026/ESP32_FLASH/TBW.cpp

class EMAFilter {
  private:
    float alpha;
    float currentEMA;
    bool initialized;
  public:
    EMAFilter(float factor) : alpha(factor), currentEMA(0.0f), initialized(false) {}
    void reset() { currentEMA = 0.0f; initialized = false; }
    float add(float val) {
      if (!initialized) { currentEMA = val; initialized = true; }
      else { currentEMA = (val * alpha) + (currentEMA * (1.0f - alpha)); }
      return currentEMA;
    }
};

// Split Voltage Mapping eliminating Motor Controller 1.3V Dead-Zone
float throttleToVoltage(int command) {
  if (command == 0) return DAC_IDLE_VOLTAGE; // 0.5V Safe Idle
  // 1-30 Command maps directly across 1.3V to 3.5V active range
  return DAC_ACTIVE_MIN + (((float)(command - 1) / 29.0f) * (DAC_ACTIVE_MAX - DAC_ACTIVE_MIN));
}

// Hardware Pulse Counter with Max Debounce (1023 cycles)
void setupPCNT_falling() {
  pcnt_config_t cfg = {};
  cfg.pulse_gpio_num = SENSOR_PIN;
  cfg.ctrl_gpio_num  = PCNT_PIN_NOT_USED;
  cfg.channel        = PCNT_CHANNEL_0;
  cfg.unit           = PCNT_UNIT_0;
  cfg.pos_mode       = PCNT_COUNT_DIS;
  cfg.neg_mode       = PCNT_COUNT_INC; // Count falling edges
  pcnt_unit_config(&cfg);
  
  pcnt_set_filter_value(PCNT_UNIT_0, 1023); // Max hardware rejection
  pcnt_filter_enable(PCNT_UNIT_0);
}
```

---

### 4. Reverse Engineering the JBD/Xiaoxiang 24S BMS BLE Telemetry Protocol

- **Category:** Zero-Docs Reverse Engineering & Protocols
- **Key Metrics / Impact:** Decoded live pack telemetry for 24-cell high-voltage lithium pack | Diagnosed critical deep-discharge 0x000A fault (49.18V pack, ~2.04V/cell) | 100% packet reassembly success across 20-byte BLE MTU boundaries
- **Tech Stack & Hardware Involved:** ESP32-C3 SuperMini, NimBLE-Arduino Library, JBD/Xiaoxiang Smart BMS (SP24S005P24S150A), Bluetooth Low Energy (BLE)

#### 1. The Situation & Setup
To safeguard the vehicle's custom 24S Lithium-ion accumulator pack (`DBW_2026_LOG/2026-05-22-ESP32-BLE-Integration-24S-BMS.md`), the team integrated an ESP32-C3 as a wireless telemetry gateway connecting to a JBD/Xiaoxiang 24S 150A Smart BMS over BLE. The ECU was required to request, extract, and stream total pack voltage, cell balancing status, current draw, temperature, and hardware protection fault codes.

#### 2. The Anomaly & The Mistake (The Symptom)
During protocol bring-up, four consecutive engineering roadblocks were hit:
1. **Radio Conflicts & Instant Drops:** Scanning for the BMS MAC address (`a4:c1:37:27:d8:9c`) succeeded, but the connection immediately dropped.
2. **The Silent Polling Loop:** The ESP32 connected and subscribed to characteristic `FF01` (RX), but never sent telemetry requests to `FF02` (TX), stalling execution.
3. **Command Error 81:** When requests were transmitted, the BMS responded with error frames: `DD 03 81 00 FF 7F 77`.
4. **Garbage Telemetry:** Once data arrived, parsed values were nonsensical: Pack Voltage was reported as **654.07 V** and State-of-Charge was reported as **173%**.

```text
[ESP32 NimBLE] ---> Command Byte 0x5A ---> [JBD 24S BMS] ---> Response: DD 03 81 (Error 0x81: Write Not Permitted)
[BMS 34-Byte Payload] ---> BLE MTU 20-Byte Limit ---> Packet 1 (20B) Parsed Incompletely ---> Garbage Telemetry (654.07V!)
```

#### 3. Forensic Investigation (The Root Cause)
1. **Scanning Callback Radio Contention:** Calling `connect()` directly from within the asynchronous BLE scanning callback (`onResult`) caused hardware radio collision between the ESP32 BLE receiver and transmitter state machines.
2. **Strict Write Permission Check:** The firmware checked `pTxChar->canWrite()`. However, the JBD BMS characteristic was configured for `Write Without Response` (`canWriteNoResponse()`). The standard write check evaluated to false, suppressing command transmission.
3. **Command Byte Opcode Typo:** The command payload was configured as `0x5A` (Write Register) instead of `0xA5` (Read Basic Info Register).
4. **BLE MTU Fragmentation (20-Byte Boundary):** Standard BLE 4.0 limits single GATT notifications to a 20-byte Maximum Transmission Unit (MTU). The 34-byte status report was split across two distinct notification events. The parser naively attempted to unpack the entire struct from the first 20-byte chunk, reading out-of-bounds uninitialized memory.

#### 4. The Engineering Breakthrough (The Fix)
The protocol handler was completely overhauled (`ESP32_C3/JBD_BMS_info_BT_to_Serial.cpp`):
1. **Decoupled Connection State Machine:** The scan callback was restricted to setting a boolean flag. The active BLE connection handshake was deferred to the main `loop()` after explicitly halting the scanner.
2. **Permission Check Update:** Characteristic verification was updated to accept `canWrite() || canWriteNoResponse()`.
3. **Opcode Correction:** The request payload was corrected to:

```text
basicInfoCmd = {0xDD, 0xA5, 0x03, 0x00, 0xFF, 0xFD, 0x77}
```

4. **Dynamic Stream Reassembly Buffer:** A dynamic `std::vector<uint8_t> rxBuffer` was implemented. In the notification callback, incoming fragments were appended to the buffer. The parser verified the start byte (`0xDD`), parsed expected payload length from byte 3, and only decoded when the complete `dataLen + 7` byte frame terminated in the stop byte (`0x77`).
5. **Critical Pack Discovery:** Accurate decoding immediately revealed the pack was in a deep-discharge state ($49.18\text{V}$ total, $\sim 2.04\text{V}/\text{cell}$) with active fault code `0x000A` (Cell & Pack Under-Voltage Protection), enabling recovery charging before permanent cell damage occurred.

#### 5. The Core Engineering Lesson
Never assume continuous stream delivery over BLE characteristics. BLE is inherently packet-fragmented around 20-byte MTUs. Always implement a framed stream reassembly state machine validating header, length, payload, and stop bytes before casting to data structures.

#### 6. Representative Code / Circuit Logic

```cpp
// Excerpt from: Abhyuday_DBW_2026/ESP32_C3/JBD_BMS_info_BT_to_Serial.cpp

std::vector<uint8_t> rxBuffer;

// Dynamic Fragment Reassembly Callback
void notifyCallback(NimBLERemoteCharacteristic* pChar, uint8_t* pData, size_t length, bool isNotify) {
  rxBuffer.insert(rxBuffer.end(), pData, pData + length);

  while (rxBuffer.size() >= 7) {
    // 1. Hunt for Frame Start Byte
    if (rxBuffer[0] != 0xDD) {
      rxBuffer.erase(rxBuffer.begin());
      continue;
    }

    uint8_t dataLen = rxBuffer[3];
    size_t totalExpectedLen = dataLen + 7; // Header(4) + Data(N) + Checksum(2) + Stop(1)

    // Wait until all fragments arrive
    if (rxBuffer.size() < totalExpectedLen) return; 

    // 2. Validate Stop Byte
    if (rxBuffer[totalExpectedLen - 1] == 0x77) {
      decodeBMSData(rxBuffer.data(), totalExpectedLen);
    }
    
    rxBuffer.erase(rxBuffer.begin(), rxBuffer.begin() + totalExpectedLen);
  }
}
```

---

### 5. The Linuxcan Kernel Header & USB Driver Binding Battle on Fedora 43

- **Category:** Architecture & Paradigm Shifts
- **Key Metrics / Impact:** Successfully built Kvaser kernel driver on cutting-edge Linux 7.0.8 kernel | Restored `can0` SocketCAN device binding | 0.00% packet loss during 500 kbps full-bus playback
- **Tech Stack & Hardware Involved:** Kvaser USBcan Light Interface, Fedora 43 (Kernel 7.0.8-100.fc43.x86_64), `dnf5`, Kvaser linuxcan SDK 5.51, SocketCAN

#### 1. The Situation & Setup
Bench testing and CAN bus reverse engineering (`DBW_2026_LOG/2026-05-16-Kvaser-Linuxcan-Fedora43.md`) required interfacing the host development workstation (Fedora 43 x86_64) with the vehicle's 500 kbps CAN bus using a hardware Kvaser USBcan Light adapter.

#### 2. The Anomaly & The Mistake (The Symptom)
1. **Compilation Failures:** Running `make` inside the extracted `linuxcan` driver folder failed with missing kernel build directory paths.
2. **Secure Boot Module Rejection:** `modprobe kvcommon` threw `could not insert 'kvcommon': Key was rejected by service`.
3. **The Ghost Interface:** After driver installation, `./listChannels` displayed the Kvaser hardware, but Linux SocketCAN tools (`ip link`, `candump`) showed zero available `can0` interfaces.

#### 3. Forensic Investigation (The Root Cause)
1. **Fedora 43 dnf5 and Header Layout:** Fedora uses generic `kernel-headers` rather than version-suffixed package names. Furthermore, the kernel build tree lives strictly at `/lib/modules/$(uname -r)/build`.
2. **UEFI Secure Boot MOK Policy:** The Linux 7.0 kernel enforced strict cryptographic signature checking on all out-of-tree kernel modules.
3. **USB Subsystem Driver Binding Conflict:** By default, the Linux USB subsystem automatically bound the Kvaser hardware to the legacy `leaf` driver instead of the SocketCAN-compatible `kvaser_usb` driver.

#### 4. The Engineering Breakthrough (The Fix)
The exact build and runtime unbind/bind pipeline was established (`DBW_2026_LOG/2026-05-16-Kvaser-Linuxcan-Fedora43.md`):
1. Compile explicitly targeting the active kernel headers:
   ```bash
   make KDIR=/lib/modules/$(uname -r)/build
   sudo make install && sudo depmod -a
   ```
2. Disable Secure Boot in BIOS/UEFI to allow unsigned kernel module loading.
3. Dynamic USB Device Driver Rebinding:
   ```bash
   # Identify USB device binding and rebind to SocketCAN driver
   sudo sh -c 'echo -n "1-2:1.0" > /sys/bus/usb/drivers/leaf/unbind'
   sudo sh -c 'echo -n "1-2:1.0" > /sys/bus/usb/drivers/kvaser_usb/bind'
   sudo modprobe can can_dev
   ```
4. Once rebound, `ip link set can0 type can bitrate 500000 && ip link set up can0` brought the physical automotive CAN interface online.

#### 5. The Core Engineering Lesson
Modern Linux kernel upgrades frequently alter module build paths and driver binding priorities. When a USB hardware interface appears in proprietary vendor utilities but fails to register in the operating system network stack, inspect `/sys/bus/usb/drivers/` for mismatched kernel module bindings.

---

### Summary of 2026 Repository Artifacts & Files

| Module / Script | Path | Core Responsibility |
|---|---|---|
| **Motor Node Architecture** | `DBW_2026_LOG/2026-05-14-Motor-Node-Architecture.md` | Hardware isolation log, 2N2222A transistor gain, ISO7721 CAN bridge |
| **BMS BLE Log** | `DBW_2026_LOG/2026-05-22-ESP32-BLE-Integration-24S-BMS.md` | NimBLE stream reassembly & 24S JBD telemetry reverse-engineering log |
| **Kvaser Linuxcan Log** | `DBW_2026_LOG/2026-05-16-Kvaser-Linuxcan-Fedora43.md` | Fedora 43 kernel compilation & USB driver unbind/bind forensics |
| **Final TBW Firmware** | `DBW_final_2026/ESP32_FLASH/TBW.cpp` | MCP4725 12-bit DAC throttle ECU with PCNT speed sensing and EMA |
| **Final BBW Firmware** | `DBW_final_2026/ESP32_FLASH/BBW.cpp` | Hydraulic pressure-mapped brake ECU with timeout watchdogs |
| **OTA FreeRTOS SBW** | `DBW_final_2026/OTA/SBW.cpp` | Multi-turn AS5600 steering ECU with hardware WDT, stall detection |
| **Hysteresis SBW** | `ESP32_Wroom/.../ESP32BangBangSBW.cpp` | Dual-threshold hysteresis (10°/5°) & scaled overshoot steering logic |
| **FlySky IBUS Bridge** | `ESP32_C3/FlySky_Remote.cpp` | 200ms failsafe radio-to-CAN gateway with burst transmission |
| **BNO08x IMU CAN** | `ESP32_C3/BNO08x_IMU_CAN.cpp` | Quaternion rotation vector acquisition and CAN broadcasting (0x12D) |
| **Automated Test Suite** | `dbw_CAN_test/dbw_test.py` | Dual-sequence CAN executor, CSV logger, and matplotlib visualizer |
| **ATV LVGL Dashboard** | `Dashboard Display/atv_dashboard.ino` | 800x480 RGB LCD dashboard with boot animations and dynamic LED arcs |
