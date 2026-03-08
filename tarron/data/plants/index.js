// General
import aquatic from './general/aquatic.json';
import climbers from './general/climbers.json';
import fernsAndMosses from './general/ferns_and_mosses.json';
import growthForms from './general/growth_forms.json';
import herbsAndGrasses from './general/herbs_and_grasses.json';
import shrubs from './general/shrubs.json';
import specialized from './general/specialized.json';
import succulents from './general/succulents.json';
import trees from './general/trees.json';

// Fantasy
import magicalFlora from './fantasy/magical_flora.json';
import potionsAndReagents from './fantasy/potions_and_reagents.json';

// Modern
import urbanPlants from './modern/urban_plants.json';
import cultivated from './modern/cultivated.json';

// Ocean
import marineFlora from './ocean/marine_flora.json';

// Sci-Fi
import alienFlora from './scifi/alien_flora.json';

// { world: [[name, description], ...] }
export const plantsByWorld = {
  general: [
    ...aquatic.plants,
    ...climbers.plants,
    ...fernsAndMosses.plants,
    ...growthForms.plants,
    ...herbsAndGrasses.plants,
    ...shrubs.plants,
    ...specialized.plants,
    ...succulents.plants,
    ...trees.plants,
  ],
  fantasy: [
    ...magicalFlora.plants,
    ...potionsAndReagents.plants,
  ],
  modern: [
    ...urbanPlants.plants,
    ...cultivated.plants,
  ],
  ocean: [
    ...marineFlora.plants,
  ],
  scifi: [
    ...alienFlora.plants,
  ],
};

/**
 * Get deduplicated plant names for the given worlds.
 * @param {string[]} worlds - World keys (e.g. ['general', 'fantasy'])
 * @returns {string[]} Plant name strings
 */
export function getPlantNames(worlds) {
  const seen = new Set();
  const names = [];
  for (const world of worlds) {
    for (const [name] of plantsByWorld[world] || []) {
      if (!seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }
  }
  return names;
}
