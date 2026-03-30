/**
 * Shared test utilities for water path system tests.
 */

import { BlockMaterial } from '../../types';
import type { PipeCell, PumpCell } from '../types';
import type { WaterLayer } from '../waterLayer';
import { VOLUME_PER_TILE } from '../waterLayer';
import { WaterPathSystem } from '../WaterPathSystem';

export { BlockMaterial };
export { VOLUME_PER_TILE };
export type { WaterLayer };

const A = BlockMaterial.Air;
const S = BlockMaterial.Stone;
export { A, S };

/** Create a grid of all stone with empty pipe overlay. */
export function emptyGrid(w: number, h: number): {
  blocks: BlockMaterial[][];
  pipes: (PipeCell | null)[][];
} {
  const blocks: BlockMaterial[][] = [];
  const pipes: (PipeCell | null)[][] = [];
  for (let y = 0; y < h; y++) {
    blocks.push(new Array(w).fill(S));
    pipes.push(new Array(w).fill(null));
  }
  return { blocks, pipes };
}

/** Carve a rectangle of air tiles. */
export function carveRect(
  blocks: BlockMaterial[][],
  left: number, top: number, right: number, bottom: number,
): void {
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      blocks[y][x] = A;
    }
  }
}

/** Set a single tile to air. */
export function setAir(blocks: BlockMaterial[][], x: number, y: number): void {
  blocks[y][x] = A;
}

/** Set a single tile to stone. */
export function setStone(blocks: BlockMaterial[][], x: number, y: number): void {
  blocks[y][x] = S;
}

/** Place a pipe at (x, y). Connectivity determined by adjacency. */
export function setPipe(
  pipes: (PipeCell | null)[][],
  x: number, y: number,
): void {
  pipes[y][x] = true;
}

/** Create a WaterPathSystem from blocks and pipes with optional initial water. */
export function createSystem(
  blocks: BlockMaterial[][],
  pipes: (PipeCell | null)[][],
  initialWater?: WaterLayer[],
  pumps?: PumpCell[],
): WaterPathSystem {
  const h = blocks.length;
  const w = blocks[0].length;
  return new WaterPathSystem({
    width: w,
    height: h,
    blocks,
    pipes,
    pumps,
    initialWaterVolume: initialWater,
  });
}

/** Advance the simulation by n ticks. */
export function runTicks(system: WaterPathSystem, n: number): void {
  for (let i = 0; i < n; i++) system.update();
}

/** Total water volume in layers (pipeFill is visual-only in path system). */
export function totalVolume(system: WaterPathSystem): number {
  let total = 0;
  for (const layer of system.state.waterLayers) {
    total += layer.volume;
  }
  return total;
}

/** Total water volume in layers overlapping a rectangular region. */
export function volumeInRegion(
  system: WaterPathSystem,
  left: number, top: number, right: number, bottom: number,
): number {
  let total = 0;
  for (const layer of system.state.waterLayers) {
    if (layer.y >= top && layer.y <= bottom &&
        layer.left <= right && layer.right >= left) {
      total += layer.volume;
    }
  }
  return total;
}
