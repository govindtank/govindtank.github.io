---
title: "The Evolution of Kotlin Multiplatform in 2026"
slug: "kotlin-multiplatform-evolution-in-2026"
date: "May 29, 2026"
excerpt: >
coverImage: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=1200"
category: "Kotlin-Multiplatform"
readTime: 18
tags:
  - "Kotlin-Multiplatform"
  - "Compose-Multiplatform"
  - "Cross-Platform"
  - "Mobile-Development"
archetype: "opinion"
---
  Kotlin Multiplatform won the shared-logic argument and quietly lost the shared-UI one. That makes it more valuable, not less — if you adopt it for the right reason.
---

# The Evolution of Kotlin Multiplatform in 2026

Here is my position, stated plainly: Kotlin Multiplatform in 2026 is the best answer to a narrower question than its marketing answers. It won shared business logic. It stalled on shared UI. And the teams I have watched succeed with it are the ones who accepted that split on day one instead of fighting it.

I say this as someone who has spent years reviewing architecture decisions, not building hype. I like boring solutions that survive contact with a release cycle, and I am skeptical of anything that promises to write once and run everywhere, because that phrase has a terrible track record. So let me steelman the mainstream view first, because it is not wrong — it is just incomplete.

## The pitch, fairly stated

The argument for Kotlin Multiplatform is genuinely strong. One Kotlin codebase shared across Android and iOS: models, networking, validation, storage, business rules. The language itself is stable and mature. JetBrains declared Kotlin Multiplatform stable for mobile back in late 2023, Compose Multiplatform reached stable on iOS in 2025, and JetBrains ships its own products on the stack. A growing list of well-known companies use it in production. The tooling has come a long way from the early days, and the IDE story on the Android side is excellent.

That is the real pitch, and for a specific layer of your app it is correct. The mistake is the layer.

## Where the shared-logic bet paid off

The layers that actually get shared in 2026 are the boring ones: models, validation, networking with Ktor, local persistence, feature flags, analytics events, offline queues, and the business rules that must not drift between platforms. Pricing calculations, currency and timezone handling, eligibility checks, sync logic — the code where a one-percent divergence between platforms is a support ticket waiting to happen.

This is the sixty percent of an app that nobody demos and everybody maintains. Sharing it means one implementation, one test suite, one source of truth. I have seen teams cut whole categories of bugs just by making the rules impossible to implement differently.

The mechanism is expect/actual, and it is more honest than it gets credit for:

```kotlin
// commonMain
expect fun platformName(): String

// androidMain
actual fun platformName(): String = "Android"

// iosMain
actual fun platformName(): String = "iOS"
```

The platform-specific bits are declared explicitly, not hidden behind magic. A shared repository in commonMain looks like ordinary Kotlin:

```kotlin
// commonMain
class PortfolioRepository(
    private val api: ApiClient,
    private val store: KeyValueStore,
) {
    fun portfolio(): Flow<Portfolio> = flow {
        emit(store.readPortfolio())
        emit(api.fetchPortfolio())
    }
}
```

That is the Kotlin Multiplatform that ships in production. It is not glamorous. It is exactly as valuable as it is boring.

## Where the shared-UI bet stalled

Now the part I keep having to say at architecture reviews: Compose Multiplatform on iOS is a real product, and most teams still should not use it for their whole UI. The stable label is earned in the sense that it does not fall over; it is not earned in the sense that your app will feel native.

The gaps show up exactly where demos do not: complex scrolling performance, text selection, keyboard handling, back gestures, accessibility, and the long tail of platform behaviors that users feel even when they cannot name them. Then there is the design-system problem: shared UI means one design system for both platforms, and if your iOS and Android designs have diverged over the years — they have — somebody pays for the reconciliation. And the people paying are often the iOS engineers, who are now maintaining Kotlin code with Xcode build phases that break in ways nobody on the Android side can debug.

The pattern that actually ships in 2026 is Kotlin Multiplatform for logic plus native UI on each platform. JetBrains' own apps do shared UI; most teams, given a real product with real platform-specific UX, quietly do not. I have watched teams start with shared UI and retreat to native UI within two quarters, keeping the shared layer they built on the way. The shared layer survives. The shared UI rarely does.

## The gaps the keynote skips

The ecosystem gaps are real, and they are the reason I stay skeptical in public.

The expect/actual tax. Every dependency you want in commonMain needs a Kotlin Multiplatform-compatible library or a wrapper you maintain yourself. The popular libraries — Ktor, SQLDelight, the usual suspects — are covered. The long tail of platform SDKs is not, and that tail is where your app's special sauce lives.

Binary compatibility. Kotlin/Native klib artifacts are version-sensitive, and a library compiled for one Kotlin version can break on another. Upgrading Kotlin can mean waiting for your dependencies to catch up, which is a scheduling problem that has no good answer.

Build and debug. Build times are longer than Android-only builds, and debugging Kotlin/Native code on a device is a worse experience than debugging Swift or Kotlin on the JVM. Xcode integration is a build phase you maintain, and it breaks.

People. An iOS engineer who does not read Kotlin is not suddenly productive in commonMain. Somebody owns the shared code, or it rots. In my experience, shared code without a named owner decays faster than platform code, because platform code has a platform team standing on it.

Web. Kotlin/Wasm exists and is interesting, but in 2026 most teams still treat it as a demo target. The mobile story is the real story.

## Who should adopt it in 2026

My practical line is short. Adopt Kotlin Multiplatform when your app has a substantial data layer that must behave identically on both platforms, and when your organization can fund the tooling — the CI, the klib upgrades, the shared-code owner. That describes a lot of real apps: anything with sync, offline, pricing, compliance, or complex validation.

Let me make that concrete with a pattern I have seen work, because abstract advice is what architecture reviews are made of. Take a travel app with offline ticket storage. The Android and iOS clients both need the same booking rules: a seat is holdable for fifteen minutes, a price quote expires when the fare changes, and a refund window closes seventy-two hours before departure. Duplicated, those rules drift. One platform fixes a currency rounding bug and the other does not notice for a quarter. Moved into commonMain, the rules live in one file with one test suite, and the platform teams only argue about the UI on top. I have watched exactly this kind of migration pay for itself inside two release cycles, not because the code was glamorous but because the divergence stopped being possible.

The reverse example is equally instructive. I once reviewed a team that moved its entire onboarding flow into shared Compose because the screens looked identical in the mockup. Three months later they were maintaining platform-specific shims for the keyboard, the back gesture, and the biometric prompt inside a codebase that made all three harder to change. The mockup was the same; the platforms were not. They kept the shared validation layer, which was good, and abandoned the shared UI, which was inevitable. Both outcomes were the correct ones.

Skip it when your app is mostly UI, when your shared logic would fit in one file, or when your team is small enough that the coordination cost of a shared layer exceeds its benefit. I have also seen the counterargument — "our app is all UI, so Kotlin Multiplatform is pointless" — and it is usually right, and admitting it saves everyone a year of tooling debt.

The version of the argument I push back on is the one that treats Kotlin Multiplatform as the first step toward a single codebase. That framing sets expectations the platform does not meet, and unmet expectations are how good technology gets abandoned. Kotlin Multiplatform is a shared-logic library with a very good compiler, not a write-once-run-everywhere platform.

## The honest takeaway

Kotlin Multiplatform has evolved, and the evolution is more interesting than the original promise. It started as "write once, run everywhere," and it has become "write the rules once." That is a downgrade of the slogan and an upgrade of the product. A slogan is cheap; a single source of truth for business logic is worth real money.

My position, in one line: Kotlin Multiplatform in 2026 is a good choice for the boring layers, a risky choice for the UI, and a bad choice for anyone who adopted it for the wrong reason and is now waiting for the tooling to catch up to the dream. The teams winning with Kotlin Multiplatform are not the ones who believed the marketing. They are the ones who drew a hard line at the UI, put their shared logic behind it, and got back to shipping. That is the evolution worth watching, and it is already here.
