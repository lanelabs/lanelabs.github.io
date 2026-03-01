// Items: objects the characters find or use. Must be single nouns (no articles).
// Combined with a descriptor at render time: "Golden Map", "Ancient Key".
//
// TEMPLATE FIT — rendered with an article:
//   "discover {item}"         → "discover a golden map"
//   "drawn together by {item}" → "drawn together by a golden map"
//
// Each entry should be ONE specific item — never combine with "or"
// (split into separate entries instead).
export const items = [
  'Map',
  'Key',
  'Book',
  'Compass',
  'Lantern',
  'Thread',
  'Drum',
  'Herb',
  'Egg',
  'Pearl',
  'Feather',
  'Mirror',
  'Stone',
];
