export type ThemeMode = 'cyber' | 'impeller' | 'matrix';

export interface Experience {
  id?: string;
  company: string;
  role: string;
  period: string;
  location: string;
  badge?: string;
  achievements?: string[];
  highlights?: string[];
  stack?: string[];
}

export interface Skill {
  category: string;
  items: string[];
}

export interface Project {
  id?: string;
  title: string;
  subtitle?: string;
  category?: string;
  description: string;
  tags: string[];
  link?: string;
  playStoreLink?: string;
  githubLink?: string;
  image?: string;
  iconUrl?: string;
  accentColor?: string;
  badge?: string;
  metrics?: { label: string; value: string }[];
  codeSnippet?: string;
}

export interface PackageItem {
  name: string;
  category: string;
  description: string;
  accent?: string;
  pubUrl?: string;
  repoUrl?: string;
  downloads?: string;
}

export interface BlogPost {
  title: string;
  excerpt: string;
  date: string;
  tag: string;
  slug: string;
  content?: string;
  coverImage?: string;
  readTime?: number;
  tags?: string[];
}

export interface Testimonial {
  name: string;
  role: string;
  content: string;
  avatar?: string;
}
