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
];
