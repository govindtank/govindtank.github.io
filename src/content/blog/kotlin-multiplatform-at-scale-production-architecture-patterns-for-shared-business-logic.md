---
title: "Kotlin Multiplatform at Scale: Production Architecture Patterns for Shared Business Logic"
slug: "kotlin-multiplatform-at-scale-production-architecture-patterns-for-shared-business-logic"
date: "July 16, 2026"
excerpt: >
  KMP has matured beyond experimental — here's how to architect a production-grade KMP module hierarchy with dependency injection, multiplatform networking, and Compose Multiplatform UI sharing. Learn from real-world patterns that reduce boilerplate without sacrificing platform-native experience.
coverImage: "https://images.unsplash.com/photo-1515879218367-8466d9109c0d?auto=format&fit=crop&q=80&w=1200"
category: "Kotlin-Multiplatform"
readTime: 12
tags:
  - "Kotlin-Multiplatform"
  - "Compose-Multiplatform"
  - "Architecture"
  - "Android"
---

# Kotlin Multiplatform at Scale: Production Architecture Patterns for Shared Business Logic

By mid-2026, Kotlin Multiplatform (KMP) has firmly established itself as a first-class choice for cross-platform business logic sharing. With Compose Multiplatform reaching stable maturity and KMP toolchain support landing in Android Studio, the ecosystem has crossed the chasm from "promising experiment" to "production workhorse." But with maturity comes responsibility: throwing shared code at a project without deliberate architecture creates a tangled mess that's harder to maintain than separate codebases.

This post distills patterns I've applied and observed across production KMP deployments — from module organization and dependency injection to networking strategies and the Compose Multiplatform integration dance.

## Architecture Foundation: The Module Hierarchy

The most critical architectural decision in a KMP project is module decomposition. A flat module structure leads to circular dependencies and rebuild cascades. The pattern that scales is a layered hierarchy:

```
project-root/
├── shared/
│   ├── common/                    # Pure Kotlin, no platform deps
│   │   ├── domain/                # Use cases, entities, repository interfaces
│   │   ├── data/                  # Repository implementations, DTOs, mappers
│   │   └── di/                    # Common DI module declarations
│   ├── network/                   # Ktor client + API definitions
│   ├── cache/                     # SQLDelight schemas + local data sources
│   └── platform/                  # expect/actual declarations
├── composeApp/                    # Compose Multiplatform UI module
├── androidApp/                    # Android-specific shell (optional)
└── iosApp/                        # Xcode project wrapper
```

### Why This Works

- **`shared/common`** has zero platform dependencies — it's pure Kotlin that compiles to everything. Domain logic lives here and references only interfaces.
- **`shared/network`** depends on Ktor client, which is itself multiplatform. API response models (DTOs) are declared here and mapped to domain entities in the data layer.
- **`shared/cache`** uses SQLDelight for local persistence, generating platform-specific database drivers via expect/actual.
- **`composeApp`** consumes the shared layer but cannot be consumed by it — enforcing strict dependency direction.

## Dependency Injection with Koin Multiplatform

Dependency injection in KMP requires a framework that compiles for all targets. Koin has emerged as the pragmatic choice — it's pure Kotlin, has no annotation processing, and its DSL maps cleanly to multiplatform modules.

```kotlin
// shared/common/di/CommonModule.kt
val commonModule = module {
    single { HttpClient(platformEngine()) }
    
    single<PostRepository> { PostRepositoryImpl(get(), get()) }
    single<AnalyticsRepository> { AnalyticsRepositoryImpl(get()) }
    
    factory { GetFeedUseCase(get(), get()) }
    factory { SyncContentUseCase(get(), get()) }
}

// shared/common/di/PlatformModule.kt
expect fun platformEngine(): HttpClientEngine
```

```kotlin
// iosApp/iosDI.kt
actual fun platformEngine(): HttpClientEngine {
    return DarwinClientEngine {
        configureRequest {
            setAllowsCellularAccess(true)
        }
    }
}

// androidApp/androidDI.kt
actual fun platformEngine(): HttpClientEngine {
    return OkHttpEngine()
}
```

The key insight: keep DI modules **small and focused**. A single monolithic module declaration becomes impossible to test. Break modules by feature or layer, then compose them at the app entry point.

## Multiplatform Networking with Ktor

Ktor is the obvious choice for KMP networking, but its flexibility can lead to inconsistent client configurations. Standardize on a client builder:

```kotlin
// shared/network/HttpClientFactory.kt
fun createHttpClient(
    engine: HttpClientEngine,
    tokenProvider: TokenProvider,
    jsonConfig: Json
): HttpClient {
    return HttpClient(engine) {
        install(ContentNegotiation) { json(jsonConfig) }
        install(Auth) {
            bearer {
                loadTokens { BearerTokens(tokenProvider.accessToken(), "") }
                refreshTokens {
                    val newToken = tokenProvider.refresh()
                    BearerTokens(newToken, "")
                }
            }
        }
        install(Logging) {
            level = LogLevel.HEADERS
        }
        defaultRequest {
            url(BASE_URL)
            contentType(ContentType.Application.Json)
        }
    }
}
```

Notice the **configuration injection pattern** — the engine, token provider, and JSON config are all injected rather than hardcoded. This makes the client testable on any platform and swappable for different environments.

## Compose Multiplatform: Shared UI Done Right

The Compose Multiplatform story has matured dramatically. As of 2026, you can share 70-80% of your UI code while keeping platform-native feel where it matters.

### The Hybrid Pattern

```kotlin
// composeApp/ui/feed/FeedScreen.kt
@Composable
fun FeedScreen(
    viewModel: FeedViewModel = koinInject(),
    onItemClick: (String) -> Unit,
    onPullToRefresh: () -> Unit,
    topBar: @Composable () -> Unit = { DefaultTopBar() },
    pullToRefreshIndicator: @Composable (Boolean) -> Unit = { DefaultPullIndicator(it) }
) {
    Scaffold(topBar = { topBar() }) { padding ->
        PullToRefreshBox(
            isRefreshing = viewModel.isRefreshing,
            onRefresh = onPullToRefresh,
            indicator = pullToRefreshIndicator
        ) {
            LazyColumn(contentPadding = padding) {
                items(viewModel.posts) { post ->
                    PostCard(post, onClick = { onItemClick(post.id) })
                }
            }
        }
    }
}
```

The slots for `topBar` and `pullToRefreshIndicator` allow platform-specific customization while keeping the core layout and logic shared. On Android, you provide a Material 3 top bar; on iOS, you might provide a UIKit navigation bar wrapper.

### Navigation

For navigation, avoid coupling to a single framework. Use a sealed class approach:

```kotlin
sealed class Screen(val route: String) {
    data object Feed : Screen("feed")
    data class PostDetail(val id: String) : Screen("post/{id}")
    data object Settings : Screen("settings")
}

// Platform-specific navigation implementation
expect class Navigator {
    fun navigate(screen: Screen)
    fun goBack()
}
```

This keeps your screen hierarchy defined in shared code while letting each platform handle transitions natively.

## Testing Strategy

KMP's multiplatform testing has improved significantly, but you still need discipline:

```kotlin
// commonTest
class GetFeedUseCaseTest {
    @Test
    fun `feed is sorted by timestamp descending`() = runTest {
        val repo = FakePostRepository().apply {
            addPosts(listOf(post1HourAgo, post2HoursAgo, postNow))
        }
        val useCase = GetFeedUseCase(repo, TestDispatcher())
        
        val feed = useCase()
        
        assertEquals(postNow.id, feed.first().id)
    }
}
```

Run tests with:

```bash
./gradlew allTests        # All targets
./gradlew iosSimulatorArm64Test  # iOS only
./gradlew jvmTest        # Fast JVM feedback loop
```

## Common Pitfalls to Avoid

### 1. Over-Abstracting the Platform Layer

It's tempting to wrap every platform API in an expect/actual declaration. Resist this. The more you abstract, the more you're just writing platform code in a shared file. Instead, **push logic down** into common code and leave only genuinely platform-specific surfaces as expect/actual.

### 2. Ignoring Binary Compatibility

KMP libraries compile to framework bundles on iOS. Every public API change in your shared module triggers a re-export to the Xcode project. Use `@PublishedApiInternal` and `internal` visibility aggressively to keep the public surface area minimal.

### 3. Single Source of Truth for State

State management across platforms is where most KMP projects fracture. Use a unidirectional data flow (UDF) pattern with shared ViewModels:

```kotlin
class FeedViewModel(
    private val getFeed: GetFeedUseCase,
    private val analytics: AnalyticsRepository
) : ViewModel() {
    private val _state = MutableStateFlow(FeedState.Loading)
    val state: StateFlow<FeedState> = _state.asStateFlow()
    
    fun load() {
        coroutineScope.launch {
            _state.value = FeedState.Loading
            val result = getFeed()
            _state.value = FeedState.Success(result)
            analytics.track("feed_loaded")
        }
    }
}
```

Both Android and iOS consumers observe the same `StateFlow`, ensuring UI consistency without duplication.

## Gradle Build Configuration

A clean build setup pays dividends. Here's a modern KMP Gradle configuration:

```kotlin
// build.gradle.kts (shared module)
plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.androidLibrary)
    alias(libs.plugins.sqldelight)
}

kotlin {
    androidTarget {
        compilations.all {
            compileTaskProvider.configure {
                compilerOptions {
                    jvmTarget.set(JvmTarget.JVM_17)
                }
            }
        }
    }
    listOf(iosX64(), iosArm64(), iosSimulatorArm64()).forEach { target ->
        target.binaries.framework {
            baseName = "Shared"
            isStatic = true
        }
    }
    
    sourceSets {
        commonMain.dependencies {
            implementation(libs.koin.core)
            implementation(libs.ktor.client.core)
            implementation(libs.sqldelight.runtime)
        }
        androidMain.dependencies {
            implementation(libs.koin.android)
            implementation(libs.ktor.client.okhttp)
        }
        iosMain.dependencies {
            implementation(libs.ktor.client.darwin)
        }
    }
}
```

## Conclusion

KMP isn't just viable for production — it's becoming the default recommendation for teams targeting Android and iOS with shared business logic. The key to success is architectural discipline: clean module boundaries, intentional DI composition, consistent networking patterns, and a pragmatic approach to UI sharing that prioritizes user experience over code reuse percentages.

Start with a single feature module. Validate your architecture on one cross-cutting concern (networking, caching, or analytics). Then expand iteratively. The teams that succeed with KMP aren't the ones that share the most code — they're the ones that architect boundaries so clearly that sharing becomes a natural consequence of good design.
