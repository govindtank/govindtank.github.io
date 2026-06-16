import type { BlogPost } from './types';
import parseFrontmatter from './lib/parseFrontmatter';

// Eagerly load all markdown files at build time — extracts only YAML frontmatter
// for the blog listing. Content is NOT loaded here (lazy-loaded in detail components).
// This eliminates the need for a separate index.json metadata file — the .md file
// is the single source of truth for both metadata AND content.
const rawEagerModules = import.meta.glob('./content/blog/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

export const BLOG_POSTS: BlogPost[] = Object.entries(rawEagerModules)
  .map(([path, raw]) => {
    const { data } = parseFrontmatter(raw as string);
    const slug = path.replace('./content/blog/', '').replace('.md', '');
    const tags = Array.isArray(data.tags) && (data.tags as string[]).length > 0
      ? (data.tags as string[])
      : [(data.tag as string) || (data.category as string) || ''].filter(Boolean);
    return {
      slug,
      title: (data.title as string) || '',
      date: (data.date as string) || '',
      excerpt: (data.excerpt as string) || '',
      tag: tags[0] || '',
      tags,
      content: '', // NOT loaded here — lazy-loaded by BlogDetail/BlogDetailModal
      coverImage: (data.coverImage as string) || '',
      readTime: (data.readTime as number) || Math.ceil(((data.excerpt as string) || '').split(' ').length / 200) || 4,
    };
  })
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
  image: string;
}

export interface Testimonial {
  name: string;
  role: string;
  content: string;
}

export const EXPERIENCES: Experience[] = [
  {
    company: "Rysun Labs Pvt. Ltd.",
    role: "Senior Software Developer L2",
    period: "Nov 2025 – Present",
    location: "Ahmedabad, India",
    achievements: [
      "Directed the complete overhaul of the 'BAPS Prakash' application (50k+ users), engineering a secure audio streaming engine using AWS CloudFront Signed Cookies.",
      "Integrated audio_service to manage complex background tasks, lock-screen controls, and Android Auto compatibility.",
      "Architected high-concurrency RESTful APIs using Node.js and TypeScript for an internal HCP ERP system."
    ]
  },
  {
    company: "Rysun Labs Pvt. Ltd.",
    role: "Senior Software Developer / Project Owner",
    period: "Apr 2022 – Oct 2025",
    location: "Ahmedabad, India",
    achievements: [
      "Spearheaded 'Akshar Amrutam' development, scaling it to 100,000+ downloads with 99.95% crash-free session rate.",
      "Utilized Flutter Bloc to manage complex application states, ensuring 60fps performance across fragmented devices.",
      "Engineered Android Auto companion app for seamless media control and content discovery.",
      "Built 'Smartindia/Autozon' IoT application, implementing real-time MQTT communication between mobile and hardware."
    ]
  },
  {
    company: "Phycom Corporations",
    role: "Software Engineer - Android",
    period: "Apr 2021 – Mar 2022",
    location: "Ahmedabad, India",
    achievements: [
      "Engineered robust background services for 'La Crosse View', ensuring reliable hardware data synchronization.",
      "Reduced application startup time by 30% and memory footprint by 20% through aggressive code profiling.",
      "Refactored legacy Java codebases to Kotlin, reducing NullPointerExceptions by 95%."
    ]
  },
  {
    company: "Micro App Solutions",
    role: "Remote Android Developer",
    period: "Aug 2017 – Dec 2019",
    location: "Surat, India",
    achievements: [
      "Developed 'Fastrrr-Floating Apps' and 'Water Reminder' with complex overlay window permissions.",
      "Built 'OfferzZone', a hyper-local marketplace utilizing Geofencing APIs for precise location-based notifications."
    ]
  },
];

export const SKILLS: Skill[] = [
  {
    category: "Languages",
    items: ["Kotlin", "Java", "Dart (Flutter)", "Python", "TypeScript", "JavaScript", "SQL"]
  },
  {
    category: "Android Native",
    items: ["SDK", "Jetpack Compose", "Coroutines", "State Flow", "Android Auto", "Material 3"]
  },
  {
    category: "Flutter Ecosystem",
    items: ["Flutter Bloc", "Provider", "AutoRoute", "Freezed", "audio_service"]
  },
  {
    category: "Architecture",
    items: ["Clean Architecture", "MVVM", "MVI", "Repository Pattern", "Dagger Hilt", "Koin"]
  },
  {
    category: "Backend & Cloud",
    items: ["FastAPI", "Node.js", "Express.js", "Firebase", "AWS CloudFront", "GraphQL"]
  },
  {
    category: "AI & Next-Gen",
    items: ["Cursor", "Windsurf", "Claude Code", "Local LLMs", "AI-Augmented Dev"]
  },
];

export const PROJECTS: Project[] = [
  {
    title: "BAPS Prakash",
    description: "Secure media streaming application with AWS CloudFront integration and robust background audio features. Engineering highlights include signed cookie validation and Android Auto sync.",
    tags: ["Kotlin", "AWS", "ExoPlayer", "Architecture"],
    image: "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Akshar Amrutam",
    description: "High-performance Flutter application with 100k+ downloads and near-perfect stability metrics. Features complex state management, Android Auto integration, and a highly polished UI for a global user base.",
    tags: ["Flutter", "Bloc", "Clean Architecture", "Android Auto"],
    image: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Autozon IoT",
    description: "Real-time IoT monitoring application using MQTT for vehicle hardware communication. Optimizes battery consumption while maintaining persistent hardware-to-cloud connections.",
    tags: ["Flutter", "MQTT", "IoT", "Hardware"],
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0dbL"
  },
  {
    title: "Fastrrr-Floating Apps",
    description: "Utility application featuring advanced window management and background efficiency. Implements complex overlay window permissions and strict battery efficiency protocols.",
    tags: ["Android", "Java", "Services"],
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800"
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Sarah Mitchell",
    role: "CTO, Rysun Labs",
    content: "Govind is one of the most reliable senior developers I've worked with. His clean architecture patterns and attention to performance optimization elevated our entire team's standards."
  },
  {
    name: "Priya Sharma",
    role: "Product Manager",
    content: "Working with Govind was a pleasure. He doesn't just write code—he thinks about the end user, scalability, and maintainability at every step. The BAPS Prakash app he architected handles 50k+ users seamlessly."
  },
  {
    name: "Rajesh Patel",
    role: "Senior Flutter Developer",
    content: "His expertise in Flutter Bloc and state management is exceptional. He mentored our junior team and introduced patterns that dramatically improved our code quality and reduced bugs."
  },
];
