#!/usr/bin/env python3
"""Generate expanded TOPICS list for automation_enhanced_v2.py"""
import json
import re

# Load history and count unique blogs
with open('/Users/govind/workspace/portfolio-src/data/blogs-history/blog_history.json') as f:
    history = json.load(f)

existing_slugs = set(history['blogs'].keys())

print(f"Total blogs in history: {len(existing_slugs)}")
print(f"Existing slugs (sample): {list(existing_slugs)[:5]}...")

# New high-quality topics across different categories
NEW_TOPICS = [
    {
        "title": "Building Micro-Frontend Architectures with Module Federation",
        "slug": "micro-frontend-architecture-module-federation-web-components"
    },
    {
        "title": "Kotlin Coroutines Deep Dive: Advanced Patterns for Concurrency",
        "slug": "kotlin-coroutines-deep-dive-advanced-concurrency-patterns"
    },
    {
        "title": "Implementing Event Sourcing with CQRS in Production Systems",
        "slug": "event-sourcing-cqrs-production-systems-scalability"
    },
    {
        "title": "Flutter Native Platform Channels: Performance vs Abstraction Tradeoffs",
        "slug": "flutter-native-platform-channels-performance-abstraction"
    },
    {
        "title": "Building Reactive Data Flows with Kotlin Flow in Android Apps",
        "slug": "reactive-data-flows-kotlin-flow-android-streams"
    },
    {
        "title": "Optimizing Android GPU Rendering for High-Performance Animations",
        "slug": "android-gpu-rendering-high-performance-animations-skia"
    },
    {
        "title": "Implementing Circuit Breaker Pattern with Resilience4j in Microservices",
        "slug": "circuit-breaker-pattern-resilience4j-microservices-retry-strategy"
    },
    {
        "title": "Building Feature Flags Infrastructure for Gradual Rollouts",
        "slug": "feature-flags-infrastructure-gradual-rollouts-canary-deployments"
    },
    {
        "title": "Advanced Dependency Injection Patterns in Modern Android Architecture",
        "slug": "advanced-dependency-injection-android-hilt-koin-scopes"
    },
    {
        "title": "Implementing GraphQL Federation with Apollo and Hasura",
        "slug": "graphql-federation-apollo-hasura-distributed-data-graphql"
    },
    {
        "title": "Building Real-Time Collaboration Features with CRDTs",
        "slug": "real-time-collaboration-crds-content-replication-conflict-resolution"
    },
    {
        "title": "Implementing Blue-Green Deployment with Zero Downtime",
        "slug": "blue-green-deployment-zero-downtime-strategies-canary-releases"
    },
    {
        "title": "Building Multi-Tenant SaaS Architecture with Data Isolation",
        "slug": "multi-tenant-saas-architecture-data-isolation-strategies"
    },
    {
        "title": "Advanced Android Jetpack Compose: Performance Optimization Techniques",
        "slug": "advanced-jetpack-compose-performance-optimization-gc-memleaks"
    },
    {
        "title": "Implementing Distributed Tracing with OpenTelemetry in Python Services",
        "slug": "distributed-tracing-opentelemetry-python-microservices-monitoring"
    }
]

# Filter out any slugs that already exist
def slugify(title):
    return re.sub(r'-+', '-', title.lower().replace(' ', '-').replace('_', '-').strip('-'))

available_topics = []
for topic in NEW_TOPICS:
    new_slug = topic["slug"]
    computed_slug = slugify(topic["title"])
    
    # Check both stored and computed slugs against existing ones
    if new_slug not in existing_slugs and computed_slug not in existing_slugs:
        available_topics.append(topic)

print(f"\nNew topics to add (avoiding duplicates): {len(available_topics)}")
for t in available_topics:
    print(f"  ✓ {t['title']} ({t['slug']})")

# Create the full TOPICS list combining old and new
OLD_TOPICS = [
    {"title": "Flutter State Management Deep Dive", "slug": "flutter-state-management-deep-dive-bloc-vs-riverpod-vs-provider-2026"},
    {"title": "Android 16 Security APIs", "slug": "android-16-security-apis-senior-developers-migration-guide"},
    {"title": "AI Agents Architecture", "slug": "multi-agent-ai-systems-architecture-communication-orchestration"},
    {"title": "Clean Architecture ML Pipelines", "slug": "clean-architecture-patterns-modern-ml-pipelines-production"},
    {"title": "Flutter Performance Optimization", "slug": "flutter-performance-optimization-60-fps-mid-range-devices"}
]

FULL_TOPICS = OLD_TOPICS + available_topics

print(f"\n=== Full TOPICS list ({len(FULL_TOPICS)} topics) ===")
for t in FULL_TOPICS:
    print(f'    {{"title": "{t["title"]}", "slug": "{t["slug"]}"}},')
