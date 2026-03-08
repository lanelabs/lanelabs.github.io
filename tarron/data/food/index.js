// General
import breadsAndGrains from './general/breads_and_grains.json';
import preparedMeals from './general/prepared_meals.json';
import drinks from './general/drinks.json';
import preservedFoods from './general/preserved_foods.json';

// Fantasy
import magicalFoods from './fantasy/magical_foods.json';

// Modern
import contemporary from './modern/contemporary.json';

// Ocean
import coastalFare from './ocean/coastal_fare.json';

// Sci-Fi
import synthetic from './scifi/synthetic.json';

// { world: [[name, description], ...] }
export const foodByWorld = {
  general: [
    ...breadsAndGrains.foods,
    ...preparedMeals.foods,
    ...drinks.foods,
    ...preservedFoods.foods,
  ],
  fantasy: [
    ...magicalFoods.foods,
  ],
  modern: [
    ...contemporary.foods,
  ],
  ocean: [
    ...coastalFare.foods,
  ],
  scifi: [
    ...synthetic.foods,
  ],
};

/**
 * Get deduplicated food names for the given worlds.
 * @param {string[]} worlds - World keys (e.g. ['general', 'fantasy'])
 * @returns {string[]} Food name strings
 */
export function getFoodNames(worlds) {
  const seen = new Set();
  const names = [];
  for (const world of worlds) {
    for (const [name] of foodByWorld[world] || []) {
      if (!seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }
  }
  return names;
}
