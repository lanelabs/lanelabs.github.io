// General
import natural_in from './general/natural_in.json';
import natural_on from './general/natural_on.json';
import rural_in from './general/rural_in.json';
import rural_on from './general/rural_on.json';
import settlements_in from './general/settlements_in.json';
import water_in from './general/water_in.json';
import water_on from './general/water_on.json';

// Fantasy
import fortifications_in from './fantasy/fortifications_in.json';
import fortifications_on from './fantasy/fortifications_on.json';
import magical_in from './fantasy/magical_in.json';
import magical_on from './fantasy/magical_on.json';
import ruins_in from './fantasy/ruins_in.json';
import ruins_on from './fantasy/ruins_on.json';
import underground_in from './fantasy/underground_in.json';
import underground_on from './fantasy/underground_on.json';
import urban_in from './fantasy/urban_in.json';
import urban_on from './fantasy/urban_on.json';

// Modern
import modern_in from './modern/modern_in.json';
import modern_on from './modern/modern_on.json';

// Ocean
import ocean_in from './ocean/ocean_in.json';
import ocean_on from './ocean/ocean_on.json';

// Sci-Fi
import scifi_in from './scifi/scifi_in.json';
import scifi_on from './scifi/scifi_on.json';

function buildSettings(locations, prep) {
  return locations.map(([name]) => {
    const lower = name.toLowerCase();
    const article = /^[aeiou]/i.test(lower) ? 'an' : 'a';
    return {
      full: `${article} ${lower}`,
      bare: lower,
      prep,
      placed: `${prep} ${article} ${lower}`,
    };
  });
}

// { world: [{ full, bare, prep, placed }, ...] }
export const settingsByWorld = {
  general: [
    ...buildSettings(natural_in.locations, 'in'),
    ...buildSettings(natural_on.locations, 'on'),
    ...buildSettings(rural_in.locations, 'in'),
    ...buildSettings(rural_on.locations, 'on'),
    ...buildSettings(settlements_in.locations, 'in'),
    ...buildSettings(water_in.locations, 'in'),
    ...buildSettings(water_on.locations, 'on'),
  ],
  fantasy: [
    ...buildSettings(fortifications_in.locations, 'in'),
    ...buildSettings(fortifications_on.locations, 'on'),
    ...buildSettings(magical_in.locations, 'in'),
    ...buildSettings(magical_on.locations, 'on'),
    ...buildSettings(ruins_in.locations, 'in'),
    ...buildSettings(ruins_on.locations, 'on'),
    ...buildSettings(underground_in.locations, 'in'),
    ...buildSettings(underground_on.locations, 'on'),
    ...buildSettings(urban_in.locations, 'in'),
    ...buildSettings(urban_on.locations, 'on'),
  ],
  modern: [
    ...buildSettings(modern_in.locations, 'in'),
    ...buildSettings(modern_on.locations, 'on'),
  ],
  ocean: [
    ...buildSettings(ocean_in.locations, 'in'),
    ...buildSettings(ocean_on.locations, 'on'),
  ],
  scifi: [
    ...buildSettings(scifi_in.locations, 'in'),
    ...buildSettings(scifi_on.locations, 'on'),
  ],
};

/**
 * Get deduplicated settings for the given worlds.
 * @param {string[]} worlds - World keys (e.g. ['general', 'fantasy'])
 * @returns {{ full: string, bare: string, prep: string, placed: string }[]}
 */
export function getSettingNames(worlds) {
  const seen = new Set();
  const settings = [];
  for (const world of worlds) {
    for (const setting of settingsByWorld[world] || []) {
      if (!seen.has(setting.bare)) {
        seen.add(setting.bare);
        settings.push(setting);
      }
    }
  }
  return settings;
}
