// D&D and fantasy-inspired templates (79–98).
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
  // ---------------------------------------------------------------
  // Round 4 — Templates 79–88 (D&D tropes)
  // ---------------------------------------------------------------

  // Template 79 — The Tavern Quest Board
  // Voice: campfire | Opening: sensory | Temporal: linear | Dynamic: strangers | Agency: proactive
  // Arc: steady-build | Tension: discovery | Stakes: trust | Connection: coincidence | Hook-role: central
  // Moral: label | Mystery: laid-out | Spotlight: setting
  // Structure: two-para | Rhythm: mixed | Item-role: clue | Scale: local | Genre-feel: adventure-serial
  // Shape: quest
  '{Weather}, the notice was still pinned to the board {setting.placed|event.placed} — edges curled, ink fading, but the words unmistakable: {hook}. {Character1.emotional} read it twice. {Character2}, the {role} nursing a drink at the next table, read it once and stood up.\n\nNeither one planned on company. But {item} was listed as the reward, and the road ahead was too long for one. The quest took shape between two strangers who hadn\'t even exchanged names — {aTone} tale about {wish.bare} and {moral.about}.',

  // Template 80 — The Dungeon Crawl
  // Voice: in-medias-res | Opening: sensory | Temporal: middle-first | Dynamic: fragile-alliance | Agency: reactive
  // Arc: man-in-hole | Tension: pursuit | Stakes: personal-loss | Connection: causal | Hook-role: looming-threat
  // Moral: tested | Mystery: teaser | Spotlight: setting
  // Structure: two-para | Rhythm: short-punchy | Item-role: key | Scale: local | Genre-feel: adventure-serial
  // Shape: daring-escape
  'The torch guttered. The walls of {setting|event} pressed in. Somewhere below, {hook} echoed off stone — closer now than before. {Character1.emotional} kept moving. {Character2}, the {role}, kept count of the doors they\'d passed.\n\n{Weather}, the last door opened onto something neither expected. {Item} sat on a pedestal, waiting. The way back was gone. The only way out was deeper — {aTone} story about {wish.bare} and whether {moral.about} holds up in the dark.',

  // Template 81 — The Dragon's Bargain
  // Voice: legend | Opening: dialogue-cold | Temporal: linear | Dynamic: believer-skeptic | Agency: compelled
  // Arc: peak-resolve | Tension: impossible-choice | Stakes: promise | Connection: causal | Hook-role: central
  // Moral: question | Mystery: teaser | Spotlight: hook
  // Structure: two-para | Rhythm: flowing | Item-role: burden | Scale: epic | Genre-feel: myth
  // Shape: trade
  '"I will give you what you need," it said, "but not what you want." {Setting.placed|event.placed}, {weather}, the oldest creature alive made {character1.emotional} an offer: solve {hook}, and claim {item}. The cost? Only the {role} could say.\n\n{Character2} warned against it. Bargains like this have teeth. But {wish} was too close to walk away from, and the creature\'s eyes held no malice — only patience. A {tone} legend about {moral.about}, and whether the price of a bargain is ever what it seems.',

  // Template 82 — The Cursed Artifact
  // Voice: warning | Opening: rule-to-break | Temporal: linear | Dynamic: reluctant-partners | Agency: reluctant
  // Arc: dark-to-light | Tension: forbidden | Stakes: identity | Connection: causal | Hook-role: catalyst
  // Moral: tested | Mystery: withhold-hook | Spotlight: item
  // Structure: three-beat | Rhythm: mixed | Item-role: burden | Scale: local | Genre-feel: campfire-legend
  // Shape: curse-to-break
  'The inscription was clear: do not take {item} from {setting|event}. Naturally, {character1.emotional} took it anyway.\n\n{Weather}, the curse crept in — slow at first, then faster. {Hook} was only the first sign. {Character2}, the only {role} who\'d seen this before, arrived too late to stop it and just in time to help.\n\nBreaking a curse isn\'t about strength. It\'s about knowing what you\'re willing to give up. A {tone} tale about {wish.bare} and {moral.about}.',

  // Template 83 — The Lich's Phylactery
  // Voice: confessional | Opening: contrast | Temporal: flashback | Dynamic: seeker | Agency: proactive
  // Arc: steady-build | Tension: ticking-clock | Stakes: scarcity | Connection: causal | Hook-role: looming-threat
  // Moral: woven | Mystery: teaser | Spotlight: character-emotional
  // Structure: two-para | Rhythm: flowing | Item-role: last | Scale: expanding | Genre-feel: myth
  // Shape: race-against-time
  '{Character1.emotional} had been tracking it for longer than they\'d admit — the source, the heart of {hook}, hidden somewhere {setting.placed|event.placed}. Legends called it {item}. The {role} who\'d taught them everything said it couldn\'t be destroyed. They were wrong about that. They were right about the cost.\n\n{Weather}, {character2} caught up to them at last. Time was running out — the darkness was already spreading. All they wanted was {wish}. What they found was {aTone} truth about {moral.about}, and whether ending something is the same as saving it.',

  // Template 84 — The Party Forms
  // Voice: laconic | Opening: catalog | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: surprise-pivot | Tension: mismatch | Stakes: trust | Connection: coincidence | Hook-role: central
  // Moral: label | Mystery: laid-out | Spotlight: character-both
  // Structure: two-para | Rhythm: fragmented | Item-role: catalyst | Scale: local | Genre-feel: adventure-serial
  // Shape: unlikely-friendship
  '{Character1.emotional}. {Character2}. One {role}. One {item.bare}. And {hook} — the kind of problem none of them could solve alone. {Weather}, {setting|event} threw them together the way only bad luck can.\n\nThey didn\'t like each other. They didn\'t have to. The quest didn\'t care about feelings — it cared about {wish.bare}. And somewhere between the arguing and the near-disasters, something that looked a lot like friendship took hold. A {tone} tale about {moral.about}.',

  // Template 85 — The Healer's Dilemma
  // Voice: bedtime-whisper | Opening: contrast | Temporal: linear | Dynamic: protector-ward | Agency: compelled
  // Arc: dark-to-light | Tension: impossible-choice | Stakes: personal-loss | Connection: causal | Hook-role: central
  // Moral: woven | Mystery: question-based | Spotlight: character-emotional
  // Structure: two-para | Rhythm: flowing | Item-role: last | Scale: intimate | Genre-feel: fable
  // Shape: promise-to-keep
  '{Character1.emotional} could heal anything — everyone {setting.placed|event.placed} knew that. The {role} who mends what\'s broken. But {hook} was different. Healing {character2} meant using the last of {item}, and there wouldn\'t be more.\n\n{Weather}, the choice hung in the quiet between heartbeats. Keep the power or use it — save one and lose the gift, or keep the gift and lose the one person who made it worth having. A {tone} story about {wish.bare} — and whether {moral.about} means giving everything, even the part of you that\'s irreplaceable.',

  // Template 86 — The Rogue's Honor
  // Voice: campfire | Opening: dialogue-cold | Temporal: linear | Dynamic: fragile-alliance | Agency: proactive
  // Arc: surprise-pivot | Tension: secret | Stakes: trust | Connection: causal | Hook-role: central
  // Moral: tested | Mystery: teaser | Spotlight: character-both
  // Structure: two-para | Rhythm: short-punchy | Item-role: key | Scale: local | Genre-feel: adventure-serial
  // Shape: noble-thief
  '"You\'re a thief." "And you need one." {Character1.emotional} didn\'t argue the point. {Setting.placed|event.placed}, {weather}, {hook} had everyone else running scared. {Character2} was the only {role} who could get to {item} — and they both knew it.\n\nThe job was simple. The trust wasn\'t. Every step deeper tested something neither of them expected: the idea that a thief might keep a promise. A {tone} tale about {wish.bare} and {moral.about} — earned one risk at a time.',

  // Template 87 — The Shapeshifter Revealed
  // Voice: confessional | Opening: contrast | Temporal: linear | Dynamic: secret-between | Agency: reluctant
  // Arc: light-to-dark | Tension: secret | Stakes: identity | Connection: causal | Hook-role: catalyst
  // Moral: woven | Mystery: withhold-hook | Spotlight: character-emotional
  // Structure: three-beat | Rhythm: mixed | Item-role: symbol | Scale: local | Genre-feel: fairy-tale
  // Shape: hidden-truth
  '{Character1.emotional} had kept the secret perfectly. {Setting.placed|event.placed}, {weather}, nobody suspected. The {role} they pretended to be fit like a second skin. {Character2} trusted them completely — and that was the problem.\n\nThen {hook.verb}. {Item} fell into the open, and the mask slipped. There was no hiding after that.\n\nThe hardest part wasn\'t being found out. It was watching {character2.bare}\'s face and knowing: the truth had cost them {wish}. A {tone} story about {moral.about} — and whether what you are matters more than who you choose to be.',

  // Template 88 — The Portal to Another Plane
  // Voice: direct-address | Opening: impossible-image | Temporal: linear | Dynamic: reluctant-partners | Agency: reactive
  // Arc: steady-build | Tension: forbidden | Stakes: belonging | Connection: symbolic | Hook-role: catalyst
  // Moral: label | Mystery: teaser | Spotlight: setting
  // Structure: two-para | Rhythm: flowing | Item-role: catalyst | Scale: expanding | Genre-feel: fairy-tale
  // Shape: between-two-worlds
  'The door shouldn\'t have been there. Not {setting.placed|event.placed}, not {weather}, not anywhere that made sense. But {character1.emotional} touched it anyway — and {item} blazed to life, and the world peeled open like a page being turned.\n\nOn the other side, {hook} was the first thing they saw. {Character2}, a {role} from this stranger place, said it had been waiting for someone exactly like them. Going back meant forgetting. Staying meant leaving everything behind. A {tone} tale about {wish.bare} and {moral.about}.',

  // ---------------------------------------------------------------
  // Round 5 — Templates 89–98 (fantasy novel/movie/game tropes)
  // ---------------------------------------------------------------

  // Template 89 — The Chosen One Who Refuses
  // Voice: laconic | Opening: declarative | Temporal: linear | Dynamic: reluctant-partners | Agency: reluctant
  // Arc: man-in-hole | Tension: mismatch | Stakes: identity | Connection: prophecy | Hook-role: central
  // Moral: label | Mystery: laid-out | Spotlight: character-emotional
  // Structure: two-para | Rhythm: short-punchy | Item-role: burden | Scale: epic | Genre-feel: myth
  // Shape: fear-to-overcome
  '{Character1.emotional} was supposed to stop {hook}. The prophecy was clear. {Item} chose them specifically. The whole of {setting|event} was counting on it. And their answer, {weather}, was no.\n\n{Character2} — a {role} who\'d waited a lifetime for this moment — didn\'t take it well. The argument went on for days. The danger went on longer. All they wanted was {wish}. But destiny is patient, and the fear of becoming something you\'re not is {aTone} tale about {moral.about}.',

  // Template 90 — Siege of the Last City
  // Voice: legend | Opening: scalar-shift | Temporal: countdown | Dynamic: protector-ward | Agency: compelled
  // Arc: peak-resolve | Tension: ticking-clock | Stakes: belonging | Connection: causal | Hook-role: looming-threat
  // Moral: tested | Mystery: teaser | Spotlight: setting
  // Structure: two-para | Rhythm: mixed | Item-role: last | Scale: epic | Genre-feel: myth
  // Shape: stand-against-bully
  'From the highest wall of {setting|event}, {weather}, you could see it coming — {hook}, vast and inevitable, darkening the horizon. {Character1.emotional} had seen sieges before. This one was different. This was the last one.\n\n{Character2}, the {role} nobody thought would stay, stayed. {Item} was all that stood between the city and the end. There wasn\'t enough time, enough hope, or enough of anything — except the stubborn belief that {wish} was still worth fighting for. A {tone} legend about {moral.about}.',

  // Template 91 — The Enchanted Forest
  // Voice: bedtime-whisper | Opening: sensory | Temporal: linear | Dynamic: helper | Agency: passive
  // Arc: calm | Tension: discovery | Stakes: belonging | Connection: symbolic | Hook-role: background
  // Moral: woven | Mystery: laid-out | Spotlight: setting
  // Structure: two-para | Rhythm: flowing | Item-role: gift | Scale: intimate | Genre-feel: fairy-tale
  // Shape: hidden-garden
  '{Weather}, the trees {setting.placed|event.placed} whispered. Not words — something older. Something that sounded like {hook} if you listened with your whole body instead of just your ears. {Character1.emotional} stepped deeper, following {item} as it glowed faintly along the path.\n\n{Character2} was already there — a {role} who\'d been part of the forest so long they\'d nearly become part of it. The gift they offered wasn\'t something you could hold. It was the feeling of {wish.bare} — living, growing, rooted in {moral.about}.',

  // Template 92 — The Prophecy Misread
  // Voice: rhetorical | Opening: everyone-knows | Temporal: linear | Dynamic: believer-skeptic | Agency: reactive
  // Arc: surprise-pivot | Tension: question | Stakes: identity | Connection: prophecy | Hook-role: reframed
  // Moral: label | Mystery: question-based | Spotlight: hook
  // Structure: two-para | Rhythm: mixed | Item-role: clue | Scale: local | Genre-feel: campfire-legend
  // Shape: mistaken-identity
  'The prophecy said {hook} would come to {setting|event} when the time was right — and everyone assumed they knew what it meant. {Character1.emotional} was certain. {Character2}, the {role} who\'d translated it in the first place, had doubts.\n\n{Weather}, {item} revealed what they\'d all missed. The prophecy wasn\'t wrong — they\'d been reading it backwards. What they thought was a disaster was actually {wish.bare}. A {tone} tale about {moral.about} — and the danger of being too sure you understand.',

  // Template 93 — The Fallen Paladin
  // Voice: confessional | Opening: contrast | Temporal: flashback | Dynamic: seeker | Agency: reluctant
  // Arc: dark-to-light | Tension: promise | Stakes: identity | Connection: inheritance | Hook-role: past-event
  // Moral: woven | Mystery: teaser | Spotlight: character-emotional
  // Structure: three-beat | Rhythm: flowing | Item-role: symbol | Scale: local | Genre-feel: myth
  // Shape: exile-and-return
  '{Character1.emotional} used to be the {role} everyone trusted. That was before {hook.verb} — before the oath broke and {setting|event} closed its doors. {Item} was all they carried out, heavy with everything it stood for.\n\n{Weather}, {character2} found them on the road — not the glorious road, the other one. The quiet one nobody writes songs about. "You don\'t have to go back," they said. "But you could."\n\nRedemption isn\'t a single moment. It\'s {aTone} walk back toward {wish.bare} and the slow, stubborn work of {moral.about}.',

  // Template 94 — The Magical School Mishap
  // Voice: laconic | Opening: interrupted-routine | Temporal: linear | Dynamic: rivals | Agency: reactive
  // Arc: surprise-pivot | Tension: mismatch | Stakes: trust | Connection: causal | Hook-role: catalyst
  // Moral: label | Mystery: laid-out | Spotlight: character-both
  // Structure: two-para | Rhythm: short-punchy | Item-role: catalyst | Scale: local | Genre-feel: tall-tale
  // Shape: mistake-to-fix
  'The spell was supposed to be simple. {Character1.emotional} had practiced it a hundred times {setting.placed|event.placed}. But {weather}, something went sideways — specifically, {item} exploded, {hook.verb}, and {character2} ended up stuck to the ceiling.\n\nThe {role} in charge gave them until sundown to fix it. Together. Which was a problem, because they couldn\'t stand each other. But some messes are too big for pride. A {tone} tale about {wish.bare} and {moral.about}.',

  // Template 95 — The Last Dragon
  // Voice: legend | Opening: declarative | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: dark-to-light | Tension: scarcity | Stakes: scarcity | Connection: discovery | Hook-role: central
  // Moral: woven | Mystery: teaser | Spotlight: character-emotional
  // Structure: two-para | Rhythm: flowing | Item-role: symbol | Scale: epic | Genre-feel: myth
  // Shape: precious-to-protect
  'They said the last one lived beyond {setting|event}, {weather}, where no road went and no map reached. {Character1.emotional} didn\'t go looking for it. They went looking for {hook} — and found something far older and far more fragile instead.\n\n{Character2}, the {role} who guarded the way, said the same thing every guardian says: it isn\'t yours to take. But {item} wasn\'t a prize. It was a promise — that some things are worth protecting simply because they exist. A {tone} tale about {wish.bare} and {moral.about}.',

  // Template 96 — The Throne Nobody Wants
  // Voice: rhetorical | Opening: question-hook | Temporal: linear | Dynamic: former-enemies | Agency: compelled
  // Arc: peak-resolve | Tension: impossible-choice | Stakes: belonging | Connection: inheritance | Hook-role: central
  // Moral: question | Mystery: question-based | Spotlight: hook
  // Structure: two-para | Rhythm: mixed | Item-role: burden | Scale: local | Genre-feel: campfire-legend
  // Shape: promise-to-keep
  'Who wants to sit on a throne nobody asked for? {Setting.placed|event.placed}, {weather}, {hook} left the seat empty — and {character1.emotional} and {character2} were the only ones left. The {role} with the strongest claim. The outsider with the best intentions. Neither one wanted it.\n\n{Item} was the key to the whole mess — proof of right, burden of duty. All they wanted was {wish}. But someone had to sit down. A {tone} tale about {moral.about} — and whether leading is something you choose or something that chooses you.',

  // Template 97 — The Wild Hunt
  // Voice: in-medias-res | Opening: sensory | Temporal: countdown | Dynamic: protector-ward | Agency: reactive
  // Arc: man-in-hole | Tension: pursuit | Stakes: personal-loss | Connection: causal | Hook-role: looming-threat
  // Moral: tested | Mystery: teaser | Spotlight: weather
  // Structure: two-para | Rhythm: short-punchy | Item-role: key | Scale: expanding | Genre-feel: myth
  // Shape: daring-escape
  'The horns sounded at dusk. {Weather}, the sky over {setting|event} tore open and the hunt poured through — {hook}, ancient and hungry and aimed straight at {character1.emotional}. There was no negotiating. There was only running.\n\n{Character2}, the {role} who shouldn\'t have been there, grabbed {item} and ran too. The hunt doesn\'t stop. It doesn\'t bargain. It doesn\'t tire. All they wanted was {wish}. All they had was each other — and the fading hope that {moral.about} is enough to outrun the dark. A {tone} tale, told at a sprint.',

  // Template 98 — The Sleeping Kingdom
  // Voice: bedtime-whisper | Opening: contrast | Temporal: linear | Dynamic: helper | Agency: proactive
  // Arc: wind-down | Tension: secret | Stakes: belonging | Connection: symbolic | Hook-role: background
  // Moral: woven | Mystery: withhold-hook | Spotlight: setting
  // Structure: two-para | Rhythm: flowing | Item-role: key | Scale: local | Genre-feel: lullaby
  // Shape: curse-to-break
  'Everything {setting.placed|event.placed} was still. The trees. The water. The {role} on the throne — eyes closed, dust on their shoulders, a crown that hadn\'t moved in years. {Weather}, the whole kingdom dreamed the same dream. Nobody remembered {hook}. Nobody remembered anything.\n\n{Character1.emotional} was the only one still awake — wandering the silent halls with {item}, looking for {character2}, the one person who might know how to wake it all up. The answer was {tone} and small and exactly what you\'d expect: {wish.bare}, and the patient truth of {moral.about}.',

  // --- Book-inspired fantasy templates (179–183) ---

  // Template 179 — The Shadow Self (A Wizard of Earthsea)
  // Voice: bedtime-whisper | Opening: sensory | Temporal: linear | Dynamic: seeker | Agency: compelled
  // Arc: dark-to-light | Tension: pursuit | Stakes: identity | Connection: symbolic | Hook-role: central
  // Moral: woven | Mystery: withhold-hook | Spotlight: character-emotional
  // Structure: two-para | Rhythm: flowing | Item-role: symbol | Scale: internal | Genre-feel: myth
  // Shape: shadow-to-face
  'Something followed {character1.emotional} through {setting|event} — not behind them, exactly, but beneath. {Weather}, their shadow moved wrong. Too slow. Too deliberate. Too much like something that had its own ideas. The {role} who\'d warned them said: you cannot fight what is already yours.\n\n{Character2} found them at the edge, holding {item} and staring at the dark shape that wore their face. {Hook} was how it had broken free. Running hadn\'t worked. Hiding hadn\'t worked. All they wanted was {wish}. But you can\'t outrun your own shadow. A {tone} tale about {moral.about} — and the moment you stop running and turn around.',

  // Template 180 — The Moving Castle (Howl\'s Moving Castle)
  // Voice: laconic | Opening: impossible-image | Temporal: linear | Dynamic: reluctant-partners | Agency: reactive
  // Arc: surprise-pivot | Tension: mismatch | Stakes: belonging | Connection: causal | Hook-role: catalyst
  // Moral: label | Mystery: laid-out | Spotlight: setting
  // Structure: two-para | Rhythm: short-punchy | Item-role: key | Scale: local | Genre-feel: tall-tale
  // Shape: taming-the-untamable
  '{Setting|event} moved. Not metaphorically. It groaned, shifted two feet to the left, and settled with a sigh that rattled every window. {Character1.emotional} had been living inside it long enough to know: you don\'t argue with a building that has opinions. {Weather}, the {role} next door had stopped being surprised.\n\n{Character2} arrived with {item} and the idea that {hook} was somehow the building\'s fault. The building disagreed — loudly, structurally, with a door that refused to open. All they wanted was {wish}. A {tone} tale about {moral.about} — and the art of negotiating with something that has no mouth but plenty to say.',

  // Template 181 — The True Name (Earthsea / Rumplestiltskin)
  // Voice: legend | Opening: rule-to-break | Temporal: linear | Dynamic: mentor-student | Agency: proactive
  // Arc: steady-build | Tension: forbidden | Stakes: trust | Connection: prophecy | Hook-role: central
  // Moral: woven | Mystery: teaser | Spotlight: hook
  // Structure: two-para | Rhythm: flowing | Item-role: key | Scale: local | Genre-feel: myth
  // Shape: naming-what-matters
  'The first rule {setting.placed|event.placed} was simple: never speak a true name aloud. Names have weight. Names have teeth. {Character1.emotional} learned this from the {role} who\'d taught every student before them — and who\'d lost something to a name once, long ago.\n\n{Weather}, {hook} forced the choice nobody wanted. {Character2} stood at the center of it, voiceless, waiting. {Item} held the name written down — the only safe way to carry it. To speak it was to claim it. To claim it was to be responsible for it. All they wanted was {wish}. A {tone} tale about {moral.about}, and the difference between knowing a name and understanding what it means.',

  // Template 182 — The Last Feast (Redwall)
  // Voice: campfire | Opening: catalog | Temporal: countdown | Dynamic: fragile-alliance | Agency: proactive
  // Arc: peak-resolve | Tension: ticking-clock | Stakes: belonging | Connection: causal | Hook-role: looming-threat
  // Moral: woven | Mystery: laid-out | Spotlight: setting
  // Structure: two-para | Rhythm: mixed | Item-role: comfort | Scale: local | Genre-feel: fairy-tale
  // Shape: gathering-before-the-storm
  'The table was set. {Item}. Fresh bread. Candles lit against {weather.noun}. {Setting.placed|event.placed}, every chair was taken — {character1.emotional} at one end, {character2} at the other, and the {role} in between, keeping the peace the way they always did.\n\nOutside, {hook} was getting closer. Everyone at the table knew it. Nobody mentioned it — not yet. First, the feast. First, this one night of {tone.noun} and warmth and {wish.bare}, because some things you protect by celebrating them while you still can. A tale about {moral.about}, told with a full plate and a worried heart.',

  // Template 183 — The Fallen Star (Stardust)
  // Voice: direct-address | Opening: scalar-shift | Temporal: linear | Dynamic: strangers | Agency: proactive
  // Arc: surprise-pivot | Tension: discovery | Stakes: identity | Connection: collision | Hook-role: reframed
  // Moral: label | Mystery: withhold-hook | Spotlight: weather
  // Structure: two-para | Rhythm: mixed | Item-role: clue | Scale: contracting | Genre-feel: fairy-tale
  // Shape: prize-becomes-person
  'Picture this: {weather}, something fell from the sky above {setting|event}. Not fast — slowly, the way important things always fall. {Character1.emotional} saw it from miles away and started walking. {Item} was proof it was real. The {role} who knew the old stories said don\'t go. Everyone went anyway.\n\nThe star wasn\'t a star. It was {character2} — bruised, glowing faintly, and deeply annoyed about being chased. {Hook} was the reason for the fall, but the real surprise was this: you can\'t keep a person. Not as a prize, not as a wish, not as a trophy. All they wanted was {wish}. A {tone} tale about {moral.about}, and the difference between finding something and earning it.',
];
