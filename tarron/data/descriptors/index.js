// Adjective files (["Name", "Description"] tuples) — used by bedtime app
import generalAdj from './general/adjectives.json';
import fantasyAdj from './fantasy/adjectives.json';
import modernAdj from './modern/adjectives.json';
import oceanAdj from './ocean/adjectives.json';
import scifiAdj from './scifi/adjectives.json';

// { world: [[name, description], ...] }
export const adjectivesByWorld = {
  general: generalAdj.adjectives,
  fantasy: fantasyAdj.adjectives,
  modern: modernAdj.adjectives,
  ocean: oceanAdj.adjectives,
  scifi: scifiAdj.adjectives,
};

/**
 * Get deduplicated adjective names for the given worlds.
 * @param {string[]} worlds - World keys (e.g. ['general', 'fantasy'])
 * @returns {string[]} Adjective name strings
 */
export function getAdjectiveNames(worlds) {
  const seen = new Set();
  const names = [];
  for (const world of worlds) {
    for (const [name] of adjectivesByWorld[world] || []) {
      if (!seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }
  }
  return names;
}
