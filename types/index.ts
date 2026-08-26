export type ProjectTier = 'flagship' | 'secondary' | 'minor';

export interface ProjectMetric {
  label: string;
  value: string;
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
  links: {
    github?: string;
    live?: string;
    article?: string;
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

export interface AnimationVariant {
  hidden: any;
  visible: any;
}
