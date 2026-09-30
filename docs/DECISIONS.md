# Decisions

Newest first. Each entry: what we decided, why, and what would make us revisit it.

## 2026-09-30: Look, scope, demo page and modeling choices

**Look: dark, not the portfolio colors.** Near-black background with a slight blue tint. The ghost is a pale white to light cyan glow whose radius and blur come straight from the predicted standard deviation, so uncertainty is something you see, not a number in the panel. The creature is warm and solid so it reads as the user, not the prediction. Light mode via `prefers-color-scheme` uses a pale background and a softer, darker haze. Reduced motion keeps the prediction and drops trails and wobble.

**Scope: the end goal is a drop-in widget.** One script tag that adds the ghost glow to any site, reads the host's colors, draws on a `pointer-events: none` overlay, has no stats panel and makes no network requests. We build the demo page first because that is where the model has to prove itself. To keep the widget possible, the engine (input, features, model, training, baselines, metrics) stays a standalone module with no DOM styling or page assumptions. The widget is a milestone after the demo is finished.

**Demo page: mostly empty on purpose.** Dark playground, creature, ghost, a small stats panel, one line of explanation. A "See it on a real page" toggle swaps in a sample article with headings, links and buttons so you can see the ghost the way the widget would show it. Scheduled after the model works.

**Features are rotated into the direction of motion.** Inputs and target are expressed along and across the current velocity. The model learns a curve once instead of once per heading, and the diagonal Gaussian becomes an ellipse aligned with travel, which is the shape the uncertainty really has. In screen x/y a diagonal Gaussian can only draw axis-aligned ellipses.

**Fixed CSS-pixel scale, not viewport size.** Dividing by viewport size makes the same hand motion give different numbers on a phone and a laptop, and changes inputs on resize.

**History length is measured, not assumed.** Start with 8 steps and compare 16 and 24. 8 steps is only 133 ms of context for a 500 ms prediction.

**Horizon: 500 ms default, configurable, 300 ms also measured.**

**Creature follows the real cursor.** A "race" toggle where it chases the ghost comes later.

**Guard the Gaussian NLL.** A floor on log sigma and a short warm-up that trains only the mean. Learned variance can otherwise collapse on easy samples and blow up the gradients.

**Idle handling.** Idle stretches are not used as inputs, but samples whose future contains a stop are kept. Stopping is movement the model should learn to predict.

**"Beats constant velocity" is checked in Vitest.** Seeded synthetic paths run through the real engine in Node: deterministic and fast. Playwright only checks that the page runs and the panel updates. Learning inside a real browser would make e2e slow and flaky.

**Random walk means a velocity random walk.** Each step adds independent Gaussian noise to the velocity, on an open plane with no walls. The expected future velocity equals the current one, so constant velocity is already the best mean predictor. Success is the model tying it, not beating it. Walls would add predictable structure and blur the point.

**Naming.** No "claude" in any name, branch, file, commit, PR or comment. Branches are named like `day-2-input`. PRs merge with a regular merge commit so every commit stays.

## 2026-09-30: Day 1 scaffold

**TypeScript 6.0, not 7.0.** TypeScript 7 (the native port) is out, but typescript-eslint only supports up to 6.0. Revisit when typescript-eslint supports 7.

**ESLint (strict type-checked) and Prettier for lint and format.** The brief asks for lint and format; these are the standard tools and add nothing to the bundle. Strict type-checked rules catch unsafe `any` and floating promises, which matters more in hand-written math code than style does.

**Self-host the fonts instead of loading Google Fonts.** The rules say no network requests at runtime. Unbounded and Onest are OFL licensed, so the latin woff2 files and their licenses live in `public/fonts/`. Cost: about 85 KB, loaded once.

**Content Security Policy with `connect-src 'none'` on Vercel.** Turns "no data leaves the browser" from a promise into something the browser enforces. Any future `fetch` fails loudly. Set in `vercel.json` only, so Vite dev HMR still works. An e2e test also checks that the page requests nothing from other origins.

**Canvas pixel ratio capped at 2.** 3x screens cost 2.25x the fill of 2x with no visible difference on soft shapes. Revisit if thin lines look blurry on 3x phones.

**Playwright runs a desktop and a phone project.** The phone project catches horizontal overflow and touch layout from day 1.

**Colors are placeholders.** Superseded: the look is now dark, see above.
