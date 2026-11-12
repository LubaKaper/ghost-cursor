# Results

Every number here comes from `npm run report`, which runs predictors on the fixed synthetic paths in `src/synthetic/paths.ts` (60 s each, 60 Hz, positions rounded to whole pixels, random walk seed 1). Error is the average distance in CSS pixels between where a predictor guessed the pointer would be and where it really was, scored once the horizon has passed. Lower is better.

## 2026-11-12: Baselines

This is the bar the model has to clear. No model yet.

The paths:

- **circle:** radius 200 px, one lap every 2 s (about 630 px/s).
- **figure-eight:** 300 by 150 px, one loop every 3 s.
- **zigzag:** straight strokes at 600 px/s with a sharp reversal every 0.6 s.
- **random walk:** velocity random walk on an open plane (independent Gaussian noise added to the velocity each step). Constant velocity is the best possible mean guess here by construction.

Window sizes are the number of recent steps each fit uses.

### Horizon 300 ms (18 steps)

| Predictor                       | circle | figure-eight | zigzag | random walk |
| ------------------------------- | -----: | -----------: | -----: | ----------: |
| Hold position                   |  181.7 |        175.2 |  136.1 |       103.6 |
| Constant velocity, 2 steps      |   91.7 |         89.5 |   99.1 |        12.9 |
| Constant velocity, 4 steps      |  100.7 |         97.9 |  105.3 |         9.3 |
| Constant velocity, 8 steps      |  118.9 |        115.2 |  125.0 |         9.7 |
| Constant velocity, 12 steps     |  136.6 |        131.8 |  144.9 |        10.5 |
| Constant acceleration, 4 steps  |   76.6 |         77.4 |  226.9 |        66.8 |
| Constant acceleration, 8 steps  |   46.3 |         54.7 |  191.8 |        21.0 |
| Constant acceleration, 12 steps |   57.7 |         68.0 |  201.2 |        15.9 |
| Constant acceleration, 16 steps |   71.1 |         83.2 |  213.7 |        14.7 |

### Horizon 500 ms (30 steps)

| Predictor                       | circle | figure-eight | zigzag | random walk |
| ------------------------------- | -----: | -----------: | -----: | ----------: |
| Hold position                   |  283.0 |        271.7 |  177.3 |       172.9 |
| Constant velocity, 2 steps      |  237.9 |        227.0 |  261.5 |        23.9 |
| Constant velocity, 4 steps      |  251.6 |        239.3 |  275.7 |        19.1 |
| Constant velocity, 8 steps      |  278.8 |        263.8 |  308.9 |        19.7 |
| Constant velocity, 12 steps     |  304.8 |        286.9 |  334.3 |        20.9 |
| Constant acceleration, 4 steps  |  218.7 |        236.0 |  591.3 |       172.9 |
| Constant acceleration, 8 steps  |  169.7 |        196.0 |  518.3 |        52.3 |
| Constant acceleration, 12 steps |  196.4 |        226.0 |  529.5 |        38.4 |
| Constant acceleration, 16 steps |  226.1 |        257.7 |  546.3 |        34.4 |

### What this says

- **Shorter velocity windows win on smooth paths, longer ones on noise.** At 500 ms the 2-step velocity fit beats 4 steps by about 5% on circle and figure-eight, but loses by 25% on the random walk (23.9 vs 19.1 px), because whole-pixel rounding makes 2-step velocity jittery. The live panel uses 4 steps for velocity and 8 for acceleration. Real hand input is noisier than rounded synthetic paths, so a little smoothing is the safer default.
- **Constant acceleration is the strongest baseline on curved paths.** At 500 ms it misses by 170 px on the circle against 252 px for constant velocity (4 steps). The model has to beat this too, not just constant velocity, before we call a smooth-path result good.
- **On the zigzag, nothing beats holding still at 500 ms.** Hold misses by 177 px, constant velocity by 276 px, constant acceleration by 518 px. Extrapolators overshoot every corner. This is the path where a model could clearly win by learning that strokes reverse.
- **On the random walk, constant velocity wins, as designed.** The model should tie it, not beat it.
- **Constant acceleration is fragile on jerky input.** Its guess multiplies the fitted acceleration by the horizon squared (900 at 30 steps), so any jerk in the input blows up. Driving the page with Playwright, which moves the pointer the same distance per event while the time between events varies from 18 to 35 ms, made it swing between 75 px and 939 px on the same circle. Real hands are smoother than that, but fast flicks will hit it the same way. The panel shows a plain average, so these outliers count in full. We are keeping the average rather than switching to a median, because a ghost that flies off by 900 px is a real failure a viewer sees.

### How the model will be judged

For each path and horizon, the model is compared against the best baseline on that path, using the best window from the tables above, not only against the window the panel uses. A baseline window picked after the fact cannot make the model look better than it is.
