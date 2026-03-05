# Map Data Guide

## What this folder contains

Two kinds of data for procedural map generation:

- **Region types** (`regions_*.json`) — Labels for territories on a world map. Each entry names a kind of region (Kingdom, Vale, Strait, etc.) that a storyteller might place. The description defines what that region type *is*.
- **Terrain types** (`terrain_*.json`) — The physical terrain painted onto hex maps. Split by rendering role: backgrounds (hex fill), icons (settlement markers), and paths (linear features like rivers and roads).

## File format

Each JSON file is an object with two keys:
- `"description"` — a one-sentence summary of what the file contains
- `"regions"` or `"terrain"` — the array of entries, each `["Name", "Description"]`

## Description rules

- One sentence, roughly 10–20 words
- **Definitional voice** — flows naturally as a definition after the name. Use participial and descriptive phrasing rather than finite active verbs.
- **For regions**: evoke scale, mood, and what it feels like to *be there* or to see it on a map. A Vale isn't just "a valley" — it's a specific kind of valley with character.
- **For terrain**: describe the visual and physical character — what a traveler sees, hears, and struggles through.
- **Vary sentence structure** — don't repeat one pattern across entries.

### Do / Don't

| Don't (dictionary stub) | Do (evocative) |
|---|---|
| "A territory traditionally ruled by a duke." | "A noble's personal domain, often a day's ride across and fiercely defended." |
| "A narrow valley." | "A tight, shadowed valley where streams echo off close stone walls." |
| "Large body of water." | "Vast, wind-churned waters stretching beyond sight, hiding depth and danger." |
| "Land along water." | "A narrow strip where wave-smoothed stones meet salt grass and driftwood." |

## Examples

Regions:
- `"A vast sweep of sun-scorched sand and rock where water is worth more than gold."`
- `"Fortified borderland held by a military order, always braced for the next incursion."`
- `"A shallow valley of gentle streams and wildflower meadows sheltered by low ridges."`

Terrain:
- `"Rolling open country of waist-high grass bending under a constant wind."`
- `"Sheer grey peaks jutting above the treeline, capped with snow year-round."`
