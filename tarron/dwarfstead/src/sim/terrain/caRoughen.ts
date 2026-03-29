import { BlockMaterial } from '../types';
import { SeededRNG } from '../rng';
import { getDepthZone, type LayerBoundaries } from './depthZones';

interface CAConfig {
  survivalThreshold: number;
  iterations: number;
  probability: number;
}

const ZONE_CONFIG: Record<string, CAConfig> = {
  shallow: { survivalThreshold: 4, iterations: 1, probability: 0.5 },
  midStone: { survivalThreshold: 4, iterations: 2, probability: 0.7 },
  cavern: { survivalThreshold: 3, iterations: 3, probability: 0.9 },
  deep: { survivalThreshold: 4, iterations: 2, probability: 0.6 },
};

const MAX_ITERATIONS = 3;

/**
 * Cellular automata post-pass that roughens cave edges.
 * Only processes solid blocks adjacent to air (edge-only).
 * Uses snapshot per iteration to avoid order artifacts.
 */
export function caRoughen(
  blocks: BlockMaterial[][], width: number, height: number,
  bounds: LayerBoundaries, rng: SeededRNG,
): void {
  // Pre-compute per-block zone config (only for edge blocks)
  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    // Snapshot: copy which cells are solid
    const solidSnap: boolean[][] = [];
    for (let y = 0; y < height; y++) {
      const row = new Array<boolean>(width);
      for (let x = 0; x < width; x++) {
        row[x] = blocks[y][x] !== BlockMaterial.Air;
      }
      solidSnap.push(row);
    }

    let anyChanged = false;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        // Only process solid blocks adjacent to air (edge-only)
        if (!solidSnap[y][x]) continue;
        if (blocks[y][x] === BlockMaterial.Bedrock) continue;

        // Check if adjacent to air
        const adjAir = !solidSnap[y - 1][x] || !solidSnap[y + 1][x] ||
                        !solidSnap[y][x - 1] || !solidSnap[y][x + 1];
        if (!adjAir) continue;

        const { zone } = getDepthZone(x, y, bounds);
        const cfg = ZONE_CONFIG[zone];
        if (!cfg || iter >= cfg.iterations) continue;

        // Probability gate
        if (rng.next() > cfg.probability) continue;

        // Count solid neighbors in snapshot (Moore neighborhood)
        let solidCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
              solidCount++; // out of bounds counts as solid
            } else if (solidSnap[ny][nx]) {
              solidCount++;
            }
          }
        }

        // Remove block if not enough solid neighbors to survive
        if (solidCount < cfg.survivalThreshold) {
          blocks[y][x] = BlockMaterial.Air;
          anyChanged = true;
        }
      }
    }

    if (!anyChanged) break;
  }
}
