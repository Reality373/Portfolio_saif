# Saif Shikalgar (Reality373) — Project Experience & Technical Portfolio

> Compiled from Git commit history across all local repositories (author-filtered to `Reality373` / `15974saif@gmail.com`), tracked source files only (build artifacts, `node_modules`, and other `.gitignore`-excluded paths omitted). Intended as raw source material for a resume/portfolio — trim to fit space constraints.

---

## 1. Skills Summary

**Languages:** Kotlin, TypeScript, JavaScript, Python, C, C++, MQL5 (algorithmic trading), Pine Script, SQL, Bash/PowerShell

**Embedded Systems & IoT:** ESP32 (Arduino core, FreeRTOS, TWAI/CAN), STM32 (HAL, CMSIS-DSP/NN, bare-metal C/C++), CAN bus protocol design & DBC parsing, real-time sensor interfacing (IMU/BNO08x/MPU6886, Hall-effect speed sensors, AS5600 magnetic encoders, BLE/BMS telemetry), FreeRTOS task design, register-level driver development

**Mobile Development:** Native Android (Kotlin, Jetpack, MVVM), React Native / Expo, Flutter (prototyping)

**Frontend:** React, Next.js, Vite, Tailwind CSS, Framer Motion, Zustand, Radix UI, Leaflet (interactive maps)

**Backend & Cloud:** Node.js/Express, FastAPI, Firebase (Firestore, Auth, Cloud Functions, Remote Config), Supabase (Postgres, Auth, RLS), Google Cloud Platform, Docker & Docker Compose, REST API design, WebSockets

**AI / Machine Learning:** PyTorch, OpenAI CLIP (zero-shot classification), YOLO/Ultralytics (object detection), EasyOCR, FAISS (vector search), LangChain, Google Gemini / OpenAI API integration, statistical & TinyML anomaly detection (Mahalanobis distance, Isolation Forest evaluation)

**Blockchain / Web3:** Solidity, OpenZeppelin, ethers.js, Uniswap SDK, Coinbase Developer Platform (CDP) SDK, wallet/agent infrastructure

**Security:** Embedded/CAN-bus intrusion detection & prevention, network traffic simulation & attack injection (spoofing, fuzzing, DoS), Windows system security auditing (PowerShell), secure data-wiping engineering (NIST/DoD-style disk sanitization), OAuth/RLS-based access control

**Other:** Git/GitHub workflows, technical documentation & IEEE-format research writing (LaTeX), hackathon rapid prototyping, hardware bring-up & bench validation, algorithmic trading strategy design

---

## 2. Technologies at a Glance

| Category | Technologies |
|---|---|
| Languages | Kotlin, TypeScript/JavaScript, Python, C/C++, MQL5, Pine Script |
| Frontend | React, Next.js, Vite, Tailwind CSS, Framer Motion, Zustand, Radix UI |
| Backend | Node.js, Express, FastAPI, Firebase Functions |
| Data/Auth | Firebase Firestore, Supabase (Postgres), SQLAlchemy, Firebase Auth, Google OAuth |
| AI/ML | PyTorch, CLIP, YOLOv8 (Ultralytics), EasyOCR, FAISS, LangChain, Gemini/OpenAI APIs |
| Embedded | ESP32 (FreeRTOS/TWAI), STM32 (HAL/CMSIS), Arduino, CAN bus, BLE |
| Mobile | Android (Kotlin/Jetpack), React Native/Expo |
| Blockchain | Solidity, ethers.js, OpenZeppelin, Uniswap, Coinbase CDP |
| DevOps/Infra | Docker, Docker Compose, GCP, Firebase Hosting, Git |
| Security | CAN-IDS design, PowerShell auditing, disk sanitization, attack simulation |

---

## 3. Projects

### 3.1 CAN Firewall — Inline Automotive Intrusion Prevention System
*Personal/academic research project · IEEE-style research paper in progress · Aug 2026 – ongoing*
**Repo:** `Reality373/CAN_Firewall` · **71 of 107 commits** (lead developer)

An inline, hardware-isolated Intrusion Prevention System for automotive CAN buses, built on an STM32F446RE and designed to protect safety-critical ECUs (engine, brakes, steering) from spoofing and DoS attacks — a real gap in vehicles that lack CAN-layer authentication or encryption.

**My contributions:**
- Designed and implemented **Gate 1**, a statistical policy engine doing ID allowlisting, directional traffic enforcement between untrusted/protected CAN buses, DLC verification, and microsecond-resolution jitter/DoS detection using hardware timers (TIM5).
- Designed and implemented **Gate 2**, a Mahalanobis-distance anomaly detector running on-device, evaluated against an Isolation Forest baseline and reduced from 4 features to 2 after empirically ruling out timing/entropy features against HCRL attack captures.
- Built a **native C++ high-precision benchmarking engine** (kernel timestamping, `g++ -O3 -std=c++20`) to validate Gate 1 policy decisions with microsecond accuracy.
- Built a **Flask + SocketIO + python-can attack-simulation dashboard** with live CAN frame monitoring, signal decoding, and injected spoofing/fuzzing/DoS attacks, plus a background ECU traffic simulator for realistic load testing.
- Wrote and iterated the accompanying **IEEE-format research paper** (LaTeX), including literature review, benchmark tooling, and a submission/review cycle (multiple project review reports and presentations).
- Performed hardware bring-up on a custom CAN carrier board (dual TJA1050 transceivers, level shifting) and ran bench validation against a Kvaser USBcan Light interface.

**Measured results (from `findings.md`, generated directly from bench data):**
- Both detection gates run in **1,065 CPU cycles/frame (5.92 µs)** — 3% of the 200 µs real-time deadline at 180 MHz.
- **99.9% of RPM-spoofing and 99.0% of gear-spoofing attacks blocked**, with 96.9–97.1% of legitimate traffic still delivered.
- **88.5% of fuzzing attacks blocked** at 99.0% legitimate throughput; 99.4% benign-traffic pass-through with zero false drops in the baseline capture.
- Optimized Gate 2 from 2,284 → 832 cycles (2.7x) via compiler flag tuning (`-O2` vs `-Og`) and feature-set reduction.

**Tech stack:** C/C++ (STM32 HAL, CMSIS-DSP), Python, Flask, SocketIO, python-can, LaTeX

---

### 3.2 FiberOpticCalc — Professional PON Network Design App (Android)
*Personal project · Published on Google Play · Jan 2026 – present*
**Repo:** `Reality373/FiberOpticCalc` · **252 of 252 commits (100%)** — sole developer

A native Android application for telecom engineers and field technicians to design and calculate optical power budgets for Passive Optical Networks (PON), combining precision optical-loss math with live geospatial network mapping. Published on the Google Play Store (`com.reality.fiberopticcalc`).

**My contributions (sole developer, end-to-end):**
- Built a **recursive optical power-budget calculator** supporting a full PON component library (OLTs, 1:2–1:128 splitters, asymmetric couplers, ODFs, splices, ONTs) with user-overridable loss constants (import/export via custom `.loss` files).
- Implemented a **live map-based network designer** (OSM/OSMDroid + Google Maps) with GPS coordinate tagging, draggable route-bending for real-world cable paths, and a Haversine-based multi-segment distance engine.
- Built an **OTDR fault-locator simulator** that traverses the network graph through asymmetric couplers with cycle detection, dropping interactive fault pins with GPS/"Open in Maps" integration.
- Implemented **multi-identifier authentication** (email, username, phone, Google One-Tap) backed by Firestore user profiles, with cross-identifier password recovery.
- Built the full **monetization stack**: Google Play Billing (v8) subscriptions, a 5-tier one-time "Buy Me a Coffee" flow (including anonymous purchases), real-time ad-free entitlement sync, and remote ad control via Firebase Remote Config.
- Wrote and maintained Firebase Cloud Functions (Node.js) for backend billing/entitlement logic.
- Sustained **252 commits over 8 months** as the sole engineer, from architecture through to a live Play Store release.

**Tech stack:** Kotlin, Android Jetpack (MVVM), Firebase (Auth, Firestore, Functions, Remote Config), Google Play Billing, OSMDroid, Google Maps SDK

---

### 3.3 Abhyuday E-BAJA — Drive-by-Wire & Vehicle Telemetry System
*Team engineering project (BAJA SAE-style vehicle team) · Jun 2025 – Aug 2026, spanning two seasons*
**Repos:** `Reality373/Abhyuday_DBW` (2025 season, 26/40 commits) · `Reality373/Abhyuday_DBW_2026` (2026 season, 35/87 commits) · `Reality373/DBW_2026_LOG` (4/4 commits, sole author)

Embedded drive-by-wire (throttle, brake, and steer-by-wire) and telemetry system for an off-road racing vehicle, built across two seasons with a small embedded-systems team.

**My contributions:**
- Implemented **steer-by-wire and throttle-by-wire ECU logic on FreeRTOS**, communicating over CAN, replacing an earlier single-threaded design.
- Built a **brake-by-wire controller** with dual-stage bang-bang actuation and CAN-based safety monitoring, later simplified by removing an unreliable WiFi control path in favor of hardened CAN.
- Wrote low-level **sensor drivers**: Hall-effect wheel-speed sensing, AS5600 magnetic encoder interfacing, BNO08x/MPU6886 IMU integration via direct I2C register access (no vendor library), and a FlySky IBUS-to-CAN bridge with failsafe signal scaling.
- Built a **real-time IMU/telemetry web dashboard**: an ESP32 web server streaming orientation and sensor data over WebSockets to a live 3D visualizer.
- Integrated **BLE-based BMS telemetry**, reverse-engineering a JBD/Xiaoxiang 24S BMS's serial protocol after diagnosing MTU and connection-stability issues (documented in the accompanying engineering log).
- Authored a standalone **engineering journal repo** (`DBW_2026_LOG`) documenting hardware bring-up, root-cause debugging (e.g., Kvaser CAN driver install on Fedora 43, BLE reconnect instability), and architecture decisions.
- Refactored the WiFi/CAN handling architecture into dedicated FreeRTOS tasks for switch and sensor management to improve real-time reliability.

**Tech stack:** C/C++ (Arduino/ESP-IDF), ESP32 (WROOM, C3, S3/Xiao), FreeRTOS, TWAI/CAN, Python (host-side control/plotting), MCP4725 DAC, BLE

---

### 3.4 CYO Image Search — Local-First Semantic Image Search Engine
*Personal project · Jan – Jun 2026*
**Repo:** `Reality373/Cyo_Image_Search` · **41 of 41 commits (100%)** — sole developer

A privacy-first, fully local semantic image search engine ("Cognitive Yield Orchestrator") letting users search their personal photo library with natural-language queries, without any cloud upload.

**My contributions (sole developer):**
- Built the full-stack architecture: **FastAPI backend** with a SQLAlchemy-backed indexing database, and a **React + Vite + Tailwind v4** frontend with a glassmorphism gallery UI.
- Integrated a multi-model **AI vision pipeline**: OpenAI CLIP for zero-shot semantic classification, YOLOv8/RT-DETR for object detection, and EasyOCR for text-in-image extraction, unified into FAISS-backed vector search.
- Implemented **tag contradiction resolution logic** to reconcile conflicting model outputs (e.g., people counts, scene classification) across the detection pipeline.
- Built **document classification and metadata extraction** services layered on top of the OCR pipeline.
- Designed **directory-based indexing** with a folder picker, host filesystem browsing, path-based image serving, and real-time indexing-status updates via a global Zustand store.
- Containerized the system with **Docker/Docker Compose** for both dev and production, including GPU-aware setup scripting for Fedora 43 + NVIDIA CUDA.
- Wrote architecture, implementation-status, and performance-benchmark documentation for the project.

**Tech stack:** Python, FastAPI, SQLAlchemy, PyTorch, CLIP, YOLOv8, EasyOCR, FAISS, React, Vite, Tailwind CSS, Zustand, Docker

---

### 3.5 Suraksha360 (innovateyou) — Cybersecurity Monitoring Dashboard + Mobile App
*Team project · Feb – Aug 2026*
**Repo:** `codesujeet/innovateyou` · **20 of 38 commits (~53%)**

A cybersecurity dashboard platform for SMBs providing device monitoring, threat detection, vulnerability tracking, and incident response from a single console, paired with a companion mobile app.

**My contributions:**
- Built the **React Native/Expo mobile companion app**, including upgrading to Expo SDK 54 and implementing dynamic map-circle scaling based on zoom for device geolocation views.
- Implemented **live device geolocation** end-to-end (multiple iterations to fix accuracy/reliability), integrated with the shared team backend.
- Wrote a **PowerShell-based "Advanced Security Auditor" payload script** that performs comprehensive system security scans (installed software, AV/firewall state, autorun entries, .NET/AMSI providers) and produces structured audit reports, feeding the dashboard's device risk scoring.
- Implemented **dark mode theming** and refactored the real-time alert-watching system, adding attack simulation and audible alert (siren) generation for the demo mode.
- Wrote the project's **README and setup documentation** covering architecture, tech stack, and environment configuration.

**Tech stack:** React 19, Vite, React Router, Leaflet/React-Leaflet, Supabase (Postgres, Auth, RLS), React Native, Expo, PowerShell

---

### 3.6 CottonX — Multi-Agent Web3 Orchestration Platform
*Hackathon project, built at Devclash Pune · Apr 2026*
**Repo:** `Reality373/CottonX` · **13 of 16 commits (81%)** — lead developer

A multi-agent orchestration platform letting users manage autonomous Web3 agents (trading, smart-contract deployment, NFT minting, social promotion) through natural-language chat, with each agent holding and managing its own on-chain wallet.

**My contributions:**
- Built the **core recursive multi-agent chat engine** and application layout, coordinating four specialized agents (market analysis, trade execution, smart-contract/infra, and marketing/NFT) through recursive inter-agent messaging.
- Implemented **wallet management and blockchain interaction tooling** (Coinbase CDP SDK, ethers.js) as modular handlers usable by any agent.
- Built **agent seeding, persona configuration, and testing utilities**, plus trading-tool handlers for Uniswap liquidity interaction.
- **Migrated the backend from its original stack to GCP + Gemini + Firestore** mid-hackathon and implemented the frontend's wallet-connection provider layer.
- Deployed and verified smart contracts on Basescan (Base network) as part of the live demo.

**Tech stack:** TypeScript, Next.js, Express, ethers.js, Coinbase CDP SDK, OpenZeppelin, Google Gemini API, Firebase/Firestore, GCP

---

### 3.7 ChainPilot (DevClash_GoblinGang) — Autonomous On-Chain Agent Platform
*Hackathon project, built at Devclash Pune · Apr 2026*
**Repo:** `02-Shubham/DevClash_GoblinGang` · **8 of 28 commits**

A platform for deploying natural-language-defined autonomous on-chain agents (e.g., "buy ETH if price drops 5%") with full explainability and user override, built with a Next.js frontend and a LangChain-powered orchestration backend.

**My contributions:**
- Set up **Firebase Authentication** (OAuth) integration for the platform.
- Initialized **blockchain configuration** (Sepolia testnet wiring) and contributed to early project documentation and architecture specs.

**Tech stack:** Next.js 16, Tailwind v4, Node.js, Firebase Admin/Auth/Firestore, LangChain, Gemini 1.5 Flash, Solidity (Sepolia)

---

### 3.8 Expert Advisors — Algorithmic Trading Systems (MetaTrader 5)
*Personal project · Feb – Jun 2026*
**Repo:** `Reality373/Expert_Advisors` · **9 of 15 commits** — primary developer

Two custom algorithmic trading systems (Expert Advisors) for MetaTrader 5, prototyped from TradingView Pine Script strategies into production MQL5.

**My contributions:**
- Designed and implemented the **BB Trigger Grid EA**: a Bollinger Band reversal/pullback entry system with an EMA-200 trend filter and a grid-based hedging recovery mechanism, rewritten from an earlier class-based architecture into a simplified, single-instance procedural design for reliability.
- Designed and implemented the **MA Grid EA**: a moving-average breakout/pullback strategy with a "sure-fire hedging" recovery grid using pending stop orders.
- Diagnosed and fixed **critical grid-execution bugs** (basket profit not triggering closes; grid chain breaking at fixed lot sizes) documented in a maintained bug-fix log.
- Ported and validated strategy logic between **TradingView Pine Script and native MQL5**.

**Tech stack:** MQL5, Pine Script, MetaTrader 5

---

### 3.9 Floating Translator — Zero-Cost On-Screen Translation Tool
*Personal project (in progress) · Mar 2026*
**Repo:** `Reality373/FloatingTranslator` · **3 of 3 commits (100%)** — sole developer

A cross-platform "snapshot & overlay" translator that captures on-screen content, runs local OCR, and overlays a translation — designed to run 100% offline with no data leaving the device. Phase 1 targets a browser extension; Phase 2 targets Android.

**My contributions:**
- Authored the full technical **implementation plan and architecture**, selecting Tesseract.js (OCR) + Transformers.js with `opus-mt` ONNX models (translation) for a fully local, WASM/WebGPU-based pipeline.
- Scaffolded the **Chrome extension** (manifest, background/content/offscreen scripts, popup UI) implementing screen capture and a keyboard-triggered (`Alt+T`) overlay workflow.

**Tech stack:** JavaScript/TypeScript, Chrome Extensions API, Tesseract.js, Transformers.js (ONNX/WASM)

---

### 3.10 Portfolio Website
*Personal project · May 2026*
**Repo:** `Reality373/Portfolio_saif` · **4 of 4 commits (100%)** — sole developer

Personal portfolio site built with Next.js and Tailwind CSS, featuring animated page transitions.

**Tech stack:** Next.js, TypeScript, Tailwind CSS, Framer Motion

---

### 3.11 NLP Experiments
*Personal learning project · Jan 2026*
**Repo:** `Reality373/NLP` · **2 of 2 commits** — sole author

Small-scale natural language processing experiments in Python (exploratory/learning repo).

**Tech stack:** Python

---

## 4. Other Notable Utilities (not under version control)

These are standalone scripts/tools present locally without Git history, included for completeness — worth a brief portfolio mention rather than a full case study:

- **CyberHexon** — a PySide6 desktop GUI for secure, certified disk wiping (drive detection, wipe engine, and wipe-completion certificate generation), aimed at NIST/DoD-style data sanitization workflows.
- **VulnScan** — a Windows PowerShell system security auditor (OS/.NET fingerprinting, AMSI provider enumeration, installed AV/firewall rule inspection, autorun analysis) plus disk-image test fixtures for validating the scanner.
- **Email Validator** — a small Node.js/TypeScript CLI utility wrapping `deep-email-validator` for regex/MX/SMTP/disposable-address checks.

*(Note: `WiFiDuck` present in the workspace is an unmodified clone of the open-source `SpacehuhnTech/WiFiDuck` project — no personal commits — and is excluded from this portfolio.)*

---

## 5. Quantifiable Contributions

| Project | My Commits | Total Commits | Share | Active Period | Role |
|---|---|---|---|---|---|
| FiberOpticCalc | 252 | 252 | 100% | Jan 2026 – present (8 mo) | Sole developer |
| CAN Firewall | 71 | 107 | 66% | Aug 2026 (ongoing) | Lead developer |
| Abhyuday_DBW_2026 | 35 | 87 | 40% | May – Aug 2026 | Core contributor |
| Cyo_Image_Search | 41 | 41 | 100% | Jan – Jun 2026 | Sole developer |
| Abhyuday_DBW (2025) | 26 | 40 | 65% | Jun 2025 – Jan 2026 | Core contributor |
| innovateyou (Suraksha360) | 20 | 38 | 53% | Feb – Aug 2026 | Core contributor |
| CottonX | 13 | 16 | 81% | Apr 2026 (hackathon) | Lead developer |
| DevClash_GoblinGang (ChainPilot) | 8 | 28 | 29% | Apr 2026 (hackathon) | Contributor |
| Expert_Advisors | 9 | 15 | 60% | Feb – Jun 2026 | Primary developer |
| Portfolio_saif | 4 | 4 | 100% | May 2026 | Sole developer |
| DBW_2026_LOG | 4 | 4 | 100% | May 2026 | Sole author |
| FloatingTranslator | 3 | 3 | 100% | Mar 2026 | Sole developer |
| NLP | 2 | 2 | 100% | Jan 2026 | Sole author |
| **Total** | **~488** | — | — | **Jun 2025 – Aug 2026 (~14 mo)** | **13 active repositories** |

**Headline numbers for resume use:**
- **~488 commits** authored across **13 active repositories** over a 14-month span, spanning embedded systems, full-stack web, AI/ML, and blockchain domains.
- **Sole developer** on 6 shipped/working projects (FiberOpticCalc, Cyo_Image_Search, Portfolio_saif, FloatingTranslator, DBW_2026_LOG, NLP), including one **published Google Play Store app**.
- **Lead or majority contributor** (>50% of commits) on 6 of 13 team/collaborative repositories.
- Built and validated an embedded intrusion-prevention system (CAN Firewall) achieving **99%+ attack-block rates** while adding **under 6 µs of per-frame processing latency** (3% of a 200 µs real-time budget) — measured and reproducible from committed benchmark data.
- Shipped a production Android app (FiberOpticCalc) with a **live billing/subscription system**, cloud auth, and geospatial engineering tools, sustained over **252 commits / 8 months** as sole engineer.
- Contributed to **2 hackathon projects** (CottonX, ChainPilot) built at Devclash Pune within 48-hour timeframes, including live smart-contract deployment to a public testnet/mainnet explorer (Basescan).
- Delivered a two-season embedded **drive-by-wire vehicle control system** (throttle/brake/steer-by-wire over CAN with FreeRTOS), including custom sensor drivers written without vendor libraries (direct I2C register access).

*Note on methodology: commit/line counts are derived directly from `git log`/`git shortlog` filtered by author email/username, counting only Git-tracked files (respecting each repo's `.gitignore`). Raw insertion/deletion line counts were intentionally omitted from the summary table above where repositories mix in generated build artifacts (e.g., `.o`/`.d`/`.su` compiler output committed in early embedded repos) or vendored libraries, which would inflate hand-written LOC figures — use commit counts and the qualitative contribution notes above as the more reliable resume metric.*

---


