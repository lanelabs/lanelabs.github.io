// Story templates — each is a plain string with {placeholder} slots.
//
// See template_engine/placeholders.md for full placeholder reference.
// See template_engine/dimensions.md for dimension tag definitions.
//
// Each template's comment block lists its dimension tags so you can
// scan for coverage gaps at a glance.

export const templates = [
  // Template 1 — Setting opens
  // Voice: classic | Opening: declarative | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: steady-build | Tension: discovery | Stakes: implied | Connection: discovery | Hook-role: central
  // Moral: label | Mystery: laid-out | Spotlight: setting
  // Structure: two-para | Rhythm: flowing | Item-role: key | Scale: neutral | Genre-feel: neutral
  'In {setting} {weather}, {character1.emotional} and {character2} are drawn together. What begins as {opening} leads them into {hook}.\n\nWith {item}, their {storyShape.bare} unfolds — {aTone} tale about {moral.about}.',

  // Template 2 — Character opens
  // Voice: classic | Opening: declarative | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: surprise-pivot | Tension: discovery | Stakes: implied | Connection: discovery | Hook-role: surprise-twist
  // Moral: label | Mystery: laid-out | Spotlight: character-emotional
  // Structure: two-para | Rhythm: flowing | Item-role: key | Scale: neutral | Genre-feel: neutral
  '{Character1.emotional} and {character2} cross paths in {setting}. What begins as {opening} takes a turn when they stumble into {hook}.\n\n{Weather}, {item} points the way toward {storyShape} — {aTone} tale about {moral.about}.',

  // Template 3 — Atmosphere opens
  // Voice: classic | Opening: declarative | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: steady-build | Tension: discovery | Stakes: implied | Connection: discovery | Hook-role: central
  // Moral: label | Mystery: teaser | Spotlight: weather
  // Structure: two-para | Rhythm: flowing | Item-role: key | Scale: neutral | Genre-feel: neutral
  '{Weather}, {setting} holds a secret — {hook}. {Character1.emotional} and {character2} are both drawn in, and what starts as {opening} leads somewhere neither of them expected.\n\nWith {item}, their {storyShape.bare} unfolds — {aTone} story about {moral.about}.',

  // Template 4 — Hook-first
  // Voice: classic | Opening: declarative | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: steady-build | Tension: discovery | Stakes: implied | Connection: coincidence | Hook-role: central
  // Moral: label | Mystery: laid-out | Spotlight: hook
  // Structure: two-para | Rhythm: mixed | Item-role: key | Scale: neutral | Genre-feel: neutral
  '{Hook} — that\'s what brings {character1} and {character2.emotional} together in {setting}. It all begins with {opening}, and neither of them knows where it will lead.\n\n{Weather}, {item} holds the key to {storyShape} — a story of {tone.noun} and {moral.about}.',

  // Template 5 — Weather-adjective setting
  // Voice: classic | Opening: declarative | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: surprise-pivot | Tension: discovery | Stakes: implied | Connection: discovery | Hook-role: surprise-twist
  // Moral: label | Mystery: laid-out | Spotlight: weather-adj
  // Structure: two-para | Rhythm: flowing | Item-role: key | Scale: neutral | Genre-feel: neutral
  '{AWeatherAdj} {setting.bare} is where {character1} first meets {character2.emotional}. What begins as {opening} takes an unexpected turn — {hook}.\n\n{Item} holds the key, and before long their {storyShape.bare} is underway. A {tone} tale that reminds us: {Moral}.',

  // Template 6 — Hook draws them in
  // Voice: classic | Opening: declarative | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: steady-build | Tension: discovery | Stakes: implied | Connection: discovery | Hook-role: catalyst
  // Moral: label | Mystery: laid-out | Spotlight: hook
  // Structure: two-para | Rhythm: flowing | Item-role: catalyst | Scale: neutral | Genre-feel: neutral
  'In {setting}, {character1.emotional} and {character2} stumble into {hook}. It starts with {opening}, but things quickly grow more complicated.\n\n{Weather}, {item} changes everything — turning their path into {storyShape}. It\'s {aTone} tale about {moral.about}.',

  // Template 7 — Both characters meet
  // Voice: classic | Opening: declarative | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: steady-build | Tension: discovery | Stakes: implied | Connection: collision | Hook-role: catalyst
  // Moral: label | Mystery: laid-out | Spotlight: character-both
  // Structure: two-para | Rhythm: mixed | Item-role: key | Scale: neutral | Genre-feel: neutral
  '{Character1} and {character2.emotional} meet in {setting}. What starts as {opening} brings them face to face with {hook}.\n\n{Weather}, {item} becomes their only hope. What once seemed simple turns into {storyShape} — a {tone} story about {moral.about}.',

  // Template 8 — Legend frame, believer vs. skeptic
  // Voice: legend | Opening: everyone-knows | Temporal: linear | Dynamic: believer-skeptic | Agency: reactive
  // Arc: steady-build | Tension: forbidden | Stakes: trust | Connection: prophecy | Hook-role: looming-threat
  // Moral: label | Mystery: teaser | Spotlight: hook
  // Structure: two-para | Rhythm: flowing | Item-role: catalyst | Scale: local | Genre-feel: campfire-legend
  'They say that in {setting}, {weather}, {hook} happens once a generation. {Character1.emotional} believes it. {Character2} thinks it\'s nonsense.\n\nBut when {item} appears during {opening}, their {storyShape.bare} begins whether they\'re ready or not — {aTone} story about {moral.about}.',

  // Template 9 — Reluctant hero
  // Voice: classic | Opening: declarative | Temporal: linear | Dynamic: reluctant-partners | Agency: reluctant
  // Arc: dark-to-light | Tension: mismatch | Stakes: trust | Connection: causal | Hook-role: central
  // Moral: label | Mystery: laid-out | Spotlight: character-emotional
  // Structure: two-para | Rhythm: mixed | Item-role: key | Scale: neutral | Genre-feel: neutral
  '{Character1.emotional} wants nothing to do with {hook}. But in {setting}, they\'re the only one who can help — and {character2} is counting on them.\n\n{Weather}, {item} might be the answer. What starts as {opening} becomes {storyShape} — {aTone} tale about {moral.about}.',

  // Template 10 — Rule to be broken
  // Voice: classic | Opening: rule-to-break | Temporal: linear | Dynamic: strangers | Agency: proactive
  // Arc: steady-build | Tension: forbidden | Stakes: personal-loss | Connection: causal | Hook-role: catalyst
  // Moral: woven | Mystery: laid-out | Spotlight: item
  // Structure: two-para | Rhythm: mixed | Item-role: catalyst | Scale: local | Genre-feel: neutral
  'The rule in {setting} was simple: never touch {item}. {Character1.emotional} wasn\'t good with rules.\n\nNow, {weather}, {character2} is involved too — and what started as {opening} has become {hook}. Their {storyShape.bare} won\'t be easy. A {tone} tale about {moral.about}.',

  // Template 11 — Direct address wind-down
  // Voice: direct-address | Opening: sensory | Temporal: end-first | Dynamic: strangers | Agency: passive
  // Arc: wind-down | Tension: discovery | Stakes: implied | Connection: assertion | Hook-role: past-event
  // Moral: woven | Mystery: laid-out | Spotlight: tone
  // Structure: wind-down | Rhythm: flowing | Item-role: comfort | Scale: intimate | Genre-feel: lullaby
  'If you\'d been in {setting} tonight, {weather}, you\'d have seen {character1.emotional} and {character2} catching their breath. What started as {opening} led to {hook} — but that\'s all over now.\n\n{Item} rests nearby. Their {storyShape.bare} can wait until morning. Tonight, it\'s just {aWeatherAdj} quiet, a {tone} feeling, and the comfort that comes from {moral.about}.',

  // Template 12 — Dialogue cold open, fragile alliance
  // Voice: campfire | Opening: dialogue-cold | Temporal: linear | Dynamic: fragile-alliance | Agency: compelled
  // Arc: dark-to-light | Tension: secret | Stakes: trust | Connection: causal | Hook-role: central
  // Moral: label | Mystery: teaser | Spotlight: hook
  // Structure: two-para | Rhythm: mixed | Item-role: key | Scale: local | Genre-feel: neutral
  '"I don\'t trust you." "Good — I don\'t trust you either." {Character1} and {character2.emotional} find themselves in {setting}, {weather}, forced together by {hook}.\n\n{Opening} gives way to something unexpected. With {item} between them, their {storyShape.bare} begins — {aTone} tale about {moral.about}.',
];
