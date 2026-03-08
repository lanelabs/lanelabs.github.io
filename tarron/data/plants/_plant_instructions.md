# Plant Data

Plant types organized by world, usable for scenery, ingredients, and environmental flavor.

## Format

Each JSON file contains a `plants` array of `["Name", "Description"]` tuples:

```json
{
  "description": "Category description",
  "plants": [
    ["Oak Tree", "A broad-trunked giant spreading its crown wide, old enough to remember what stood here before."],
    ["Moss", "A soft green carpet clinging to stone and bark, quietly burying whatever it covers."]
  ]
}
```

## Rules

- One plant type per entry — never combine with "or"
- Names should be single nouns or short noun phrases (no articles)
- Descriptions should be a single evocative sentence
- Place files in the appropriate world subfolder (general/, fantasy/, modern/, ocean/, scifi/)
- General plants should work across all settings
