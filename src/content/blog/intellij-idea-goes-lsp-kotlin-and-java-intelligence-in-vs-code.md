---
title: "IntelliJ IDEA Goes LSP: Kotlin and Java Intelligence in VS Code"
slug: "intellij-idea-goes-lsp-kotlin-and-java-intelligence-in-vs-code"
date: "August 10, 2026"
excerpt: >
  JetBrains shipped its Java and Kotlin intelligence as an LSP extension for
  VS Code. Here's how the preview compares to IntelliJ IDEA, what the license
  really means, and when the switch makes sense.
coverImage: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1200"
category: "DevTools"
readTime: 7
tags:
  - "Kotlin"
  - "IntelliJ-IDEA"
  - "LSP"
  - "VS-Code"
  - "DevTools"
archetype: "comparison"
---


# IntelliJ IDEA Goes LSP: Kotlin and Java Intelligence in VS Code

For most of my career, the answer to "which editor do I use for Kotlin?" has been one word: IntelliJ. Not because the alternatives were lazy — VS Code, Neovim, and Emacs are all genuinely good — but because Kotlin's compiler is fast, its type system is expressive, and the only complete implementation of Kotlin intelligence lived inside a single product. You could bolt syntax highlighting onto any editor. You could not get navigation, refactoring, and analysis that actually understood sealed hierarchies and reified generics anywhere else.

On August 4, JetBrains changed that. The IntelliJ IDEA blog announced "IntelliJ IDEA Goes LSP": the company's Java and Kotlin language technology, repackaged as a VS Code extension called *Java & Kotlin by IntelliJ IDEA*. For the first time, the same engine that powers IntelliJ's smartness runs inside a third-party editor. This post compares the three realistic setups you now have — IntelliJ IDEA itself, VS Code with the new JetBrains extension, and VS Code with the standalone Kotlin LSP — and tries to be honest about the trade-offs, because there are real ones in all three directions.

## What JetBrains actually shipped

Let me start with the facts from the announcement, because the details change the decision.

The extension is a preview release. It runs the language engine used in IntelliJ IDEA and exposes it through the Language Server Protocol, which is why it works in VS Code and forks like Cursor. The announced feature set: Java, Kotlin, and mixed-language project support; debugging over the Debug Adapter Protocol; smart completion, navigation, and code analysis; refactorings and editor assistance; and build import for Maven, Gradle, and Bazel. The performance claim is that it stays usable on large projects and monorepos — which is the thing JetBrains has always pointed to as their moat.

The licensing is the part everyone will quote back at me, so let me get it exactly right. During the preview the extension is free to use. Each new build renews a 30-day evaluation period. After the preview, using it will require an IntelliJ IDEA Ultimate subscription — and that same subscription is what covers you in both the desktop IDE and in VS Code-based editors. Then there's a carve-out that matters a lot in practice: for pure Kotlin projects, JetBrains points you at the standalone Kotlin LSP, which is Apache 2.0 licensed, free, and requires no subscription. That is a different product from the new extension, and that difference is the heart of this comparison.

One more relevant note: JetBrains says the new extension overlaps with Red Hat's and Oracle's Java extensions for VS Code, and recommends disabling those while testing. So the "Java in VS Code" story is about to get a turf war, which is worth knowing before you debug a weird completion conflict at 11pm.

Why the LSP framing matters mechanically: a language server is a separate process that talks JSON-RPC over stdin or a socket. The editor is just a client that asks for completions, hover info, diagnostics, and edits, and renders whatever comes back. That separation is why the same engine can run in VS Code, Cursor, Neovim, Emacs, and even in a terminal agent. JetBrains has resisted this model for years — their bet was that the IDE shell is part of the value. Shipping the engine through LSP is them conceding that the shell is replaceable. That's the real headline.

## Option 1: IntelliJ IDEA, the full IDE

IntelliJ remains the reference implementation. If you open the same project in IntelliJ and in any other editor, IntelliJ still gives you the most complete picture: inspections that understand your whole codebase, intentions and quick-fixes that have been refined for two decades, structural search, powerful debugging, and a profiler. For mixed Java/Kotlin projects with heavy Gradle wiring, nothing else matches the whole surface.

The costs are the ones everyone complains about. It is a big application. It indexes aggressively — that's what makes the smartness smart — and on a laptop with 16GB of RAM you will feel it, especially if you have several projects open. Startup is slow by VS Code standards. And it is proprietary software with a subscription, which matters to some teams more than others.

But here's the thing I keep coming back to: for Kotlin specifically, IntelliJ has years of accumulated correctness. The refactorings rarely break your code. The compiler integration surfaces errors with context you actually want. That is not nostalgia; it is a quality bar other tools are still climbing.

## Option 2: VS Code plus *Java & Kotlin by IntelliJ IDEA*

This is the new option, and it's the one I installed the day the post went live — I'm a sucker for "the thing I use now gets the engine of the thing I used before."

What you get is genuinely JetBrains technology inside a lightweight shell. Completion, navigation, analysis, refactorings, and debugging all run off the IntelliJ engine, which means the gap in *language correctness* versus the full IDE should be small — the engine is the same; what differs is the surrounding tooling. For people who live in VS Code for TypeScript, web, and everything else, this collapses two workflows into one.

What you don't get is the full IDE experience. You don't get IntelliJ's project-wide inspections UI, its run configurations, its database tools, its profiler, or the deep plugin ecosystem. The extension is a focused set of language features, not a port of the IDE. And it's a preview: expect rough edges, and expect the 30-day evaluation model to keep forcing updates. If your company won't buy IntelliJ Ultimate subscriptions for everyone, this option disappears after the preview ends — that's the honest read.

A practical note from my own first run: the extension imports Maven, Gradle, or Bazel projects itself when you open a folder, and that first import is where the waiting happens — it's the same indexing work IntelliJ does at startup, just happening in the background of a lighter editor. After that, completion and navigation feel like IntelliJ. Keyboard muscle memory is the adjustment cost: you'll reach for IntelliJ's shortcuts out of habit and get nothing. Remap the ones you use most on day one, not week three.

There's also a subtle workflow win worth naming: because the extension is just one piece of a VS Code setup, your frontend, backend, and mobile code can share one editor config, one terminal layout, and one set of extensions. For people who split their day between TypeScript and Kotlin — which is a lot of us now — that consolidation is the actual selling point, not the completions.

## Option 3: VS Code plus the standalone Kotlin LSP

The quiet workhorse. JetBrains has maintained the standalone Kotlin LSP for years, and it's the reason Emacs and Neovim users have been writing Kotlin outside IntelliJ at all — the HN community post "Escape IntelliJ: Scala and Kotlin LSPs on Emacs Eglot" (134 points in July) is a good example of how far people push it.

It is Apache 2.0, free, and it keeps improving. For pure Kotlin projects it gives you completion, diagnostics, navigation, and rename — the core loop of everyday work. If you're doing Kotlin server-side or Kotlin Multiplatform shared code, it may genuinely be all you need.

The honest caveats: it is not IntelliJ's full engine. Mixed Java/Kotlin projects are where it gets weaker, because you need a separate Java language server for the Java side, and the two don't always agree with each other. Refactorings are sparser. And some of the deeper code analysis features IntelliJ users take for granted just aren't there. The new extension is explicitly the richer product for mixed projects; the standalone LSP is the free one that covers a narrower slice well.

One more thing the standalone LSP has going for it: longevity. It has been around long enough that the sharp edges are known and documented — community configs, workarounds for Gradle quirks, notes on which versions of the compiler it tracks. When a tool has that kind of history, the question stops being "will it work" and becomes "does it cover my project shape." For a pure-Kotlin service with a standard Gradle layout, the answer is usually yes, and it costs nothing to find out.

## The trade-offs, in one table

| | IntelliJ IDEA | VS Code + JB extension | VS Code + Kotlin LSP |
|---|---|---|---|
| Language coverage | Full Java + Kotlin, mixed projects | Full Java + Kotlin, mixed projects | Kotlin-first; Java needs a second server |
| Refactorings and analysis | Deepest, most mature | Same engine, fewer IDE-level extras | Basic set, improving |
| Build tool support | Maven, Gradle, Bazel, plus more | Maven, Gradle, Bazel | Gradle/Maven via project import |
| Debugging | Full IDE debugger + profiler | DAP-based debugging | Via editor/plugins, more manual |
| Resource footprint | Heavy, aggressive indexing | Moderate, runs as a language server | Lightest |
| License | Ultimate subscription | Free preview, then Ultimate subscription | Apache 2.0, free forever |
| Editor flexibility | One IDE | Any VS Code fork | Any LSP-capable editor (VS Code, Neovim, Emacs) |
| Maturity | Decades of polish | Preview, 30-day eval builds | Years of steady use, narrower scope |

No column wins all rows. That's the point of the table: this is a genuine three-way trade, not a marketing slide.

## Choose IntelliJ when / choose something else when

Choose IntelliJ IDEA when you work on large mixed Java/Kotlin codebases daily, when you depend on its refactoring correctness and inspections, or when you're already paying for Ultimate and the tool is working for you. Don't switch out of boredom; switching has a cost and you'll eat it for months.

Choose VS Code with the JetBrains extension when your team is VS Code-native and you need real Kotlin/Java intelligence there, when you want one editor for web + backend + mobile, or when you want to test whether IntelliJ-grade analysis outside the IDE is where the industry is heading. Just check the license math with your manager first.

Choose the standalone Kotlin LSP when your project is pure Kotlin, when you're on Neovim/Emacs/anything LSP-capable, or when you need a zero-cost path that nobody can take away from you. It's the safest bet and the least exciting one — which, let's be honest, is often the right trade.

## What I'd do

I prototype everything, so I'm running the new extension in Cursor on a mixed Kotlin + TypeScript side project, and the standalone LSP in Neovim for a pure-Kotlin service. After a week, the honest verdict is: the preview extension is surprisingly usable for day-to-day editing, and the standalone LSP remains the dependable free option. I would not rip out IntelliJ from a team that's productive in it — the full IDE still does things neither VS Code path does, and a team migration is a real cost, not a vibe.

But I would absolutely stop assuming IntelliJ is the only place Kotlin intelligence can live. That assumption is what the announcement quietly kills.

## The agentic angle

The part of the announcement I find most interesting has nothing to do with editors. JetBrains says they've been running internal trials where the same LSP functionality serves terminal-based agent workflows — Claude Code, Codex — and that early results show faster, more deterministic agent runs with reduced token consumption. They're promising details soon.

Think about what that means. An agent working in a terminal has to build its own picture of your code: it greps, it reads files, it guesses. Each guess costs tokens, and wrong guesses cost retries. An LSP server, by contrast, answers structural questions directly — "where is this symbol defined," "what are the usages," "what's the type here" — in one request instead of a dozen file reads. That's where the token savings come from, and it's a mechanism, not marketing. The claim is plausible for the same reason the extension is: the engine already knows the answer; the protocol just needs a way to ask.

If that holds up, the interesting competition shifts. JetBrains isn't just selling you an editor anymore — it's selling language intelligence as a service that editors, and agents, can plug into. Microsoft and OpenAI are already pushing agents toward structured code understanding rather than pure text prediction. JetBrains arriving with the most battle-tested Java/Kotlin analysis engine on the market, served over a standard protocol, makes that fight much more interesting.

## The bottom line

Three options, three different contracts. The full IDE for the deepest tooling, the new extension for JetBrains-quality Kotlin inside the editor your team already uses, and the Apache-2.0 LSP for anyone who wants Kotlin support that stays free. Try the extension now, while the preview is open — it costs you a weekend, not a subscription. And keep an eye on the agent experiments, because that's the direction this is actually heading.
