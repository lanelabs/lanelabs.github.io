# CLAUDE.md — Dwarfstead

## Overview

Dwarfstead is a 2D side-scrolling roguelite base-builder about dwarven mining expeditions. See `DESIGN.md` for the full game design document.

## Tech Stack

- **Framework:** Vite + Phaser 3
- **Language:** TypeScript
- **Art:** 8-16px pixel art, sprite sheets and tilemaps

## Project Structure

- **Source:** `tarron/dwarfstead/` (Vite project root)
- **Build Output:** `docs/tarron/dwarfstead/`
- **Base Path:** `/tarron/dwarfstead/` (for Vite config and asset references)

## Build & Dev

```bash
cd tarron/dwarfstead
npm install
npm run dev      # local dev server
npm run build    # production build to docs/tarron/dwarfstead/
```

## Key Conventions

- Vite base path must be set to `/tarron/dwarfstead/` in `vite.config.ts`
- Build output directory must be `../../docs/tarron/dwarfstead`
- Commit messages should be prefixed with `dwarfstead:` (e.g. `dwarfstead: add terrain generation`)
- Follow the design doc (`DESIGN.md`) for gameplay decisions and scope
- MVP scope is defined in the design doc — avoid building deferred features unless explicitly requested
