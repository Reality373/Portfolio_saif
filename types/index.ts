export type ProjectTier = 'flagship' | 'secondary' | 'minor';

export interface ProjectMetric {
  label: string;
  value: string;
}

export type GalleryVariant = 'calc-screen' | 'map-screen' | 'architecture';

export interface GalleryItem {
  label: string;
  variant: GalleryVariant;
  imageSrc?: string;
}

export interface ProjectData {
  id: string;
  title: string;
  tagline: string;
  description: string;
  period: string;
  role: string;
  technologies: string[];
  achievements: string[];
  metrics?: ProjectMetric[];
  gallery?: GalleryItem[];
  links: {
    github?: string;
    live?: string;
    article?: string;
    playStore?: string;
  };
  tier: ProjectTier;
}

export interface SkillGroup {
  category: string;
  skills: string[];
}

export interface StatItem {
  label: string;
  value: string;
  suffix?: string;
}

export type StoryCategory =
  | 'Embedded & Crisis'
  | 'Performance & Security'
  | 'Solo Shipping'
  | 'Reverse Engineering'
  | 'AI & Web3';

export interface StoryTradeoff {
  option: string;
  pros: string;
  cons: string;
  selected?: boolean;
}

export interface StoryPhoto {
  url: string;
  caption: string;
  location?: string;
  timestamp?: string;
}

export interface Story {
  id: string;
  title: string;
  subtitle: string;
  category: StoryCategory;
  date: string;
  badge: string;
  summary: string;
  sceneSetting?: string;
  context: string;
  crisisOrChallenge: string;
  tradeoffs?: StoryTradeoff[];
  engineeringSolution: string;
  theThoughtProcess?: string;
  takeaway: string;
  photos?: StoryPhoto[];
  metrics: { label: string; value: string }[];
  tags: string[];
  relatedProjectId?: string;
  snippet?: {
    title: string;
    language: string;
    code: string;
  };
}
