// General
import animals from './general/animals.json';
import domesticated from './general/domesticated.json';
import prehistoric from './general/prehistoric.json';

// Fantasy
import aberrations from './fantasy/aberrations.json';
import celestials from './fantasy/celestials.json';
import constructs from './fantasy/constructs.json';
import dndClassics from './fantasy/d_d_classics.json';
import elementals from './fantasy/elementals.json';
import exotic from './fantasy/exotic.json';
import fey from './fantasy/fey.json';
import fiends from './fantasy/fiends.json';
import insects from './fantasy/insects.json';
import lycanthropes from './fantasy/lycanthropes.json';
import mythological from './fantasy/mythological.json';
import oozes from './fantasy/oozes.json';
import swarms from './fantasy/swarms.json';
import undead from './fantasy/undead.json';

// Modern
import pets from './modern/pets.json';

// Ocean
import aquatic from './ocean/aquatic.json';
import marine from './ocean/marine.json';

// Sci-Fi
import scifi from './scifi/scifi.json';

// { world: [[name, description], ...] }
export const creaturesByWorld = {
  general: [
    ...animals.creatures,
    ...domesticated.creatures,
    ...prehistoric.creatures,
  ],
  fantasy: [
    ...aberrations.creatures,
    ...celestials.creatures,
    ...constructs.creatures,
    ...dndClassics.creatures,
    ...elementals.creatures,
    ...exotic.creatures,
    ...fey.creatures,
    ...fiends.creatures,
    ...insects.creatures,
    ...lycanthropes.creatures,
    ...mythological.creatures,
    ...oozes.creatures,
    ...swarms.creatures,
    ...undead.creatures,
  ],
  modern: [
    ...pets.creatures,
  ],
  ocean: [
    ...aquatic.creatures,
    ...marine.creatures,
  ],
  scifi: [
    ...scifi.creatures,
  ],
};

/**
 * Get deduplicated creature names for the given worlds.
 * @param {string[]} worlds - World keys (e.g. ['general', 'fantasy'])
 * @returns {string[]} Creature name strings
 */
export function getCreatureNames(worlds) {
  const seen = new Set();
  const names = [];
  for (const world of worlds) {
    for (const [name] of creaturesByWorld[world] || []) {
      if (!seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }
  }
  return names;
}
