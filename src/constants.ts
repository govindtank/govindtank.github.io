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

export const BLOG_POSTS: BlogPost[] = [
  {
    title: `Event Sourcing and CQRS: Practical Patterns for Distributed Systems`,
    excerpt: `In the evolving landscape of distributed system architecture in 2026, the traditional monolithic data model is increasingly viewed as a scalability bottleneck. As microservices proliferate and CAP ...`,
    date: `June 05, 2026`,
    tag: `Architecture`,
    slug: `event-sourcing-and-cqrs-practical-patterns-for-distributed-systems`,
    content: ``
  },

  {
    title: `AI-Augmented Development Workflows: Scaling Code Quality and Velocity in 2026`,
    excerpt: `Scale code quality and developer velocity with AI-augmented development workflows using LLM agents, automated testing, and intelligent code review in production environments.`,
    date: `June 03, 2026`,
    tag: `AI`,
    slug: `ai-augmented-development-workflows-scaling-code-quality-and-velocity-in-2026`,
    content: ``
    },
  {
    title: `Zero-Trust Architecture: Implementing Security in Distributed Cloud Systems`,
    excerpt: `The perimeter-based security model that defined the industry for decades is functionally obsolete in 2026...`,
    date: `June 03, 2026`,
    tag: `Security`,
    slug: `zero-trust-architecture-implementing-security-in-distributed-cloud-systems`,
    content: ``
    },
  {
    title: `AI-Augmented Development Workflows: Architecting the Future of Software Engineering`,
    excerpt: `Architect AI-augmented development workflows with multi-agent systems, automated code generation, and intelligent testing pipelines for modern software engineering teams.`,
    date: `June 02, 2026`,
    tag: `AI`,
    slug: `ai-augmented-development-workflows-architecting-the-future-of-software-engineering`,
    content: ``
    },
  {
    title: `Building Scalable Microservices with FastAPI and Event-Driven Architecture`,
    excerpt: `In the rapidly evolving backend landscape of 2026, the traditional synchronous request-response model is increasingly viewed as a bottleneck...`,
    date: `June 02, 2026`,
    tag: `Backend-Architecture`,
    slug: `building-scalable-microservices-with-fastapi-and-event-driven-architecture`,
    content: ``
    },
  {
    title: `Mastering Flutter AI Integration: Building Smart Mobile Apps with Machine Learning in 2026`,
    excerpt: `Integrate AI and machine learning capabilities into Flutter applications with on-device inference, model management, and cloud-based ML services for smart mobile experiences.`,
    date: `June 01, 2026`,
    tag: `Flutter`,
    slug: `flutter-ai-integration-machine-learning-2026`,
    content: ``
    },
  {
    title: `Flutter Performance Optimization: Achieving 60 FPS on Mid-Range Devices`,
    excerpt: `Optimize Flutter application performance for mid-range devices with widget tree optimization, image caching, and rendering pipeline improvements for smooth 60 FPS experiences.`,
    date: `May 30, 2026`,
    tag: `Flutter`,
    slug: `flutter-performance-optimization-achieving-60-fps-on-mid-range-devices`,
    content: ``
    },
  {
    title: `The Evolution of Kotlin Multiplatform in 2026`,
    excerpt: `Kotlin Multiplatform has matured from a research project to production-ready technology with robust platform interop, 60-70% code reuse ratios...`,
    date: `May 29, 2026`,
    tag: `Kotlin-Multiplatform`,
    slug: `kotlin-multiplatform-evolution-in-2026`,
    content: ``
    },
  {
    title: `AI-Powered Code Review: Automating Quality Gates with LLM Agents`,
    excerpt: `Combine LLM agents with deterministic static analysis to automate code review pipelines, reduce review cycle time by 62%...`,
    date: `May 29, 2026`,
    tag: `AI-Engineering`,
    slug: `ai-powered-code-review-automating-quality-gates-with-llm-agents`,
    content: ``
    },
  {
    title: `Flutter State Management Deep Dive: Bloc vs Riverpod vs Provider in 2026`,
    excerpt: `A comprehensive comparison of Flutter state management solutions analyzing Bloc, Riverpod, and Provider with practical code examples and performance benchmarks.`,
    date: `May 28, 2026`,
    tag: `Flutter`,
    slug: `flutter-state-management-deep-dive-bloc-vs-riverpod-vs-provider-in-2026`,
    content: ``
    },
  {
    title: `AI Model Optimization: Quantization, Distillation, and Efficient Training for Edge Devices`,
    excerpt: `Practical techniques for reducing model size and latency through quantization, knowledge distillation, and pruning strategies for mobile and edge deployment.`,
    date: `May 28, 2026`,
    tag: `AI-Optimization`,
    slug: `ai-model-optimization-quantization-distillation-and-efficient-training-for-edge-devices`,
    content: ``
    },
  {
    title: `Building Resumable File Uploads in Flutter with Isolates`,
    excerpt: `Implement robust file uploads in Flutter with pause-resume capability using Dart isolates for true background processing without UI jank.`,
    date: `May 27, 2026`,
    tag: `Mobile`,
    slug: `building-resumable-file-uploads-in-flutter-with-isolates`,
    content: ``
    },
  {
    title: `Android 16: What Senior Developers Need to Know About the Latest APIs`,
    excerpt: `Explore the critical new APIs and features in Android 2, including enhanced security, Kotlin Multiplatform support, and adaptive UI components for modern app development.`,
    date: `May 27, 2026`,
    tag: `Android`,
    slug: `android-16-what-senior-developers-need-to-know-about-the-latest-apis`,
    content: ``
    },
  {
    title: `AI Agents: Building Autonomous Workflows for Complex Tasks`,
    excerpt: `A deep dive into multi-agent architectures, tool integration patterns, and error handling strategies for building production-grade autonomous AI agents.`,
    date: `May 26, 2026`,
    tag: `AI-Agents`,
    slug: `ai-agents-autonomous-workflows-complex-tasks-2026`,
    content: ``
    },
  {
    title: `Clean Architecture & Design Patterns in Modern AI Systems: Building Maintainable ML Pipelines`,
    excerpt: `Applying clean architecture principles—dependency inversion, repository patterns, and separation of concerns—to machine learning pipeline design for long-term maintainability.`,
    date: `May 25, 2026`,
    tag: `Clean-Architecture`,
    slug: `clean-architecture-design-patterns-modern-ai-systems-building-maintainable-ml-pipelines`,
    content: ``
    },
  {
    title: `The Rise of AI-Augmented Development`,
    excerpt: `How tools like Cursor and Windsurf are fundamentally changing the workflow for senior developers, from ideation to testing.`,
    date: `Mar 15, 2024`,
    tag: `AI`,
    slug: `ai-augmented-dev`,
    content: ``
    },
  {
    title: `Achieving 99.9% Crash-Free Rate in Flutter`,
    excerpt: `Deep dive into error handling, state management with Bloc, and stable architecture patterns for production-grade Flutter applications.`,
    date: `Feb 10, 2024`,
    tag: `Mobile`,
    slug: `flutter-stability`,
    content: ``
  }
];
