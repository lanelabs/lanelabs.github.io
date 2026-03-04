// Mystery and detective templates (109–118) — whodunit, heist, noir, clues.
//
// See template_engine/placeholders.md for full placeholder reference.
// See template_engine/dimensions.md for dimension tag definitions.

export const templates = [
  // Template 109 — The Locked Room
  // Voice: campfire | Opening: sensory | Temporal: middle-first | Dynamic: fragile-alliance | Agency: reactive
  // Arc: steady-build | Tension: question | Stakes: trust | Connection: causal | Hook-role: central
  // Moral: label | Mystery: withhold-hook | Spotlight: setting
  // Structure: two-para | Rhythm: mixed | Item-role: clue | Scale: local | Genre-feel: neutral
  // Shape: puzzle
  'The door was locked from the inside. {Weather}, {setting|event} should have been empty — but {item} was missing, and {character1.emotional} was the only one with a key. That\'s what the {role} said, anyway. {Character2} wasn\'t so sure.\n\nEvery clue pointed in two directions at once. {Hook} was the piece that didn\'t fit — the one detail that made the whole thing either obvious or impossible. All they wanted was {wish}. A {tone} tale about {moral.about}, solved one locked door at a time.',

  // Template 110 — The Heist
  // Voice: laconic | Opening: declarative | Temporal: linear | Dynamic: fragile-alliance | Agency: proactive
  // Arc: surprise-pivot | Tension: ticking-clock | Stakes: trust | Connection: causal | Hook-role: central
  // Moral: tested | Mystery: teaser | Spotlight: character-both
  // Structure: two-para | Rhythm: short-punchy | Item-role: key | Scale: local | Genre-feel: adventure-serial
  // Shape: noble-thief
  'The plan had three steps. Get into {setting|event}. Get {item}. Get out before {hook} caught up with them. Simple. {Character1.emotional} had done the math. {Character2}, the {role}, had done the worrying.\n\n{Weather}, step one went fine. Step two went sideways. Step three — well, that\'s where the story gets {tone}. Trust is a strange currency when you\'re both holding stolen goods. All they wanted was {wish}. A tale about {moral.about}.',

  // Template 111 — The Wrong Suspect
  // Voice: confessional | Opening: false-start | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: surprise-pivot | Tension: secret | Stakes: identity | Connection: contradictory | Hook-role: reframed
  // Moral: label | Mystery: teaser | Spotlight: character-emotional
  // Structure: three-beat | Rhythm: mixed | Item-role: clue | Scale: local | Genre-feel: neutral
  // Shape: mistaken-identity
  'Everyone thought it was {character1.emotional}. The evidence was right there — {item}, found exactly where it shouldn\'t have been, in {setting|event}, {weather}. The {role} in charge said it was open and shut.\n\nBut {character2} looked closer. {Hook} didn\'t match. The timeline was wrong. The motive was missing.\n\nThe real answer was {tone} and quieter than anyone expected. All they wanted was {wish}. A story about {moral.about} — and the cost of assuming you already know.',

  // Template 112 — The Alibi
  // Voice: rhetorical | Opening: question-hook | Temporal: flashback | Dynamic: secret-between | Agency: reluctant
  // Arc: dark-to-light | Tension: secret | Stakes: trust | Connection: causal | Hook-role: past-event
  // Moral: question | Mystery: withhold-hook | Spotlight: hook
  // Structure: two-para | Rhythm: flowing | Item-role: symbol | Scale: local | Genre-feel: neutral
  // Shape: trust-to-earn
  'Where was {character1.emotional} when {hook.verb}? That\'s the question nobody in {setting|event} can answer — including {character1.emotional.bare}. {Weather}, the silence has its own weight. {Item} is the only thing that might prove anything.\n\n{Character2}, the {role} who wants to believe them, has to decide: trust what they feel, or trust what they see. The alibi has a hole in it. The friendship does too. A {tone} story about {wish.bare} — and whether {moral.about} survives the truth.',

  // Template 113 — The Clue Nobody Noticed
  // Voice: direct-address | Opening: contrast | Temporal: linear | Dynamic: mentor-student | Agency: proactive
  // Arc: steady-build | Tension: discovery | Stakes: implied | Connection: discovery | Hook-role: catalyst
  // Moral: label | Mystery: laid-out | Spotlight: item
  // Structure: two-para | Rhythm: mixed | Item-role: clue | Scale: local | Genre-feel: neutral
  // Shape: discovery
  'It was there the whole time. Right there, in {setting|event}, {weather}, where anyone could see it — {item}, ordinary as dust. {Character1.emotional} walked past it twice. {Character2}, the {role}, walked past it three times.\n\nBut here\'s the thing about clues: they don\'t announce themselves. {Hook} only made sense after someone finally looked down. The discovery was {tone} — the kind that changes everything you thought you understood. All they wanted was {wish}. A tale about {moral.about}.',

  // Template 114 — The Double Cross
  // Voice: warning | Opening: dialogue-cold | Temporal: linear | Dynamic: former-enemies | Agency: compelled
  // Arc: light-to-dark | Tension: rivalry | Stakes: personal-loss | Connection: causal | Hook-role: catalyst
  // Moral: tested | Mystery: teaser | Spotlight: character-both
  // Structure: two-para | Rhythm: short-punchy | Item-role: burden | Scale: local | Genre-feel: adventure-serial
  // Shape: changing-sides
  '"We had a deal." "We did." {Character1.emotional} and {character2} stood in {setting|event}, {weather}, neither one blinking. {Item} sat between them — the prize, the proof, the problem. The {role} who was supposed to keep things fair had already left.\n\n{Hook} was the moment it all flipped. Loyalty is easy when it\'s cheap. The double cross made it expensive. All they wanted was {wish}. A {tone} tale about {moral.about} — and what happens when someone changes sides.',

  // Template 115 — The Missing Piece
  // Voice: bedtime-whisper | Opening: sensory | Temporal: linear | Dynamic: helper | Agency: passive
  // Arc: calm | Tension: question | Stakes: implied | Connection: symbolic | Hook-role: background
  // Moral: woven | Mystery: question-based | Spotlight: tone
  // Structure: two-para | Rhythm: flowing | Item-role: key | Scale: intimate | Genre-feel: fable
  // Shape: search-for-lost
  '{Weather}, in the quietest corner of {setting|event}, {character1.emotional} sorted through what was left. Something was missing — they could feel it, the way you feel a gap in a melody. {Item} was close, but not quite right. {Hook} was the shape of the hole.\n\n{Character2}, a {role} who understood lost things, sat down beside them. No rush. The search wasn\'t dramatic — just {tone} and patient and honest. All they wanted was {wish}. A story about {moral.about}, found in the space where the missing piece used to be.',

  // Template 116 — The Disguise
  // Voice: campfire | Opening: contrast | Temporal: linear | Dynamic: rivals | Agency: proactive
  // Arc: surprise-pivot | Tension: secret | Stakes: identity | Connection: causal | Hook-role: central
  // Moral: label | Mystery: teaser | Spotlight: character-emotional
  // Structure: two-para | Rhythm: mixed | Item-role: catalyst | Scale: local | Genre-feel: tall-tale
  // Shape: hidden-truth
  'Let me tell you something about {character1.emotional}: they weren\'t who they said they were. Not in {setting|event}, not {weather}, not ever. The {role} disguise was good — convincing enough to fool everyone, including {character2}.\n\nBut {item} gave it away. And once {hook.verb}, the whole act fell apart in the most {tone} way imaginable. All they wanted was {wish}. A tale about {moral.about} — and whether the person behind the mask is better or worse than the mask itself.',

  // Template 117 — The Witness
  // Voice: in-medias-res | Opening: declarative | Temporal: middle-first | Dynamic: protector-ward | Agency: reactive
  // Arc: steady-build | Tension: pursuit | Stakes: personal-loss | Connection: causal | Hook-role: looming-threat
  // Moral: label | Mystery: teaser | Spotlight: character-emotional
  // Structure: two-para | Rhythm: mixed | Item-role: clue | Scale: expanding | Genre-feel: adventure-serial
  // Shape: daring-escape
  '{Character1.emotional} saw everything. That was the problem. In {setting|event}, {weather}, being the only one who knew what {hook} really meant made you a target. {Character2}, the {role}, said the safest thing was to stay quiet.\n\nBut {item} was proof — and proof has a way of finding the light. The chase that followed was {tone} and relentless. All they wanted was {wish}. A tale about {moral.about}, told on the run.',

  // Template 118 — The Map That Lied
  // Voice: rhetorical | Opening: rule-to-break | Temporal: linear | Dynamic: reluctant-partners | Agency: proactive
  // Arc: man-in-hole | Tension: discovery | Stakes: trust | Connection: contradictory | Hook-role: reframed
  // Moral: label | Mystery: laid-out | Spotlight: item
  // Structure: two-para | Rhythm: mixed | Item-role: key | Scale: expanding | Genre-feel: adventure-serial
  // Shape: treasure-hunt
  'Never trust a map you didn\'t draw yourself. {Character1.emotional} learned that the hard way in {setting|event}, {weather}, following {item} toward a prize that kept moving. {Character2}, the {role}, said the map was reliable. The map disagreed.\n\nEvery wrong turn revealed something {hook} had hidden on purpose. The treasure hunt was {tone} and infuriating and nothing like the straight line they\'d imagined. All they wanted was {wish}. A tale about {moral.about} — and how getting lost is sometimes the whole point.',
];
