// General
import agriculture from './general/agriculture.json';
import commerce from './general/commerce.json';
import crafts from './general/crafts.json';
import domestic from './general/domestic.json';
import entertainment from './general/entertainment.json';
import laborer from './general/laborer.json';
import scholarly from './general/scholarly.json';
import generalRoles from './general/roles.json';

// Fantasy
import criminal from './fantasy/criminal.json';
import government from './fantasy/government.json';
import magical from './fantasy/magical.json';
import military from './fantasy/military.json';
import religious from './fantasy/religious.json';
import royalty from './fantasy/royalty.json';
import fantasyRaces from './fantasy/races.json';
import fantasyRoles from './fantasy/roles.json';

// Modern
import modernProfessions from './modern/professions.json';

// Ocean
import oceanProfessions from './ocean/professions.json';

// Sci-Fi
import scifiProfessions from './scifi/professions.json';
import scifiRaces from './scifi/races.json';

// { world: [[name, description], ...] }
export const charactersByWorld = {
  general: [
    ...agriculture.characters,
    ...commerce.characters,
    ...crafts.characters,
    ...domestic.characters,
    ...entertainment.characters,
    ...laborer.characters,
    ...scholarly.characters,
    ...generalRoles.characters,
  ],
  fantasy: [
    ...criminal.characters,
    ...government.characters,
    ...magical.characters,
    ...military.characters,
    ...religious.characters,
    ...royalty.characters,
    ...fantasyRaces.characters,
    ...fantasyRoles.characters,
  ],
  modern: [
    ...modernProfessions.characters,
  ],
  ocean: [
    ...oceanProfessions.characters,
  ],
  scifi: [
    ...scifiProfessions.characters,
    ...scifiRaces.characters,
  ],
};

/**
 * Get deduplicated character names for the given worlds.
 * @param {string[]} worlds - World keys (e.g. ['general', 'fantasy'])
 * @returns {string[]} Character name strings
 */
export function getCharacterNames(worlds) {
  const seen = new Set();
  const names = [];
  for (const world of worlds) {
    for (const [name] of charactersByWorld[world] || []) {
      if (!seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }
  }
  return names;
}
