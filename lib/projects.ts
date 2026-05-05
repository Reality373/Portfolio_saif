import { ProjectData } from '@/types';

export const projects: ProjectData[] = [
  {
    id: 'dbw',
    title: 'Drive-by-Wire',
    tagline: 'Autonomous Vehicle Control System',
    description: `Led design and implementation of a distributed 3-ECU fault-tolerant system for autonomous vehicle control. 
    
Executed crisis engineering to migrate from STM32 to ESP32 in 8 hours after critical failure. Optimized real-time sensor-actuator feedback loops on NVIDIA Jetson Nano. Engineered high-reliability CAN bus logic with hardware heartbeats and message prioritization.

Results: 1st Place in Adaptive Cruise Control, 3rd Place in AEB at Team Abhyuday Racing competition.`,
    technologies: [
      'C++',
      'ESP32',
      'STM32',
      'CAN Bus',
      'NVIDIA Jetson Nano',
      'Linux',
      'Real-time Systems',
    ],
    achievements: [
      '1st Place in Adaptive Cruise Control',
      '3rd Place in Autonomous Emergency Braking',
      'Distributed 3-ECU architecture',
      '8-hour crisis hardware migration',
      'Real-time sensor-actuator optimization',
    ],
    image: '/images/dbw.jpg',
    image_alt: 'Drive-by-Wire System Architecture',
    links: {
      github: 'https://github.com/Reality373',
    },
    featured: true,
  },
  {
    id: 'fiber',
    title: 'FiberOpticCalc',
    tagline: 'Professional FTTH Optical Power Budget Platform',
    description: `Developed and launched a professional FTTH (Fiber-to-the-Home) platform from concept to production. 
    
Scaled to 1.36K+ installs and 670+ active users with verified recurring yearly revenue. Designed full-stack architecture using MVVM and Jetpack Compose featuring a recursive engine for complex optical power budget calculations and path-loss modeling.

Implemented Atomic Persistence to prevent data corruption and a Schema-Aware Cloud Backup system via Google Drive REST API. Built a Multi-Engine Map system with OSM/Google Maps integration and a traversal-based OTDR Fault Locator algorithm to identify precise fiber break points.`,
    technologies: [
      'Kotlin',
      'Jetpack Compose',
      'MVVM',
      'Google Drive REST API',
      'OSM / Google Maps',
      'Android SDK',
      'Firebase',
    ],
    achievements: [
      '1.36K+ app installs',
      '670+ active users',
      'Verified recurring yearly revenue',
      'Recursive optical power budget calculations',
      'Multi-engine geospatial mapping',
      'Cloud backup system with schema migration',
    ],
    image: '/images/fiber.jpg',
    image_alt: 'FiberOpticCalc App Interface',
    links: {
      github: 'https://github.com/Reality373',
    },
    featured: true,
  },
];
