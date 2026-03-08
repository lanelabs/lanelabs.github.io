// Faction templates (174–178) — guilds, organizations, loyalty, politics.
//
// See template_engine/placeholders.md for full placeholder reference.
// See template_engine/dimensions.md for dimension tag definitions.

export const templates = [
  // Template 174 — The Guild's Test
  // Voice: instructional | Opening: declarative | Temporal: linear | Dynamic: mentor-student | Agency: proactive
  // Arc: steady-build | Tension: trial | Stakes: belonging | Connection: causal | Hook-role: catalyst
  // Moral: label | Mystery: laid-out | Spotlight: faction
  // Structure: two-para | Rhythm: mixed | Item-role: key | Scale: local | Genre-feel: neutral
  // Shape: trial-to-pass
  'To join the {faction.bare}, you needed three things: {item}, a story worth telling, and the nerve to tell it {setting.placed|event.placed}. {Character1.emotional} had two of the three. {Weather}, the {role} who ran the test stood with arms crossed and a {tone} expression.\n\n{Character2} had already passed — seasons ago, easily, the way some people do. But {hook} had changed the rules since then, and the old test wasn\'t the test anymore. A {creature.bare} circled overhead. A {plant.bare} grew through a crack in the floor. All they wanted was {wish}. A tale about {moral.about}, and how belonging is earned in ways nobody expects.',

  // Template 175 — The Rival Factions
  // Voice: campfire | Opening: contrast | Temporal: linear | Dynamic: reluctant-partners | Agency: reactive
  // Arc: reversal | Tension: negotiation | Stakes: personal-loss | Connection: causal | Hook-role: catalyst
  // Moral: woven | Mystery: laid-out | Spotlight: faction
  // Structure: two-para | Rhythm: short-punchy | Item-role: trade | Scale: local | Genre-feel: fable
  // Shape: unlikely-friendship
  'The {faction.bare} said left. The other side said right. {Setting|event}, {weather}, and {character1.emotional} stood exactly in the middle, holding {item} that both sides wanted. The {role} on each side had excellent reasons. The reasons cancelled each other out.\n\n{Character2} — who belonged to neither and owed nothing to either — suggested a third direction. A {creature.bare} watched from a distance. The {plant.bare} between the two camps kept growing, ignoring borders. {Hook} was the reason for the fight. {Wish} was the reason to stop. A {tone} story about {moral.about}.',

  // Template 176 — The Defector
  // Voice: confessional | Opening: declarative | Temporal: linear | Dynamic: strangers | Agency: proactive
  // Arc: surprise-pivot | Tension: betrayal | Stakes: personal-loss | Connection: causal | Hook-role: catalyst
  // Moral: label | Mystery: question-based | Spotlight: faction
  // Structure: two-para | Rhythm: mixed | Item-role: clue | Scale: local | Genre-feel: neutral
  // Shape: escape
  '{Character1.emotional} had been part of the {faction.bare} long enough to know every secret and regret most of them. {Weather}, {setting|event} felt smaller than it used to. The {role} who\'d recruited them years ago would not understand what came next.\n\n{Character2} was waiting outside with {item} and a {plant.bare} that bloomed only in the dark — a signal, or a gift, or both. A {creature.bare} followed at a distance, loyal to neither side. {Hook} was the reason for leaving. {Wish} was the reason for going forward. A {tone} tale about {moral.about}, and the courage it takes to walk away from what you know.',

  // Template 177 — The Faction's Secret
  // Voice: laconic | Opening: interrupted-routine | Temporal: linear | Dynamic: helper | Agency: reactive
  // Arc: steady-build | Tension: revelation | Stakes: belonging | Connection: causal | Hook-role: catalyst
  // Moral: label | Mystery: question-based | Spotlight: faction
  // Structure: two-para | Rhythm: short-punchy | Item-role: clue | Scale: local | Genre-feel: tall-tale
  // Shape: discovery
  'The {faction.bare} had a room nobody talked about. {Character1.emotional} found it by accident — behind the {plant.bare}, past the door that shouldn\'t have been unlocked, {setting.placed|event.placed}. {Weather}, the room was {tone} and full of {item.bare} and silence.\n\nThe {role} — {character2} — arrived too quickly for someone who didn\'t know the room existed. A {creature.bare} sat in the corner like it had been waiting. {Hook} was written on every wall. All they wanted was {wish}. A tale about {moral.about}, and the weight of what organizations choose to hide.',

  // Template 178 — The Peace Summit
  // Voice: direct-address | Opening: catalog | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: calm | Tension: negotiation | Stakes: belonging | Connection: coincidence | Hook-role: background
  // Moral: woven | Mystery: laid-out | Spotlight: setting
  // Structure: two-para | Rhythm: flowing | Item-role: gift | Scale: intimate | Genre-feel: fable
  // Shape: build-together
  '{Setting|event}. {Weather}. A table. Two chairs. {Item} placed exactly in the center — a gesture, not a gift. {Character1.emotional} sat on one side, representing the {faction.bare}. {Character2}, the {role}, sat on the other side, representing everyone else.\n\nA {creature.bare} wandered between the chairs, unaware of politics. A {plant.bare} on the windowsill grew toward whatever light it could find. {Hook} was the history. {Wish} was the hope. The summit was {tone} and long and exactly as awkward as peace always is. A story about {moral.about}, negotiated one word at a time.',
];
