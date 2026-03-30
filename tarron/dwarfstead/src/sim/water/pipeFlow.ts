/**
 * Pipe flow logic — moves water through pipe segments at 1 quarter/tick.
 *
 * Drain tiles passively pull water from the pool above at 1 quarter/tick.
 * Non-drain pipes propagate water from entry to exit.
 * When water exits a pipe into air, it creates a falling snake.
 */

import { BlockMaterial, Direction } from '../types';
import type { WaterSimState, WaterSnake } from './types';
import { SnakeState } from './types';
import { removeWater, findLayer } from './waterLayer';

const DIR_DX: Record<Direction, number> = {
  [Direction.Left]: -1, [Direction.Right]: 1,
  [Direction.Up]: 0, [Direction.Down]: 0,
};
const DIR_DY: Record<Direction, number> = {
  [Direction.Left]: 0, [Direction.Right]: 0,
  [Direction.Up]: -1, [Direction.Down]: 1,
};

/**
 * Advance pipe flow for all pipe segments.
 * Handles drain pulling, pipe-to-pipe transfer, and pipe exit spawning.
 * Returns newly spawned snakes (from pipe exits).
 */
export function advancePipes(
  blocks: BlockMaterial[][], w: number, h: number,
  state: WaterSimState,
): WaterSnake[] {
  const spawned: WaterSnake[] = [];

  // Process drain tiles: pull water from above into pipe
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pipe = state.pipes[y][x];
      if (!pipe || !pipe.isDrain) continue;

      // Pull from pool above (1 quarter/tick).
      // Scan upward to find the topmost non-empty water layer so
      // multi-row reservoirs drain from the surface down.
      const pipeSpace = 4 - state.pipeFill[y][x];
      if (pipeSpace <= 0) continue;

      let drainY = -1;
      for (let sy = y - 1; sy >= 0; sy--) {
        if (blocks[sy][x] !== BlockMaterial.Air) break;
        const layer = findLayer(state.waterLayers, x, sy);
        if (layer && layer.volume > 0) drainY = sy; // keep scanning up
      }
      if (drainY >= 0) {
        const layer = findLayer(state.waterLayers, x, drainY)!;
        const transfer = Math.min(1, layer.volume, pipeSpace);
        removeWater(state.waterLayers, x, drainY, transfer);
        state.pipeFill[y][x] += transfer;
      }
    }
  }

  // Propagate water through pipes: two-pass to avoid direction bias.
  // Forward pass handles right/down naturally; reverse pass handles left/up.
  const transferred = new Set<string>();

  const tryTransfer = (x: number, y: number): void => {
    const key = `${x},${y}`;
    if (transferred.has(key)) return;

    const pipe = state.pipes[y][x];
    if (!pipe) return;
    if (state.pipeFill[y][x] < 4) return; // not full, can't push

    const nx = x + DIR_DX[pipe.exit];
    const ny = y + DIR_DY[pipe.exit];
    if (nx < 0 || nx >= w || ny < 0 || ny >= h) return;

    const nextPipe = state.pipes[ny][nx];
    if (nextPipe) {
      if (state.pipeFill[ny][nx] < 4) {
        state.pipeFill[ny][nx] = Math.min(4, state.pipeFill[ny][nx] + 1);
        state.pipeFill[y][x]--;
        transferred.add(key);
      }
    } else if (blocks[ny][nx] === BlockMaterial.Air) {
      const exists = state.snakes.some(
        s => s.x === nx && s.y === ny && s.state !== SnakeState.DONE,
      );
      if (!exists) {
        spawned.push({
          id: state.nextSnakeId++,
          x: nx, y: ny,
          volume: 1,
          state: SnakeState.FALLING,
          flowDir: null,
          pipeProgress: 0,
        });
      } else {
        const existing = state.snakes.find(
          s => s.x === nx && s.y === ny && s.state !== SnakeState.DONE,
        );
        if (existing) existing.volume++;
      }
      state.pipeFill[y][x]--;
      transferred.add(key);
    }
  };

  // Forward pass (y=0→h, x=0→w) — right/down propagation
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) tryTransfer(x, y);
  }
  // Reverse pass (y=h→0, x=w→0) — left/up propagation
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) tryTransfer(x, y);
  }

  return spawned;
}
