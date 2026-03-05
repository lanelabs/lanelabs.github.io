# Job Data Guide

## What jobs are

Jobs are occupations an NPC might hold — trades, professions, ranks, and roles that define how a character spends their days and where they fit in society. The name is the title; the description should make a storyteller immediately picture this person — what they look like, how they carry themselves, and what they do.

## File format

Each JSON file is an object with two keys:
- `"description"` — a one-sentence summary of what the file contains
- `"jobs"` — the array of entries, each `["Name", "Description"]`

## Description rules

- One sentence, roughly 8–15 words
- **Definitional voice** — each description should flow naturally after the name, as though completing "A Blacksmith is..." or "A Thief is...". Use participial and descriptive phrasing (e.g. "hammering", "slipping through", "stained with") rather than finite active verbs (e.g. "hammers", "slips", "stains").
- **Paint the person, not just the task** — include at least one visual or behavioral detail: what they look like, smell like, carry, wear, or how they move. A Tanner isn't just someone who tans hides — they're someone with cracked hands reeking of urine and lime.
- Be concrete: name the materials, tools, products, or situations involved
- Distinguish similar roles: a Cobbler and a Cordwainer both work with shoes — say *how* they differ
- **Vary sentence structure** — don't repeat one pattern across entries. Mix articles, adjectives, participial openers, and connecting words ("but", "yet", "while", dashes).

### Do / Don't

| Don't (just the task) | Do (the person and the task) |
|---|---|
| "Hammers red-hot iron into horseshoes, hinges, and blades at the forge." | "A soot-streaked figure hammering red-hot iron into horseshoes, hinges, and blades." |
| "Steals purses, picks locks, and slips through shadows for a living." | "A quick-fingered shadow slipping through crowds and picking locks for a living." |
| "Commands armies in the field, making the tactical calls that decide battles." | "A weathered strategist commanding from the hilltop, making the calls that decide battles." |
| "Tans animal hides with bark and salt, turning raw skins into workable leather." | "A sharp-smelling worker with cracked hands, soaking hides in bark and lime to make leather." |

Notice the shift: task-only descriptions say what the job *does*; full descriptions show what the *person* looks and feels like while doing it.

## Examples

- `"A hunched figure hawking cheap goods from a creaking wooden cart, village to village."`
- `"A star-gazing mystic charting horoscopes and advising nobles on the turns of fate."`
- `"A weathered handler keeping the lord's hounds fed, trained, and straining at the leash."`
- `"A grimy apothecary grinding herbs and minerals into salves, tonics, and dubious cure-alls."`
- `"A flour-dusted early riser pulling hot loaves from a clay oven before dawn."`
