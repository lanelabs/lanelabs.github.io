# Available Placeholders

Reference for all placeholder slots available in template strings.

## Syntax

| Pattern          | Behavior                                              |
|------------------|-------------------------------------------------------|
| `{name}`         | Default form (includes article): "a quest"            |
| `{name.bare}`    | Article-stripped form: "quest"                         |
| `{name.xyz}`     | Custom form defined in the data file                  |
| `{Name}`         | Auto-capitalise first letter: "A quest"               |
| `{Name.bare}`    | Capitalise + custom form: "Quest"                     |

The `.bare` form is auto-computed for every value by stripping the
leading article ("a", "an", "the"). Custom forms beyond `.bare` must
be defined as object properties in the data file.

## A/An Auto-correction

Templates don't need to worry about "a" vs "an" before placeholders.
The rendering engine automatically fixes `a {placeholder}` to `an {placeholder}`
(or vice versa) based on the resolved value's first letter.

## Placeholders

### Characters

| Placeholder              | Example output                          |
|--------------------------|-----------------------------------------|
| `{character1}`           | "a farmer"                              |
| `{character1.emotional}` | "a scared farmer" / "a farmer who is afraid of the dark" |
| `{character2}`           | "a fox"                                 |
| `{character2.emotional}` | "a scared fox"                          |

Pick ONE character to be emotional. The other uses the plain form.

### Setting & Weather

| Placeholder      | Example output                 |
|------------------|--------------------------------|
| `{setting}`      | "a castle" / "a rooftop garden"|
| `{weather}`      | "during a thunderstorm"        |
| `{weather.adj}`  | "stormy" / "moonlit"           |
| `{aWeatherAdj}`  | "a stormy" / "an overcast"     |

### Story Elements

| Placeholder       | Example output                            |
|-------------------|-------------------------------------------|
| `{item}`          | "a golden map" (article + descriptor + item) |
| `{hook}`          | "a broken promise" / "a sealed door that won't open" |
| `{opening}`       | "a quiet moment alone" / "someone saying goodbye" |
| `{storyShape}`    | "a quest" / "a race against time"         |
| `{storyShape.bare}` | "quest" / "race against time"          |

### Tone

| Placeholder    | Example output     |
|----------------|--------------------|
| `{tone}`       | "cozy" / "spooky"  |
| `{tone.noun}`  | "warmth" / "chills" |
| `{aTone}`      | "a cozy" / "an adventurous" |

### Moral

| Placeholder     | Example output                           |
|-----------------|------------------------------------------|
| `{moral}`       | "Courage" / "Don't give up"              |
| `{moral.about}` | "courage" / "never giving up"           |

Note: `{Moral}` (capitalised) is useful for end-of-sentence lessons.
`{moral.about}` is designed to work after "about": "a tale about {moral.about}".

## Adding New Forms

If a template needs a form that doesn't exist (e.g. `{moral.gerund}`):

1. Go to the data file (e.g. `src/data/general/morals.js`)
2. Convert plain strings into objects with the new form key:
   ```
   BEFORE:  'Courage'
   AFTER:   { full: 'Courage', gerund: 'having courage' }
   ```
3. Items already defined as objects just get the new key added.
