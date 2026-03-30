/**
 * Breach drainage — water drains through unsupported edges.
 *
 * A breach exists when a water layer has non-water air:
 *   - to either side (missing wall), or
 *   - below any tile in the layer (missing floor).
 *
 * Water drains from the pool's topmost layer down to the breach
 * layer at 4 quarters/tick. A FALLING snake spawns at the breach.
 * Tiles with pipes below are skipped (pipes handle their own drain).
 */

import { BlockMaterial } from '../types';
import type { WaterSimState, WaterSnake } from './types';
import { SnakeState } from './types';
import type { WaterLayer } from './waterLayer';
import { findLayer, removeWater } from './waterLayer';

const MAX_BREACH_RATE = 4; // quarters per tick per breach point

/**
 * Find the topmost non-empty water layer at or above breachY,
 * scanning upward through air from a tile inside the pool.
 */
function findDrainTarget(
  poolX: number, breachY: number,
  blocks: BlockMaterial[][], state: WaterSimState,
): WaterLayer | null {
  let target: WaterLayer | null = null;
  for (let y = breachY; y >= 0; y--) {
    if (blocks[y][poolX] !== BlockMaterial.Air) break;
    const layer = findLayer(state.waterLayers, poolX, y);
    if (layer && layer.volume > 0) target = layer;
  }
  return target;
}

function spawnBreach(
  state: WaterSimState, target: WaterLayer,
  spawnX: number, spawnY: number,
): WaterSnake | null {
  if (target.volume <= 0) return null;
  const drain = Math.min(MAX_BREACH_RATE, target.volume);
  removeWater(state.waterLayers, target.left, target.y, drain);
  return {
    id: state.nextSnakeId++,
    x: spawnX, y: spawnY,
    volume: drain,
    state: SnakeState.FALLING,
    flowDir: null,
    pipeProgress: 0,
  };
}

export function bleedLayers(
  blocks: BlockMaterial[][], w: number, h: number,
  state: WaterSimState,
): WaterSnake[] {
  const spawned: WaterSnake[] = [];
  const processed = new Set<string>();

  for (const layer of state.waterLayers) {
    if (layer.volume <= 0) continue;
    const y = layer.y;

    // --- Side breaches (left/right edges) ---
    const lx = layer.left - 1;
    if (lx >= 0 && !processed.has(`L${lx},${y}`)) {
      if (blocks[y][lx] === BlockMaterial.Air && !findLayer(state.waterLayers, lx, y)) {
        processed.add(`L${lx},${y}`);
        const target = findDrainTarget(layer.left, y, blocks, state);
        if (target) {
          const s = spawnBreach(state, target, lx, y);
          if (s) spawned.push(s);
        }
      }
    }

    const rx = layer.right + 1;
    if (rx < w && !processed.has(`R${rx},${y}`)) {
      if (blocks[y][rx] === BlockMaterial.Air && !findLayer(state.waterLayers, rx, y)) {
        processed.add(`R${rx},${y}`);
        const target = findDrainTarget(layer.right, y, blocks, state);
        if (target) {
          const s = spawnBreach(state, target, rx, y);
          if (s) spawned.push(s);
        }
      }
    }

    // --- Bottom breaches (air below any tile in the layer) ---
    if (y + 1 >= h) continue;
    for (let x = layer.left; x <= layer.right; x++) {
      if (layer.volume <= 0) break;
      const key = `B${x},${y}`;
      if (processed.has(key)) continue;

      // Skip if pipe below (pipes handle drain)
      if (state.pipes[y + 1][x]) continue;

      const below = y + 1;
      if (blocks[below][x] !== BlockMaterial.Air) continue;
      if (findLayer(state.waterLayers, x, below)) continue; // water below, not a breach

      processed.add(key);
      const target = findDrainTarget(x, y, blocks, state);
      if (target) {
        const s = spawnBreach(state, target, x, below);
        if (s) spawned.push(s);
      }
    }
  }

  return spawned;
}
