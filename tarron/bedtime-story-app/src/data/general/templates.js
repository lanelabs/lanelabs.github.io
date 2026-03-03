// Story templates — each is a plain string with {placeholder} slots.
//
// See template_engine/placeholders.md for full placeholder reference.
// See template_engine/dimensions.md for dimension tag definitions.
//
// Each template's comment block lists its dimension tags so you can
// scan for coverage gaps at a glance.
//
// Story shapes are baked into each template's prose rather than being
// a separate random element. The Shape dimension documents what structural
// archetype the template embodies.

export const templates = [
  // Template 1 — Setting opens
  // Voice: classic | Opening: declarative | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: steady-build | Tension: discovery | Stakes: implied | Connection: discovery | Hook-role: central
  // Moral: label | Mystery: laid-out | Spotlight: setting
  // Structure: two-para | Rhythm: flowing | Item-role: key | Scale: neutral | Genre-feel: neutral
  // Shape: discovery
  'In {setting} {weather}, {character1.emotional} and {character2} are drawn together — and straight into {hook}.\n\nWith {item}, the discovery unfolds — {aTone} tale about {wish.bare} and {moral.about}.',

  // Template 2 — Character opens
  // Voice: classic | Opening: declarative | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: surprise-pivot | Tension: discovery | Stakes: implied | Connection: discovery | Hook-role: surprise-twist
  // Moral: label | Mystery: laid-out | Spotlight: character-emotional
  // Structure: two-para | Rhythm: flowing | Item-role: key | Scale: neutral | Genre-feel: neutral
  // Shape: unexpected-adventure
  '{Character1.emotional} and {character2} cross paths in {setting}. Neither expects much of it — until {hook.verb}.\n\n{Weather}, {item} points the way toward an adventure neither one planned — {aTone} tale about {wish.bare} and {moral.about}.',

  // Template 3 — Atmosphere opens
  // Voice: classic | Opening: declarative | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: steady-build | Tension: discovery | Stakes: implied | Connection: discovery | Hook-role: central
  // Moral: label | Mystery: teaser | Spotlight: weather
  // Structure: two-para | Rhythm: flowing | Item-role: key | Scale: neutral | Genre-feel: neutral
  // Shape: hidden-truth
  '{Weather}, {setting} holds a secret — {hook}. {Character1.emotional} and {character2} are both drawn in, and before long they\'re deeper than either one expected.\n\nWith {item}, the hidden truth starts to surface — {aTone} story about {wish.bare} and {moral.about}.',

  // Template 4 — Hook-first
  // Voice: classic | Opening: declarative | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: steady-build | Tension: discovery | Stakes: implied | Connection: coincidence | Hook-role: central
  // Moral: label | Mystery: laid-out | Spotlight: hook
  // Structure: two-para | Rhythm: mixed | Item-role: key | Scale: neutral | Genre-feel: neutral
  // Shape: quest
  '{Hook} — that\'s what brings {character1} and {character2.emotional} together in {setting}. At first, neither knows where it will lead.\n\n{Weather}, {item} holds the key to the quest ahead — a story of {tone.noun}, {wish.bare}, and {moral.about}.',

  // Template 5 — Weather-adjective setting
  // Voice: classic | Opening: declarative | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: surprise-pivot | Tension: discovery | Stakes: implied | Connection: discovery | Hook-role: surprise-twist
  // Moral: label | Mystery: laid-out | Spotlight: weather-adj
  // Structure: two-para | Rhythm: flowing | Item-role: key | Scale: neutral | Genre-feel: neutral
  // Shape: puzzle
  '{AWeatherAdj} {setting.bare} is where {character1} first meets {character2.emotional}. Everything seems ordinary enough — until {hook.verb}.\n\n{Item} holds the key, and before long the puzzle takes shape. A {tone} tale about {wish.bare} — one that reminds us: {Moral}.',

  // Template 6 — Hook draws them in
  // Voice: classic | Opening: declarative | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: steady-build | Tension: discovery | Stakes: implied | Connection: discovery | Hook-role: catalyst
  // Moral: label | Mystery: laid-out | Spotlight: hook
  // Structure: two-para | Rhythm: flowing | Item-role: catalyst | Scale: neutral | Genre-feel: neutral
  // Shape: transformation
  'In {setting}, {character1.emotional} and {character2} stumble into {hook}. At first it seems manageable — but things quickly grow more complicated.\n\n{Weather}, {item} changes everything — turning their path into something transforming. All they wanted was {wish}. It\'s {aTone} tale about {moral.about}.',

  // Template 7 — Both characters meet
  // Voice: classic | Opening: declarative | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: steady-build | Tension: discovery | Stakes: implied | Connection: collision | Hook-role: catalyst
  // Moral: label | Mystery: laid-out | Spotlight: character-both
  // Structure: two-para | Rhythm: mixed | Item-role: key | Scale: neutral | Genre-feel: neutral
  // Shape: rescue
  '{Character1} and {character2.emotional} meet in {setting}. It doesn\'t take long before they\'re face to face with {hook}.\n\n{Weather}, {item} becomes their only hope. What once seemed simple turns into a rescue — a {tone} story about {wish.bare} and {moral.about}.',

  // Template 8 — Legend frame, believer vs. skeptic
  // Voice: legend | Opening: everyone-knows | Temporal: linear | Dynamic: believer-skeptic | Agency: reactive
  // Arc: steady-build | Tension: forbidden | Stakes: trust | Connection: prophecy | Hook-role: looming-threat
  // Moral: label | Mystery: teaser | Spotlight: hook
  // Structure: two-para | Rhythm: flowing | Item-role: catalyst | Scale: local | Genre-feel: campfire-legend
  // Shape: curse-to-break
  'They say that in {setting}, {weather}, every generation faces {hook}. {Character1.emotional} believes it. {Character2} thinks it\'s nonsense.\n\nBut when {item} appears out of nowhere, the curse stirs whether they\'re ready or not — {aTone} story about {wish.bare} and {moral.about}.',

  // Template 9 — Reluctant hero
  // Voice: classic | Opening: declarative | Temporal: linear | Dynamic: reluctant-partners | Agency: reluctant
  // Arc: dark-to-light | Tension: mismatch | Stakes: trust | Connection: causal | Hook-role: central
  // Moral: label | Mystery: laid-out | Spotlight: character-emotional
  // Structure: two-para | Rhythm: mixed | Item-role: key | Scale: neutral | Genre-feel: neutral
  // Shape: fear-to-overcome
  '{Character1.emotional} wants nothing to do with {hook}. But in {setting}, they\'re the only one who can help — and {character2} is counting on them.\n\n{Weather}, {item} might be the answer. One step at a time, reluctance gives way — because what they really want is {wish}. A {tone} tale about {moral.about}.',

  // Template 10 — Rule to be broken
  // Voice: classic | Opening: rule-to-break | Temporal: linear | Dynamic: strangers | Agency: proactive
  // Arc: steady-build | Tension: forbidden | Stakes: personal-loss | Connection: causal | Hook-role: catalyst
  // Moral: woven | Mystery: laid-out | Spotlight: item
  // Structure: two-para | Rhythm: mixed | Item-role: catalyst | Scale: local | Genre-feel: neutral
  // Shape: dare-to-accept
  'The rule in {setting} was simple: never touch {item}. {Character1.emotional} wasn\'t good with rules.\n\nNow, {weather}, {character2} is involved too — and what started as one broken rule has led straight to {hook}. A dare accepted, a line crossed — all because they wanted {wish}. A {tone} tale about {moral.about}.',

  // Template 11 — Direct address wind-down
  // Voice: direct-address | Opening: sensory | Temporal: end-first | Dynamic: strangers | Agency: passive
  // Arc: wind-down | Tension: discovery | Stakes: implied | Connection: assertion | Hook-role: past-event
  // Moral: woven | Mystery: laid-out | Spotlight: tone
  // Structure: wind-down | Rhythm: flowing | Item-role: comfort | Scale: intimate | Genre-feel: lullaby
  // Shape: precious-to-protect
  'If you\'d been in {setting} tonight, {weather}, you\'d have seen {character1.emotional} and {character2} catching their breath. It\'s been quite a night — {hook} saw to that.\n\n{Item} rests nearby, precious and protected. The rest can wait until morning. Tonight, it\'s just {aWeatherAdj} quiet, a {tone} feeling, and the comfort that comes from {wish.bare} and {moral.about}.',

  // Template 12 — Dialogue cold open, fragile alliance
  // Voice: campfire | Opening: dialogue-cold | Temporal: linear | Dynamic: fragile-alliance | Agency: compelled
  // Arc: dark-to-light | Tension: secret | Stakes: trust | Connection: causal | Hook-role: central
  // Moral: label | Mystery: teaser | Spotlight: hook
  // Structure: two-para | Rhythm: mixed | Item-role: key | Scale: local | Genre-feel: neutral
  // Shape: trust-to-earn
  '"I don\'t trust you." "Good — I don\'t trust you either." {Character1} and {character2.emotional} find themselves in {setting}, {weather}, forced together by {hook}.\n\nDistrust gives way to something unexpected. With {item} between them, trust must be earned — {aTone} tale about {wish.bare} and {moral.about}.',

  // Template 13 — Warning that isn't
  // Voice: warning | Opening: contrast | Temporal: linear | Dynamic: helper | Agency: reactive
  // Arc: dark-to-light | Tension: promise | Stakes: identity | Connection: contradictory | Hook-role: reframed
  // Moral: tested | Mystery: teaser | Spotlight: tone
  // Structure: two-para | Rhythm: mixed | Item-role: gift | Scale: local | Genre-feel: anti-fairy-tale
  // Shape: test-of-courage
  'This is not a gentle story. This is {aWeatherAdj} night in {setting}, where {character1.emotional} has just stumbled into {hook} — and nothing about it is simple.\n\nBut here\'s the thing: {character2} shows up anyway, carrying {item} like it matters. And it does. What felt impossible becomes a test of courage, full of {tone.noun}, where {wish.bare} and {moral.about} are tested with every step.',

  // Template 14 — "But" Pivot
  // Voice: classic | Opening: declarative | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: surprise-pivot | Tension: discovery | Stakes: implied | Connection: causal | Hook-role: catalyst
  // Moral: label | Mystery: laid-out | Spotlight: character-plain
  // Structure: hook-plus-para | Rhythm: long-then-short | Item-role: key | Scale: neutral | Genre-feel: neutral
  // Shape: fresh-start
  '{Character1} had a perfectly ordinary life in {setting}. But {hook.verb}.\n\n{Weather}, {character2.emotional} arrives with {item} — and nothing is ordinary anymore. What began as a single twist becomes a fresh start — {aTone} tale about {wish.bare} and {moral.about}.',

  // Template 15 — Question Hook
  // Voice: rhetorical | Opening: question-hook | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: surprise-pivot | Tension: question | Stakes: implied | Connection: discovery | Hook-role: reframed
  // Moral: label | Mystery: question-based | Spotlight: hook
  // Structure: two-para | Rhythm: mixed | Item-role: key | Scale: neutral | Genre-feel: neutral
  // Shape: gift-to-give
  'What happens when {hook} isn\'t a problem — but a gift? In {setting}, {weather}, {character1.emotional} is about to find out.\n\n{Character2} wasn\'t part of the plan. Neither was {item}. But together, they discover that the real gift is {wish.bare} — {aTone} story about {moral.about}.',

  // Template 16 — Catalog of Wonders
  // Voice: instructional | Opening: catalog | Temporal: linear | Dynamic: strangers | Agency: reactive
  // Arc: steady-build | Tension: discovery | Stakes: implied | Connection: discovery | Hook-role: central
  // Moral: label | Mystery: teaser | Spotlight: item
  // Structure: list-like | Rhythm: fragmented | Item-role: catalyst | Scale: neutral | Genre-feel: neutral
  // Shape: rise-from-nothing
  '{Item}. {Setting.bare}. {Weather}. And in the middle of it all, {character1.emotional}.\n\nIf you\'ve never seen {hook} up close, here\'s what you need to know: it changes everything. {Character2} can tell you that much. The rise has only just begun — a {tone} tale about {wish.bare} and {moral.about}.',

  // Template 17 — Unlikely Hero
  // Voice: laconic | Opening: impossible-image | Temporal: linear | Dynamic: reluctant-partners | Agency: reluctant
  // Arc: steady-build | Tension: mismatch | Stakes: implied | Connection: causal | Hook-role: central
  // Moral: label | Mystery: laid-out | Spotlight: character-emotional
  // Structure: single-turn | Rhythm: short-punchy | Item-role: key | Scale: neutral | Genre-feel: tall-tale
  // Shape: unlikely-friendship
  '{Weather}, the {setting.bare} turned upside down — not figuratively. {Character1.emotional} barely blinked. {Character2} had questions. {Hook} was only the beginning, and {item} didn\'t exactly help at first. But their unlikely friendship worked out, eventually — a {tone} story about {wish.bare} and {moral.about}.',

  // Template 18 — Fairy-Tale Subversion
  // Voice: classic | Opening: contrast | Temporal: linear | Dynamic: helper | Agency: proactive
  // Arc: surprise-pivot | Tension: mismatch | Stakes: identity | Connection: contradictory | Hook-role: catalyst
  // Moral: label | Mystery: laid-out | Spotlight: character-both
  // Structure: two-para | Rhythm: mixed | Item-role: key | Scale: neutral | Genre-feel: anti-fairy-tale
  // Shape: mistaken-identity
  'Once upon a time, {character1} rescued {character2.emotional}. Actually, it was the other way around. In {setting}, {weather}, things are rarely what they seem.\n\n{Hook} brought them together, and {item} kept them going. Nothing about it was ordinary — {aTone} tale of mistaken identity, {wish.bare}, and {moral.about}.',

  // Template 19 — "What If" Premise
  // Voice: confessional | Opening: question-hook | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: steady-build | Tension: question | Stakes: implied | Connection: discovery | Hook-role: central
  // Moral: label | Mystery: question-based | Spotlight: hook
  // Structure: two-para | Rhythm: flowing | Item-role: catalyst | Scale: neutral | Genre-feel: neutral
  // Shape: secret-to-keep
  'I keep wondering — what if {hook} only showed up in {setting}? What if {character1.emotional} was the only one who noticed? {Weather}, it seems like the kind of question you\'re not supposed to ask.\n\nBut {character2} noticed too. And {item} makes the secret impossible to ignore. All they wanted was {wish} — a {tone} story about {moral.about}.',

  // Template 20 — Snowball Effect
  // Voice: classic | Opening: sensory | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: steady-build | Tension: discovery | Stakes: implied | Connection: causal | Hook-role: catalyst
  // Moral: label | Mystery: laid-out | Spotlight: weather
  // Structure: two-para | Rhythm: mixed | Item-role: catalyst | Scale: expanding | Genre-feel: neutral
  // Shape: race-against-time
  'It started with a sound — {weather} — rolling across {setting}. {Character1.emotional} heard it first. Then came {hook}, and after that, nothing was small anymore.\n\n{Character2} got pulled in next. Then {item} appeared, and the race picked up speed. All they wanted was {wish}. A {tone} tale about {moral.about}, told one consequence at a time.',

  // Template 21 — Withholding Blurb
  // Voice: bedtime-whisper | Opening: sensory | Temporal: linear | Dynamic: secret-between | Agency: passive
  // Arc: steady-build | Tension: secret | Stakes: trust | Connection: assertion | Hook-role: past-event
  // Moral: label | Mystery: withhold-hook | Spotlight: setting
  // Structure: two-para | Rhythm: flowing | Item-role: symbol | Scale: intimate | Genre-feel: ghost-story
  // Shape: stranger-in-need
  'Something is wrong in {setting}. You can feel it — {weather}, the air itself seems to hold its breath. {Character1.emotional} knows it. {Character2} knows it. Neither will say what.\n\n{Item} sits between them, waiting. {Hook} set all of this in motion. Now the stranger\'s need unfolds in the hush — {aTone}, quiet story about {wish.bare} and {moral.about}.',

  // Template 22 — Kishotenketsu
  // Voice: direct-address | Opening: declarative | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: calm | Tension: discovery | Stakes: implied | Connection: symbolic | Hook-role: background
  // Moral: woven | Mystery: laid-out | Spotlight: character-both
  // Structure: wind-down | Rhythm: flowing | Item-role: comfort | Scale: intimate | Genre-feel: lullaby
  // Shape: lesson-to-learn
  'Imagine {character1.emotional} and {character2} in {setting}, {weather}. Nothing goes wrong. Nothing at all. But something shifts — and afterward, nothing looks quite the same.\n\n{Hook} isn\'t a crisis here. It\'s just part of the landscape, like {item}. The lesson is a {tone} kind of journey — the kind where {wish.bare} and {moral.about} matter more than anything that happened.',

  // Template 23 — Voyage and Return
  // Voice: campfire | Opening: contrast | Temporal: linear | Dynamic: reluctant-partners | Agency: proactive
  // Arc: man-in-hole | Tension: discovery | Stakes: personal-loss | Connection: causal | Hook-role: central
  // Moral: label | Mystery: laid-out | Spotlight: character-emotional
  // Structure: two-para | Rhythm: mixed | Item-role: key | Scale: local | Genre-feel: adventure-serial
  // Shape: journey-home
  'Let me tell you about the time the {character1.emotional.bare} left {setting}. Last time, it didn\'t go well. This time — {weather}, with {hook} hanging over everything — would be different.\n\n{Character2} came along, carrying {item}. The journey out was wild. The journey home was wilder — full of the kind of {tone.noun} that only comes from {wish.bare} and {moral.about}.',

  // Template 24 — Rebirth
  // Voice: legend | Opening: scalar-shift | Temporal: linear | Dynamic: helper | Agency: reactive
  // Arc: dark-to-light | Tension: scarcity | Stakes: identity | Connection: prophecy | Hook-role: looming-threat
  // Moral: label | Mystery: teaser | Spotlight: character-emotional
  // Structure: hook-plus-para | Rhythm: long-then-short | Item-role: gift | Scale: epic | Genre-feel: myth
  // Shape: overcoming-threat
  '{Character1.emotional} has been trapped by {hook} for as long as anyone can remember.\n\nBut far off, {weather}, something stirs. {Character2} arrives in {setting} with {item} — small and strange and just enough. What starts vast and dark narrows to one thing: {wish.bare}. A {tone} legend about {moral.about}.',

  // Template 25 — Circular / Before & After
  // Voice: direct-address | Opening: contrast | Temporal: circular | Dynamic: strangers | Agency: proactive
  // Arc: peak-resolve | Tension: discovery | Stakes: belonging | Connection: causal | Hook-role: central
  // Moral: label | Mystery: laid-out | Spotlight: setting
  // Structure: bookend | Rhythm: rhythmic | Item-role: key | Scale: local | Genre-feel: neutral
  // Shape: search-for-lost
  'It begins in {setting}. Remember that.\n\n{Weather}, {character1.emotional} and {character2} set out because of {hook}. With {item} between them and a long way to go, the search is {aTone} tale about {wish.bare} and {moral.about}.\n\nIt ends in {setting}, too. But nothing looks the same.',

  // Template 26 — Man in Hole + Monster
  // Voice: in-medias-res | Opening: interrupted-routine | Temporal: middle-first | Dynamic: protector-ward | Agency: reactive
  // Arc: man-in-hole | Tension: pursuit | Stakes: personal-loss | Connection: causal | Hook-role: central
  // Moral: label | Mystery: laid-out | Spotlight: weather
  // Structure: two-para | Rhythm: short-punchy | Item-role: key | Scale: local | Genre-feel: adventure-serial
  // Shape: daring-escape
  'They were already running when {weather} hit. The quiet morning in {setting} — gone. {Hook} made sure of that. {Character1.emotional} pulled {character2} along without a word.\n\nThings got worse before they got better. But {item} changed everything, and the escape clawed its way up from the dark. All they wanted was {wish}. A {tone} tale about {moral.about}.',

  // Template 27 — Everyone Knows
  // Voice: campfire | Opening: everyone-knows | Temporal: linear | Dynamic: believer-skeptic | Agency: reactive
  // Arc: surprise-pivot | Tension: secret | Stakes: trust | Connection: contradictory | Hook-role: reframed
  // Moral: label | Mystery: teaser | Spotlight: hook
  // Structure: dialogue | Rhythm: mixed | Item-role: catalyst | Scale: local | Genre-feel: campfire-legend
  // Shape: stand-against-bully
  '"Everyone knows about {hook}," said {character1}. "Everyone." {Character2.emotional} said nothing. {Weather}, in {setting}, some things are better left alone.\n\nBut {item} has other ideas. And what everyone knows turns out to be wrong. The stand begins the moment the truth comes out — {aTone} tale about {wish.bare} and {moral.about}.',

  // Template 28 — Interrupted Routine
  // Voice: laconic | Opening: interrupted-routine | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: surprise-pivot | Tension: mismatch | Stakes: implied | Connection: coincidence | Hook-role: catalyst
  // Moral: label | Mystery: laid-out | Spotlight: character-plain
  // Structure: two-para | Rhythm: short-punchy | Item-role: key | Scale: neutral | Genre-feel: neutral
  // Shape: competition
  'Every day, {character1} did the same thing in {setting}. Same routine, same view, same quiet. Then {character2.emotional} showed up, {weather}, and that was the end of that.\n\nThen there was {hook}, which was inconvenient. {Item} helped, though not in the way anyone expected. The competition was {tone}, mostly — driven by {wish.bare} and something to do with {moral.about}.',

  // Template 29 — Impossible Image + Mismatch
  // Voice: warning | Opening: impossible-image | Temporal: linear | Dynamic: strangers | Agency: reactive
  // Arc: steady-build | Tension: mismatch | Stakes: implied | Connection: contradictory | Hook-role: central
  // Moral: label | Mystery: laid-out | Spotlight: setting
  // Structure: single-turn | Rhythm: short-punchy | Item-role: catalyst | Scale: local | Genre-feel: tall-tale
  // Shape: wild-thing-to-tame
  'I should warn you — {weather}, the {setting.bare} turned upside down. Not figuratively. {Character1.emotional} and {character2} were standing right there when it happened. {Hook} was somehow the least strange part. {Item} started glowing. The wild thing got very {tone} very quickly — all because of {wish.bare} and {moral.about}.',

  // Template 30 — Scalar Shift / Whispered Zoom
  // Voice: bedtime-whisper | Opening: scalar-shift | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: wind-down | Tension: discovery | Stakes: implied | Connection: symbolic | Hook-role: past-event
  // Moral: label | Mystery: laid-out | Spotlight: setting
  // Structure: bookend | Rhythm: rhythmic | Item-role: comfort | Scale: contracting | Genre-feel: lullaby
  // Shape: build-together
  'Somewhere out past {setting}, {weather}, the sky stretches on and on and on.\n\nBut down below — much closer — the {character1.emotional.bare} and the {character2.bare} sit with {item} between them. {Hook} feels far away now. The project is almost done — a {tone} story about {wish.bare} and {moral.about}.\n\nThe sky stretches on. And everything underneath it rests.',

  // Template 31 — Sensory + Seasonal
  // Voice: legend | Opening: sensory | Temporal: circular | Dynamic: strangers | Agency: passive
  // Arc: wind-down | Tension: discovery | Stakes: belonging | Connection: inheritance | Hook-role: background
  // Moral: woven | Mystery: laid-out | Spotlight: weather
  // Structure: wind-down | Rhythm: flowing | Item-role: symbol | Scale: local | Genre-feel: myth
  // Shape: reunion
  'The sound came first — {weather}. Then the smell of {setting.bare}, the kind that only comes once a year. They say the {character1.emotional.bare} and the {character2.bare} both knew what it meant.\n\nAnd with the season came {hook}. {Item} appeared where it always does. The reunion unfolded slowly, full of {tone.noun}, winding down to where it always ends — with {wish.bare} and {moral.about}.',

  // Template 32 — False Start
  // Voice: confessional | Opening: false-start | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: surprise-pivot | Tension: question | Stakes: identity | Connection: causal | Hook-role: catalyst
  // Moral: label | Mystery: teaser | Spotlight: character-both
  // Structure: three-beat | Rhythm: mixed | Item-role: catalyst | Scale: neutral | Genre-feel: neutral
  // Shape: mistake-to-fix
  'This is a story about {character1}. Actually, no. This is really about {character2.emotional} and how everything changed.\n\n{Weather}, in {setting}, {hook} set things in motion. Nobody planned it. {Item} showed up at the worst possible time.\n\nAnd yet — the mistake turned into something worth making right. A {tone} story, in the end, about {wish.bare} and {moral.about}.',

  // Template 33 — Origin Myth
  // Voice: legend | Opening: declarative | Temporal: flashback | Dynamic: seeker | Agency: proactive
  // Arc: steady-build | Tension: discovery | Stakes: scarcity | Connection: inheritance | Hook-role: central
  // Moral: label | Mystery: teaser | Spotlight: item
  // Structure: bookend | Rhythm: rhythmic | Item-role: last | Scale: epic | Genre-feel: myth
  // Shape: message-to-deliver
  'Before anyone lived in {setting}, there was {item}. That\'s how the old stories begin.\n\n{Weather}, {character1.emotional} and {character2} found it — buried, waiting, still warm. {Hook} was only the first sign of what it meant. The message inside is {aTone} tale about {wish.bare} and {moral.about}.\n\nAnd the {item.bare} is still there. It was there first. It will be there last.',

  // Template 34 — Impossible Choice
  // Voice: rhetorical | Opening: contrast | Temporal: linear | Dynamic: strangers | Agency: compelled
  // Arc: peak-resolve | Tension: impossible-choice | Stakes: promise | Connection: causal | Hook-role: central
  // Moral: label | Mystery: question-based | Spotlight: character-emotional
  // Structure: two-para | Rhythm: mixed | Item-role: burden | Scale: local | Genre-feel: neutral
  // Shape: promise-to-keep
  'What would you do? In {setting}, {weather}, {character1.emotional} faces {hook}. Help {character2}, or protect what they have. They can\'t do both.\n\n{Item} makes the choice harder, not easier. But every promise demands a decision. This one is {tone} — and it comes down to {wish.bare} and {moral.about}.',

  // Template 35 — Ticking Clock
  // Voice: in-medias-res | Opening: scalar-shift | Temporal: countdown | Dynamic: strangers | Agency: reactive
  // Arc: steady-build | Tension: ticking-clock | Stakes: missed-moment | Connection: causal | Hook-role: looming-threat
  // Moral: label | Mystery: teaser | Spotlight: setting
  // Structure: two-para | Rhythm: short-punchy | Item-role: key | Scale: expanding | Genre-feel: adventure-serial
  // Shape: big-event
  '{Weather}, something is changing in {setting}. You can feel it — vast and slow and getting faster. {Character1.emotional} doesn\'t have long.\n\n{Hook} is already here. {Character2} is already moving. {Item} might be enough — if they reach it in time. The big event is running out of room. All they want is {wish}. A {tone} tale about {moral.about}, told against the clock.',

  // Template 36 — Secret + Emotional Wound
  // Voice: confessional | Opening: contrast | Temporal: flashback | Dynamic: secret-between | Agency: reluctant
  // Arc: dark-to-light | Tension: secret | Stakes: identity | Connection: causal | Hook-role: past-event
  // Moral: woven | Mystery: withhold-hook | Spotlight: character-emotional
  // Structure: three-beat | Rhythm: mixed | Item-role: clue | Scale: internal | Genre-feel: neutral
  // Shape: high-stakes-bet
  'There\'s something I should tell you first. {Character1.emotional} has been carrying this a long time — since before {setting}, since before {weather} meant anything.\n\n{Hook} brought it all back. What was hidden is now impossible to ignore. {Character2} sees it. {Item} confirms it.\n\nBut here\'s what makes it {aTone} story: the stakes aren\'t about the secret. They\'re about {wish.bare} and {moral.about}.',

  // Template 37 — Scarcity + The Promise
  // Voice: legend | Opening: rule-to-break | Temporal: linear | Dynamic: protector-ward | Agency: compelled
  // Arc: peak-resolve | Tension: scarcity | Stakes: promise | Connection: causal | Hook-role: catalyst
  // Moral: tested | Mystery: teaser | Spotlight: item
  // Structure: two-para | Rhythm: mixed | Item-role: last | Scale: local | Genre-feel: fable
  // Shape: trade
  'The rule was simple: never use the last one. In {setting}, {weather}, {item} was all that remained — and {character1.emotional} had sworn to protect it.\n\nBut {hook} changes the math. {Character2} needs help, and the cost of keeping a promise might be higher than breaking it. The trade is {aTone} legend about {wish.bare} and {moral.about}.',

  // Template 38 — Voice as Hook
  // Voice: campfire | Opening: sensory | Temporal: linear | Dynamic: strangers | Agency: reactive
  // Arc: steady-build | Tension: discovery | Stakes: implied | Connection: coincidence | Hook-role: central
  // Moral: label | Mystery: laid-out | Spotlight: tone
  // Structure: three-beat | Rhythm: mixed | Item-role: key | Scale: local | Genre-feel: tall-tale
  // Shape: unexpected-adventure
  'Listen — this {character1.emotional.bare} didn\'t plan any of this. Nobody plans for {hook}. But here they are, in {setting}, {weather}, with nothing but {item} and a bad feeling.\n\n{Character2} showed up, which made things both better and worse. The smell of {setting.bare} after dark is something else, let me tell you.\n\nAnyway — the adventure is worth hearing. All they wanted was {wish}. A {tone} tale, all things considered, about {moral.about}.',
];
