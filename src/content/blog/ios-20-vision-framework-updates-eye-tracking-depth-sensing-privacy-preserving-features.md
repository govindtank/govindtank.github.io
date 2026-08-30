---
title: "iOS 20 Vision Framework Updates: Eye Tracking, Depth Sensing, Privacy-Preserving Features"
slug: "ios-20-vision-framework-updates-eye-tracking-depth-sensing-privacy-preserving-features"
date: "August 30, 2026"
excerpt: >
  Apple's iOS 20 Vision Framework adds eye tracking for accessibility, enhanced depth sensing APIs, and on-device processing for privacy. New hand gesture recognition and improved face landmark detection expand sensing ...
coverImage: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1200"
category: "iOS"
readTime: 3
tags:
  - "iOS"
---
# iOS 20 Vision Framework Updates: Eye Tracking, Depth Sensing, Privacy-Preserving Features

## The moment my accessibility prototype broke

I was demoing a gaze-driven navigation prototype at our internal hack day when the eye tracking just stopped. No crash, no error. The cursor froze mid-screen while the camera light stayed on. Three months of work, and the whole thing went silent in front of twelve colleagues. The new VisionKit eye-tracking pipeline I'd been testing since the iOS 20 beta had decided, without warning, to stop delivering observations.

I assumed it was my code. I was wrong.

## What I built and what I assumed

The prototype was simple: use `VNEyeTracker` to let someone with limited motor control navigate a menu using only eye movement. The depth sensing component was supposed to confirm intentional dwell time — if your eyes locked onto a button and your face was at a reasonable distance, it registered a tap.

My assumptions:

- The eye-tracking observation stream would behave like other Vision request handlers — fire continuously while the session ran.
- Depth data from the TrueDepth camera would be available whenever eye tracking was active.
- Privacy prompts would behave like camera permission: ask once, run forever.

Two of those three were wrong.

## The failure and the wrong guesses

The symptom: after roughly 90 seconds of smooth tracking, `VNEyeTrackerObservation` deliveries stopped. The `ARSession` kept running. The camera feed was alive. But the handler closure just... didn't fire.

My first guess was thermal throttling. I checked `ProcessInfo.thermalState` — nominal. Then I thought it was a memory pressure issue, maybe the pixel buffers were piling up. I added `CVPixelBufferPool` flushing, watched allocations in Instruments. Nothing unusual.

The real clue was in the console, buried among Metal logs:

```
[VNEyeTracker] Observation stream suspended: user attention unavailable
```

Not a crash. A deliberate pause. The framework had decided the user wasn't paying attention and cut the stream.

## The debugging path

I dug into the new `VNEyeTracker.Configuration` documentation — specifically the `suspensionBehavior` property. In iOS 20, Apple changed the default from `.deliverLastObservation` to `.suspendOnAttentionLoss`. The framework now monitors attention through a combination of gaze stability and, here's the kicker, depth-based proximity checks.

The depth sensing pipeline was failing silently. The TrueDepth camera was delivering sparse maps, and the eye tracker interpreted low-confidence depth as "user walked away." It suspended rather than deliver potentially stale data.

The aha moment: the privacy-preserving depth feature I'd enabled — `VNEyeTracker.Configuration.privacyMode = .reducedDepthPrecision` — was intentionally degrading depth accuracy on certain device orientations. My prototype held the iPad in landscape, which triggered a lower-confidence depth path. Combine that with the new suspension behavior, and the tracker gave up.

## The fix in code

Two changes. First, I adjusted the configuration to keep delivering observations even when attention is uncertain:

```swift
let config = VNEyeTracker.Configuration()
config.suspensionBehavior = .deliverLastObservation
config.privacyMode = .reducedDepthPrecision
config.minimumConfidenceThreshold = 0.4
```

Second, I added a manual watchdog that detects stale observations and reinitializes the request:

```swift
private var lastObservationTimestamp: Date = .now

func handleObservation(_ observation: VNEyeTrackerObservation) {
    lastObservationTimestamp = .now
    // ... process gaze point
}

func startStaleCheckTimer() {
    Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { _ in
        if Date().timeIntervalSince(self.lastObservationTimestamp) > 3.0 {
            self.restart