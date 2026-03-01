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
   `opening`, `storyShape`, `tone`, `moral`

2. Exactly ONE character gets the emotional form (`{characterN.emotional}`).
   The other uses the plain form.

3. Hook (conflict/mystery) and storyShape must NOT appear in the same
   sentence. They should be separated by at least one sentence, ideally
   by a paragraph break.

4. Use `\n\n` in the template string to create paragraph breaks.

5. Each template gets a dimension comment block listing its tags:
   ```js
   // Template N — Short description
   // Voice: X | Opening: X | Temporal: X | Dynamic: X | Agency: X
   // Arc: X | Tension: X | Stakes: X | Connection: X | Hook-role: X
   // Moral: X | Mystery: X | Spotlight: X
   // Structure: X | Rhythm: X | Item-role: X | Scale: X | Genre-feel: X
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

### Current Gaps (as of 12 templates)

Tags now covered (newly added in templates 8-12 marked with +):
- **Voice:** `classic`, +`legend`, +`direct-address`, +`campfire`
- **Opening:** `declarative`, +`everyone-knows`, +`rule-to-break`, +`sensory`, +`dialogue-cold`
- **Temporal:** `linear`, +`end-first`
- **Dynamic:** `strangers`, +`believer-skeptic`, +`reluctant-partners`, +`fragile-alliance`
- **Agency:** `passive`, +`reactive`, +`reluctant`, +`proactive`, +`compelled`
- **Tension:** `discovery`, +`forbidden`, +`mismatch`, +`secret`
- **Stakes:** `implied`, +`trust`, +`personal-loss`
- **Moral:** `label`, +`woven`
- **Structure:** `two-para`, +`wind-down`
- **Genre-feel:** `neutral`, +`campfire-legend`, +`lullaby`

Still zero coverage:
- **Voice:** `bedtime-whisper`, `in-medias-res`, `rhetorical`, `warning`, `instructional`, `confessional`, `laconic`
- **Opening:** `question-hook`, `impossible-image`, `interrupted-routine`, `catalog`, `false-start`, `scalar-shift`, `contrast`
- **Temporal:** `middle-first`, `flashback`, `countdown`, `parallel`, `circular`
- **Dynamic:** `seeker`, `reuniting`, `mentor-student`, `rivals`, `helper`, `former-enemies`, `protector-ward`, `secret-between`
- **Tension:** `ticking-clock`, `impossible-choice`, `pursuit`, `scarcity`, `question`, `promise`, `rivalry`
- **Stakes:** `identity`, `promise`, `scarcity`, `belonging`, `missed-moment`
- **Moral:** `frame`, `question`, `implied`, `tested`
- **Structure:** `three-beat`, `single-turn`, `hook-plus-para`, `bookend`, `list-like`, `dialogue`
- **Genre-feel:** `fairy-tale`, `fable`, `tall-tale`, `ghost-story`, `adventure-serial`, `myth`, `anti-fairy-tale`
