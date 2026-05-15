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
export const BLOG_POSTS: BlogPost[] = [
{
    title: `AI-Augmented Development Workflows: Architecting the Future of Software Engineering`,
    excerpt: `The pace of software delivery has accelerated beyond the capacity of traditional toolchains alone. Developers are no longer just writing code; they are orchestrating complexity within a cloud-native ecosystem where latency matters and budgets are tig`,
    date: `May 15, 2026`,
    tag: `AI`,
    slug: `ai-augmented-development-workflows-architecting-the-future-of-software-engineering`,
    content: `

# AI-Augmented Development Workflows: Architecting the Future of Software Engineering

The pace of software delivery has accelerated beyond the capacity of traditional toolchains alone. Developers are no longer just writing code; they are orchestrating complexity within a cloud-native ecosystem where latency matters and budgets are tight. Recent advancements in Large Language Models (LLMs) have shifted AI from a passive chatbot to an active architectural partner. However, simply prompting "write this function" is not enough for senior engineers. We are witnessing a paradigm shift where AI-Augmented Development Workflows must be rigorously integrated into the SDLC to ensure quality, security, and scalability. In 2024, the competitive advantage lies not in who has access to tokens, but in how effectively your architecture embeds intelligence into every stage of development. This post explores moving beyond automation toward intelligent orchestration.

## From Copilot to Co-Architect: The Shift in Coding Dynamics

The initial excitement around AI code generation focused on syntax completion. Today, the value lies in architectural reasoning and pattern recognition. As a lead architect, my role has evolved from designing static system diagrams to curating dynamic learning loops within our CI/CD pipelines. We are moving away from simple text prediction toward agentic workflows where the system proposes, tests, and iterates logic autonomously under guardrails.

Consider the traditional loop: Write Code -> Compile -> Deploy. In an AI-Augmented workflow, it becomes: Analyze Context -> Synthesize Logic -> Generate Tests -> Validate Security -> Deploy. This requires integrating LLM calls directly into IDE plugins or build scripts. Here is a Python example of how we might orchestrate a refactoring task using a local model with guardrails to ensure business logic remains untouched during automated generation:

\`\`\`python
import os
from langchain_community.llms import HuggingFaceHub
from langchain.agents import AgentType, initialize_agent, Tool

def refactor_function_safely(file_path, function_name):
    llm = HuggingFaceHub(repo_id="HuggingFaceH4/zephyr-7b-beta")
    
    # Define a tool for safe refactoring with strict constraints
    tools = [
        {
            "type": "function", 
            "function": {
                "name": "safe_refactor",
                "description": "Refactors code but strictly preserves existing imports and core logic.",
                "parameters": {"type": "object", ...} 
            }
        }
    ]

    agent = initialize_agent(
        tools, 
        llm, 
        agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
        verbose=True
    )
    
    # Execute with context awareness
    response = agent.run(
        f"Refactor the function '{function_name}' in {file_path} to improve O(n^2) loops."
    )
    return response
\`\`\`

This example demonstrates that raw generation is insufficient. We define \`tools\` and constraints within the orchestrator to prevent "hallucinated imports." The architecture must enforce that the LLM understands the domain ontology, not just syntactic sugar.

## Integrating AI into Mobile and Cloud Pipelines

For mobile-first teams building with Flutter or Kotlin, AI integration isn't just about generating boilerplate; it's about optimizing asset pipelines and cloud connectivity. We treat the model layer as a microservice within our Kubernetes clusters. Imagine an architecture where your CI/CD pipeline includes an "AI Quality Gate" before deployment occurs.

\`\`\`mermaid
graph TD
    A[Dev Code Commit] --> B{AI Linter Agent}
    B -- Fail --> C[Reject with Explanation]
    B -- Pass --> D[Static Analysis + Unit Tests]
    D -- Fail --> E[Auto-Generate Fixes?]
    E -- Yes --> F[LLM Refactor Loop]
    E -- No --> G[Notify Lead Architect]
    F --> H[Deploy to Staging]
    H --> I[Canary AI-Monitoring]
\`\`\`

In this conceptual model, the \`AI Quality Gate\` (Node B) does not just check syntax; it analyzes code against semantic best practices learned from historical production logs. For a Flutter team, this agent can proactively suggest state management patterns that align with your cloud backend's event-driven architecture before the developer even runs a test build.

In Kotlin, we can embed these checks into Gradle tasks:

\`\`\`kotlin
tasks.register("aiReview") {
    doLast {
        // Invoke model to review code complexity and security
        val analysis = openAiClient.analyze(artifacts.get()) 
        if (analysis.hasCriticalVulnerabilities) {
            throw BuildException("AI Review Failed: High Security Risk Detected")
        }
    }
}
\`\`\`

By embedding this into \`build.gradle\`, we shift left the intelligence, catching issues like unsafe API endpoints in Flutter services before they reach production. The cloud-native architecture scales the LLM inference across containers, ensuring that analysis costs are amortized effectively across hundreds of commits per day.

## Managing Risk: Hallucinations, Security, and Human-in-the-Loop

Adopting AI-Augmented workflows introduces significant architectural risk if handled carelessly. The "black box" nature of generative models conflicts with the deterministic requirements of banking-grade applications or medical software. Therefore, every workflow must include a Human-in-the-Loop (HITL) pattern. You cannot automate decision-making without an audit trail.

The architecture must be Observability-first. We implement structured logging that captures:
1.  **The Prompt:** What context was fed to the model?
2.  **The Generation:** What code or text was produced?
3.  **The Decision:** Did the developer accept or reject the change?

This data feeds back into a Retrieval-Augmented Generation (RAG) system, allowing the AI to learn from rejected changes within your organization’s specific tech stack. Security-wise, we treat generated code as untrusted input by default. We must sanitize any AI-generated payloads that interact with user data. Furthermore, cost management is crucial; unbounded token usage in cloud pipelines can bankrupt a dev budget quickly. Implementing strict token limits and using smaller models for syntax tasks while reserving larger context-aware models for architectural reviews is essential.

The future belongs to hybrid intelligence—where the AI handles the drudgery of boilerplate and regex parsing, while the architect focuses on system design and ethical governance. By treating AI as a distinct component in your microservices architecture, you gain control rather than letting it consume you. The goal is not replacement, but augmentation that allows senior engineers to focus on solving business problems rather than fighting the compiler.`
  },
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