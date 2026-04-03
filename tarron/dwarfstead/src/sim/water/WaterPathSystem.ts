/**
 * WaterPathSystem — orchestrates path-based water simulation.
 *
 * Each tick:
 * 1. Teleport water along paths from the previous tick (one-tick delay)
 * 2. Clear pipeFill
 * 3. Detect exits from all pools (terrain breaches + pipe terminals)
 * 4. Trace paths from each exit
 * 5. Store paths on state for renderer
 * 6. Mark pipeFill for path nodes inside pipes
 */

import { BlockMaterial } from '../types';
import type { WaterSimState, WaterConfig, WaterSaveData, LiquidContext } from './types';
import { ExitType } from './types';
import type { WaterLayer } from './waterLayer';
import { cloneLayers, addWater, isWaterFull, findContainedLayer, findLayer, getWaterAt, VOLUME_PER_TILE } from './waterLayer';
import { findPoolExits } from './exitDetection';
import { traceLiquidPath } from '../liquidTrace';
import { teleportWater } from './teleport';
import { recombineAtTile } from './recombine';

export class WaterPathSystem {
  readonly state: WaterSimState;
  private readonly blocks: BlockMaterial[][];
  private readonly w: number;
  private readonly h: number;
  private readonly initialWaterLayers: WaterLayer[];
  private forkToggle = false;

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
      pumps: config.pumps ?? [],
      pipeFill,
      paths: [],
      pipeRoundRobin: new Map(),
    };
  }

  /** Advance the water simulation by one tick. */
  update(): void {
    // 1. Teleport water along PREVIOUS tick's paths (one-tick delay)
    if (this.state.paths.length > 0) {
      teleportWater(
        this.state.paths,
        this.state.waterLayers,
        this.blocks,
        this.w, this.h,
        this.forkToggle,
        this.state.pipeRoundRobin,
      );
      this.forkToggle = !this.forkToggle;
    }

    // 2. Clear pipeFill
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        this.state.pipeFill[y][x] = 0;
      }
    }

    // 3. Detect exits (terrain breaches + pipe terminals)
    const exits = findPoolExits(
      this.state.waterLayers, this.blocks, this.state.pipes,
      this.state.pumps, this.w, this.h,
    );

    // 4. Trace paths from each exit
    const layers = this.state.waterLayers;
    const ctx: LiquidContext = {
      dy: 1,
      findLayer: (x, y) => findLayer(layers, x, y),
      isFull: (x, y) => isWaterFull(layers, x, y),
      getVolume: (x, y) => getWaterAt(layers, x, y),
      findContained: (x, y) => findContainedLayer(x, y, this.blocks, layers, this.w, this.h),
    };
    for (const exit of exits) {
      const inPipe = exit.exitType === ExitType.Pipe;
      exit.branches = traceLiquidPath(
        exit.exitX, exit.exitY, inPipe,
        this.blocks, this.state.pipes,
        this.w, this.h, ctx,
        exit.sourceX, exit.sourceLayerY,
        exit.validExitTerminals,
        this.state.pumps,
      );
    }

    // 5. Store paths for renderer
    this.state.paths = exits;

    // 6. Mark pipeFill for visual rendering of path nodes in pipes
    for (const path of this.state.paths) {
      for (const branch of path.branches) {
        for (const node of branch.nodes) {
          if (node.inPipe && node.y >= 0 && node.y < this.h && node.x >= 0 && node.x < this.w) {
            this.state.pipeFill[node.y][node.x] = 4; // full visual fill
          }
        }
      }
    }
  }

  /** Whether any water paths exist (teleport will happen next tick). */
  get active(): boolean {
    return this.state.paths.length > 0;
  }

  /** Serialize water state for persistence. */
  serializeWater(): WaterSaveData {
    return {
      waterLayers: cloneLayers(this.state.waterLayers),
      pipeFill: this.state.pipeFill.map(row => [...row]),
      pipes: this.state.pipes.map(row => [...row]),
      pumps: this.state.pumps.map(p => ({ ...p })),
    };
  }

  /** Restore water state from saved data. */
  static restoreState(system: WaterPathSystem, data: WaterSaveData): void {
    system.state.waterLayers.length = 0;
    for (const l of cloneLayers(data.waterLayers)) {
      system.state.waterLayers.push(l);
    }
    for (let y = 0; y < system.h; y++) {
      for (let x = 0; x < system.w; x++) {
        system.state.pipeFill[y][x] = data.pipeFill[y]?.[x] ?? 0;
      }
    }
    if (data.pipes) {
      for (let y = 0; y < system.h; y++) {
        for (let x = 0; x < system.w; x++) {
          system.state.pipes[y][x] = data.pipes[y]?.[x] ?? null;
        }
      }
    }
    if (data.pumps) {
      system.state.pumps.length = 0;
      for (const p of data.pumps) system.state.pumps.push({ ...p });
    }
    system.state.paths = [];
  }

  /**
   * Fill the contained air layer at or below (x, y) to full capacity.
   * Scans downward to find the lowest fillable row, then fills it.
   */
  fillAt(x: number, y: number): void {
    let targetY = y;
    while (targetY < this.h - 1) {
      const below = targetY + 1;
      if (this.blocks[below][x] !== BlockMaterial.Air) break;
      if (isWaterFull(this.state.waterLayers, x, below)) break;
      targetY = below;
    }
    if (isWaterFull(this.state.waterLayers, x, targetY)) return;

    const contained = findContainedLayer(
      x, targetY, this.blocks, this.state.waterLayers, this.w, this.h,
    );
    if (!contained) return;

    const width = contained.right - contained.left + 1;
    addWater(this.state.waterLayers, this.blocks, x, targetY, width * VOLUME_PER_TILE, this.w, this.h);
  }

  /**
   * Handle a block being removed at (x, y).
   * If any adjacent tile has water, attempt pool recombination.
   */
  onBlockRemoved(x: number, y: number): void {
    const layers = this.state.waterLayers;
    const adjacent = [
      [x - 1, y], [x + 1, y],
      [x, y - 1], [x, y + 1],
    ];
    const hasAdjacentWater = adjacent.some(
      ([ax, ay]) => findLayer(layers, ax, ay) !== null,
    );
    if (!hasAdjacentWater) return;
    recombineAtTile(x, y, layers, this.blocks, this.w, this.h);
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
    this.state.paths = [];
    this.state.pipeRoundRobin.clear();
    this.forkToggle = false;
  }
}
