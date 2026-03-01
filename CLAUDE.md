# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GitHub Pages portfolio site deployed from the `docs/` directory. Multiple family members build separate apps under their own subdirectories. Source code lives at the repo root (e.g. `tarron/`), and built output goes into `docs/` for deployment.

## Architecture

- `docs/index.html` — Root landing page with card grid linking to each person's apps
- `docs/<person>/` — Each person's deployed apps
- `<person>/` — Source code for apps that require a build step
- Apps that are single HTML files live directly in `docs/<person>/` with no separate source

Two deployment patterns coexist:
1. **Vite + React apps** — Source in `<person>/<app>/`, built to `docs/<person>/<app>/`
2. **Static HTML apps** — Edited directly in `docs/<person>/<app>/index.html`, no build step

Light/dark mode is supported site-wide using `@media (prefers-color-scheme: dark)` with CSS custom properties.

## Git

- Remote uses SSH alias `github-tarronlane01` for the correct identity file
- Remote URL: `git@github-tarronlane01:lanelabs/lanelabs.github.io.git`
- Commit messages must include which app the changes are for (e.g. "bedtime-story-app: ...") since multiple family members commit to different apps in this repo

---

## Tarron's Apps

### Bedtime Story App

**Source:** `tarron/bedtime-story-app/` (Vite + React)
**Output:** `docs/tarron/bedtime-story-app/`

```bash
# Install dependencies
cd tarron/bedtime-story-app && npm install

# Local dev server
cd tarron/bedtime-story-app && npm run dev

# Production build (outputs to docs/)
cd tarron/bedtime-story-app && npm run build
```

Vite is configured with `base: '/tarron/bedtime-story-app/'` so asset paths work on GitHub Pages.

**Data-driven architecture:** Story elements are modular JS files under `src/data/`, organized as `general/` (shared across all genres) and genre-specific folders (`fantasy/`, `modern/`, `scifi/`). Each genre folder mirrors the general structure. Adding a new genre means creating a new data folder and registering it in the app.

**Key files:**
- `src/App.jsx` — Main component with story generation algorithm
- `src/config.js` — Tunable constants (number of characters, items, etc.)
- `src/data/` — All story content, organized by genre

No linting or testing is configured.

---

## Adam's Apps

Adam's apps are self-contained single HTML files with no build step, no dependencies, and inline SVG/CSS.

**Edit directly in:** `docs/adam/<app>/index.html`

Current apps:
- `docs/adam/text-adventure-game/` — Choice-based learning game with inventory, stats, and localStorage persistence
- `docs/adam/forrest-clean-up/` — Canvas-based forest restoration game with touch/desktop controls
