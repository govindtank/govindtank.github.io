<!--EXCERPT-->
I rebuilt the same cart app three times — Provider, Riverpod, and Bloc — and ran all three for a month. All of them work. My pick for 2026 might surprise you.
<!--BODY-->
# Flutter State Management: Bloc vs Riverpod vs Provider in 2026

Every Flutter tutorial eventually hits the same wall: which state management library should I use? The answer you get depends entirely on who wrote the tutorial. I am a tinkerer. I prototype everything, I trust opinions about as far as I can throw them, and I have a bad habit of rebuilding things just to see how they feel. So when I needed state management for a real app this year, I did the only honest thing: I rebuilt the same app three times.

This is what I found. Not what the docs claim, not what the conference talks claim — what a month of real use showed me.

## The experiment

The app was a shopping cart — the kind of thing every state management library demo uses, which is exactly why I picked it. A product list, a cart with a count badge, a slow fake API for stock checks, a settings screen with a couple of toggles, and a checkout button that did something silly like a fake payment. Boring on purpose. I built it three times: once with Provider, once with Riverpod, once with Bloc. Same UI, same features, same tests, same fake API delays. Then I used each version for about ten days and took notes on what annoyed me.

The three libraries are not three flavors of the same thing. They are three different answers to the question "where does state live and how does it change?" That difference matters more than any feature list.

## The three contenders

Provider is the oldest and simplest: a wrapper around InheritedWidget that lets you put an object up the tree and read it down the tree. You hand it a ChangeNotifier, and widgets rebuild when the notifier says so. The mental model is one sentence: put it up there, read it down here.

```dart
class CartModel extends ChangeNotifier {
  final List<String> _items = [];
  int get count => _items.length;

  void add(String sku) {
    _items.add(sku);
    notifyListeners();
  }
}

ChangeNotifierProvider(
  create: (_) => CartModel(),
  child: const CartScreen(),
)

// inside a widget:
final cart = context.watch<CartModel>();
```

Riverpod is the evolution of that idea, from the same author. Providers are not widgets in the tree; they are functions with caching and dependency tracking, checked at compile time. You read them with ref.watch, and you can create them outside the widget tree entirely. With the code generator, the boilerplate complaint mostly disappears.

```dart
class CartNotifier extends Notifier<Cart> {
  @override
  Cart build() => const Cart(items: []);

  void add(String sku) =>
      state = Cart(items: [...state.items, sku]);
}

final cartProvider =
    NotifierProvider<CartNotifier, Cart>(CartNotifier.new);

// inside a widget:
final cart = ref.watch(cartProvider);
```

Bloc is a different animal: an event-driven state machine. UI components dispatch events, the bloc reduces them into new states, and the UI renders states. Events in, states out, nothing else. It is opinionated on purpose, and it brings its own vocabulary — events, states, cubits, BlocBuilder, BlocListener.

```dart
sealed class CartEvent {}
final class ItemAdded extends CartEvent {
  ItemAdded(this.sku);
  final String sku;
}

class CartBloc extends Bloc<CartEvent, CartState> {
  CartBloc() : super(const CartState(items: [])) {
    on<ItemAdded>((event, emit) => emit(
      state.copyWith(items: [...state.items, event.sku]),
    ));
  }
}

BlocProvider(create: (_) => CartBloc(), child: const CartScreen())
```

## Bloc: structure you can enforce

Bloc gets a bad rap for boilerplate, and it earns it — every feature needs an event class, a state class, and the mapping between them. But here is the thing I learned: the ceremony is the feature. Bloc forces every state change through one narrow door, which means every state change is testable, traceable, and reviewable. In a codebase with ten people and a payment flow, that is not overhead; that is rails.

Testing was the standout. bloc_test is genuinely excellent, and testing a bloc without touching widgets is the easiest testing story of the three. If your team already thinks in events and states, Bloc will feel natural and the boilerplate complaint evaporates.

For a solo app, though, it was the most friction. Ten days of writing event classes for a cart badge made me miss the simple stuff. Verdict: depends — Bloc is for teams and for flows that really are state machines. If you are one person with a counter, it is a lot of ceremony for very little payoff.

## Riverpod: compile-time safety, less ceremony

Riverpod was the surprise for me. The mental model took a couple of days — providers as functions with caching is a genuine shift — but after that, everything got easier. Compile-time errors instead of runtime surprises. ref.watch rebuilds only the widgets that actually watch a provider, and granular rebuilds showed up as real wins in the product list. Async state is first-class through AsyncValue, which made the fake stock-check API the least painful part of the whole experiment.

The code generator killed the boilerplate objection. The hand-written provider boilerplate I dreaded never materialized; riverpod_generator writes most of it, and the generated code is readable.

Testing was the other surprise. Riverpod lets you override providers and test without pumping a widget tree, and once I got used to that, I stopped missing Bloc's testing story. Verdict: worth it. For a new app in 2026, this is where I would start.

## Provider: the old workhorse

Provider still works, and I want to be fair to it. For a small app, it is the fastest path from idea to working screen, and context.watch is so simple that a new developer can read it without a tutorial. The docs are everywhere, the answers are everywhere, and the ecosystem has a decade of accumulated solutions to its problems.

But the walls are real. Async state means FutureBuilder and manual wiring. Dependencies between providers mean reading them from context, which couples you to the widget tree. Typos in provider names fail at runtime, not compile time, and in a big app those failures are the slow kind to chase. And the authors themselves built Riverpod to replace it — when the maintainers ship the successor, that tells you something about where the library is heading.

Verdict: depends. If you have a working Provider app, do not rip it out — it is fine. If you are starting something new in 2026, I would not choose it.

## The comparison table

| Criterion | Bloc | Riverpod | Provider |
| --- | --- | --- | --- |
| Learning curve | Steep: events, states, layers | Moderate: one mental model | Gentle: watch and done |
| Boilerplate | High: event and state classes | Low with codegen | Minimal |
| Compile-time safety | Strong: sealed events | Strongest: provider graph checked at build | Weak: typos fail at runtime |
| Async handling | Built-in via states | First-class: AsyncValue | DIY with FutureBuilder |
| Testing | Excellent: bloc_test | Excellent: ref without widgets | Good: needs pumpWidget |
| State without context | Yes | Yes | No |
| Best fit | Big teams, strict flows | New apps, growing apps | Small apps, quick prototypes |

## What I would pick in 2026

My recommendation, stated plainly: start new apps with Riverpod. Use the code generator, keep providers small, and let AsyncValue handle your network state. You get the safety of compile-time checks and the flexibility of a library that does not force your architecture on you.

Pick Bloc when the team is big enough that shared rails matter more than individual speed — I would draw the line around eight developers — or when a specific flow really is a state machine and you want it enforced, tested, and impossible to bypass.

Keep Provider if you already have it. The migration cost is the real tax, not the library itself. I migrated one version of my test app from Provider to Riverpod just to measure the pain, and it was a full weekend of mechanical work for no user-visible gain. If your Provider app is healthy, your time is better spent on features.

The honest caveat: all three ship real apps, and Flutter's built-in ValueNotifier plus InheritedWidget covers a shocking amount of simple state before you need any library at all. The worst choice in state management is not the wrong library — it is switching libraries every six months because a new tutorial convinced you. Framework churn is the tax nobody puts in the comparison table.

## Verdicts worth stealing

Bloc: depends. Bring it for teams and real state machines; leave it home for prototypes.

Riverpod: worth it. The best default for new apps in 2026, and the codegen makes the boilerplate argument moot.

Provider: depends. Perfectly fine in production today; I just would not start there.

And if you are still deciding: build the same small app in two of these before you commit. One afternoon of building beats a month of reading. That is what I did, and I would do it again.
