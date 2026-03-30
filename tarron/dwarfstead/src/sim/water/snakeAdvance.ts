/**
 * Snake state machine — advances one snake per call.
 *
 * States: FALLING → SCANNING → FLOWING/FILLING → RISING → (overflow) → SCANNING
 * Free water moves 1 tile/tick. Pipe water moves 1 quarter/tick.
 */

import { BlockMaterial, Direction } from '../types';
import type { WaterSimState, WaterSnake, PipeCell } from './types';
import { SnakeState } from './types';
import { findPool, fillPool, isPoolFull, findOverflow } from './poolScan';
import { isWaterFull, getWaterAt } from './waterLayer';

export interface AdvanceResult {
  split: WaterSnake | null;
}

function isSolid(blocks: BlockMaterial[][], x: number, y: number, w: number, h: number): boolean {
  if (x < 0 || x >= w || y < 0 || y >= h) return true;
  return blocks[y][x] !== BlockMaterial.Air;
}

function isBlocked(
  blocks: BlockMaterial[][], state: WaterSimState,
  x: number, y: number, w: number, h: number,
): boolean {
  if (isSolid(blocks, x, y, w, h)) return true;
  return isWaterFull(state.waterLayers, x, y);
}

function getPipe(state: WaterSimState, x: number, y: number, w: number, h: number): PipeCell | null {
  if (x < 0 || x >= w || y < 0 || y >= h) return null;
  return state.pipes[y][x];
}

export function advanceSnake(
  snake: WaterSnake,
  blocks: BlockMaterial[][], w: number, h: number,
  state: WaterSimState,
): AdvanceResult {
  switch (snake.state) {
    case SnakeState.FALLING: return advanceFalling(snake, blocks, state, w, h);
    case SnakeState.SCANNING: return advanceScanning(snake, blocks, state, w, h);
    case SnakeState.FLOWING: return advanceFlowing(snake, blocks, state, w, h);
    case SnakeState.FILLING: return advanceFilling(snake, blocks, state, w, h);
    case SnakeState.RISING: return advanceRising(snake, blocks, state, w, h);
    case SnakeState.PIPE_FOLLOWING: return advancePipe(snake, blocks, state, w, h);
    default: return { split: null };
  }
}

function advanceFalling(
  snake: WaterSnake, blocks: BlockMaterial[][],
  state: WaterSimState, w: number, h: number,
): AdvanceResult {
  // Check for pipe entrance at current position (skip drains — handled by SCANNING)
  const pipe = getPipe(state, snake.x, snake.y, w, h);
  if (pipe && pipe.entry === Direction.Up && !pipe.isDrain) {
    snake.state = SnakeState.PIPE_FOLLOWING;
    snake.pipeProgress = 0;
    return { split: null };
  }

  const below = snake.y + 1;

  // Check for pipe entrance below (pipes can be embedded in solid blocks)
  // Skip drains — water should pool above them, not enter directly
  const belowPipe = getPipe(state, snake.x, below, w, h);
  if (belowPipe && belowPipe.entry === Direction.Up && !belowPipe.isDrain) {
    snake.y = below;
    snake.state = SnakeState.PIPE_FOLLOWING;
    snake.pipeProgress = 0;
    return { split: null };
  }

  if (isBlocked(blocks, state, snake.x, below, w, h)) {
    snake.state = SnakeState.SCANNING;
    return { split: null };
  }

  snake.y = below;
  return { split: null };
}

function advanceScanning(
  snake: WaterSnake, blocks: BlockMaterial[][],
  state: WaterSimState, w: number, h: number,
): AdvanceResult {
  // Drain pipe below? Pull 1 quarter/tick, then continue scanning with remainder
  const belowPipe = getPipe(state, snake.x, snake.y + 1, w, h);
  if (belowPipe && belowPipe.isDrain && state.pipeFill[snake.y + 1][snake.x] < 4) {
    const transfer = Math.min(1, snake.volume);
    state.pipeFill[snake.y + 1][snake.x] += transfer;
    snake.volume -= transfer;
    if (snake.volume <= 0) { snake.state = SnakeState.DONE; return { split: null }; }
  }

  // Scan left for drop or wall
  const leftResult = scanDirection(snake.x, snake.y, -1, blocks, state, w, h);
  // Scan right for drop or wall
  const rightResult = scanDirection(snake.x, snake.y, 1, blocks, state, w, h);

  if (leftResult.drop && rightResult.drop) {
    if (snake.volume < 2) {
      // Can't split — alternate direction based on snake id
      snake.flowDir = snake.id % 2 === 0 ? Direction.Left : Direction.Right;
      snake.state = SnakeState.FLOWING;
      return { split: null };
    }
    // Split into two snakes
    const halfVol = Math.floor(snake.volume / 2);
    snake.volume -= halfVol;
    snake.flowDir = Direction.Left;
    snake.state = SnakeState.FLOWING;
    return {
      split: {
        id: state.nextSnakeId++,
        x: snake.x, y: snake.y,
        volume: halfVol,
        state: SnakeState.FLOWING,
        flowDir: Direction.Right,
        pipeProgress: 0,
      },
    };
  }

  if (leftResult.drop) {
    snake.flowDir = Direction.Left;
    snake.state = SnakeState.FLOWING;
  } else if (rightResult.drop) {
    snake.flowDir = Direction.Right;
    snake.state = SnakeState.FLOWING;
  } else {
    // Both walls — fill pool
    snake.state = SnakeState.FILLING;
  }

  return { split: null };
}

interface ScanResult {
  drop: boolean;
  wall: boolean;
}

function scanDirection(
  startX: number, startY: number, dx: number,
  blocks: BlockMaterial[][], state: WaterSimState,
  w: number, h: number,
): ScanResult {
  for (let x = startX + dx; x >= 0 && x < w; x += dx) {
    if (isSolid(blocks, x, startY, w, h)) return { drop: false, wall: true };
    // Treat any water tile as wall (breached pools drain on their own)
    if (getWaterAt(state.waterLayers, x, startY) > 0) return { drop: false, wall: true };
    // Check if there's a drop (air below that isn't full water)
    if (!isBlocked(blocks, state, x, startY + 1, w, h)) {
      return { drop: true, wall: false };
    }
  }
  // Hit world edge — treat as wall
  return { drop: false, wall: true };
}

function advanceFlowing(
  snake: WaterSnake, blocks: BlockMaterial[][],
  state: WaterSimState, w: number, h: number,
): AdvanceResult {
  if (!snake.flowDir) { snake.state = SnakeState.SCANNING; return { split: null }; }

  const dx = snake.flowDir === Direction.Left ? -1 : 1;
  const nx = snake.x + dx;

  if (isSolid(blocks, nx, snake.y, w, h)) {
    snake.state = SnakeState.FILLING;
    return { split: null };
  }

  snake.x = nx;

  // Drop below? Fall
  if (!isBlocked(blocks, state, snake.x, snake.y + 1, w, h)) {
    snake.state = SnakeState.FALLING;
  }

  return { split: null };
}

function advanceFilling(
  snake: WaterSnake, blocks: BlockMaterial[][],
  state: WaterSimState, w: number, h: number,
): AdvanceResult {
  const pool = findPool(snake.x, snake.y, blocks, state.waterLayers, w, h);
  if (!pool || pool.layers.length === 0) {
    snake.state = SnakeState.DONE;
    return { split: null };
  }

  // Deposit up to 4 quarters per tick (free water speed)
  const toDeposit = Math.min(4, snake.volume);
  const deposited = fillPool(pool, toDeposit, state.waterLayers, blocks, w, h);
  snake.volume -= deposited;

  if (snake.volume <= 0) { snake.state = SnakeState.DONE; return { split: null }; }

  if (isPoolFull(pool, state.waterLayers)) {
    snake.state = SnakeState.RISING;
  }

  return { split: null };
}

function advanceRising(
  snake: WaterSnake, blocks: BlockMaterial[][],
  state: WaterSimState, w: number, h: number,
): AdvanceResult {
  const pool = findPool(snake.x, snake.y, blocks, state.waterLayers, w, h);
  if (!pool || pool.layers.length === 0) {
    snake.state = SnakeState.DONE;
    return { split: null };
  }

  // Try to deposit more (pool may have expanded upward)
  const toDeposit = Math.min(4, snake.volume);
  const deposited = fillPool(pool, toDeposit, state.waterLayers, blocks, w, h);
  snake.volume -= deposited;

  if (snake.volume <= 0) { snake.state = SnakeState.DONE; return { split: null }; }

  // Look for overflow (left/right)
  const overflow = findOverflow(pool, blocks, state.waterLayers, w, h);
  if (overflow) {
    snake.x = overflow.x;
    snake.y = overflow.y;
    if (!isBlocked(blocks, state, overflow.x, overflow.y + 1, w, h)) {
      snake.state = SnakeState.FALLING;
    } else {
      snake.state = SnakeState.FLOWING;
      snake.flowDir = overflow.flowDir;
    }
    return { split: null };
  }

  // No left/right overflow — scan ALL tiles in top layer for air above.
  // The snake may have entered from a different x than its current position.
  const topLayer = pool.layers[pool.layers.length - 1];
  const aboveY = topLayer.y - 1;
  if (aboveY >= 0) {
    for (let x = topLayer.left; x <= topLayer.right; x++) {
      if (!isSolid(blocks, x, aboveY, w, h)) {
        snake.x = x;
        snake.y = aboveY;
        snake.state = SnakeState.FILLING;
        return { split: null };
      }
    }
  }
  // If truly stuck (sealed container), stay in RISING

  return { split: null };
}

function advancePipe(
  snake: WaterSnake, blocks: BlockMaterial[][],
  state: WaterSimState, w: number, h: number,
): AdvanceResult {
  const pipe = getPipe(state, snake.x, snake.y, w, h);
  if (!pipe) { snake.state = SnakeState.FALLING; return { split: null }; }

  // Add 1 quarter to pipe fill (pipe speed = 1 quarter/tick)
  if (state.pipeFill[snake.y][snake.x] < 4) {
    state.pipeFill[snake.y][snake.x]++;
    snake.volume--;
    snake.pipeProgress++;
  }

  // When segment full (4/4), move to next
  if (snake.pipeProgress >= 4 || state.pipeFill[snake.y][snake.x] >= 4) {
    const dx = pipe.exit === Direction.Right ? 1 : pipe.exit === Direction.Left ? -1 : 0;
    const dy = pipe.exit === Direction.Down ? 1 : pipe.exit === Direction.Up ? -1 : 0;
    const nx = snake.x + dx;
    const ny = snake.y + dy;

    const nextPipe = getPipe(state, nx, ny, w, h);
    if (nextPipe) {
      snake.x = nx;
      snake.y = ny;
      snake.pipeProgress = 0;
    } else {
      // Pipe exit — resume free flow
      snake.x = nx;
      snake.y = ny;
      snake.state = SnakeState.FALLING;
      snake.pipeProgress = 0;
    }
  }

  if (snake.volume <= 0) snake.state = SnakeState.DONE;
  return { split: null };
}
