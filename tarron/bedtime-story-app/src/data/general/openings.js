// Openings: creative constraints for how to START the story.
//
// TEMPLATE FIT — must be a noun phrase. Auto-computed forms:
//   {opening}      → "a quiet moment alone"  (default, with article)
//   {opening.bare} → "quiet moment alone"    (article stripped)
//
// Do NOT use full clauses with verbs like "Everything has been..." or
// "The character is..." — they break in slots like "begins with {opening}".
// Rephrase as noun phrases. To add custom forms, convert to an object:
//   BEFORE: 'A quiet moment alone'
//   AFTER:  { full: 'A quiet moment alone', during: 'during a quiet moment alone' }
//
// Each entry should be ONE specific thing — never combine with "or"
// (e.g. "A celebration or festival" → split into "A celebration" and "A festival").
export const openings = [
  // Opening scenes — what kind of moment to start with
  'A quiet moment alone',
  'A group gathered together',
  'Someone arriving somewhere new',
  'A celebration',
  'A festival',
  'Someone waking up',
  'Someone saying goodbye',
  'Two characters meeting for the first time',
  'Someone watching from a distance',
  'A meal being shared',
  'Someone practicing',
  'Someone training',
  'Someone lost',
  'A journey already underway',

  // Opening techniques — how to tell the beginning
  'A question on the character\'s mind',
  'A vivid sound',
  'A vivid smell',
  'A conversation already underway',
  'The middle of the action',
  'A description of a favorite thing',
  'A small detail that hints at something bigger',
  'A vivid first impression',
  'An everyday routine',

  // Starting situations — the status quo before the conflict
  'A long stretch of peace',
  'A big day everyone has been preparing for',
  'An ordinary, uneventful day',
  'A slowly worsening situation',
  'A recent accomplishment',
  'A new season',
  'A change in the air',
  'A long wait finally over',
  'A character about to leave home',
  'A spreading rumor',
  'An old routine about to break',
];
