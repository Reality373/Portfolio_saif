export interface ProjectData {
  id: string;
  title: string;
  tagline: string;
  description: string;
  technologies: string[];
  achievements: string[];
  image?: string;
  image_alt?: string;
  links: {
    github?: string;
    live?: string;
    article?: string;
  };
  featured: boolean;
}

export interface AnimationVariant {
  hidden: any;
  visible: any;
}
