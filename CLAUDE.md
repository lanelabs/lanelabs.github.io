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

## Apps

Each app with a build step has its own CLAUDE.md with app-specific instructions.

- **Tarron's Bedtime Story App** — `tarron/bedtime-story-app/` (Vite + React, builds to `docs/tarron/bedtime-story-app/`)
- **Adam's apps** — Self-contained HTML files edited directly in `docs/adam/<app>/index.html` (text-adventure-game, forrest-clean-up)
