// Mythology templates (119–128) — trickster tales, origin myths, divine bargains.
//
// See template_engine/placeholders.md for full placeholder reference.
// See template_engine/dimensions.md for dimension tag definitions.

export const templates = [
  // Template 119 — The Trickster's Bet
  // Voice: campfire | Opening: dialogue-cold | Temporal: linear | Dynamic: rivals | Agency: proactive
  // Arc: surprise-pivot | Tension: rivalry | Stakes: identity | Connection: causal | Hook-role: central
  // Moral: tested | Mystery: laid-out | Spotlight: character-both
  // Structure: dialogue | Rhythm: short-punchy | Item-role: key | Scale: local | Genre-feel: tall-tale
  // Shape: high-stakes-bet
  '"I\'ll bet you {item}," said {character1.emotional}, grinning the way only a trickster grins. {Character2} — the {role} who should have known better — said yes. In {setting|event}, {weather}, that was the first mistake.\n\nThe bet was about {hook}. The trick was that the bet was never really about {hook} at all. Tricksters don\'t play to win — they play to teach. A {tone} tale about {wish.bare} and {moral.about}, dealt from the bottom of the deck.',

  // Template 120 — Why the Sky Is That Way
  // Voice: legend | Opening: declarative | Temporal: flashback | Dynamic: strangers | Agency: passive
  // Arc: calm | Tension: discovery | Stakes: belonging | Connection: inheritance | Hook-role: background
  // Moral: woven | Mystery: laid-out | Spotlight: setting
  // Structure: bookend | Rhythm: rhythmic | Item-role: symbol | Scale: epic | Genre-feel: myth
  // Shape: nature-takes-its-course
  'A long time ago — before {setting|event} had a name, before {weather.noun} knew where to go — the world was unfinished. That\'s where {character1.emotional} and {character2} come in. They were the first {role} and the first stranger, and neither one knew the rules because the rules hadn\'t been written yet.\n\n{Hook} was just the world figuring itself out. {Item} was how it remembered what it decided. All they wanted was {wish}. A {tone} tale about {moral.about}.\n\nAnd that, so the story goes, is why things are the way they are.',

  // Template 121 — The Deal with Death
  // Voice: legend | Opening: contrast | Temporal: linear | Dynamic: seeker | Agency: compelled
  // Arc: peak-resolve | Tension: impossible-choice | Stakes: personal-loss | Connection: causal | Hook-role: central
  // Moral: question | Mystery: teaser | Spotlight: hook
  // Structure: two-para | Rhythm: flowing | Item-role: burden | Scale: epic | Genre-feel: myth
  // Shape: trade
  '{Character1.emotional} stood at the edge of {setting|event}, {weather}, and asked for more time. The answer came — not unkindly — from {character2}, the {role} who keeps the balance: "Time costs. What will you trade?" {Item} was all they had.\n\n{Hook} was the price — not cruel, just honest. Some bargains can\'t be undone. The deal was {tone} and ancient and exactly as fair as it needed to be. All they wanted was {wish}. A legend about {moral.about} — and whether some things are meant to be let go.',

  // Template 122 — The Stolen Fire
  // Voice: warning | Opening: rule-to-break | Temporal: linear | Dynamic: protector-ward | Agency: proactive
  // Arc: steady-build | Tension: forbidden | Stakes: promise | Connection: causal | Hook-role: catalyst
  // Moral: tested | Mystery: teaser | Spotlight: item
  // Structure: two-para | Rhythm: mixed | Item-role: catalyst | Scale: epic | Genre-feel: myth
  // Shape: dare-to-accept
  '{Item} belonged to the sky. Everyone in {setting|event} knew that. {Weather}, the rule was simple: what burns above stays above. {Character1.emotional} disagreed. The {role} who guarded it disagreed louder.\n\nBut {character2} was cold, and the dark was deep, and {hook} made the rule feel less like wisdom and more like cruelty. The theft was {tone}. The punishment was swift. And the gift — the stubborn, brilliant gift — changed everything. All they wanted was {wish}. A tale about {moral.about}.',

  // Template 123 — The Animal Who Spoke
  // Voice: instructional | Opening: everyone-knows | Temporal: linear | Dynamic: believer-skeptic | Agency: reactive
  // Arc: surprise-pivot | Tension: mismatch | Stakes: trust | Connection: contradictory | Hook-role: reframed
  // Moral: woven | Mystery: teaser | Spotlight: character-emotional
  // Structure: two-para | Rhythm: mixed | Item-role: gift | Scale: local | Genre-feel: fable
  // Shape: unlikely-friendship
  'Everyone in {setting|event} knew that {character2} couldn\'t talk. Animals don\'t. That\'s a fact. {Character1.emotional}, the {role} who spent the most time listening, knew differently — but nobody believed them.\n\n{Weather}, {hook} changed the conversation. {Item} fell from somewhere impossible, and the animal spoke — not in words, exactly, but in something truer. The friendship that followed was {tone} and stubborn. All they wanted was {wish}. A story about {moral.about} — and how some voices only speak to those who bother to listen.',

  // Template 124 — The Weaver of Fates
  // Voice: bedtime-whisper | Opening: sensory | Temporal: linear | Dynamic: helper | Agency: passive
  // Arc: wind-down | Tension: discovery | Stakes: implied | Connection: symbolic | Hook-role: background
  // Moral: woven | Mystery: laid-out | Spotlight: character-both
  // Structure: two-para | Rhythm: flowing | Item-role: symbol | Scale: intimate | Genre-feel: lullaby
  // Shape: lasting-gift
  '{Weather}, somewhere beyond {setting|event}, the oldest {role} in the world sat weaving. Each thread was a life. Each knot was a turning point. {Character2} had been watching for a long time, but tonight was different — tonight, {character1.emotional}\'s thread had reached {hook}.\n\nThe weaver didn\'t cut it. Instead, they wove {item} into the pattern — {tone} and deliberate and exactly where it needed to be. All they wanted was {wish}. A story about {moral.about}, threaded through every life that ever mattered.',

  // Template 125 — The Labyrinth Below
  // Voice: in-medias-res | Opening: sensory | Temporal: middle-first | Dynamic: reluctant-partners | Agency: reactive
  // Arc: man-in-hole | Tension: pursuit | Stakes: personal-loss | Connection: causal | Hook-role: looming-threat
  // Moral: label | Mystery: teaser | Spotlight: setting
  // Structure: two-para | Rhythm: short-punchy | Item-role: key | Scale: local | Genre-feel: adventure-serial
  // Shape: daring-escape
  'The walls shifted again. {Weather}, deep beneath {setting|event}, every turn looked the same and every choice felt wrong. {Character1.emotional} held {item} tight — the one thing the labyrinth couldn\'t change. Behind them, {hook} echoed closer.\n\n{Character2}, the {role} who\'d been down here before, said there was only one rule: don\'t look back. The escape was {tone} and winding and never in a straight line. All they wanted was {wish}. A tale about {moral.about}, found at the center of the maze.',

  // Template 126 — The Test of Three
  // Voice: legend | Opening: declarative | Temporal: linear | Dynamic: mentor-student | Agency: compelled
  // Arc: steady-build | Tension: impossible-choice | Stakes: identity | Connection: prophecy | Hook-role: central
  // Moral: frame | Mystery: laid-out | Spotlight: moral
  // Structure: three-beat | Rhythm: rhythmic | Item-role: gift | Scale: local | Genre-feel: fairy-tale
  // Shape: test-of-courage
  'This is a story about {moral.about} — and the three trials that proved it. In {setting|event}, {weather}, {character1.emotional} was given a choice, then another, then one more.\n\nThe first trial was {hook}. The second was losing {item}. The third — the hardest — was trusting {character2}, the {role} who\'d failed the same test once before.\n\nThree chances. Three answers. The courage it took was {tone} and quiet and nothing like what the legends promised. All they wanted was {wish}.',

  // Template 127 — The River Between Worlds
  // Voice: direct-address | Opening: scalar-shift | Temporal: linear | Dynamic: seeker | Agency: reluctant
  // Arc: dark-to-light | Tension: forbidden | Stakes: belonging | Connection: symbolic | Hook-role: central
  // Moral: label | Mystery: teaser | Spotlight: setting
  // Structure: two-para | Rhythm: flowing | Item-role: burden | Scale: expanding | Genre-feel: myth
  // Shape: journey-home
  'Imagine a river — wider than {setting|event}, deeper than memory, cold as {weather.noun}. On one side, everything you know. On the other, everything you lost. {Character1.emotional} stood at the bank with {item}, too heavy to carry and too precious to leave behind.\n\n{Character2}, the {role} who ferries between worlds, said the crossing costs something different for everyone. {Hook} was {character1.emotional.bare}\'s price. The journey home was {tone} — not because it was far, but because home isn\'t always the side you started on. A tale about {wish.bare} and {moral.about}.',

  // Template 128 — The Name You Must Not Say
  // Voice: warning | Opening: rule-to-break | Temporal: linear | Dynamic: strangers | Agency: reactive
  // Arc: steady-build | Tension: forbidden | Stakes: scarcity | Connection: causal | Hook-role: catalyst
  // Moral: label | Mystery: withhold-hook | Spotlight: hook
  // Structure: two-para | Rhythm: mixed | Item-role: catalyst | Scale: local | Genre-feel: campfire-legend
  // Shape: curse-to-break
  'In {setting|event}, {weather}, there was a name nobody spoke. Not because they\'d forgotten — because speaking it invited {hook}. {Character1.emotional} didn\'t know that. The {role} who should have warned them was already gone.\n\n{Character2} heard it first — the echo, then the stirring, then {item} cracking down the middle. The curse was old and {tone} and hungry. Breaking it meant saying the name again, louder, on purpose. All they wanted was {wish}. A tale about {moral.about}.',
];
