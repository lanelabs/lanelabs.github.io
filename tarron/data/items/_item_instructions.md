# Item Data Guide

## What items are

Items are physical objects that exist in the world — weapons, armor, tools, and everyday props. Each entry names a specific item a character might carry, find, buy, or loot. The name identifies the object; the description should make a storyteller immediately picture it and understand what makes it interesting.

## File format

Each JSON file is an object with two keys:
- `"description"` — a one-sentence summary of what the file contains
- `"items"` — the array of entries, each `["Name", "Description"]`

## Description rules

- One sentence, roughly 10–20 words
- **Definitional voice** — each description should flow naturally after the name, as though completing "A Longsword is..." or "A Tallow Candle is...". Use participial and descriptive phrasing rather than finite active verbs.
- **Lead with the most vivid physical detail** — shape, material, texture, weight, or sound. What does a storyteller picture first?
- **Include what makes the item interesting in a scene** — how it's used, what it's good or bad at, or what it says about whoever carries it.
- For weapons: mention the fighting style or tactical niche, plus a limitation or trade-off.
- For gear: mention what it protects and how it looks or feels to wear.
- For props: mention sensory details — worn wood, tarnished metal, frayed rope — that make a scene feel lived-in.
- **Vary sentence structure** — don't repeat one pattern across entries. Mix articles, adjectives, participial openers, and connecting words.

### Do / Don't

| Don't (catalogue entry) | Do (vivid, definitional) |
|---|---|
| "A helmet worn on the head with eye slits." | "A full-face steel shell with narrow eye slits, muffling sound and limiting vision." |
| "A cooking utensil used for stirring." | "A smooth-handled spoon darkened by years of stirring over an open hearth." |
| "A sword that does a lot of damage." | "A massive two-handed blade cleaving through ranks but exhausting to swing." |

Notice the pattern: catalogue entries list function; vivid descriptions show what the object *looks and feels like* in someone's hands.

## Examples

- `"A wide-brimmed iron hat deflecting rain and glancing blows alike."`
- `"A slim thrusting blade superb for duels — fast and precise but weak against thick hides."`
- `"A battered tin lantern throwing jittery shadows through punched-hole patterns."`
- `"A coil of hempen rope fraying at the ends, stiff with salt and age."`
- `"A curved cavalry sabre built for slashing at speed, awkward on foot."`
