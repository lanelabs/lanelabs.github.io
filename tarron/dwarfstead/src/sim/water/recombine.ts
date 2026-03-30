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
 * Scan the full connected air shape from (startX, startY) via flood-fill.
 * Unlike findPool, does NOT stop at full water — scans all air tiles.
 * Handles L, T, U, and other non-rectangular pool shapes correctly.
 */
export function scanPoolShape(
  startX: number, startY: number,
  blocks: BlockMaterial[][],
  w: number, h: number,
): PoolInfo | null {
  if (startX < 0 || startX >= w || startY < 0 || startY >= h) return null;
  if (blocks[startY][startX] !== BlockMaterial.Air) return null;

  // Flood-fill to find all connected air tiles
  const visited = new Set<number>();
  const key = (x: number, y: number) => y * w + x;
  const queue: [number, number][] = [[startX, startY]];
  visited.add(key(startX, startY));
  const rowTiles = new Map<number, number[]>();

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    if (!rowTiles.has(y)) rowTiles.set(y, []);
    rowTiles.get(y)!.push(x);

    const neighbors: [number, number][] = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const k = key(nx, ny);
      if (visited.has(k)) continue;
      if (blocks[ny][nx] !== BlockMaterial.Air) continue;
      visited.add(k);
      queue.push([nx, ny]);
    }
  }

  // Build layers: group x-values into contiguous runs per row, bottom-first
  const layers: PoolLayer[] = [];
  const sortedYs = [...rowTiles.keys()].sort((a, b) => b - a);

  for (const y of sortedYs) {
    const xs = rowTiles.get(y)!.sort((a, b) => a - b);
    let runStart = xs[0];
    for (let i = 1; i <= xs.length; i++) {
      if (i === xs.length || xs[i] !== xs[i - 1] + 1) {
        const left = runStart;
        const right = xs[i - 1];
        layers.push({ y, left, right, capacity: (right - left + 1) * VOLUME_PER_TILE });
        if (i < xs.length) runStart = xs[i];
      }
    }
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
  // All bottom-most layers must have solid floor (there may be
  // multiple runs at the same y for non-rectangular shapes)
  const bottomY = pool.layers[0].y; // bottom-first order
  for (const layer of pool.layers) {
    if (layer.y !== bottomY) break;
    if (layer.y + 1 >= h) continue; // world bottom = contained
    for (let x = layer.left; x <= layer.right; x++) {
      if (blocks[layer.y + 1][x] === BlockMaterial.Air) return false;
    }
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
