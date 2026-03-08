// General
import agriculture from './general/agriculture.json';
import commerce from './general/commerce.json';
import crafts from './general/crafts.json';
import criminal from './general/criminal.json';
import domestic from './general/domestic.json';
import entertainment from './general/entertainment.json';
import government from './general/government.json';
import laborer from './general/laborer.json';
import military from './general/military.json';
import religious from './general/religious.json';
import royalty from './general/royalty.json';
import scholarly from './general/scholarly.json';

// Fantasy
import magical from './fantasy/magical.json';

// { world: [[name, description], ...] }
export const jobsByWorld = {
  general: [
    ...agriculture.jobs,
    ...commerce.jobs,
    ...crafts.jobs,
    ...criminal.jobs,
    ...domestic.jobs,
    ...entertainment.jobs,
    ...government.jobs,
    ...laborer.jobs,
    ...military.jobs,
    ...religious.jobs,
    ...royalty.jobs,
    ...scholarly.jobs,
  ],
  fantasy: [
    ...magical.jobs,
  ],
  modern: [],
  ocean: [],
  scifi: [],
};

/**
 * Get deduplicated job names for the given worlds.
 * @param {string[]} worlds - World keys (e.g. ['general', 'fantasy'])
 * @returns {string[]} Job name strings
 */
export function getJobNames(worlds) {
  const seen = new Set();
  const names = [];
  for (const world of worlds) {
    for (const [name] of jobsByWorld[world] || []) {
      if (!seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }
  }
  return names;
}
