// Adventure templates (139–148) — pirates, shipwrecks, expeditions, treasure.
//
// See template_engine/placeholders.md for full placeholder reference.
// See template_engine/dimensions.md for dimension tag definitions.

export const templates = [
  // Template 139 — The Pirate's Code
  // Voice: campfire | Opening: rule-to-break | Temporal: linear | Dynamic: fragile-alliance | Agency: proactive
  // Arc: surprise-pivot | Tension: forbidden | Stakes: trust | Connection: causal | Hook-role: central
  // Moral: tested | Mystery: teaser | Spotlight: character-both
  // Structure: two-para | Rhythm: short-punchy | Item-role: key | Scale: expanding | Genre-feel: adventure-serial
  // Shape: noble-thief
  'Rule one: split everything even. Rule two: never sail alone. Rule three — and this is the one that matters — never break rules one and two. {Character1.emotional} had followed the code in {setting|event} for years. {Character2}, the {role}, had followed it for longer.\n\n{Weather}, {hook} made the code impossible to keep. {Item} was worth too much. Trust is easy when there\'s nothing at stake. The real test is {tone}. All they wanted was {wish}. A tale about {moral.about}.',

  // Template 140 — Shipwreck Shore
  // Voice: in-medias-res | Opening: sensory | Temporal: middle-first | Dynamic: strangers | Agency: reactive
  // Arc: man-in-hole | Tension: scarcity | Stakes: personal-loss | Connection: coincidence | Hook-role: past-event
  // Moral: label | Mystery: laid-out | Spotlight: weather
  // Structure: two-para | Rhythm: mixed | Item-role: last | Scale: local | Genre-feel: adventure-serial
  // Shape: build-together
  'The first thing {character1.emotional} heard was {weather.noun}. The second was silence — the wrong kind, the kind that means everything you had is gone. {Setting|event} stretched out empty in every direction. {Item} had washed ashore. Nothing else had.\n\n{Character2} appeared on the third day — a {role} from somewhere else entirely, just as stranded. {Hook} was what sank them both. Now the only choice was to build something from the wreckage. A {tone} tale about {wish.bare} and {moral.about}, assembled from what was left.',

  // Template 141 — The Stowaway
  // Voice: laconic | Opening: interrupted-routine | Temporal: linear | Dynamic: reluctant-partners | Agency: passive
  // Arc: steady-build | Tension: secret | Stakes: belonging | Connection: coincidence | Hook-role: catalyst
  // Moral: label | Mystery: teaser | Spotlight: character-emotional
  // Structure: two-para | Rhythm: short-punchy | Item-role: comfort | Scale: expanding | Genre-feel: adventure-serial
  // Shape: unexpected-adventure
  '{Character1.emotional} wasn\'t supposed to be here. Tucked behind the cargo in {setting|event}, holding {item} and breathing very quietly, the plan had been simple: hide until the coast was clear. The plan did not account for {character2}.\n\n{Weather}, the {role} who ran the ship found them immediately. {Hook} meant throwing a stowaway overboard wasn\'t an option. The adventure that followed was {tone} and unplanned and better than the place they\'d left behind. All they wanted was {wish}. A tale about {moral.about}.',

  // Template 142 — The Map with Missing Pieces
  // Voice: direct-address | Opening: catalog | Temporal: linear | Dynamic: strangers | Agency: proactive
  // Arc: steady-build | Tension: discovery | Stakes: implied | Connection: discovery | Hook-role: central
  // Moral: label | Mystery: laid-out | Spotlight: item
  // Structure: two-para | Rhythm: fragmented | Item-role: clue | Scale: expanding | Genre-feel: adventure-serial
  // Shape: map-to-follow
  'Half a map. That\'s what {character1.emotional} started with — {item}, torn down the middle, faded at the edges, pointing toward {setting|event}. The other half? Somewhere else. With someone else. {Weather}, that someone turned out to be {character2}.\n\nThe {role} and the stranger had nothing in common except the same destination. {Hook} was marked with an X — the kind of X that means either treasure or trouble. A {tone} tale about {wish.bare} and {moral.about}, followed one landmark at a time.',

  // Template 143 — The Race to the Summit
  // Voice: rhetorical | Opening: scalar-shift | Temporal: countdown | Dynamic: rivals | Agency: compelled
  // Arc: peak-resolve | Tension: rivalry | Stakes: identity | Connection: collision | Hook-role: central
  // Moral: label | Mystery: laid-out | Spotlight: setting
  // Structure: two-para | Rhythm: mixed | Item-role: key | Scale: expanding | Genre-feel: adventure-serial
  // Shape: competition
  'How far would you climb to be first? {Setting|event} rose above everything else — {weather}, the peak was a rumor wrapped in cloud. {Character1.emotional} had trained for this. So had {character2}, the {role} from the other side of the mountain.\n\nThey started at the same time. {Hook} hit halfway up, and after that it wasn\'t about speed anymore. {Item} was the difference between making it and not. The summit was {tone}. The rivalry was harder. All they wanted was {wish}. A tale about {moral.about}.',

  // Template 144 — The Lost Expedition
  // Voice: legend | Opening: contrast | Temporal: flashback | Dynamic: seeker | Agency: proactive
  // Arc: steady-build | Tension: question | Stakes: scarcity | Connection: inheritance | Hook-role: past-event
  // Moral: label | Mystery: question-based | Spotlight: character-emotional
  // Structure: three-beat | Rhythm: flowing | Item-role: clue | Scale: expanding | Genre-feel: myth
  // Shape: search-for-lost
  'Fifty years ago, a {role} walked into {setting|event} and never came out. That was the story. {Character1.emotional} grew up hearing it. {Weather}, they decided to go looking.\n\n{Character2} said it was a waste of time — that {hook} had swallowed the expedition whole. But {item} turned up on the trail, fresh as yesterday, and that changed the argument.\n\nThe lost aren\'t always gone. Some are just waiting to be found. A {tone} tale about {wish.bare} and {moral.about}.',

  // Template 145 — The Message in the Bottle
  // Voice: confessional | Opening: sensory | Temporal: flashback | Dynamic: strangers | Agency: passive
  // Arc: dark-to-light | Tension: promise | Stakes: belonging | Connection: inheritance | Hook-role: past-event
  // Moral: woven | Mystery: teaser | Spotlight: item
  // Structure: two-para | Rhythm: flowing | Item-role: clue | Scale: expanding | Genre-feel: fable
  // Shape: message-to-deliver
  '{Item} washed up in {setting|event} the way promises do — slowly, after everyone had stopped watching. {Character1.emotional} found it {weather}, half-buried and warm from the sun. Inside was a message: {hook}, written in a hand they didn\'t recognize.\n\n{Character2}, the {role} who knew the handwriting, had been waiting for this — longer than they\'d ever admit. The message was {tone} and small and meant for exactly one person. All they wanted was {wish}. A story about {moral.about}, delivered by the sea.',

  // Template 146 — The Bridge Nobody Crosses
  // Voice: warning | Opening: declarative | Temporal: linear | Dynamic: believer-skeptic | Agency: reluctant
  // Arc: steady-build | Tension: forbidden | Stakes: trust | Connection: contradictory | Hook-role: central
  // Moral: label | Mystery: teaser | Spotlight: setting
  // Structure: two-para | Rhythm: mixed | Item-role: key | Scale: local | Genre-feel: campfire-legend
  // Shape: answering-the-call
  'The bridge in {setting|event} goes one way. Everyone knows that. {Weather}, {character1.emotional} stood at the near side, and {character2} stood at the far, and the {role} between them said what every bridge-keeper says: {hook}.\n\n{Item} was the toll — or the trick — or the test. Hard to know which until you\'re already crossing. The far side was {tone} and nothing like the stories. All they wanted was {wish}. A tale about {moral.about} — and how some bridges are only scary from the side you\'re standing on.',

  // Template 147 — The Compass That Points Wrong
  // Voice: laconic | Opening: contrast | Temporal: linear | Dynamic: reluctant-partners | Agency: proactive
  // Arc: surprise-pivot | Tension: mismatch | Stakes: implied | Connection: contradictory | Hook-role: reframed
  // Moral: label | Mystery: laid-out | Spotlight: item
  // Structure: two-para | Rhythm: short-punchy | Item-role: key | Scale: expanding | Genre-feel: tall-tale
  // Shape: quest
  '{Item} pointed south. Every compass in {setting|event} pointed north. {Character1.emotional} said it was broken. {Character2}, the {role}, said it was pointing at something else entirely.\n\n{Weather}, they followed it — south, then east, then directions that don\'t have names. {Hook} was at the end, but the end wasn\'t where maps say it should be. The quest was {tone} and sideways and exactly right. All they wanted was {wish}. A tale about {moral.about}.',

  // Template 148 — The Smuggler's Heart
  // Voice: campfire | Opening: dialogue-cold | Temporal: linear | Dynamic: former-enemies | Agency: compelled
  // Arc: dark-to-light | Tension: promise | Stakes: trust | Connection: causal | Hook-role: central
  // Moral: tested | Mystery: teaser | Spotlight: character-emotional
  // Structure: two-para | Rhythm: mixed | Item-role: burden | Scale: local | Genre-feel: adventure-serial
  // Shape: old-wounds
  '"Last time, you left me behind." "Last time, you deserved it." {Character1.emotional} and {character2} hadn\'t spoken since {hook.verb}. Now, in {setting|event}, {weather}, they needed each other again. The {role} who\'d put them together didn\'t care about history.\n\n{Item} was the cargo — too important to trust and too heavy to carry alone. The old wounds reopened with every mile. But some journeys are {tone} precisely because they hurt. All they wanted was {wish}. A tale about {moral.about}.',
];
