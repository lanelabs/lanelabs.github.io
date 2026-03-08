// Occasion files (bedtime app use case)
import generalOccasions from './general/occasions.json';
import fantasyOccasions from './fantasy/occasions.json';
import modernOccasions from './modern/occasions.json';
import oceanOccasions from './ocean/occasions.json';
import scifiOccasions from './scifi/occasions.json';

// { world: [[name, description], ...] }
export const occasionsByWorld = {
  general: generalOccasions.occasions,
  fantasy: fantasyOccasions.occasions,
  modern: modernOccasions.occasions,
  ocean: oceanOccasions.occasions,
  scifi: scifiOccasions.occasions,
};

/**
 * Get deduplicated event/occasion names for the given worlds.
 * @param {string[]} worlds - World keys (e.g. ['general', 'fantasy'])
 * @returns {string[]} Event name strings (e.g. "A wedding", "A dragon hatching")
 */
export function getEventNames(worlds) {
  const seen = new Set();
  const names = [];
  for (const world of worlds) {
    for (const [name] of occasionsByWorld[world] || []) {
      if (!seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }
  }
  return names;
}
