import { Experience, Skill, Project, BlogPost, Testimonial } from './types';

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

  {
  "title": "AI-Augmented Development Workflows: Scaling Code Generation with Cloud-Native Architecture",
  "excerpt": "The pace of modern software delivery is outpacing the velocity of human typing. We are witnessing a paradigm shift where Artificial Intelligence transitions from a mere chatbot assistant to an autonomous engineering partner. As Senior Architect Govin",
  "date": "May 15, 2026",
  "tag": "AI",
  "slug": "ai-augmented-development-workflows-scaling-code-generation-with-cloud-native-architecture",
  "content": "\n\n# AI-Augmented Development Workflows: Scaling Code Generation with Cloud-Native Architecture\n\nThe pace of modern software delivery is outpacing the velocity of human typing. We are witnessing a paradigm shift where Artificial Intelligence transitions from a mere chatbot assistant to an autonomous engineering partner. As Senior Architect Govind Tank, I have observed that teams are no longer just asking AI \"how to write this function,\" but rather delegating architectural decisions and complex logic generation. Recent insights indicate that the industry is moving beyond simple code completion tools like early Copilots toward full-stack agents capable of reasoning about cloud-native architectures and cross-platform mobile stacks.\n\nThis transition offers a profound opportunity for engineering teams: reclaiming time from boilerplate to focus on complex problem-solving, though it requires a disciplined approach to integration. The question is no longer if we should adopt these workflows, but how to structure them to maintain code quality, security, and system observability without introducing technical debt.\n\n## Intelligent Code Generation in Cross-Platform Stacks\n\nIntegrating AI into the development lifecycle begins with the coding environment. For Flutter and Kotlin developers, the value lies not just in generating `build` files, but in understanding architecture patterns like MVVM or Clean Architecture. However, relying blindly on token generation leads to hallucinated APIs.\n\nConsider a scenario where an AI assists in creating a new Flutter widget that interacts with a cloud-native backend. The AI should be guided by existing project schemas rather than open-weight guesses. Here is a refined Dart snippet showing how we might prompt an agent to respect specific repository structures:\n\n```dart\n// Generated Prompt Context for AI Assistant\n// Goal: Create reusable StreamBuilder wrapper with error handling\n\n// ❌ Naive Generation (Risk of context leak)\nStreamBuilder<T>(\n  stream: _streamController.stream,\n) // Missing type inference logic\n\n// ✅ Architect-Guided Implementation\nclass SecureStreamBuilder<T> extends StatefulWidget {\n  final T Function(T value)? builder;\n  final StreamProvider? provider;\n\n  @override\n  State<SecureStreamBuilder<T>> createState() => _SecureStreamBuilderState();\n}\n\n// Context injection requires defining interfaces before generation\n```\n\nBy providing specific interface definitions and constraints within your IDE context window, you reduce the likelihood of \"magic number\" errors. The goal is to use AI to handle the boilerplate state management while humans define the domain logic boundaries. This ensures the generated code fits seamlessly into legacy systems or cloud-native microservices.\n\n## Architecting for Agent-Based Microservices\n\nMoving beyond individual coding tasks requires designing systems where AI agents are native components, not external appendages. Recent technology shifts suggest we must treat LLMs as stateful services within our orchestration layer, similar to Kubernetes pods. This architecture allows for scalable RAG (Retrieval-Augmented Generation) pipelines where AI models query internal documentation before proposing changes.\n\nBelow is an ASCII representation of a Cloud-Native Architecture supporting AI Agents:\n\n```text\n+----------------+       +----------------------+       +-----------------------+\n|   Client App   | --->  |   API Gateway /     | --->  |   LLM Inference      |\n| (Flutter/Kt)   |       |   WAF                 |       |   (OpenAI/Mistral/L3)|\n+----------------+       +----------------------+       +-----------------------+\n                                                          ^                |\n                                                          |    gRPC/HTTP\n                                                          |                v\n                                              +------------------------------+\n                                              |      Service Mesh / Sidecar  |\n                                              |      - Observability         |\n                                              |      - Security Policies      |\n                                              +------------------------------+\n                                                          |\n                      +----------------------------------|------------------+\n                      |   Vector DB (Embeddings)          |    Source Repo   |\n                      +----------------------------------|------------------+\n                                                        (Code/Docs Context)\n```\n\nIn this model, the LLM inference layer acts as a cognitive proxy. It intercepts standard requests and enhances them with vector search results from historical codebases or architectural decision records (ADRs). The service mesh ensures that all AI-generated code passes through security scanning and observability pipelines before reaching production. This separation allows your cloud infrastructure to treat AI consumption as just another resource metric, preventing token costs from exploding unpredictably during peak development sprints.\n\n## Automated Security & Regression Testing Workflows\n\nThe final pillar of an augmented workflow is the left-shift of testing and security validation. Traditional unit tests often miss edge cases generated by AI logic. An agent-enhanced workflow integrates static analysis tools directly into the LLM's output loop before a Pull Request is even created. This reduces merge conflicts caused by vulnerable code.\n\nWe recommend integrating tools like `CodeQL` or GitHub Advanced Security into your CI/CD pipeline to validate AI proposals before human review. The workflow looks like this:\n\n1.  **Prompting:** Agent generates logic based on user intent.\n2.  **Analysis:** Static analyzer flags potential vulnerabilities (e.g., SQL injection in a generated query).\n3.  **Refinement:** LLM refactors code to remove the vulnerability flag.\n4.  **Verification:** Unit tests run against the new implementation.\n\nThis feedback loop ensures that AI does not act as a vector for introducing security debt. By embedding these checks into the agent's reasoning chain, we effectively build an autonomous QA team alongside your engineering staff. The result is a more resilient system where code generation speeds are balanced with rigorous quality gates, enabling you to scale development velocity without compromising on architectural integrity.\n\n## Conclusion\n\nAdopting AI-augmented workflows is not merely about faster typing; it is about restructuring how we build and secure software. As cloud-native architectures mature, integrating AI agents directly into your service mesh and CI/CD pipelines will be critical for maintaining competitive velocity. The future belongs to teams that can orchestrate humans and AI efficiently. We must move toward agentic workflows where the AI plans, tests, and refactors under strict architectural guardrails, allowing senior engineers to focus on high-value innovation rather than syntax."
},
export const BLOG_POSTS: BlogPost[] = [
  {
    title: "Mastering Flutter AI Integration: Building Smart Mobile Apps with Machine Learning in 2026",
    excerpt: "Comprehensive guide to TensorFlow Lite, ONNX Runtime, and ML Kit integration in Flutter with performance optimization and production deployment strategies.",
    date: "May 14, 2026",
    tag: "AI",
    slug: "flutter-ai-integration-machine-learning-2026"
  },
  {
    title: "The Rise of AI-Augmented Development",
    excerpt: "How tools like Cursor and Windsurf are fundamentally changing the workflow for senior developers.",
    date: "Mar 15, 2024",
    tag: "AI",
    slug: "ai-augmented-dev"
  },
  {
    title: "Achieving 99.9% Crash-Free Rate in Flutter",
    excerpt: "Deep dive into error handling, state management with Bloc, and stable architecture patterns.",
    date: "Feb 10, 2024",
    tag: "Mobile",
    slug: "flutter-stability"
  },
  {
    title: "Migrating Legacy Java to Kotlin Safely",
    excerpt: "A systematic approach to refactoring large enterprise applications without downtime.",
    date: "Jan 05, 2024",
    tag: "Kotlin",
    slug: "java-to-kotlin"
  }
];