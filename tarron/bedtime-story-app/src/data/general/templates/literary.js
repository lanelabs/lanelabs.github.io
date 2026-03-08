// Literary-inspired templates (49–78) — book/movie/fairy-tale archetypes.
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
  // Round 1 — Templates 49–58
  // ---------------------------------------------------------------

  // Template 49 — Lost in a Strange Land
  // Voice: direct-address | Opening: sensory | Temporal: linear | Dynamic: reluctant-partners | Agency: proactive
  // Arc: steady-build | Tension: scarcity | Stakes: belonging | Connection: causal | Hook-role: catalyst
  // Moral: label | Mystery: laid-out | Spotlight: setting
  // Structure: two-para | Rhythm: flowing | Item-role: key | Scale: expanding | Genre-feel: fairy-tale
  // Shape: way-back-home
  '{Weather}, {character1.emotional} woke up somewhere they didn\'t recognize — {setting|event}, stretching in every direction, beautiful and completely wrong. Everything familiar was gone. The only clue: {item}, clutched tight and humming faintly.\n\n{Character2} — the first {role} willing to help — pointed down a long, strange road. {Hook} waited at the end of it. They didn\'t know it yet, but the way back home had nothing to do with the road. A {tone} tale about {wish.bare} and {moral.about}.',

  // Template 50 — Don't Leave Them Behind
  // Voice: in-medias-res | Opening: declarative | Temporal: linear | Dynamic: protector-ward | Agency: compelled
  // Arc: steady-build | Tension: pursuit | Stakes: personal-loss | Connection: causal | Hook-role: looming-threat
  // Moral: label | Mystery: teaser | Spotlight: character-emotional
  // Structure: two-para | Rhythm: mixed | Item-role: clue | Scale: expanding | Genre-feel: adventure-serial
  // Shape: against-all-odds
  '{Character1.emotional} doesn\'t stop. Not for {weather.noun}, not for {hook}, not for the fact that {setting|event} is the last place anyone should go alone. {Character2} is out there somewhere — and every {role} knows: you don\'t leave someone behind.\n\n{Item} is the only lead. The trail cuts through places that get stranger and more dangerous with every step. All they want is {wish} — the simplest thing in the world, and the hardest to reach. A {tone} tale about {moral.about}.',

  // Template 51 — Exile and Return
  // Voice: legend | Opening: contrast | Temporal: flashback | Dynamic: seeker | Agency: reluctant
  // Arc: dark-to-light | Tension: secret | Stakes: identity | Connection: inheritance | Hook-role: past-event
  // Moral: label | Mystery: teaser | Spotlight: character-emotional
  // Structure: three-beat | Rhythm: mixed | Item-role: symbol | Scale: local | Genre-feel: myth
  // Shape: exile-and-return
  '{Character1.emotional} used to belong {setting.placed|event.placed}. That was before {hook.verb} — before everything fell apart and the only choice was to leave.\n\n{Weather}, far from home, the {role} they\'d been raised to be felt like a stranger\'s life. {Character2} found them anyway, carrying {item} and a question that wouldn\'t wait.\n\nSome things can\'t stay buried. The return begins — {aTone} legend about {wish.bare} and {moral.about}.',

  // Template 52 — Befriending the Feared
  // Voice: confessional | Opening: contrast | Temporal: linear | Dynamic: believer-skeptic | Agency: proactive
  // Arc: dark-to-light | Tension: mismatch | Stakes: identity | Connection: contradictory | Hook-role: central
  // Moral: woven | Mystery: teaser | Spotlight: character-both
  // Structure: two-para | Rhythm: mixed | Item-role: symbol | Scale: local | Genre-feel: neutral
  // Shape: choosing-who-you-are
  'Everyone said {character2} was dangerous. {Setting.placed|event.placed}, {weather}, the warnings were simple: stay away. {Hook} was proof enough for most people. But {character1.emotional} didn\'t listen.\n\nIt started with {item} — left out like a peace offering, taken like one too. The {role} wasn\'t what anyone expected. Neither was the friendship. A {tone} story about {wish.bare} — and how {moral.about} matters more than what you\'re told to believe.',

  // Template 53 — Everything Inside Out
  // Voice: warning | Opening: impossible-image | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: surprise-pivot | Tension: mismatch | Stakes: identity | Connection: contradictory | Hook-role: central
  // Moral: label | Mystery: question-based | Spotlight: setting
  // Structure: two-para | Rhythm: fragmented | Item-role: catalyst | Scale: local | Genre-feel: anti-fairy-tale
  // Shape: upside-down-world
  'The ground wasn\'t where it should be. Neither was the sky. {Weather}, {setting|event} had turned itself inside out, and {character1.emotional} was standing in the middle of it, holding {item} and wondering which way was up.\n\n{Character2} — a {role} who seemed perfectly at home in the impossible — offered no explanation. Just a grin. {Hook} was apparently normal here. Up was down. Lost was found. The only real question was whether {wish.bare} still meant the same thing. A {tone} tale about {moral.about}.',

  // Template 54 — The Quiet Gift
  // Voice: bedtime-whisper | Opening: sensory | Temporal: linear | Dynamic: helper | Agency: passive
  // Arc: wind-down | Tension: promise | Stakes: trust | Connection: symbolic | Hook-role: background
  // Moral: woven | Mystery: laid-out | Spotlight: character-both
  // Structure: two-para | Rhythm: flowing | Item-role: gift | Scale: intimate | Genre-feel: fable
  // Shape: lasting-gift
  '{Weather}, in the quiet corner of {setting|event}, {character1.emotional} and {character2} sat together the way they always did — close, unhurried, like time was something they\'d agreed to ignore. {Item} rested between them. {Hook} had come and gone.\n\nThe {role} was already working on something — a gift that wouldn\'t make sense until later, woven carefully out of {tone.noun} and patience. All they wanted was {wish}. What they left behind was bigger than either of them. A story about {moral.about}, told in the gentlest voice.',

  // Template 55 — Past the Edge of Every Map
  // Voice: campfire | Opening: sensory | Temporal: linear | Dynamic: reluctant-partners | Agency: proactive
  // Arc: steady-build | Tension: forbidden | Stakes: identity | Connection: causal | Hook-role: central
  // Moral: label | Mystery: teaser | Spotlight: character-emotional
  // Structure: two-para | Rhythm: mixed | Item-role: key | Scale: expanding | Genre-feel: myth
  // Shape: answering-the-call
  'Something kept pulling — past {setting|event}, past the edges of every map, past every warning. {Character1.emotional} felt it {weather}. The {role} in them wasn\'t supposed to go. Everyone said so. But {hook} wouldn\'t stop calling.\n\n{Character2} came along — not because they were asked, but because some journeys shouldn\'t be made alone. {Item} pointed the way. What started as defiance became something braver. All they wanted was {wish}. A {tone} tale about {moral.about}.',

  // Template 56 — Kingdom of Not Caring
  // Voice: direct-address | Opening: declarative | Temporal: circular | Dynamic: strangers | Agency: proactive
  // Arc: man-in-hole | Tension: mismatch | Stakes: belonging | Connection: causal | Hook-role: catalyst
  // Moral: woven | Mystery: laid-out | Spotlight: character-emotional
  // Structure: bookend | Rhythm: mixed | Item-role: comfort | Scale: local | Genre-feel: neutral
  // Shape: running-away-and-back
  '{Character1.emotional} left. Just like that — out the door, past the edge of everything safe, straight into {setting|event}.\n\n{Weather}, the wild place was everything they wanted. {Character2} was there, and {hook} made the rules feel far away. {Item} became a crown, a throne, a whole kingdom of not caring. The {role} of the wild is easy to play.\n\nBut {tone.noun} fades. And somewhere back where they started, {wish.bare} is waiting — along with {moral.about}.',

  // Template 57 — The Best Kind of Ending
  // Voice: direct-address | Opening: dialogue-cold | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: surprise-pivot | Tension: discovery | Stakes: implied | Connection: causal | Hook-role: central
  // Moral: label | Mystery: laid-out | Spotlight: story-shape
  // Structure: dialogue | Rhythm: mixed | Item-role: key | Scale: local | Genre-feel: fairy-tale
  // Shape: story-being-told
  '"Is this the kind with a happy ending?" "The best kind." All right — here it is.\n\n{Weather}, {setting.placed|event.placed}, {character1.emotional} meets {character2} — a {role} with {item} and absolutely no plan. {Hook} gets in the way, obviously. There are chases. There\'s danger. There are moments so {tone} you almost forget to breathe. All they want is {wish}. And yes — it\'s about {moral.about}.\n\n"That\'s not bad." "I told you."',

  // Template 58 — The Promise That Waited
  // Voice: confessional | Opening: contrast | Temporal: flashback | Dynamic: reluctant-partners | Agency: reluctant
  // Arc: dark-to-light | Tension: promise | Stakes: personal-loss | Connection: causal | Hook-role: past-event
  // Moral: woven | Mystery: teaser | Spotlight: item
  // Structure: three-beat | Rhythm: flowing | Item-role: symbol | Scale: local | Genre-feel: neutral
  // Shape: unfinished-promise
  '{Character1.emotional} had carried {item} for years — a reminder of a promise made long ago, back when {setting|event} was still just a dream. {Hook} was supposed to happen then. It never did.\n\n{Weather}, the {role} was ready to let it go. Then {character2} showed up — uninvited, unexpected, impossible to ignore. The kind of companion nobody asks for and everybody needs.\n\nThe promise isn\'t finished yet. It\'s {aTone} story about {wish.bare} — and about {moral.about}, which is the only kind of promise that doesn\'t expire.',

  // ---------------------------------------------------------------
  // Round 2 — Templates 59–68
  // ---------------------------------------------------------------

  // Template 59 — Beauty Beneath
  // Voice: confessional | Opening: contrast | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: dark-to-light | Tension: mismatch | Stakes: identity | Connection: discovery | Hook-role: catalyst
  // Moral: woven | Mystery: teaser | Spotlight: character-emotional
  // Structure: two-para | Rhythm: flowing | Item-role: symbol | Scale: local | Genre-feel: fairy-tale
  // Shape: beauty-beneath
  'Nobody went near {setting|event}. Not because of {hook} — that was just a rumor. They stayed away because of {character1.emotional}, who had lived there alone so long that the loneliness had become a kind of armor.\n\n{Weather}, {character2} came anyway — a {role} with {item} and no fear of ugly things. What they found wasn\'t a monster. It wasn\'t even close. A {tone} story about {wish.bare} — and how {moral.about} has a way of looking past the surface.',

  // Template 60 — Between Two Worlds
  // Voice: legend | Opening: declarative | Temporal: linear | Dynamic: seeker | Agency: reluctant
  // Arc: peak-resolve | Tension: impossible-choice | Stakes: identity | Connection: inheritance | Hook-role: central
  // Moral: label | Mystery: teaser | Spotlight: character-emotional
  // Structure: two-para | Rhythm: mixed | Item-role: symbol | Scale: local | Genre-feel: myth
  // Shape: between-two-worlds
  '{Character1.emotional} had always belonged to {setting|event} — or so they thought. They knew every sound, every shadow, every hiding place. But {hook.verb}, and suddenly the {role} they\'d been all their life didn\'t fit anymore.\n\n{Weather}, {character2} arrived from the other side — carrying {item} and a truth neither of them wanted to hear. Between the world they knew and the world they came from, there was only one choice. A {tone} tale about {wish.bare} and {moral.about}.',

  // Template 61 — The New One
  // Voice: laconic | Opening: interrupted-routine | Temporal: linear | Dynamic: rivals | Agency: reactive
  // Arc: surprise-pivot | Tension: rivalry | Stakes: belonging | Connection: collision | Hook-role: catalyst
  // Moral: woven | Mystery: laid-out | Spotlight: character-both
  // Structure: two-para | Rhythm: short-punchy | Item-role: catalyst | Scale: local | Genre-feel: neutral
  // Shape: learning-to-share
  '{Character1.emotional} had been the {role} {setting.placed|event.placed} for as long as anyone could remember. Reliable. Trusted. Irreplaceable. Then {character2} showed up — newer, shinier, carrying {item} like it was no big deal.\n\n{Weather}, {hook} forced them together, which was the last thing either wanted. Jealousy is a strange starting point for a friendship. But so is {wish.bare}. A {tone} story, in the end, about {moral.about}.',

  // Template 62 — Pulled Inside the Pages
  // Voice: direct-address | Opening: rule-to-break | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: steady-build | Tension: forbidden | Stakes: identity | Connection: symbolic | Hook-role: central
  // Moral: label | Mystery: teaser | Spotlight: item
  // Structure: two-para | Rhythm: flowing | Item-role: catalyst | Scale: expanding | Genre-feel: fairy-tale
  // Shape: story-that-pulls-you-in
  'Don\'t read too far into this one. I\'m serious. Because somewhere {setting.placed|event.placed}, {weather}, {character1.emotional} opened {item} — and the story inside started reading back.\n\n{Character2}, a {role} from the other side of the page, stepped through like it was nothing. {Hook} was already written. The ending wasn\'t. And now the only way out is through — a {tone} tale about {wish.bare} and {moral.about}.',

  // Template 63 — Nobody Expected Them
  // Voice: campfire | Opening: contrast | Temporal: linear | Dynamic: helper | Agency: proactive
  // Arc: steady-build | Tension: mismatch | Stakes: identity | Connection: causal | Hook-role: central
  // Moral: label | Mystery: laid-out | Spotlight: character-emotional
  // Structure: two-para | Rhythm: mixed | Item-role: key | Scale: local | Genre-feel: tall-tale
  // Shape: unlikely-greatness
  'Let me be clear: nobody — and I mean nobody — expected {character1.emotional} to be the one. Not {setting.placed|event.placed}. Not {weather}. The {role} was supposed to be someone bigger, someone louder, someone who looked the part.\n\nBut {hook} doesn\'t care about appearances. Neither does {item}. {Character2} was the only one paying attention when {item} changed hands and the balance of power shifted. Turns out, being underestimated is its own kind of advantage. A {tone} tale about {wish.bare} — proof that {moral.about} has nothing to do with size.',

  // Template 64 — The Forgotten Garden
  // Voice: bedtime-whisper | Opening: sensory | Temporal: linear | Dynamic: strangers | Agency: proactive
  // Arc: dark-to-light | Tension: secret | Stakes: belonging | Connection: discovery | Hook-role: background
  // Moral: woven | Mystery: withhold-hook | Spotlight: setting
  // Structure: two-para | Rhythm: flowing | Item-role: key | Scale: intimate | Genre-feel: fable
  // Shape: hidden-garden
  'Behind everything else {setting.placed|event.placed} — past the noise, past the forgetting — there was a place nobody visited anymore. {Weather}, {character1.emotional} found the way in. The {item.bare} fit the lock like it had been waiting.\n\nInside, everything was overgrown and quiet and alive. {Character2}, a {role} with nowhere else to go, had been there all along. {Hook} was what closed it off in the first place. But some things heal when you tend to them — a {tone} kind of healing, built from {wish.bare} and {moral.about}.',

  // Template 65 — Wanting to Be Real
  // Voice: confessional | Opening: declarative | Temporal: linear | Dynamic: helper | Agency: proactive
  // Arc: steady-build | Tension: promise | Stakes: identity | Connection: causal | Hook-role: central
  // Moral: woven | Mystery: teaser | Spotlight: character-emotional
  // Structure: two-para | Rhythm: flowing | Item-role: symbol | Scale: local | Genre-feel: fable
  // Shape: becoming-real
  '{Character1.emotional} wanted one thing — to be real. Not pretend-real. Not almost-real. The kind of real that {character2} was without even trying. {Setting.placed|event.placed}, {weather}, that seemed like the hardest thing in the world.\n\n{Hook} was supposed to be the test. {Item} was supposed to be the proof. But the {role} who watched over them knew the truth: becoming real has nothing to do with tests. It\'s {aTone} story about {wish.bare} — where {moral.about} turns out to be the only thing that was ever real at all.',

  // Template 66 — The Thaw
  // Voice: legend | Opening: contrast | Temporal: linear | Dynamic: protector-ward | Agency: reluctant
  // Arc: dark-to-light | Tension: forbidden | Stakes: trust | Connection: causal | Hook-role: looming-threat
  // Moral: tested | Mystery: teaser | Spotlight: character-emotional
  // Structure: two-para | Rhythm: mixed | Item-role: burden | Scale: local | Genre-feel: fairy-tale
  // Shape: power-within
  '{Character1.emotional} kept everyone at arm\'s length — not out of cruelty, but out of fear. {Setting.placed|event.placed}, {weather}, {hook} was the proof: the power inside them was too much. Too wild. Too dangerous to let anyone close.\n\n{Character2} came close anyway. The {role} brought {item} — not as a weapon, not as a shield, but as something to hold together. The fear didn\'t vanish. It thawed. A {tone} story about {wish.bare} and whether {moral.about} is stronger than what you\'re afraid of.',

  // Template 67 — Until Nothing Was Left
  // Voice: bedtime-whisper | Opening: declarative | Temporal: linear | Dynamic: helper | Agency: passive
  // Arc: wind-down | Tension: scarcity | Stakes: personal-loss | Connection: symbolic | Hook-role: background
  // Moral: woven | Mystery: laid-out | Spotlight: character-both
  // Structure: two-para | Rhythm: flowing | Item-role: last | Scale: intimate | Genre-feel: fable
  // Shape: giving-everything
  '{Character1.emotional} gave. That\'s what they did — {setting.placed|event.placed}, {weather}, whenever {character2} needed something. First it was small things. Then it was {item}. Then it was more than that.\n\n{Hook} came and went, and still the {role} gave. Not because anyone asked. Because that\'s who they were. By the end, what was left was {tone} and quiet and enough. All they wanted was {wish}. A story about {moral.about} — and how the giving was the gift.',

  // Template 68 — The Dubious Guide
  // Voice: campfire | Opening: dialogue-cold | Temporal: linear | Dynamic: fragile-alliance | Agency: proactive
  // Arc: surprise-pivot | Tension: secret | Stakes: trust | Connection: causal | Hook-role: central
  // Moral: label | Mystery: teaser | Spotlight: character-both
  // Structure: two-para | Rhythm: mixed | Item-role: key | Scale: expanding | Genre-feel: adventure-serial
  // Shape: treasure-hunt
  '"I know where it is," said {character2}. "I just need a {role} brave enough to come with me." {Character1.emotional} should have said no. {Weather}, {setting.placed|event.placed}, following a stranger toward {hook} was the worst idea imaginable.\n\n{Item} was the map — or the key — or the only thing keeping them honest. Hard to tell which. The treasure hunt got {tone} fast, and trust was the rarest thing they found. All they wanted was {wish}. A tale about {moral.about}.',

  // ---------------------------------------------------------------
  // Round 3 — Templates 69–78
  // ---------------------------------------------------------------

  // Template 69 — Friends Who Shouldn't Be
  // Voice: legend | Opening: declarative | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: steady-build | Tension: forbidden | Stakes: belonging | Connection: contradictory | Hook-role: central
  // Moral: woven | Mystery: teaser | Spotlight: character-both
  // Structure: two-para | Rhythm: flowing | Item-role: symbol | Scale: local | Genre-feel: fable
  // Shape: forbidden-friendship
  '{Setting.placed|event.placed}, {character1.emotional} and {character2} were never supposed to be friends. Everyone knew the rules. The {role} and the outsider don\'t mix — not {weather}, not ever. {Hook} was the reason why.\n\n{Item} was how it started — passed between them when nobody was looking. The friendship grew in secret, {tone} and stubborn, until the rules didn\'t matter as much as {wish.bare}. A story about {moral.about} — and how the best friendships are the ones you\'re not supposed to have.',

  // Template 70 — The Place Where No One Grows Up
  // Voice: direct-address | Opening: question-hook | Temporal: linear | Dynamic: strangers | Agency: proactive
  // Arc: peak-resolve | Tension: impossible-choice | Stakes: identity | Connection: symbolic | Hook-role: central
  // Moral: woven | Mystery: question-based | Spotlight: setting
  // Structure: two-para | Rhythm: mixed | Item-role: catalyst | Scale: local | Genre-feel: fairy-tale
  // Shape: never-growing-up
  'What if you never had to leave? {Setting|event}, {weather}, is the kind of place where nothing changes — where {hook} is just another game and tomorrow is exactly like today. {Character1.emotional} loves it here. {Character2} isn\'t so sure.\n\nThe {role} says you can stay forever. {Item} makes it tempting. But something about {wish.bare} only makes sense if you\'re willing to let things change. A {tone} story about {moral.about} — and the courage it takes to leave a place that wants you to stay.',

  // Template 71 — What You Were Taught to Fear
  // Voice: laconic | Opening: contrast | Temporal: linear | Dynamic: believer-skeptic | Agency: reactive
  // Arc: surprise-pivot | Tension: mismatch | Stakes: trust | Connection: contradictory | Hook-role: reframed
  // Moral: label | Mystery: teaser | Spotlight: character-both
  // Structure: two-para | Rhythm: short-punchy | Item-role: key | Scale: local | Genre-feel: neutral
  // Shape: fear-turned-friendship
  '{Character1.emotional} was trained for one thing: make sure nobody {setting.placed|event.placed} ever comes face to face with {hook}. Simple job. Important job. Then {character2} showed up — small, loud, and completely unafraid.\n\n{Weather}, the {role} who was supposed to be scary discovered something inconvenient: the thing on the other side of the door needed help. {Item} was the proof. The fear fell apart. The friendship didn\'t. A {tone} tale about {wish.bare} and {moral.about}.',

  // Template 72 — The Lonely Caretaker
  // Voice: bedtime-whisper | Opening: sensory | Temporal: linear | Dynamic: strangers | Agency: passive
  // Arc: dark-to-light | Tension: scarcity | Stakes: belonging | Connection: discovery | Hook-role: background
  // Moral: woven | Mystery: laid-out | Spotlight: character-emotional
  // Structure: two-para | Rhythm: flowing | Item-role: symbol | Scale: intimate | Genre-feel: neutral
  // Shape: lonely-caretaker
  '{Weather}, {character1.emotional} did what they always did — tended to {setting|event}, alone, the way they had for longer than anyone remembered. {Item} was the one thing they\'d saved. Everything else was routine. {Hook} was just part of the landscape.\n\nThen {character2} arrived — from somewhere far, somewhere different — and the {role} who\'d forgotten what company felt like remembered all at once. A {tone} story about {wish.bare} and {moral.about}, told in the quietest possible voice.',

  // Template 73 — The Homebody Dragged Out
  // Voice: campfire | Opening: interrupted-routine | Temporal: linear | Dynamic: reluctant-partners | Agency: reluctant
  // Arc: steady-build | Tension: mismatch | Stakes: implied | Connection: causal | Hook-role: catalyst
  // Moral: label | Mystery: laid-out | Spotlight: character-emotional
  // Structure: two-para | Rhythm: mixed | Item-role: key | Scale: expanding | Genre-feel: adventure-serial
  // Shape: reluctant-adventure
  '{Character1.emotional} liked things exactly the way they were — {weather}, a comfortable spot {setting.placed|event.placed}, and absolutely no surprises. That was the plan. That had always been the plan. Then {character2}, a {role} with a terrible sense of timing, knocked on the door.\n\n"There\'s something you need to see." {Hook} wasn\'t optional, apparently. Neither was {item}. The adventure that followed was {tone} and exhausting and nothing like staying home. All they wanted was {wish}. A tale about {moral.about}.',

  // Template 74 — Small but Mighty
  // Voice: rhetorical | Opening: contrast | Temporal: linear | Dynamic: strangers | Agency: proactive
  // Arc: steady-build | Tension: mismatch | Stakes: identity | Connection: causal | Hook-role: central
  // Moral: label | Mystery: laid-out | Spotlight: character-emotional
  // Structure: two-para | Rhythm: mixed | Item-role: catalyst | Scale: local | Genre-feel: tall-tale
  // Shape: small-but-mighty
  'Here\'s what they didn\'t know about {character1.emotional}: everything. {Setting.placed|event.placed}, {weather}, being small meant being overlooked. The {role} in charge had made that clear. {Hook} was supposed to be too big for someone like them.\n\n{Character2} was the only one paying attention when {item} changed hands and the balance of power shifted. Turns out, being underestimated is its own kind of advantage. A {tone} tale about {wish.bare} — where {moral.about} belongs to whoever is clever enough to claim it.',

  // Template 75 — What Makes You Real
  // Voice: bedtime-whisper | Opening: question-hook | Temporal: linear | Dynamic: helper | Agency: passive
  // Arc: wind-down | Tension: question | Stakes: identity | Connection: symbolic | Hook-role: background
  // Moral: woven | Mystery: question-based | Spotlight: character-emotional
  // Structure: two-para | Rhythm: flowing | Item-role: comfort | Scale: intimate | Genre-feel: fable
  // Shape: what-makes-you-real
  'When does something become real? {Character1.emotional} didn\'t know — not yet. {Setting.placed|event.placed}, {weather}, they sat with {item}, worn thin and held close, wondering if being loved long enough could change what you are.\n\n{Character2}, the {role} who\'d seen it happen before, said nothing. {Hook} wasn\'t the kind of question you answer with words. Real isn\'t about being new or shiny. It\'s {aTone} feeling — the kind that comes from {wish.bare} and {moral.about}.',

  // Template 76 — Take from the Powerful
  // Voice: campfire | Opening: declarative | Temporal: linear | Dynamic: fragile-alliance | Agency: proactive
  // Arc: surprise-pivot | Tension: forbidden | Stakes: trust | Connection: causal | Hook-role: central
  // Moral: tested | Mystery: teaser | Spotlight: character-both
  // Structure: two-para | Rhythm: short-punchy | Item-role: key | Scale: local | Genre-feel: adventure-serial
  // Shape: noble-thief
  'The plan was simple: take {item} from the {role} who didn\'t deserve it and give it to {character2}, who did. {Character1.emotional} had done this kind of thing before. {Setting.placed|event.placed}, {weather}, it was practically tradition.\n\nBut {hook} complicated everything. The line between right and wrong got blurry fast. The theft was {tone}. The giving was harder. All they wanted was {wish}. A tale about {moral.about} — and whether stealing can ever be the right thing to do.',

  // Template 77 — Those Who Came Before
  // Voice: legend | Opening: sensory | Temporal: flashback | Dynamic: seeker | Agency: proactive
  // Arc: dark-to-light | Tension: secret | Stakes: belonging | Connection: inheritance | Hook-role: past-event
  // Moral: woven | Mystery: withhold-hook | Spotlight: character-emotional
  // Structure: three-beat | Rhythm: flowing | Item-role: symbol | Scale: local | Genre-feel: myth
  // Shape: remembering
  'The music came first — faint, {weather}, drifting through {setting|event} like it had been waiting for someone to listen. {Character1.emotional} followed it. The {role} in the family said not to. They followed it anyway.\n\n{Character2} was on the other side — not gone, just forgotten. {Item} was the bridge between them. {Hook} had kept them apart all this time.\n\nBut memory is stubborn. And love doesn\'t stop just because someone isn\'t here anymore. A {tone} story about {wish.bare} and {moral.about}.',

  // Template 78 — The Dream Collector
  // Voice: bedtime-whisper | Opening: scalar-shift | Temporal: linear | Dynamic: helper | Agency: passive
  // Arc: calm | Tension: discovery | Stakes: implied | Connection: symbolic | Hook-role: background
  // Moral: woven | Mystery: laid-out | Spotlight: character-both
  // Structure: two-para | Rhythm: flowing | Item-role: gift | Scale: intimate | Genre-feel: lullaby
  // Shape: dream-collector
  'Far beyond {setting}, where {weather.noun} turns to starlight, {character2} — the tallest, quietest {role} you\'ve never met — collects things most people forget by morning. Dreams, mostly. Kept safe in {item}.\n\n{Character1.emotional} was supposed to be asleep. But tonight, {hook} changed the routine. The dream that arrived was {tone} and enormous and exactly the right one. All it carried was {wish.bare} and the gentle truth that {moral.about}.',
];
