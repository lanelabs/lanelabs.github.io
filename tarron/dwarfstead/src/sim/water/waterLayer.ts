/**
 * Layer-based water model — tracks volume per horizontal air run.
 *
 * A WaterLayer is a contiguous horizontal run of air tiles at a given y.
 * Volume is shared across the entire layer (no per-tile differences).
 * Max capacity = width * VOLUME_PER_TILE.
 */

import { BlockMaterial } from '../types';

/** Volume units that fit in a single tile. */
export const VOLUME_PER_TILE = 10;

export interface WaterLayer {
  y: number;
  left: number;   // leftmost air x (inclusive)
  right: number;  // rightmost air x (inclusive)
  volume: number; // total units (0 to width * VOLUME_PER_TILE)
}

/** Width of a layer in tiles. */
function layerWidth(layer: WaterLayer): number {
  return layer.right - layer.left + 1;
}

/** Find the layer covering tile (x, y), or null. */
export function findLayer(layers: WaterLayer[], x: number, y: number): WaterLayer | null {
  for (const l of layers) {
    if (l.y === y && x >= l.left && x <= l.right) return l;
  }
  return null;
}

/** Effective quarters per tile at (x, y): floor(volume / width), or 0. */
export function getWaterAt(layers: WaterLayer[], x: number, y: number): number {
  const l = findLayer(layers, x, y);
  if (!l) return 0;
  return Math.floor(l.volume / layerWidth(l));
}

/** Whether the layer at (x, y) is at full capacity. */
export function isWaterFull(layers: WaterLayer[], x: number, y: number): boolean {
  const l = findLayer(layers, x, y);
  if (!l) return false;
  return l.volume >= layerWidth(l) * VOLUME_PER_TILE;
}

/**
 * Add quarters to the layer at (x, y). Creates a new layer if none exists
 * and the tile is air. Returns quarters actually added.
 */
export function addWater(
  layers: WaterLayer[], blocks: BlockMaterial[][],
  x: number, y: number, quarters: number,
  w: number, h: number,
): number {
  let layer = findLayer(layers, x, y);
  if (!layer) {
    // Only create if tile is air
    if (x < 0 || x >= w || y < 0 || y >= h) return 0;
    if (blocks[y][x] !== BlockMaterial.Air) return 0;

    // Scan the full air run at this y containing x
    let left = x;
    while (left > 0 && blocks[y][left - 1] === BlockMaterial.Air) left--;
    let right = x;
    while (right < w - 1 && blocks[y][right + 1] === BlockMaterial.Air) right++;

    layer = { y, left, right, volume: 0 };
    layers.push(layer);
  }

  const cap = layerWidth(layer) * VOLUME_PER_TILE;
  const space = cap - layer.volume;
  const added = Math.min(quarters, space);
  layer.volume += added;
  return added;
}

/** Remove quarters from the layer at (x, y). Returns quarters actually removed. */
export function removeWater(layers: WaterLayer[], x: number, y: number, quarters: number): number {
  const l = findLayer(layers, x, y);
  if (!l) return 0;
  const removed = Math.min(quarters, l.volume);
  l.volume -= removed;
  return removed;
}

/**
 * Find the contained air run at (x, y) — walled on both sides with a solid floor.
 * Returns { y, left, right } if valid, or null if not contained.
 * "Solid floor" means every tile below the run is either solid or full water.
 */
export function findContainedLayer(
  x: number, y: number,
  blocks: BlockMaterial[][], waterLayers: WaterLayer[],
  w: number, h: number,
): { y: number; left: number; right: number } | null {
  if (x < 0 || x >= w || y < 0 || y >= h) return null;
  if (blocks[y][x] !== BlockMaterial.Air) return null;

  // Scan left/right for walls
  let left = x;
  while (left > 0 && blocks[y][left - 1] === BlockMaterial.Air) left--;
  let right = x;
  while (right < w - 1 && blocks[y][right + 1] === BlockMaterial.Air) right++;

  // Must have solid walls, not just world edge
  if (left === 0 || right === w - 1) return null;

  // Every tile must have a solid floor or full water below
  if (y + 1 < h) {
    for (let tx = left; tx <= right; tx++) {
      if (blocks[y + 1][tx] === BlockMaterial.Air && !isWaterFull(waterLayers, tx, y + 1)) {
        return null;
      }
    }
  }

  return { y, left, right };
}

/** Fill fraction for rendering: volume / capacity (0..1). */
export function layerFillFraction(layer: WaterLayer): number {
  const cap = layerWidth(layer) * VOLUME_PER_TILE;
  if (cap <= 0) return 0;
  return layer.volume / cap;
}

/** Deep-copy an array of water layers. */
export function cloneLayers(layers: WaterLayer[]): WaterLayer[] {
  return layers.map(l => ({ ...l }));
}
