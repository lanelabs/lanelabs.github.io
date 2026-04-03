/**
 * Layer-based gas model — mirrors waterLayer with inverted gravity.
 *
 * Gas fills top-down (clings to ceilings) instead of bottom-up.
 * A GasLayer is a contiguous horizontal run of air tiles at a given y.
 */

import { BlockMaterial } from '../types';
import type { GasLayer } from './types';

// Re-export the same constant — gas and water use the same volume scale.
export { VOLUME_PER_TILE } from '../water/waterLayer';
import { VOLUME_PER_TILE } from '../water/waterLayer';

/** Width of a layer in tiles. */
function layerWidth(layer: GasLayer): number {
  return layer.right - layer.left + 1;
}

/** Find the layer covering tile (x, y), or null. */
export function findGasLayer(layers: GasLayer[], x: number, y: number): GasLayer | null {
  for (const l of layers) {
    if (l.y === y && x >= l.left && x <= l.right) return l;
  }
  return null;
}

/** Effective volume per tile at (x, y): floor(volume / width), or 0. */
export function getGasAt(layers: GasLayer[], x: number, y: number): number {
  const l = findGasLayer(layers, x, y);
  if (!l) return 0;
  return Math.floor(l.volume / layerWidth(l));
}

/** Whether the layer at (x, y) is at full capacity. */
export function isGasFull(layers: GasLayer[], x: number, y: number): boolean {
  const l = findGasLayer(layers, x, y);
  if (!l) return false;
  return l.volume >= layerWidth(l) * VOLUME_PER_TILE;
}

/**
 * Add gas to the layer at (x, y). Creates a new layer if none exists
 * and the tile is air. Gas fills top-down: scans ceiling (y-1) for air.
 * Returns volume actually added.
 */
export function addGas(
  layers: GasLayer[], blocks: BlockMaterial[][],
  x: number, y: number, quarters: number,
  w: number, h: number,
): number {
  let layer = findGasLayer(layers, x, y);
  if (!layer) {
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

/** Remove gas from the layer at (x, y). Returns volume actually removed. */
export function removeGas(layers: GasLayer[], x: number, y: number, quarters: number): number {
  const l = findGasLayer(layers, x, y);
  if (!l) return 0;
  const removed = Math.min(quarters, l.volume);
  l.volume -= removed;
  return removed;
}

/**
 * Find the contained air run at (x, y) — walled on both sides with a solid ceiling.
 * Returns { y, left, right } if valid, or null if not contained.
 * "Solid ceiling" means every tile above the run is either solid or full gas.
 */
export function findContainedGasLayer(
  x: number, y: number,
  blocks: BlockMaterial[][], gasLayers: GasLayer[],
  w: number, h: number,
): { y: number; left: number; right: number } | null {
  if (x < 0 || x >= w || y < 0 || y >= h) return null;
  if (blocks[y][x] !== BlockMaterial.Air) return null;

  let left = x;
  while (left > 0 && blocks[y][left - 1] === BlockMaterial.Air) left--;
  let right = x;
  while (right < w - 1 && blocks[y][right + 1] === BlockMaterial.Air) right++;

  // Must have solid walls, not just world edge
  if (left === 0 || right === w - 1) return null;

  // Every tile must have a solid ceiling or full gas above
  if (y - 1 >= 0) {
    for (let tx = left; tx <= right; tx++) {
      if (blocks[y - 1][tx] === BlockMaterial.Air && !isGasFull(gasLayers, tx, y - 1)) {
        return null;
      }
    }
  }

  return { y, left, right };
}

/** Fill fraction for rendering: volume / capacity (0..1). */
export function gasLayerFillFraction(layer: GasLayer): number {
  const cap = layerWidth(layer) * VOLUME_PER_TILE;
  if (cap <= 0) return 0;
  return layer.volume / cap;
}

/** Deep-copy an array of gas layers. */
export function cloneGasLayers(layers: GasLayer[]): GasLayer[] {
  return layers.map(l => ({ ...l }));
}
