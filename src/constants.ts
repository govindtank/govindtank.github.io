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

const MARKDOWN_BLOG_POSTS: BlogPost[] = Object.entries(rawEagerModules)
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
      content: '',
      coverImage: (data.coverImage as string) || '',
      readTime: (data.readTime as number) || Math.ceil(((data.excerpt as string) || '').split(' ').length / 200) || 4,
    };
  });

export const BLOG_POSTS: BlogPost[] = MARKDOWN_BLOG_POSTS
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
  link?: string;
  playStoreLink?: string;
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
    description: "Secure audio/media streaming application serving 50k+ active users. Engineered with AWS CloudFront signed cookies, background playback via audio_service, ExoPlayer optimizations, and Android Auto integration.",
    tags: ["Kotlin", "AWS CloudFront", "ExoPlayer", "Android Auto"],
    image: "/images/projects/baps-prakash-icon.png",
    link: "https://github.com/govindtank",
    playStoreLink: "https://play.google.com/store/apps/details?id=org.baps.swaminarayanprakash&hl=en_IN"
  },
  {
    title: "Akshar Amrutam",
    description: "High-performance digital publication platform scaled to 100,000+ downloads with a 99.95% crash-free rate. Features BLoC state management, offline cached reading, and an Android Auto companion module.",
    tags: ["Flutter", "Bloc", "Clean Architecture", "Android Auto"],
    image: "/images/projects/akshar-amrutam-icon.png",
    link: "https://github.com/govindtank",
    playStoreLink: "https://play.google.com/store/apps/details?id=org.baps.akshar_amrutam&hl=en_IN"
  },
  {
    title: "La Crosse View",
    description: "Real-time environmental monitoring app synchronizing with commercial wireless weather stations. Implements high-reliability Android background synchronization, sensor data parsing, and low-latency dashboard graphs.",
    tags: ["Android Native", "IoT", "Sensors", "Background Services"],
    image: "/images/projects/lacrosse-view-icon.png",
    link: "https://github.com/govindtank",
    playStoreLink: "https://play.google.com/store/apps/details?id=com.lacrosseview.app&hl=en_IN"
  },
  {
    title: "La Crosse Alerts Mobile",
    description: "Mission-critical remote temperature & humidity monitoring application. Features customizable threshold push alert triggers, historical device diagnostics, and multi-station telemetry sync.",
    tags: ["Android Native", "Alerts", "Hardware Sync", "Push Architecture"],
    image: "/images/projects/lacrosse-alerts-mobile-icon.png",
    link: "https://github.com/govindtank",
    playStoreLink: "https://play.google.com/store/apps/details?id=com.lacrossetechnology.lacrossemobile&hl=en_IN"
  },
  {
    title: "Max Fun Club",
    description: "Gamified entertainment and community engagement platform built with Flutter. Engineered with high-frame-rate 60fps micro-interactions, reward tracking, and real-time user state synchronization.",
    tags: ["Flutter", "Dart", "Entertainment", "State Management"],
    image: "/images/projects/max-fun-club-icon.png",
    link: "https://github.com/govindtank",
    playStoreLink: "https://play.google.com/store/apps/details?id=com.maxfunclub&hl=en_IN"
  },
  {
    title: "Autozon IoT",
    description: "Real-time automotive IoT monitoring application utilizing MQTT for continuous vehicle hardware communication. Engineered with strict battery efficiency protocols and persistent hardware-to-cloud telemetry.",
    tags: ["Flutter", "MQTT", "Vehicle Telemetry", "Hardware"],
    image: "/images/projects/autozon-iot-icon.png",
    link: "https://github.com/govindtank",
    playStoreLink: "https://play.google.com/store/apps/details?id=com.voiceofthings.smartindia&hl=en_IN"
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Maulik Patel",
    role: "Senior Application Developer @ Phycom",
    content: "I worked closely with Govind at Phycom on multiple Android initiatives, and his ability to turn unstable legacy codebases into clean, production-ready applications stood out immediately. He reduced startup time and memory footprint significantly while keeping delivery timelines intact."
  },
  {
    name: "Hardik Parmar",
    role: "Technical Mobile Lead @ Rysun",
    content: "Govind operated as a strong project owner while we collaborated at Rysun. Whether it was Flutter Bloc architecture, Android Auto integration, or high-concurrency backend APIs, he consistently raised the quality bar across the entire mobile squad."
  },
  {
    name: "Alpesh Rana",
    role: "Freelance Project - Task Management System",
    content: "We hired Govind on a freelance engagement to build a task management system from scratch. He understood our workflow requirements quickly, delivered a clean modular solution, and stayed responsive through iterations even after launch."
  },
  {
    name: "Aniket Patel",
    role: "Freelance Project - Society Management Software",
    content: "For our society management software, Govind provided end-to-end implementation with clear domain modeling and stable mobile workflows. His pragmatic approach to features and bug resolution made the overall engagement straightforward and reliable."
  },
];
