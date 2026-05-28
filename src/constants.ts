export interface BlogPost {
  title: string;
  excerpt: string;
  date: string;
  tag: string;
  slug: string;
  content: string;
}

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
    items: ["Cursor", "Windsurf", "Claude Code", "OpenRouter API", "AI-Augmented Dev"]
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

export const BLOG_POSTS: BlogPost[] = [
  {
    title: "Android 16: What Senior Developers Need to Know About the Latest APIs",
    excerpt: "Explore the critical new APIs and features in Android 16, including enhanced security, Kotlin Multiplatform support, and adaptive UI components for modern app development.",
    date: "May 26, 2026",
    tag: "Android",
    slug: "android-16-what-senior-developers-need-to-know-about-the-latest-apis",
    content: ""
  },
  {
    title: "Flutter State Management Deep Dive: Bloc vs Riverpod vs Provider in 2026",
    excerpt: "A comprehensive comparison of Flutter state management solutions analyzing Bloc, Riverpod, and Provider with practical code examples and performance benchmarks.",
    date: "May 26, 2026",
    tag: "Flutter",
    slug: "flutter-state-management-deep-dive-bloc-vs-riverpod-vs-provider-in-2026",
    content: ""
  },
  {
    title: "Building Resumable File Uploads in Flutter with Isolates",
    excerpt: "Implement robust file uploads in Flutter with pause-resume capability using Dart isolates for true background processing without UI jank.",
    date: "May 26, 2026",
    tag: "Mobile",
    slug: "building-resumable-file-uploads-in-flutter-with-isolates",
    content: ""
  },
  {
    title: "AI Agents: Building Autonomous Workflows for Complex Tasks",
    excerpt: "A deep dive into multi-agent architectures, tool integration patterns, and error handling strategies for building production-grade autonomous AI agents.",
    date: "May 21, 2026",
    tag: "AI-Agents",
    slug: "ai-agents-autonomous-workflows-complex-tasks-2026",
    content: ""
  },
  {
    title: "Clean Architecture & Design Patterns in Modern AI Systems: Building Maintainable ML Pipelines",
    excerpt: "Applying clean architecture principles—dependency inversion, repository patterns, and separation of concerns—to machine learning pipeline design for long-term maintainability.",
    date: "May 21, 2026",
    tag: "Clean-Architecture",
    slug: "clean-architecture-design-patterns-modern-ai-systems-building-maintainable-ml-pipelines",
    content: ""
  },
  {
    title: "AI Model Optimization: Quantization, Distillation, and Efficient Training for Edge Devices",
    excerpt: "Practical techniques for reducing model size and latency through quantization, knowledge distillation, and pruning strategies for mobile and edge deployment.",
    date: "May 21, 2026",
    tag: "AI-Optimization",
    slug: "ai-model-optimization-quantization-distillation-and-efficient-training-for-edge-devices",
    content: ""
  },
  {
    title: "AI-Augmented Development Workflows: Scaling Code Quality and Velocity in 2026",
    excerpt: "A strategic blueprint for integrating LLMs into the enterprise SDLC to increase velocity without compromising architectural integrity.",
    date: "May 20, 2026",
    tag: "AI-Engineering",
    slug: "ai-augmented-development-workflows-scaling-code-quality-and-velocity-in-2026",
    content: ""
  },
  {
    title: "Flutter Performance Optimization: Achieving 60 FPS on Mid-Range Devices",
    excerpt: "Proven techniques for optimizing Flutter rendering, widget tree management, and memory usage to maintain steady 60 FPS on budget smartphones.",
    date: "May 19, 2026",
    tag: "Mobile-Performance",
    slug: "flutter-performance-optimization-achieving-60-fps-on-mid-range-devices",
    content: ""
  },
  {
    title: "AI-Augmented Development Workflows: Mastering Intelligent CI/CD Automation Pipelines with LLM Agents in 2026",
    excerpt: "Transforming static pipelines into proactive governance engines that ensure every commit meets production-grade standards through semantic AI review.",
    date: "May 18, 2026",
    tag: "DevOps-AI",
    slug: "ai-augmented-development-workflows-architecting-the-future-of-software-engineering",
    content: ""
  },
  {
    title: "Mastering Flutter AI Integration: Building Smart Mobile Apps with Machine Learning in 2026",
    excerpt: "A comprehensive guide to deploying edge-AI models in Flutter for real-time, offline-first intelligence using TensorFlow Lite and ONNX.",
    date: "May 14, 2026",
    tag: "AI",
    slug: "flutter-ai-integration-machine-learning-2026",
    content: ""
  },
  {
    title: "The Rise of AI-Augmented Development",
    excerpt: "How tools like Cursor and Windsurf are fundamentally changing the workflow for senior developers, from ideation to testing.",
    date: "Mar 15, 2024",
    tag: "AI",
    slug: "ai-augmented-dev",
    content: ""
  },
  {
    title: "Achieving 99.9% Crash-Free Rate in Flutter",
    excerpt: "Deep dive into error handling, state management with Bloc, and stable architecture patterns for production-grade Flutter applications.",
    date: "Feb 10, 2024",
    tag: "Mobile",
    slug: "flutter-stability",
    content: ""
  }
];
