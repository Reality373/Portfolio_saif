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
  | 'Architecture & KMP'
  | 'Defensive Engineering'
  | 'Reverse Engineering'
  | 'AI & Web3';

export interface StorySection {
  heading?: string;
  content: string;
  callout?: string;
  type?: 'text' | 'mistake' | 'breakthrough' | 'lesson';
}

export interface StoryPhoto {
  caption: string;
  location?: string;
  timestamp?: string;
  url?: string;
}

export interface Story {
  id: string;
  title: string;
  subtitle: string;
  category: StoryCategory;
  date: string;
  readTime: string;
  badge?: string;
  summary: string;
  storyType?: 'paddock-log' | 'reflection' | 'deep-dive' | 'war-story';
  theMistake?: string;
  theLesson: string;
  sections: StorySection[];
  metrics?: { label: string; value: string }[];
  tags: string[];
  photo?: StoryPhoto;
  relatedProjectId?: string;
  snippet?: {
    title: string;
    language: string;
    code: string;
  };
}
