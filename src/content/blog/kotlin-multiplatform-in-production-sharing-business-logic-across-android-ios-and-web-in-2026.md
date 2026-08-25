---
title: "Kotlin Multiplatform in Production: Sharing Business Logic Across Android, iOS, and Web in 2026"
slug: "kotlin-multiplatform-in-production-sharing-business-logic-across-android-ios-and-web-in-2026"
date: "July 20, 2026"
excerpt: >
coverImage: "/images/covers/kotlin-multiplatform-in-production-sharing-business-logic-across-android-ios-and-web-in-2026.png"
category: "Kotlin-Multiplatform"
readTime: 6
tags:
  - "Kotlin-Multiplatform"
archetype: "opinion"
---


# Kotlin Multiplatform in Production: Sharing Business Logic Across Android, iOS, and Web in 2026

I've approved Kotlin Multiplatform for three production apps and turned it down for two, and the two rejections taught me more than the three green lights. The pattern that worked every time: share the domain and data layers, keep the UI native. The pattern that failed: teams that tried to share everything, UI included, and spent their sprint budget on interop glue instead of product.

This is my staff-engineer's-eye view of KMP in 2026, and I'm going to be honest about both sides. It's a good tool with a narrow job, and it's worth using for that job. It is not the "write once, run anywhere" promise the conference talks sell.

## What the sales pitch promises

The pitch is genuinely impressive now. Kotlin 2.x ships the K2 compiler, the new memory model has been stable for years, iOS support is well past its beta days, and Compose Multiplatform for iOS went stable in 2025. Kotlin/Wasm gives you a real story for the browser. You can, today, write one module and run it on Android, iOS, and web. I've watched the demo apps run; they're real, and they're fast.

The pitch stops being honest at the word "UI." A demo app with one screen and no platform features proves that Compose Multiplatform renders pixels on an iPhone. It does not prove that your team can ship a production app with HealthKit, push notifications, a custom keyboard, and a full accessibility pass, all through one abstraction. Those are the features that eat teams alive, and the demo never shows them.

## Where I draw the line

My rule after those five projects: share the boring half, keep the shiny half native.

The shared module contains models, validation, business rules, pricing and tax calculations, networking, auth token handling, feature flags, and analytics events. That's the code where behavior must be identical everywhere and where bugs cost real money. A tax rule that differs between Android and iOS is a support ticket factory; a feature flag that behaves differently in the browser is a mystery your customers will find before you do.

The native side keeps UI, navigation, gestures, platform services like HealthKit and CoreML, and accessibility. SwiftUI stays SwiftUI, Jetpack Compose stays Jetpack Compose. Users get platform-native feel for free, and your iOS engineers keep the expertise you hired them for.

A concrete slice of what I put in commonMain:

```kotlin
// commonMain — the part worth sharing
data class Order(val id: String, val items: List<LineItem>, val status: OrderStatus)

interface OrderRepository {
    suspend fun fetch(orderId: String): Result<Order>
}

class OrderTotalsUseCase(private val repo: OrderRepository) {
    suspend fun totals(orderId: String): OrderTotals {
        val order = repo.fetch(orderId).getOrElse { return OrderTotals.empty() }
        return computeTotals(order)
    }
}
```

This is the sweet spot. It's testable once in commonTest, it behaves identically on all three platforms, and it's where the business logic actually lives. The UI just renders what this layer produces.

expect/actual is the escape hatch that makes this split survivable. The clock, the logger, the secure-storage handle, and the random source each get one small actual implementation per platform, and everything else in the shared module stays pure Kotlin. I keep that seam list short on purpose: every expect/actual is a place where the platforms can drift, and I want to be able to count those places on one hand.

## The testing win nobody mentions

The best thing KMP gives you isn't code sharing — it's test sharing. commonTest runs the same suite on the JVM, on iOS simulators, and in the browser, in the same CI pipeline. My pricing-calculator tests went from "trust me, the platforms match" to "proven on every target on every commit." For regulated domains — payments, insurance, healthcare — that single property is worth most of the migration cost by itself.

I hit this concretely last year. A rounding bug in the tax logic shipped to three platforms before anyone noticed the discrepancy, because the three codebases had drifted and nobody ran the same numbers against all three. After the KMP move, that class of bug is structurally impossible: there is one implementation, and it's tested in one place. That's the moment I stopped being a skeptic.

## The costs nobody puts in the demo

Now the honest part, because the demo never shows this either.

Build complexity. You now maintain three toolchains for one language. Gradle builds the shared module and the Android app. Xcode builds the iOS app, plus the framework embedding step — embedAndSignAppleFrameworkForXcode, or SwiftPM integration if you prefer. The web target needs its own JS or Wasm toolchain. Version alignment is a recurring tax: Kotlin, Xcode, Swift, and Compose Multiplatform all move, and when they disagree you get klib compatibility errors that take an afternoon to untangle. The Gradle side is genuinely fine in 2026 — version catalogs and the multiplatform plugin template get you most of the way. The pain lives in the seams between the build systems: a framework name change, a SwiftPM manifest update, or an Xcode upgrade can break the link between the Kotlin build and the app build in ways that only surface at archive time. Your CI needs macOS runners with Xcode installed just to produce the iOS framework, which is a cost most Android-only teams don't see coming.

Binary size. The Kotlin runtime lands in every platform binary, and iOS pays the most. Expect to notice the framework in size reports, and expect to learn about obfuscation, dead-code stripping, and symbol trimming. It's manageable — I've shipped apps that stayed comfortably under store limits — but "it's only a few megabytes" is a sentence people say once, before the first size alert arrives.

iOS interop. This is where the polish ends. suspend functions arrive in Swift as completion handlers unless you configure async/await interop carefully. Result<T> does not cross the bridge cleanly. NSError needs @Throws, careful nullability, and a translation layer. Sealed classes and generic collections land awkwardly. Half your KMP work is writing bridge code like this:

```kotlin
// iosMain — bridging a callback API into the shared suspend interface
class IosOrderRepository(private val api: OrdersApi) : OrderRepository {
    override suspend fun fetch(orderId: String): Result<Order> =
        suspendCoroutine { cont ->
            api.fetchOrder(orderId) { order, error ->
                when {
                    error != null -> cont.resume(Result.failure(toException(error)))
                    order != null -> cont.resume(Result.success(order.toDomain()))
                    else -> cont.resume(Result.failure(IllegalStateException("empty response")))
                }
            }
        }
}
```

That's the real KMP: half the time you write Kotlin, half the time you translate Swift's world into Kotlin's so the shared code can stay clean. Budget for this in your estimates, or it will budget for you.

Web deserves its own sentence. Kotlin/Wasm in 2026 is mature enough for shared domain logic, and I've done it. But the browser shell is still its own beast — JS interop, bundling, and the frontend ecosystem don't disappear because your models are Kotlin. Don't plan to delete your TypeScript team.

## What the skeptics get wrong

I hear two bad takes from both directions, and they're worth clearing up. From the skeptical side: "you're just writing the UI twice anyway, so what did you save?" My answer: the UI was always the part that's supposed to differ. Two native UI codebases are the cost of doing mobile right; the win is that the other sixty percent — the logic, the tests, the rules — is now one codebase instead of three. From the enthusiast side: "the UI sharing is basically there, just wait one more release." I've watched teams wait three releases in a row, and the goalposts keep moving. The UI story improves every year, and every year it still costs more than it returns for a team with real platform requirements.

## When I'd still say no

For all that, I've turned KMP down twice, and I'd do it again in these situations:

- The app is small and the platform teams are separate. Two tiny native codebases beat one shared module plus two bridges.
- The product is the UI — rich gestures, custom design systems, heavy platform APIs like HealthKit or ARKit. Abstraction layers leak, and you'll fight them forever.
- The team doesn't know Kotlin or Gradle. You're not saving complexity, you're relocating it.
- There's a mature native codebase with years of platform-specific behavior. Rewriting it into a shared module is a rewrite, whatever the marketing calls it.

## My rule of thumb

If I'm advising a team today, it's this: share the code where behavior must be identical and where tests pay off — domain models, validation, calculations, networking, auth. Keep UI native. Accept one framework boundary per app and budget for the bridge code. Measure binary size in CI from day one. And if someone proposes Compose Multiplatform for UI, run a two-week spike against your real screens before you commit — the demo is not your app.

KMP in 2026 is a mature tool with a narrow job. Teams that win with it share the boring half and keep the shiny half native. Teams that try to share everything learn why the job is narrow.
