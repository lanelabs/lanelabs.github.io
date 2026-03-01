// Story templates — each is a plain string with {placeholder} slots.
//
// ── Placeholder syntax ──────────────────────────────────────────────
//
//   {name}       — default form (includes article): "a quest"
//   {name.bare}  — article-stripped form:            "quest"
//   {name.xyz}   — any custom form defined in the data file
//   {Name}       — auto-capitalise the first letter: "A quest"
//   {Name.bare}  — capitalise + custom form:         "Quest"
//
// The ".bare" form is auto-computed for every value by stripping the
// leading article. Custom forms beyond "bare" must be defined as object
// properties in the data file (see storyShapes.js for an example).
//
// ── Available placeholders ──────────────────────────────────────────
//
//   {setting}              — location, e.g. "a castle"
//   {weather}              — atmosphere, e.g. "during a thunderstorm"
//   {character1}           — first character (plain), e.g. "a farmer"
//   {character1.emotional} — first character with emotion, e.g. "a scared farmer"
//   {character2}           — second character (plain), e.g. "a fox"
//   {character2.emotional} — second character with emotion, e.g. "a scared fox"
//   {item}                 — article + descriptor + item, e.g. "a golden map"
//   {hook}                 — conflict or mystery, e.g. "a broken promise"
//   {opening}              — how the story starts, e.g. "a quiet moment alone"
//   {storyShape}           — plot archetype with article, e.g. "a quest"
//   {tone}                 — mood adjective, e.g. "cozy"
//   {tone.noun}            — noun form, e.g. "warmth" (for "a story of {tone.noun}")
//   {aTone}                — with a/an article, e.g. "a cozy" or "an adventurous"
//   {moral}                — lesson (word or phrase), e.g. "courage" or "don't give up"
//   {moral.about}          — works after "about", e.g. "courage" or "never giving up"
//   {weather.adj}          — single adjective, e.g. "stormy" or "moonlit"
//   {aWeatherAdj}          — with a/an article, e.g. "a stormy" or "an overcast"
//
// Each template controls which character gets the emotion by choosing
// {character1.emotional} or {character2.emotional}. The other character
// uses the plain {character1} or {character2}. Templates also choose
// whether {weather} colors the setting or the hook.
//
// ── Adding a new template ───────────────────────────────────────────
//
// 1. Append a new string to this array.
// 2. Use {name} for the default form or {name.bare} for article-stripped.
// 3. Pick ONE character to be emotional ({characterN.emotional}), use
//    plain {characterN} for the other.
// 4. Place {weather} near {setting} OR near {hook} for variety.
// 5. If you need a form that doesn't exist yet (e.g. {moral.gerund}),
//    go to the data file (e.g. morals.js), convert the items that are
//    still plain strings into objects, and add the new form key:
//      BEFORE:  'Courage'
//      AFTER:   { full: 'Courage', gerund: 'having courage' }
//    Items that are already objects just get the new key added.

export const templates = [
  // Template 1 — Setting opens, weather with setting, character1 emotional
  'In {setting}, {weather}, {character1.emotional} and {character2} discover {item}. What begins as {opening} becomes {storyShape} centered around {hook}. The tone is {tone}. The lesson: {Moral}.',

  // Template 2 — Character opens, weather with setting, character1 emotional
  '{Character1.emotional} meets {character2} in {setting} {weather}. Together, they uncover {item} connected to {hook}. Their {storyShape.bare} begins with {opening}. It\'s {aTone} tale about {moral.about}.',

  // Template 3 — Atmosphere opens, weather with setting, character1 emotional
  '{Weather}, {setting} holds a secret: {hook}. {Character1.emotional} and {character2} are drawn together by {item}. From {opening}, their {storyShape.bare} unfolds. {Moral} — that\'s the heart of this {tone} story.',

  // Template 4 — Hook-first, weather with setting, character2 emotional
  '{Hook} — that\'s what brings {character1} and {character2.emotional} together in {setting} {weather}. With {item} and {storyShape} ahead, it all begins with {opening}. A story of {tone.noun} and {moral.about}.',

  // Template 5 — Weather-adjective setting, character2 emotional
  '{AWeatherAdj} {setting.bare} is where {character1} meets {character2.emotional}. {Hook} leads to {storyShape}, and {item} holds the key. Starting from {opening}, this {tone} tale reminds us: {Moral}.',

  // Template 6 — Weather colors the hook, character1 emotional
  'In {setting}, {character1.emotional} and {character2} stumble into {hook} {weather}. Armed with {item}, their {storyShape.bare} begins with {opening}. It\'s {aTone} tale about {moral.about}.',

  // Template 7 — Weather intensifies the hook, character2 emotional
  '{Character1} and {character2.emotional} meet in {setting}. When faced with {hook} {weather}, {item} becomes their only hope. What starts as {opening} turns into {storyShape}. A {tone} story about {moral.about}.',
];
