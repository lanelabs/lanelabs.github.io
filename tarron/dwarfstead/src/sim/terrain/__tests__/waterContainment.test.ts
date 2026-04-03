/**
 * Validates that world generation never produces floating water.
 * After all passes (imposed shapes, basin fill, rainfall, settle),
 * every WaterLayer must:
 * - Sit on a solid floor or on top of another water layer (not floating)
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

function assertAllWaterContained(seed: number) {
  const terrain = TerrainGenerator.generate(seed, WIDTH, HEIGHT);
  const { blocks, initialWaterVolume: layers } = terrain;

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

    // Solid floor beneath each tile (not floating in mid-air)
    // Floor can be solid block OR another water layer below.
    if (layer.y + 1 < HEIGHT) {
      for (let x = layer.left; x <= layer.right; x++) {
        const below = blocks[layer.y + 1][x];
        if (below !== BlockMaterial.Air) continue; // solid floor — OK

        // Air below: check if there's a water layer below supporting this one
        const hasWaterBelow = layers.some(
          l => l.y === layer.y + 1 && l.left <= x && l.right >= x && l.volume > 0,
        );
        expect(hasWaterBelow, `Floating water at (${x},${layer.y}), air below: ${info}`)
          .toBe(true);
      }
    }
  }
}

describe('water generation containment', () => {
  for (const seed of TEST_SEEDS) {
    it(`seed ${seed}: all water layers are contained`, () => {
      assertAllWaterContained(seed);
    }, 30_000);
  }
});
