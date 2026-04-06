/**
 * GasPathSystem — orchestrates path-based gas simulation.
 *
 * Mirror of WaterPathSystem with inverted gravity.
 * Each tick:
 * 1. Teleport gas along previous tick's paths
 * 2. Clear pipeFill
 * 3. Detect exits from all gas pools
 * 4. Trace paths from each exit
 * 5. Store paths for renderer
 * 6. Mark pipeFill for path nodes inside pipes
 */

import { BlockMaterial } from '../types';
import type { GasSimState, GasConfig, GasSaveData } from './types';
import { ExitType } from './types';
import type { GasLayer } from './types';
import type { LiquidContext } from '../water/types';
import { cloneGasLayers, addGas, isGasFull, findContainedGasLayer, findGasLayer, getGasAt, VOLUME_PER_TILE } from './gasLayer';
import { findGasPoolExits } from './gasExitDetection';
import { traceLiquidPath } from '../liquidTrace';
import { teleportGas } from './gasTeleport';
import { recombineGasAtTile } from './gasRecombine';
import { isBetweenTwoLayers, layerBridgesLiquid } from '../liquidMerge';

export class GasPathSystem {
  readonly state: GasSimState;
  private readonly blocks: BlockMaterial[][];
  private readonly w: number;
  private readonly h: number;
  private readonly initialGasLayers: GasLayer[];
  private forkToggle = false;

  constructor(config: GasConfig) {
    this.blocks = config.blocks;
    this.w = config.width;
    this.h = config.height;
    this.initialGasLayers = cloneGasLayers(config.initialGasVolume ?? []);

    const pipeFill: number[][] = [];
    for (let y = 0; y < this.h; y++) {
      pipeFill.push(new Array(this.w).fill(0));
    }

    this.state = {
      gasLayers: cloneGasLayers(this.initialGasLayers),
      pipes: config.pipes,
      pumps: config.pumps ?? [],
      pipeFill,
      paths: [],
      pipeRoundRobin: new Map(),
    };
  }

  /** Advance the gas simulation by one tick. */
  update(): void {
    // 1. Teleport gas along PREVIOUS tick's paths
    const deposits: { x: number; y: number }[] = [];
    if (this.state.paths.length > 0) {
      teleportGas(
        this.state.paths,
        this.state.gasLayers,
        this.blocks,
        this.w, this.h,
        this.forkToggle,
        this.state.pipeRoundRobin,
        deposits,
      );
      this.forkToggle = !this.forkToggle;
    }

    // 1b. Check if any deposit bridged two gas pools → instant merge
    this.checkBridges(deposits);

    // 2. Clear pipeFill
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        this.state.pipeFill[y][x] = 0;
      }
    }

    // 3. Detect exits
    const exits = findGasPoolExits(
      this.state.gasLayers, this.blocks, this.state.pipes,
      this.state.pumps, this.w, this.h,
    );

    // 4. Trace paths
    const layers = this.state.gasLayers;
    const ctx: LiquidContext = {
      dy: -1,
      findLayer: (x, y) => findGasLayer(layers, x, y),
      isFull: (x, y) => isGasFull(layers, x, y),
      getVolume: (x, y) => getGasAt(layers, x, y),
      findContained: (x, y) => findContainedGasLayer(x, y, this.blocks, layers, this.w, this.h),
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

    // 6. Mark pipeFill
    for (const path of this.state.paths) {
      for (const branch of path.branches) {
        for (const node of branch.nodes) {
          if (node.inPipe && node.y >= 0 && node.y < this.h && node.x >= 0 && node.x < this.w) {
            this.state.pipeFill[node.y][node.x] = 4;
          }
        }
      }
    }
  }

  get active(): boolean {
    return this.state.paths.length > 0;
  }

  serializeGas(): GasSaveData {
    return {
      gasLayers: cloneGasLayers(this.state.gasLayers),
      pipeFill: this.state.pipeFill.map(row => [...row]),
      pipes: this.state.pipes.map(row => [...row]),
      pumps: this.state.pumps.map(p => ({ ...p })),
    };
  }

  static restoreState(system: GasPathSystem, data: GasSaveData): void {
    system.state.gasLayers.length = 0;
    for (const l of cloneGasLayers(data.gasLayers)) {
      system.state.gasLayers.push(l);
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
   * Fill the contained air layer at or above (x, y) to full capacity.
   * Scans upward to find the highest fillable row (inverted from water).
   */
  fillAt(x: number, y: number): void {
    let targetY = y;
    while (targetY > 0) {
      const above = targetY - 1;
      if (this.blocks[above][x] !== BlockMaterial.Air) break;
      if (isGasFull(this.state.gasLayers, x, above)) break;
      targetY = above;
    }
    if (isGasFull(this.state.gasLayers, x, targetY)) return;

    const contained = findContainedGasLayer(
      x, targetY, this.blocks, this.state.gasLayers, this.w, this.h,
    );
    if (!contained) return;

    const width = contained.right - contained.left + 1;
    addGas(this.state.gasLayers, this.blocks, x, targetY, width * VOLUME_PER_TILE, this.w, this.h);
  }

  onBlockRemoved(x: number, y: number): void {
    const layers = this.state.gasLayers;

    // No adjacent gas → nothing to do
    const adjacent: [number, number][] = [
      [x - 1, y], [x + 1, y],
      [x, y - 1], [x, y + 1],
    ];
    const hasAdjacentGas = adjacent.some(([ax, ay]) => {
      const l = findGasLayer(layers, ax, ay);
      return l !== null && l.volume > 0;
    });
    if (!hasAdjacentGas) return;

    // Case 1: Between two liquid layers on opposite sides → instant merge
    if (isBetweenTwoLayers(x, y, layers)) {
      recombineGasAtTile(x, y, layers, this.blocks, this.w, this.h);
      return;
    }

    // Case 2: Contained pocket → instant fill via recombine
    const contained = findContainedGasLayer(
      x, y, this.blocks, layers, this.w, this.h,
    );
    if (contained) {
      recombineGasAtTile(x, y, layers, this.blocks, this.w, this.h);
      return;
    }

    // Otherwise: let normal gas exit detection + flow handle it gradually
  }

  /** Check if any teleport deposit bridged two gas pools → trigger merge. */
  private checkBridges(deposits: { x: number; y: number }[]): void {
    if (deposits.length === 0) return;
    const layers = this.state.gasLayers;
    const seen = new Set<string>();

    for (const { x, y } of deposits) {
      const key = `${x},${y}`;
      if (seen.has(key)) continue;
      seen.add(key);

      if (layerBridgesLiquid(x, y, layers)) {
        recombineGasAtTile(x, y, layers, this.blocks, this.w, this.h);
        return; // layers reorganized — check again next tick
      }
    }
  }

  reset(): void {
    this.state.gasLayers.length = 0;
    for (const l of cloneGasLayers(this.initialGasLayers)) {
      this.state.gasLayers.push(l);
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
