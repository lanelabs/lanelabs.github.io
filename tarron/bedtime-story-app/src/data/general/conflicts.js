// Conflicts: opposition, tension, and struggle. Things that pit characters
// against each other, against society, or against impossible odds. Should be
// world-neutral — vague enough to fit fantasy, sci-fi, modern, or ocean, but specific
// enough to provide real creative constraint for a story.
//
// FORMAT — each entry is an object with:
//   full: noun phrase starting with "A/An" or "Something/Two"
//   verb: event clause (works after "But", "until", "when")
//
// Resolved forms:
//   {hook}      → "a broken promise"      (noun phrase, with article)
//   {hook.bare} → "broken promise"        (article stripped, auto-computed)
//   {hook.verb} → "a promise was broken"  (event clause)
//
// Each entry should be ONE specific conflict — never combine with "or"
// (split into separate entries instead).
export const conflicts = [
  { full: 'A broken promise', verb: 'a promise was broken' },
  { full: 'A stolen treasure', verb: 'a treasure was stolen' },
  { full: 'A fierce rivalry', verb: 'a fierce rivalry erupted' },
  { full: 'A dangerous journey', verb: 'a dangerous journey began' },
  { full: 'A powerful enemy', verb: 'a powerful enemy appeared' },
  { full: 'A betrayal by a friend', verb: 'a friend betrayed them' },
  { full: 'A ticking clock', verb: 'the clock started ticking' },
  { full: 'An impossible choice', verb: 'an impossible choice arrived' },
  { full: 'A looming storm', verb: 'a storm began to loom' },
  { full: 'A missing leader', verb: 'the leader went missing' },
  { full: 'A divided community', verb: 'the community split apart' },
  { full: 'A false accusation', verb: 'a false accusation was made' },
  { full: 'A debt that must be repaid', verb: 'a debt came due' },
  { full: 'A vanishing resource', verb: 'a vital resource began to vanish' },
  { full: 'A test of loyalty', verb: 'loyalty was put to the test' },
  { full: 'A deal with a hidden cost', verb: 'the hidden cost came due' },
  { full: 'A power that corrupts', verb: 'the power began to corrupt' },
  { full: 'A trap with no obvious escape', verb: 'the trap closed around them' },
  { full: 'A rule that seems unjust', verb: 'an unjust rule was imposed' },
  { full: 'A home that can\'t be returned to', verb: 'the way home was lost' },
  { full: 'Something precious that\'s fading', verb: 'something precious began to fade' },
  { full: 'A lie that\'s gone too far', verb: 'the lie went too far' },
  { full: 'A challenge that seems unwinnable', verb: 'an unwinnable challenge arose' },
  { full: 'A standoff between two sides', verb: 'two sides reached a standoff' },
  { full: 'A gift that comes with a price', verb: 'the gift\'s price was revealed' },
  { full: 'A race with everything at stake', verb: 'a race began with everything at stake' },
  { full: 'A leader who can\'t be trusted', verb: 'the leader proved untrustworthy' },
  { full: 'A wall that divides two worlds', verb: 'a wall rose between two worlds' },
  { full: 'A rule that\'s about to be broken', verb: 'the rule was broken' },
  { full: 'A day that changes everything', verb: 'everything changed in a single day' },

  // Identity & self
  { full: 'A secret that threatens to come out', verb: 'a secret threatened to come out' },
  { full: 'A past that catches up', verb: 'the past caught up' },
  { full: 'A fear that must be faced', verb: 'a deep fear surfaced' },
  { full: 'Two loyalties that can\'t both be kept', verb: 'two loyalties collided' },

  // Relationships
  { full: 'A friendship on the verge of ending', verb: 'a friendship nearly ended' },
  { full: 'A grudge that won\'t die', verb: 'an old grudge resurfaced' },
  { full: 'A misunderstanding that spirals', verb: 'a misunderstanding spiraled' },
  { full: 'A newcomer who disrupts everything', verb: 'a newcomer disrupted everything' },
  { full: 'A promise to the wrong person', verb: 'a promise was made to the wrong person' },

  // Society & authority
  { full: 'A tradition no one dares question', verb: 'someone dared question the tradition' },
  { full: 'A stranger who isn\'t welcome', verb: 'a stranger arrived unwelcome' },
  { full: 'A voice that no one will listen to', verb: 'a voice went unheard' },
  { full: 'A crown no one wants', verb: 'a crown was left unclaimed' },
  { full: 'A prophecy that must be fulfilled', verb: 'a prophecy came due' },
  { full: 'A weapon that can\'t be controlled', verb: 'a weapon spiraled out of control' },

  // Things going wrong
  { full: 'A truth no one wants to hear', verb: 'an unwelcome truth emerged' },
  { full: 'A warning that was ignored', verb: 'a warning went ignored' },
  { full: 'An old wound reopened', verb: 'an old wound reopened' },
  { full: 'A plan that\'s falling apart', verb: 'the plan began falling apart' },
  { full: 'A boundary that\'s been crossed', verb: 'a boundary was crossed' },
  { full: 'A sacrifice no one asked for', verb: 'an unexpected sacrifice was demanded' },

  // Quest-derived (from RPG-Gen)
  { full: 'A curse that must be broken', verb: 'a curse took hold' },
  { full: 'A land that is slowly dying', verb: 'the land began to die' },
  { full: 'A festival disrupted by chaos', verb: 'chaos disrupted the festival' },
  { full: 'A bridge that has been destroyed', verb: 'the bridge was destroyed' },
  { full: 'A drought that threatens everyone', verb: 'a drought threatened everyone' },
  { full: 'A treasure everyone wants', verb: 'a treasure was discovered that everyone wanted' },
  { full: 'A portal that should not have opened', verb: 'a portal opened that should not have' },
  { full: 'A pact that binds unwilling parties', verb: 'a pact bound unwilling parties together' },
  { full: 'A kingdom without an heir', verb: 'the kingdom was left without an heir' },
  { full: 'A forest that is shrinking', verb: 'the forest began to shrink' },
  { full: 'A creature that will not leave', verb: 'a creature arrived and would not leave' },
  { full: 'A song that changes those who hear it', verb: 'a song changed those who heard it' },
  { full: 'An alliance on the verge of breaking', verb: 'the alliance began to fracture' },
  { full: 'A secret passage discovered', verb: 'a secret passage was discovered' },
  { full: 'A missing artifact', verb: 'a vital artifact went missing' },
];
