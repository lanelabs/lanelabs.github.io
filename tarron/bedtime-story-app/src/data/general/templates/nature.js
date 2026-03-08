// Nature templates (169–173) — creature encounters, plant magic, growing things.
//
// See template_engine/placeholders.md for full placeholder reference.
// See template_engine/dimensions.md for dimension tag definitions.

export const templates = [
  // Template 169 — The Healing Garden
  // Voice: bedtime-whisper | Opening: sensory | Temporal: linear | Dynamic: helper | Agency: proactive
  // Arc: steady-build | Tension: discovery | Stakes: personal-loss | Connection: causal | Hook-role: catalyst
  // Moral: woven | Mystery: laid-out | Spotlight: plant
  // Structure: two-para | Rhythm: flowing | Item-role: key | Scale: intimate | Genre-feel: fable
  // Shape: hidden-garden
  '{Weather}, the garden {setting.placed|event.placed} had been forgotten by everyone except {character1.emotional}. One {plant} still grew there — stubborn, leaning toward light that wasn\'t there anymore. The {role} who used to tend this place was long gone, and {hook} had turned the soil bitter.\n\n{Character2} arrived with {item} and no plan. The {creature} watching from the wall said nothing, because {creature.bare} never do — but it stayed, which meant something. They planted what they could. A {tone} story about {wish.bare} and {moral.about}, growing back one root at a time.',

  // Template 170 — The Creature's Bargain
  // Voice: campfire | Opening: dialogue-cold | Temporal: linear | Dynamic: strangers | Agency: reactive
  // Arc: reversal | Tension: negotiation | Stakes: personal-loss | Connection: causal | Hook-role: catalyst
  // Moral: label | Mystery: laid-out | Spotlight: creature
  // Structure: two-para | Rhythm: short-punchy | Item-role: trade | Scale: local | Genre-feel: fable
  // Shape: deal-with-consequences
  '"I\'ll trade you," said the {creature.bare}. It sat {setting.placed|event.placed}, {weather}, looking at {character1.emotional} with the patience of something that has all the time in the world. It wanted {item}. It was offering a single {plant.bare}, roots and all.\n\n{Character2}, the {role} who knew better, said don\'t. But {hook} made the choice feel urgent, and the {creature.bare}\'s eyes were {tone} and steady. All they wanted was {wish}. A tale about {moral.about} — and whether a fair trade is the same thing as a good one.',

  // Template 171 — The Oldest Tree
  // Voice: confessional | Opening: scalar-shift | Temporal: linear | Dynamic: mentor-student | Agency: passive
  // Arc: calm | Tension: question | Stakes: implied | Connection: symbolic | Hook-role: background
  // Moral: woven | Mystery: question-based | Spotlight: plant
  // Structure: two-para | Rhythm: rhythmic | Item-role: gift | Scale: contracting | Genre-feel: lullaby
  // Shape: nature-takes-its-course
  'The {plant.bare} {setting.placed|event.placed} had been growing since before anyone could remember. {Weather}, its branches held {item} — left there by someone, or grown there by the tree itself. Nobody was sure. {Character1.emotional} sat beneath it and asked the question everyone asks old things: why are you still here?\n\nThe {role} — {character2} — said trees don\'t answer questions. But a {creature.bare} landed on the lowest branch and sang something {tone}, and that felt like enough. {Hook} was the reason they\'d come, but {wish} was the reason they stayed. A story about {moral.about}, told in rings.',

  // Template 172 — The Nest
  // Voice: direct-address | Opening: impossible-image | Temporal: linear | Dynamic: reluctant-partners | Agency: proactive
  // Arc: steady-build | Tension: pursuit | Stakes: belonging | Connection: causal | Hook-role: catalyst
  // Moral: label | Mystery: laid-out | Spotlight: creature
  // Structure: two-para | Rhythm: mixed | Item-role: clue | Scale: local | Genre-feel: neutral
  // Shape: rescue
  'Picture this: a {creature.bare}, building a nest out of {item.bare} and {plant.bare} and sheer stubbornness, right in the middle of {setting|event}. {Weather}, and {character1.emotional} had been watching for an hour, afraid to move, afraid to look away.\n\n{Character2}, the {role}, arrived with opinions. The nest was in the wrong place. {Hook} meant it couldn\'t stay. But the {creature.bare} kept building — one piece at a time, {tone} and deliberate. All they wanted was {wish}. A tale about {moral.about}, and how sometimes the bravest thing is just not leaving.',

  // Template 173 — The Forbidden Grove
  // Voice: laconic | Opening: declarative | Temporal: linear | Dynamic: strangers | Agency: proactive
  // Arc: surprise-pivot | Tension: forbidden-zone | Stakes: personal-loss | Connection: causal | Hook-role: catalyst
  // Moral: label | Mystery: question-based | Spotlight: plant
  // Structure: two-para | Rhythm: short-punchy | Item-role: key | Scale: local | Genre-feel: tall-tale
  // Shape: quest
  'Everyone said don\'t go past the {plant.bare}. {Character1.emotional} went past the {plant.bare}. {Weather}, {setting|event} was darker on the other side — not dangerous-dark, just different-dark. A {creature.bare} watched from a branch. The {role} had warned them: {hook}, and the grove remembers.\n\n{Character2} followed, carrying {item} and the expression of someone who\'d rather be anywhere else. The grove was {tone} and full of things that grew without sunlight. All they wanted was {wish}. A story about {moral.about} — and what happens when you go where you were told not to.',
];
