# Template Engine

A reference system for designing diverse narrative templates for the
bedtime story app. Used to guide AI-assisted template generation and
ensure new templates are distinct from existing ones.

## Directory Structure

```
template_engine/
  README.md              — You are here
  dimensions.md          — All 18 dimensions with their option tags
  placeholders.md        — Available {placeholder} syntax and forms
  ideas/
    inspiration.md       — One-line rough template ideas from research
    batch-NN.md          — Generated idea batches (dimension combos)
```

## Workflow

### Step 1: Generate Ideas

Ask AI to read `dimensions.md`, `ideas/inspiration.md`, and scan the
dimension tags on existing templates in `src/data/general/templates.js`.
Then have it propose new dimension combinations that fill gaps in coverage.

Use `ideas/inspiration.md` as a starting point — it contains dozens of
rough one-line ideas organized by source (blurb patterns, story structures,
opening techniques, tension mechanics, and combination ideas).

Output goes into `ideas/` as numbered markdown files (e.g. `batch-01.md`).
Each idea is a dimension combo + a "feel" description — no actual template
text yet.

### Step 2: Review Ideas

Go through the ideas files. Mark the ones you like, cut the ones you don't,
adjust dimension picks. This is the cheap editing step — no template text
to rewrite.

### Step 3: Generate Templates

For approved ideas, ask AI to write actual template strings using the
placeholders defined in `placeholders.md`. The template must use every
required placeholder and follow the structural rules.

### Step 4: Annotate and Add

Add the finished template to `src/data/general/templates.js` with a
dimension comment block at the top (see existing templates for format).

---

## Rules for Templates

1. Every template MUST use all of these placeholders at least once:
   `character1`, `character2`, `setting`, `weather`, `item`, `hook`,
   `wish`, `tone`, `moral`

2. Exactly ONE character gets the emotional form (`{characterN.emotional}`).
   The other uses the plain form.

3. Each template has a baked-in story shape (quest, rescue, discovery,
   etc.) written directly into its prose. Shapes are NOT a random
   placeholder — they're part of the template's identity.

4. Use `\n\n` in the template string to create paragraph breaks.

5. Each template gets a dimension comment block listing its tags:
   ```js
   // Template N — Short description
   // Voice: X | Opening: X | Temporal: X | Dynamic: X | Agency: X
   // Arc: X | Tension: X | Stakes: X | Connection: X | Hook-role: X
   // Moral: X | Mystery: X | Spotlight: X
   // Structure: X | Rhythm: X | Item-role: X | Scale: X | Genre-feel: X
   // Shape: X
   ```

6. If a template needs a placeholder form that doesn't exist yet
   (e.g. `{moral.gerund}`), the corresponding data file must be updated
   to provide that form. See `placeholders.md` for what's available.

---

## Coverage Goals

When the full set of templates is reviewed, aim for:
- Every Voice tag used at least once
- Every Opening Technique tag used at least once
- Every Structure tag used at least once
- Every Tension Mechanism tag used at least once
- Good spread across other dimensions (no single tag dominating)
- No two templates sharing the same combination across Voice +
  Opening Technique + Structure (these three define the most visible "feel")

### Coverage Status (48 templates)

All Voice, Opening, and Structure tags are now covered. The three dimensions that
define the most visible "feel" (Voice + Opening + Structure) have full coverage,
and no two templates share the same V+O+S triple (except T1-7,9 which are all
classic + declarative + two-para by design).

**Voice (11/11):** `classic` (T1-7,9,10,14,18,20), `legend` (T8,24,31,33,37,43), `direct-address` (T11,22,25,46), `campfire` (T12,23,27,38,41), `warning` (T13,29,48), `rhetorical` (T15,34,42), `instructional` (T16,39,44), `laconic` (T17,28,40), `confessional` (T19,32,36), `bedtime-whisper` (T21,30,45), `in-medias-res` (T26,35,47)

**Opening (12/12):** `declarative` (T1-7,9,14,22,33,39,41,43), `everyone-knows` (T8,27), `rule-to-break` (T10,37,48), `sensory` (T11,20,21,31,38,44), `dialogue-cold` (T12,40), `contrast` (T13,18,23,25,34,36,45,47), `question-hook` (T15,19,42), `catalog` (T16,46), `impossible-image` (T17,29), `interrupted-routine` (T26,28), `scalar-shift` (T24,30,35), `false-start` (T32)

**Structure (8/8):** `two-para` (T1-10,12,13,15,18-21,23,26,28,34,35,37,39-41,43-46), `wind-down` (T11,22,31), `hook-plus-para` (T14,24,47), `list-like` (T16), `single-turn` (T17,29,48), `bookend` (T25,30,33), `dialogue` (T27,42), `three-beat` (T32,36,38)

**Shape (47 tags, all unique except unexpected-adventure):** `discovery` (T1), `unexpected-adventure` (T2,T38), `hidden-truth` (T3), `quest` (T4), `puzzle` (T5), `transformation` (T6), `rescue` (T7), `curse-to-break` (T8), `fear-to-overcome` (T9), `dare-to-accept` (T10), `precious-to-protect` (T11), `trust-to-earn` (T12), `test-of-courage` (T13), `fresh-start` (T14), `gift-to-give` (T15), `rise-from-nothing` (T16), `unlikely-friendship` (T17), `mistaken-identity` (T18), `secret-to-keep` (T19), `race-against-time` (T20), `stranger-in-need` (T21), `lesson-to-learn` (T22), `journey-home` (T23), `overcoming-threat` (T24), `search-for-lost` (T25), `daring-escape` (T26), `stand-against-bully` (T27), `competition` (T28), `wild-thing-to-tame` (T29), `build-together` (T30), `reunion` (T31), `mistake-to-fix` (T32), `message-to-deliver` (T33), `promise-to-keep` (T34), `big-event` (T35), `high-stakes-bet` (T36), `trade` (T37), `passing-the-torch` (T39), `changing-sides` (T40), `crossed-paths` (T41), `old-wounds` (T42), `underdog-triumph` (T43), `nature-takes-its-course` (T44), `moment-frozen` (T45), `map-to-follow` (T46), `borrowed-time` (T47), `night-watch` (T48)

All dimension tags now have coverage:
- **Temporal (7/7):** `linear`, `end-first`, `circular`, `middle-first`, `flashback`, `countdown`, `parallel` (T41)
- **Dynamic (12/12):** `strangers`, `believer-skeptic`, `reluctant-partners`, `fragile-alliance`, `helper`, `protector-ward`, `secret-between`, `seeker`, `mentor-student` (T39), `rivals` (T40), `reuniting` (T41), `former-enemies` (T42)
- **Tension (11/11):** `discovery`, `forbidden`, `mismatch`, `secret`, `promise`, `question`, `scarcity`, `ticking-clock`, `impossible-choice`, `pursuit`, `rivalry` (T40)
- **Stakes (8/8):** `implied`, `trust`, `personal-loss`, `identity`, `belonging`, `promise`, `missed-moment`, `scarcity` — all covered
- **Moral (6/6):** `label`, `woven`, `tested`, `frame` (T39), `question` (T42), `implied` (T44)
- **Genre-feel (10/10):** `neutral`, `campfire-legend`, `lullaby`, `anti-fairy-tale`, `tall-tale`, `ghost-story`, `adventure-serial`, `myth`, `fable`, `fairy-tale` (T43)
