import { BlockMaterial } from '../types';
import { SeededRNG } from '../rng';
import { getDepthZone, type LayerBoundaries } from './depthZones';

interface FormationConfig {
  ceilingChance: number;
  floorChance: number;
  maxLength: number;
  material: BlockMaterial;
}

const ZONE_CONFIG: Record<string, FormationConfig> = {
  shallow: { ceilingChance: 0.02, floorChance: 0.01, maxLength: 1, material: BlockMaterial.Dirt },
  midStone: { ceilingChance: 0.06, floorChance: 0.04, maxLength: 2, material: BlockMaterial.Stone },
  cavern: { ceilingChance: 0.10, floorChance: 0.08, maxLength: 3, material: BlockMaterial.Stone },
  deep: { ceilingChance: 0.05, floorChance: 0.04, maxLength: 3, material: BlockMaterial.Granite },
};

/**
 * Grow stalactites (from ceilings) and stalagmites (from floors) in cave spaces.
 * Scans for eligible sites and grows formations downward/upward.
 */
export function growFormations(
  blocks: BlockMaterial[][], width: number, height: number,
  bounds: LayerBoundaries, rng: SeededRNG,
): void {
  // Pass 1: Stalactites — solid with air below → grow downward
  for (let y = 1; y < height - 2; y++) {
    for (let x = 0; x < width; x++) {
      if (blocks[y][x] === BlockMaterial.Air) continue;
      if (blocks[y][x] === BlockMaterial.Bedrock) continue;
      if (blocks[y + 1][x] !== BlockMaterial.Air) continue;

      const { zone } = getDepthZone(x, y, bounds);
      const cfg = ZONE_CONFIG[zone];
      if (!cfg) continue;
      if (rng.next() > cfg.ceilingChance) continue;

      // Grow downward
      const length = 1 + Math.floor(rng.next() * cfg.maxLength);
      for (let dy = 1; dy <= length; dy++) {
        const gy = y + dy;
        if (gy >= height - 1) break;
        if (blocks[gy][x] !== BlockMaterial.Air) break;
        blocks[gy][x] = cfg.material;
      }
    }
  }

  // Pass 2: Stalagmites — solid with air above → grow upward
  for (let y = 2; y < height - 1; y++) {
    for (let x = 0; x < width; x++) {
      if (blocks[y][x] === BlockMaterial.Air) continue;
      if (blocks[y][x] === BlockMaterial.Bedrock) continue;
      if (blocks[y - 1][x] !== BlockMaterial.Air) continue;

      const { zone } = getDepthZone(x, y, bounds);
      const cfg = ZONE_CONFIG[zone];
      if (!cfg) continue;
      if (rng.next() > cfg.floorChance) continue;

      // Grow upward
      const length = 1 + Math.floor(rng.next() * cfg.maxLength);
      for (let dy = 1; dy <= length; dy++) {
        const gy = y - dy;
        if (gy < 0) break;
        if (blocks[gy][x] !== BlockMaterial.Air) break;
        blocks[gy][x] = cfg.material;
      }
    }
  }
}
