# Food Data

Food types organized by world, usable for feasts, gifts, comfort, and plot elements.

## Format

Each JSON file contains a `foods` array of `["Name", "Description"]` tuples:

```json
{
  "description": "Category description",
  "foods": [
    ["Stew", "A thick bubbling pot of whatever was on hand, the kind of meal that fixes most problems."],
    ["Honey", "Golden and slow, stolen from bees who haven't forgiven anyone yet."]
  ]
}
```

## Rules

- One food type per entry — never combine with "or"
- Names should be single nouns or short noun phrases (no articles)
- Descriptions should be a single evocative sentence
- Place files in the appropriate world subfolder (general/, fantasy/, modern/, ocean/, scifi/)
- General foods should work across all settings
