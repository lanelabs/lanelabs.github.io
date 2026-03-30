/**
 * Water system types — quarter-block resolution.
 *
 * Base unit: quarter-block (1/4 tile).
 * Free water moves 4 quarters/tick (1 block).
 * Pipe water moves 1 quarter/tick.
 */

import type { Direction } from '../types';
import type { WaterLayer } from './waterLayer';

export enum SnakeState {
  FALLING = 'falling',
  SCANNING = 'scanning',
  FLOWING = 'flowing',
  FILLING = 'filling',
  RISING = 'rising',
  PIPE_FOLLOWING = 'pipe_following',
  DONE = 'done',
}

export interface WaterSnake {
  id: number;
  x: number;
  y: number;
  volume: number;          // quarter-blocks carried
  state: SnakeState;
  flowDir: Direction | null;
  pipeProgress: number;    // 0-3 quarters within current pipe segment
}

/** A single pipe segment — entry/exit directions for rendering + flow. */
export interface PipeCell {
  entry: Direction;        // direction water enters FROM
  exit: Direction;         // direction water exits TOWARD
  isDrain: boolean;        // embedded drain entrance (grate visual)
}

/** Full water simulation state, owned by WaterSnakeSystem. */
export interface WaterSimState {
  waterLayers: WaterLayer[];  // layer-based pool water
  pipes: (PipeCell | null)[][]; // pipe overlay grid
  pipeFill: number[][];    // 0-4 quarters of water in each pipe segment
  snakes: WaterSnake[];
  ghostTiles: Set<string>; // "x,y" keys for active snake positions
  nextSnakeId: number;
}

/** Serialized water simulation state for save/load. */
export interface WaterSaveData {
  waterLayers: WaterLayer[];
  pipeFill: number[][];
  snakes: WaterSnake[];
  nextSnakeId: number;
}

/** Config to initialize the water system. */
export interface WaterConfig {
  width: number;
  height: number;
  blocks: import('../types').BlockMaterial[][];
  pipes: (PipeCell | null)[][];
  initialWaterVolume?: WaterLayer[];
}
