/**
 * WaterFlowSystem — wraps the cellular automata water engine.
 *
 * Owns work buffers (waterMassNext, settled), drives season cycling,
 * and handles mass injection (wet) / evaporation (dry).
 */

import type { System } from '../ecs/System';
import type { World } from '../ecs/World';
import type { GameLog } from '../log/GameLog';
import { Season, BlockMaterial } from '../types';
import { simulateWaterCA, MAX_WATER, type WaterCAContext } from './waterCA';

export interface WaterFlowState {
  season: Season;
  seasonTick: number;
  seasonLength: number;
}

export interface WaterFlowConfig {
  terrain: {
    width: number;
    height: number;
    blocks: BlockMaterial[][];
    waterMass: number[][];
    surfaceY: number;
  };
  state: WaterFlowState;
}

/** Max single-cell delta below which water is considered settled. */
const SETTLE_FLOW = 1;

export class WaterFlowSystem implements System {
  readonly name = 'waterFlow';

  /** True when any water tile is unsettled and needs more CA ticks. */
  waterActive = false;
  /** Consecutive ticks where maxFlow < SETTLE_FLOW. */
  lowFlowStreak = 0;
  /** maxFlow returned by last CA tick. */
  lastMaxFlow = 0;

  readonly settled: boolean[][];
  private readonly terrain: WaterFlowConfig['terrain'];
  private readonly state: WaterFlowState;
  private readonly waterMassNext: number[][];


  constructor(cfg: WaterFlowConfig) {
    this.terrain = cfg.terrain;
    this.state = cfg.state;
    const { width, height } = this.terrain;

    // Allocate work buffers
    this.waterMassNext = [];
    this.settled = [];
    for (let y = 0; y < height; y++) {
      this.waterMassNext.push(new Array(width).fill(0));
      this.settled.push(new Array(width).fill(false));
    }
  }

  /** Mark a tile + neighbors as unsettled (call when terrain changes). */
  markUnsettled(x: number, y: number): void {
    const { width, height } = this.terrain;
    this.lowFlowStreak = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          this.settled[ny][nx] = false;
        }
      }
    }
  }

  update(_world: World, log: GameLog): void {
    const s = this.state;
    s.seasonTick++;

    // Season transition
    if (s.seasonTick >= s.seasonLength) {
      s.seasonTick = 0;
      s.season = s.season === Season.Dry ? Season.Wet : Season.Dry;
      if (s.season === Season.Wet) {
        log.add('system', 'The rains begin. Water seeps into the depths...');
      } else {
        log.add('system', 'The dry season arrives. The waters slowly evaporate.');
      }
    }

    // Wet season: inject water at world edges in the lower third
    if (s.season === Season.Wet && s.seasonTick % 3 === 0) {
      this.injectEdgeWater();
    }

    // Dry season: evaporation disabled for now (drains sealed caverns too fast)
    // if (s.season === Season.Dry && s.seasonTick % 5 === 0) {
    //   this.evaporate();
    // }

    // Run CA simulation
    const ctx: WaterCAContext = {
      width: this.terrain.width,
      height: this.terrain.height,
      blocks: this.terrain.blocks,
      waterMass: this.terrain.waterMass,
      waterMassNext: this.waterMassNext,
      settled: this.settled,
    };
    const maxFlow = simulateWaterCA(ctx);
    this.lastMaxFlow = maxFlow;

    // Require several consecutive low-flow ticks before declaring equilibrium
    if (maxFlow < SETTLE_FLOW) {
      this.lowFlowStreak++;
    } else {
      this.lowFlowStreak = 0;
    }
    if (this.lowFlowStreak >= 3) {
      for (let y = 0; y < this.terrain.height; y++) {
        for (let x = 0; x < this.terrain.width; x++) {
          this.settled[y][x] = true;
        }
      }
      this.waterActive = false;
      return;
    }

    // Otherwise mark empty tiles as settled and track whether any water is still active
    let anyActive = false;
    for (let y = 0; y < this.terrain.height; y++) {
      for (let x = 0; x < this.terrain.width; x++) {
        if (this.terrain.waterMass[y][x] <= 0) {
          this.settled[y][x] = true;
        } else if (!this.settled[y][x]) {
          anyActive = true;
        }
      }
    }
    this.waterActive = anyActive;
  }

  private injectEdgeWater(): void {
    const { width, height, blocks, waterMass, surfaceY } = this.terrain;
    const lowerStart = Math.floor(surfaceY + (height - surfaceY) * 0.6);
    const lowerEnd = height - 2;

    for (let y = lowerStart; y < lowerEnd; y++) {
      // Left edge
      if (blocks[y][0] === BlockMaterial.Air && waterMass[y][0] < MAX_WATER) {
        waterMass[y][0] = Math.min(waterMass[y][0] + 1, MAX_WATER);
        this.settled[y][0] = false;
      }
      // Right edge
      if (blocks[y][width - 1] === BlockMaterial.Air && waterMass[y][width - 1] < MAX_WATER) {
        waterMass[y][width - 1] = Math.min(waterMass[y][width - 1] + 1, MAX_WATER);
        this.settled[y][width - 1] = false;
      }
    }
  }

  private evaporate(): void {
    const { width, height, waterMass } = this.terrain;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (waterMass[y][x] > 0) {
          waterMass[y][x]--;
          this.settled[y][x] = false;
        }
      }
    }
  }
}
