// Cozy templates (149–158) — small stakes, gentle, wind-down, bedtime-friendly.
//
// See template_engine/placeholders.md for full placeholder reference.
// See template_engine/dimensions.md for dimension tag definitions.

export const templates = [
  // Template 149 — The Blanket Fort
  // Voice: bedtime-whisper | Opening: sensory | Temporal: linear | Dynamic: helper | Agency: passive
  // Arc: wind-down | Tension: discovery | Stakes: implied | Connection: symbolic | Hook-role: background
  // Moral: woven | Mystery: laid-out | Spotlight: setting
  // Structure: wind-down | Rhythm: flowing | Item-role: comfort | Scale: microscopic | Genre-feel: lullaby
  // Shape: build-together
  '{Weather}, the light {setting.placed|event.placed} was dim and golden and exactly right. {Character1.emotional} and {character2} had spent all evening building — pillows here, {item} there, blankets draped just so. The {role} of chief architect was shared, unevenly and happily.\n\n{Hook} didn\'t matter tonight. Not really. Inside the fort, the world was {tone} and small and theirs. All they wanted was {wish}. A story about {moral.about}, told from inside the softest walls in the world.',

  // Template 150 — The Slowest Walk Home
  // Voice: direct-address | Opening: sensory | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: calm | Tension: discovery | Stakes: implied | Connection: symbolic | Hook-role: background
  // Moral: implied | Mystery: laid-out | Spotlight: weather
  // Structure: wind-down | Rhythm: flowing | Item-role: comfort | Scale: intimate | Genre-feel: lullaby
  // Shape: nature-takes-its-course
  '{Weather}, the walk home from {event} was the longest it had ever been — not because the road was long, but because {character1.emotional} and {character2} kept stopping. To look at {item}. To listen to {weather.noun}. To say nothing at all in the most {tone} way possible.\n\nThe {role} who\'d told them to hurry gave up somewhere around the second stop. {Hook} was a conversation that could wait. The world was gentle tonight. All they wanted was {wish}. And {moral.about} happened somewhere between the first step and the last.',

  // Template 151 — The Recipe Gone Wrong
  // Voice: laconic | Opening: interrupted-routine | Temporal: linear | Dynamic: strangers | Agency: reactive
  // Arc: surprise-pivot | Tension: mismatch | Stakes: implied | Connection: coincidence | Hook-role: catalyst
  // Moral: label | Mystery: laid-out | Spotlight: character-both
  // Structure: two-para | Rhythm: short-punchy | Item-role: catalyst | Scale: microscopic | Genre-feel: tall-tale
  // Shape: mistake-to-fix
  'The recipe said: add {item.bare}, stir twice, wait. {Character1.emotional} added {item.bare}, stirred six times, and did not wait. {Setting.placed|event.placed}, {weather}, this was a predictable disaster.\n\n{Character2}, the {role} with actual patience, arrived to find {hook} — which was technically edible but spiritually wrong. The fix was {tone} and messy and involved starting over from scratch, together. All they wanted was {wish}. A tale about {moral.about}.',

  // Template 152 — The Lost Pet
  // Voice: confessional | Opening: declarative | Temporal: linear | Dynamic: helper | Agency: proactive
  // Arc: steady-build | Tension: pursuit | Stakes: personal-loss | Connection: causal | Hook-role: catalyst
  // Moral: label | Mystery: laid-out | Spotlight: character-emotional
  // Structure: two-para | Rhythm: mixed | Item-role: clue | Scale: local | Genre-feel: neutral
  // Shape: search-for-lost
  '{Character1.emotional} had looked everywhere — under every table {setting.placed|event.placed}, behind every door, inside every pocket. Gone. {Weather}, the search felt heavier with every empty spot. {Character2}, the {role} who always knew where things were, didn\'t know this time.\n\n{Item} was the clue — a trail of small, {tone} evidence leading somewhere neither of them expected. {Hook} was part of the chase. All they wanted was {wish}. A tale about {moral.about}, and how sometimes what you\'re looking for is looking for you too.',

  // Template 153 — The Snow Day
  // Voice: direct-address | Opening: impossible-image | Temporal: linear | Dynamic: strangers | Agency: proactive
  // Arc: calm | Tension: discovery | Stakes: belonging | Connection: coincidence | Hook-role: background
  // Moral: woven | Mystery: laid-out | Spotlight: weather
  // Structure: two-para | Rhythm: mixed | Item-role: comfort | Scale: local | Genre-feel: neutral
  // Shape: unlikely-friendship
  'Picture this: {weather}, {setting|event} buried under more silence than usual, and {character1.emotional} standing in the middle of it all with {item} and absolutely no plans. The {role} they were supposed to report to wasn\'t coming. Nobody was coming. The whole day was theirs.\n\n{Character2} appeared from somewhere — bundled, grinning, equally free. {Hook} was forgotten the moment they started building something ridiculous out of nothing. A {tone} day about {wish.bare} and {moral.about}, wasted beautifully.',

  // Template 154 — The Bedtime Stall
  // Voice: campfire | Opening: dialogue-cold | Temporal: linear | Dynamic: mentor-student | Agency: reluctant
  // Arc: wind-down | Tension: question | Stakes: implied | Connection: assertion | Hook-role: background
  // Moral: woven | Mystery: question-based | Spotlight: tone
  // Structure: dialogue | Rhythm: mixed | Item-role: comfort | Scale: microscopic | Genre-feel: lullaby
  // Shape: lesson-to-learn
  '"One more story." "You said that two stories ago." {Character1.emotional} pulled {item} closer and looked up with the expression that always works. {Character2}, the {role} who was supposed to enforce bedtime, sat back down. {Weather}, {setting|event} was too {tone} to leave.\n\n"Fine. One more. But this one is about {hook} — and how someone who wanted {wish} figured out that {moral.about} matters more than staying up late." The lesson landed softly. The eyes closed slowly. The story was exactly the right length.',

  // Template 155 — The Perfectly Normal Picnic
  // Voice: instructional | Opening: catalog | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: calm | Tension: mismatch | Stakes: implied | Connection: coincidence | Hook-role: background
  // Moral: implied | Mystery: laid-out | Spotlight: setting
  // Structure: two-para | Rhythm: fragmented | Item-role: comfort | Scale: intimate | Genre-feel: fable
  // Shape: nature-takes-its-course
  '{Item}. A blanket. Two cups. {Setting|event}, {weather}. And {character1.emotional} and {character2}, sitting very still, because the {role} had said: don\'t move. Something wonderful is about to happen.\n\nThey waited. {Hook} came and went. A bird landed. The light changed. Nothing happened, exactly — and that was the point. The picnic was {tone} and ordinary and the kind of afternoon you remember forever. All they wanted was {wish}. And somewhere in the quiet, {moral.about} spoke without being asked.',

  // Template 156 — The Treehouse
  // Voice: confessional | Opening: declarative | Temporal: linear | Dynamic: reluctant-partners | Agency: proactive
  // Arc: steady-build | Tension: mismatch | Stakes: belonging | Connection: causal | Hook-role: catalyst
  // Moral: label | Mystery: laid-out | Spotlight: setting
  // Structure: two-para | Rhythm: mixed | Item-role: key | Scale: intimate | Genre-feel: neutral
  // Shape: build-together
  '{Character1.emotional} wanted the door on the left. {Character2} wanted it on the right. The {role} in charge — which was neither of them and both of them — declared a standoff. {Weather}, the treehouse {setting.placed|event.placed} was half-built and fully argued about.\n\n{Item} was the solution — or the compromise — or the thing that made them both laugh long enough to stop fighting. {Hook} was still unresolved when they finished, but the treehouse stood. A {tone} tale about {wish.bare} and {moral.about}, nailed together one board at a time.',

  // Template 157 — The Night Garden
  // Voice: bedtime-whisper | Opening: scalar-shift | Temporal: linear | Dynamic: helper | Agency: passive
  // Arc: wind-down | Tension: discovery | Stakes: implied | Connection: symbolic | Hook-role: background
  // Moral: woven | Mystery: laid-out | Spotlight: setting
  // Structure: wind-down | Rhythm: rhythmic | Item-role: gift | Scale: contracting | Genre-feel: lullaby
  // Shape: hidden-garden
  'Far above, the sky. Below that, {weather.noun}. Below that, {setting|event}. And below everything else — tucked between roots, lit by {item} — a garden that only opens at night. {Character1.emotional} found it. {Character2}, the {role}, had planted it.\n\n{Hook} was why it had to grow in the dark — but dark isn\'t always unkind. The night garden was {tone} and quiet and exactly what they needed. All they wanted was {wish}. A story about {moral.about}, blooming after bedtime.',

  // Template 158 — The Rainy Afternoon
  // Voice: direct-address | Opening: contrast | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: calm | Tension: mismatch | Stakes: implied | Connection: coincidence | Hook-role: background
  // Moral: label | Mystery: laid-out | Spotlight: weather
  // Structure: two-para | Rhythm: flowing | Item-role: comfort | Scale: microscopic | Genre-feel: fable
  // Shape: unlikely-friendship
  'The plan was {event}. The weather had other ideas. {Weather}, {setting|event} became the backup plan — smaller, closer, and somehow better. {Character1.emotional} didn\'t mind. {Character2}, the {role} who\'d organized everything, minded a lot.\n\n{Item} was the distraction. Then {hook} was the second distraction. Then the afternoon turned {tone}, and the rain turned from problem to soundtrack. All they wanted was {wish}. A tale about {moral.about} — and how the best days are the ones that don\'t go as planned.',
];
