import general from './general/atmospheric.json';
import fantasy from './fantasy/magical_weather.json';
import modern from './modern/modern_weather.json';
import ocean from './ocean/ocean_weather.json';
import scifi from './scifi/scifi_weather.json';

function buildWeather(tuples) {
  return tuples.map(([full, adj, noun]) => ({ full, adj, noun }));
}

// { world: [{ full, adj, noun }, ...] }
export const weatherByWorld = {
  general: buildWeather(general.weather),
  fantasy: buildWeather(fantasy.weather),
  modern: buildWeather(modern.weather),
  ocean: buildWeather(ocean.weather),
  scifi: buildWeather(scifi.weather),
};

/**
 * Get deduplicated weather entries for the given worlds.
 * @param {string[]} worlds - World keys (e.g. ['general', 'fantasy'])
 * @returns {{ full: string, adj: string, noun: string }[]}
 */
export function getWeather(worlds) {
  const seen = new Set();
  const results = [];
  for (const world of worlds) {
    for (const entry of weatherByWorld[world] || []) {
      if (!seen.has(entry.full)) {
        seen.add(entry.full);
        results.push(entry);
      }
    }
  }
  return results;
}
