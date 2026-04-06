/**
 * Validates that world generation never produces floating gas.
 * After all passes (imposed pockets, basin fill, settle),
 * every GasLayer must:
 * - Sit below a solid ceiling or below another gas layer (not sinking)
 * - Not be at world edges (x=0 or x=w-1)
 * - Cover only air tiles
 * - Not exceed capacity
 */

import { describe, it, expect } from 'vitest';
import { TerrainGenerator } from '../TerrainGenerator';
import { BlockMaterial } from '../../types';
import { VOLUME_PER_TILE } from '../../water/waterLayer';

const WIDTH = 200;
const HEIGHT = 400;

const TEST_SEEDS = [42, 123, 777, 1001, 2025, 9999, 31415, 54321];

function assertAllGasContained(seed: number) {
  const terrain = TerrainGenerator.generate(seed, WIDTH, HEIGHT);
  const { blocks, initialGasVolume: layers } = terrain;

  for (const layer of layers) {
    if (layer.volume <= 0) continue;

    const width = layer.right - layer.left + 1;
    const cap = width * VOLUME_PER_TILE;
    const info = `seed=${seed} y=${layer.y} [${layer.left}..${layer.right}] vol=${layer.volume}`;

    // Volume within capacity
    expect(layer.volume, `Over capacity: ${info}`).toBeLessThanOrEqual(cap);

    // Not at world edges
    expect(layer.left, `Left at world edge: ${info}`).toBeGreaterThan(0);
    expect(layer.right, `Right at world edge: ${info}`).toBeLessThan(WIDTH - 1);

    // Every tile in the layer should be air
    for (let x = layer.left; x <= layer.right; x++) {
      expect(blocks[layer.y][x], `Not air at (${x},${layer.y}): ${info}`)
        .toBe(BlockMaterial.Air);
    }

    // Solid ceiling above each tile (not sinking in mid-air)
    // Ceiling can be solid block OR another gas layer above.
    if (layer.y - 1 >= 0) {
      for (let x = layer.left; x <= layer.right; x++) {
        const above = blocks[layer.y - 1][x];
        if (above !== BlockMaterial.Air) continue; // solid ceiling — OK

        const hasGasAbove = layers.some(
          l => l.y === layer.y - 1 && l.left <= x && l.right >= x && l.volume > 0,
        );
        expect(hasGasAbove, `Sinking gas at (${x},${layer.y}), air above: ${info}`)
          .toBe(true);
      }
    }
  }
}

describe('gas generation containment', () => {
  for (const seed of TEST_SEEDS) {
    it(`seed ${seed}: all gas layers are contained`, () => {
      assertAllGasContained(seed);
    }, 30_000);
  }
});
