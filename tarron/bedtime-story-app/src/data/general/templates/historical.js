// Historical templates (159–168) — past eras, real-world adventure, age of sail.
//
// See template_engine/placeholders.md for full placeholder reference.
// See template_engine/dimensions.md for dimension tag definitions.

export const templates = [
  // Template 159 — The Great Library
  // Voice: legend | Opening: scalar-shift | Temporal: linear | Dynamic: mentor-student | Agency: proactive
  // Arc: steady-build | Tension: scarcity | Stakes: scarcity | Connection: inheritance | Hook-role: central
  // Moral: woven | Mystery: teaser | Spotlight: setting
  // Structure: two-para | Rhythm: flowing | Item-role: last | Scale: epic | Genre-feel: myth
  // Shape: precious-to-protect
  'They said the library in {setting|event} held every story ever told — floor after floor, shelf after shelf, {weather}, so vast that nobody had read it all. {Character1.emotional}, the youngest {role} in its history, was supposed to keep it safe. {Character2} was supposed to help.\n\nThen {hook} came. And {item} — the last copy of the one story that mattered most — had to be carried out before the shelves went dark. A {tone} tale about {wish.bare} and {moral.about}, written in the margins of everything that was almost lost.',

  // Template 160 — The Age of Sail
  // Voice: campfire | Opening: sensory | Temporal: linear | Dynamic: reluctant-partners | Agency: proactive
  // Arc: man-in-hole | Tension: pursuit | Stakes: personal-loss | Connection: causal | Hook-role: looming-threat
  // Moral: label | Mystery: laid-out | Spotlight: weather
  // Structure: two-para | Rhythm: mixed | Item-role: key | Scale: expanding | Genre-feel: adventure-serial
  // Shape: journey-home
  'The sails caught {weather.noun} and held it — straining, creaking, alive. {Setting|event} shrank to a dot behind them. {Character1.emotional} hadn\'t wanted to leave. {Character2}, the {role} at the helm, hadn\'t wanted a passenger.\n\nBut {hook} was behind them, and {item} was the only thing worth the crossing. The sea was {tone} — generous one hour, vicious the next. All they wanted was {wish}. A tale about {moral.about}, measured in knots and leagues and the slow curve of the horizon.',

  // Template 161 — The First Flight
  // Voice: rhetorical | Opening: question-hook | Temporal: linear | Dynamic: believer-skeptic | Agency: proactive
  // Arc: peak-resolve | Tension: mismatch | Stakes: identity | Connection: causal | Hook-role: central
  // Moral: label | Mystery: laid-out | Spotlight: character-emotional
  // Structure: two-para | Rhythm: mixed | Item-role: catalyst | Scale: expanding | Genre-feel: adventure-serial
  // Shape: dare-to-accept
  'What if it actually works? That was the question in {setting|event}, {weather}, where {character1.emotional} and {character2} stood beside {item} — held together with nothing but stubbornness and a little bit of math. The {role} in charge said it would never fly. Gravity said the same.\n\n{Hook} was the reason it had to. One chance. One gust. The dare was {tone} and enormous and over in seconds. But those seconds changed everything. All they wanted was {wish}. A tale about {moral.about}.',

  // Template 162 — The Medieval Fair
  // Voice: laconic | Opening: catalog | Temporal: linear | Dynamic: rivals | Agency: reactive
  // Arc: surprise-pivot | Tension: rivalry | Stakes: identity | Connection: collision | Hook-role: catalyst
  // Moral: label | Mystery: laid-out | Spotlight: character-both
  // Structure: two-para | Rhythm: fragmented | Item-role: key | Scale: local | Genre-feel: tall-tale
  // Shape: competition
  'Banners. Drums. Smoke from a dozen fires. {Setting|event}, {weather}, and the whole town packed in shoulder to shoulder. {Character1.emotional} was here to win. {Character2}, the {role} from the next village over, was here to win harder.\n\n{Hook} was the prize — or the provocation — depending on who you asked. {Item} was the edge. The competition was {tone} and petty and exactly the kind of day everyone would talk about forever. All they wanted was {wish}. A tale about {moral.about}.',

  // Template 163 — The Apprentice's Mistake
  // Voice: instructional | Opening: declarative | Temporal: linear | Dynamic: mentor-student | Agency: reluctant
  // Arc: dark-to-light | Tension: promise | Stakes: trust | Connection: causal | Hook-role: catalyst
  // Moral: frame | Mystery: laid-out | Spotlight: moral
  // Structure: two-para | Rhythm: mixed | Item-role: burden | Scale: local | Genre-feel: fable
  // Shape: passing-the-torch
  'This is a story about {moral.about} — and how {character1.emotional} learned it by getting it wrong. The apprentice\'s first job in {setting|event} was simple: protect {item}. The {role} — {character2} — said it twice. Maybe three times.\n\n{Weather}, {hook.verb}. The mistake was {tone} and immediate and impossible to undo. But here\'s what the best teachers know: the lesson lives in the fixing, not the failing. All they wanted was {wish}. And the {item.bare}, eventually, was passed from one hand to the next.',

  // Template 164 — The Ancient Map
  // Voice: confessional | Opening: sensory | Temporal: flashback | Dynamic: seeker | Agency: proactive
  // Arc: steady-build | Tension: question | Stakes: belonging | Connection: inheritance | Hook-role: past-event
  // Moral: label | Mystery: question-based | Spotlight: item
  // Structure: three-beat | Rhythm: flowing | Item-role: clue | Scale: expanding | Genre-feel: myth
  // Shape: search-for-lost
  'The ink was faded. The edges crumbled at the touch. But {item} — drawn by someone who\'d been to {setting|event} centuries ago — was real. {Character1.emotional} spread it out, {weather}, and traced the path with one finger.\n\n{Character2}, the {role} who\'d found it buried in a wall, said {hook} was the reason it had been hidden. Some places don\'t want to be found. Some stories don\'t want to be finished.\n\nBut the map was out now. And {wish} was stronger than any warning. A {tone} tale about {moral.about}.',

  // Template 165 — The Letter Never Sent
  // Voice: bedtime-whisper | Opening: contrast | Temporal: flashback | Dynamic: strangers | Agency: passive
  // Arc: wind-down | Tension: secret | Stakes: personal-loss | Connection: inheritance | Hook-role: past-event
  // Moral: woven | Mystery: withhold-hook | Spotlight: item
  // Structure: two-para | Rhythm: flowing | Item-role: symbol | Scale: intimate | Genre-feel: fable
  // Shape: unfinished-promise
  '{Item} was found behind a wall in {setting|event}, {weather} — sealed, addressed, never delivered. {Character1.emotional} opened it carefully. The words inside were {tone} and small and meant for someone who had probably stopped waiting a long time ago.\n\n{Character2}, the {role} who\'d been asked to help, said {hook} was the reason it had never been sent. But some messages find their way eventually. All they wanted was {wish}. A story about {moral.about}, delivered decades late and exactly on time.',

  // Template 166 — The Night Before the Battle
  // Voice: in-medias-res | Opening: contrast | Temporal: middle-first | Dynamic: fragile-alliance | Agency: compelled
  // Arc: light-to-dark | Tension: ticking-clock | Stakes: trust | Connection: causal | Hook-role: looming-threat
  // Moral: tested | Mystery: teaser | Spotlight: character-emotional
  // Structure: two-para | Rhythm: mixed | Item-role: symbol | Scale: local | Genre-feel: adventure-serial
  // Shape: borrowed-time
  'Tomorrow, everything changes. Tonight, {weather}, {setting|event} is almost peaceful. {Character1.emotional} sits with {item} — checking it, turning it over, putting it down, picking it up again. {Character2}, the {role} who\'s been through this before, says nothing.\n\n{Hook} waits on the other side of sunrise. Trust is easier in the dark, when tomorrow is still a rumor. The night was {tone}. All they wanted was {wish}. A tale about {moral.about}, told in the hours before the world shifts.',

  // Template 167 — The Forgotten Festival
  // Voice: legend | Opening: everyone-knows | Temporal: circular | Dynamic: strangers | Agency: passive
  // Arc: calm | Tension: discovery | Stakes: belonging | Connection: inheritance | Hook-role: background
  // Moral: woven | Mystery: laid-out | Spotlight: setting
  // Structure: bookend | Rhythm: rhythmic | Item-role: gift | Scale: local | Genre-feel: fairy-tale
  // Shape: reunion
  'Once a year — always {weather}, always in {setting|event} — the festival came back. Not because anyone organized it. Because the place remembered. {Character1.emotional} and {character2} didn\'t know each other. They just showed up the same way everyone always had, following something older than memory.\n\n{Item} was passed from hand to hand. {Hook} was part of the celebration — not a problem, just a tradition nobody could explain. The {role} who kept the old ways said it had always been this way.\n\nThe festival ended. The place remembered. And {wish.bare} and {moral.about} lingered like lantern smoke. A {tone} tale, told once a year.',

  // Template 168 — The Cartographer's Dilemma
  // Voice: rhetorical | Opening: contrast | Temporal: linear | Dynamic: strangers | Agency: compelled
  // Arc: surprise-pivot | Tension: impossible-choice | Stakes: identity | Connection: discovery | Hook-role: central
  // Moral: question | Mystery: question-based | Spotlight: character-emotional
  // Structure: two-para | Rhythm: mixed | Item-role: clue | Scale: expanding | Genre-feel: neutral
  // Shape: promise-to-keep
  'What do you do with a place that doesn\'t want to be found? {Character1.emotional} drew maps for a living — every corner of {setting|event}, every path, every landmark. {Weather}, {item} was the newest addition. But {hook} was the problem: drawing it on the map meant everyone would come. Leaving it off meant lying.\n\n{Character2}, the {role} who\'d shown them the place, said: "Some things stay secret for a reason." The choice was {tone}. All they wanted was {wish}. A story about {moral.about} — and whether telling the truth is always the right thing to do.',
];
