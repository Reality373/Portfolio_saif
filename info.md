# Saif Shikalgar (`Reality373`) — Master Engineering Context & Knowledge Base

This document serves as the single source of truth regarding Saif's background, engineering mindset, project technical facts, milestones, and personal reflections.

---

## 1. Core Engineering Identity & Mindset

### Core Philosophy
* **"Make it exist first, optimize it later"**:
  * Bias towards action and tangible functional reality over theoretical perfectionism.
  * In the first iteration (MVP), focus 100% on making the system work reliably in the real world under actual conditions (even if circuits are bulky and modular).
  * Once the functional baseline is proven on the track or in users' hands, systematically profile the bottlenecks, optimize the firmware, strip away unnecessary complexity, and refine the hardware packaging.
* **Pragmatic Simplicity vs. Academic Over-Engineering**:
  * Believes true engineering maturity is knowing what to remove rather than how much complexity to add.
  * (Example: Pruning 4D covariance math to 2D SIMD on STM32 when profiling revealed collinear features and self-inflicted CPU bottlenecks).
* **"No Magic in Hardware"**:
  * Hardware is just bytes on a wire, registers in silicon, and physics.
  * When vendors don't provide documentation or APIs, grab a multimeter, capture packets with Wireshark/Logic Analyzers, decode framing patterns (`0xDD...0x77`), and build custom drivers.
* **Defensive Software Craftsmanship**:
  * Deep respect for edge cases and field conditions (e.g., technicians in underground vaults with 4% battery, racing vehicles under severe EMI vibration).

---

## 2. Team Abhyuday Racing — aBAJA Drive-by-Wire (Two-Season Evolution)

### Season 1 (aBAJA 2025): The MVP Bring-Up
* **Context & Objective**: First time bringing up an autonomous drive-by-wire (DBW) vehicle from scratch. Hands were full getting all core physical actuators, sensors, and microcontrollers to communicate reliably.
* **Hardware & Circuits**: Discrete, functional modular boards and larger prototyping layouts focused on proving the end-to-end drive-by-wire concept.
* **The Phase 2 Evaluation Crisis**:
  * One week before the critical **Phase 2 DBW evaluation** (the qualifying round where DBW systems were formally inspected), an electrical transient during track testing fried the primary STM32 Nucleo ECU's 3.3V LDO.
  * With zero identical spare Nucleo boards available, Saif designed and soldered a new circuit overnight in an **8-hour sprint**, adapting an ESP32 to run the core CAN and control interfaces.
  * Tested the next day, cleared Phase 2 DBW evaluation, and qualified for the national finals.
* **Season 1 Milestone**: **1st Place in Adaptive Cruise Control (ACC)** at national aBAJA 2025 (Phase 3).

### Season 2 (aBAJA 2026): Optimization, FreeRTOS & Manufacturing Excellence
* **Context & Objective**: With the functional baseline proven, the team had time to refine the firmware, optimize real-time determinism, harden failsafes, and package custom modular hardware.
* **Real-Time Architecture**:
  * Implemented **FreeRTOS dual-core multitasking**: Pinned high-throughput CAN bus messaging to Core 0 and the 100 Hz PID steer/throttle control loop to Core 1, completely eliminating interrupt jitter and task starvation.
  * Built bare-metal direct I2C register drivers for **AS5600 12-bit magnetic angle encoders**, **MCP4725 DACs**, and **BNO08x/MPU6886 IMUs** without third-party library overhead.
* **Automotive Failsafe & Error Detection Architecture**:
  * **50 Hz CAN Heartbeat Loop** (20ms interval) broadcast across all distributed ECUs.
  * **10 Hz Telemetry & Sensor Scheduling** (100ms interval).
  * **Real-Time Node-Loss & Disconnect Detection**: Instant timeout trips if any CAN node stops broadcasting heartbeats.
  * **Sensor Plausibility & Disconnect Handling**: Dedicated visual fault indicators (LED dashboard) illuminate immediately if a sensor is disconnected or a CAN node goes missing, initiating a safe graceful transition.
* **Brake-by-Wire Hydraulic Actuation**:
  * High-force linear actuator mounted **parallel to the Tandem Master Cylinder (TMC)**.
  * Generates **40 bar** of hydraulic line pressure to lock calipers deterministically.
* **Season 2 Milestones**:
  * **1st Place, Autonomous Emergency Braking (AEB)** — National aBAJA 2026 (halted at **6.2m** at 30.0 km/h entry speed on a 6.0m benchmark).
  * **1st Place, Manufacturing Excellence Award** — National aBAJA 2026 (for modular DBW system design and ~50% cost cut).
  * **1st Runner-Up, MATLAB Advanced Simulation** — National aBAJA 2026 (autonomous GPS point traversal).

---

## 3. Flagship Technical Projects & Key Facts

### 3.1 Dual-Gate STM32 Hardware CAN Firewall & Anomaly IDS/IPS
* **Architecture**: Two-tier inline intrusion prevention system deployed on STM32F446RE (180 MHz ARM Cortex-M4 with FPU).
  * **Gate 1 (Deterministic Rule Filter)**: 50–70 ns lookup. Filters invalid DLC, forbidden ID injection, and unauthorized directional command flows.
  * **Gate 2 (Statistical Anomaly Engine)**: 2D Mahalanobis distance metric with CMSIS-DSP SIMD intrinsics.
* **Key Numbers & Benchmarks**:
  * Total frame processing latency: **5.92 µs (832 CPU cycles)** — uses only **3%** of the 200 µs real-time frame budget at 500 kbps.
  * Optimization: Down from 2,284 cycles (2.7x reduction) by pruning collinear features (entropy/jitter $\to$ 2D).
  * Attack mitigation: **99.9% RPM-spoofing blocked**, **99.0% gear-spoofing blocked**, **88.5% fuzzing blocked**, with zero false drops in baseline benign traffic.

### 3.2 FiberOpticCalc — Professional PON Network Design App (Android)
* **Status**: Live on Google Play Store (`com.reality.fiberopticcalc`).
* **Contributions**: Sole engineer end-to-end across **252 commits / 8+ months**.
* **Metrics**:
  * **5.73K+ Total Installs**, **2.09K+ Active Devices / Users**, **4.6★ Rating**.
  * **0.00% ANR Rate**, sub-1.3% crash rate on Android Vitals.
* **Architecture**:
  * Recursive optical power-budget calculator for PON splitters (1:2 to 1:128), couplers, ODFs, and splices.
  * Geospatial route designer on OSMDroid / Google Maps with draggable route-bending and Haversine distance engine.
  * OTDR fault-locator simulator with cycle detection.
  * **Atomic Write-Ahead File Storage**: Two-stage write to `.tmp` with CRC32 checksum and atomic `fsync()` rename, preventing corruption even if phone battery dies at 2% in remote vaults.
  * Play Billing v8 in-app subscriptions and "Buy Me a Coffee" micropayments with Firebase Cloud Functions.

### 3.3 CYO Image Search — Local-First Semantic Image Search Engine
* **Contributions**: Sole developer (41 commits).
* **Architecture**:
  * FastAPI backend with SQLAlchemy indexing database + React Vite Tailwind v4 frontend.
  * Multi-model vision pipeline: OpenAI CLIP (zero-shot classification), YOLOv8 (object detection), EasyOCR (text extraction).
  * Unified FAISS vector search with tag-contradiction resolution logic to resolve model conflicts.
  * Docker / Docker Compose containerization with GPU CUDA passthrough for Fedora.

### 3.4 CottonX — Multi-Agent Web3 Orchestration Platform
* **Context**: DevClash Pune Hackathon (Lead developer, 13/16 commits).
* **War Story**:
  * At 3:15 AM, cascading async promises caused recursive agent deadlocks.
  * Overcame sunk cost fallacy, deleted 350 lines of promise chains, and rebuilt the core as an event-driven Firestore message queue with Gemini 1.5 JSON schemas.
  * Successfully deployed and verified autonomous smart contracts on Base network during the live demo.

### 3.5 ZeroByte (formerly CyberHexon)
* **Description**: PySide6 desktop GUI for NIST/DoD-style certified secure disk wiping, drive detection, wipe engines, and cryptographic wipe-completion certificate generation.

### 3.6 Reverse Engineering 24S LiFePO4 BMS
* **Context**: Team had a 98.8V battery pack on a JBD/Xiaoxiang BMS with zero vendor documentation.
* **Solution**: Captured Android Bluetooth HCI snoop logs, analyzed raw hex in Wireshark, identified `0xDD...0x77` frame framing, and built a lightweight Linux BlueZ C++ daemon streaming 24 cell voltages and temperatures at sub-10ms latency into the Jetson Orin compute node.

---

## 4. Summary of National Awards & Achievements

1. **1st Place, Autonomous Emergency Braking (AEB)** — National aBAJA 2026
2. **1st Place, Manufacturing Excellence Award** — National aBAJA 2026
3. **1st Place, Adaptive Cruise Control (ACC)** — National aBAJA 2025
4. **1st Runner-Up, MATLAB Advanced Simulation** — National aBAJA 2026
5. **Google Play Store Published App** — 5.73K+ Installs, 4.6★
6. **Lead Developer, CottonX & ChainPilot** — DevClash Pune Hackathon
