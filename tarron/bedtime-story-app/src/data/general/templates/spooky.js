// Spooky templates (129–138) — ghosts, haunted places, friendly monsters.
// Kid-appropriate — creepy atmosphere, not genuine horror.
//
// See template_engine/placeholders.md for full placeholder reference.
// See template_engine/dimensions.md for dimension tag definitions.

export const templates = [
  // Template 129 — The Ghost Who Needed Help
  // Voice: bedtime-whisper | Opening: contrast | Temporal: linear | Dynamic: helper | Agency: passive
  // Arc: dark-to-light | Tension: secret | Stakes: belonging | Connection: discovery | Hook-role: background
  // Moral: woven | Mystery: withhold-hook | Spotlight: character-emotional
  // Structure: two-para | Rhythm: flowing | Item-role: symbol | Scale: intimate | Genre-feel: ghost-story
  // Shape: stranger-in-need
  'Nobody was supposed to be {setting.placed|event.placed}. Not {weather}, not at this hour. But {character1.emotional} heard something — not scary, exactly. Sad. The kind of sound that makes you stop walking and start listening. {Item} flickered in the dark.\n\n{Character2} had been there a long time — longer than anyone alive. The {role} wasn\'t haunting the place. They were stuck. {Hook} was what kept them. The help they needed was {tone} and simple and the kind of thing only a living person could give. All they wanted was {wish}. A story about {moral.about}.',

  // Template 130 — The House That Breathed
  // Voice: warning | Opening: sensory | Temporal: linear | Dynamic: reluctant-partners | Agency: reactive
  // Arc: steady-build | Tension: pursuit | Stakes: personal-loss | Connection: causal | Hook-role: central
  // Moral: label | Mystery: teaser | Spotlight: setting
  // Structure: two-para | Rhythm: short-punchy | Item-role: key | Scale: local | Genre-feel: ghost-story
  // Shape: daring-escape
  'The walls inhaled. {Weather}, {setting|event} groaned like something alive and unhappy about visitors. {Character1.emotional} shouldn\'t have opened the door. {Character2}, the {role}, definitely shouldn\'t have followed.\n\n{Item} was the only light. {Hook} was the only sound. And the house — patient, hungry, {tone} — was rearranging itself around them. The exit kept moving. All they wanted was {wish}. A tale about {moral.about}, told between the walls.',

  // Template 131 — The Friendly Monster
  // Voice: confessional | Opening: contrast | Temporal: linear | Dynamic: believer-skeptic | Agency: proactive
  // Arc: surprise-pivot | Tension: mismatch | Stakes: identity | Connection: contradictory | Hook-role: reframed
  // Moral: woven | Mystery: teaser | Spotlight: character-both
  // Structure: two-para | Rhythm: mixed | Item-role: gift | Scale: local | Genre-feel: anti-fairy-tale
  // Shape: fear-turned-friendship
  'I\'m going to tell you something, and you have to promise not to panic: the thing under {setting.bare|event.bare} was real. {Weather}, {character1.emotional} found it — enormous, lumpy, and holding {item} like it was the most precious thing in the world. {Character2}, the {role}, screamed.\n\nBut here\'s the thing about monsters: some of them are just lonely. {Hook} was the reason it was hiding. The friendship that followed was {tone} and unlikely and better than either of them expected. All they wanted was {wish}. A story about {moral.about}.',

  // Template 132 — The Midnight Parade
  // Voice: legend | Opening: everyone-knows | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: calm | Tension: forbidden | Stakes: missed-moment | Connection: symbolic | Hook-role: background
  // Moral: woven | Mystery: laid-out | Spotlight: weather
  // Structure: two-para | Rhythm: rhythmic | Item-role: symbol | Scale: local | Genre-feel: ghost-story
  // Shape: big-event
  'They say that once a year, {weather}, something strange happens {setting.placed|event.placed}. The lights go out. The shadows line up. And if you\'re very quiet, you can hear {hook} — not as a threat, but as a procession. The midnight parade. {Character1.emotional} had heard the stories. {Character2}, the {role}, had marched in one.\n\n{Item} was the invitation — left at the foot of the bed, glowing faintly. Joining the parade wasn\'t dangerous. Missing it was the real loss. A {tone} tale about {wish.bare} and {moral.about}, told between midnight and dawn.',

  // Template 133 — The Thing in the Attic
  // Voice: direct-address | Opening: question-hook | Temporal: linear | Dynamic: protector-ward | Agency: reluctant
  // Arc: dark-to-light | Tension: question | Stakes: trust | Connection: causal | Hook-role: central
  // Moral: label | Mystery: question-based | Spotlight: hook
  // Structure: two-para | Rhythm: mixed | Item-role: clue | Scale: intimate | Genre-feel: ghost-story
  // Shape: fear-to-overcome
  'Have you ever heard a sound you couldn\'t explain? {Weather}, {setting.placed|event.placed}, {character1.emotional} heard it every night — a soft thump, then silence, then {hook}. The {role} downstairs said to ignore it. {Character2} said to investigate.\n\n{Item} was the first thing they found at the top of the stairs. The second thing — well, it wasn\'t what anyone expected. The fear was {tone}. The answer was smaller. All they wanted was {wish}. A tale about {moral.about} — and how the scariest things are usually the least understood.',

  // Template 134 — The Shadow That Followed
  // Voice: campfire | Opening: sensory | Temporal: linear | Dynamic: strangers | Agency: reactive
  // Arc: steady-build | Tension: pursuit | Stakes: identity | Connection: causal | Hook-role: looming-threat
  // Moral: label | Mystery: teaser | Spotlight: character-emotional
  // Structure: two-para | Rhythm: mixed | Item-role: key | Scale: local | Genre-feel: ghost-story
  // Shape: hidden-truth
  'It started {setting.placed|event.placed}. {Weather}, {character1.emotional} noticed it — a second shadow, longer than theirs, moving half a step behind. It didn\'t do anything threatening. It just... followed. {Character2}, the {role}, saw it too.\n\n{Item} cast the same double shadow. {Hook} was the reason — older than either of them guessed, and stranger than either one feared. The truth behind the shadow was {tone} and not at all what the stories promised. All they wanted was {wish}. A tale about {moral.about}.',

  // Template 135 — The Graveyard Sleepover
  // Voice: laconic | Opening: declarative | Temporal: linear | Dynamic: fragile-alliance | Agency: proactive
  // Arc: surprise-pivot | Tension: mismatch | Stakes: trust | Connection: coincidence | Hook-role: catalyst
  // Moral: label | Mystery: laid-out | Spotlight: character-both
  // Structure: two-para | Rhythm: short-punchy | Item-role: comfort | Scale: local | Genre-feel: tall-tale
  // Shape: unlikely-friendship
  'Spending the night {setting.placed|event.placed} was {character1.emotional}\'s idea. Terrible ideas usually are. {Character2}, the {role}, came along because someone had to keep watch. {Weather}, the plan was simple: stay until sunrise, prove {hook} wasn\'t real, go home.\n\nThe plan lasted about an hour. Then {item} moved. Then something laughed — not mean, just amused. The night that followed was {tone} and weird and nothing like either of them expected. All they wanted was {wish}. A tale about {moral.about}.',

  // Template 136 — The Cursed Reflection
  // Voice: confessional | Opening: impossible-image | Temporal: linear | Dynamic: secret-between | Agency: reluctant
  // Arc: dark-to-light | Tension: secret | Stakes: identity | Connection: causal | Hook-role: central
  // Moral: woven | Mystery: withhold-hook | Spotlight: item
  // Structure: three-beat | Rhythm: mixed | Item-role: burden | Scale: internal | Genre-feel: fairy-tale
  // Shape: curse-to-break
  'The reflection didn\'t match. {Weather}, {character1.emotional} looked into {item} and saw someone else looking back — same face, different eyes, a smile that wasn\'t theirs. {Setting.placed|event.placed}, nobody else noticed.\n\n{Character2}, the {role}, noticed. But they didn\'t say anything — not yet. {Hook} was the kind of secret that grows heavier the longer you carry it.\n\nThe curse broke the way all curses do: not with a spell, but with the {tone} decision to stop pretending. All they wanted was {wish}. A story about {moral.about}.',

  // Template 137 — The Fog That Remembers
  // Voice: legend | Opening: sensory | Temporal: circular | Dynamic: strangers | Agency: passive
  // Arc: wind-down | Tension: discovery | Stakes: belonging | Connection: inheritance | Hook-role: past-event
  // Moral: woven | Mystery: laid-out | Spotlight: weather
  // Structure: bookend | Rhythm: flowing | Item-role: symbol | Scale: local | Genre-feel: ghost-story
  // Shape: reunion
  '{Weather}, the fog {setting.placed|event.placed} was thicker than usual — thick enough to remember. And it did. Shapes moved inside it: old stories, old faces, old versions of {hook} playing out like whispers. {Character1.emotional} walked into it without meaning to.\n\n{Character2}, the {role}, was already there — waiting the way fog waits, patient and shapeless and full of everything that came before. {Item} glowed between them like a heartbeat. The reunion was {tone} and inevitable.\n\nThe fog thinned. The memories stayed. A story about {wish.bare} and {moral.about}.',

  // Template 138 — The Dare After Dark
  // Voice: campfire | Opening: dialogue-cold | Temporal: linear | Dynamic: rivals | Agency: proactive
  // Arc: man-in-hole | Tension: forbidden | Stakes: trust | Connection: causal | Hook-role: central
  // Moral: label | Mystery: teaser | Spotlight: character-both
  // Structure: two-para | Rhythm: short-punchy | Item-role: key | Scale: local | Genre-feel: campfire-legend
  // Shape: dare-to-accept
  '"I dare you." That\'s how it started. {Character1.emotional} and {character2}, face to face {setting.placed|event.placed}, {weather}. The {role} who\'d dared them stood back with a grin. The dare: touch {item}. After dark. Alone.\n\n{Hook} was supposed to be the scary part. It wasn\'t. The scary part was finding out the dare was real — and that the only way out was through. Together, which neither one planned. A {tone} tale about {wish.bare} and {moral.about}.',
];
