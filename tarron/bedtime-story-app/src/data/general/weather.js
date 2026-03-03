// Weather: atmospheric conditions that color the scene. Should be
// world-neutral — evocative enough to shape mood but not tied to any world.
// Must be a prepositional/conjunction phrase (starting with "during", "on",
// "under", "in", "as", "at") so it attaches naturally to a setting.
//
// TEMPLATE FIT — placed after a setting or at the start of a sentence:
//   {weather}        → "during a thunderstorm"
//   {Weather}        → "During a thunderstorm"
//   {weather.adj}    → "stormy"          (single adjective form)
//   {weather.noun}   → "the thunderstorm" (noun phrase, works as subject/object)
//   {aWeatherAdj}    → "a stormy"        (computed: a/an + adj, for "{aWeatherAdj} castle")
//
// Items can be strings (adj auto-computed is NOT possible) or objects.
// Because there's no way to auto-compute an adjective or noun from a phrase,
// every entry MUST be an object with explicit "adj" and "noun" forms.
//
// Each entry should be ONE specific condition — never combine with "or"
// (split into separate entries instead).
export const weather = [
  { full: 'during a thunderstorm', adj: 'stormy', noun: 'the thunderstorm' },
  { full: 'on a foggy morning', adj: 'foggy', noun: 'the fog' },
  { full: 'under a blazing sun', adj: 'sun-scorched', noun: 'the blazing sun' },
  { full: 'in the pouring rain', adj: 'rain-soaked', noun: 'the rain' },
  { full: 'on a perfectly still night', adj: 'still', noun: 'the stillness' },
  { full: 'during a snowfall', adj: 'snowy', noun: 'the snow' },
  { full: 'as the wind picks up', adj: 'windswept', noun: 'the wind' },
  { full: 'under heavy clouds', adj: 'overcast', noun: 'the clouds' },
  { full: 'on a crisp, clear day', adj: 'clear', noun: 'the clear sky' },
  { full: 'during a heatwave', adj: 'sweltering', noun: 'the heatwave' },
  { full: 'in a thick mist', adj: 'misty', noun: 'the mist' },
  { full: 'as a storm rolls in', adj: 'stormy', noun: 'the storm' },
  { full: 'on the coldest night of the year', adj: 'freezing', noun: 'the cold' },
  { full: 'under a full moon', adj: 'moonlit', noun: 'the full moon' },
  { full: 'at golden hour', adj: 'golden', noun: 'the golden light' },
  { full: 'at dawn', adj: 'dawn-lit', noun: 'the dawn' },
  { full: 'at dusk', adj: 'dusky', noun: 'the dusk' },
  { full: 'during a gentle breeze', adj: 'breezy', noun: 'the breeze' },
  { full: 'in the first frost', adj: 'frosty', noun: 'the frost' },
  { full: 'as autumn leaves fall', adj: 'autumn', noun: 'the falling leaves' },
  { full: 'on a drizzly evening', adj: 'drizzly', noun: 'the drizzle' },
  { full: 'under a starless sky', adj: 'dark', noun: 'the darkness' },
  { full: 'in the twilight', adj: 'twilit', noun: 'the twilight' },
];
