/**
 * Water system types — path-based model.
 *
 * Water only exists in pool layers. Exits generate instant paths;
 * water teleports along those paths one tick later.
 *
 * Paths are either pure-air or pipe-then-air:
 * - Air paths: pool → air → pool (terrain exits, never enter pipes)
 * - Pipe paths: pool → pipe network → air continuation → pool
 */

import type { WaterLayer } from './waterLayer';

/** How water exits a pool. */
export enum ExitType {
  Terrain = 'terrain',
  Pipe = 'pipe',
}

/**
 * Pipe segment marker. Presence in the grid means a pipe exists.
 * Connectivity and flow direction are determined by neighbor adjacency.
 */
export type PipeCell = true;

/** An up-pump placed on a pipe tile. Forces terminals above to be exit-only. */
export interface PumpCell {
  x: number;
  y: number;
  direction: 'up' | 'down';
}

/** One node along a traced water path. */
export interface PathNode {
  x: number;
  y: number;
  inPipe: boolean;
}

/** A single branch of a (potentially forked) water path. */
export interface PathBranch {
  nodes: PathNode[];
  destination: { x: number; y: number } | null;
  volumeFraction: number;  // fraction of total volume this branch receives (0..1)
}

/** A complete water path from a pool exit to one or more destinations. */
export interface WaterPath {
  exitX: number;
  exitY: number;
  exitType: ExitType;
  rate: number;               // VOLUME_PER_TILE for terrain, 1 for pipe
  sourceX: number;            // x coordinate inside the source pool
  sourceLayerY: number;
  branches: PathBranch[];
  networkId?: number;         // pipe network ID (for throughput limiting)
  /** Valid exit terminal positions for pipe paths (filters tracePipeNetwork results). */
  validExitTerminals?: { x: number; y: number }[];
}

/** Round-robin state for a single pipe network. */
export interface PipeRoundRobin {
  index: number;
  exitKeys: string[];  // terminal position fingerprint for reset detection
}

/** Full water simulation state, owned by WaterPathSystem. */
export interface WaterSimState {
  waterLayers: WaterLayer[];
  pipes: (PipeCell | null)[][];
  pumps: PumpCell[];
  pipeFill: number[][];
  paths: WaterPath[];
  pipeRoundRobin: Map<number, PipeRoundRobin>;
}

/** Serialized water simulation state for save/load. */
export interface WaterSaveData {
  waterLayers: WaterLayer[];
  pipeFill: number[][];
  pipes?: (PipeCell | null)[][];
  pumps?: PumpCell[];
}

/**
 * Compile-time guard: every WaterSimState key must be either transient or in WaterSaveData.
 * If you add a field to WaterSimState, add it to WaterTransientKeys (if recomputed each tick)
 * or to WaterSaveData (if it needs persisting). Forgetting either will cause a build error.
 */
type WaterTransientKeys = 'paths' | 'pipeRoundRobin';
type _AssertNever<T extends never> = T;
type _CheckWaterSave = _AssertNever<Exclude<keyof WaterSimState, WaterTransientKeys | keyof WaterSaveData>>;

/**
 * Callbacks that let liquidTrace work for both water (dy=+1) and gas (dy=-1).
 * Each system provides its own layer lookups so the trace algorithm is generic.
 */
export interface LiquidContext {
  /** +1 = falls down (water), -1 = rises up (gas) */
  dy: 1 | -1;
  /** Find a fluid layer at (x, y) */
  findLayer: (x: number, y: number) => { volume: number } | null;
  /** Whether tile at (x, y) is full of this fluid */
  isFull: (x: number, y: number) => boolean;
  /** Get effective volume at (x, y) */
  getVolume: (x: number, y: number) => number;
  /** Find contained layer at (x, y), checking floor (water) or ceiling (gas) */
  findContained: (x: number, y: number) => { y: number; left: number; right: number } | null;
}

/** Config to initialize the water system. */
export interface WaterConfig {
  width: number;
  height: number;
  blocks: import('../types').BlockMaterial[][];
  pipes: (PipeCell | null)[][];
  pumps?: PumpCell[];
  initialWaterVolume?: WaterLayer[];
}
