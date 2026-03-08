# Race Data Guide

## What races are

Races are sapient peoples with cultures, languages, and societies — beings that could *be* a character. Each race file describes the species as a whole; subraces describe the notable variants within it.

**Overlap with creatures is OK.** Some sapient races (Gnoll, Troll, Mind Flayer) also appear in `creatures/`. The creature entry describes the *encounter*; the race entry describes the *people* — their culture, outlook, and what makes them interesting as characters.

## File format

Each JSON file is an object with three keys:
- `"description"` — a one-sentence portrait of the race
- `"tags"` — an array of classification tags (e.g. `["humanoid"]`, `["small", "fey"]`)
- `"subraces"` — the array of variants, each `["Name", "Description"]`

## Race description rules

- One sentence, roughly 10–20 words
- **Definitional voice** — each description should flow naturally as a definition: "Tall, graceful beings with pointed ears..." not "Stand tall and move gracefully...". Use participial and descriptive phrasing rather than finite active verbs.
- Lead with the most striking physical or cultural trait — what a storyteller pictures first
- Include what makes this race *distinct as characters* — their outlook, reputation, or way of life
- Avoid the template `"X are a Y subrace of Z known for distinct heritage."` — this says nothing
- **Vary sentence structure** — mix articles, adjectives, participial openers. Don't start every description the same way.

### Do / Don't

| Don't (template / flat) | Do (vivid, definitional) |
|---|---|
| "Elf are medium humanoid beings common in fantasy settings." | "Tall, graceful beings with pointed ears and centuries-long lifespans who prize magic and tradition." |
| "Dwarf are small humanoid beings common in fantasy settings." | "Stout, bearded mountain folk carving great halls from stone and forging legendary weapons." |
| "Goblin are small humanoid beings common in fantasy settings." | "Scrappy, sharp-toothed scavengers thriving in swarms and adapting to any environment." |

## Subrace description rules

- One sentence, roughly 10–20 words
- **Definitional voice** — same as above. Flows as "High Elves are tower-dwelling scholars..." not "High Elves dwell in towers and study..."
- Explain what sets this variant apart *from the parent race* — don't repeat the parent description
- Lead with the key differentiator: where they live, what they do, or how they look different
- Avoid repeating the subrace name in the description
- **Vary sentence structure** across sibling subraces

### Do / Don't

| Don't (template) | Do (vivid, definitional) |
|---|---|
| "High Elf are a medium subrace of Elf known for distinct heritage." | "Tower-dwelling scholars considering arcane mastery the highest pursuit." |
| "Hill Dwarf are a small subrace of Dwarf known for distinct heritage." | "Hardy settlers of the foothills, known for keen intuition and herbal remedies." |
| "Snow Goblin are a small subrace of Goblin known for distinct heritage." | "White-furred goblins adapted to frozen wastes, building warrens beneath the permafrost." |

Notice the pattern: templates repeat the race name and say nothing specific; vivid descriptions show what makes the variant *different*.

## Examples

Race descriptions:
- `"Towering, thick-skinned brutes with jutting tusks and a talent for war."`
- `"Shape-shifting humanoids mimicking any face, forever searching for their own identity."`
- `"Amphibious fish-folk building coral cities in the deep and worshipping the tides."`

Subrace descriptions:
- `"Forest-dwelling recluses speaking to animals and vanishing between the trees."`
- `"Ashen-skinned underdark outcasts worshipping a spider goddess and scheming in the dark."`
- `"Clockwork soldiers built for war — tireless and unflinching on the battlefield."`
