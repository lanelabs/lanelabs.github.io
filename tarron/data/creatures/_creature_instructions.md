# Creature Data Guide

## Creatures vs NPCs

- **Creatures** = encounters and world-building: animals, beasts, monsters, supernatural entities. Things you *find* in the wild, in dungeons, in the sky.
- **NPCs** (in `npcs/npc__races.json`) = sapient beings with societies, culture, language. Things that could *be* a character.
- **Overlap is OK** when a sapient being also functions as a wild encounter (e.g. Gnoll, Troll, Aboleth appear in both). The creature entry describes the encounter; the NPC entry describes the race/culture.

## File format

Each JSON file is an object with two keys:
- `"description"` — a one-sentence summary of what the list contains
- `"creatures"` — the array of entries, each `["Name", "Description"]`

## Description rules

- One sentence, roughly 10–20 words
- Start with an article ("A", "An") or descriptive phrase
- Present tense
- Lead with the most vivid visual or sensory detail — what a storyteller pictures first
- Include what makes the creature *interesting in a story* — danger, mood, behavior, mystery
- Be specific over generic: concrete actions and images beat abstract trait lists

### Do / Don't

| Don't (bland) | Do (vivid) |
|---|---|
| "A dangerous flying predator with sharp claws and keen senses." | "A blood-sucking flying pest with a needle-like proboscis." |
| "A large dangerous monster with great power and destructive abilities." | "A legendary kaiju-sized monster of unparalleled destructive power." |
| "A small magical creature found in forests." | "A tiny winged fey with powerful magic and mischievous personality." |
| "A dangerous undead creature that attacks the living." | "A wailing undead spirit whose keening cry brings fear and foretells doom." |
| "A hazardous dungeon creature that consumes organic material." | "A transparent, cube-shaped ooze that fills corridors and preserves victims." |

Notice the pattern: bland descriptions say *what category* a thing is; vivid descriptions show *what it does or looks like*.

## Examples

- `"A corrosive ooze that dissolves organic matter and splits when struck."`
- `"A floating sphere covered in eyes, each capable of casting different magical effects."`
- `"A violent fey that dyes its cap red with the blood of victims."`
- `"A tentacle-faced aberration that feeds on brains and controls minds."`
- `"A shambling corpse reanimated by necromancy, driven by hunger for flesh."`
