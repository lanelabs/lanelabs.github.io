/**
 * Shared test utilities for water snake system tests.
 */

import { BlockMaterial, Direction } from '../../types';
import type { PipeCell } from '../types';
import { SnakeState } from '../types';
import type { WaterLayer } from '../waterLayer';
import { WaterSnakeSystem } from '../WaterSnakeSystem';

export { BlockMaterial, Direction };
export { SnakeState };
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

/** Create a WaterSnakeSystem from blocks and pipes with optional initial water. */
export function createSystem(
  blocks: BlockMaterial[][],
  pipes: (PipeCell | null)[][],
  initialWater?: WaterLayer[],
): WaterSnakeSystem {
  const h = blocks.length;
  const w = blocks[0].length;
  return new WaterSnakeSystem({
    width: w,
    height: h,
    blocks,
    pipes,
    initialWaterVolume: initialWater,
  });
}

/** Advance the simulation by n ticks. */
export function runTicks(system: WaterSnakeSystem, n: number): void {
  for (let i = 0; i < n; i++) system.update();
}

/** Inject a FALLING snake into the system. */
export function spawnSnake(
  system: WaterSnakeSystem, x: number, y: number, volume: number,
): void {
  system.state.snakes.push({
    id: system.state.nextSnakeId++,
    x, y, volume,
    state: SnakeState.FALLING,
    flowDir: null,
    pipeProgress: 0,
  });
}

/** Total water volume in layers within a rectangular region. */
export function volumeInRegion(
  system: WaterSnakeSystem,
  left: number, top: number, right: number, bottom: number,
): number {
  let total = 0;
  for (const layer of system.state.waterLayers) {
    if (layer.y >= top && layer.y <= bottom &&
        layer.left >= left && layer.right <= right) {
      total += layer.volume;
    }
  }
  return total;
}

/** Total water everywhere: layers + active snakes + pipe fill. */
export function totalVolume(system: WaterSnakeSystem): number {
  let total = 0;
  for (const layer of system.state.waterLayers) {
    total += layer.volume;
  }
  for (const snake of system.state.snakes) {
    if (snake.state !== SnakeState.DONE) total += snake.volume;
  }
  const h = system.state.pipeFill.length;
  const w = h > 0 ? system.state.pipeFill[0].length : 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      total += system.state.pipeFill[y][x];
    }
  }
  return total;
}

/** Place a pipe cell in the pipe grid. */
export function setPipe(
  pipes: (PipeCell | null)[][],
  x: number, y: number,
  entry: Direction, exit: Direction,
  isDrain = false,
): void {
  pipes[y][x] = { entry, exit, isDrain };
}
