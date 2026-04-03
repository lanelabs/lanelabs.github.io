/**
 * Gas system types — mirrors water types with inverted gravity.
 *
 * Gas rises (y-1) instead of falling (y+1), pools on ceilings,
 * and uses down-pumps instead of up-pumps.
 *
 * Reuses PipeCell, PumpCell, PathNode, PathBranch from water types.
 */

import type { WaterLayer } from '../water/waterLayer';
import type { PipeCell, PumpCell, PathNode, PathBranch, PipeRoundRobin } from '../water/types';
import { ExitType } from '../water/types';

/** Gas layer is the same shape as WaterLayer (y, left, right, volume). */
export type GasLayer = WaterLayer;

/** A complete gas path from a pool exit to one or more destinations. */
export interface GasPath {
  exitX: number;
  exitY: number;
  exitType: ExitType;
  rate: number;
  sourceX: number;
  sourceLayerY: number;
  branches: PathBranch[];
  networkId?: number;
  validExitTerminals?: { x: number; y: number }[];
}

/** Full gas simulation state. */
export interface GasSimState {
  gasLayers: GasLayer[];
  pipes: (PipeCell | null)[][];
  pumps: PumpCell[];
  pipeFill: number[][];
  paths: GasPath[];
  pipeRoundRobin: Map<number, PipeRoundRobin>;
}

/** Serialized gas state for save/load. */
export interface GasSaveData {
  gasLayers: GasLayer[];
  pipeFill: number[][];
  pipes?: (PipeCell | null)[][];
  pumps?: PumpCell[];
}

/** Compile-time guard: mirrors water — see water/types.ts for explanation. */
type GasTransientKeys = 'paths' | 'pipeRoundRobin';
type _AssertNever<T extends never> = T;
type _CheckGasSave = _AssertNever<Exclude<keyof GasSimState, GasTransientKeys | keyof GasSaveData>>;

/** Config to initialize the gas system. */
export interface GasConfig {
  width: number;
  height: number;
  blocks: import('../types').BlockMaterial[][];
  pipes: (PipeCell | null)[][];
  pumps?: PumpCell[];
  initialGasVolume?: GasLayer[];
}

export { ExitType };
export type { PipeCell, PumpCell, PathNode, PathBranch, PipeRoundRobin };
