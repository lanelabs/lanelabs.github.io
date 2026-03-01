// Weather: atmospheric conditions that color the scene. Should be
// genre-neutral — evocative enough to shape mood but not tied to any genre.
// Must be a prepositional/conjunction phrase (starting with "during", "on",
// "under", "in", "as", "at") so it attaches naturally to a setting.
//
// TEMPLATE FIT — placed after a setting or at the start of a sentence:
//   {weather}        → "during a thunderstorm"
//   {Weather}        → "During a thunderstorm"
//   {weather.adj}    → "stormy"          (single adjective form)
//   {aWeatherAdj}    → "a stormy"        (computed: a/an + adj, for "{aWeatherAdj} castle")
//
// Items can be strings (adj auto-computed is NOT possible) or objects.
// Because there's no way to auto-compute an adjective from a phrase,
// every entry MUST be an object with an explicit "adj" form.
//
// Each entry should be ONE specific condition — never combine with "or"
// (split into separate entries instead).
export const weather = [
  { full: 'during a thunderstorm', adj: 'stormy' },
  { full: 'on a foggy morning', adj: 'foggy' },
  { full: 'under a blazing sun', adj: 'sun-scorched' },
  { full: 'in the pouring rain', adj: 'rain-soaked' },
  { full: 'on a perfectly still night', adj: 'still' },
  { full: 'during a snowfall', adj: 'snowy' },
  { full: 'as the wind picks up', adj: 'windswept' },
  { full: 'under heavy clouds', adj: 'overcast' },
  { full: 'on a crisp, clear day', adj: 'clear' },
  { full: 'during a heatwave', adj: 'sweltering' },
  { full: 'in a thick mist', adj: 'misty' },
  { full: 'as a storm rolls in', adj: 'stormy' },
  { full: 'on the coldest night of the year', adj: 'freezing' },
  { full: 'under a full moon', adj: 'moonlit' },
  { full: 'at golden hour', adj: 'golden' },
];
