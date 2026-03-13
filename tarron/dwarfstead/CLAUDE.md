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

## Architecture — Import Boundaries (enforced by ESLint)

The codebase is split into three zones with strict import rules:

| Directory | Can import from | Cannot import |
|-----------|----------------|---------------|
| `src/sim/` | Only itself | `phaser`, `node:*`, `cli/`, `renderer/` |
| `src/cli/` | `sim/`, `node:*` | `phaser`, `renderer/` |
| `src/renderer/` | `sim/`, `phaser` | `cli/`, `node:*` |

**Why:** All game logic lives in `src/sim/` with zero Phaser or Node imports. This means AI can test the full game via `npm run cli` without a browser, and humans get the same game rendered visually via Phaser.

Run `npm run lint` to check boundaries. These rules are in `eslint.config.js`.

## GameLog Contract

`src/sim/log/GameLog.ts` is the single source of truth for everything that happens in the game. Both the CLI output and the in-game Scribe panel read from it.

Rules for any new game logic:
- Every `Command.execute()` must call `game.log.add()` to record what happened
- Every `System.update()` must log notable events (creature spotted, entity fell, etc.)
- Renderers (CLI and Phaser) only **read** sim state — never mutate it
- If something happened but isn't in the GameLog, it's a bug

## Build & Dev

```bash
cd tarron/dwarfstead
npm install
npm run dev      # local dev server (Phaser)
npm run build    # production build to docs/tarron/dwarfstead/
npm run cli      # text mode — play/test via terminal
npm run lint     # check import boundaries + code quality
```

**Before any PR:** run `echo "look\ndig down\nlog\nquit" | npm run cli` to verify the sim layer works headlessly.

## Key Conventions

- Vite base path must be set to `/tarron/dwarfstead/` in `vite.config.ts`
- Build output directory must be `../../docs/tarron/dwarfstead`
- Commit messages should be prefixed with `dwarfstead:` (e.g. `dwarfstead: add terrain generation`)
- Follow the design doc (`DESIGN.md`) for gameplay decisions and scope
- MVP scope is defined in the design doc — avoid building deferred features unless explicitly requested
- When hitting the 400-line ESLint limit (`max-lines`), prefer extracting logical units into separate files over condensing code. Only condense for easy wins (removing blank lines, merging trivial declarations).
