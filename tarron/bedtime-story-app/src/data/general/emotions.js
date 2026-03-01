// Emotions: how the main character feels at the start of the story. This is
// distinct from tone (the mood of the whole story) and from moral (the lesson).
// Emotion gives the storyteller an inner arc — the character starts feeling X,
// and the story is partly about how that feeling changes.
//
// Split into two lists for template rendering:
//   preEmotions  — adjectives that go BEFORE the character: "a scared farmer"
//   postEmotions — phrases that go AFTER the character:    "a farmer who is afraid of the dark"
//
// TEMPLATE FIT:
//   preEmotions  — must work as "a {emotion} {character}": "a scared farmer"
//   postEmotions — must work as "a {character} who is {emotion}": "a farmer who is afraid of the dark"
//
// When picking an emotion, combine both lists and choose one at random so every
// item has an equal chance regardless of which list it's in.
//
// Each entry should be ONE specific emotion — never combine with "or"
// (split into separate entries instead).

export const preEmotions = [
  'scared',
  'lonely',
  'curious',
  'jealous',
  'homesick',
  'excited',
  'embarrassed',
  'proud',
  'worried',
  'hopeful',
  'brave but unsure',
  'angry',
  'confused',
  'determined',
  'shy',
  'restless',
  'grateful',
  'overwhelmed',
  'stubborn',
  'guilty',
  'impatient',
];

export const postEmotions = [
  'eager to prove themselves',
  'left out',
  'afraid of the dark',
  'missing someone',
];

// Combined list for backward-compatible access (list view still uses this).
export const emotions = [...preEmotions, ...postEmotions];
