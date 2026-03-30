/**
 * WaterSnakeSystem — orchestrates water snakes and pipe flow.
 *
 * Each tick:
 * 1. Advance each active snake (state machine)
 * 2. Advance pipe flow (drain pull, pipe-to-pipe, pipe exit)
 * 3. Mark ghost tiles for rendering
 * 4. Clean up done snakes
 */

import { BlockMaterial } from '../types';
import type { WaterSimState, WaterConfig, WaterSnake, WaterSaveData } from './types';
import { SnakeState } from './types';
import type { WaterLayer } from './waterLayer';
import { cloneLayers } from './waterLayer';
import { advanceSnake } from './snakeAdvance';
import { advancePipes } from './pipeFlow';
import { bleedLayers } from './layerBleed';

export class WaterSnakeSystem {
  readonly state: WaterSimState;
  private readonly blocks: BlockMaterial[][];
  private readonly w: number;
  private readonly h: number;
  private readonly initialWaterLayers: WaterLayer[];

  constructor(config: WaterConfig) {
    this.blocks = config.blocks;
    this.w = config.width;
    this.h = config.height;
    this.initialWaterLayers = cloneLayers(config.initialWaterVolume ?? []);

    const pipeFill: number[][] = [];
    for (let y = 0; y < this.h; y++) {
      pipeFill.push(new Array(this.w).fill(0));
    }

    this.state = {
      waterLayers: cloneLayers(this.initialWaterLayers),
      pipes: config.pipes,
      pipeFill,
      snakes: [],
      ghostTiles: new Set(),
      nextSnakeId: 1,
    };
  }

  /** Advance the water simulation by one tick. */
  update(): void {
    this.state.ghostTiles.clear();

    // 1. Advance snakes
    const newSnakes: WaterSnake[] = [];
    for (const snake of this.state.snakes) {
      if (snake.state === SnakeState.DONE) continue;
      const result = advanceSnake(snake, this.blocks, this.w, this.h, this.state);
      if (result.split) newSnakes.push(result.split);
    }
    this.state.snakes.push(...newSnakes);

    // 2. Advance pipe flow (may spawn new snakes at pipe exits)
    const pipeSpawned = advancePipes(this.blocks, this.w, this.h, this.state);
    this.state.snakes.push(...pipeSpawned);

    // 3. Breach drainage — water layers drain through unsupported edges
    const breachSpawned = bleedLayers(this.blocks, this.w, this.h, this.state);
    this.state.snakes.push(...breachSpawned);

    // 4. Mark ghost tiles for active free-flowing snakes
    for (const snake of this.state.snakes) {
      if (snake.state === SnakeState.DONE) continue;
      if (snake.state === SnakeState.FILLING || snake.state === SnakeState.RISING) continue;
      this.state.ghostTiles.add(`${snake.x},${snake.y}`);
    }

    // 5. Clean up done snakes
    this.state.snakes = this.state.snakes.filter(s => s.state !== SnakeState.DONE);
  }

  /** Whether any water is actively flowing (snakes alive or pipes have water). */
  get active(): boolean {
    if (this.state.snakes.length > 0) return true;
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.state.pipeFill[y][x] > 0) return true;
      }
    }
    return false;
  }

  /** Serialize water state for persistence. ghostTiles is transient — omitted. */
  serializeWater(): WaterSaveData {
    return {
      waterLayers: cloneLayers(this.state.waterLayers),
      pipeFill: this.state.pipeFill.map(row => [...row]),
      snakes: this.state.snakes.map(s => ({ ...s })),
      nextSnakeId: this.state.nextSnakeId,
    };
  }

  /** Restore water state from saved data. */
  static restoreState(system: WaterSnakeSystem, data: WaterSaveData): void {
    system.state.waterLayers.length = 0;
    for (const l of cloneLayers(data.waterLayers)) {
      system.state.waterLayers.push(l);
    }
    for (let y = 0; y < system.h; y++) {
      for (let x = 0; x < system.w; x++) {
        system.state.pipeFill[y][x] = data.pipeFill[y]?.[x] ?? 0;
      }
    }
    system.state.snakes = data.snakes.map(s => ({ ...s }));
    system.state.nextSnakeId = data.nextSnakeId;
    system.state.ghostTiles.clear();
  }

  /** Reset all water state — restore initial reservoir volumes. */
  reset(): void {
    this.state.waterLayers.length = 0;
    for (const l of cloneLayers(this.initialWaterLayers)) {
      this.state.waterLayers.push(l);
    }
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        this.state.pipeFill[y][x] = 0;
      }
    }
    this.state.snakes = [];
    this.state.ghostTiles.clear();
    this.state.nextSnakeId = 1;
  }
}
