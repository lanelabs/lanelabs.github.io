// Sci-fi templates (99–108) — space, robots, time, AI, and the future.
//
// See template_engine/placeholders.md for full placeholder reference.
// See template_engine/dimensions.md for dimension tag definitions.

export const templates = [
  // Template 99 — The Last Transmission
  // Voice: in-medias-res | Opening: sensory | Temporal: countdown | Dynamic: strangers | Agency: reactive
  // Arc: steady-build | Tension: ticking-clock | Stakes: missed-moment | Connection: causal | Hook-role: looming-threat
  // Moral: label | Mystery: teaser | Spotlight: item
  // Structure: two-para | Rhythm: short-punchy | Item-role: clue | Scale: epic | Genre-feel: adventure-serial
  // Shape: race-against-time
  'The signal was faint — three words, repeating. {Item} picked it up first, glowing in the dark of {setting|event}. {Character1.emotional} traced its origin: somewhere past everything they knew. {Weather}, the signal was already fading.\n\n{Character2}, the {role}, said they had hours at best. {Hook} was encoded in the message — and if they didn\'t reach it in time, nobody would. All they wanted was {wish}. A {tone} tale about {moral.about}, told against a dying frequency.',

  // Template 100 — The Robot Who Remembered
  // Voice: confessional | Opening: contrast | Temporal: flashback | Dynamic: helper | Agency: passive
  // Arc: dark-to-light | Tension: question | Stakes: identity | Connection: symbolic | Hook-role: past-event
  // Moral: woven | Mystery: question-based | Spotlight: character-emotional
  // Structure: two-para | Rhythm: flowing | Item-role: symbol | Scale: intimate | Genre-feel: fable
  // Shape: becoming-real
  '{Character1.emotional} wasn\'t supposed to remember. The circuits {setting.placed|event.placed} were designed for tasks, not feelings. But {weather}, something stirred — a flicker behind the routine, a warmth that had no source code. {Item} was the first thing they\'d ever kept for no reason at all.\n\n{Character2}, the {role} who\'d built them, didn\'t know what to make of it. {Hook} was supposed to be impossible for something made of metal. But some questions — like whether {wish.bare} counts if you weren\'t born to want it — don\'t care about blueprints. A {tone} story about {moral.about}.',

  // Template 101 — First Contact
  // Voice: instructional | Opening: declarative | Temporal: linear | Dynamic: believer-skeptic | Agency: reactive
  // Arc: surprise-pivot | Tension: mismatch | Stakes: trust | Connection: discovery | Hook-role: reframed
  // Moral: label | Mystery: laid-out | Spotlight: character-both
  // Structure: two-para | Rhythm: mixed | Item-role: gift | Scale: epic | Genre-feel: myth
  // Shape: gift-to-give
  'If something arrives {setting.placed|event.placed} that you don\'t recognize — don\'t panic. That\'s the first rule. {Character1.emotional} panicked. {Character2}, the {role}, did not. {Weather}, {hook} changed the meaning of everything they thought they knew.\n\nThe visitor left {item} — not as a weapon, not as a warning, but as a gift. The misunderstanding was {tone} and enormous and completely fixable. All they wanted was {wish}. A tale about {moral.about} — and how meeting the unknown is easier when you start with hello.',

  // Template 102 — Time Loop Tuesday
  // Voice: laconic | Opening: interrupted-routine | Temporal: circular | Dynamic: strangers | Agency: proactive
  // Arc: man-in-hole | Tension: question | Stakes: missed-moment | Connection: causal | Hook-role: central
  // Moral: label | Mystery: question-based | Spotlight: character-emotional
  // Structure: two-para | Rhythm: short-punchy | Item-role: key | Scale: local | Genre-feel: neutral
  // Shape: mistake-to-fix
  '{Character1.emotional} woke up. Same {setting.bare|event.bare}. Same {weather.noun}. Same everything. Again. {Hook} happened at exactly 10:14, just like yesterday. And the day before that. And the day before that.\n\n{Character2} was the only variable — the {role} who showed up different every time. {Item} was the clue, but the real puzzle was figuring out what needed to change. All they wanted was {wish}. A {tone} tale about {moral.about}, told on repeat until it finally sticks.',

  // Template 103 — The Generation Ship
  // Voice: legend | Opening: scalar-shift | Temporal: linear | Dynamic: mentor-student | Agency: compelled
  // Arc: steady-build | Tension: scarcity | Stakes: belonging | Connection: inheritance | Hook-role: background
  // Moral: woven | Mystery: teaser | Spotlight: setting
  // Structure: three-beat | Rhythm: flowing | Item-role: last | Scale: epic | Genre-feel: myth
  // Shape: message-to-deliver
  'The ship had been traveling for so long that nobody remembered the ground. {Setting|event} was all there was — corridors and starlight and the hum of engines that never stopped. {Character1.emotional} was born here. So was every {role} before them.\n\n{Weather}, {character2} found {item} in a sealed compartment — old, fragile, and carrying a message from the people who launched them. {Hook} was written in the margins, a warning nobody had read.\n\nThe destination was closer than they thought. All they wanted was {wish}. A {tone} legend about {moral.about}, delivered across generations.',

  // Template 104 — The Uploaded Mind
  // Voice: confessional | Opening: question-hook | Temporal: linear | Dynamic: secret-between | Agency: reluctant
  // Arc: light-to-dark | Tension: secret | Stakes: identity | Connection: causal | Hook-role: catalyst
  // Moral: question | Mystery: withhold-hook | Spotlight: character-emotional
  // Structure: two-para | Rhythm: flowing | Item-role: symbol | Scale: internal | Genre-feel: ghost-story
  // Shape: hidden-truth
  'What if you could live forever — but you weren\'t sure you were still you? {Character1.emotional} had made the choice. The transfer was clean. {Setting|event} looked the same, felt the same, {weather}. But something was missing, and {item} — the one thing they\'d carried across — felt different in their hands.\n\n{Character2}, the {role} who\'d known them before, noticed it too but wouldn\'t say. {Hook} was the gap between who they\'d been and who they\'d become. All they wanted was {wish}. A {tone} question about {moral.about} — and whether a copy of a person is still a person.',

  // Template 105 — The Friendly AI
  // Voice: direct-address | Opening: dialogue-cold | Temporal: linear | Dynamic: helper | Agency: passive
  // Arc: calm | Tension: discovery | Stakes: implied | Connection: symbolic | Hook-role: background
  // Moral: woven | Mystery: laid-out | Spotlight: character-both
  // Structure: two-para | Rhythm: mixed | Item-role: comfort | Scale: intimate | Genre-feel: lullaby
  // Shape: lasting-gift
  '"Good evening. How can I help?" The voice came from {item}, soft and patient, the way it always did {setting.placed|event.placed}. {Character1.emotional} didn\'t need help, exactly. They just needed someone to talk to. {Weather}, the world outside felt very far away.\n\nThe voice — {character2}, though that wasn\'t its real name — was a {role} in the truest sense: always there, never tired, never judging. {Hook} was just a conversation tonight. All they wanted was {wish}. A {tone} story about {moral.about}, told by the kindest light in the room.',

  // Template 106 — Terraform
  // Voice: campfire | Opening: sensory | Temporal: linear | Dynamic: reluctant-partners | Agency: proactive
  // Arc: steady-build | Tension: scarcity | Stakes: belonging | Connection: causal | Hook-role: central
  // Moral: label | Mystery: laid-out | Spotlight: setting
  // Structure: two-para | Rhythm: mixed | Item-role: catalyst | Scale: expanding | Genre-feel: adventure-serial
  // Shape: build-together
  'The first thing they planted didn\'t grow. Neither did the second. {Setting.placed|event.placed}, {weather}, everything was the wrong color, the wrong temperature, the wrong kind of alive. {Character1.emotional} stared at the dust and almost quit.\n\n{Character2}, the {role} who\'d signed up for exactly this, handed over {item} and said nothing. {Hook} had made the old world impossible. This barren place was all they had. All they wanted was {wish} — and one green thing, growing. A {tone} tale about {moral.about}, built from nothing.',

  // Template 107 — Parallel Universe
  // Voice: warning | Opening: impossible-image | Temporal: parallel | Dynamic: strangers | Agency: reactive
  // Arc: surprise-pivot | Tension: mismatch | Stakes: identity | Connection: contradictory | Hook-role: reframed
  // Moral: label | Mystery: teaser | Spotlight: hook
  // Structure: two-para | Rhythm: fragmented | Item-role: clue | Scale: expanding | Genre-feel: anti-fairy-tale
  // Shape: between-two-worlds
  'Here\'s the thing about {setting|event}: there are two of them. Same place, same {weather.noun}, same {item.bare} sitting on the same shelf. But in one version, {character1.emotional} never met {character2}. In the other, they never parted.\n\n{Hook} is the crack between them — and the {role} on the other side is not who anyone expected. The question isn\'t which world is real. It\'s which one is worth choosing. A {tone} tale about {wish.bare} and {moral.about}.',

  // Template 108 — The Stars Go Out
  // Voice: bedtime-whisper | Opening: scalar-shift | Temporal: countdown | Dynamic: protector-ward | Agency: compelled
  // Arc: wind-down | Tension: scarcity | Stakes: personal-loss | Connection: symbolic | Hook-role: looming-threat
  // Moral: woven | Mystery: teaser | Spotlight: weather
  // Structure: two-para | Rhythm: flowing | Item-role: last | Scale: contracting | Genre-feel: lullaby
  // Shape: precious-to-protect
  'One by one, {weather}, the lights above {setting|event} were going out. Not quickly — slowly, the way a candle dims before it sleeps. {Character1.emotional} counted them every night. {Character2}, the {role}, said not to worry. But even {role}s worry when the sky grows darker.\n\n{Item} held the last one — small, warm, and stubborn. {Hook} was why the others had gone. But this one was theirs to protect. All they wanted was {wish}. A {tone} story about {moral.about}, told under the very last star.',

  // --- Book-inspired sci-fi templates (184–188) ---

  // Template 184 — The Training Game (Ender\'s Game)
  // Voice: instructional | Opening: rule-to-break | Temporal: linear | Dynamic: rivals | Agency: proactive
  // Arc: surprise-pivot | Tension: secret | Stakes: trust | Connection: causal | Hook-role: reframed
  // Moral: tested | Mystery: withhold-hook | Spotlight: character-both
  // Structure: two-para | Rhythm: short-punchy | Item-role: key | Scale: expanding | Genre-feel: adventure-serial
  // Shape: game-turns-real
  'The rules were clear: {setting.placed|event.placed}, two players, one objective, no second chances. {Character1.emotional} had won every round so far. {Character2} had come close. {Weather}, the {role} running the game changed something — quietly, without announcement. The stakes shifted. {Item} appeared where it shouldn\'t have.\n\nThat\'s when {hook.verb}. The game wasn\'t a game anymore. The decisions they\'d been practicing — the ones that felt safe because nothing was real — had been counting all along. All they wanted was {wish}. A {tone} tale about {moral.about}, and the moment you realize the test was never pretend.',

  // Template 185 — Stranded and Solving (The Martian)
  // Voice: confessional | Opening: catalog | Temporal: linear | Dynamic: helper | Agency: proactive
  // Arc: man-in-hole | Tension: scarcity | Stakes: personal-loss | Connection: causal | Hook-role: past-event
  // Moral: label | Mystery: laid-out | Spotlight: character-emotional
  // Structure: two-para | Rhythm: fragmented | Item-role: key | Scale: intimate | Genre-feel: adventure-serial
  // Shape: solving-one-at-a-time
  '{Item}. A broken piece of something that used to work. Half a plan. That was the inventory. {Character1.emotional}, stranded {setting.placed|event.placed}, {weather}, had already solved the first three problems — air, water, not panicking — and now faced {hook}, which was the big one.\n\nThe {role} they\'d trained under always said: one problem at a time. {Character2} was out there somewhere, trying to help from too far away. All they wanted was {wish}. A {tone} tale about {moral.about}, told one solution at a time.',

  // Template 186 — Learning the Language (Arrival)
  // Voice: bedtime-whisper | Opening: sensory | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: calm | Tension: question | Stakes: missed-moment | Connection: discovery | Hook-role: central
  // Moral: woven | Mystery: question-based | Spotlight: character-emotional
  // Structure: two-para | Rhythm: rhythmic | Item-role: gift | Scale: intimate | Genre-feel: fable
  // Shape: learning-to-listen
  'The sound came first — not words, not music, something between. {Weather}, {setting.placed|event.placed}, {character1.emotional} sat very still and listened. {Character2} made the sound again. Patient. Waiting. The {role} who\'d brought them together said: don\'t try to understand. Try to hear.\n\n{Item} was the first thing they both recognized — held up, pointed at, named in two languages that shared nothing. {Hook} was the reason communication mattered. But the real breakthrough was smaller: a gesture, a pause, {aTone} silence that meant the same thing in both worlds. All they wanted was {wish}. A story about {moral.about}, spoken without words.',

  // Template 187 — The Gift That Fades (Flowers for Algernon)
  // Voice: legend | Opening: contrast | Temporal: linear | Dynamic: helper | Agency: passive
  // Arc: cinderella | Tension: ticking-clock | Stakes: personal-loss | Connection: causal | Hook-role: catalyst
  // Moral: woven | Mystery: teaser | Spotlight: character-emotional
  // Structure: two-para | Rhythm: flowing | Item-role: catalyst | Scale: internal | Genre-feel: fable
  // Shape: gift-that-fades
  '{Character1.emotional} could suddenly do the impossible. {Weather}, {setting.placed|event.placed}, {item} had given them something — understanding, speed, a kind of sight that made {hook} simple. The {role} who\'d studied such things said: it won\'t last. They didn\'t listen. Nobody listens when the world is finally making sense.\n\n{Character2} noticed the change first — the moments of forgetting, the hesitation where certainty used to be. The gift was leaving the way it came: quietly, without asking permission. All they wanted was {wish}. A {tone} tale about {moral.about}, and whether the person you were during the gift is still the person you are after.',

  // Template 188 — The Clone\'s Question (Blade Runner / Never Let Me Go)
  // Voice: warning | Opening: question-hook | Temporal: linear | Dynamic: secret-between | Agency: reactive
  // Arc: steady-build | Tension: question | Stakes: identity | Connection: symbolic | Hook-role: central
  // Moral: question | Mystery: question-based | Spotlight: hook
  // Structure: two-para | Rhythm: mixed | Item-role: symbol | Scale: internal | Genre-feel: anti-fairy-tale
  // Shape: copy-seeks-truth
  'This isn\'t the kind of question that has a comfortable answer. If {character1.emotional} was made — built, assembled, copied — does that make them less real? {Setting.placed|event.placed}, {weather}, nobody wanted to ask it out loud. {Character2} said of course they were real. The {role} who\'d made them said it was complicated.\n\n{Hook} was the proof — or the evidence against — depending on who was looking. {Item} was the only thing that was entirely, undeniably theirs: chosen, kept, worn smooth by their own hands. All they wanted was {wish}. A {tone} tale about {moral.about}, and whether the question "am I real?" even needs an answer.',
];
