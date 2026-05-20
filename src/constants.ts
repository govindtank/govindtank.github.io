// @ts-nocheck
import type { Experience, Skill, Project, Testimonial, BlogPost } from './types';

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
  {
    company: "Stimulus Consultancy",
    role: "Android Developer",
    period: "Apr 2016 – Aug 2017",
    location: "Ahmedabad, India",
    achievements: [
      "Established CI/CD pipelines and repo structure for early-stage startup applications.",
      "Implemented accurate GST tax logic for a financial application."
    ]
  }
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
    items: ["Cursor", "Windsurf", "Claude Code", "OpenRouter API", "AI-Augmented Dev"]
  }
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
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Fastrrr-Floating Apps",
    description: "Utility application featuring advanced window management and background efficiency. Implements complex overlay window permissions and strict battery efficiency protocols.",
    tags: ["Android", "Java", "Services"],
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800"
  }
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
  }
];

// Blog posts - DYNAMICALLY LOADED from public/data/blogs/index.json
// SORTED BY DATE DESCENDING (Newest First) - This is standard blog behavior!
export const BLOG_POSTS: BlogPost[] = [
  // May 20, 2026 - Latest
  {
    title: `AI-Augmented Development Workflows: Scaling Code Quality and Velocity in 2026`,
    excerpt: `A deep dive into AI tools like Hermes Agent and their impact on modern development workflows. Learn architectural patterns for integrating LLMs into CI/CD pipelines, avoiding hallucinations, and maintaining developer agency while scaling code quality.`,
    date: `May 20, 2026`,
    tag: `AI-Engineering`,
    slug: `ai-augmented-development-workflows-scaling-code-quality-and-velocity-in-2026`,
  },
  // May 19, 2026
  {
    title: `Flutter Performance Optimization: Achieving 60 FPS on Mid-Range Devices`,
    excerpt: `Performance isn't optional—it's essential for user retention. This deep dive explores advanced Flutter optimization techniques including lazy loading strategies, efficient widget lifecycle management, and intelligent background processing that keeps your app smooth even under heavy load.`,
    date: `May 19, 2026`,
    tag: `Mobile-Performance`,
    slug: `flutter-performance-optimization-achieving-60-fps-on-mid-range-devices`,
  },
  // May 18, 2026 (Two posts on the same date - both included)
  {
    title: `AI-Augmented Development Workflows: Mastering Intelligent CI/CD Automation Pipelines with LLM Agents in 2026`,
    excerpt: `Smart deployment pipelines now leverage AI agents to auto-review code quality, detect vulnerabilities before merge, and suggest architectural improvements. In 2026, CI/CD has evolved from simple build automation to intelligent governance engines that ensure every commit meets quality, security, and performance standards.`,
    date: `May 18, 2026`,
    tag: `DevOps-AI`,
    slug: `ai-augmented-development-workflows-architecting-the-future-of-software-engineering`,
  },
  // May 14, 2026
  {
    title: `Mastering Flutter AI Integration: Building Smart Mobile Apps with Machine Learning in 2026`,
    excerpt: `Comprehensive guide to TensorFlow Lite, ONNX Runtime, and ML Kit integration in Flutter with performance optimization and production deployment strategies.`,
    date: `May 14, 2026`,
    tag: `AI`,
    slug: `flutter-ai-integration-machine-learning-2026`,
  },
  // March 15, 2024
  {
    title: `The Rise of AI-Augmented Development`,
    excerpt: `How tools like Cursor and Windsurf are fundamentally changing the workflow for senior developers.`,
    date: `Mar 15, 2024`,
    tag: `AI`,
    slug: `ai-augmented-dev`,
  },
  // February 10, 2024 - Oldest
  {
    title: `Achieving 99.9% Crash-Free Rate in Flutter`,
    excerpt: `Deep dive into error handling, state management with Bloc, and stable architecture patterns.`,
    date: `Feb 10, 2024`,
    tag: `Mobile`,
    slug: `flutter-stability`,
  },
];
