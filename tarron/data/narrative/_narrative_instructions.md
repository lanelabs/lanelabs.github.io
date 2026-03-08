# Narrative Data

Story mechanics that are intentionally world-neutral — they work across all settings.

## Files and Formats

### conflicts.json
`["Full phrase", "Verb clause", "Description"]` tuples.
Barrel output: `{full, verb}` objects.

### mysteries.json
`["Full phrase", "Verb clause", "Description"]` tuples.
Barrel output: `{full, verb}` objects.

### morals.json
Strings for single-word virtues, or `["Full phrase", "About form", "Description"]` tuples for phrased morals.
`null` for the about form means it auto-computes (lowercase of full).
Barrel output: strings or `{full, about}` objects.

### tones.json
`["Adjective", "Noun form", "Description"]` tuples.
Barrel output: `{full, noun}` objects.

### wishes.json
`["Infinitive phrase", "Gerund/bare form", "Description"]` tuples.
Barrel output: `{full, bare}` objects.

### emotions.json
Two arrays: `preEmotions` and `postEmotions`, each `["text", "Description"]` tuples.
Barrel output: string arrays.

## Rules

- One specific entry per tuple
- No world-specific content — these must work across all settings
