<!--EXCERPT-->
I moved a checkout flow into Kotlin Multiplatform and spent a month comparing expect/actual, shared modules, Compose, and FFI. Here is what held up in production.
<!--BODY-->
# Kotlin Multiplatform at Scale: Production Architecture Patterns for Shared Business Logic

I am the person who rewrites working code just to see how it feels. Not to ship it, just to know. So when our Android and iOS apps started drifting apart — same checkout rules, two implementations, two sets of bugs — I did what people like me do: I built a Kotlin Multiplatform prototype over a weekend and showed it to my team on Monday.

Three months later that prototype is in production, and I have opinions about which patterns survive contact with a real app and which ones only look good on a slide. If you are evaluating KMP for a team of four or more mobile engineers, this is the comparison I wish someone had handed me before I started.

Quick context for anyone who has not touched KMP yet: Kotlin Multiplatform compiles shared Kotlin code to Android, iOS, desktop, and web from one source set. The pitch is that business logic — validation, pricing, state machines, network calls — lives in one place while platform-specific code stays thin. That pitch is true. What nobody tells you is that the architecture around the shared code decides whether you end up with a clean shared core or a tangle of platform checks. This post compares the four patterns I actually tried, with the trade-offs I hit, not the ones from the marketing page.

## Why I started moving the logic

Our checkout had drifted the way code drifts when nobody owns it. The Android app computed discounts one way, the iOS app another, and the difference only showed up in customer support tickets months later. We had a shared spec document, which is another way of saying we had two implementations of a moving target. Every rule change touched two codebases, two review processes, and two release trains, so small changes took a week and urgent ones took longer.

I did not want a framework. I wanted one file of rules that both apps called. The weekend prototype was small on purpose: a validation module, a pricing calculator, and a state machine for the checkout steps, all in commonMain, with tests that ran on my laptop in seconds. The Android app picked it up first because the integration path was trivial. iOS took longer, mostly because the team was not sure they wanted Kotlin in their build at all. That hesitation is real and it does not go away; it just gets quieter once the shared code starts catching bugs the native code was shipping.

## The four patterns I actually tried

Over the next few months I tried four ways to organize the shared code. They are not mutually exclusive — I use three of them in production right now — but they answer different questions, and mixing them without thinking is how you get the tangle.

### expect/actual for platform services

expect/actual is the KMP mechanism for declaring something in common code and providing a real implementation per platform. It is precise, it is grep-able, and it is the first thing everyone learns:

```kotlin
// commonMain
expect fun deviceName(): String

// androidMain
actual fun deviceName(): String = Build.MODEL

// iosMain
actual fun deviceName(): String = UIDevice.currentDevice.name
```

I use this for small, stable seams: device info, secure storage access, log sinks. It works because the contract is tiny and the platform implementations are boring. Where it bites is at scale: every actual is a piece of platform code you must maintain, so the pattern only stays cheap if the seam stays small. I tried putting the whole network stack behind expect/actual and regretted it inside two weeks. Too many actuals, too much drift, exactly the thing I was trying to escape. The rule I landed on: if the platform implementation is longer than the declaration, the seam is too big.

### Shared modules with a thin API

This is the pattern I recommend to anyone starting fresh. The shared module exposes a small, typed interface — think methods, not classes — and the UI calls that interface. Platform code implements the edges (storage, network, biometrics) and never reaches into shared internals. Shared code never knows what UI framework is calling it, which means the same module serves a Compose screen, a SwiftUI screen, and a unit test without any of them knowing about the others.

The Gradle side is ordinary:

```kotlin
// shared/build.gradle.kts
kotlin {
    androidTarget()
    iosArm64()
    iosSimulatorArm64()
    sourceSets {
        commonMain.dependencies {
            implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core")
            implementation("io.ktor:ktor-client-core")
        }
    }
}
```

The discipline is the hard part: the API must stay thin. Every convenience method you add to the interface is a promise you now keep on both platforms. I keep a rule that any new method needs a real caller before it gets added. It sounds pedantic. It has saved me from building a second framework by accident, which is the failure mode of shared code done enthusiastically.

### Compose for the UI layer

I am enthusiastic about Compose Multiplatform, and I want to be precise about why. Sharing UI is a different commitment than sharing logic. When you share logic, iOS engineers review Kotlin rules; when you share UI, they review Kotlin layout code, and that is a bigger cultural change than any build file. Budget for it.

For our checkout screens it worked well. Forms, validation states, progress indicators — Compose handled all of it, and the iteration speed of changing one screen and seeing it on both platforms is genuinely nice. What surprised me was how much state management I could share once the UI was shared: the same ViewModel-style logic drove both platforms, and the number of platform-specific branches in the shared UI stayed close to zero. What I would watch closely is rendering parity on iOS. Text metrics and gesture feel still need attention there, and your iOS engineers will have opinions about it. Listen to them.

My honest position: share UI when the screens are form-like and the team is small. Treat it as its own decision with its own timeline, not as a bonus feature of sharing logic. It is a second project, with its own risks, and it deserves to be scheduled like one.

### FFI when you need native speed

The fourth pattern is the escape hatch: keep the hot path native and call it from shared code. KMP exports Kotlin to Objective-C and imports C and C++ libraries, so you can go either direction.

I reached for this exactly once, for a geometry library we already owned in C++. The integration worked, the interop was documented, and the performance was exactly what we expected. The cost was real too: build complexity went up, debugging crossed language boundaries, and two engineers had to learn the interop layer before they could touch the feature. I keep it in my back pocket for the day we need it again. It is not a default; it is an exception that should survive a written justification.

## The trade-offs in one table

| Pattern | What it shares | Main cost | Best when |
|---|---|---|---|
| expect/actual | Small platform seams | One implementation to maintain per platform | Device info, storage, logging |
| Shared module, thin API | Business logic only | Discipline to keep the API thin | Most teams, most apps |
| Compose Multiplatform UI | UI and logic | iOS team reviews Kotlin UI; rendering parity work | Form-heavy screens, small teams |
| FFI and native interop | Hot native paths | Build complexity, cross-language debugging | Existing C++ libraries, heavy math |

## Choose the boring one first

If you are starting today, start with shared modules and a thin API. Add expect/actual for the seams where platforms genuinely differ. Treat Compose UI as a separate decision you revisit after the logic sharing has proven itself. Treat FFI as the exception you write a short justification for.

Scale changes the picture in ways the weekend prototype does not show. With four or more mobile engineers, code review becomes the bottleneck, and shared code multiplies review value: one rules file, reviewed once, fixes both platforms. CI needs to build every target, which is slower than you expect — budget for it and cache aggressively. Binary size grows, and the Kotlin compiler cache fights you on machines with little RAM. None of these are blockers. They are the normal costs of a real codebase, and they are cheaper than two implementations.

Testing is where the pattern pays off hardest. commonTest runs on the JVM in seconds, so the pricing calculator gets a hundred cases in CI without a device farm. I wrote more tests for the shared checkout in a month than both apps had written in the previous year, and the bug reports from support dropped accordingly. That was the moment the iOS team stopped asking why the Kotlin was there.

## What surprised me

Three things, in case you are weighing this decision yourself. First, compilation speed. Kotlin/Native linking for iOS is not fast, and the first clean build of the week is a coffee break. It is annoying, and it is worth it. Second, tooling maturity. The IDE experience for commonMain is good; the experience for the platform-specific source sets is patchier. You will occasionally chase a red squiggle that is just the tooling being wrong. Third, the team dynamics. The biggest risk to a KMP rollout is not technical. It is the iOS engineer who is asked to review Kotlin they did not choose, with deadlines they did not set. Bring them in before the prototype, not after.

## What I would do differently

If I started over tomorrow: write the thin API contract first, before any platform code. Decide what changes together — pricing, validation, checkout state — and share exactly that, nothing else. Prototype Compose UI on a low-stakes screen before promising it to anyone. And keep a short decision log, because three months from now someone will ask why the FFI call exists, and "we tried it and it was fine" is a worse answer than a dated paragraph.

The weekend prototype became production code because it answered a real question cheaply. The architecture around it — thin API, small seams, honest boundaries — is what kept it from becoming the next thing the team quietly rewrites.
