---
title: "Validating Mobile Numbers the Right Way: Introducing country_mobile_validator"
slug: "validating-mobile-numbers-right-way-country-mobile-validator"
date: "August 6, 2026"
excerpt: >
  Stop guessing phone number lengths. Stop sending OTPs to toll-free numbers.
  country_mobile_validator gives you real per-country mobile length ranges,
  OTP-safe verdicts, and country_code_picker integration — in one line of code.
category: Flutter
tags:
  - Flutter
  - Dart
  - MobileValidation
  - PhoneNumber
  - pubdev
coverImage: ""
readTime: 8
---

If you've ever built a login or signup form with a phone field, you've probably hit this wall: **how do you validate a mobile number properly?**

Most packages just check "is this a valid phone number?" and return `true`/`false`. They don't tell you:
- Is it actually a **mobile** number (not toll-free, landline, or premium)?
- What's the **real length range** for this country? (Argentina = 10–11, New Zealand = 8–10, India = 10)
- Can you safely send an **OTP** to this number?

That's why I built **`country_mobile_validator`** — a pure-Dart library that knows the real mobile length ranges for all 247 mobile-enabled regions, works out-of-the-box with `country_code_picker`, and gives you OTP-safe verdicts in ~8 µs.

---

## The Problem with "Just Valid" Numbers

```dart
// What most validators give you:
validatePhone('+1 800 555 0134'); // ✅ true — but it's a US TOLL-FREE number!
validatePhone('+44 20 7946 0958'); // ✅ true — but it's a UK LANDLINE!
```

You send an OTP to these, and it never arrives. Users complain. Support tickets pile up.

`country_mobile_validator` solves this:

```dart
import 'package:country_mobile_validator/country_mobile_validator.dart';

final r = validateMobile('+1 800 555 0134');
r.isValid;              // false
r.type;                 // NumberType.tollFree
r.isOtpDeliverable;     // false  ← don't send an OTP here!
```

---

## Zero-Setup Usage

One import, one function:

```dart
import 'package:country_mobile_validator/country_mobile_validator.dart';

void main() {
  // Auto-detects country from +CC
  final r = validateMobile('+91 98765 43210');
  print(r.isValid);       // true
  print(r.isMobile);      // true
  print(r.regionCode);    // IN
}
```

---

## The `country_code_picker` Integration (The Real Workflow)

This is what the library was built for:

```dart
import 'package:country_code_picker/country_code_picker.dart';
import 'package:country_mobile_validator/country_mobile_validator.dart';

final kit = CountryMobileValidator();
CountryCode? selected;

CountryCodePicker(
  onChanged: (CountryCode c) => selected = c,
);

// On submit — one call, pinned to the picker's country:
final res = kit.validateForCountry(selected!.code!, input);

if (!res.isValid) {
  // Error message uses the REAL range:
  error = 'Enter a valid mobile number (${kit.forRegion(selected!.code!).lengthHint})';
  // e.g. "Enter a valid mobile number (10–11 digits)" for Argentina
}
```

**Live feedback while typing** (no hardcoded lengths):

```dart
controller.addListener(() {
  final v = kit.forRegion(selected!.code!);
  final len = controller.text.replaceAll(RegExp(r'\D'), '').length;
  setState(() => hint = v.isMobileLength(len) ? '✓' : 'Needs ${v.lengthHint}');
});
```

---

## Range Awareness: Never Hardcode "10 Digits" Again

| Country | Mobile Range | Example |
|---------|--------------|---------|
| Argentina | 10–11 | 91123456789 |
| New Zealand | 8–10 | 21123456 |
| India | 10 | 9876543210 |
| Indonesia | 9–12 | 81234567890 |
| Brazil | 10–11 | 11987654321 |

```dart
final v = kit.forRegion('NZ');
v.mobileLengthRange;   // (8, 10)
v.lengthHint;          // "8–10 digits"
v.isMobileLength(8);   // true
v.isMobileLength(7);   // false
```

---

## What Every Validation Result Gives You

```dart
final r = kit.validate('+44 7**** 3456');

r.isValid;             // true — passes mobile pattern + length
r.isMobile;            // true
r.isOtpDeliverable;    // true — safe to send OTP
r.type;                // NumberType.mobile
r.issue;               // ValidationIssue.none
r.regionCode;          // GB
r.mobileRange;         // NumberRange(min: 10, max: 10)
r.metadataVersion;     // "bundled-0.2.0" — staleness is visible
```

For a US toll-free number:

```dart
r.type;                // NumberType.tollFree
r.isOtpDeliverable;    // false
r.issue;               // ValidationIssue.specialType
```

---

## Refreshable Metadata (Real-Time Updates)

The bundled data comes from [libphonenumber](https://github.com/google/libphonenumber) (Apache-2.0). Update it at runtime with SHA-256 verification:

```dart
final updater = MetadataUpdater(
  manifestUrl: 'https://your-cdn.com/mobile-num-metadata/manifest.json',
);

final res = await updater.checkAndUpdate(currentVersion: kit.metadataVersion);
if (res.success && res.newVersion != null) {
  kit.loadRefreshedMetadata(updater.lastVerifiedJson!, version: res.newVersion!);
}
// Offline fallback: bundled snapshot keeps working. Nothing breaks.
```

Manifest format:
```json
{ "version": "2026.08", "sha256": "...", "url": "..." }
```

---

## Why This Library?

| Feature | Other Packages | `country_mobile_validator` |
|---------|----------------|----------------------------|
| Mobile-only validation | ❌ | ✅ |
| Per-country length ranges | ❌ | ✅ |
| `country_code_picker` integration | ⚠️ Manual | ✅ Built-in |
| OTP-safe verdicts | ❌ | ✅ |
| Refreshable metadata | ❌ | ✅ SHA-256 |
| Dependencies | 3–5 | **1** (`crypto`) |
| Platform support | Varies | **Pure Dart (all)** |
| Performance | — | **~8 µs/validation** |

---

## Example App

A complete Flutter demo wiring this library to `country_code_picker` with live range feedback and OTP verdicts:

👉 [`example/`](https://github.com/govindtank/country_mobile_validator/tree/main/example) — `cd example && flutter run`

---

## Get Started

```yaml
dependencies:
  country_mobile_validator: ^0.2.0
```

- **pub.dev:** [country_mobile_validator](https://pub.dev/packages/country_mobile_validator)
- **GitHub:** [govindtank/country_mobile_validator](https://github.com/govindtank/country_mobile_validator)
- **License:** Apache-2.0

---

## What's Next

- Masked live-formatting `TextField` widget (CapCut/Canva UX bar)
- Standalone country picker widget (zero deps)
- Batch CSV validator for onboarding flows
- `tel:` / WhatsApp deep-link builders

---

Stop guessing lengths. Stop sending OTPs to toll-free numbers. Validate mobile numbers the right way.

```dart
final r = validateMobile(input); // one line
if (r.isOtpDeliverable) sendOtp(r.e164!);
```