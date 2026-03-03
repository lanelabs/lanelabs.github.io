# Create a New Bedtime Story Template

You are designing a new narrative template for the bedtime story app. Your goal is to write a creative, distinctive template that tells a fun bedtime story in a way that's different from every existing template.

## Step 1: Read the Template Engine Reference

Read ALL of these files before doing anything else:

1. `template_engine/dimensions.md` — The 18 dimensions and their tags
2. `template_engine/placeholders.md` — All available placeholder syntax and forms
3. `template_engine/ideas/inspiration.md` — One-line ideas and combinations to spark creativity
4. `src/data/general/templates.js` — All existing templates (study these to avoid repeating patterns)

## Step 2: Analyze Coverage Gaps

Scan the dimension comment blocks on every existing template in `templates.js`. Identify which dimension tags have ZERO coverage or are underrepresented. Prioritize filling those gaps.

The README at `template_engine/README.md` has a "Current Gaps" section listing known zero-coverage tags, but always verify against the actual templates in case it's out of date.

**Key coverage rule:** No two templates should share the same combination of Voice + Opening Technique + Structure. These three define the most visible "feel" of a template.

## Step 3: Choose a Creative Constraint

Every good template starts with a fun storytelling idea — not just a mechanical dimension combo. Pick a creative constraint that makes the template interesting as a bedtime story prompt. Think about what makes a parent excited to read this aloud and riff on it.

Examples of creative constraints:
- "The story is told as a warning that's clearly not serious"
- "Everything is framed as the narrator correcting a wrong version"
- "The template reads like a recipe or set of instructions gone sideways"
- "Two separate mini-stories collide in the second paragraph"
- "The narrator is sleepy too and keeps losing the thread"
- "It's structured like a campfire dare"
- "The story sounds like a nature documentary that went off the rails"

The constraint should produce something a parent would enjoy performing and a child would find engaging, funny, cozy, or exciting.

## Step 4: Write the Template

Write the actual template string following these mandatory rules:

### Required Placeholders (must use ALL of these exactly once)

- `{character1}` or `{character1.emotional}` — First character
- `{character2}` or `{character2.emotional}` — Second character
- `{setting}`, `{event}`, or `{setting|event}` — Where/when the story happens (see below)
- `{weather}` — Weather/atmosphere (or use `{weather.adj}` / `{aWeatherAdj}`)
- `{item}` — A special object
- `{hook}` — The conflict or mystery
- `{wish}` — The character's deep desire (or `{wish.bare}` for gerund)
- `{tone}` — The mood (or `{tone.noun}` / `{aTone}`)
- `{moral}` — The lesson (or `{moral.about}`)

**Setting vs. Event vs. Combined:** The app always generates both a setting (a place like "a castle") and an event (an occasion like "a wedding"). You choose what your template needs:
- `{setting}` — place only. Use when your prose needs a physical location ("in {setting}").
- `{event}` — event only. Use when the story is about an occasion ("during {event}").
- `{setting|event}` — randomly picks one at generation time. Use when either works. Most existing templates use this.
- You can also use both `{setting}` AND `{event}` in the same template to reference both.
- Forms work too: `{setting.bare|event.bare}`, `{Setting|Event}`, `{event.bare}`, etc.

**Pipe syntax (combined pools):** The `|` operator works with ANY placeholders, not just setting/event. Writing `{a|b}` randomly picks between the resolved values of `a` and `b` at generation time. For example, `{role|character1.bare}` would randomly pick between the narrative role and the first character's name. Use this whenever you want variety between two element types.

**Opening flavor:** There is no `{opening}` placeholder. Instead, bake the opening flavor directly into the template's prose. Each template should have its own distinctive way of beginning — a direct statement, an atmospheric setup, a question, a rule, a bit of dialogue, etc. This gives each template a unique voice rather than relying on a formulaic slot.

### Structural Rules

1. **Exactly ONE character gets the emotional form** (`{characterN.emotional}`). The other uses the plain form.
2. **Each template bakes in a story shape** (quest, rescue, discovery, etc.) as natural prose. The shape is part of the template's identity, not a random placeholder.
3. **Use `\n\n` for paragraph breaks** in the template string.
4. **A/An auto-correction is handled by the renderer** — write `a {placeholder}` naturally; the engine fixes it if the resolved value starts with a vowel.
5. **Templates should be two paragraphs** (the current standard), though other structures from dimensions.md are welcome if they serve the creative idea.

### Quality Guidelines

- The template should read naturally with ANY combination of random values plugged in. Test it mentally with very different characters (e.g., "a fox" vs. "a deep-sea diver"), settings ("a castle" vs. "a laundromat"), and hooks ("a broken promise" vs. "a door that won't stay closed").
- Avoid filler phrases. Every word should earn its place.
- The template is a PROMPT for storytelling, not a complete story. It should spark imagination and leave room for the parent to elaborate.
- Make it fun! These are bedtime stories. The template should feel like an invitation to play, not an assignment.

## Step 5: Try to Use All Generated Elements

The app generates values for all placeholders, and the template should try to weave in as many as possible naturally. It's okay if not every element fits perfectly into the narrative flow — **but any element you can't work into the main template text should appear at the end as a playful follow-up suggestion.**

Format leftover elements as encouraging "try adding" notes after the main template text. Vary the phrasing based on the element type:

- Leftover character: "Maybe {character2} shows up halfway through..."
- Leftover item: "What if {item} turns up at just the right moment?"
- Leftover setting detail: "Picture this happening in {setting} and see how the story changes."
- Leftover weather: "Now imagine it all happening {weather}..."
- Leftover hook: "And just when things settle down... {hook}."
- Leftover tone: "Tell it in a {tone} voice and see what happens."
- Leftover moral: "Somewhere in there, there's a lesson about {moral.about}."

**However** — the current template system requires ALL 9 placeholders to be used in the template string. So in practice, you MUST include all of them. The "leftover" notes are for if you find yourself struggling to integrate one naturally — that's a sign to rework the template so it fits, or to acknowledge the stretch gracefully in the prose.

## Step 6: Annotate with Dimension Tags

Add the standard dimension comment block above the template:

```js
// Template N — Short description
// Voice: X | Opening: X | Temporal: X | Dynamic: X | Agency: X
// Arc: X | Tension: X | Stakes: X | Connection: X | Hook-role: X
// Moral: X | Mystery: X | Spotlight: X
// Structure: X | Rhythm: X | Item-role: X | Scale: X | Genre-feel: X
// Shape: X
```

Choose tags honestly based on what you actually wrote, not what you intended. If the template drifted during writing, update the tags to match the result.

## Step 7: Add to Templates File

Add the new template to the `templates` array in `src/data/general/templates.js`. Place it at the end of the array.

If your template uses a placeholder form that doesn't exist yet (check `placeholders.md`), you'll also need to update the corresponding data file in `src/data/general/` to provide that form.

## Step 8: Update Coverage Gaps

Update the "Current Gaps" section in `template_engine/README.md` to reflect the new template's contributions. Move any newly covered tags from "Still zero coverage" to the "Tags now covered" list.

Also mark any used inspiration ideas in `template_engine/ideas/inspiration.md` with a strikethrough and note (following the existing pattern of marking used ideas).

## Reminders

- **Be different.** Read the existing 12 templates carefully. If your template sounds like any of them, start over with a different creative constraint.
- **Test mentally.** Imagine 3-4 very different random fills. Does the template still read well? Does it still sound fun?
- **Serve the parent.** The template is a springboard for a bedtime storytelling performance. It should inspire, not constrain.
- **Have fun with it.** The best templates have personality — a voice, a twist, a wink. Don't write something safe and generic.
