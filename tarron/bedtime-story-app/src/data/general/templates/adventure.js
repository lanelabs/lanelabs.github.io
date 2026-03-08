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
  'Rule one: split everything even. Rule two: never sail alone. Rule three — and this is the one that matters — never break rules one and two. {Character1.emotional} had followed the code {setting.placed|event.placed} for years. {Character2}, the {role}, had followed it for longer.\n\n{Weather}, {hook} made the code impossible to keep. {Item} was worth too much. Trust is easy when there\'s nothing at stake. The real test is {tone}. All they wanted was {wish}. A tale about {moral.about}.',

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
  '{Character1.emotional} wasn\'t supposed to be here. Tucked behind the cargo {setting.placed|event.placed}, holding {item} and breathing very quietly, the plan had been simple: hide until the coast was clear. The plan did not account for {character2}.\n\n{Weather}, the {role} who ran the ship found them immediately. {Hook} meant throwing a stowaway overboard wasn\'t an option. The adventure that followed was {tone} and unplanned and better than the place they\'d left behind. All they wanted was {wish}. A tale about {moral.about}.',

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
  '{Item} washed up {setting.placed|event.placed} the way promises do — slowly, after everyone had stopped watching. {Character1.emotional} found it {weather}, half-buried and warm from the sun. Inside was a message: {hook}, written in a hand they didn\'t recognize.\n\n{Character2}, the {role} who knew the handwriting, had been waiting for this — longer than they\'d ever admit. The message was {tone} and small and meant for exactly one person. All they wanted was {wish}. A story about {moral.about}, delivered by the sea.',

  // Template 146 — The Bridge Nobody Crosses
  // Voice: warning | Opening: declarative | Temporal: linear | Dynamic: believer-skeptic | Agency: reluctant
  // Arc: steady-build | Tension: forbidden | Stakes: trust | Connection: contradictory | Hook-role: central
  // Moral: label | Mystery: teaser | Spotlight: setting
  // Structure: two-para | Rhythm: mixed | Item-role: key | Scale: local | Genre-feel: campfire-legend
  // Shape: answering-the-call
  'The bridge {setting.placed|event.placed} goes one way. Everyone knows that. {Weather}, {character1.emotional} stood at the near side, and {character2} stood at the far, and the {role} between them said what every bridge-keeper says: {hook}.\n\n{Item} was the toll — or the trick — or the test. Hard to know which until you\'re already crossing. The far side was {tone} and nothing like the stories. All they wanted was {wish}. A tale about {moral.about} — and how some bridges are only scary from the side you\'re standing on.',

  // Template 147 — The Compass That Points Wrong
  // Voice: laconic | Opening: contrast | Temporal: linear | Dynamic: reluctant-partners | Agency: proactive
  // Arc: surprise-pivot | Tension: mismatch | Stakes: implied | Connection: contradictory | Hook-role: reframed
  // Moral: label | Mystery: laid-out | Spotlight: item
  // Structure: two-para | Rhythm: short-punchy | Item-role: key | Scale: expanding | Genre-feel: tall-tale
  // Shape: quest
  '{Item} pointed south. Every compass {setting.placed|event.placed} pointed north. {Character1.emotional} said it was broken. {Character2}, the {role}, said it was pointing at something else entirely.\n\n{Weather}, they followed it — south, then east, then directions that don\'t have names. {Hook} was at the end, but the end wasn\'t where maps say it should be. The quest was {tone} and sideways and exactly right. All they wanted was {wish}. A tale about {moral.about}.',

  // Template 148 — The Smuggler's Heart
  // Voice: campfire | Opening: dialogue-cold | Temporal: linear | Dynamic: former-enemies | Agency: compelled
  // Arc: dark-to-light | Tension: promise | Stakes: trust | Connection: causal | Hook-role: central
  // Moral: tested | Mystery: teaser | Spotlight: character-emotional
  // Structure: two-para | Rhythm: mixed | Item-role: burden | Scale: local | Genre-feel: adventure-serial
  // Shape: old-wounds
  '"Last time, you left me behind." "Last time, you deserved it." {Character1.emotional} and {character2} hadn\'t spoken since {hook.verb}. Now, {setting.placed|event.placed}, {weather}, they needed each other again. The {role} who\'d put them together didn\'t care about history.\n\n{Item} was the cargo — too important to trust and too heavy to carry alone. The old wounds reopened with every mile. But some journeys are {tone} precisely because they hurt. All they wanted was {wish}. A tale about {moral.about}.',

  // --- Book-inspired adventure templates (194–198) ---

  // Template 194 — The Crew You Can\'t Trust (Treasure Island)
  // Voice: in-medias-res | Opening: dialogue-cold | Temporal: linear | Dynamic: fragile-alliance | Agency: reactive
  // Arc: steady-build | Tension: secret | Stakes: trust | Connection: causal | Hook-role: central
  // Moral: tested | Mystery: teaser | Spotlight: character-emotional
  // Structure: two-para | Rhythm: short-punchy | Item-role: burden | Scale: expanding | Genre-feel: adventure-serial
  // Shape: trust-the-untrustworthy
  '"I don\'t trust them." "You don\'t have to trust them. You just have to sail with them." {Character1.emotional} gripped {item} and watched {character2} talking to the {role} at the helm. {Weather}, {setting|event} was already shrinking behind them. Too late to turn back.\n\n{Hook} was the reason for the voyage — but every member of the crew had a second reason, quieter and more personal. Loyalty was a word people used when they wanted something. All they wanted was {wish}. A {tone} tale about {moral.about}, and the difference between trusting someone and needing them.',

  // Template 195 — The Long Return (The Count of Monte Cristo)
  // Voice: legend | Opening: sensory | Temporal: flashback | Dynamic: reuniting | Agency: proactive
  // Arc: dark-to-light | Tension: question | Stakes: identity | Connection: inheritance | Hook-role: past-event
  // Moral: woven | Mystery: teaser | Spotlight: setting
  // Structure: two-para | Rhythm: flowing | Item-role: symbol | Scale: local | Genre-feel: campfire-legend
  // Shape: unrecognized-return
  '{Weather}, {setting|event} looked the same — the same doors, the same dust, the same light falling in the same places. But {character1.emotional} had been gone so long that "the same" felt like a foreign language. The {role} at the gate didn\'t recognize them. Nobody did.\n\n{Character2} was the last one they found — older, quieter, holding {item} the way people hold things they almost threw away. {Hook} was why they\'d left. Coming back was harder. All they wanted was {wish}. A {tone} tale about {moral.about}, and whether the person who returns is still the person who left.',

  // Template 196 — The Impossible Wager (Around the World in 80 Days)
  // Voice: laconic | Opening: declarative | Temporal: countdown | Dynamic: reluctant-partners | Agency: proactive
  // Arc: man-in-hole | Tension: ticking-clock | Stakes: promise | Connection: causal | Hook-role: catalyst
  // Moral: label | Mystery: laid-out | Spotlight: character-both
  // Structure: two-para | Rhythm: short-punchy | Item-role: key | Scale: expanding | Genre-feel: tall-tale
  // Shape: impossible-bet
  'The bet was simple: reach {setting|event} before {hook} catches up. The odds were ridiculous. {Character1.emotional} accepted anyway. {Character2}, the {role} who\'d made the wager, said that was either very brave or very foolish. Probably both.\n\n{Weather}, the journey was everything wrong: {item} broke, the path vanished, the plan fell apart three times before lunch. But stubbornness is its own kind of fuel. All they wanted was {wish}. A {tone} tale about {moral.about} — and the particular glory of attempting something everyone says can\'t be done.',

  // Template 197 — The Signal Fire (Robinson Crusoe)
  // Voice: direct-address | Opening: sensory | Temporal: linear | Dynamic: helper | Agency: compelled
  // Arc: dark-to-light | Tension: scarcity | Stakes: belonging | Connection: causal | Hook-role: background
  // Moral: woven | Mystery: laid-out | Spotlight: weather
  // Structure: two-para | Rhythm: mixed | Item-role: key | Scale: contracting | Genre-feel: neutral
  // Shape: signal-for-help
  '{Weather} — that was all there was. That, and {setting|event}, and {character1.emotional}, and the growing certainty that nobody was coming. The {role} they used to report to was somewhere beyond the horizon, unreachable. {Hook} was the reason they were here. {Item} was the only tool that still worked.\n\n{Character2} appeared on the third day — not a rescuer, just another stranded soul with different skills and the same problem. Together they built the signal: taller, brighter, more stubborn than the silence. All they wanted was {wish}. A {tone} tale about {moral.about}, and the hope that someone out there is looking.',

  // Template 198 — The River That Runs Backward (Journey to the Center of the Earth)
  // Voice: bedtime-whisper | Opening: impossible-image | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: surprise-pivot | Tension: discovery | Stakes: implied | Connection: discovery | Hook-role: background
  // Moral: implied | Mystery: question-based | Spotlight: setting
  // Structure: two-para | Rhythm: rhythmic | Item-role: clue | Scale: expanding | Genre-feel: myth
  // Shape: laws-bent
  'Past {setting|event}, the river ran backward. Not quickly — just enough to notice, just enough to make {character1.emotional} stop walking and stare. {Weather}, the shadows pointed the wrong way. The {creature.bare} in the trees sang at the wrong time of day. The {role} who\'d drawn the map hadn\'t mentioned any of this.\n\n{Character2} said it was fine. Everything was fine. {Item} still worked the same. {Hook} still mattered. But the deeper they went, the less the old rules applied — and the more {tone} and strange the world became. All they wanted was {wish}. A story about {moral.about}, told in a place where up is only a suggestion.',
];
