// General (existing RPG data)
import gear from './general/gear.json';
import props from './general/props.json';
import weapons from './general/weapons.json';

// Fantasy
import magicItems from './fantasy/magic_items.json';
import natureItems from './fantasy/nature_items.json';
import curiosities from './fantasy/curiosities.json';
import fantasyWeapons from './fantasy/weapons.json';
import wearables from './fantasy/wearables.json';
import instruments from './fantasy/instruments.json';
import tools from './fantasy/tools.json';

// Modern
import modernItems from './modern/items.json';

// Ocean
import oceanItems from './ocean/items.json';

// Sci-Fi
import scifiItems from './scifi/items.json';

// { world: [[name, description], ...] }
export const itemsByWorld = {
  general: [
    ...gear.items,
    ...props.items,
    ...weapons.items,
  ],
  fantasy: [
    ...magicItems.items,
    ...natureItems.items,
    ...curiosities.items,
    ...fantasyWeapons.items,
    ...wearables.items,
    ...instruments.items,
    ...tools.items,
  ],
  modern: [
    ...modernItems.items,
  ],
  ocean: [
    ...oceanItems.items,
  ],
  scifi: [
    ...scifiItems.items,
  ],
};

/**
 * Get deduplicated item names for the given worlds.
 * @param {string[]} worlds - World keys (e.g. ['general', 'fantasy'])
 * @returns {string[]} Item name strings
 */
export function getItemNames(worlds) {
  const seen = new Set();
  const names = [];
  for (const world of worlds) {
    for (const [name] of itemsByWorld[world] || []) {
      if (!seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }
  }
  return names;
}
