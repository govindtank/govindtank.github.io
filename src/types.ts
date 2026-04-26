export interface Experience {
  company: string;
  role: string;
  period: string;
  location: string;
  achievements: string[];
}

export interface Skill {
  category: string;
  items: string[];
}

export interface Project {
  title: string;
  description: string;
  tags: string[];
  link?: string;
  image?: string;
}

export interface BlogPost {
  title: string;
  excerpt: string;
  date: string;
  tag: string;
  slug: string;
}

export interface Testimonial {
  name: string;
  role: string;
  content: string;
  avatar?: string;
}
