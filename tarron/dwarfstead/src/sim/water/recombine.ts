/**
 * Pool recombination — merges overlapping water layers after block removal.
 *
 * When a stone block is removed and the resulting pool shape is contained
 * (walled + floored), existing layers that overlap are collected, their
 * volumes summed, and fresh layers are created bottom-up via fillPool.
 *
 * Unlike findPool (which stops at full water), scanPoolShape scans through
 * all connected air tiles to find the complete pool geometry.
 */

import { BlockMaterial } from '../types';
import type { WaterLayer } from './waterLayer';
import { VOLUME_PER_TILE } from './waterLayer';
import { fillPool } from './poolScan';
import type { PoolInfo, PoolLayer } from './poolScan';

/**
 * Scan the full connected air shape from (startX, startY).
 * Unlike findPool, does NOT stop at full water — scans all air tiles.
 */
export function scanPoolShape(
  startX: number, startY: number,
  blocks: BlockMaterial[][],
  w: number, h: number,
): PoolInfo | null {
  if (startX < 0 || startX >= w || startY < 0 || startY >= h) return null;
  if (blocks[startY][startX] !== BlockMaterial.Air) return null;

  // Find the bottom scanning only blocks (ignore water)
  let bottomY = startY;
  while (bottomY + 1 < h && blocks[bottomY + 1][startX] === BlockMaterial.Air) {
    bottomY++;
  }

  // Collect layers from bottom to top
  const layers: PoolLayer[] = [];
  for (let y = bottomY; y >= 0; y--) {
    if (blocks[y][startX] !== BlockMaterial.Air) break;

    let left = startX;
    while (left > 0 && blocks[y][left - 1] === BlockMaterial.Air) left--;
    let right = startX;
    while (right < w - 1 && blocks[y][right + 1] === BlockMaterial.Air) right++;

    const width = right - left + 1;
    layers.push({ y, left, right, capacity: width * VOLUME_PER_TILE });
  }

  if (layers.length === 0) return null;
  return { layers };
}

/**
 * Check if a pool shape is fully contained — walled on every layer,
 * solid floor under the bottom layer.
 */
function isPoolContained(
  pool: PoolInfo, blocks: BlockMaterial[][],
  w: number, h: number,
): boolean {
  for (const layer of pool.layers) {
    if (layer.left === 0 || layer.right === w - 1) return false;
  }
  // Bottom layer must have solid floor
  const bottom = pool.layers[0]; // bottom-first order
  if (bottom.y + 1 >= h) return true; // world bottom = contained
  for (let x = bottom.left; x <= bottom.right; x++) {
    if (blocks[bottom.y + 1][x] === BlockMaterial.Air) return false;
  }
  return true;
}

/**
 * Find indices of all existing layers whose y and horizontal range
 * overlap any layer in the scanned pool.
 */
export function collectOverlappingLayers(
  pool: PoolInfo,
  waterLayers: WaterLayer[],
): number[] {
  const indices: number[] = [];
  for (let i = 0; i < waterLayers.length; i++) {
    const wl = waterLayers[i];
    for (const pl of pool.layers) {
      if (wl.y === pl.y && wl.left <= pl.right && wl.right >= pl.left) {
        indices.push(i);
        break;
      }
    }
  }
  return indices;
}

/**
 * Recombine water layers at (x, y) after a block is removed.
 *
 * Returns true if recombination happened (contained merge),
 * false if the space is not contained (breach system handles it).
 */
export function recombineAtTile(
  x: number, y: number,
  waterLayers: WaterLayer[],
  blocks: BlockMaterial[][],
  w: number, h: number,
): boolean {
  // Scan the full pool shape (scans through full water too)
  const pool = scanPoolShape(x, y, blocks, w, h);
  if (!pool) return false;

  // Must be fully contained for instant merge
  if (!isPoolContained(pool, blocks, w, h)) return false;

  // Find all stale layers overlapping the pool
  const overlapping = collectOverlappingLayers(pool, waterLayers);
  if (overlapping.length === 0) return false;

  // Sum total volume from overlapping layers
  let totalVolume = 0;
  for (const idx of overlapping) {
    totalVolume += waterLayers[idx].volume;
  }

  // Remove overlapping layers (reverse order to preserve indices)
  for (let i = overlapping.length - 1; i >= 0; i--) {
    waterLayers.splice(overlapping[i], 1);
  }

  // Redistribute volume bottom-up into the new pool shape
  if (totalVolume > 0) {
    fillPool(pool, totalVolume, waterLayers, blocks, w, h);
  }

  return true;
}
