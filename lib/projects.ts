import { ProjectData } from '@/types';

export const projects: ProjectData[] = [
  {
    id: 'can-firewall',
    title: 'CAN Firewall',
    tagline: 'Inline intrusion-prevention system for automotive CAN buses',
    period: 'Aug 2026 – ongoing',
    role: 'Lead developer · 71/107 commits',
    description: `An inline, hardware-isolated Intrusion Prevention System for automotive CAN buses on an STM32F446RE, protecting safety-critical ECUs (engine, brakes, steering) from spoofing and DoS attacks — a real gap in vehicles without CAN-layer authentication or encryption.

Designed Gate 1, a statistical policy engine doing ID allowlisting, directional traffic enforcement, DLC verification, and microsecond-resolution jitter/DoS detection using hardware timers. Designed Gate 2, an on-device Mahalanobis-distance anomaly detector, benchmarked against an Isolation Forest baseline and reduced from 4 to 2 features after empirical validation against HCRL attack captures.

Built a native C++ high-precision benchmarking engine for policy validation, a Flask + SocketIO + python-can attack-simulation dashboard with live traffic monitoring and injected spoofing/fuzzing/DoS attacks, and performed hardware bring-up on a custom CAN carrier board validated against a Kvaser USBcan Light. Writing the accompanying IEEE-format research paper.`,
    technologies: [
      'C/C++',
      'STM32 HAL',
      'CMSIS-DSP',
      'Python',
      'Flask',
      'SocketIO',
      'python-can',
      'LaTeX',
    ],
    achievements: [
      'Both detection gates run in 1,065 CPU cycles/frame (5.92 µs) — 3% of the 200 µs real-time deadline',
      '99.9% of RPM-spoofing and 99.0% of gear-spoofing attacks blocked',
      '88.5% of fuzzing attacks blocked at 99.0% legitimate throughput',
      'Optimized Gate 2 from 2,284 → 832 cycles (2.7x) via compiler tuning and feature reduction',
    ],
    metrics: [
      { label: 'Attack block rate', value: '99%+' },
      { label: 'Per-frame latency', value: '5.92µs' },
      { label: 'RT budget used', value: '3%' },
    ],
    links: { github: 'https://github.com/Reality373/CAN_Firewall' },
    tier: 'flagship',
  },
  {
    id: 'fiberopticcalc',
    title: 'FiberOpticCalc',
    tagline: 'Professional PON network design app — published on Google Play',
    period: 'Dec 2025 – present',
    role: 'Lead Android App Developer, AuraByte Studios · sole developer, 252 commits',
    description: `A native Android application for telecom engineers and field technicians to design and calculate optical power budgets for Passive Optical Networks, combining precision optical-loss math with live geospatial network mapping. Published on the Google Play Store, scaled to 5,000+ installs and 2,000+ active users.

Built a recursive optical power-budget calculator supporting a full PON component library (OLTs, splitters, ODFs, splices, ONTs) with user-overridable loss constants, a live map-based network designer (OSM/Google Maps) with GPS route-bending and a Haversine multi-segment distance engine, and an OTDR fault-locator simulator that traverses the network graph with cycle detection.

Engineered the UI in Jetpack Compose within an MVVM architecture following SOLID design principles, implemented Google Cloud serverless microservices as REST APIs for subscription validation and webhook processing, and built an Atomic Persistence engine to prevent data corruption and optimize memory/battery efficiency. Also shipped multi-identifier authentication and the full monetization stack: Play Billing subscriptions, a 5-tier coffee-support flow, real-time entitlement sync, and remote ad control via Firebase Remote Config.`,
    technologies: [
      'Kotlin',
      'Android Jetpack (MVVM)',
      'Firebase',
      'Google Cloud Platform',
      'Google Play Billing',
      'OSMDroid',
      'Google Maps SDK',
    ],
    achievements: [
      '252 commits over 8 months as sole engineer, from architecture to a live Play Store release',
      '5,000+ installs and 2,000+ active users on Google Play',
      'Recursive power-budget engine across a full PON component library',
      'Live GPS-based network designer with OTDR fault-locator simulation',
      'GCP serverless microservices for billing/entitlement, plus an Atomic Persistence engine',
    ],
    metrics: [
      { label: 'Installs', value: '5,000+' },
      { label: 'Active users', value: '2,000+' },
      { label: 'Commits', value: '252' },
    ],
    links: { github: 'https://github.com/Reality373/FiberOpticCalc' },
    tier: 'flagship',
  },
  {
    id: 'abhyuday-dbw',
    title: 'Abhyuday E-BAJA — Drive-by-Wire',
    tagline: 'Drive-by-wire & telemetry for an off-road racing vehicle',
    period: 'Jan 2025 – present · two seasons',
    role: 'Technical Lead & Department Head, Team Abhyuday Racing',
    description: `Led interdisciplinary R&D teams in an Agile environment to design a distributed, fault-tolerant 3-ECU drive-by-wire system (throttle, brake, steer-by-wire) for an autonomous off-road racing vehicle, built across two seasons.

Implemented steer-by-wire and throttle-by-wire ECU logic on FreeRTOS over CAN, replacing an earlier single-threaded design, and engineered a modular brake-by-wire linear actuator system with plug-and-play CAN and pressure-sensor integration that cut hardware costs by 50%. Optimized real-time sensor-actuator feedback loops on an NVIDIA Jetson Nano to resolve CAN bottlenecks, and wrote low-level sensor drivers — Hall-effect wheel speed, AS5600 magnetic encoders, BNO08x/MPU6886 IMU via direct I2C register access, and a FlySky IBUS-to-CAN bridge with failsafe scaling.

Built a real-time IMU/telemetry web dashboard streaming over WebSockets to a live 3D visualizer, integrated BLE-based BMS telemetry after reverse-engineering a JBD/Xiaoxiang BMS serial protocol, and authored a standalone engineering journal documenting hardware bring-up and root-cause debugging.`,
    technologies: [
      'C/C++ (Arduino/ESP-IDF)',
      'ESP32 (WROOM/C3/S3)',
      'FreeRTOS',
      'TWAI/CAN',
      'NVIDIA Jetson Nano',
      'Python',
      'BLE',
    ],
    achievements: [
      '1st Place, Autonomous Emergency Braking — National aBAJA 2026 (6.2m halt on a 6.0m target)',
      '1st Place, Manufacturing Excellence Award — National aBAJA 2026, for the modular DBW/actuator design',
      '1st Runner-Up, MATLAB Advanced Simulation — National aBAJA 2026, GPS point-to-point autonomous traversal',
      '1st Place, Adaptive Cruise Control — A-BAJA 2025, after an 8-hour STM32→ESP32 crisis migration',
      'Brake-by-wire actuator redesign cut hardware costs 50%',
    ],
    metrics: [
      { label: 'National awards', value: '4' },
      { label: 'Cost cut (BBW)', value: '50%' },
      { label: 'Seasons', value: '2' },
    ],
    links: { github: 'https://github.com/Reality373/Abhyuday_DBW_2026' },
    tier: 'flagship',
  },
  {
    id: 'cyo-image-search',
    title: 'CYO Image Search',
    tagline: 'Local-first semantic image search engine',
    period: 'Jan – Jun 2026',
    role: 'Sole developer · 41/41 commits',
    description: `A privacy-first, fully local semantic image search engine — "Cognitive Yield Orchestrator" — letting users search their personal photo library with natural-language queries, without any cloud upload.

Built a FastAPI backend with a SQLAlchemy-backed indexing database and a React + Vite + Tailwind v4 glassmorphism gallery UI. Integrated a multi-model AI vision pipeline: OpenAI CLIP for zero-shot classification, YOLOv8/RT-DETR for object detection, and EasyOCR for text extraction, unified into FAISS-backed vector search with tag-contradiction resolution logic to reconcile conflicting model outputs.

Designed directory-based indexing with a folder picker, host filesystem browsing, and real-time indexing status via a global Zustand store, containerized with Docker/Docker Compose including GPU-aware setup for NVIDIA CUDA.`,
    technologies: [
      'Python',
      'FastAPI',
      'PyTorch',
      'CLIP',
      'YOLOv8',
      'FAISS',
      'React',
      'Vite',
      'Docker',
    ],
    achievements: [
      'Multi-model vision pipeline unified into a single FAISS vector index',
      'Tag-contradiction resolution across conflicting model outputs',
      'Zero cloud dependency — fully local inference and storage',
      'GPU-aware Docker Compose setup for CUDA acceleration',
    ],
    metrics: [
      { label: 'Ownership', value: '100%' },
      { label: 'Models unified', value: '3' },
      { label: 'Cloud calls', value: 'Zero' },
    ],
    links: { github: 'https://github.com/Reality373/Cyo_Image_Search' },
    tier: 'flagship',
  },
  {
    id: 'suraksha360',
    title: 'Suraksha360',
    tagline: 'Cybersecurity monitoring dashboard + mobile companion app',
    period: 'Feb – Aug 2026',
    role: 'Core contributor · 20/38 commits',
    description: `A cybersecurity dashboard platform for SMBs providing device monitoring, threat detection, vulnerability tracking, and incident response, paired with a React Native companion app.

Built the mobile companion app including an Expo SDK 54 upgrade and dynamic map-circle scaling for device geolocation views, implemented live device geolocation end-to-end, and wrote a PowerShell "Advanced Security Auditor" payload script performing system security scans (AV/firewall state, autorun entries, AMSI providers) feeding the dashboard's risk scoring. Also implemented dark mode theming and the real-time alert-watching/demo-mode system.`,
    technologies: ['React 19', 'React Native', 'Expo', 'Leaflet', 'Supabase', 'PowerShell'],
    achievements: [
      'React Native/Expo companion app with live geolocation',
      'PowerShell system-security auditor feeding device risk scoring',
      'Real-time alert system with attack-simulation demo mode',
    ],
    links: { github: 'https://github.com/codesujeet/innovateyou' },
    tier: 'secondary',
  },
  {
    id: 'cottonx',
    title: 'CottonX',
    tagline: 'Multi-agent Web3 orchestration platform',
    period: 'Apr 2026 · Devclash Pune hackathon',
    role: 'Lead developer · 13/16 commits',
    description: `A multi-agent orchestration platform for managing autonomous Web3 agents — trading, contract deployment, NFT minting, social promotion — through natural-language chat, each agent holding its own on-chain wallet.

Built the core recursive multi-agent chat engine coordinating four specialized agents, wallet-management tooling (Coinbase CDP SDK, ethers.js) as modular handlers, and migrated the backend to GCP + Gemini + Firestore mid-hackathon. Deployed and verified smart contracts on Basescan as part of the live demo.`,
    technologies: ['TypeScript', 'Next.js', 'ethers.js', 'Coinbase CDP SDK', 'Gemini API', 'GCP'],
    achievements: [
      'Four-agent recursive chat orchestration engine',
      'Modular wallet/blockchain tooling usable by any agent',
      'Mid-hackathon backend migration to GCP + Gemini + Firestore',
      'Live smart-contract deployment verified on Basescan',
    ],
    links: { github: 'https://github.com/Reality373/CottonX' },
    tier: 'secondary',
  },
  {
    id: 'expert-advisors',
    title: 'Expert Advisors',
    tagline: 'Algorithmic trading systems for MetaTrader 5',
    period: 'Feb – Jun 2026',
    role: 'Primary developer · 9/15 commits',
    description: `Two custom algorithmic trading systems for MetaTrader 5, prototyped from TradingView Pine Script strategies into production MQL5: a Bollinger Band reversal/pullback EA with EMA-200 trend filtering and grid-based hedging recovery, and a moving-average breakout/pullback EA with a "sure-fire hedging" recovery grid.

Diagnosed and fixed critical grid-execution bugs (basket profit not triggering closes, grid chains breaking at fixed lot sizes), documented in a maintained bug-fix log.`,
    technologies: ['MQL5', 'Pine Script', 'MetaTrader 5'],
    achievements: [
      'Bollinger Band + EMA-200 reversal EA with hedging recovery grid',
      'Moving-average breakout EA with pending-order recovery grid',
      'Ported and validated strategy logic between Pine Script and MQL5',
    ],
    links: { github: 'https://github.com/Reality373/Expert_Advisors' },
    tier: 'secondary',
  },
  {
    id: 'chainpilot',
    title: 'ChainPilot',
    tagline: 'Autonomous on-chain agent platform',
    period: 'Apr 2026 · Devclash Pune hackathon',
    role: 'Contributor · 8/28 commits',
    description: `A platform for deploying natural-language-defined autonomous on-chain agents (e.g. "buy ETH if price drops 5%") with full explainability and user override, built on Next.js with a LangChain-powered orchestration backend.

Set up Firebase Authentication (OAuth) integration and initialized blockchain configuration (Sepolia testnet wiring), contributing to early architecture and documentation.`,
    technologies: ['Next.js', 'Firebase Auth', 'LangChain', 'Gemini 1.5 Flash', 'Solidity'],
    achievements: [
      'Firebase OAuth integration for the platform',
      'Sepolia testnet configuration and early architecture docs',
    ],
    links: { github: 'https://github.com/02-Shubham/DevClash_GoblinGang' },
    tier: 'secondary',
  },
  {
    id: 'floating-translator',
    title: 'Floating Translator',
    tagline: 'Zero-cost, fully offline on-screen translation tool',
    period: 'Mar 2026 · in progress',
    role: 'Sole developer · 3/3 commits',
    description: `A cross-platform "snapshot & overlay" translator that captures on-screen content, runs local OCR, and overlays a translation — designed to run 100% offline with no data leaving the device.

Authored the implementation plan and architecture, selecting Tesseract.js + Transformers.js with opus-mt ONNX models for a fully local WASM/WebGPU pipeline, and scaffolded the Chrome extension with a keyboard-triggered overlay workflow.`,
    technologies: ['TypeScript', 'Chrome Extensions API', 'Tesseract.js', 'Transformers.js (ONNX/WASM)'],
    achievements: [
      'Fully local OCR + translation pipeline — no cloud dependency',
      'Chrome extension scaffold with Alt+T triggered overlay',
    ],
    links: { github: 'https://github.com/Reality373/FloatingTranslator' },
    tier: 'secondary',
  },
  {
    id: 'portfolio',
    title: 'Portfolio Website',
    tagline: 'This site',
    period: 'May 2026 – present',
    role: 'Sole developer · 100%',
    description:
      'Personal portfolio built with Next.js, TypeScript, and Tailwind CSS — the site you\'re looking at.',
    technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
    achievements: [],
    links: { github: 'https://github.com/Reality373/Portfolio_saif' },
    tier: 'minor',
  },
];

export const OTHER_UTILITIES = [
  {
    name: 'CyberHexon',
    description:
      'PySide6 desktop GUI for secure, certified disk wiping (drive detection, wipe engine, wipe-completion certificates) targeting NIST/DoD-style sanitization workflows.',
  },
  {
    name: 'VulnScan',
    description:
      'Windows PowerShell system security auditor — OS/.NET fingerprinting, AMSI provider enumeration, AV/firewall inspection, autorun analysis — with disk-image test fixtures.',
  },
  {
    name: 'Email Validator',
    description:
      'Node.js/TypeScript CLI wrapping deep-email-validator for regex/MX/SMTP/disposable-address checks.',
  },
];
