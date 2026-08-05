<!--EXCERPT-->
Conditional types, template literal types, and mapped types look clever until they cost you an afternoon. Here's when each one earns its keep — and when to stop.
<!--BODY-->
# TypeScript 5.x Advanced Patterns: Conditional Types, Template Literals, and Mapped Types in Production

## Why I keep reaching for these

I'm the person on my team who volunteers to type the untyped. Hand me a JSON API with no schema and I'll write the types by hand before the meeting ends. So when TypeScript 5.x landed with sharper inference and a stack of quality-of-life improvements — const type parameters, the satisfies operator, dramatically faster builds — I took the advanced type patterns for a serious spin. Not a demo. A spin.

The short version: conditional types, template literal types, and mapped types are the three patterns I actually use in production code, and they solve real problems. They also share a failure mode: they're fun, and fun is dangerous in a codebase. This is the honest tour — what each pattern does, where it earns its keep, and where you should stop.

## Conditional types: the if/else of types

A conditional type is a type-level ternary:

```ts
type ElementOf<T> = T extends readonly (infer U)[] ? U : never;

type A = ElementOf<string[]>;          // string
type B = ElementOf<readonly number[]>; // number
type C = ElementOf<string>;            // never
```

The infer keyword is the star of the show. It lets you pull a type out of a larger one — the element type out of an array, the return type out of a function — and that turns conditional types into the extraction tool of the type system. My favorite production example is unboxing API responses:

```ts
type ApiResponse<T> = { data: T; error: null } | { data: null; error: string };

type Unwrap<T> = T extends { data: infer D } ? D : never;

type Order = Unwrap<ApiResponse<Order>>; // Order, not the wrapper
```

Where it earns its keep: whenever you have a wrapper, a union, or a generic that hides the type you actually want, and you need the compiler to find it for you. Framework code and library internals live on this pattern. In our codebase it's how the fetch layer unwraps API responses without five cast statements.

Verdict: worth it, with one warning. When the checked type is a union, the conditional distributes over every member — usually what you want, but on large unions it multiplies, and the compiler walks every combination. I've watched a clever-in-a-demo type turn a 30-second typecheck into a two-minute one. If a conditional type is slow, it's usually checking a union with hundreds of members.

## Template literal types: strings with shape

Template literal types describe the shape of strings, not just their content:

```ts
type ColorShade = 50 | 100 | 200 | 300 | 500 | 700 | 900;
type ColorToken = `color-${ColorShade}`;
// "color-50" | "color-100" | ... | "color-900"

type EventName<T extends string> = `on${Capitalize<T>}`;
type ButtonEvents = EventName<"click" | "mouseenter">;
// "onClick" | "onMouseenter"
```

Combined with conditional types they get genuinely powerful, because you can parse strings at the type level. Route definitions are the classic case: a route string like "/users/:id" can produce a params type { id: string } with zero runtime code. We have a small type-level route parser in our admin app; the route config is typed, and the params for every page are inferred. Changing a route name breaks every consumer at compile time. That's the dream.

Where it earns its keep: event maps, CSS token systems, route params, typed query builders — anywhere strings are a closed vocabulary that your code already treats as a contract.

Verdict: worth it for closed vocabularies; skip the parser arms race. Recursive template literal parsing works, and then someone adds an optional route segment and you meet "Type instantiation is excessively deep" at 4pm on a Friday. Type-level parsing is a hobby; treat it as one. If your template literal type runs more than a few lines, put it in a dedicated types file with tests, or reconsider.

## Mapped types: transforming shapes

Mapped types transform one object type into another, key by key:

```ts
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type User = { name: string; age: number };
type UserGetters = Getters<User>;
// { getName: () => string; getAge: () => number }
```

Key remapping with the as clause landed back in 4.1, and it's the feature that made mapped types a daily tool instead of a party trick. The built-in utility types are all mapped types under the hood — Partial, Required, Pick, Record — and once you see them that way, writing your own transforms is twenty minutes of work. In production we use a DeepReadonly for config objects, a nullable-to-optional converter at the API boundary, and a pick-by-prefix that builds view models from domain models.

Where it earns its keep: deriving view models from domain models, applying or stripping modifiers at scale, key renaming.

Verdict: worth it for flat transforms; be careful with recursion. A mapped type that recurses over nested objects — DeepReadonly, for example — will happily recurse through a deep JSON blob until the compiler gives up. And the cleverer the transform, the harder it is for the next person to read. I've seen a five-line mapped type that took a senior engineer an hour to reverse-engineer. That's a cost, not a badge.

## The comparison

| Pattern | What it does | Reach for it when | Skip it when |
|---|---|---|---|
| Conditional types | Chooses a type from another type; extracts with infer | Unwrapping generics, unions, and wrappers; library APIs | The checked union is huge; you can name the type directly |
| Template literal types | Gives strings a shape; parses at the type level | Event names, CSS tokens, route params, query builders | Parsing gets recursive; strings come from user input |
| Mapped types | Transforms object shapes key by key | View models, modifier application, key remapping | The transform recurses deep; the result reads worse than the plain type |

The honest rule of thumb: these patterns pay rent when they remove a place where a human has to keep two things in sync — the string and its type, the API response and its shape. They cost rent when they replace readable code with a puzzle.

## Where 5.x made this easier

Three 5.x features deserve credit for making these patterns practical instead of theoretical. Const type parameters let you write a generic that keeps literal types intact instead of widening them to string or number — mapped types and template literals produce much more useful results when the input isn't widened. The satisfies operator lets you check a value against a type without widening it: `const palette = { red: [255, 0, 0] } satisfies Record<string, string | number[]>` gives you the check and keeps the literal types for inference. And the compiler itself got dramatically faster in 5.x, which is the only reason I'm willing to use a couple of these patterns at all — the older compiler made the cost obvious.

## When types go too far

I've rewritten enough of my own experiments to have a short list of warning signs.

Compile time is the first. TypeScript 5.x made builds fast, and type-level gymnastics happily eat the gains. If a typecheck that used to take seconds takes minutes, and the slow file contains a conditional type over a big union, that's a smell.

Readability is the second. A type that needs a comment to explain is already failing. The test is brutal: can the person who picks this up at 9am on a Monday understand it before coffee? If not, it's a liability even when it's correct.

Editor responsiveness is the third. tsserver does a lot of work to power hover and completion, and pathological types make it churn. Your team will notice before you do.

The practical middle ground: keep these patterns in small, isolated, well-named type modules, and write type tests. A type test is a few lines with @ts-expect-error:

```ts
// @ts-expect-error — Getters<User> must not expose a setter
const bad: Getters<User>["setName"] = () => {};
```

## How to evaluate a type pattern

Before adopting any of these, ask three questions. Does it remove a place where a human keeps two things in sync? Can the whole type be read in one screen? And does the compiler stay fast with it in the tree? Two yeses and you've got a keeper. Anything less, and the type is a hobby that happens to live in your shared codebase.

## What I'd tell my past self

Use conditional types for extraction, template literals for closed string vocabularies, and mapped types for shape transforms — and keep each one small enough to read in one screen. The compiler is on your side, but only if the code stays boring enough for humans to follow.
