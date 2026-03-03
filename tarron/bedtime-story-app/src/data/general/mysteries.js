// Mysteries: unknowns, puzzles, and things that demand discovery. Things that
// make you ask "what's going on?" — unexplained phenomena, missing pieces,
// hidden truths waiting to be uncovered. Should be world-neutral — vague enough
// to fit fantasy, sci-fi, modern, or ocean, but specific enough to spark curiosity
// and anchor a story.
//
// FORMAT — each entry is an object with:
//   full: noun phrase starting with "A/An" or "Something"
//   verb: event clause (works after "But", "until", "when")
//
// Resolved forms (shared with conflicts as {hook}):
//   {hook}      → "a forbidden secret"      (noun phrase, with article)
//   {hook.bare} → "forbidden secret"        (article stripped, auto-computed)
//   {hook.verb} → "a forbidden secret surfaced"  (event clause)
//
// Each entry should be ONE specific mystery — never combine with "or"
// (split into separate entries instead).
export const mysteries = [
  { full: 'A forbidden secret', verb: 'a forbidden secret surfaced' },
  { full: 'A lost memory', verb: 'a lost memory resurfaced' },
  { full: 'A riddle with no answer', verb: 'an unanswerable riddle appeared' },
  { full: 'A sealed door that won\'t open', verb: 'a sealed door refused to open' },
  { full: 'A stranger\'s warning', verb: 'a stranger arrived with a warning' },
  { full: 'A voice no one believes', verb: 'a voice spoke that no one believed' },
  { full: 'A signal from somewhere unknown', verb: 'a signal arrived from somewhere unknown' },
  { full: 'A secret identity revealed', verb: 'a secret identity was revealed' },
  { full: 'A map that leads somewhere unexpected', verb: 'a map led somewhere unexpected' },
  { full: 'A door that only opens once', verb: 'a door opened that would not open again' },
  { full: 'A message that arrives too late', verb: 'a message arrived too late' },
  { full: 'A friend who\'s gone missing', verb: 'a friend went missing' },
  { full: 'A shadow that moves on its own', verb: 'a shadow began moving on its own' },
  { full: 'A sound that only one person hears', verb: 'a sound began that only one could hear' },
  { full: 'A name no one remembers', verb: 'a name surfaced that no one remembered' },
  { full: 'A trail that appears at night', verb: 'a trail appeared in the night' },
  { full: 'A letter with no sender', verb: 'a letter arrived with no sender' },
  { full: 'A room that wasn\'t there before', verb: 'a room appeared that wasn\'t there before' },
  { full: 'A clock that runs backwards', verb: 'a clock began running backwards' },
  { full: 'A reflection that doesn\'t match', verb: 'a reflection stopped matching' },
  { full: 'A strange noise with no source', verb: 'a strange noise arose from nowhere' },
  { full: 'Something no one believed at first', verb: 'something happened that no one believed at first' },
  { full: 'An unexpected knock at the door', verb: 'an unexpected knock came at the door' },
  { full: 'Something that changed overnight', verb: 'something changed overnight' },
  { full: 'Something missing that no one noticed at first', verb: 'something went missing that no one noticed at first' },
];
