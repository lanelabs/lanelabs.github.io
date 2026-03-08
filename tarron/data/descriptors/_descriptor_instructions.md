# Descriptor Files

## What are descriptors?

Descriptors are prefix and suffix words used to generate fantasy names like "the Blazing Sword" or "Sword of Blazes." Each descriptor entry represents a single concept (e.g., "blaze") and contains two arrays:

- **prefixes** -- words that can appear before a noun (e.g., "Blazing Sword", "Blaze Hammer")
- **suffixes** -- words that can appear after a noun with "of" or "the" (e.g., "Sword of Blazes", "the Blazing")

## File format

Each category file is a JSON object with two keys:

```json
{
  "description": "One-sentence summary of what this category contains.",
  "descriptors": [
    {"prefixes": ["Blazing", "Blaze"], "suffixes": ["Blazes", "Blazing"]},
    {"prefixes": ["Burning"], "suffixes": ["Burns", "the Burning"]}
  ]
}
```

- Each descriptor entry is on a single line for easy scanning.
- Entries are sorted alphabetically by their first prefix within each file.
- Files use 2-space indentation.

## Thematic categories

Entries are grouped by theme across these files:

| File | Description |
|------|-------------|
| `body_and_senses.json` | Physical body, health, senses, bodily functions |
| `colors.json` | Colors and visual hues |
| `combat_and_power.json` | Warfare, fighting, strength, destruction |
| `creatures_and_races.json` | Fantasy creatures, mythical beings, humanoid races |
| `death_and_decay.json` | Death, undeath, decay, the macabre |
| `elements_and_nature.json` | Natural elements, weather, terrain, flora, seasons |
| `emotions_negative.json` | Fear, anger, grief, despair, jealousy |
| `emotions_positive.json` | Joy, love, hope, courage, gratitude |
| `light_and_dark.json` | Light, darkness, shadow, celestial, holy/unholy |
| `magic_and_mystery.json` | Magic, enchantment, curses, illusions, the arcane |
| `materials_and_gems.json` | Metals, minerals, gemstones, crafting materials |
| `mind_and_knowledge.json` | Intellect, wisdom, education, creativity, communication |
| `physical_qualities.json` | Size, speed, shape, texture, physical attributes |
| `social_and_culture.json` | Royalty, social roles, politics, law, religion, trade |
| `states_and_conditions.json` | Abstract states, conditions, transformations, situations |
| `virtues_and_vices.json` | Moral qualities, character traits, virtues, vices |

## Guidelines for adding new entries

1. **Maintain the prefix/suffix distinction.** Prefixes are adjective-like words that precede a noun. Suffixes are noun-like words or phrases that follow "of" or "the."

2. **Group related word forms together.** A single concept entry should contain all its forms: e.g., "Blazing" (prefix), "Blaze" (prefix), "Blazes" (suffix), "Blazing" (suffix).

3. **Keep groups thematic.** Place entries in the category that best matches their primary meaning. When a concept could fit multiple categories, choose the most specific one.

4. **Sort alphabetically** by the first prefix when inserting new entries.

5. **Every entry must go somewhere.** Do not leave concepts uncategorized. If nothing fits, use `states_and_conditions.json` as the catch-all.

## Data origin

These entries were consolidated from two legacy source files (both now removed):

- `attributes.json` -- 1,306 grouped concept entries (primary source, removed after full categorization into the 16 thematic files above)
- `legacy/attributes_generated.json` -- 3,908 flat word entries with prefix/suffix tags (superset of the above, contributed ~33 new words that were merged in as new concept groups)
