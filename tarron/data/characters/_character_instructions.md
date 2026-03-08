# Character Data

Character types usable as both NPCs and PCs across different worlds.

## Format

Each JSON file contains a `characters` array of `["Name", "Description"]` tuples:

```json
{
  "description": "Category description",
  "characters": [
    ["Farmer", "A sun-weathered figure who works the land from dawn to dusk."],
    ["Shepherd", "A patient wanderer guiding flocks to fresh pasture."]
  ]
}
```

## Rules

- One character type per entry — never combine with "or"
- Names should be single nouns or short noun phrases (no articles)
- Descriptions should be a single evocative sentence
- Place files in the appropriate world subfolder (general/, fantasy/, modern/, ocean/, scifi/)
- General characters should work across all settings
