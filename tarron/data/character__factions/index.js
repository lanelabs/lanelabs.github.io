// General
import alliances from './general/alliances.json';
import commercial from './general/commercial.json';
import governments from './general/governments.json';
import institutions from './general/institutions.json';
import military from './general/military.json';
import organizations from './general/organizations.json';
import secretAndCriminal from './general/secret_and_criminal.json';
import social from './general/social.json';

// { world: [[name, description], ...] }
export const factionsByWorld = {
  general: [
    ...alliances.factions,
    ...commercial.factions,
    ...governments.factions,
    ...institutions.factions,
    ...military.factions,
    ...organizations.factions,
    ...secretAndCriminal.factions,
    ...social.factions,
  ],
  fantasy: [],
  modern: [],
  ocean: [],
  scifi: [],
};

/**
 * Get deduplicated faction names for the given worlds.
 * @param {string[]} worlds - World keys (e.g. ['general', 'fantasy'])
 * @returns {string[]} Faction name strings
 */
export function getFactionNames(worlds) {
  const seen = new Set();
  const names = [];
  for (const world of worlds) {
    for (const [name] of factionsByWorld[world] || []) {
      if (!seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }
  }
  return names;
}
