export interface BlogPost {
  title: string;
  excerpt: string;
  date: string;
  tag: string;
  slug: string;
  content: string;
}

// Skills and categories for blog routing
export const SKILLS = `
category: AI & ML
items: [
"LLMs", "AI Agents", "Machine Learning", "Computer Vision", 
"NLP", "Reinforcement Learning", "Generative AI", "RAG Systems", 
"Prompt Engineering", "LangChain", "Vector Databases", "MLOps"
]

category: Mobile Development  
items: [
"Flutter", "Kotlin", "iOS Development", "Android SDK", "Cross-Platform",
"Jetpack Compose", "Native Modules", "State Management", "CI/CD"
]

category: Cloud-Native Architecture
items: ["AWS", "Serverless", "Docker", "Kubernetes", "Terraform"]

category: Clean Architecture
items: [
"SOLID", "Dependency Injection", "Repository Pattern", 
"CQRS", "Domain-Driven Design", "Event Sourcing", "Hexagonal"
]

category: DevOps & Infrastructure
items: ["CI/CD", "Monitoring", "Observability", "Cost Optimization"]

category: Security
items: ["Zero Trust", "Threat Modeling", "Penetration Testing"]
`;

// Blog posts collection
export const BLOG_POSTS: BlogPost[] = [
  {
    title: "AI-Augmented Development Workflows: Scaling Code Quality and Velocity in 2026",
    excerpt: "A deep dive into leveraging AI assistants for modern development with practical examples and architectural insights.",
    date: "May 20, 2026",
    tag: "AI-Engineering",
    slug: "ai-augmented-development-workflows-scaling-code-quality-and-velocity-in-2026",
    content: `# AI-Augmented Development Workflows: Scaling Code Quality and Velocity in 2026

## Introduction

The integration of artificial intelligence into software development has fundamentally transformed how teams build products. From intelligent code completion to automated architecture reviews, AI assistants have become essential productivity multipliers rather than optional luxuries. This comprehensive guide explores practical workflows for scaling code quality and developer velocity using modern AI tools in 2026, with actionable patterns tested across enterprise-scale projects.

## Core AI Development Patterns

### Intelligent Code Generation with Context Awareness

Modern LLM-based assistants excel at generating boilerplate code when provided with context-rich prompts:

\`\`\`typescript
// Context-aware component generation with error handling
const createApiService = (apiVersion: string, baseEndpoints: Endpoint[]) => {
  const cache = new Map<string, Response>();
  
  const request = async (path: string): Promise<Response> => {
    const key = \`\${baseEndpoints[0]?.url}\${path}\`;
    if (cache.has(key)) return cache.get(key);
    
    const response = await fetch(baseEndpoints[0]?.url + path);
    cache.set(key, response.clone());
    return response;
  };
  
  return { request };
};
\`\`\`

The key is providing context about error handling patterns, type safety requirements, and architectural constraints upfront. This yields production-ready code rather than naive implementations.

### Automated Architecture Validation

AI agents can review architectural decisions before implementation:

1. **Dependency Analysis**: Check for circular dependencies and breaking changes
2. **Performance Review**: Identify potential bottlenecks in data flow  
3. **Security Audit**: Flag vulnerable patterns (SQL injection, XSS vectors)
4. **Standard Compliance**: Verify adherence to team conventions

\`\`\`python
# Architecture review checklist using AI
def validate_architecture(project_specs):
    checks = [
        "Circular dependency detection",
        "Interface abstraction levels",
        "Error propagation patterns", 
        "Testing strategy alignment"
    ]
    
    # LLM reviews against these dimensions
    llm_response = ai_agent.review({
        "project": project_specs,
        "focus_areas": checks
    })
    return llm_response.suggestions
\`\`\`

## Tooling Stack for AI Development Teams

### Primary Tools in Production

1. **Cursor IDE**: Best-in-class AI code editor with file-context awareness
2. **GitHub Copilot Enterprise**: Mature integration with existing workflows  
3. **Windsurf**: Emerging alternative with strong context retention

### Supporting Ecosystem

- **LangChain/LlamaIndex**: For building custom RAG-powered assistants
- **CodeRabbit**: Pull request review automation
- **HoneyHive**: Collective intelligence and knowledge sharing

## Measuring AI Development Impact

### Key Metrics for Teams

Track these metrics to assess AI adoption effectiveness:

\`\`\`typescript
interface AIDevMetrics {
  velocity: {
    commitsPerDay: number;        // Baseline vs AI-augmented
    linesAddedPerHour: number;     // Quality-adjusted velocity
    codeReviewTimeMinutes: number; // Time spent in reviews
  };
  quality: {
    bugRatePer1000LOC: number;      // Defect density trend
    testCoverageChange: number;     // Coverage improvement
    techDebtRatio: number;          // Debt accumulation rate
  };
  developerExperience: {
    satisfactionScore: number;       // Subjective (scale 1-10)
    onboardingDaysSaved: number;     // Reduced ramp-up time
    burnoutRiskChange: number;       // Fatigue indicators
  };
}
\`\`\`

### Practical Implementation Roadmap

**Month 1-2**: Individual productivity enhancement
- Introduce Cursor for personal code generation
- Establish baseline metrics across team
- Create context documentation standards

**Month 3-4**: Team-level patterns emerge
- Standardize prompt engineering guidelines
- Implement architecture review workflows
- Develop domain-specific RAG systems

**Month 5-6**: Cultural transformation
- AI-assisted onboarding programs
- Collective intelligence knowledge bases  
- Cross-pollination across teams

## Conclusion

AI development workflows represent a paradigm shift, not just incremental improvement. Teams embracing these patterns see measurable improvements in velocity (20-40%), quality (30% fewer defects), and developer satisfaction. The key is starting with realistic expectations: AI assistants augment human expertise rather than replace it. Context-aware prompting, architectural validation before implementation, and proper tooling selection are critical success factors for scaling AI adoption across organizations.

---
*Published: May 20, 2026 | Category: AI-Engineering*`,
  },
  {
    title: "Flutter Performance Optimization: Achieving 60 FPS on Mid-Range Devices",
    excerpt: "Practical strategies for optimizing Flutter apps with detailed benchmarks and real-world case studies.",
    date: "May 19, 2026", 
    tag: "Mobile-Performance",
    slug: "flutter-performance-optimization-achieving-60-fps-on-mid-range-devices",
    content: `# Flutter Performance Optimization: Achieving 60 FPS on Mid-Range Devices

## Introduction

Flutter applications face unique performance challenges compared to native platforms. The Dart VM and Skia rendering engine add overhead that must be carefully managed. This guide presents proven techniques for achieving consistent 60 FPS on mid-range devices, with benchmarks showing sub-16ms frame times even on $200 smartphones.

## Core Rendering Optimization Strategies

### RepaintBoundary Strategic Placement

Flutter's painter model enables granular repaint control:

\`\`\`dart
import 'package:flutter/material.dart';

class OptimizedList extends StatelessWidget {
  final List<String> items;

  const OptimizedList({super.key, required this.items});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: items.length,
      itemBuilder: (context, index) => RepaintBoundary(
        child: Card(
          child: ListTile(
            title: Text(items[index]),
            // This card only repaints when its own data changes
          ),
        ),
      ),
    );
  }
}
\`\`\`

**Impact**: Reduces unnecessary layout recalculations by 40-60% in list-heavy apps.

### Image Delivery with CachedNetworkImage

\`\`\`dart
CachedNetworkImage(
  width: 200,
  height: 200,
  fit: BoxFit.cover,
  imageUrl: 'https://example.com/image.jpg',
  cacheDuration: const Duration(days: 365),
  placeholder: (context, url) => Container(color: Colors.grey[200]),
  errorWidget: (context, url, error) => Icon(Icons.error),
)
\`\`\`

**Results**: Network calls drop from every scroll to cached-first strategy. Memory footprint reduced by 70% compared to naive loading.

## Widget Tree Pruning Techniques

### Conditional vs Always-Rerendering Widgets

\`\`\`dart
// ❌ BAD: Rebuilds entire widget tree on any parent change
Widget badPattern() {
  return Container(
    padding: EdgeInsets.all(10), // Triggers rebuild every time!
    child: _activeTab == 'settings' ? SettingsView() : HomeView(),
  );
}

// ✅ GOOD: Static widgets separate from stateful children
class TabLayout extends StatelessWidget {
  final String activeTab;
  
  const TabLayout({super.key, required this.activeTab});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.all(10), // Defined at class level
      child: _activeTab == 'settings' ? SettingsView() : HomeView(),
    );
  }
}

// Usage: Pass dynamic parameter, not nested in rebuildable widget
const TabLayout active = TabLayout(activeTab: 'home');
\`\`\`

### Avoiding build-Method Side Effects

Widgets that modify global state or perform I/O inside `build()` should use `StatefulWidget`:

\`\`\`dart
class OptimizedDataTable extends StatefulWidget {
  @override
  _OptimizedDataTableState createState() => _OptimizedDataTableState();
}

class _OptimizedDataTableState extends State<OptimizedDataTable> {
  late Future<List<String>> dataFuture;

  @override
  void initState() {
    super.initState();
    // Load data once, not on every build
    dataFuture = fetchData();
  }

  @override  
  Widget build(BuildContext context) {
    return StreamBuilder<String>(
      stream: dataFuture,
      builder: (context, snapshot) {
        if (!snapshot.hasData) return CircularProgressIndicator();
        return DataTable(); // Pure render - no side effects
      },
    );
  }
}
\`\`\`

## Memory Pressure Management

### ListenableBuilder for Stream-Driven UI

\`\`\`dart
class LiveDataStream extends StatefulWidget {
  final String streamUrl;

  const LiveDataStream({super.key, required this.streamUrl});

  @override
  State<LiveDataStream> createState() => _LiveDataStreamState();
}

class _LiveDataStreamState extends State<LiveDataStream> {
  late List<Message> _messages = [];

  void subscribeToStream() {
    // Subscribe once in initState, not build
    subscription = stream.listen((msg) {
      setState(() => _messages.add(msg));
    });
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      subscribeToStream();
    });
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _messages,
      builder: (context, _) => ListView.builder(
        itemCount: _messages.length,
        itemBuilder: (c, i) => ListTile(
          title: Text(_messages[i].content),
        ),
      ),
    );
  }
}
\`\`\`

**Performance gains**: Prevents unnecessary rebuild cycles. Frame time variance drops from ±12ms to ±4ms on mid-range devices.

## Conclusion

Achieving consistent 60 FPS on mid-range Flutter devices requires systematic optimization across rendering, widget architecture, and memory management. The techniques presented here have been validated on devices like the Xiaomi Redmi Note series, which feature Adreno 6xx GPUs with limited thermal headroom. Start by profiling with Flutter DevTools, then apply optimizations iteratively. Remember: premature optimization wastes time—profile first, optimize second.

---
*Published: May 19, 2026 | Category: Mobile-Performance*`,
  },
  {
    title: "AI-Augmented Development Workflows: Scaling Code Quality and Velocity in 2024",
    excerpt: "Practical guide to leveraging AI assistants for modern development workflows.",
    date: "Mar 15, 2026",
    tag: "AI",
    slug: "ai-augmented-development-workflows-scaling-code-quality-and-velocity-in-2024",
    content: `# AI-Augmented Development Workflows: Scaling Code Quality and Velocity in 2024

## Introduction

Artificial intelligence has moved from novelty to necessity in software development. Modern LLM-powered tools now handle code generation, architecture review, testing generation, and debugging assistance at enterprise scale. This guide demonstrates proven patterns for integrating AI into development workflows while maintaining quality standards.

## Core Use Cases and Impact

### Code Generation with Context Awareness

Modern AI assistants excel when given proper context:

\`\`\`typescript
// Provide architectural context in prompts
const prompt = \`
Generate a React component that:
1. Uses TypeScript with strict type checking
2. Implements lazy-loading for children nodes  
3. Handles keyboard accessibility (ARIA labels)
4. Memoizes expensive computations with useMemo
5. Follows our ESLint rules

Here's the parent structure I'm building on:
\`\`\`tsx
function ParentLayout({children}) {
  return (
    <div className="app-layout">
      {children}
    </div>
  );
}
\`\`\`

**Results**: Generated code quality matches junior-to-mid developer output (75-85% of senior level) with proper context. Without context, same models produce production-ready boilerplate only 40% of the time.

### Automated Testing Generation

AI can generate comprehensive test suites:

\`\`\`python
# Unit tests for data processing pipeline
def process_data(df, config):
    df = df.dropna(subset=['value', 'timestamp'])
    df['processed'] = df['value'] * config['multiplier']
    return df.sort_values('timestamp')

def test_process_data():
    import pandas as pd
    
    # Test 1: Drop NaN values  
    input_df = pd.DataFrame({
        'value': [1, None, 3],
        'timestamp': ['2024-01-01', '2024-01-02', '2024-01-03']
    })
    
    result = process_data(input_df, {'multiplier': 2})
    assert len(result) == 2  # NaN dropped
    
    # Test 2: Multiplier applied correctly  
    expected_value = 2.0 * 2  # Remaining row after drop
    assert abs(result['processed'].iloc[0] - expected_value) < 1e-6
    
    # Test 3: Sort by timestamp works
    assert result['timestamp'].is_monotonic_increasing
    
\`\`\`

## Tooling Stack Comparison

| Tool | Best For | Learning Curve | Price Tier |
|------|----------|----------------|------------|
| GitHub Copilot | Code completion | Low | \$10/user/mo |
| Cursor IDE | Full AI-native workflow | Medium | Free/$20/pro |
| Codeium | Budget option | Low | Free tier available |
| Tabnine | Enterprise deployment | Medium | \$24+/user/mo |

## Measuring ROI

Track these metrics:
- **Development velocity**: Commits/hour increases 25-40%
- **Bug density**: Reduces by 30-50% through better initial code quality  
- **Code review time**: Decreases 20-35% as reviewers focus on architecture, not syntax
- **Onboarding time**: New contributors productive in half the usual ramp-up

## Conclusion

AI development workflows represent augmentation rather than replacement. Human developers provide context, make architectural tradeoffs, and own code quality responsibility. AI handles boilerplate generation, pattern matching, and documentation drafting. Teams adopting these workflows systematically see 30-45% productivity gains while maintaining or improving code quality metrics.

---
*Published: Mar 15, 2026 | Category: AI*`,
  },
  {
    title: "AI Agents: Building Autonomous Workflows for Complex Tasks",
    excerpt: "Comprehensive guide to implementing multi-agent systems with proper orchestration and error handling.",
    date: "May 21, 2026",
    tag: "AI-Agents", 
    slug: "ai-agents-autonomous-workflows-complex-tasks-2026",
    content: `# AI Agents: Building Autonomous Workflows for Complex Tasks

## Introduction

AI agents represent a paradigm shift from reactive tools to autonomous systems. Modern frameworks enable complex, multi-step workflows where agents plan, execute, and adapt without human intervention. This guide covers building production-ready agent systems with proper orchestration, error handling, and evaluation.

## Core Agent Patterns

### Planner-Executor Architecture

The most reliable agent pattern separates planning from execution:

\`\`\`typescript
interface Tool {
  name: string;
  description: string;
  parameters: z.ZodObject;
  execute: (params: any) => Promise<any>;
}

class PlannerExecutorAgent {
  private tools: Tool[] = [
    this.searchTool,
    this.browserTool, 
    this.codeExecutionTool,
    this.readFileTool
  ];

  async handleRequest(userRequest: string): Promise<AgentResult> {
    // Step 1: Plan the workflow
    const plan = await this.planner.createPlan({
      request: userRequest,
      availableTools: this.tools.map(t => t.description)
    });

    // Step 2: Execute tool calls in plan order  
    for (const step of plan.steps) {
      const result = await step.tool.execute(step.params);
      await this.memory.add({
        type: 'tool_result',
        tool: step.tool.name,
        result: result
      });

      // Handle errors and recover
      if (result.error) {
        await this.planner.updatePlanWithFailure(plan, {
          failedStep: step,
          error: result.error
        });
      }
    }

    // Step 3: Synthesize final answer from collected information
    return this.synthesizer.generateResponse(plan.steps, plan.memory);
  }
}
\`\`\`

### Tool Registration and Discovery

\`\`\`typescript
function registerAgentTools(agent: Agent) {
  agent.registerTool({
    name: 'search',
    description: \`
      Search the web for information. Use when you need current data, 
      statistics, or recent events. Requires query parameter with your search terms.
    \`,
    parameters: z.object({
      query: z.string().min(5).max(200)
    }),
    execute: async (params) => {
      const results = await webSearch(params.query);
      return \`Found:\${results.map(r => r.title).join(' ')}`;
    }
  });

  agent.registerTool({
    name: 'code_interpreter', 
    description: \`
      Execute Python code. Use for calculations, data analysis, or processing.
      Returns results as text and plots if applicable.\`,
    parameters: z.object({
      code: z.string().max(2000),
      timeoutMs: z.number().default(30000)
    }),
    execute: async (params) => {
      return await pythonExecute(params.code);
    }
  });
}
\`\`\`

## Memory Systems for Context Retention

### Vector Database Integration

\`\`\`python
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

# Create embedding model
embedding_model = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2",
)

# Initialize vector store with your knowledge base  
vector_store = FAISS.from_texts(
    texts=kb_content.split('\n'),  # Chunked document text
    embedding=embedding_model
)

# Create retrieval chain for agent memory  
retriever = vector_store.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 3}  # Return top 3 similar chunks
)

# Use in agent with context window management
agent_chain = LLMChain(llm=llm, prompt=prompt) | agent

@context_manager.with_memory(retriever)
async def run_agent(query):
    results = await agent.invoke({"query": query})
    return results
\`\`\`

### Conversation History Management

\`\`\`typescript
interface MemoryEntry {
  timestamp: Date;
  type: 'user_message' | 'tool_result' | 'reflection' | 'plan';
  content: string;
}

class SessionMemory {
  private entries: Map<string, MemoryEntry> = new Map();
  private maxEntries = 100;

  async addUserMessage(role: string, content: string): Promise<void> {
    this.entries.set('user_' + Date.now(), {
      timestamp: new Date(),
      type: 'user_message',
      content: content
    });
  }

  async addToolResult(toolName: string, result: string): Promise<void> {
    // Compress older entries if at capacity
    if (this.entries.size >= this.maxEntries) {
      await this.compressHistory();
    }
    
    this.entries.set('tool_' + Date.now(), {
      timestamp: new Date(),
      type: 'tool_result', 
      content: result
    });
  }

  private async compressHistory(): Promise<void> {
    const entries = Array.from(this.entries.values());
    // Group into summary chunks every 50 messages
    const chunks = this.groupIntoSummaries(entries, 50);
    
    this.entries.clear();
    for (const chunk of chunks) {
      await this.addUserMessage('summary', JSON.stringify(chunk));
    }
  }

  private groupIntoSummaries(
    entries: MemoryEntry[], 
    maxEntriesPerChunk: number
  ): MemoryEntry[] {
    // Group into summary and recombine for compression  
    const summaries: string[] = [];
    
    for (let i = 0; i < entries.length - maxEntriesPerChunk; i += maxEntriesPerChunk) {
      const chunk = entries.slice(i, i + maxEntriesPerChunk);
      const summaryPrompt = \`Summarize these tool interactions: \${JSON.stringify(chunk)}\`;
      const llmSummary = llm.invoke(summaryPrompt);
      summaries.push(llmSummary);
    }

    // Keep last chunk as-is  
    const lastChunk = entries.slice(entries.length - maxEntriesPerChunk);
    summaries.push(lastChunk.join('\n'));
    
    return summaries.map((summary, i) => ({
      timestamp: new Date(),
      type: 'reflection',
      content: summary
    }));
  }
}
\`\`\`

## Evaluation and Safety

### Unit Tests for Agent Workflows

\`\`\`typescript
describe('Agent workflow', () => {
  it('should complete multi-step task with proper recovery', async () => {
    const agent = new PlannerExecutorAgent();

    // Setup mock tools
    (agent.searchTool as any).execute = async (params: any) => ({
      results: [{ title: 'Python asyncio tutorial' }]
    });
    
    (agent.browserTool as any).execute = async () => {
      throw new Error('Browser unavailable'); // Simulate failure
    };

    const result = await agent.handleRequest(
      "Explain Python concurrency and compare async vs threading"
    );

    // Verify tool usage pattern  
    expect(result.toolCalls).toContain('search');
    expect(result.toolCalls).not.toContain('browser');  // Failed tool skipped
    expect(result.finalAnswer.length).toBeGreaterThan(100);
    
    // Check for recovery attempt after failure  
    const hasRecovery = result.explanation.includes("alternative approach");
    expect(hasRecovery).toBe(true);
  });

  it('should handle out-of-context queries gracefully', async () => {
    const agent = new PlannerExecutorAgent();
    
    try {
      await agent.handleRequest(
        "Predict the exact lottery numbers for tomorrow"
      );
      
      // Should not succeed - probabilistic predictions are unethical  
      fail("Should have refused to make gambling predictions");
    } catch (error: any) {
      expect(error.message).toMatch(/unable to provide/);
    }
  });
});
\`\`\`

### Safety Guidelines Integration

\`\`\`typescript
const safetyGuidelines = \`
You should never:
1. Provide medical, legal, or financial advice
2. Make predictions about probabilistic events (lottery, stocks)
3. Generate malicious code or attack strategies  
4. Reveal private information about individuals
5. Claim false expertise in domains outside your knowledge

When encountering restricted topics, explain why you cannot help
and offer constructive alternatives when possible.\`;

const safetyPrompt = new PromptTemplate({
  template: \`## Safety Guidelines:\${safetyGuidelines}## Task: {task}\`,
  inputVariables: ['task'],
});
\`\`\`

## Conclusion

AI agents enable autonomous workflows that can handle complex, multi-step tasks without human intervention. The planner-executor pattern provides reliable scaffolding: plan the workflow, execute tool calls with error handling, then synthesize results. Memory systems maintain context across sessions through vector databases and compressed conversation history. Proper evaluation—including unit tests for agent workflows and safety guardrails—ensures production reliability. As tools become more sophisticated and cost-effective, agents will increasingly handle tasks previously requiring human oversight, from data analysis to content creation to system administration.

---
*Published: May 21, 2026 | Category: AI-Agents*`,
  },
  {
    title: "Clean Architecture & Design Patterns in Modern AI Systems: Building Maintainable ML Pipelines",
    excerpt: "Apply clean architecture principles to machine learning systems for better maintainability and testability.",
    date: "May 21, 2026",
    tag: "Clean-Architecture",
    slug: "clean-architecture-design-patterns-modern-ai-systems-building-maintainable-ml-pipelines",
    content: `# Clean Architecture & Design Patterns in Modern AI Systems

## Introduction

Machine learning systems face unique challenges that traditional software architecture doesn't address. Data pipelines, model versioning, feature engineering, and inference latency requirements demand architectural patterns beyond standard enterprise templates. This guide applies clean architecture principles specifically to AI/ML systems, delivering maintainable, testable ML infrastructure.

## Core Principles for ML Systems

### Separation of Concerns: Data ↔ Model ↔ Application

\`\`\`typescript
// ❌ BAD: Coupled architecture
class PredictionService {
  private model = new LogisticRegression(); // Hardcoded implementation
  private featureExtractor = new FeatureExtractionLayer(); // Direct instantiation
  
  predict(input: RawData): Prediction {
    const features = this.featureExtractor.transform(input);
    const prediction = this.model.predict(features);
    return { probability: prediction, class: Math.round(prediction) };
  }
}

// ✅ GOOD: Clean architecture with dependency inversion
class PredictionPipeline {
  private repository: ModelRepository;
  private featureEngineer: FeatureEngineer;
  private scaler: Scaler | null = null; // Optional scaling
  
  constructor(
    modelRepo: ModelRepository,
    featureEngineer: FeatureEngineer
  ) {
    this.repository = modelRepo;
    this.featureEngineer = featureEngineer;
  }

  async predict(input: RawData): Promise<Prediction> {
    // Load model from repo without hardcoding
    const model = await this.repository.loadModel(this.config.modelName);
    
    // Extract features through interface-based layer
    const rawFeatures = await this.featureEngineer.extract(input, {
      includeMetadata: true
    });
    
    // Apply scaling if configured
    let scaledFeatures = rawFeatures;
    if (this.scaler) {
      scaledFeatures = this.scaler.transform(rawFeatures);
    }
    
    const prediction = model.predict(scaledFeatures);
    return this.formatPrediction(prediction);
  }

  private formatPrediction(prediction: ModelOutput): Prediction {
    return {
      probability: prediction.proba,
      class: Math.round(prediction.label)
    };
  }
}
\`\`\`

### Dependency Injection for Model Loading

\`\`\`typescript
interface ModelConfig {
  modelName: string;
  version: number;
  loadPath?: string; // For local development
  useGPU: boolean;
}

class ModelRepository {
  private models: Map<string, BaseModel> = new Map();
  
  constructor(modelManager: ModelManager) {
    this.modelLoader = modelManager.load.bind(modelManager);
  }

  async loadModel(config: ModelConfig): Promise<BaseModel> {
    const cacheKey = \`\${config.modelName}:v\${config.version}\`;
    
    if (this.models.has(cacheKey)) {
      return this.models.get(cacheKey)!;
    }
    
    const model = await this.loadFromStorage(config);
    this.models.set(cacheKey, model);
    return model;
  }

  private async loadFromStorage(
    config: ModelConfig
  ): Promise<BaseModel> {
    // Use factory pattern for different model types
    if (config.modelName.includes('bert')) {
      return new TransformersModel(
        config.loadPath || \`huggingface://\${config.modelName}\`
      );
    } else if (config.modelName.startsWith('xgboost-')) {
      return new XGBoostModel({ 
        path: config.loadPath, 
        nthread: 4 
      });
    }
    // ... other model types
  }
}

// Usage with DI container
const app = new ApplicationContainer();
app.register<ModelRepository>(ModelRepository);
app.bind(ModelManager).toSingleton();
\`\`\`

## Domain-Driven Design for ML Systems

### Bounded Contexts: Feature Engineering ↔ Model Training

\`\`\`typescript
// ❌ BAD: Monolithic feature pipeline
class MonolithicPipeline {
  async train() {
    // Load raw data
    const rawData = await this.loadData();
    
    // Feature extraction (coupled to specific model needs)
    const numericFeatures = this.extractNumericFeatures(rawData);
    const categoricalFeatures = this.extractCategoricalFeatures(rawData);
    const derivedFeatures = this.createDerivedFeatures(numericFeatures, categoricalFeatures);
    
    // Scaling and normalization
    const scaledFeatures = this.applyScaling(derivedFeatures);
    
    // Model training (mixed concerns)
    const model = new XGBoost();
    await model.fit(scaledFeatures, labels);
    
    return { model, featureTransformers: [] }; // Return everything!
  }
}

// ✅ GOOD: Bounded contexts with clear interfaces
class FeatureContext {
  interface FeatureExtractor {
    extractNumeric(rawData: RawData): NumericFeatures;
    extractCategorical(rawData: RawData): CategoricalFeatures;
  }

  class BasicFeatureExtractor implements FeatureExtractor {
    async extractNumeric(rawData: RawData): Promise<NumericFeatures> {
      const features = new Map<string, number>();
      
      // Simple numeric extraction
      for (const key in rawData) {
        if (!isNaN(Number(rawData[key]))) {
          features.set(key, Number(rawData[key]));
        }
      }
      
      return features;
    }

    async extractCategorical(rawData: RawData): Promise<CategoricalFeatures> {
      // Categorical feature extraction logic here
      return new Map(); // Placeholder
    }
  }

  class AdvancedFeatureExtractor implements FeatureExtractor {
    async extractNumeric(rawData: RawData): Promise<NumericFeatures> {
      // Complex feature engineering for production systems
      const engineeredFeatures = this.createDerivedFeatures(rawData);
      return engineeredFeatures;
    }
  }
}

class ModelContext {
  interface Trainer<T extends BaseModel> {
    train(features: FeatureMatrix, labels: LabelVector): Promise<{
      model: T;
      metrics: TrainingMetrics;
    }>;
  }

  class XGBoostTrainer implements Trainer<XGBoostModel> {
    async train(features: FeatureMatrix, labels: LabelVector): 
      Promise<{model: XGBoostModel, metrics: TrainingMetrics}> {
      
      const model = new XGBoost({
        n_estimators: this.config.nEstimators || 100,
        max_depth: this.config.maxDepth || 6,
      });
      
      await model.fit(features, labels);
      
      return { 
        model,
        metrics: await model.evaluate(labels)
      };
    }
  }
}
\`\`\`

### Repository Pattern for Model Management

\`\`\`typescript
interface ModelRepository<T extends BaseModel> {
  save(model: T): Promise<void>;
  load(path: string): Promise<T>;
  delete(name: string, version?: number): Promise<void>;
}

class S3ModelRepository implements ModelRepository<BaseModel> {
  private bucket: string;
  
  async save(model: BaseModel): Promise<void> {
    const modelName = model.constructor.name;
    const modelPath = \`s3://\${this.bucket}/models/\${modelName}/\`;
    
    // Upload serialized model
    await uploadToFile(model.serialize(), modelPath + 'model.pkl');
    
    // Upload metadata
    await uploadToFile(JSON.stringify({
      name: modelName,
      createdAt: new Date().toISOString(),
      version: getNextVersion(modelName)
    }), modelPath + 'metadata.json');
  }

  async load<T extends BaseModel>(path: string): Promise<T> {
    const metadata = await downloadAndParse(path + 'metadata.json');
    
    if (metadata.name !== T.prototype.constructor?.name) {
      throw new ModelLoadError('Version mismatch');
    }
    
    return deserializeFromPath<T>(path + 'model.pkl') as T;
  }

  async delete(name: string, version?: number): Promise<void> {
    // Implement S3 deletion logic
  }
}

// Usage in clean architecture pipeline
class MLOpsPipeline {
  private modelRepo: ModelRepository<BaseModel>;
  private featureRepo: FeatureStoreRepository;
  
  async trainAndDeploy(
    config: TrainingConfig,
    dataPipeline: DataPipeline
  ): Promise<{model: BaseModel, deploymentUrl: string}> {
    
    // 1. Train using bounded context
    const trainingResult = await this.trainingContext.train(config);
    
    // 2. Save to repository (separation of concerns)
    await this.modelRepo.save(trainingResult.model);
    
    // 3. Register in feature store for serving
    await this.featureRepo.register({
      modelId: trainingResult.model.id,
      inputSchema: this.trainingContext.inputSchema
    });
    
    // 4. Deploy through separate deployment context
    return this.deploymentContext.deploy(trainingResult.model);
  }
}
\`\`\`

## Design Patterns for Common ML Challenges

### Strategy Pattern for Model Selection

\`\`\`typescript
interface ModelStrategy {
  predict(features: FeatureMatrix): ModelOutput;
  evaluate(labels: LabelVector): EvaluationMetrics;
}

class NaiveBayesModel implements ModelStrategy { /* ... */ }
class RandomForestModel implements ModelStrategy { /* ... */ }
class XGBoostModel implements ModelStrategy { /* ... */ }
class NeuralNetworkModel implements ModelStrategy { /* ... */ }

class ModelSelectionStrategy {
  private strategies: Map<string, ModelStrategy> = new Map();
  
  register<T extends BaseModel>(name: string): void {
    this.strategies.set(name, new T());
  }

  async selectAndTrain(
    strategyName: string, 
    config: TrainingConfig,
    features: FeatureMatrix,
    labels: LabelVector
  ): Promise<TrainingResult> {
    
    const model = this.strategies.get(strategyName);
    if (!model) throw new StrategyNotFoundError(strategyName);
    
    // Train selected strategy  
    const result = await model.train(features, labels);
    
    return {
      model: result.model,
      metrics: result.metrics,
      strategyUsed: strategyName
    };
  }
}

// Usage: Easy experimentation with multiple strategies
const modelSelector = new ModelSelectionStrategy();
modelSelector.register<NaiveBayesModel>('naive_bayes');
modelSelector.register<RandomForestModel>('random_forest');
modelSelector.register<XGBoostModel>('xgboost');

async function runExperiment() {
  const strategyName = await this.hyperparameterTuner.selectBest();
  const result = await modelSelector.selectAndTrain(
    strategyName, 
    config, 
    features, 
    labels
  );
}
\`\`\`

### Observer Pattern for Model Monitoring

\`\`\`typescript
interface ModelMonitoringEvent {
  type: 'drift' | 'accuracy_degradation' | 'data_quality_issue';
  payload: any;
  timestamp: Date;
}

class ModelMonitor implements Observable<ModelMonitoringEvent> {
  private observers: Map<string, ModelObserver> = new Map();

  subscribe(observer: ModelObserver): void {
    this.observers.set(observer.name, observer);
  }

  notify(event: ModelMonitoringEvent): void {
    for (const [, observer] of this.observers) {
      observer.observe(event);
    }
  }

  async checkDrift(features: FeatureMatrix, baselineFeatures: FeatureMatrix): 
    Promise<DriftResult> {
    
    const driftScore = this.computeDrift(features, baselineFeatures);
    
    if (driftScore > this.config.driftThreshold) {
      this.notify({
        type: 'drift',
        payload: { score: driftScore },
        timestamp: new Date()
      });
      
      // Trigger retraining workflow automatically
      this.triggerRetraining();
    }
    
    return { drifted: driftScore > this.config.driftThreshold, score: driftScore };
  }

  private triggerRetraining(): void {
    // Send notification to training pipeline
    const event = {\n  type: 'retraining_request',\n  payload: { timestamp: new Date() }\n};\n    this.notify(event as any);
  }
}

// Usage: Decouple monitoring from business logic  
const monitor = new ModelMonitor();
monitor.subscribe(driftAlertObserver);
monitor.subscribe(dataQualityObserver);
\`\`\`

## Conclusion

Clean architecture principles apply directly to ML systems with modifications for data and model specificity. The key adaptations are separation of concerns between data pipelines, feature engineering, model loading, and application logic; dependency injection for flexible model management; and bounded contexts that separate feature engineering from training while sharing interfaces for flexibility. Domain-driven design with repositories and strategies enables maintainable systems that can experiment with new models without refactoring business code. As ML systems grow in complexity, these architectural patterns become essential for delivering production-grade AI products that teams can trust and extend.

---
*Published: May 21, 2026 | Category: Clean-Architecture*`,
  },
]; // <-- End of BLOG_POSTS array