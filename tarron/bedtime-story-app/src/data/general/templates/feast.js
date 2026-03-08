// Feast templates (199–203) — food-centric stories: shared meals, forbidden bites, midnight kitchens.
//
// See template_engine/placeholders.md for full placeholder reference.
// See template_engine/dimensions.md for dimension tag definitions.

export const templates = [
  // Template 199 — The Impossible Feast
  // Voice: campfire | Opening: declarative | Temporal: linear | Dynamic: strangers | Agency: proactive
  // Arc: steady-build | Tension: negotiation | Stakes: belonging | Connection: causal | Hook-role: catalyst
  // Moral: woven | Mystery: laid-out | Spotlight: food
  // Structure: two-para | Rhythm: flowing | Item-role: gift | Scale: local | Genre-feel: fable
  // Shape: deal-with-consequences
  '{Character1.emotional} decided to cook {food} for the enemy. Everyone said it was foolish — {hook}, and the {faction.bare} across the river hadn\'t spoken to anyone in years. But {character1.bare} lit a fire {setting.placed|event.placed}, {weather}, and started cooking. The {creature.bare} that wandered in didn\'t help, but it didn\'t leave either.\n\n{Character2}, the {role}, brought {item} — not to fight, but to set the table. The smell of {food.bare} carries farther than any flag of truce. All they wanted was {wish}. A {tone} story about {moral.about}, and how the hardest meal to make is the one you cook for someone you haven\'t forgiven.',

  // Template 200 — The Tea Party
  // Voice: bedtime-whisper | Opening: impossible-image | Temporal: scrambled | Dynamic: trickster | Agency: reactive
  // Arc: surprise-pivot | Tension: discovery | Stakes: implied | Connection: symbolic | Hook-role: background
  // Moral: label | Mystery: question-based | Spotlight: food
  // Structure: two-para | Rhythm: rhythmic | Item-role: clue | Scale: intimate | Genre-feel: tall-tale
  // Shape: surreal-journey
  'The rules of the meal were simple: don\'t sit in the same chair twice, never finish your {food}, and always pass {item} to the left. {Character1.emotional} sat down at the table {setting.placed|event.placed} and immediately broke all three. {Weather}, and the {creature.bare} pouring {food.bare} didn\'t seem to mind — or maybe it just hadn\'t noticed yet.\n\n{Character2}, the {role}, explained that {hook} was the reason the chairs kept moving. The {faction.bare} who\'d set this table had their own logic, {tone} and sideways. All they wanted was {wish}. A tale about {moral.about} — and what happens when the rules only make sense if you stop trying to understand them.',

  // Template 201 — The Forbidden Bite
  // Voice: confessional | Opening: dialogue-cold | Temporal: linear | Dynamic: strangers | Agency: reactive
  // Arc: reversal | Tension: temptation | Stakes: personal-loss | Connection: causal | Hook-role: catalyst
  // Moral: woven | Mystery: laid-out | Spotlight: food
  // Structure: two-para | Rhythm: short-punchy | Item-role: trade | Scale: local | Genre-feel: myth
  // Shape: deal-with-consequences
  '"Don\'t eat the {food.bare}." That was the only rule. {Character1.emotional} stood {setting.placed|event.placed}, {weather}, staring at the single plate on the stone table. The {creature.bare} guarding it said nothing. The {role} who\'d brought them here had said {hook} — but the {food.bare} smelled like home, like something they\'d been missing without knowing it.\n\n{Character2} arrived with {item} and a warning: the {faction.bare} who left this offering always want something in return. Every bite has a price. All they wanted was {wish}. A {tone} story about {moral.about}, and whether wanting something badly enough is the same as needing it.',

  // Template 202 — The Recipe Handed Down
  // Voice: bedtime-whisper | Opening: sensory | Temporal: linear | Dynamic: mentor-student | Agency: proactive
  // Arc: calm | Tension: question | Stakes: belonging | Connection: symbolic | Hook-role: background
  // Moral: woven | Mystery: question-based | Spotlight: food
  // Structure: two-para | Rhythm: flowing | Item-role: key | Scale: intimate | Genre-feel: lullaby
  // Shape: nature-takes-its-course
  'The recipe for {food} had been in the family longer than anyone\'s name. {Character1.emotional} found it tucked inside {item}, written in handwriting too old to read easily. {Weather}, the kitchen {setting.placed|event.placed} smelled like {plant.bare} and waiting. The {creature.bare} sitting on the windowsill watched every step as if it knew the recipe too.\n\n{Character2}, the {role}, said some recipes carry more than flavor — they carry who made them and why. {Hook} was the reason it had almost been lost. All they wanted was {wish}. A {tone} story about {moral.about}, and how the best things we inherit are the ones nobody thought to write down properly.',

  // Template 203 — The Midnight Kitchen
  // Voice: direct-address | Opening: sensory | Temporal: linear | Dynamic: helper | Agency: proactive
  // Arc: steady-build | Tension: discovery | Stakes: implied | Connection: causal | Hook-role: background
  // Moral: label | Mystery: laid-out | Spotlight: food
  // Structure: two-para | Rhythm: mixed | Item-role: clue | Scale: intimate | Genre-feel: lullaby
  // Shape: hidden-garden
  'You know the feeling: the house is dark, {weather}, and the kitchen floor is cold under bare feet. {Character1.emotional} crept in looking for {food} and found {character2} already there, sitting in the dark with {item} and the expression of someone caught doing exactly the same thing. The {creature.bare} on top of the cupboard pretended to be asleep.\n\nThe {role} would have said don\'t — but the {role.bare} was upstairs, not here. {Hook} had made it a strange day, and {setting|event} felt different at this hour. They ate {food.bare} in the dark without talking, because some meals are better shared in silence. All they wanted was {wish}. A {tone} story about {moral.about}, and the small adventures that happen after everyone else is asleep.',
];
