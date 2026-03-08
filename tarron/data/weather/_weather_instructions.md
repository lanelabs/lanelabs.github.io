# Weather Data

Atmospheric conditions that color the scene in stories.

## Format

Each JSON file contains a `weather` array of 4-element tuples:
`["Full phrase", "Adjective", "Noun phrase", "Description"]`

```json
{
  "description": "Category description",
  "weather": [
    ["During a thunderstorm", "stormy", "the thunderstorm", "A violent electrical storm with crashing thunder and driving rain."]
  ]
}
```

The barrel transforms each tuple into `{full, adj, noun}` objects.

## Rules

- Full phrase must start with a preposition/conjunction (during, on, under, in, as, at)
- Adjective must be a single word or hyphenated compound
- Noun phrase must work as a subject/object (usually starts with "the")
- One specific condition per entry — never combine with "or"
