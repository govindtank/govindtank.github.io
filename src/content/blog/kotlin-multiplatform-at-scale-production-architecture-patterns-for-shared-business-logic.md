     1|---
     2|title: "Kotlin Multiplatform at Scale: Production Architecture Patterns for Shared Business Logic"
     3|slug: "kotlin-multiplatform-at-scale-production-architecture-patterns-for-shared-business-logic"
     4|date: "July 16, 2026"
     5|excerpt: >
     6|  KMP has matured beyond experimental — here's how to architect a production-grade KMP module hierarchy with dependency injection, multiplatform networking, and Compose Multiplatform UI sharing. Learn from real-world patterns that reduce boilerplate without sacrificing platform-native experience.
     7|coverImage: "https://images.unsplash.com/photo-https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200-8466d9109c0d?auto=format&fit=crop&q=80&w=1200"
     8|category: "Kotlin-Multiplatform"
     9|readTime: 12
    10|tags:
    11|  - "Kotlin-Multiplatform"
    12|  - "Compose-Multiplatform"
    13|  - "Architecture"
    14|  - "Android"
    15|---
    16|
    17|# Kotlin Multiplatform at Scale: Production Architecture Patterns for Shared Business Logic
    18|
    19|By mid-2026, Kotlin Multiplatform (KMP) has firmly established itself as a first-class choice for cross-platform business logic sharing. With Compose Multiplatform reaching stable maturity and KMP toolchain support landing in Android Studio, the ecosystem has crossed the chasm from "promising experiment" to "production workhorse." But with maturity comes responsibility: throwing shared code at a project without deliberate architecture creates a tangled mess that's harder to maintain than separate codebases.
    20|
    21|This post distills patterns I've applied and observed across production KMP deployments — from module organization and dependency injection to networking strategies and the Compose Multiplatform integration dance.
    22|
    23|## Architecture Foundation: The Module Hierarchy
    24|
    25|The most critical architectural decision in a KMP project is module decomposition. A flat module structure leads to circular dependencies and rebuild cascades. The pattern that scales is a layered hierarchy:
    26|
    27|```
    28|project-root/
    29|├── shared/
    30|│   ├── common/                    # Pure Kotlin, no platform deps
    31|│   │   ├── domain/                # Use cases, entities, repository interfaces
    32|│   │   ├── data/                  # Repository implementations, DTOs, mappers
    33|│   │   └── di/                    # Common DI module declarations
    34|│   ├── network/                   # Ktor client + API definitions
    35|│   ├── cache/                     # SQLDelight schemas + local data sources
    36|│   └── platform/                  # expect/actual declarations
    37|├── composeApp/                    # Compose Multiplatform UI module
    38|├── androidApp/                    # Android-specific shell (optional)
    39|└── iosApp/                        # Xcode project wrapper
    40|```
    41|
    42|### Why This Works
    43|
    44|- **`shared/common`** has zero platform dependencies — it's pure Kotlin that compiles to everything. Domain logic lives here and references only interfaces.
    45|- **`shared/network`** depends on Ktor client, which is itself multiplatform. API response models (DTOs) are declared here and mapped to domain entities in the data layer.
    46|- **`shared/cache`** uses SQLDelight for local persistence, generating platform-specific database drivers via expect/actual.
    47|- **`composeApp`** consumes the shared layer but cannot be consumed by it — enforcing strict dependency direction.
    48|
    49|## Dependency Injection with Koin Multiplatform
    50|
    51|Dependency injection in KMP requires a framework that compiles for all targets. Koin has emerged as the pragmatic choice — it's pure Kotlin, has no annotation processing, and its DSL maps cleanly to multiplatform modules.
    52|
    53|```kotlin
    54|// shared/common/di/CommonModule.kt
    55|val commonModule = module {
    56|    single { HttpClient(platformEngine()) }
    57|    
    58|    single<PostRepository> { PostRepositoryImpl(get(), get()) }
    59|    single<AnalyticsRepository> { AnalyticsRepositoryImpl(get()) }
    60|    
    61|    factory { GetFeedUseCase(get(), get()) }
    62|    factory { SyncContentUseCase(get(), get()) }
    63|}
    64|
    65|// shared/common/di/PlatformModule.kt
    66|expect fun platformEngine(): HttpClientEngine
    67|```
    68|
    69|```kotlin
    70|// iosApp/iosDI.kt
    71|actual fun platformEngine(): HttpClientEngine {
    72|    return DarwinClientEngine {
    73|        configureRequest {
    74|            setAllowsCellularAccess(true)
    75|        }
    76|    }
    77|}
    78|
    79|// androidApp/androidDI.kt
    80|actual fun platformEngine(): HttpClientEngine {
    81|    return OkHttpEngine()
    82|}
    83|```
    84|
    85|The key insight: keep DI modules **small and focused**. A single monolithic module declaration becomes impossible to test. Break modules by feature or layer, then compose them at the app entry point.
    86|
    87|## Multiplatform Networking with Ktor
    88|
    89|Ktor is the obvious choice for KMP networking, but its flexibility can lead to inconsistent client configurations. Standardize on a client builder:
    90|
    91|```kotlin
    92|// shared/network/HttpClientFactory.kt
    93|fun createHttpClient(
    94|    engine: HttpClientEngine,
    95|    tokenProvider: TokenProvider,
    96|    jsonConfig: Json
    97|): HttpClient {
    98|    return HttpClient(engine) {
    99|        install(ContentNegotiation) { json(jsonConfig) }
   100|        install(Auth) {
   101|            bearer {
   102|                loadTokens { BearerTokens(tokenProvider.accessToken(), "") }
   103|                refreshTokens {
   104|                    val newToken = tokenProvider.refresh()
   105|                    BearerTokens(newToken, "")
   106|                }
   107|            }
   108|        }
   109|        install(Logging) {
   110|            level = LogLevel.HEADERS
   111|        }
   112|        defaultRequest {
   113|            url(BASE_URL)
   114|            contentType(ContentType.Application.Json)
   115|        }
   116|    }
   117|}
   118|```
   119|
   120|Notice the **configuration injection pattern** — the engine, token provider, and JSON config are all injected rather than hardcoded. This makes the client testable on any platform and swappable for different environments.
   121|
   122|## Compose Multiplatform: Shared UI Done Right
   123|
   124|The Compose Multiplatform story has matured dramatically. As of 2026, you can share 70-80% of your UI code while keeping platform-native feel where it matters.
   125|
   126|### The Hybrid Pattern
   127|
   128|```kotlin
   129|// composeApp/ui/feed/FeedScreen.kt
   130|@Composable
   131|fun FeedScreen(
   132|    viewModel: FeedViewModel = koinInject(),
   133|    onItemClick: (String) -> Unit,
   134|    onPullToRefresh: () -> Unit,
   135|    topBar: @Composable () -> Unit = { DefaultTopBar() },
   136|    pullToRefreshIndicator: @Composable (Boolean) -> Unit = { DefaultPullIndicator(it) }
   137|) {
   138|    Scaffold(topBar = { topBar() }) { padding ->
   139|        PullToRefreshBox(
   140|            isRefreshing = viewModel.isRefreshing,
   141|            onRefresh = onPullToRefresh,
   142|            indicator = pullToRefreshIndicator
   143|        ) {
   144|            LazyColumn(contentPadding = padding) {
   145|                items(viewModel.posts) { post ->
   146|                    PostCard(post, onClick = { onItemClick(post.id) })
   147|                }
   148|            }
   149|        }
   150|    }
   151|}
   152|```
   153|
   154|The slots for `topBar` and `pullToRefreshIndicator` allow platform-specific customization while keeping the core layout and logic shared. On Android, you provide a Material 3 top bar; on iOS, you might provide a UIKit navigation bar wrapper.
   155|
   156|### Navigation
   157|
   158|For navigation, avoid coupling to a single framework. Use a sealed class approach:
   159|
   160|```kotlin
   161|sealed class Screen(val route: String) {
   162|    data object Feed : Screen("feed")
   163|    data class PostDetail(val id: String) : Screen("post/{id}")
   164|    data object Settings : Screen("settings")
   165|}
   166|
   167|// Platform-specific navigation implementation
   168|expect class Navigator {
   169|    fun navigate(screen: Screen)
   170|    fun goBack()
   171|}
   172|```
   173|
   174|This keeps your screen hierarchy defined in shared code while letting each platform handle transitions natively.
   175|
   176|## Testing Strategy
   177|
   178|KMP's multiplatform testing has improved significantly, but you still need discipline:
   179|
   180|```kotlin
   181|// commonTest
   182|class GetFeedUseCaseTest {
   183|    @Test
   184|    fun `feed is sorted by timestamp descending`() = runTest {
   185|        val repo = FakePostRepository().apply {
   186|            addPosts(listOf(post1HourAgo, post2HoursAgo, postNow))
   187|        }
   188|        val useCase = GetFeedUseCase(repo, TestDispatcher())
   189|        
   190|        val feed = useCase()
   191|        
   192|        assertEquals(postNow.id, feed.first().id)
   193|    }
   194|}
   195|```
   196|
   197|Run tests with:
   198|
   199|```bash
   200|./gradlew allTests        # All targets
   201|./gradlew iosSimulatorArm64Test  # iOS only
   202|./gradlew jvmTest        # Fast JVM feedback loop
   203|```
   204|
   205|## Common Pitfalls to Avoid
   206|
   207|### 1. Over-Abstracting the Platform Layer
   208|
   209|It's tempting to wrap every platform API in an expect/actual declaration. Resist this. The more you abstract, the more you're just writing platform code in a shared file. Instead, **push logic down** into common code and leave only genuinely platform-specific surfaces as expect/actual.
   210|
   211|### 2. Ignoring Binary Compatibility
   212|
   213|KMP libraries compile to framework bundles on iOS. Every public API change in your shared module triggers a re-export to the Xcode project. Use `@PublishedApiInternal` and `internal` visibility aggressively to keep the public surface area minimal.
   214|
   215|### 3. Single Source of Truth for State
   216|
   217|State management across platforms is where most KMP projects fracture. Use a unidirectional data flow (UDF) pattern with shared ViewModels:
   218|
   219|```kotlin
   220|class FeedViewModel(
   221|    private val getFeed: GetFeedUseCase,
   222|    private val analytics: AnalyticsRepository
   223|) : ViewModel() {
   224|    private val _state = MutableStateFlow(FeedState.Loading)
   225|    val state: StateFlow<FeedState> = _state.asStateFlow()
   226|    
   227|    fun load() {
   228|        coroutineScope.launch {
   229|            _state.value = FeedState.Loading
   230|            val result = getFeed()
   231|            _state.value = FeedState.Success(result)
   232|            analytics.track("feed_loaded")
   233|        }
   234|    }
   235|}
   236|```
   237|
   238|Both Android and iOS consumers observe the same `StateFlow`, ensuring UI consistency without duplication.
   239|
   240|## Gradle Build Configuration
   241|
   242|A clean build setup pays dividends. Here's a modern KMP Gradle configuration:
   243|
   244|```kotlin
   245|// build.gradle.kts (shared module)
   246|plugins {
   247|    alias(libs.plugins.kotlinMultiplatform)
   248|    alias(libs.plugins.androidLibrary)
   249|    alias(libs.plugins.sqldelight)
   250|}
   251|
   252|kotlin {
   253|    androidTarget {
   254|        compilations.all {
   255|            compileTaskProvider.configure {
   256|                compilerOptions {
   257|                    jvmTarget.set(JvmTarget.JVM_17)
   258|                }
   259|            }
   260|        }
   261|    }
   262|    listOf(iosX64(), iosArm64(), iosSimulatorArm64()).forEach { target ->
   263|        target.binaries.framework {
   264|            baseName = "Shared"
   265|            isStatic = true
   266|        }
   267|    }
   268|    
   269|    sourceSets {
   270|        commonMain.dependencies {
   271|            implementation(libs.koin.core)
   272|            implementation(libs.ktor.client.core)
   273|            implementation(libs.sqldelight.runtime)
   274|        }
   275|        androidMain.dependencies {
   276|            implementation(libs.koin.android)
   277|            implementation(libs.ktor.client.okhttp)
   278|        }
   279|        iosMain.dependencies {
   280|            implementation(libs.ktor.client.darwin)
   281|        }
   282|    }
   283|}
   284|```
   285|
   286|## Conclusion
   287|
   288|KMP isn't just viable for production — it's becoming the default recommendation for teams targeting Android and iOS with shared business logic. The key to success is architectural discipline: clean module boundaries, intentional DI composition, consistent networking patterns, and a pragmatic approach to UI sharing that prioritizes user experience over code reuse percentages.
   289|
   290|Start with a single feature module. Validate your architecture on one cross-cutting concern (networking, caching, or analytics). Then expand iteratively. The teams that succeed with KMP aren't the ones that share the most code — they're the ones that architect boundaries so clearly that sharing becomes a natural consequence of good design.
   291|