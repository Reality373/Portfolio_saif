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
    'Embedded Systems',
    'AI / Machine Learning',
    'Full-Stack Development',
    'Security Research',
  ],
  pitch:
    'I build systems end to end — from microsecond-precision firmware on bare metal to production apps with real users. Recent work spans an automotive intrusion-prevention firewall, a published Android app, and a local-first AI image search engine.',
  email: '15974saif@gmail.com',
  github: 'https://github.com/Reality373',
  linkedin: 'https://linkedin.com/in/reality373',
  resumePath: '/resume.pdf',
};

export const STATS = [
  { label: 'Commits shipped', value: '488', suffix: '+' },
  { label: 'Active repositories', value: '13', suffix: '' },
  { label: 'Published apps', value: '1', suffix: '' },
  { label: 'Attack-block rate (CAN IPS)', value: '99', suffix: '%+' },
];

export const SKILLS: { category: string; skills: string[] }[] = [
  {
    category: 'Embedded & IoT',
    skills: [
      'ESP32 / FreeRTOS',
      'STM32 (HAL / CMSIS)',
      'CAN Bus / TWAI',
      'Real-time sensor fusion',
      'BLE',
      'Register-level drivers',
    ],
  },
  {
    category: 'AI / Machine Learning',
    skills: [
      'PyTorch',
      'CLIP',
      'YOLOv8',
      'FAISS',
      'LangChain',
      'Gemini / OpenAI APIs',
    ],
  },
  {
    category: 'Frontend',
    skills: ['React', 'Next.js', 'Vite', 'Tailwind CSS', 'Framer Motion', 'Zustand'],
  },
  {
    category: 'Backend & Cloud',
    skills: ['Node.js / Express', 'FastAPI', 'Firebase', 'Supabase', 'Docker', 'GCP'],
  },
  {
    category: 'Mobile',
    skills: ['Kotlin / Jetpack', 'MVVM', 'React Native / Expo'],
  },
  {
    category: 'Blockchain',
    skills: ['Solidity', 'ethers.js', 'OpenZeppelin', 'Coinbase CDP SDK'],
  },
  {
    category: 'Security',
    skills: ['CAN-bus IDS/IPS design', 'Attack simulation', 'PowerShell auditing', 'OAuth / RLS'],
  },
];
