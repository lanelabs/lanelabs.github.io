# Role Data Guide

## What roles are

Roles are narrative functions an NPC plays in a story — not *what* they are, but *what they do for the plot*. A single NPC might be a Blacksmith (job) and an Elf (race) but serve as the party's **Mentor** (role). Roles shape how the storyteller uses the character.

## File format

Each JSON file is an object with two keys:
- `"description"` — a one-sentence summary of what the file contains
- `"roles"` — the array of entries, each `["Name", "Description"]`

## Description rules

- One to two sentences, roughly 15–30 words
- **Definitional voice** — each description should flow naturally after the name, as though completing "A Mentor is..." or "A Nemesis is...". Use participial and descriptive phrasing (e.g. "passing wisdom", "forcing the party to choose") rather than finite active verbs (e.g. "passes wisdom", "forces the party").
- Explain the narrative *function* — what this character does to the story, not who they are
- Focus on the *effect on the protagonists*: how does this role create drama, tension, aid, or mystery?
- Use framing that speaks to the storyteller
- **Vary sentence structure** — don't repeat one pattern across entries. Mix articles, adjectives, participial openers, and connecting words ("but", "yet", "while", dashes).

### Do / Don't

| Don't (finite verb / label restated) | Do (definitional, narrative function) |
|---|---|
| "Passes hard-won wisdom to the protagonists, often through cryptic lessons." | "A wellspring of hard-won wisdom, offering cryptic lessons the protagonists only understand too late." |
| "Opposes the protagonists at every turn, escalating the stakes." | "An ever-present opposition escalating the stakes until a final confrontation becomes inevitable." |
| "Appears trustworthy until a calculated betrayal shatters assumptions." | "A trusted face concealing a calculated betrayal that shatters the party's assumptions when it lands." |

Notice the shift: finite-verb descriptions narrate *what happens*; definitional descriptions define *what the role is* — a frame the storyteller slots a character into.

## Examples

- `"A trusted face concealing a calculated betrayal that shatters the party's assumptions when it lands."`
- `"A generous benefactor offering resources with no visible strings — raising the question of what they truly want."`
- `"A dark reflection of the protagonist, making opposite moral choices and forcing uncomfortable self-examination."`
- `"The bearer of an inciting event dragging the protagonists out of their comfort zone and into danger."`
- `"A gatekeeper holding vital information hostage, trading answers for favors pulling the party deeper into intrigue."`
