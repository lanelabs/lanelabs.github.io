/**
 * Pool detection and fill logic for the water snake system.
 *
 * A pool is a contiguous horizontal run of air tiles bounded by
 * solid walls (or world edges), with a solid floor below.
 * Pools are scanned per-layer (each row of air is one layer).
 * Filling proceeds bottom-up via the WaterLayer model.
 */

import { BlockMaterial, Direction } from '../types';
import type { WaterLayer } from './waterLayer';
import { findLayer, addWater, isWaterFull, VOLUME_PER_TILE } from './waterLayer';

/** A single horizontal layer in a pool. */
export interface PoolLayer {
  y: number;
  left: number;   // leftmost air x (inclusive)
  right: number;  // rightmost air x (inclusive)
  capacity: number; // (right - left + 1) * 4 quarters
}

/** Pool boundary info returned by findPool. */
export interface PoolInfo {
  layers: PoolLayer[]; // bottom-first order
}

/** Overflow result when pool is full. */
export interface OverflowPoint {
  x: number;
  y: number;
  flowDir: Direction | null;
}

function isSolid(blocks: BlockMaterial[][], x: number, y: number, w: number, h: number): boolean {
  if (x < 0 || x >= w || y < 0 || y >= h) return true;
  return blocks[y][x] !== BlockMaterial.Air;
}

/**
 * Find pool boundaries starting from (startX, startY).
 * Scans downward to find the bottom, then collects layers bottom-up.
 */
export function findPool(
  startX: number, startY: number,
  blocks: BlockMaterial[][], waterLayers: WaterLayer[],
  w: number, h: number,
): PoolInfo | null {
  if (isSolid(blocks, startX, startY, w, h)) return null;

  // Find the bottom of the pool from startY downward
  let bottomY = startY;
  while (bottomY + 1 < h) {
    if (isSolid(blocks, startX, bottomY + 1, w, h)) break;
    if (isWaterFull(waterLayers, startX, bottomY + 1)) break;
    bottomY++;
  }

  // Collect layers from bottom to top
  const layers: PoolLayer[] = [];
  for (let y = bottomY; y >= 0; y--) {
    if (isSolid(blocks, startX, y, w, h)) break;

    let left = startX;
    while (left > 0 && !isSolid(blocks, left - 1, y, w, h)) left--;

    let right = startX;
    while (right < w - 1 && !isSolid(blocks, right + 1, y, w, h)) right++;

    const width = right - left + 1;
    layers.push({ y, left, right, capacity: width * VOLUME_PER_TILE });
  }

  if (layers.length === 0) return null;
  return { layers };
}

/**
 * Get total volume in a pool layer from the water layers.
 */
function layerVolume(layer: PoolLayer, waterLayers: WaterLayer[]): number {
  const wl = findLayer(waterLayers, layer.left, layer.y);
  return wl ? wl.volume : 0;
}

/**
 * Deposit quarters into a pool, filling bottom-up.
 * Returns the number of quarters actually deposited.
 */
export function fillPool(
  pool: PoolInfo, quarters: number,
  waterLayers: WaterLayer[], blocks: BlockMaterial[][],
  w: number, h: number,
): number {
  let deposited = 0;
  let remaining = quarters;

  for (const layer of pool.layers) {
    if (remaining <= 0) break;

    const currentVol = layerVolume(layer, waterLayers);
    const space = layer.capacity - currentVol;
    if (space <= 0) continue;

    const toDeposit = Math.min(remaining, space);
    const added = addWater(waterLayers, blocks, layer.left, layer.y, toDeposit, w, h);
    deposited += added;
    remaining -= added;
  }

  return deposited;
}

/**
 * Check if a pool is full (all layers at capacity).
 */
export function isPoolFull(pool: PoolInfo, waterLayers: WaterLayer[]): boolean {
  for (const layer of pool.layers) {
    if (layerVolume(layer, waterLayers) < layer.capacity) return false;
  }
  return true;
}

/**
 * Find overflow point for a full pool.
 */
export function findOverflow(
  pool: PoolInfo, blocks: BlockMaterial[][],
  waterLayers: WaterLayer[], w: number, h: number,
): OverflowPoint | null {
  if (pool.layers.length === 0) return null;
  const topLayer = pool.layers[pool.layers.length - 1];
  const overflowY = topLayer.y;

  const leftWall = topLayer.left - 1;
  if (leftWall >= 0 && !isSolid(blocks, leftWall, overflowY, w, h)) {
    return { x: leftWall, y: overflowY, flowDir: Direction.Left };
  }

  const rightWall = topLayer.right + 1;
  if (rightWall < w && !isSolid(blocks, rightWall, overflowY, w, h)) {
    return { x: rightWall, y: overflowY, flowDir: Direction.Right };
  }

  const aboveY = topLayer.y - 1;
  if (aboveY < 0) return null;
  if (isSolid(blocks, topLayer.left, aboveY, w, h)) return null;

  for (let x = topLayer.left - 1; x >= 0; x--) {
    if (isSolid(blocks, x, aboveY, w, h)) break;
    if (!isSolid(blocks, x, aboveY + 1, w, h) &&
        !isWaterFull(waterLayers, x, aboveY + 1)) {
      return { x, y: aboveY, flowDir: Direction.Left };
    }
  }

  for (let x = topLayer.right + 1; x < w; x++) {
    if (isSolid(blocks, x, aboveY, w, h)) break;
    if (!isSolid(blocks, x, aboveY + 1, w, h) &&
        !isWaterFull(waterLayers, x, aboveY + 1)) {
      return { x, y: aboveY, flowDir: Direction.Right };
    }
  }

  return null;
}
