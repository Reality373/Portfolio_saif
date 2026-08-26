export const COLORS = {
  bg: '#0A0A0F',
  surface: '#131318',
  border: '#26262E',
  textPrimary: '#F2F2F2',
  textMuted: '#8A8A96',
  amber: '#FF6B35',
  trace: '#4CC9F0',
};

export const FONTS = {
  display: 'Space Grotesk, sans-serif',
  sans: 'Inter, sans-serif',
  mono: 'JetBrains Mono, monospace',
};

export const ANIMATION_DURATION = {
  fast: 0.2,
  standard: 0.4,
  slow: 0.6,
};

export const SITE = {
  name: 'Saif Shikalgar',
  handle: 'reality373',
  role: 'Software & Embedded Systems Engineer',
  taglines: [
    'Embedded & Robotics',
    'Automotive Cybersecurity',
    'AI / Machine Learning',
    'Full-Stack Systems',
    'Robotics & Controls',
  ],
  pitch:
    'I build systems end to end — from microsecond-precision firmware on bare metal to production apps with real users. Recent work spans an automotive intrusion-prevention firewall, a published Android app, and a local-first AI image search engine.',
  email: '15974saif@gmail.com',
  github: 'https://github.com/Reality373',
  linkedin: 'https://linkedin.com/in/reality373',
  resumePath: '/resume.pdf',
};

export const STATS = [
  { label: 'Commits shipped', value: '520', suffix: '+' },
  { label: 'Public repositories', value: '22', suffix: '' },
  { label: 'Total App Installs', value: '5.73', suffix: 'K+' },
  { label: 'Active Devices / Users', value: '2.09', suffix: 'K+' },
];

export interface SkillCategory {
  category: string;
  badge: string;
  subtitle: string;
  skills: string[];
}

export const SKILLS: SkillCategory[] = [
  {
    category: 'Embedded Firmware & Hardware',
    badge: 'Real-Time Systems',
    subtitle: 'Microsecond-precision bare-metal firmware and RTOS driver architecture.',
    skills: [
      'STM32 (HAL / CMSIS)',
      'ESP32 / FreeRTOS',
      'Bare-Metal C / C++',
      'CAN Bus 2.0B / TWAI',
      'Direct Register Drivers',
      'Microsecond Latency (5.92µs)',
      'I2C / SPI / UART',
    ],
  },
  {
    category: 'Automotive & Embedded Security',
    badge: 'Vehicle Defense',
    subtitle: 'Hardware intrusion prevention, packet filtering and attack mitigation.',
    skills: [
      'Dual-Gate CAN IPS/IDS',
      'Mahalanobis Anomaly Engine',
      'ISO/SAE 21434 Concepts',
      'Jitter & Statistical Noise Filter',
      'RPM Spoof Deflection',
      'Penetration Testing',
      'PowerShell Security Auditing',
    ],
  },
  {
    category: 'Robotics, Autonomous & Controls',
    badge: 'National 1st Place',
    subtitle: 'Perception-to-actuation pipelines, closed-loop PID and battery telematics.',
    skills: [
      'Autonomous AEB Braking',
      'Closed-Loop PID Control',
      'Jetson Orin Perception',
      'AS5600 12-Bit Encoders',
      'Pneumatic Brake Actuation',
      '24S LiFePO4 BMS Telemetry',
      'BLE GATT Protocols',
    ],
  },
  {
    category: 'Android & Mobile Engineering',
    badge: 'Google Play Published',
    subtitle: 'Production mobile applications with offline storage and native SDKs.',
    skills: [
      'Kotlin & Android Jetpack',
      'Coroutines & Flow',
      'MVVM Architecture',
      'Play Billing SDK',
      'OpenStreetMap SDK',
      'Firebase Auth & Firestore',
      'FiberOpticCalc (Live App)',
    ],
  },
  {
    category: 'AI & Edge Intelligence',
    badge: 'Local-First AI',
    subtitle: 'Deep learning inference, vector embeddings and real-time computer vision.',
    skills: [
      'PyTorch & TorchVision',
      'OpenAI CLIP Multimodal',
      'Vector Similarity Search',
      'YOLOv8 Vision',
      'FastAPI Inference Server',
      'Zero-Cost Local AI',
    ],
  },
  {
    category: 'Full-Stack, Cloud & Web3',
    badge: 'Production Ready',
    subtitle: 'Scalable web platforms, microservices, containerization and smart contracts.',
    skills: [
      'Next.js 14 & React',
      'TypeScript & Tailwind CSS',
      'Node.js / Express',
      'Docker & GCP',
      'Solidity Smart Contracts',
      'Supabase & PostgreSQL',
    ],
  },
];
