     1|---
     2|title: "AI-Powered Code Review: Automating Quality Gates with LLM Agents"
     3|slug: "ai-powered-code-review-automating-quality-gates-with-llm-agents"
     4|date: "2026-05-29"
     5|excerpt: >
     6|  Combine LLM agents with deterministic static analysis to automate code review pipelines, reduce review cycle time by 62%, and catch defects humans miss. A deep dive into multi-agent architectures, LLM comparison, quality gates, CI/CD integration, cost optimization, and real-world adoption strategies.
     7|coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200"
     8|category: "AI-Engineering"
     9|readTime: 12
    10|tags:
    11|  - "AI"
    12|  - "Code Review"
    13|  - "LLM"
    14|  - "Quality Gates"
    15|---
    16|
    17|# AI-Powered Code Review: Automating Quality Gates with LLM Agents
    18|
    19|Code review remains the most critical — and most bottlenecked — quality gate in the software development lifecycle. Senior engineers spend 6–8 hours per week reviewing pull requests. Studies show human reviewers catch only 35–65% of defects, and the average PR sits open for 28+ hours awaiting review. The gap between the ideal of rigorous peer review and the reality of rushed, inconsistent approvals is enormous.
    20|
    21|AI-powered code review bridges that gap. By combining large language model (LLM) agents with deterministic static analysis tools, we can automate the mechanical aspects of review while freeing human experts to focus on architecture, design trade-offs, and business logic. This post is a comprehensive guide to designing, implementing, and scaling AI code review pipelines — covering architecture patterns, LLM agent selection, quality gate enforcement, CI/CD integration, cost optimization, security, and real-world adoption strategies.
    22|
    23|---
    24|
    25|## AI Code Review Architecture: The Multi-Agent Pipeline
    26|
    27|The core insight behind effective AI code review is that **a single LLM call produces shallow feedback**. A multi-agent pipeline, where each agent specializes in one aspect of review, produces thorough, structured, and actionable results. These agents operate in a directed acyclic graph (DAG), with each stage feeding structured findings to the next.
    28|
    29|```mermaid
    30|flowchart LR
    31|    A["🔀 PR Opened"] --> B["🔍 Static Analysis Agent"]
    32|    A --> C["🧠 Logic Review Agent"]
    33|    A --> D["🎨 Style & Consistency Agent"]
    34|    A --> E["🔒 Security Agent"]
    35|    
    36|    B --> F["⚖️ Conflict Resolver"]
    37|    C --> F
    38|    D --> F
    39|    E --> F
    40|    
    41|    F --> G["📊 Summary Agent"]
    42|    G --> H["✅ Quality Gate Evaluator"]
    43|    
    44|    H --> I["📝 Report Posted to PR"]
    45|    H --> J["🚫 Block / Request Changes"]
    46|    H --> K["✅ Auto-Approve"]
    47|    
    48|    style A fill:#4a90d9,color:#fff
    49|    style G fill:#50b86c,color:#fff
    50|    style H fill:#e8a838,color:#fff
    51|```
    52|
    53|### Agent Responsibilities
    54|
    55|| Agent | Tool / Model | Scope | Output |
    56||-------|-------------|-------|--------|
    57|| **Static Analysis Agent** | ESLint, Pylint, Dart Analyzer, Semgrep | Deterministic issues (syntax, imports, null safety) | `AnalysisFinding[]` with severity levels |
    58|| **Logic Review Agent** | GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 | Semantic correctness, edge cases, concurrency | `Finding[]` with code references + suggestions |
    59|| **Style & Consistency Agent** | LLM + project style guide embeddings | Naming conventions, architectural patterns | `StyleFinding[]` with rule references |
    60|| **Security Agent** | Semgrep, TruffleHog + LLM augmentation | Secrets, injection, OWASP Top 10 patterns | `SecurityFinding[]` with CVSS-like severity |
    61|| **Conflict Resolver** | Deterministic deduplication + priority merge | Overlapping or contradicting findings | Merged, deduplicated `Finding[]` |
    62|| **Summary Agent** | GPT-4o-mini / Claude Haiku | Human-readable report generation | Structured markdown + PR comment |
    63|| **Quality Gate Evaluator** | Policy-as-code engine | Pass/fail decision based on thresholds | `gate: pass | fail | review_needed` |
    64|
    65|### Processing Flow
    66|
    67|1. **PR event triggers** the pipeline via webhook or polling
    68|2. **All leaf agents run in parallel** for maximum throughput
    69|3. **Conflict resolver** merges results, removes duplicates, resolves contradictions (e.g., agent A flags a pattern as "dangerous" while agent B says "intentional per project config")
    70|4. **Summary agent** produces a human-readable report with severity breakdown
    71|5. **Quality gate evaluator** applies policy rules — if critical count > 0, block the PR; if only minors, auto-approve with informational comments
    72|6. **Report is posted** as a PR check run or comment with inline annotations
    73|
    74|---
    75|
    76|## LLM Agents for Code Review: A Head-to-Head Comparison
    77|
    78|Choosing the right LLM for your review pipeline depends on latency budget, cost sensitivity, code context window requirements, and the programming languages you use. Here is a detailed comparison of the four most capable models for code review as of mid-2026.
    79|
    80|| Criterion | Claude 3.5 Sonnet / Opus | GPT-4o / GPT-4o-mini | Codex (o3 / GPT-4.1) | Gemini 2.0 Pro / Flash |
    81||-----------|--------------------------|---------------------|----------------------|------------------------|
    82|| **Context Window** | 200K tokens | 128K tokens | 128K–200K tokens | 1M tokens (Pro), 256K (Flash) |
    83|| **Code Quality** | ⭐⭐⭐⭐⭐ Best for nuanced logic reasoning | ⭐⭐⭐⭐ Excellent, strong on Python/TS | ⭐⭐⭐⭐⭐ Best for code generation & diff analysis | ⭐⭐⭐⭐ Very good for large repos |
    84|| **Structured Output** | Native JSON mode + tool use | JSON mode + function calling | JSON mode + function calling | Schema-guided JSON |
    85|| **Latency (p50)** | 1.2–2.5 s (Sonnet), 3–5 s (Opus) | 0.8–1.5 s (4o-mini), 1.5–3 s (4o) | 1–3 s | 1.5–4 s (Pro), 0.6–1.5 s (Flash) |
    86|| **Cost per 1K reviews** | ~$12–$25 (Sonnet) | ~$8–$18 (4o) / ~$1.50 (4o-mini) | ~$10–$20 | ~$5–$12 (Flash) / ~$15–$30 (Pro) |
    87|| **False Positive Rate** | ~8–12% | ~10–15% | ~9–14% | ~12–18% |
    88|| **Multi-file Review** | Excellent — can analyze full repo structure | Good — handles diff context well | Very Good — trained on code diffs | Very Good — huge context allows full file analysis |
    89|| **Best For** | Architectural review, complex logic | Fast iteration, cost-sensitive teams | Code-gen heavy PRs, refactoring | Large monorepos, documentation |
    90|| **Language Support** | 50+ languages, excellent for Rust/Go/Python | 30+ languages, excellent for Python/TS/Java | 40+ languages, strong for Python/TS/Go | 40+ languages, strong for Python/JS |
    91|
    92|### When to Use Which Model
    93|
    94|- **GPT-4o-mini** is the workhorse for high-volume, cost-sensitive review pipelines. Use it for the Summary Agent and Style Agent where latency matters more than depth.
    95|- **Claude 3.5 Sonnet** is the best choice for the Logic Review Agent when reviewing complex business logic, architectural changes, or concurrent code. Its nuanced reasoning produces fewer false positives.
    96|- **Gemini 2.0 Flash** shines when you need to review massive PRs with hundreds of files — its 1M token context window lets it see the entire codebase in one shot.
    97|- **Codex (o3)** is ideal for refactoring reviews where the model needs to understand code transformation patterns and suggest equivalent implementations.
    98|
    99|### Hybrid Routing Strategy
   100|
   101|A production pipeline should route review requests to different models based on complexity:
   102|
   103|```typescript
   104|// src/routing/reviewRouter.ts
   105|interface ReviewRequest {
   106|  prId: string;
   107|  changedFiles: ChangedFile[];
   108|  totalChanges: number;
   109|  complexity: 'low' | 'medium' | 'high';
   110|}
   111|
   112|function selectModel(request: ReviewRequest): ModelConfig {
   113|  const isSimple = request.complexity === 'low' && request.totalChanges < 50;
   114|  const isLarge = request.totalChanges > 200 || request.changedFiles.length > 30;
   115|  const isComplex = request.complexity === 'high' || request.totalChanges > 100;
   116|
   117|  if (isSimple) {
   118|    return { model: 'gpt-4o-mini', maxTokens: 2048, costPerCall: 0.00015 };
   119|  }
   120|  if (isComplex) {
   121|    return { model: 'claude-3.5-sonnet', maxTokens: 8192, costPerCall: 0.003 };
   122|  }
   123|  if (isLarge) {
   124|    return { model: 'gemini-2.0-flash', maxTokens: 16384, costPerCall: 0.0004 };
   125|  }
   126|  // Medium complexity, moderate size
   127|  return { model: 'gpt-4o', maxTokens: 4096, costPerCall: 0.0025 };
   128|}
   129|```
   130|
   131|This routing strategy alone can reduce overall pipeline costs by **40–60%** while maintaining or improving review quality.
   132|
   133|---
   134|
   135|## Review Pipeline Design Patterns
   136|
   137|Beyond the basic multi-agent architecture, several design patterns have emerged for organizing AI code review pipelines. Each pattern suits different team structures, codebase sizes, and risk tolerances.
   138|
   139|### Pattern 1: Sequential Pipeline (Simple)
   140|
   141|Best for small teams or projects where reviews are low-volume and low-risk.
   142|
   143|```mermaid
   144|flowchart LR
   145|    A["PR Opened"] --> B["Static Analysis"]
   146|    B --> C["LLM Review"]
   147|    C --> D["Summary"]
   148|    D --> E["Human Review"]
   149|    
   150|    style A fill:#4a90d9,color:#fff
   151|    style E fill:#e8a838,color:#fff
   152|```
   153|
   154|- **Pros**: Simple to implement, predictable cost, easy to debug
   155|- **Cons**: No parallel execution, longer total latency
   156|- **When to use**: Teams < 10, PR volume < 20/week, non-critical services
   157|
   158|### Pattern 2: Parallel Agent Pipeline (Scalable)
   159|
   160|Best for high-volume teams that need fast feedback and can invest in infrastructure.
   161|
   162|```mermaid
   163|flowchart TD
   164|    A["PR Webhook"] --> B["Orchestrator"]
   165|    B --> C1["Static Analysis"]
   166|    B --> C2["Security Scan"]
   167|    B --> C3["Logic Agent"]
   168|    B --> C4["Style Agent"]
   169|    C1 --> D["Merge & Deduplicate"]
   170|    C2 --> D
   171|    C3 --> D
   172|    C4 --> D
   173|    D --> E["Quality Gate"]
   174|    E --> F["PR Comment + Check Run"]
   175|    E --> G["Auto-Approve"]
   176|    
   177|    style A fill:#4a90d9,color:#fff
   178|    style D fill:#50b86c,color:#fff
   179|    style E fill:#e8a838,color:#fff
   180|```
   181|
   182|- **Pros**: Fast (all agents run simultaneously), scalable horizontally
   183|- **Cons**: Requires conflict resolution, more complex observability
   184|- **When to use**: Teams 10–50, PR volume 50–200/week, production-critical
   185|
   186|### Pattern 3: Tiered Quality Gate Pipeline (Enterprise)
   187|
   188|Best for regulated environments or large enterprises where different change types have different risk profiles.
   189|
   190|| Tier | Change Type | Gates Required | Human Review |
   191||------|------------|----------------|--------------|
   192|| 🟢 **Tier 3 (Low Risk)** | Documentation, config, tests only | Static analysis + style check | Optional |
   193|| 🟡 **Tier 2 (Medium Risk)** | Feature work, bug fixes | Static analysis + LLM logic + security | Required for major findings |
   194|| 🔴 **Tier 1 (High Risk)** | Auth, payments, data pipeline, infra | Full pipeline + manual review by 2 seniors | Mandatory |
   195|
   196|```yaml
   197|# quality-gates/tiered-policy.yaml
   198|quality_gates:
   199|  tier_3_low_risk:
   200|    triggers:
   201|      changed_files: ["*.md", "*.yml", "*_test.go", "*.spec.ts"]
   202|    required_agents: ["static_analysis", "style"]
   203|    auto_approve: true
   204|    block_on: []
   205|    
   206|  tier_2_medium_risk:
   207|    triggers:
   208|      changed_files_exclude: ["#tier_3_low_risk.triggers.changed_files"]
   209|      changed_lines: 1..500
   210|    required_agents: ["static_analysis", "logic_review", "security"]
   211|    auto_approve: false
   212|    block_on: ["critical", "major"]
   213|    
   214|  tier_1_high_risk:
   215|    triggers:
   216|      paths: ["src/auth/", "src/payments/", "infra/", "deployment/"]
   217|      changed_lines: 0..INF
   218|    required_agents: ["static_analysis", "logic_review", "security", "architecture"]
   219|    auto_approve: false
   220|    block_on: ["critical", "major", "minor"]
   221|    require_human_reviewers: 2
   222|```
   223|
   224|- **Pros**: Granular risk control, efficient resource use
   225|- **Cons**: Complex configuration, requires path-based routing
   226|- **When to use**: Enterprises, regulated industries, platforms with varying risk domains
   227|
   228|### Pattern 4: Agentic Swarm (Experimental)
   229|
   230|Best for organizations exploring cutting-edge multi-agent collaboration.
   231|
   232|```mermaid
   233|flowchart LR
   234|    A["PR"] --> B["Review Coordinator"]
   235|    B --> C1["Critic Agent"]
   236|    B --> C2["Synthesizer Agent"]
   237|    B --> C3["Validator Agent"]
   238|    
   239|    C1 --> D["Debate Round 1"]
   240|    C2 --> D
   241|    C3 --> D
   242|    
   243|    D --> E["Debate Round 2"]
   244|    E --> F["Consensus Agent"]
   245|    F --> G["Final Report"]
   246|    
   247|    style A fill:#4a90d9,color:#fff
   248|    style F fill:#e8a838,color:#fff
   249|```
   250|
   251|Agents critique each other's findings in iterative debate rounds, producing higher-quality reviews at the cost of 2–3x more LLM calls. Early results from research teams show **~20% higher defect detection** compared to single-pass pipelines, but with **~3x latency and cost**.
   252|
   253|---
   254|
   255|## Static Analysis + AI Review: The Hybrid Approach
   256|
   257|The most effective AI code review pipelines are **hybrid** — they combine deterministic static analysis tools with LLM-based semantic review. Each layer covers gaps in the other.
   258|
   259|```mermaid
   260|flowchart TD
   261|    subgraph "Deterministic Layer (Static Analysis)"
   262|        A1["Linters<br/>(ESLint, Pylint, Dart Analyze)"]
   263|        A2["Type Checkers<br/>(TypeScript, mypy, flow)"]
   264|        A3["Security Scanners<br/>(Semgrep, TruffleHog, CodeQL)"]
   265|        A4["Format Checkers<br/>(Prettier, Black, rustfmt)"]
   266|    end
   267|    
   268|    subgraph "Intelligent Layer (LLM Agents)"
   269|        B1["Logic Error Detection"]
   270|        B2["Edge Case Analysis"]
   271|        B3["Design Pattern Review"]
   272|        B4["API Contract Validation"]
   273|    end
   274|    
   275|    subgraph "Combined Output"
   276|        C1["Deduplicated Findings"]
   277|        C2["Severity-Sorted Report"]
   278|        C3["Suggested Fixes"]
   279|    end
   280|    
   281|    A1 --> C1
   282|    A2 --> C1
   283|    A3 --> C1
   284|    A4 --> C1
   285|    B1 --> C1
   286|    B2 --> C1
   287|    B3 --> C1
   288|    B4 --> C1
   289|    C1 --> C2 --> C3
   290|    
   291|    style A1 fill:#4a90d9,color:#fff
   292|    style A2 fill:#4a90d9,color:#fff
   293|    style A3 fill:#4a90d9,color:#fff
   294|    style A4 fill:#4a90d9,color:#fff
   295|    style B1 fill:#50b86c,color:#fff
   296|    style B2 fill:#50b86c,color:#fff
   297|    style B3 fill:#50b86c,color:#fff
   298|    style B4 fill:#50b86c,color:#fff
   299|    style C3 fill:#e8a838,color:#fff
   300|```
   301|
   302|### What Static Analysis Catches Best
   303|
   304|Static analysis tools are **deterministic, fast, and cheap**. They should always run *before* LLM agents to reduce noise:
   305|
   306|| Category | Tool | Issue Types | Cost per PR |
   307||----------|------|-------------|-------------|
   308|| Linting | ESLint, Pylint, RuboCop | Unused imports, variable shadowing, style violations | ~$0.001 |
   309|| Type Checking | TypeScript, mypy, Flow | Type mismatches, null safety violations | ~$0.001 |
   310|| Security | Semgrep, CodeQL, TruffleHog | Hardcoded secrets, SQL injection, XSS | ~$0.005 |
   311|| Formatting | Prettier, Black, rustfmt | Inconsistent formatting, trailing whitespace | ~$0.000 |
   312|
   313|### What LLM Agents Catch Best
   314|
   315|LLMs excel at **semantic understanding** — things that require reasoning:
   316|
   317|- **Missing edge cases**: "This function assumes the list is non-empty but doesn't check for the empty case"
   318|- **Concurrency bugs**: "The shared state `userCache` is accessed without a lock on line 142"
   319|- **API contract violations**: "The method returns `Future<void>` but callers expect the widget to be rebuilt"
   320|- **Performance regressions**: "This nested loop has O(n²) complexity; consider using a hash map"
   321|- **Architectural drift**: "This component bypasses the repository layer and directly calls the data source"
   322|- **Test coverage gaps**: "The new branch on line 89 has no corresponding test case"
   323|
   324|### The Hybrid Pipeline in Practice
   325|
   326|```python
   327|# src/pipeline/hybrid_review.py
   328|class HybridReviewPipeline:
   329|    def __init__(self, static_tools: list[StaticTool], llm_agent: LLMAgent):
   330|        self.static_tools = static_tools
   331|        self.llm_agent = llm_agent
   332|        self.feedback_store = FeedbackStore()
   333|
   334|    async def review(self, pr: PullRequest) -> ReviewReport:
   335|        # Phase 1: Static analysis (parallel, deterministic)
   336|        static_findings = []
   337|        async with asyncio.TaskGroup() as tg:
   338|            tasks = [tg.create_task(tool.run(pr)) for tool in self.static_tools]
   339|        for task in tasks:
   340|            static_findings.extend(task.result())
   341|
   342|        # Phase 2: Suppress known false positives from feedback store
   343|        filtered_static = [
   344|            f for f in static_findings
   345|            if not self.feedback_store.should_suppress(pr.project_id, f)
   346|        ]
   347|
   348|        # Phase 3: LLM review (only on changes not caught by static analysis)
   349|        llm_findings = await self.llm_agent.review(pr)
   350|
   351|        # Phase 4: Merge and deduplicate
   352|        merged = self.merge_findings(filtered_static, llm_findings)
   353|
   354|        # Phase 5: Quality gate evaluation
   355|        gate_result = self.evaluate_gates(merged)
   356|
   357|        return ReviewReport(findings=merged, gate=gate_result)
   358|```
   359|
   360|This hybrid approach reduces LLM costs by **35–50%** because simpler issues are filtered out before they reach the expensive model.
   361|
   362|---
   363|
   364|## Quality Gates: Definition, Thresholds, and Enforcement
   365|
   366|Quality gates are the policy layer that determines whether a PR passes, needs discussion, or is blocked. They codify your team's definition of "done" and "safe."
   367|
   368|### Gate Definition Schema
   369|
   370|```yaml
   371|# gates/review-quality-gates.yaml
   372|version: "2.0"
   373|gates:
   374|  - name: "no_critical_defects"
   375|    description: "No critical-severity findings allowed"
   376|    severity: "blocker"
   377|    rule: "count(critical) == 0"
   378|    auto_approve: false
   379|    
   380|  - name: "major_defect_threshold"
   381|    description: "Fewer than 3 major findings"
   382|    severity: "blocker"
   383|    rule: "count(major) <= 2"
   384|    auto_approve: false
   385|    
   386|  - name: "minor_info_tolerance"
   387|    description: "Minor and info findings are advisory only"
   388|    severity: "warning"
   389|    rule: "true"  # Always passes, but findings are posted
   390|    auto_approve: true
   391|    
   392|  - name: "test_coverage_check"
   393|    description: "New code must have >= 80% test coverage"
   394|    severity: "blocker"
   395|    rule: "coverage_delta >= 0.80"
   396|    auto_approve: false
   397|    
   398|  - name: "security_compliance"
   399|    description: "No OWASP Top 10 violations in changed code"
   400|    severity: "blocker"
   401|    rule: "security_violations == 0"
   402|    auto_approve: false
   403|    
   404|  - name: "no_secrets_exposure"
   405|    description: "No hardcoded credentials or API keys"
   406|    severity: "blocker"
   407|    rule: "secrets_found == 0"
   408|    auto_approve: false
   409|```
   410|
   411|### Enforcement in CI/CD
   412|
   413|The gate evaluator runs after all agents complete and determines the PR check status:
   414|
   415|```python
   416|# src/gates/evaluator.py
   417|from enum import Enum
   418|
   419|class GateVerdict(Enum):
   420|    PASS = "pass"
   421|    BLOCK = "block"
   422|    REVIEW_NEEDED = "review_needed"
   423|
   424|class QualityGateEvaluator:
   425|    def __init__(self, gates: list[QualityGate]):
   426|        self.gates = gates
   427|
   428|    async def evaluate(self, report: ReviewReport) -> GateVerdict:
   429|        for gate in self.gates:
   430|            result = await gate.evaluate(report)
   431|            if gate.severity == "blocker" and not result.passed:
   432|                return GateVerdict.BLOCK
   433|            if gate.severity == "warning" and not result.passed:
   434|                return GateVerdict.REVIEW_NEEDED
   435|        return GateVerdict.PASS
   436|
   437|    async def post_check_run(self, pr: PullRequest, verdict: GateVerdict):
   438|        status = {
   439|            GateVerdict.PASS: "success",
   440|            GateVerdict.BLOCK: "failure",
   441|            GateVerdict.REVIEW_NEEDED: "neutral",
   442|        }[verdict]
   443|        await pr.create_check_run(
   444|            name="AI Code Review Quality Gates",
   445|            status="completed",
   446|            conclusion=status,
   447|            output={
   448|                "title": f"Quality Gates: {verdict.value}",
   449|                "summary": self._generate_summary(verdict),
   450|            }
   451|        )
   452|```
   453|
   454|### Quality Gate Maturity Model
   455|
   456|| Level | Name | Gates | Automation | Human Review |
   457||-------|------|-------|------------|--------------|
   458|| **L1** | Baseline | Linting + no secrets | Auto-comment only | Always required |
   459|| **L2** | Guarded | L1 + no critical/major defects | Auto-block on critical | Required for medium+ risk |
   460|| **L3** | Automated | L2 + test coverage, style compliance | Auto-approve for low risk | Required for high risk |
   461|| **L4** | Autonomous | L3 + architecture drift detection | Auto-approve for medium risk | By exception only |
   462|| **L5** | Predictive | L4 + historical regression prediction | Full auto for known patterns | Architecture-only |
   463|
   464|Most teams should target **L3** within the first quarter of adoption, then evaluate whether L4/L5 make sense for their risk profile.
   465|
   466|---
   467|
   468|## PR Integration: GitHub, GitLab, and Bitbucket
   469|
   470|The pipeline is only useful if it integrates seamlessly into existing developer workflows. Here are concrete implementations for each major platform.
   471|
   472|### GitHub Integration
   473|
   474|GitHub Actions is the most natural integration point. The pipeline runs as a workflow that posts check runs and inline comments.
   475|
   476|```yaml
   477|# .github/workflows/ai-code-review.yml
   478|name: AI Code Review Pipeline
   479|on:
   480|  pull_request:
   481|    types: [opened, synchronize, ready_for_review]
   482|  pull_request_review:
   483|    types: [submitted]  # Re-run when human requests changes
   484|
   485|concurrency:
   486|  group: ai-review-${{ github.event.pull_request.number }}
   487|  cancel-in-progress: true
   488|
   489|env:
   490|  AI_REVIEW_MODEL: claude-3.5-sonnet
   491|  AI_REVIEW_CONFIDENCE: 0.7
   492|  QUALITY_GATES_CONFIG: gates/review-quality-gates.yaml
   493|
   494|jobs:
   495|  static-analysis:
   496|    runs-on: ubuntu-latest
   497|    steps:
   498|      - uses: actions/checkout@v4
   499|      - name: Run ESLint
   500|        run: npx eslint . --format json --output-file eslint-report.json
   501|