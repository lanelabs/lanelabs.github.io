// Story shapes: the structural backbone of the plot — what kind of story it is.
//
// TEMPLATE FIT — must be a noun phrase starting with "A" or "An".
// Auto-computed forms:
//   {storyShape}      → "a quest"         (default, with article)
//   {storyShape.bare} → "quest"           (article stripped automatically)
//
// Do NOT use verb phrases like "Learning..." or "Solving..." — they break in
// possessive slots ("Their learning..." doesn't work).
//
// To add custom forms, convert an entry to an object:
//   BEFORE: 'A quest'
//   AFTER:  { full: 'A quest', verb: 'go on a quest' }
//
// Each entry should be ONE specific shape — never combine with "or"
// (split into separate entries instead).
export const storyShapes = [
  'A quest',
  'A rescue mission',
  'A journey home',
  'A competition',
  'A discovery',
  'A transformation',
  'A case of mistaken identity',
  'An unlikely friendship',
  'A race against time',
  'An unexpected adventure',
  'A test of courage',
  'A hidden truth to uncover',
  'A daring escape',
  'A search for something lost',
  'A puzzle to solve',
  'A project to build together',
  'A stand against a bully',
  'A trust to be earned',
  'A fear to overcome',
  'A fresh start in a new place',
  'A precious thing to protect',
  'An important message to deliver',
  'A mistake to make right',
  'A stranger in need',
  'A big event to prepare for',
];
