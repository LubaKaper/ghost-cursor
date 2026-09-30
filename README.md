# Ghost Cursor

A cursor follower that learns how you move. A small neural network, written from scratch, trains live in your browser and predicts where your cursor will be half a second from now.

Work in progress. See `docs/PROJECT_BRIEF.md` for the plan.

## Develop

Node.js 22.

```sh
npm install
npm run dev        # local server
npm run check      # format, lint, typecheck, unit tests
npm run test:e2e   # Playwright (run `npx playwright install chromium` once)
```
