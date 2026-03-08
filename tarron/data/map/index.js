// General - Regions
import regionsBoundary from './general/regions_boundary.json';
import regionsCoastal from './general/regions_coastal.json';
import regionsCultural from './general/regions_cultural.json';
import regionsForest from './general/regions_forest.json';
import regionsGeographic from './general/regions_geographic.json';
import regionsPolitical from './general/regions_political.json';
import regionsReligious from './general/regions_religious.json';

// General - Terrain
import terrainBackground from './general/terrain_background.json';
import terrainIcon from './general/terrain_icon.json';
import terrainPath from './general/terrain_path.json';

// { world: { regions: [...], terrain: [...] } }
export const mapByWorld = {
  general: {
    regions: [
      ...regionsBoundary.regions,
      ...regionsCoastal.regions,
      ...regionsCultural.regions,
      ...regionsForest.regions,
      ...regionsGeographic.regions,
      ...regionsPolitical.regions,
      ...regionsReligious.regions,
    ],
    terrain: [
      ...terrainBackground.terrain,
      ...terrainIcon.terrain,
      ...terrainPath.terrain,
    ],
  },
  fantasy: { regions: [], terrain: [] },
  modern: { regions: [], terrain: [] },
  ocean: { regions: [], terrain: [] },
  scifi: { regions: [], terrain: [] },
};

/**
 * Get deduplicated region names for the given worlds.
 * @param {string[]} worlds - World keys (e.g. ['general', 'fantasy'])
 * @returns {string[]} Region name strings
 */
export function getRegionNames(worlds) {
  const seen = new Set();
  const names = [];
  for (const world of worlds) {
    const data = mapByWorld[world];
    if (!data) continue;
    for (const [name] of data.regions) {
      if (!seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }
  }
  return names;
}

/**
 * Get deduplicated terrain names for the given worlds.
 * @param {string[]} worlds - World keys (e.g. ['general', 'fantasy'])
 * @returns {string[]} Terrain name strings
 */
export function getTerrainNames(worlds) {
  const seen = new Set();
  const names = [];
  for (const world of worlds) {
    const data = mapByWorld[world];
    if (!data) continue;
    for (const [name] of data.terrain) {
      if (!seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }
  }
  return names;
}
