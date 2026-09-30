# Ghost Cursor: project brief

## The idea in one line

A cursor follower that learns to predict where you are about to move, live in your browser, and is honest about how well it is doing.

## Why this project

Luba wants a portfolio piece that is fun to play with and shows she thinks like an AI engineer, not someone gluing an API to a UI. Most "AI projects" call a large model and show the answer. This one shows the parts that separate real AI engineering from demos:

1. **A model built from scratch.** A small neural network with hand-written backpropagation, checked with a gradient test.
2. **Honest baselines.** The model is only interesting if it beats simple physics (keep moving at the same speed). The panel always shows both.
3. **Learning while running.** The model trains continuously on the user's own movement, with late-arriving labels and a replay buffer.
4. **Calibrated uncertainty.** The ghost is a soft blob whose size is the model's own uncertainty. We measure whether that uncertainty is honest.
5. **Visible failure.** Hand the mouse to a friend and the error jumps, because the model learned you, not them. That is distribution shift you can feel.

It connects to her site, where a red circle already follows the cursor. Ghost Cursor is that idea, grown a brain.

## How it works

### 1. Input

- Capture Pointer Events (mouse, trackpad, touch, pen).
- Pointer events arrive at uneven times, so resample to a fixed rate (60 Hz) with linear interpolation. The model needs evenly spaced steps.
- Mark gaps: pointer left the window, tab hidden, or no movement for more than about 300 ms. Do not train across gaps.
- Idle stretches are skipped as inputs, but a sample whose future contains a stop is kept. Predicting that you are about to stop is part of the job.

### 2. Features and target

- Input: the last N steps of movement as velocity deltas, divided by a fixed scale in CSS pixels (not the viewport size, so the same hand motion gives the same numbers on a phone and a laptop, and resizing does not change the input). Start with N = 8 and measure 16 and 24 against it: 8 steps is only 133 ms of context to predict 500 ms ahead.
- Rotate inputs and target into the direction of motion (along and across the current velocity). The model then learns "curving left" once instead of once per heading, and the uncertainty ellipse lines up with the direction of travel. When the pointer is nearly still, keep the last known heading.
- Target: displacement from the current position to the position 30 steps later (500 ms). This is the "horizon."
- The horizon is configurable. Default 500 ms; also measure 300 ms and report both.

### 3. Baselines (built before the model)

- **Hold:** you will stay where you are.
- **Constant velocity:** you keep going in the same direction at the same speed.
- **Constant acceleration:** you keep speeding up or turning at the same rate.

The stats panel shows each one's error next to the model's. The headline number is how much better (or worse) the model is than constant velocity.

### 4. The model

- A small multilayer network, for example 16 inputs, two hidden layers of 32 with tanh, and 4 outputs.
- Outputs: mean displacement (along, across) and log standard deviation (along, across). Predicting log standard deviation keeps it positive and stable.
- Loss: Gaussian negative log-likelihood. It rewards being right and penalizes being confidently wrong.
- NLL with a learned variance can collapse early (sigma shrinks toward zero on easy samples and gradients blow up). Guard against it with a floor on log sigma and a short warm-up where only the mean is trained.
- Optimizer: Adam, written by hand, with gradient clipping.
- Verify backprop with a finite-difference gradient check in the unit tests.

### 5. Online training

- Every frame, make a prediction and remember it.
- A prediction becomes a training example only once its horizon has passed and the real future position is known.
- Store examples in a ring buffer (for example the last 2,000). Each frame, run one small mini-batch update from the buffer, within the time budget.
- Controls: reset the model, pause learning, and show a learning curve.

### 6. Uncertainty you can check

- Draw the ghost as a soft glow whose size and blur come directly from the predicted standard deviation: wide and faint when unsure, small and brighter when confident.
- Track calibration: for a 2D Gaussian, about 39% of real positions should fall inside the 1-sigma ellipse and about 86% inside the 2-sigma ellipse. Show the real percentages. If the model is overconfident, the panel says so.

### 7. The stats panel

Plain labels, updated live:

- Model error vs constant velocity vs hold (rolling average in pixels)
- "Model is X% better than constant velocity" (or worse, stated plainly)
- Calibration: inside 1 sigma, inside 2 sigma, with the targets
- Training steps, buffer size, milliseconds per training step
- A small learning curve

### 8. The look and the fun layer

- Dark background: near-black with a slight blue tint.
- The ghost: a soft glow, pale white to light cyan, sized and blurred by the predicted uncertainty.
- The creature: warmer and solid, with a little personality. It follows the real cursor with smooth lag, so it reads as the user, not the prediction.
- Light mode through `prefers-color-scheme`: pale background, a softer and darker haze.
- Reduced motion: keep the prediction, drop trails and wobble.
- "Pass the mouse" moment: a short prompt suggesting someone else try it, and a note when error jumps.
- Later: a "race" toggle where the creature chases the ghost instead of the cursor, so it appears to anticipate you.

### 9. The demo page

Mostly empty on purpose: a dark playground with the creature, the ghost, a small stats panel and a one-line explanation. A "See it on a real page" toggle swaps the playground for a sample webpage (an article with headings, links and buttons) so the ghost glides over it the way the widget would.

## Architecture: engine and surfaces

The engine (input, features, model, training, baselines, metrics) is a standalone module with no DOM styling and no page assumptions. It takes pointer samples in and gives predictions and stats out. Two surfaces use it:

- **The demo page:** where we prove the model works. Playground, stats panel, real-page toggle.
- **The widget (end goal):** one script tag that adds the ghost glow to any website. It reads the host page's colors, draws on a full-page overlay with `pointer-events: none`, has no stats panel and makes no network requests.

## Plan (one small, shippable step per day)

1. **Scaffold:** Vite, TypeScript strict, Vitest, Playwright, lint and format, `npm run check`, GitHub Actions, Vercel deploy. Empty canvas page.
2. **Input:** pointer capture, 60 Hz resampler, gap detection, a simple trail. Unit tests for the resampler.
3. **Baselines and metrics:** hold, constant velocity, constant acceleration, rolling error, stats panel. Tests for each.
4. **The network:** layers, tanh, Gaussian NLL loss, Adam, gradient clipping. Finite-difference gradient check test.
5. **Online learning:** delayed labels, ring buffer, per-frame training within the budget, learning curve. Model vs baselines now live.
6. **Uncertainty:** ellipse ghost and calibration tracking.
7. **Creature and polish:** personality, light mode, reduced motion, touch, mobile layout, "pass the mouse."
8. **See it on a real page:** the toggle that swaps the playground for a sample article, with the ghost gliding over it.
9. **Evidence:** a Vitest suite that runs the seeded synthetic paths through the real engine and checks the model against the baselines; Playwright checks that the page runs and the panel updates; `docs/RESULTS.md` with real numbers; README with a GIF and the honest results.

**Milestone after the demo: the widget.** One script tag, reads host colors, overlay with `pointer-events: none`, no stats panel, no network.

## What counts as success

- On smooth paths (circle, figure-eight), the model beats constant velocity by a clear margin, and the number is in `RESULTS.md`.
- On a random walk, the model does not beat constant velocity, and the write-up says that openly. "Random walk" here means a seeded velocity random walk on an open plane with no walls: each 60 Hz step adds independent Gaussian noise to the velocity. The expected future velocity then equals the current velocity, so constant velocity is already the best possible guess for the mean. The model should tie it (within a few percent), not beat it. Its uncertainty can still be better than a fixed guess, because the spread grows with the horizon in a way it can learn. This shows we understand what the model can and cannot learn.
- Calibration within about 10 points of the targets after a minute of use, or an honest explanation of why not.
- 60 fps and under 2 ms per training step on a normal laptop.

## Open questions (decide with Luba, record in DECISIONS.md)

- Do we add a small written explainer page on the site, or keep it all in the README?
- Portfolio integration: a new project slab on liubov-dev.vercel.app linking to the live demo.

## Portfolio framing (for later)

"Ghost Cursor: a cursor follower that learns how you move. A small neural network, written from scratch, trains live in your browser and predicts where your cursor will be half a second from now. It shows its error next to simple physics baselines, and checks whether its own uncertainty is honest."
