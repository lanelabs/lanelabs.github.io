/**
 * Gas pool recombination — merges overlapping gas layers after block removal.
 *
 * Mirror of water recombine.ts with inverted containment checks:
 * - Checks ceiling (y-1 solid) instead of floor (y+1 solid)
 * - Pool layers sorted top-first (lowest y first) for ceiling containment
 */

import { BlockMaterial } from '../types';
import type { GasLayer } from './types';
import { VOLUME_PER_TILE } from './gasLayer';
import { fillGasPool } from './gasPoolScan';
import type { GasPoolInfo, GasPoolLayer } from './gasPoolScan';

/**
 * Scan the full connected air shape from (startX, startY) via flood-fill.
 */
export function scanGasPoolShape(
  startX: number, startY: number,
  blocks: BlockMaterial[][],
  w: number, h: number,
): GasPoolInfo | null {
  if (startX < 0 || startX >= w || startY < 0 || startY >= h) return null;
  if (blocks[startY][startX] !== BlockMaterial.Air) return null;

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

  // Build layers: group x-values into contiguous runs per row, top-first
  const layers: GasPoolLayer[] = [];
  const sortedYs = [...rowTiles.keys()].sort((a, b) => a - b); // top-first (inverted from water)

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
 * Check if a gas pool shape is fully contained — walled on every layer,
 * solid ceiling above the top layer (inverted from water's solid floor).
 */
export function isGasPoolContained(
  pool: GasPoolInfo, blocks: BlockMaterial[][],
  w: number, _h: number,
): boolean {
  for (const layer of pool.layers) {
    if (layer.left === 0 || layer.right === w - 1) return false;
  }
  // All topmost layers must have solid ceiling (inverted from water's floor)
  const topY = pool.layers[0].y; // top-first order
  for (const layer of pool.layers) {
    if (layer.y !== topY) break;
    if (layer.y - 1 < 0) continue; // world top = contained
    for (let x = layer.left; x <= layer.right; x++) {
      if (blocks[layer.y - 1][x] === BlockMaterial.Air) return false;
    }
  }
  return true;
}

/**
 * Find indices of all existing layers whose y and horizontal range
 * overlap any layer in the scanned pool.
 */
export function collectOverlappingGasLayers(
  pool: GasPoolInfo,
  gasLayers: GasLayer[],
): number[] {
  const indices: number[] = [];
  for (let i = 0; i < gasLayers.length; i++) {
    const gl = gasLayers[i];
    for (const pl of pool.layers) {
      if (gl.y === pl.y && gl.left <= pl.right && gl.right >= pl.left) {
        indices.push(i);
        break;
      }
    }
  }
  return indices;
}

/**
 * Recombine gas layers at (x, y) after a block is removed.
 */
export function recombineGasAtTile(
  x: number, y: number,
  gasLayers: GasLayer[],
  blocks: BlockMaterial[][],
  w: number, h: number,
): boolean {
  const pool = scanGasPoolShape(x, y, blocks, w, h);
  if (!pool) return false;

  if (!isGasPoolContained(pool, blocks, w, h)) return false;

  const overlapping = collectOverlappingGasLayers(pool, gasLayers);
  if (overlapping.length === 0) return false;

  let totalVolume = 0;
  for (const idx of overlapping) {
    totalVolume += gasLayers[idx].volume;
  }

  for (let i = overlapping.length - 1; i >= 0; i--) {
    gasLayers.splice(overlapping[i], 1);
  }

  if (totalVolume > 0) {
    fillGasPool(pool, totalVolume, gasLayers, blocks, w, h);
  }

  return true;
}
