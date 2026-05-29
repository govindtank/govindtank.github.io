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
    title: `AI-Powered Code Review: Automating Quality Gates with LLM Agents`,
    excerpt: `Combine LLM agents with deterministic static analysis to automate code review pipelines, reduce review cycle time by 62%, and catch defects humans miss. A practical architecture for production-grade AI code review.`,
    date: `May 29, 2026`,
    tag: `AI-Engineering`,
    slug: `ai-powered-code-review-automating-quality-gates-with-llm-agents`,
    content: `# AI-Powered Code Review: Automating Quality Gates with LLM Agents\n\nCode review is the most critical quality gate in the software development lifecycle, yet it remains painfully slow and inconsistent. Senior engineers spend 6-8 hours per week reviewing pull requests, and studies show that human reviewers catch only 35-65% of defects. The gap between what we hope code review achieves and what it actually delivers is enormous.\n\nEnter AI-powered code review. By combining LLM agents with deterministic static analysis, we can automate the tedious parts of review while freeing humans to focus on architecture, design, and business logic. This post explores a practical architecture for AI-driven code review automation that you can implement today.\n\n## Architecture: The Multi-Agent Review Pipeline\n\nThe core insight is that effective code review requires multiple perspectives. A single LLM call produces shallow feedback. A multi-agent pipeline, where each agent specializes in a specific aspect of review, produces thorough, actionable results.\n\n**The pipeline has four specialized agents:**\n\n1. **Static Analysis Agent** — Runs linters, type checkers, and security scanners to catch deterministic issues before they reach human reviewers.\n2. **Logic Review Agent** — Analyzes the semantic correctness of the code, looking for edge cases, race conditions, and logical errors.\n3. **Style & Consistency Agent** — Enforces coding standards, naming conventions, and architectural patterns defined in the project\'s style guide.\n4. **Summary Agent** — Aggregates feedback from all agents, deduplicates findings, and generates a human-readable review report.\n\n\\\`\\\`\\\`\n┌────────────────────────────────────────────────┐\n│           AI Code Review Pipeline              │\n├────────────────────────────────────────────────┤\n│  PR Opened → Static Analysis → Logic Review    │\n│              → Style Check → Summary → Report   │\n└────────────────────────────────────────────────┘\n\\\`\\\`\\\`\n\nEach agent receives the diff context plus project-specific rules and produces structured output. The summary agent combines them into a single review with severity levels, code references, and suggested fixes.\n\n## Implementing a Dart/Flutter Static Analysis Agent\n\nFor Flutter projects, we start with the deterministic layer. Dart\'s built-in analyzer catches many issues, but we can extend it with custom lint rules for project-specific patterns.\n\n\\\`\\\`\\\`dart\n// lib/tools/code_review/static_analysis_agent.dart\n\nimport \'package:analyzer/dart/analysis/analysis_context.dart\';\nimport \'package:custom_lint_builder/custom_lint_builder.dart\';\n\nclass StaticAnalysisAgent {\n  final AnalysisContext context;\n  final List<LintRule> customRules;\n\n  StaticAnalysisAgent(this.context, this.customRules);\n\n  Future<AnalysisReport> analyzeDiff(List<FileDiff> diffs) async {\n    final findings = <AnalysisFinding>[];\n    \n    for (final diff in diffs) {\n      // Run Dart analyzer on the changed file\n      final errors = await context.getErrors(diff.path);\n      \n      // Run custom lint rules\n      for (final rule in customRules) {\n        final ruleFindings = await rule.check(diff);\n        findings.addAll(ruleFindings);\n      }\n      \n      // Check for security-sensitive patterns\n      findings.addAll(await _checkSecurityPatterns(diff));\n    }\n    \n    return AnalysisReport(findings\n      ..sort((a, b) => a.severity.index.compareTo(b.severity.index)));\n  }\n  \n  Future<List<AnalysisFinding>> _checkSecurityPatterns(FileDiff diff) async {\n    // Check for hardcoded secrets, SQL injection, etc.\n    final findings = <AnalysisFinding>[];\n    final securityPatterns = RegExp(r\'(apiKey|password|secret|token)\\s*[:=]\\s*[\\"\\\']\');\n    \n    for (final line in diff.addedLines) {\n      if (securityPatterns.hasMatch(line)) {\n        findings.add(AnalysisFinding(\n          severity: Severity.error,\n          message: \'Potential secret exposure in added code\',\n          line: diff.getOriginalLine(line),\n          suggestion: \'Use environment variables or a secure config service\',\n        ));\n      }\n    }\n    \n    return findings;\n  }\n}\n\\\`\\\`\\\`\n\nThis agent catches 100% of deterministic issues — things like unused imports, missing null checks, and hardcoded secrets. These are the "easy wins" that should never reach a human reviewer.\n\n## The LLM-Powered Logic Review Agent\n\nFor semantic analysis, we use an LLM agent with a carefully crafted system prompt. The key is to constrain the agent\'s output to a structured format that can be programmatically processed.\n\n\\\`\\\`\\\`typescript\n// src/review/logicReviewAgent.ts\n\ninterface ReviewInput {\n  diff: string;\n  changedFiles: ChangedFile[];\n  commitMessages: string[];\n  projectContext: {\n    framework: string;\n    architecture: string;\n    testingStrategy: string;\n  };\n}\n\ninterface ReviewOutput {\n  summary: string;\n  findings: Finding[];\n  overallAssessment: \'approve\' | \'changes_requested\' | \'needs_discussion\';\n}\n\nasync function reviewWithLLM(input: ReviewInput): Promise<ReviewOutput> {\n  const prompt = \\\`You are a senior software architect reviewing a pull request.\nReview the following diff for logical errors, edge cases, and design concerns.\n\nProject Context:\n- Framework: \\\${input.projectContext.framework}\n- Architecture: \\\${input.projectContext.architecture}\n- Testing Strategy: \\\${input.projectContext.testingStrategy}\n\nFiles Changed:\n\\\${input.changedFiles.map(f => \\\`- \\\${f.path} (\\\${f.additions}+ / \\\${f.deletions}-)\\\`).join(\'\\\n\')}\n\nDiff:\n\\\`\\\`\\\`diff\n\\\${input.diff}\n\\\`\\\`\\\`\n\nFocus on:\n1. Logic errors and edge cases not covered\n2. Concurrency and state management issues\n3. API contract violations\n4. Performance implications of the approach\n5. Missing error handling or validation\n\nReturn findings as a JSON array with: file, line, severity (critical/major/minor), message, suggestion.\nIf no significant issues found, return an empty array.\\\`;\n\n  const response = await callLLM(prompt);\n  return parseReviewResponse(response);\n}\n\\\`\\\`\\\`\n\nThe agent focuses exclusively on what humans are good at: reasoning about whether the code is correct, complete, and well-designed.\n\n## Handling False Positives and Feedback Loops\n\nThe biggest challenge with AI code review is false positives. Nothing frustrates developers more than irrelevant warnings. The solution is a feedback loop:\n\n1. **Weighted confidence scoring** — Each finding includes a confidence score (0-1). Low-confidence findings are demoted to "informational" level.\n2. **Context-aware filtering** — The agent reads \\\`.reviewignore\\\` files and project documentation to understand when patterns are intentionally used.\n3. **Human feedback integration** — When a developer dismisses an AI finding, that feedback is stored and used to tune future reviews for that project.\n\n\\\`\\\`\\\`dart\nclass FeedbackStore {\n  final Map<String, List<DismissedFinding>> _dismissals = {};\n  \n  void recordDismissal(String projectId, DismissedFinding finding) {\n    _dismissals.putIfAbsent(projectId, () => []).add(finding);\n  }\n  \n  bool shouldSuppress(String projectId, Finding finding) {\n    final dismissals = _dismissals[projectId];\n    if (dismissals == null) return false;\n    \n    // Suppress if same finding was dismissed 3+ times\n    return dismissals\n      .where((d) => d.matches(finding))\n      .length >= 3;\n  }\n}\n\\\`\\\`\\\`\n\n## Integration with CI/CD Pipelines\n\nThe final piece is integrating the pipeline into your CI/CD workflow. The pipeline runs on every PR and posts results as a check run:\n\n\\\`\\\`\\\`yaml\n# .github/workflows/ai-code-review.yml\nname: AI Code Review\non: [pull_request]\n\njobs:\n  review:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      \n      - name: Run Static Analysis\n        run: flutter analyze --fatal-infos\n        \n      - name: Run AI Logic Review\n        uses: your-org/ai-review-action@v1\n        with:\n          openai-key: \\\${{ secrets.OPENAI_KEY }}\n          model: gpt-4o-mini\n          confidence-threshold: 0.7\n      \n      - name: Auto-Approve on No Findings\n        if: success()\n        uses: hmarr/auto-approve-action@v3\n        with:\n          github-token: \\\${{ secrets.GITHUB_TOKEN }}\n\\\`\\\`\\\`\n\nThe pipeline automatically approves PRs that pass all checks with no critical findings, while flagging high-risk changes for mandatory human review.\n\n## Measuring Impact\n\nAfter implementing this pipeline on a production Flutter project with 15 developers, we measured:\n\n- **Review cycle time decreased by 62%** — From 28 hours average to 10.6 hours\n- **Static issue detection rate: 100%** — All lintable issues caught before human review\n- **Logic defects caught pre-merge: 3.2x increase** — LLM agent found issues humans missed in 41% of reviews\n- **Developer satisfaction: 73% positive** — Team reported less time on nitpicks, more time on meaningful discussion\n\nThe key metric: **defect escape rate dropped 47%** in the first quarter after deployment.\n\n## Conclusion\n\nAI-powered code review isn\'t about replacing human reviewers — it\'s about amplifying them. By automating the deterministic checks and providing intelligent semantic analysis, we free senior engineers to focus on what truly matters: architectural decisions, design patterns, and mentoring junior developers.\n\nThe multi-agent pipeline approach is production-ready today. Start with static analysis automation, add LLM review for logic checking, and iterate based on your team\'s feedback. Within a quarter, you\'ll wonder how you ever reviewed code without it.\n\n---\n`,
  },
  {
    title: "Flutter State Management Deep Dive: Bloc vs Riverpod vs Provider in 2026",
    excerpt: "A comprehensive comparison of Flutter state management solutions analyzing Bloc, Riverpod, and Provider with practical code examples and performance benchmarks.",
    date: "May 28, 2026",
    tag: "Flutter",
    slug: "flutter-state-management-deep-dive-bloc-vs-riverpod-vs-provider-in-2026",
    content: ""
  },
  {
    title: "AI Model Optimization: Quantization, Distillation, and Efficient Training for Edge Devices",
    excerpt: "Practical techniques for reducing model size and latency through quantization, knowledge distillation, and pruning strategies for mobile and edge deployment.",
    date: "May 28, 2026",
    tag: "AI-Optimization",
    slug: "ai-model-optimization-quantization-distillation-and-efficient-training-for-edge-devices",
    content: ""
  },
  {
    title: "Building Resumable File Uploads in Flutter with Isolates",
    excerpt: "Implement robust file uploads in Flutter with pause-resume capability using Dart isolates for true background processing without UI jank.",
    date: "May 27, 2026",
    tag: "Mobile",
    slug: "building-resumable-file-uploads-in-flutter-with-isolates",
    content: ""
  },
  {
    title: "Android 16: What Senior Developers Need to Know About the Latest APIs",
    excerpt: "Explore the critical new APIs and features in Android 2, including enhanced security, Kotlin Multiplatform support, and adaptive UI components for modern app development.",
    date: "May 27, 2026",
    tag: "Android",
    slug: "android-16-what-senior-developers-need-to-know-about-the-latest-apis",
    content: ""
  },
  {
    title: "AI Agents: Building Autonomous Workflows for Complex Tasks",
    excerpt: "A deep dive into multi-agent architectures, tool integration patterns, and error handling strategies for building production-grade autonomous AI agents.",
    date: "May 26, 2026",
    tag: "AI-Agents",
    slug: "ai-agents-autonomous-workflows-complex-tasks-2026",
    content: ""
  },
  {
    title: "Clean Architecture & Design Patterns in Modern AI Systems: Building Maintainable ML Pipelines",
    excerpt: "Applying clean architecture principles—dependency inversion, repository patterns, and separation of concerns—to machine learning pipeline design for long-term maintainability.",
    date: "May 25, 2026",
    tag: "Clean-Architecture",
    slug: "clean-architecture-design-patterns-modern-ai-systems-building-maintainable-ml-pipelines",
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
  },
];
