# Decisions

Newest first. Each entry: what we decided, why, and what would make us revisit it.

## 2026-09-30: Day 1 scaffold

**TypeScript 6.0, not 7.0.** TypeScript 7 (the native port) is out, but typescript-eslint only supports up to 6.0. Revisit when typescript-eslint supports 7.

**ESLint (strict type-checked) and Prettier for lint and format.** The brief asks for lint and format; these are the standard tools and add nothing to the bundle. Strict type-checked rules catch unsafe `any` and floating promises, which matters more in hand-written math code than style does.

**Self-host the fonts instead of loading Google Fonts.** The rules say no network requests at runtime. Unbounded and Onest are OFL licensed, so the latin woff2 files and their licenses live in `public/fonts/`. Cost: about 85 KB, loaded once.

**Content Security Policy with `connect-src 'none'` on Vercel.** Turns "no data leaves the browser" from a promise into something the browser enforces. Any future `fetch` fails loudly. Set in `vercel.json` only, so Vite dev HMR still works. An e2e test also checks that the page requests nothing from other origins.

**Canvas pixel ratio capped at 2.** 3x screens cost 2.25x the fill of 2x with no visible difference on soft shapes. Revisit if thin lines look blurry on 3x phones.

**Playwright runs a desktop and a phone project.** The phone project catches horizontal overflow and touch layout from day 1.

**Colors are placeholders.** `--paper`, `--ink` and `--red` in `src/style.css` are guesses. I could not reach liubov-dev.vercel.app from the build sandbox. Replace with the real values.
