# Ghost Cursor

A creature follows your cursor. A faint ghost shows where the model predicts your cursor will be about half a second from now. A tiny neural network trains live in the browser on your own movement, so the ghost starts out clueless and gets better as it learns how you move. Everything runs locally. No data leaves the browser.

Read `docs/PROJECT_BRIEF.md` before starting any task. It has the reasoning, the plan and the open questions.

## Who this is for

Luba Kaper, software engineer (ex-Twitter iOS, now AI engineer). This project exists to show real AI engineering judgment in a playful, shareable form: honest baselines, measured results, uncertainty that is actually calibrated, and a model she understands down to the gradients. It must never look vibe-coded.

## Working with Luba

- Plain, direct language in docs, UI copy, commit messages and replies. No buzzwords, no em dashes.
- Be brutally honest about tradeoffs, weak results and bad ideas, including hers and your own.
- Do not over-explain. Say what changed, what was measured, and what is still open.
- Ask before changing product scope, adding a dependency, or anything hard to undo.

## Commits

- Author every commit as `Luba Kaper <liubovkaper@pursuit.org>`.
- Do not add `Co-Authored-By` lines, "Generated with" lines, or any mention of Claude in commits, PR descriptions or code comments.
- Small, focused commits with plain messages in the imperative ("Add constant-velocity baseline"). One logical change per commit.
- `main` is the production branch. Use short feature branches for anything larger than a small fix.

## Stack

- Vite, TypeScript in strict mode, no UI framework. Canvas 2D for rendering.
- The neural network is written by hand in TypeScript (forward pass, backprop, optimizer). Do not add TensorFlow.js or any ML library. Writing it ourselves is the point, and it keeps the bundle tiny.
- Vitest for unit tests, Playwright for end-to-end tests.
- Deploy as a static site on Vercel. Node.js 22 everywhere.
- Before adding any dependency, explain why the existing stack cannot do it simply, and ask.

## Folder structure

- `src/input/`: pointer capture and fixed-rate resampling
- `src/features/`: feature extraction and normalization
- `src/model/`: the network, loss functions, optimizer, replay buffer
- `src/baselines/`: hold-position, constant-velocity and constant-acceleration predictors
- `src/metrics/`: rolling error, calibration coverage
- `src/render/`: creature, ghost, trail and the stats panel
- `src/app.ts`: wiring only, no logic
- `e2e/`: Playwright tests with synthetic trajectories
- `docs/`: brief, decisions log, results

## Engineering rules for this project

Correctness first. When tradeoffs are needed: Simplicity > Readability > Maintainability > Performance.

**Before writing code**
- Read the existing code and follow its patterns. Reuse before adding a new abstraction.
- State material assumptions in your summary. Record real decisions in `docs/DECISIONS.md` with the reason.

**Code quality**
- Small, focused functions with descriptive names. Early returns over nesting. No hidden side effects.
- Option objects instead of long parameter lists or boolean flags.
- Make invalid states hard to represent: use types for shapes like `Vec2`, fixed-length feature arrays, and explicit units (pixels vs normalized) in names.
- Keep math pure and separate from rendering and DOM code so it can be tested without a browser.
- Comments explain why, not what. Especially for the math: say why a formula is used, cite the source if it is not obvious.

**ML-specific rules**
- Every model result is reported next to the baselines. If the model does not beat constant velocity, say so plainly in the UI and the docs. Never hide a losing number.
- Labels arrive late. A sample can only be trained on after its future position (the prediction horizon) has actually happened. Never train on the future.
- Predict displacement relative to the current position, not absolute screen coordinates.
- Seeded random number generator everywhere, so tests and demos are reproducible.
- Uncertainty must be checked, not assumed: track how often the real position lands inside the predicted 1-sigma and 2-sigma regions and show it.
- Do not train on idle time or on points where the pointer left the window.
- Any change to features, horizon, model size or learning rate gets a before/after measurement on the fixed synthetic trajectories, logged in `docs/RESULTS.md`.

**Testing**
- Unit tests for every math module: forward pass shapes, a finite-difference gradient check for backprop, loss functions, resampler, ring buffer, metrics and calibration.
- Regression test for any confirmed bug that can be reproduced deterministically.
- End-to-end tests drive synthetic pointer paths (circle, zigzag, figure-eight, random walk with a fixed seed) and assert the page runs, the panel updates, and the model's error drops below the constant-velocity baseline on smooth paths.
- Tests are deterministic, independent and fast. Never ship untested model math.
- Run `npm run check` (format, lint, typecheck, unit tests) before every commit.

**Performance**
- Budget: the page stays at 60 fps and a training step stays under 2 ms per frame on a normal laptop. Measure with `performance.now()` and show it in a debug view.
- Optimize only when a measurement shows a real problem. Do not move training to a Web Worker unless the budget is actually exceeded.

**Privacy and safety**
- No network requests at runtime. No analytics. Movement data lives in memory only and is gone on reload.
- If saving is ever added, it must be opt-in and local only.

**UI and accessibility**
- Match Luba's portfolio style (liubov-dev.vercel.app): grey paper background, red and black, Unbounded and Onest fonts. The red creature is the smarter sibling of the red circle on her site.
- Works with mouse, trackpad, touch and pen (Pointer Events).
- Respect `prefers-reduced-motion`: keep the prediction, drop trails and wobble.
- The stats panel is readable, keyboard reachable, and has plain labels (for example "Model error" not "MAE").
- No horizontal overflow at phone width.

## Definition of done

A change is done when it is correct, simple, tested, measured where it touches the model, and understandable to another engineer. Before finishing, check:
- Is this the simplest correct solution? Can anything be removed?
- Is each new abstraction justified?
- Are edge cases handled (pointer leaves window, tab hidden, resize, very fast flicks, no movement)?
- Are the tests sufficient and passing?
- If the model changed, is there a before/after number in `docs/RESULTS.md`?
