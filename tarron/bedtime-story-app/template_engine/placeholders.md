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
| `{a\|b}`         | **Pipe** — randomly pick between placeholder `a` or `b` |

The `.bare` form is auto-computed for every value by stripping the
leading article ("a", "an", "the"). Custom forms beyond `.bare` must
be defined as object properties in the data file.

## Pipe Syntax (Combined Pools)

Use `|` to randomly pick between two or more placeholders:

| Pattern                       | Behavior                                     |
|-------------------------------|----------------------------------------------|
| `{setting\|event}`            | Randomly picks either the setting or the event |
| `{setting.bare\|event.bare}`  | Same, but article-stripped form              |
| `{Setting\|Event}`            | Same, capitalised                            |

The choice is made once at generation time and stays fixed for that
story idea. Each side of the pipe is an independent placeholder key
— they can have different forms and even come from different categories.

This is a generic mechanism. Any placeholders can be combined:
`{role\|character1.bare}` would randomly pick between the role and
the first character's name.

## A/An Auto-correction

Templates don't need to worry about "a" vs "an" before placeholders.
The rendering engine automatically fixes `a {placeholder}` to `an {placeholder}`
(or vice versa) based on the resolved value's first letter.

## Placeholders

### Characters

| Placeholder                    | Example output                          |
|--------------------------------|-----------------------------------------|
| `{character1}`                 | "a farmer"                              |
| `{character1.bare}`            | "farmer"                                |
| `{character1.emotional}`       | "a scared farmer" / "a farmer who is afraid of the dark" |
| `{character1.emotional.bare}`  | "scared farmer" / "farmer who is afraid of the dark" |
| `{character2}`                 | "a fox"                                 |
| `{character2.bare}`            | "fox"                                   |
| `{character2.emotional}`       | "a scared fox"                          |
| `{character2.emotional.bare}`  | "scared fox"                            |

Pick ONE character to be emotional. The other uses the plain form.

The `.bare` forms strip the leading article, allowing templates to use
`the {character1.bare}` or `this {character1.emotional.bare}` when "the"
or "this" reads more naturally than "a/an".

### Setting, Event & Weather

| Placeholder        | Example output                 |
|--------------------|--------------------------------|
| `{setting}`        | "a castle" / "a rooftop garden"|
| `{setting.bare}`   | "castle" / "rooftop garden"    |
| `{event}`          | "a wedding" / "a tournament"   |
| `{event.bare}`     | "wedding" / "tournament"       |
| `{setting\|event}` | randomly picks setting or event|
| `{weather}`        | "during a thunderstorm"        |
| `{weather.adj}`    | "stormy" / "moonlit"           |
| `{aWeatherAdj}`    | "a stormy" / "an overcast"     |

Settings are places ("a castle"); events are occasions ("a wedding").
Both are always generated. Use `{setting}` for place-only,
`{event}` for event-only, or `{setting|event}` to randomly pick one.
Most existing templates use `{setting|event}` to get the mixed behavior.

### Story Elements

| Placeholder       | Example output                            |
|-------------------|-------------------------------------------|
| `{item}`          | "a golden map" (article + descriptor + item) |
| `{item.bare}`     | "golden map" (no article)                 |
| `{hook}`          | "a broken promise" / "a sealed door that won't open" |
| `{hook.bare}`     | "broken promise" (article stripped)                   |
| `{hook.verb}`     | "a promise was broken" (event clause)                 |

### Wish / Longing

| Placeholder    | Example output                  |
|----------------|---------------------------------|
| `{wish}`       | "to belong" (infinitive)        |
| `{wish.bare}`  | "belonging" (gerund)            |

Wishes are the deep desire driving the character. The `full` form is an
infinitive ("to belong") for slots like "all they wanted was {wish}". The
`bare` form is a gerund ("belonging") for slots like "about {wish.bare}".

### Role

| Placeholder    | Example output     |
|----------------|--------------------|
| `{role}`       | "mentor"           |
| `{role.bare}`  | "mentor"           |
| `{Role}`       | "Mentor"           |

Roles describe the narrative function a character serves in the story
(mentor, guardian, trickster, etc.), distinct from what they *are*
(farmer, wizard, fox). Plain strings with no article, so `{role}` and
`{role.bare}` produce the same value.

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
