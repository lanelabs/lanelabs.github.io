# Faction Data Guide

## What factions are

Factions are *types* of organizations — political structures, military formations, secret societies, trade guilds, etc. Each entry names a kind of group the party might encounter, join, oppose, or hear rumors about. The name is the template; the description explains what that template means in a story.

## File format

Each JSON file is an object with two keys:
- `"description"` — a one-sentence summary of what the file contains
- `"factions"` — the array of entries, each `["Name", "Description"]`

## Description rules

- One sentence, roughly 10–20 words
- **Definitional voice** — each description should flow naturally after the name, as though completing "A Republic is..." or "A Cabal is...". Use participial and descriptive phrasing (e.g. "sharing", "scheming", "bound by") rather than finite active verbs (e.g. "shares", "schemes", "binds").
- Explain what the faction type *does* or *how it operates* — not just what it *is*
- Lead with the defining power dynamic, activity, or structure
- Include what makes this faction type interesting for storytelling — tension, secrecy, ambition, rivalry
- **Vary sentence structure** — don't repeat one pattern across entries. Mix articles, adjectives, participial openers, and connecting words ("but", "yet", "while", dashes).

### Do / Don't

| Don't (finite verb / repetitive pattern) | Do (definitional, varied) |
|---|---|
| "Three powerful figures share rule, each scheming to outmaneuver the other two." | "Three powerful figures sharing rule but each scheming to outmaneuver the other two." |
| "Hired blades fight for whoever fills their purse, loyal only to coin." | "Hired blades loyal only to coin, fighting for whoever fills their purse." |
| "A shadowy inner circle schemes behind closed doors, trusting no outsiders." | "A shadowy inner circle scheming behind closed doors and trusting no outsiders." |
| "A form of government where power is held by elected representatives." | "A state governed by elected officials who answer to the citizenry — at least in theory." |

Notice the shift: finite-verb descriptions ("schemes", "fights", "shares") read like narration of what's happening *right now*. Participial descriptions ("scheming", "fighting", "sharing") read like *what the thing is* — a definition the storyteller can drop straight into world-building.

## Examples

- `"A ruthless trade monopoly fixing prices and crushing independent merchants without mercy."`
- `"A decentralized resistance network operating through coded messages and dead drops."`
- `"A sworn order of knights bound by oath to defend a sacred charge, even unto death."`
- `"A loose tribal confederation where each chief rules independently but all answer the war drum."`
- `"A theocratic council of high priests whose divine mandate none dare openly question."`
