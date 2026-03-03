# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See also the [root CLAUDE.md](../../CLAUDE.md) for repo-wide conventions (git remote, commit message format, deployment patterns).

## Commands

```bash
npm run dev       # Local dev server
npm run build     # Production build → ../../docs/tarron/bedtime-story-app/
```

No linting, testing, or formatting is configured.

## Architecture

Single-component React app (Vite + React 18). All logic lives in `src/App.jsx` — no router, no state library, no component tree beyond the root `App`.

### Two display modes

The app generates random story elements and shows them in one of two modes (toggled in Settings):

1. **Narrative template mode** (default) — A template string with `{placeholder}` slots is randomly chosen from `src/data/general/templates.js`, resolved against picked elements via `applyTemplate()`, and color-coded by category.
2. **List mode** — Elements displayed as a categorized list (Hook / Pieces / Impact sections).

A "Copy for AI" button assembles the resolved template, element list, and detailed writing-instructions into clipboard text.

### Data system

Story content lives in `src/data/`, split into:

- **`general/`** — Shared across all worlds. Contains categories that only exist here (templates, wishes, morals, tones, emotions, flavorLines, conflicts, mysteries, roles) plus world-neutral people, animals, settings, items, descriptors, weather, events.
- **World folders** (`fantasy/`, `scifi/`, `modern/`, `ocean/`) — Each exports: people, animals, settings, items, descriptors, weather, events. At generation time, arrays from the active world(s) merge with general via `mergeArrays()`.

Each world folder has an `index.js` barrel file. Adding a new world means creating a folder with the same exports and registering it in `App.jsx` (the `worlds` object and `worldLabels` map).

### Data entry conventions

Data values can be plain strings or objects with named forms. The template engine resolves forms via dot notation:

- `{setting}` → the `full` value (lowercased)
- `{setting.bare}` → article stripped (auto-computed)
- `{weather.adj}` → explicit custom form defined on the object
- `{Character1}` → capital first letter triggers auto-capitalisation
- `{character1.emotional}` → character with random emotion applied
- `{hook}` → noun phrase ("a broken promise"); `{hook.verb}` → event clause ("a promise was broken")
- `{setting|event}` → **pipe syntax** — randomly picks one placeholder at generation time; works with any combination of keys

**Each data file has header comments documenting the required format, valid forms, and constraints** (e.g. "must start with A/An", "must be an object with adj form"). Always read them before adding entries.

### Template authoring

Templates in `src/data/general/templates.js` are plain strings with `{placeholder}` slots, using `\n\n` for paragraph breaks. Each template has a comment block listing dimension tags (voice, opening, arc, tension, etc.) plus its baked-in story shape for coverage tracking. Story shapes (quest, rescue, discovery, etc.) are written directly into each template's prose rather than being a separate random element. `applyTemplate()` handles a/an auto-correction, so templates can write `a {character1}` and it fixes to `an` when the value starts with a vowel.

### Config

`src/config.js` controls how many of each element type are picked per generation (NUM_CHARACTERS, NUM_ITEMS, etc.).
