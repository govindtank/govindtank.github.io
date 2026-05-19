// @ts-nocheck
import type { Experience, Skill, Project, Testimonial } from './types';

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

export const BLOG_POSTS: BlogPost[] = [
  {
    title: `AI-Augmented Development Workflows: Scaling Code Quality and Velocity in 2026`,
    excerpt: `The pace of modern software delivery is unprecedented, yet developer fatigue remains a critical bottleneck for engineering organizations striving for velocity. As teams grapple with sprawling monorepos and rapid release cycles, integrating Artificial Intelligence isn't just a productivity hack—it's becoming an architectural imperative for senior leads. Recent breakthroughs, such as GitHub Copilot X and open-source local LLMs, have shifted the paradigm from simple code suggestion to complex context-aware reasoning across entire repositories. For a Senior Lead Architect, the challenge transitions from writing individual functions to orchestrating human-AI collaboration without compromising security or long-term maintainability. In 2026, relying solely on prompt engineering is insufficient; you must embed these capabilities directly into your CI/CD pipelines and architectural guardrails. This post explores how to leverage AI-Augmented Development Workflows to enhance velocity while preserving technical integrity across cloud-native environments and mobile platforms like Flutter. We will examine practical integration strategies that transform raw intelligence into production-grade software, ensuring that your engineering team evolves alongside the tools they use to build scalable systems.`,
    date: `May 18, 2026`,
    tag: `AI-Engineering`,
    slug: `ai-augmented-development-workflows-scaling-code-quality-and-velocity-in-2026`,
    content: `

# AI-Augmented Development Workflows: Scaling Code Quality and Velocity in 2026

The pace of modern software delivery is unprecedented, yet developer fatigue remains a critical bottleneck for engineering organizations striving for velocity. As teams grapple with sprawling monorepos and rapid release cycles, integrating Artificial Intelligence isn't just a productivity hack—it's becoming an architectural imperative for senior leads. Recent breakthroughs, such as GitHub Copilot X and open-source local LLMs, have shifted the paradigm from simple code suggestion to complex context-aware reasoning across entire repositories.

## Automating Quality Assurance in CI/CD Pipelines

Integrating AI into the Continuous Integration phase moves beyond syntax checking into semantic analysis. Recent tools allow LLMs to ingest entire pull requests and context-aware dependencies, offering deeper security scans than traditional static analyzers like SonarQube alone. The goal is to reduce noise while catching genuine logic errors or dependency vulnerabilities before merging.

## Conclusion

The future of AI in development isn't about replacing human judgment—it's about amplifying it. By embedding these tools into your workflow strategically, you create a force multiplier that scales both quality and throughput without compromising either.
`
  },
  {
    title: `Flutter Performance Optimization: Achieving 60 FPS on Mid-Range Devices`,
    excerpt: `Performance isn't optional—it's essential for user retention. This deep dive explores advanced Flutter optimization techniques including lazy loading strategies, efficient widget lifecycle management, and intelligent background processing that keeps your app smooth even under heavy load. We'll examine real-world case studies from apps handling 100k+ users and learn how to identify bottlenecks before they impact UX.`,
    date: `May 19, 2026`,
    tag: `Mobile-Performance`,
    slug: `flutter-performance-optimization-achieving-60-fps-on-mid-range-devices`,
    content: `

# Flutter Performance Optimization: Achieving 60 FPS on Mid-Range Devices

Performance isn't optional—it's essential for user retention. In today's competitive mobile landscape, a 100ms delay in load time can increase bounce rates by 32%. This means your optimization efforts directly impact business metrics. Let's explore how to build performant Flutter apps that deliver silky-smooth experiences even on budget hardware.

## Understanding Flutter's Rendering Pipeline

Before optimizing, you must understand what needs optimizing. Flutter uses a three-tier rendering pipeline:
- **Raster Layer**: Each widget composition creates pixels in memory
- **Composite Layer**: Off-screen views managed by the engine
- **Surface Layer**: The actual display surface managed by the platform

Every frame costs CPU cycles for composition and GPU power for rasterization. The goal is to minimize unnecessary work at each layer while maintaining 60 FPS (or 120 FPS on compatible devices).

## Key Optimization Strategies

### 1. Smart Repaint Management

The most common performance killer is excessive rebuilds. Use RepaintBoundary strategically:

    RepaintBoundary(
      child: ComplexListView(
        // Heavy widget goes here, won't repaint parent
      ),
    )

This isolates expensive rendering to a single area that can be cached and reused.

### 2. Efficient Image Loading

Images are often the largest assets in mobile apps. Use cached network images with proper sizing:

    CachedNetworkImage(
      fit: BoxFit.cover,
      fadeInDuration: Duration(milliseconds: 300),
      fadeOutDuration: Duration(milliseconds: 300),
      placeholder: (context, path) => CircularProgressIndicator(),
      errorBuilder: (context, _, _) => Icon(Icons.broken_image),
      imageBuilder: (context, imageProvider) => 
        ImageFiltered(
          imageProvider,
          child: Stack(
            children: [
              Container(color: Colors.grey[300]), // Background color
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: imageProvider,
              ),
              Icon(Icons.cloud_done, color: Colors.greenAccent), // Success indicator,
            ],
          ),
        ),
    )

### 3. Lazy Loading for Large Lists

For lists with hundreds or thousands of items, implement pagination and lazy loading:

    const int pageItems = 20;
    final List<List<T>> pages = [];
    int currentPage = 0;

    void loadNextPage() async {
      final data = await _api.fetchPage(currentPage * pageItems);
      pages.addAll(data);
    }

    ListView.builder(
      itemCount: (pages.length + 1) * pageItems,
      itemBuilder: (context, index) {
        if (index == pages.length * pageItems && isLoading) {
          return _buildLoadingIndicator();
        }
        final item = pages[index / pageItems][index % pageItems];
        return _buildItem(item);
      },
    )

### 4. Background Processing with Isolates

Move heavy computations to background threads:

    @isolate
    Future<List<double>> computeFibonacciSequence(int n) async {
      List<double> sequence = [];
      for (int i = 0; i < n; i++) {
        final fib = _calculateFibonacci(i);
        sequence.add(fib);
      }
      return sequence;
    }

## Memory Management Best Practices

### Detect and Fix Memory Leaks

Flutter's garbage collector is powerful but needs your help:
- Use DisposeWidget mixin for complex widget trees
- Clean up subscriptions in dispose() methods
- Monitor memory usage with Chrome DevTools

    @override
    void dispose() {
      streamSubscription?.cancel();
      super.dispose();
    }

### Optimize Asset Bundles

Reduce app size by:
- Using adaptive icons
- Implementing lazy loading for assets
- Compressing images with proper formats (WebP/AVIF)
- Removing unused fonts and libraries

## Profiling Your App

Use Flutter DevTools to identify bottlenecks:
- **Performance View**: Find frame drops and jank
- **Method/Isolate View**: Profile CPU usage
- **DevTools View**: Monitor memory allocation patterns

## Testing on Real Devices

Don't rely solely on emulators. Test on:
- Budget Android devices (cheapest 1-year-old phone)
- Older iPhones (iPhone 8, SE models)
- Various screen sizes and densities

## Conclusion: The Path to 60+ FPS

Achieving consistent 60 FPS requires a combination of architectural decisions and micro-optimizations. Start with profiling—identify what's actually slow before optimizing. Remember that good architecture scales better than clever hacks. Implement lazy loading, use isolates for heavy work, and manage memory carefully from day one.

With these strategies, even mid-range devices can deliver premium experiences that keep users engaged and coming back for more. 🚀
`
  },
];
