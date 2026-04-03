/**
 * Validates that gas test chambers produce valid gas layers.
 * Every GasLayer must:
 * - Sit below a solid ceiling (y-1 solid) or another gas layer
 * - Not be at world edges
 * - Cover only air tiles
 * - Volume within capacity
 */

import { describe, it, expect } from 'vitest';
import { buildWaterTestTerrain } from '../../terrain/waterTestTerrain';
import { BlockMaterial } from '../../types';
import { VOLUME_PER_TILE } from '../../water/waterLayer';

describe('gas containment in test terrain', () => {
  it('all gas layers are contained', () => {
    const world = buildWaterTestTerrain();
    const { blocks } = world.terrain;
    const layers = world.initialGasVolume;
    const w = world.terrain.width;

    for (const layer of layers) {
      if (layer.volume <= 0) continue;

      const width = layer.right - layer.left + 1;
      const cap = width * VOLUME_PER_TILE;
      const info = `y=${layer.y} [${layer.left}..${layer.right}] vol=${layer.volume}`;

      // Volume within capacity
      expect(layer.volume, `Over capacity: ${info}`).toBeLessThanOrEqual(cap);

      // Not at world edges
      expect(layer.left, `Left at world edge: ${info}`).toBeGreaterThan(0);
      expect(layer.right, `Right at world edge: ${info}`).toBeLessThan(w - 1);

      // Every tile in the layer should be air
      for (let x = layer.left; x <= layer.right; x++) {
        expect(blocks[layer.y][x], `Not air at (${x},${layer.y}): ${info}`)
          .toBe(BlockMaterial.Air);
      }

      // Solid ceiling above each tile (not floating in mid-air)
      // Ceiling can be solid block OR another gas layer above.
      if (layer.y - 1 >= 0) {
        for (let x = layer.left; x <= layer.right; x++) {
          const above = blocks[layer.y - 1][x];
          if (above !== BlockMaterial.Air) continue; // solid ceiling — OK

          const hasGasAbove = layers.some(
            l => l.y === layer.y - 1 && l.left <= x && l.right >= x && l.volume > 0,
          );
          expect(hasGasAbove, `Floating gas at (${x},${layer.y}), air above: ${info}`)
            .toBe(true);
        }
      }
    }
  });
});
