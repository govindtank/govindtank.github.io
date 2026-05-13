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


  {
  "title": "Mastering AI-Augmented Development: The Architect’s Guide to Efficiency and Code Quality",
  "excerpt": "We are standing at a precipice of digital transformation where software engineering is evolving from a purely manual craft into a collaborative partnership between human cognition and artificial intelligence. For years, developers have wrestled with ",
  "date": "May 14, 2026",
  "tag": "AI",
  "slug": "mastering-ai-augmented-development-the-architect-s-guide-to-efficiency-and-code-quality",
  "content": "\n\n# Mastering AI-Augmented Development: The Architect’s Guide to Efficiency and Code Quality\n\nWe are standing at a precipice of digital transformation where software engineering is evolving from a purely manual craft into a collaborative partnership between human cognition and artificial intelligence. For years, developers have wrestled with boilerplate code, repetitive configuration tasks, and the constant need to refactor legacy systems into modern architectures. The promise of AI has long been seductive, but recent innovations in generative models have finally made these promises actionable within production pipelines. As a Senior Lead Architect, I’ve seen teams burn out trying to maintain clean code against the entropy of technical debt. Now, AI offers a powerful lever to reverse that trend without sacrificing architectural integrity.\n\nHowever, adopting these tools requires more than just clicking buttons; it demands a fundamental shift in workflow mindset. The goal isn't automation for automation's sake—it is to amplify developer velocity while preserving the rigidity of clean code principles. Whether you are building cloud-native microservices or crafting seamless mobile experiences in Flutter and Kotlin, AI-augmented workflows can reduce friction significantly. This post explores how to integrate these tools responsibly, ensuring that your team builds faster without compromising on stability or security. By treating AI as an intelligent senior developer assistant rather than a replacement for human judgment, you unlock the true potential of next-generation development environments.\n\n## Transformative Code Generation and Intelligent Refactoring\n\nThe first tangible benefit of AI integration lies in code generation and refactoring. In traditional mobile development, we often spend excessive time writing boilerplate for common UI patterns, state management setups, or repetitive utility functions. AI models can now scaffold these components instantly. For instance, when building a Kotlin ViewModel, an AI assistant can suggest the implementation of a repository layer based on your existing architecture.\n\nConsider this scenario where you need to transition from a legacy `LiveData` pattern to modern Flow-based architecture. An AI tool can analyze your dependency graph and suggest the refactoring steps:\n\n```kotlin\n// Legacy Code Pattern\nclass UserViewModel : AndroidViewModel(context) {\n    private val repository = UserRepository.getInstance()\n    val users: LiveData<List<User>> = repository.getAllUsers()\n}\n\n// AI-Suggested Modernization (Jetpack Flow)\nsealed class UiEvent {\n    data class Success(val list: List<User>) : UiEvent()\n    data class Error(val message: String) : UiEvent()\n}\n\nclass UserViewModel : ViewModel() {\n    private val repository = UserRepository.getInstance()\n    \n    // AI generates this flow lifecycle safely\n    val uiState: StateFlow<UiEvent> = repository.getAllUsers().mapIndexedToStateFlow( \n        Event.Loading, \n        { events -> events },\n        { err -> UiEvent.Error(\"Failed\") }\n    )\n}\n```\n\nThis isn't just about saving lines; it’s about enforcing architectural consistency. AI can also handle test generation for critical paths. Prompting an agent to \"Generate unit tests for the `calculateTotal` function, adhering to Google Testing Guidelines\" yields immediate, high-fidelity coverage. The key is reviewing these suggestions against your team's specific style guide before committing them to version control.\n\n## Architecting Cloud-Native Systems with AI Insights\n\nBeyond the application layer, AI plays a pivotal role in cloud-native architecture and DevOps. Managing Kubernetes clusters across multiple environments often leads to configuration drift. AI-driven Infrastructure as Code (IaC) assistants can audit your Terraform or Pulumi scripts against best practices. Recent innovations allow LLMs to analyze log aggregation pipelines and suggest optimal observability configurations automatically.\n\nImagine a situation where your microservices are experiencing latency spikes. A human analyst might manually correlate metrics from AWS CloudWatch, Datadog, and Grafana. An AI-augmented workflow can ingest these logs in real-time, identify the correlation between database lock times and API response delays, and even generate the optimization script to index a specific column or scale the read replica pool.\n\n```hcl\n# AI-Annotated Terraform for Optimized Read Scaling\nresource \"aws_db_instance\" \"app_read\" {\n  db_instance_identifier    = \"read-replica-prod\"\n  multi_az                  = true\n  storage_encrypted        = true\n  engine                   = \"aurora-mysql\"\n  max_allocated_storage    = 20\n  \n  # AI Suggestion: Adjusted based on current load analysis\n  instance_class           = \"db.r6g.2xlarge\" \n  enable_performance_insights = true \n}\n```\n\nFurthermore, AI tools are increasingly integrating into CI/CD pipelines to perform predictive failure analysis before a deployment reaches production. By reviewing the diff against known error patterns in similar microservices, these tools can flag potential regression risks early in the commit lifecycle. This proactive approach aligns with our cloud-native philosophy of observing and self-healing systems.\n\n## Maintaining Clean Code Principles in an AI Era\n\nThe most critical challenge remains maintaining clean code principles when AI generates substantial portions of a solution. \"Garbage In, Garbage Out\" applies doubly here. AI models are trained on public repositories that contain both excellent and flawed practices. Without human oversight, they may introduce technical debt disguised as smart solutions. As an architect, I advocate for a \"Human-in-the-Loop\" model where AI handles the syntax and boilerplate, but humans define the logic and patterns.\n\nWe must enforce SOLID principles even when AI suggests them. If an AI recommends an overly complex strategy pattern because it sees frequent usage in open-source projects without understanding your specific context, you must refactor that decision. Clean code is about clarity, not just running tests.\n\nTo mitigate this, use AI to explain *why* a suggestion was made. Ask the AI to critique its own code against the \"Boy Scout Rule.\" Prompt engineering is essential here. Instead of asking for generic code, ask: \"Refactor this Dart class to follow Single Responsibility Principle and add comments explaining the flow control logic.\"\n\n```dart\n// Before: Violation of SRP\nclass WidgetBuilder {\n  // Mixes UI construction with state handling\n  String build(BuildContext context) {\n    if (widget.isLoading) return 'Loading...';\n    \n    var user = await _fetchUser(); \n    if (user == null) return ErrorWidget();\n    return Text(user.name);\n  }\n}\n\n// After: AI Refactored for Clean Architecture\nclass WidgetBuilder implements StatelessWidget {\n  final String? text;\n  \n  WidgetBuilder({this.text}) {}\n\n  // Pure UI construction, no state logic leakage\n  @override\n  Widget build(BuildContext context) => Text(text ?? 'Default');\n\n  // Async operations moved to ViewModel/Repository layer\n}\n```\n\nBy treating the AI model as a junior pair programmer who is eager to impress but lacks context, you ensure that your codebase remains maintainable. You retain the authority to reject complex suggestions in favor of simpler, clearer implementations. This balance ensures that velocity does not come at the cost of stability.\n\n## Conclusion\n\nAI-augmented development workflows represent the next evolutionary step in software engineering, allowing teams to accelerate delivery while adhering to rigorous architectural standards. By leveraging AI for boilerplate generation, cloud-native configuration optimization, and intelligent refactoring support, we free up cognitive bandwidth for higher-value problem solving. However, this power comes with the responsibility of strict oversight. Clean code principles must remain the north star, even when an assistant offers a shortcut. As we move forward, the most successful teams will not be those that rely solely on AI, but those that integrate it thoughtfully into their human-centric engineering processes. Adopt these tools today, validate every suggestion rigorously, and build systems that are as intelligent as your codebase deserves to be."
},
export const BLOG_POSTS: BlogPost[] = [
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