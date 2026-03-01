// Tones: the overall mood or atmosphere of the story. This is NOT what happens
// (that's conflict/mystery) or what the lesson is (that's moral) — it's how
// the story feels. A "silly" story about a stolen treasure plays completely
// differently than a "spooky" one.
//
// TEMPLATE FIT — used as an adjective and as a noun:
//   {tone}       → "cozy"       (default adjective)
//   {tone.noun}  → "warmth"     (noun form, for "a story of {tone.noun}")
//   {aTone}      → "a cozy"     (computed: a/an + adjective)
//
// Every entry MUST be an object with an explicit "noun" form since there's
// no way to auto-compute it from the adjective.
//
// Each entry should be ONE specific tone — never combine with "or"
// (split into separate entries instead).
export const tones = [
  { full: 'Silly', noun: 'humor' },
  { full: 'Cozy', noun: 'warmth' },
  { full: 'Spooky', noun: 'chills' },
  { full: 'Adventurous', noun: 'adventure' },
  { full: 'Mysterious', noun: 'mystery' },
  { full: 'Whimsical', noun: 'whimsy' },
  { full: 'Dreamy', noun: 'dreams' },
  { full: 'Suspenseful', noun: 'suspense' },
  { full: 'Heartwarming', noun: 'heart' },
  { full: 'Epic', noun: 'grandeur' },
  { full: 'Playful', noun: 'playfulness' },
  { full: 'Gentle', noun: 'gentleness' },
  { full: 'Bold', noun: 'boldness' },
  { full: 'Eerie', noun: 'eeriness' },
  { full: 'Lighthearted', noun: 'fun' },
  { full: 'Dramatic', noun: 'drama' },
  { full: 'Calm', noun: 'calm' },
  { full: 'Wondrous', noun: 'wonder' },
];
