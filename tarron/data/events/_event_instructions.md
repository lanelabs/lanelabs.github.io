# Event Data

Events, occasions, and encounters organized by world.

## Formats

### Occasions (bedtime story use)
`["Name with article", "Description"]` tuples:
```json
{
  "description": "Category description",
  "occasions": [
    ["A wedding", "A joyful celebration of two lives joining together."]
  ]
}
```

### Encounters (RPG use)
`{type, name, details, scale}` objects:
```json
{
  "description": "Category description",
  "encounters": [
    {"type": "Natural Events", "name": "Flash Flood", "details": "...", "scale": "major"}
  ]
}
```

## Rules

- Occasion names must start with "A" or "An"
- One specific event per entry
- Place files in the appropriate world subfolder
