# Android Architecture Guardrails

Problem: architecture reviews on most Android teams are verbal, happen inconsistently, and depend on whoever's reviewing the PR that day.

This repo splits that review into two tiers with very different guarantees, and is explicit about which is which.

## Two tiers, on purpose

| Check | Type | Can block a merge? |
|---|---|---|
| Clean Architecture layer boundaries (Konsist) | Deterministic | **Yes** |
| SOLID principle smells (LLM) | Advisory | **No** |

The Konsist tests are plain JUnit assertions over parsed Kotlin source — same category of check as a compiler error. The LLM pass is a judgment call, so it only ever posts a comment. Its workflow (`.github/workflows/solid-review.yml`) has `pull-requests: write` permission and nothing else, the reviewer action never calls `core.setFailed()`, and the step itself runs with `continue-on-error: true` as a second line of defense. There is no path from "LLM disagrees with your code" to "your PR is blocked."

## Architecture

```
android-architecture-guardrails/
├── sample-app/                          # small multi-module Kotlin app to test against
│   ├── domain/                          # pure Kotlin: models, repository interfaces, use cases
│   ├── data/                            # repository implementations, network client
│   └── presentation/                    # view models — depends on domain only
├── architecture-tests/                  # Konsist test module (hard-fail tier)
│   └── src/test/kotlin/ArchitectureTest.kt
├── solid-reviewer-action/               # the LLM-based advisory reviewer (advisory tier)
│   ├── action.yml
│   └── src/
│       ├── index.ts
│       ├── diffParser.ts
│       ├── llmClient.ts                 # prompted specifically for SRP/OCP/LSP/ISP/DIP smells
│       └── githubClient.ts              # posts an advisory comment, never fails the build
├── .github/workflows/
│   ├── architecture-check.yml           # runs Konsist tests, fails the build on a violation
│   └── solid-review.yml                 # runs the LLM advisory pass, comment-only permissions
└── README.md
```

`sample-app` is plain Kotlin/JVM modules (no Android Gradle Plugin, no Android SDK dependency) — the point of this repo is the layer-boundary and SOLID checks, not the app itself, and this keeps CI to just a JDK.

## What Konsist actually checks

Five checks in `architecture-tests/src/test/kotlin/ArchitectureTest.kt`, run with `./gradlew :architecture-tests:test`:

1. **Layer dependency direction** — `domain` depends on nothing, `data` depends on `domain` and must not depend on `presentation`, `presentation` depends on `domain` and must not depend on `data`. This is the one that catches "presentation reaching into data directly." (Note: Konsist's `dependsOn` only asserts that the allowed dependency exists — it doesn't forbid others by itself, so the exclusion is spelled out explicitly with `doesNotDependOn`.)
2. Classes ending in `UseCase` reside in a `usecase` package.
3. Interfaces ending in `Repository` never import framework types (`retrofit2`, `okhttp3`, `android.*`, `androidx.*`) or the `data` package — the domain abstraction has to stay pure.
4. Classes ending in `RepositoryImpl` live in `data`'s `repository` package and actually implement a `Repository` interface.
5. Classes ending in `ViewModel` reside in the `presentation` layer.

All five pass on `main`.

## Proof the hard-fail tier is real

The `demo-violation` branch adds a `presentation` class that directly imports and instantiates `UserRepositoryImpl` from `data`, bypassing the `domain` abstraction — a real Clean Architecture violation, not a contrived example. Diff: [`main...demo-violation`](../../compare/main...demo-violation).

Verified locally before this branch was ever pushed:

```
$ ./gradlew :architecture-tests:test   # on main
BUILD SUCCESSFUL — all 5 checks pass

$ ./gradlew :architecture-tests:test   # on demo-violation
BUILD FAILED

ArchitectureTest > clean architecture layers respect their dependency direction() FAILED
    com.lemonappdev.konsist.core.exception.KoAssertionFailedException: 'clean architecture
    layers respect their dependency direction' test has failed.
    'Presentation' layer does not depends on 'Data' layer failed. Files that depend on
    'Data' layer:
    └── File .../presentation/viewmodel/UserProfileViewModel.kt
        ├── Import com.guardrails.data.remote.UserApiClient (...:3:1)
        └── Import com.guardrails.data.repository.UserRepositoryImpl (...:4:1)
```

`.github/workflows/architecture-check.yml` runs on push to both `main` and `demo-violation`, so the same failure is reproducible in CI — see the Actions tab on the `demo-violation` branch for the run.

## Demo

Both proofs below are real, completed GitHub Actions runs on this repo — not staged.

- **Konsist hard-fail**: [PR #2](https://github.com/ranab4b/android-architecture-guardrails/pull/2) (`demo-violation` → `main`) — the `konsist` check fails: [run 35189171834](https://github.com/ranab4b/android-architecture-guardrails/actions/runs/35189171834).
- **Advisory tier, safe without a key**: [PR #1](https://github.com/ranab4b/android-architecture-guardrails/pull/1) (`solid-smell-demo` → `main`, contains a genuine SRP smell) — `solid-review` passes without posting a comment, because `ANTHROPIC_API_KEY` isn't configured on this repo. Once you add your own key (see Setup), the same workflow will post a comment naming the SRP violation instead of skipping.

## Stack

Kotlin, Konsist, JUnit 5, Gradle, GitHub Actions, TypeScript, Anthropic Claude API (`@anthropic-ai/sdk`).

## Setup

The deterministic tier needs nothing — it's just Gradle.

The advisory tier needs an LLM key to actually run. In this repo's GitHub Settings → Secrets and variables → Actions, add:

```
ANTHROPIC_API_KEY = <add your api key here>
```

Without it, `solid-review.yml` still runs on every PR but the action logs a notice and exits successfully without posting anything — it's designed to no-op safely rather than fail when the secret is missing.

## Run it

```bash
# Deterministic architecture tests
./gradlew :architecture-tests:test

# Advisory reviewer — build and unit tests (diff parsing only, no API key needed)
cd solid-reviewer-action
npm ci
npm test
npm run build
```
