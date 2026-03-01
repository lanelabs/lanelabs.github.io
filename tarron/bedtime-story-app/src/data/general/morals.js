// Morals: the lesson or takeaway of the story. Mix of single-word virtues,
// kid-friendly phrased morals, and gentle faith-inspired lessons.
//
// TEMPLATE FIT — used in multiple ways across templates:
//   {moral}       → "courage" / "don't give up"     (default, lowercased)
//   {Moral}       → "Courage" / "Don't give up"     (auto-capitalised)
//   {moral.about} → "courage" / "never giving up"   (works after "about")
//   {moral.bare}  → same as default (no article to strip)
//
// Single-word morals stay as strings — their "about" form is auto-computed
// as the lowercase word (e.g. "courage"). Phrase morals are objects with an
// explicit "about" form since "about don't give up" doesn't read naturally.
//
// Items can be strings (single-word) or objects:
//   'Courage'                                          ← string, about = "courage"
//   { full: "Don't give up", about: "never giving up" } ← object, explicit about
//
// Each entry should be ONE specific lesson — never combine with "or"
// (split into separate entries instead).
export const morals = [
  // Single-word virtues (about form = lowercase, auto-computed)
  'Honesty',
  'Courage',
  'Kindness',
  'Sharing',
  'Humility',
  'Patience',
  'Gratitude',
  'Forgiveness',
  'Responsibility',
  'Empathy',
  'Curiosity',
  'Fairness',
  'Loyalty',
  'Respect',
  'Teamwork',
  'Generosity',
  'Compassion',

  // Kid-friendly phrased morals (need explicit "about" form)
  { full: "Don't tell lies", about: 'telling the truth' },
  { full: 'Keep your promises', about: 'keeping promises' },
  { full: "Don't give up", about: 'never giving up' },
  { full: "Be kind, even when others aren't", about: "being kind, even when others aren't" },
  { full: "It's okay to be different", about: 'being different' },
  { full: "It's okay to ask for help", about: 'asking for help' },
  { full: 'Everyone makes mistakes', about: 'learning from mistakes' },
  { full: 'Treat others the way you want to be treated', about: 'treating others well' },
  { full: "Don't judge by appearances", about: 'not judging by appearances' },
  { full: "Stand up for what's right", about: "standing up for what's right" },
  { full: 'Think before you act', about: 'thinking before you act' },
  { full: 'Slow and steady wins the race', about: 'patience and persistence' },
  { full: 'Actions speak louder than words', about: 'letting actions speak' },
  { full: 'Hard work pays off', about: 'hard work' },
  { full: 'Listen to good advice', about: 'listening to good advice' },
  { full: 'Be yourself', about: 'being yourself' },
  { full: "Don't take shortcuts", about: 'not taking shortcuts' },
  { full: 'True friends are worth more than treasure', about: 'true friendship' },
  { full: "Speak up when something's wrong", about: 'speaking up' },
  { full: 'Even the smallest person can make a big difference', about: 'making a difference, no matter your size' },
  { full: 'Sharing makes everyone richer', about: 'how sharing makes everyone richer' },
  { full: "Don't be greedy", about: 'not being greedy' },
  { full: 'Everyone has something to offer', about: 'everyone having something to offer' },
  { full: "You're braver than you think", about: 'being braver than you think' },
  { full: 'Big things can come from small beginnings', about: 'big things coming from small beginnings' },
  { full: 'Always try your best', about: 'always trying your best' },
  { full: 'Be brave enough to try something new', about: 'being brave enough to try something new' },

  // Faith-inspired morals (need explicit "about" form)
  { full: 'God loves you just the way you are', about: "God's unconditional love" },
  { full: 'Remember to ask God for help', about: 'asking God for help' },
  { full: 'All things are possible with God', about: "what's possible with God" },
  { full: "God has a plan, even when we can't see it", about: "trusting God's plan" },
  { full: 'Love your neighbor as yourself', about: 'loving your neighbor' },
  { full: 'God gives us strength when we feel weak', about: 'finding strength in God' },
  { full: 'Be thankful for what God has given you', about: "being thankful for God's gifts" },
  { full: 'God forgives us, so we should forgive others', about: 'forgiveness' },
  { full: 'You are never alone \u2014 God is always with you', about: 'never being alone with God' },
  { full: 'Use the gifts God gave you to help others', about: 'using your God-given gifts' },
  { full: 'Trust in God, even when things are hard', about: 'trusting God' },
  { full: "God helps us when we don't feel worthy", about: "God's help when we feel unworthy" },
  { full: 'Prayer can bring peace when you feel worried', about: 'the peace that prayer brings' },
  { full: 'Talk to God \u2014 He always listens', about: 'talking to God' },
  { full: "When you don't know what to do, pray about it", about: 'turning to prayer' },
  { full: 'Thank God for the good things, even the small ones', about: "gratitude for God's blessings" },
  { full: 'Pray for others, not just yourself', about: 'praying for others' },
  { full: 'God hears every prayer, even the quiet ones', about: 'God hearing every prayer' },
];
