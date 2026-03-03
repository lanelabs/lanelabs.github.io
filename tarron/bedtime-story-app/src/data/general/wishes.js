// Wishes / longings: the deep desire driving the character forward.
//
// FORMAT — Each entry is an object with two forms:
//   full: infinitive phrase starting with "To ..." (for "all they wanted was {wish}")
//   bare: gerund / noun phrase (for "about {wish.bare}")
//
// The conversion between infinitive and gerund can't be auto-computed,
// so both forms must be provided explicitly.
//
// Available template forms:
//   {wish}      → "to belong"     (infinitive, lowercased)
//   {wish.bare} → "belonging"     (gerund, lowercased)
//
// Keep entries universal — they should work across all worlds.
// Each entry should be a single, specific longing.
export const wishes = [
  { full: 'To belong', bare: 'belonging' },
  { full: 'To be brave enough', bare: 'being brave' },
  { full: 'To prove everyone wrong', bare: 'proving everyone wrong' },
  { full: 'To find their way home', bare: 'finding their way home' },
  { full: 'To be seen for who they really are', bare: 'being seen' },
  { full: 'To keep someone safe', bare: 'keeping someone safe' },
  { full: 'To be like everyone else', bare: 'fitting in' },
  { full: 'To be different from everyone else', bare: 'standing out' },
  { full: 'To finish what they started', bare: 'finishing what they started' },
  { full: 'To find a real friend', bare: 'finding a real friend' },
  { full: 'To be left alone', bare: 'being left alone' },
  { full: 'To understand why', bare: 'understanding why' },
  { full: 'To be strong enough', bare: 'being strong enough' },
  { full: 'To make something beautiful', bare: 'making something beautiful' },
  { full: 'To not be afraid anymore', bare: 'not being afraid anymore' },
  { full: 'To do something that matters', bare: 'doing something that matters' },
  { full: 'To be worth choosing', bare: 'being worth choosing' },
  { full: 'To make someone proud', bare: 'making someone proud' },
  { full: 'To find out the truth', bare: 'finding out the truth' },
  { full: 'To keep a promise they made long ago', bare: 'keeping a promise' },
  { full: 'To build something that lasts', bare: 'building something that lasts' },
  { full: 'To be remembered', bare: 'being remembered' },
  { full: 'To start over', bare: 'starting over' },
  { full: 'To fix what they broke', bare: 'fixing what they broke' },
  { full: 'To earn back what they lost', bare: 'earning back what they lost' },
  { full: 'To protect someone smaller', bare: 'protecting someone smaller' },
  { full: 'To be taken seriously', bare: 'being taken seriously' },
  { full: 'To find where they fit', bare: 'finding where they fit' },
  { full: 'To have one more chance', bare: 'having one more chance' },
  { full: 'To be enough', bare: 'being enough' },
];
