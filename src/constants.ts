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
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0dbL" // Corrected a typo in the original log likely
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
    title: "AI-Augmented Development Workflows: Scaling Code Quality and Velocity in 2026",
    excerpt: "A strategic blueprint for integrating LLMs into the enterprise SDLC to increase velocity without compromising architectural integrity.",
    date: "May 20, 2026",
    tag: "AI-Engineering",
    slug: "ai-augmented-development-workflows-scaling-code-quality-and-velocity-in-2026",
    content: `# AI-Augmented Development Workflows: Scaling Code Quality and Velocity in 2026

![AI Engineering](https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200)

## The Paradigm Shift in Software Engineering

The pace of modern software delivery is unprecedented, yet developer fatigue remains a critical bottleneck. In 2026, integrating Artificial Intelligence isn't just a productivity hack—it's an architectural imperative. The shift is moving from **simple code suggestion** to **complex context-aware reasoning** across entire repositories.

### The 'Context Window' Revolution

The primary breakthrough in AI-augmented development is the expansion of effective context windows. Modern tools now analyze the entire codebase, including documentation, Jira tickets, and previous PRs, to provide suggestions that are not just syntactically correct, but architecturally aligned.

#### Strategic Integration Patterns

1. **The Co-Pilot Pattern**: AI handles the boilerplate, while the human architect focuses on the 'What' and 'Why'.
2. **The Reviewer Pattern**: AI agents pre-scan PRs for security vulnerabilities and performance regressions before a human ever sees the code.
3. **The Generator Pattern**: From a high-level architectural spec, AI generates the scaffolding, interfaces, and basic implementations.

\`\`\`typescript
// Example: Context-aware interface generation
interface SystemArchitect {
  analyzeContext(repo: Repository): ContextMap;
  generateScaffold(spec: ArchSpec): Scaffold;
}

class AIArchitect implements SystemArchitect {
  async generateScaffold(spec: ArchSpec): Promise<Scaffold> {
    const context = await this.analyzeContext(currentRepo);
    return await llm.generate(\`Build scaffold for \${spec.name} using \${context.preferredPatterns}\`);
  }
}
\`\`\`

### Measuring the ROI of AI Adoption

Velocity is a vanity metric if quality drops. To truly scale, organizations must track **Quality-Adjusted Velocity**.

| Metric | Traditional Workflow | AI-Augmented Workflow | Impact |
|---|---|---|---|
| PR Cycle Time | 48-72 Hours | 12-24 Hours | 70% Reduction |
| Bug Density | 2.5 / KLOC | 1.1 / KLOC | 56% Improvement |
| Onboarding Time | 4-6 Weeks | 1-2 Weeks | 75% Acceleration |

## Conclusion

AI-augmented development is not about replacing the engineer; it's about elevating them to a **System Orchestrator**. The engineers who thrive in 2026 are those who can effectively guide AI agents, define strict architectural guardrails, and maintain a critical eye on the final output.
`
  },
  {
    title: "AI-Augmented Development Workflows: Mastering Intelligent CI/CD Automation Pipelines with LLM Agents in 2026",
    excerpt: "Transforming static pipelines into proactive governance engines that ensure every commit meets production-grade standards.",
    date: "May 18, 2026",
    tag: "DevOps-AI",
    slug: "ai-augmented-development-workflows-architecting-the-future-of-software-engineering",
    content: `# Mastering Intelligent CI/CD Automation Pipelines with LLM Agents

![DevOps AI](https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&q=80&w=1200)

## From Static Scripts to Autonomous Governance

Traditional CI/CD pipelines are binary: they either pass or fail based on pre-defined rules. Intelligent pipelines, however, leverage LLM agents to perform **semantic analysis** of changes.

### The Autonomous Reviewer Agent

Instead of simple linting, an AI agent can now ask: *"Does this change to the authentication logic introduce a potential race condition in the session manager?"*

#### The Governance Loop

1. **Semantic Change Detection**: The agent identifies the *intent* of the change.
2. **Contextual Risk Assessment**: It checks if the change touches critical paths (e.g., payment gateways, auth).
3. **Automated Mitigation**: If a risk is found, the agent suggests a specific fix in the PR comments.

\`\`\`yaml
# Example: AI-Agent integrated into GitHub Actions
name: AI-Governance-Pipeline
on: [pull_request]
jobs:
  ai-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run AI-Architect-Review
        run: |
          ai-review --mode strict \
          --check-performance \
          --check-security \
          --output pr-comment
\`\`\`

### Impact on Stability

By moving the 'reasoning' phase of a code review into the pipeline, teams reduce the burden on senior reviewers and ensure that no 'obvious' architectural mistakes reach the main branch.

## Conclusion

The future of DevOps is not 'Infrastructure as Code', but 'Infrastructure as Intent'. When the pipeline understands the intent of the developer, it becomes a partner in quality rather than a hurdle to deployment.
`
  },
  {
    title: "Mastering Flutter AI Integration: Building Smart Mobile Apps with Machine Learning in 2026",
    excerpt: "A comprehensive guide to deploying edge-AI models in Flutter for real-time, offline-first intelligence.",
    date: "May 14, 2026",
    tag: "AI",
    slug: "flutter-ai-integration-machine-learning-2026",
    content: `# Mastering Flutter AI Integration: Building Smart Mobile Apps

![Mobile AI](https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=1200)

## The Edge-AI Imperative

In 2026, the latency and privacy costs of cloud-AI are too high for mobile apps. The goal is **Edge-AI**: running optimized models directly on the device using TensorFlow Lite, ONNX, or CoreML.

### Architecting for Local Inference

The challenge in Flutter is managing the bridge between the Dart UI and the native C++/Metal/Vulkan acceleration layers.

#### Optimization Strategies

- **Quantization**: Reducing model weights from FP32 to INT8 to decrease memory footprint by 4x.
- **Pruning**: Removing redundant neurons that don't contribute to accuracy.
- **Isolate-based Execution**: Running the AI inference in a separate Dart Isolate to prevent UI jank.

\`\`\`dart
// Example: Running inference in a separate isolate
Future<String> runInference(List<double> input) async {
  return await compute(doInference, input);
}

// Top-level function for the isolate
String doInference(List<double> input) {
  final interpreter = tflite.Interpreter(modelPath);
  return interpreter.run(input);
}
\`\`\`

### Real-World Use Cases

- **Real-time Object Detection**: Using the camera stream to identify products in a retail app.
- **On-device NLP**: Local sentiment analysis and intent detection for a privacy-focused diary app.
- **Generative UI**: Dynamically altering the app layout based on user behavior predicted by a local model.

## Conclusion

Flutter's ability to integrate with native AI frameworks makes it the ideal platform for the next generation of intelligent apps. The key is balancing model complexity with device thermal and battery constraints.
`
  },
  {
    title: "The Rise of AI-Augmented Development",
    excerpt: "How tools like Cursor and Windsurf are fundamentally changing the workflow for senior developers.",
    date: "Mar 15, 2024",
    tag: "AI",
    slug: "ai-augmented-dev",
    content: `# The Rise of AI-Augmented Development

![AI Tools](https://images.unsplash.com/photo-1675271591211-f973ed576664?auto=format&fit=crop&q=80&w=1200)

## Beyond the Autocomplete

We've moved past the era of simple autocomplete. Tools like Cursor and Windsurf are **AI-native IDEs**. They don't just suggest a line of code; they understand the intent of the entire feature.

### The New Developer Workflow

1. **Ideation**: Prompting the AI to create a high-level technical design.
2. **Scaffolding**: AI generates the boilerplate, types, and interfaces.
3. **Refining**: The developer guides the AI to handle edge cases and optimize performance.
4. **Verifying**: AI generates the unit tests, and the developer verifies the logic.

### The Risk of 'AI-Dependency'

The greatest danger is the erosion of first-principles thinking. If developers simply 'accept' AI suggestions without understanding the underlying mechanics, we risk building fragile systems that no one knows how to fix when they break.

## Conclusion

AI tools are force multipliers. A senior developer with a high-end AI tool is 10x more productive than a senior developer without one. However, the core value remains the same: **the ability to reason about complex systems.**
`
  },
  {
    title: "Achieving 99.9% Crash-Free Rate in Flutter",
    excerpt: "Deep dive into error handling, state management with Bloc, and stable architecture patterns.",
    date: "Feb 10, 2024",
    tag: "Mobile",
    slug: "flutter-stability",
    content: `# Achieving 99.9% Crash-Free Rate in Flutter

![Stability](https://images.unsplash.com/photo-1551288049-bebda4e38a71?auto=format&fit=crop&q=80&w=1200)

## The Stability Challenge

Scaling a Flutter app to millions of users reveals edge cases that no local test can catch. Achieving a 99.9% crash-free rate requires a multi-layered approach to stability.

### The Three Pillars of Stability

#### 1. Robust State Management (Bloc)
Avoid 'state leakage' by using a strict event-driven architecture. Bloc ensures that state transitions are predictable and testable.

#### 2. Global Error Boundary
Never let an error bubble up to the root. Implement a custom `ErrorWidget.builder` to provide a graceful fallback UI and report the crash to Sentry/Firebase.

#### 3. Defensive Programming
Assume every API call will fail and every null value will appear. Use `Option` types or strict null safety to handle the 'unhappy path'.

\`\`\`dart
// Example: Defensive API handling
try {
  final result = await repository.fetchData();
  emit(DataLoaded(result));
} on SocketException {
  emit(NetworkError('No internet connection'));
} catch (e, stackTrace) {
  Sentry.captureException(e, stackTrace: stackTrace);
  emit(GenericError('An unexpected error occurred'));
}
\`\`\`

### Testing for Stability

- **Integration Tests**: Use `integration_test` to simulate real-user flows.
- **Golden Tests**: Ensure UI consistency across different screen sizes and OS versions.
- **Monkey Testing**: Use automated tools to send random inputs to the app to find hidden crashes.

## Conclusion

Stability is not a feature; it's a foundation. By combining a strict architecture with proactive monitoring and defensive coding, you can build Flutter apps that feel like native system components.
`
  }
];
; // <-- End of BLOG_POSTS array