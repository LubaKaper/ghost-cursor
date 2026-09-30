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

It connects to her site, where a red circle already follows the cursor. Ghost Cursor is that circle, grown a brain.

## How it works

### 1. Input

- Capture Pointer Events (mouse, trackpad, touch, pen).
- Pointer events arrive at uneven times, so resample to a fixed rate (60 Hz) with linear interpolation. The model needs evenly spaced steps.
- Mark gaps: pointer left the window, tab hidden, or no movement for more than about 300 ms. Do not train across gaps.

### 2. Features and target

- Input: the last 8 steps of movement as velocity deltas (dx, dy), normalized by viewport size. Relative movement makes the model work anywhere on screen.
- Target: displacement from the current position to the position 30 steps later (about 500 ms). This is the "horizon."
- Keep the horizon configurable. Shorter is easier and less impressive, longer is harder and more fun.

### 3. Baselines (built before the model)

- **Hold:** you will stay where you are.
- **Constant velocity:** you keep going in the same direction at the same speed.
- **Constant acceleration:** you keep speeding up or turning at the same rate.

The stats panel shows each one's error next to the model's. The headline number is how much better (or worse) the model is than constant velocity.

### 4. The model

- A small multilayer network, for example 16 inputs, two hidden layers of 32 with tanh, and 4 outputs.
- Outputs: mean displacement (x, y) and log standard deviation (x, y). Predicting log standard deviation keeps it positive and stable.
- Loss: Gaussian negative log-likelihood. It rewards being right and penalizes being confidently wrong.
- Optimizer: Adam, written by hand, with gradient clipping.
- Verify backprop with a finite-difference gradient check in the unit tests.

### 5. Online training

- Every frame, make a prediction and remember it.
- A prediction becomes a training example only once its horizon has passed and the real future position is known.
- Store examples in a ring buffer (for example the last 2,000). Each frame, run one small mini-batch update from the buffer, within the time budget.
- Controls: reset the model, pause learning, and show a learning curve.

### 6. Uncertainty you can check

- Draw the ghost as a soft ellipse sized by the predicted standard deviation.
- Track calibration: for a 2D Gaussian, about 39% of real positions should fall inside the 1-sigma ellipse and about 86% inside the 2-sigma ellipse. Show the real percentages. If the model is overconfident, the panel says so.

### 7. The stats panel

Plain labels, updated live:

- Model error vs constant velocity vs hold (rolling average in pixels)
- "Model is X% better than constant velocity" (or worse, stated plainly)
- Calibration: inside 1 sigma, inside 2 sigma, with the targets
- Training steps, buffer size, milliseconds per training step
- A small learning curve

### 8. The fun layer

- The creature: a red blob with a little personality that follows the real cursor with smooth lag.
- The ghost: a faint red haze at the predicted position, tightening as the model gets confident.
- "Pass the mouse" moment: a short prompt suggesting someone else try it, and a note when error jumps.
- Optional later: a "race" mode where the creature chases the ghost instead of the cursor, so it appears to anticipate you.

## Plan (one small, shippable step per day)

1. **Scaffold:** Vite, TypeScript strict, Vitest, Playwright, lint and format, `npm run check`, GitHub Actions, Vercel deploy. Empty canvas page in the portfolio style.
2. **Input:** pointer capture, 60 Hz resampler, gap detection, a simple trail. Unit tests for the resampler.
3. **Baselines and metrics:** hold, constant velocity, constant acceleration, rolling error, stats panel. Tests for each.
4. **The network:** layers, tanh, Gaussian NLL loss, Adam, gradient clipping. Finite-difference gradient check test.
5. **Online learning:** delayed labels, ring buffer, per-frame training within the budget, learning curve. Model vs baselines now live.
6. **Uncertainty:** ellipse ghost and calibration tracking.
7. **Creature and polish:** personality, reduced motion, touch, mobile layout, "pass the mouse."
8. **Evidence:** end-to-end tests with synthetic paths, `docs/RESULTS.md` with real numbers, README with a GIF and the honest results.

## What counts as success

- On smooth paths (circle, figure-eight), the model beats constant velocity by a clear margin, and the number is in `RESULTS.md`.
- On a random walk, the model does not beat constant velocity (because nothing is predictable), and the write-up says that openly. This shows we understand what the model can and cannot learn.
- Calibration within about 10 points of the targets after a minute of use, or an honest explanation of why not.
- 60 fps and under 2 ms per training step on a normal laptop.

## Open questions (decide with Luba, record in DECISIONS.md)

- Horizon length: 300 ms vs 500 ms vs user-adjustable?
- Should the creature follow the real cursor or the ghost by default?
- Do we add a small written explainer page on the site, or keep it all in the README?
- Portfolio integration: a new project slab on liubov-dev.vercel.app linking to the live demo.

## Portfolio framing (for later)

"Ghost Cursor: a cursor follower that learns how you move. A small neural network, written from scratch, trains live in your browser and predicts where your cursor will be half a second from now. It shows its error next to simple physics baselines, and checks whether its own uncertainty is honest."
