/**
 * Gas pool detection and fill logic.
 *
 * Mirror of water poolScan.ts with inverted fill direction:
 * - Gas fills top-down (clings to ceilings) instead of bottom-up
 * - Pool layers are in top-first order
 */

import { BlockMaterial } from '../types';
import type { GasLayer } from './types';
import { findGasLayer, addGas } from './gasLayer';

/** A single horizontal layer in a gas pool. */
export interface GasPoolLayer {
  y: number;
  left: number;
  right: number;
  capacity: number;
}

/** Gas pool boundary info. */
export interface GasPoolInfo {
  layers: GasPoolLayer[]; // top-first order (lowest y first)
}

function layerVolume(layer: GasPoolLayer, gasLayers: GasLayer[]): number {
  const gl = findGasLayer(gasLayers, layer.left, layer.y);
  return gl ? gl.volume : 0;
}

/**
 * Deposit gas into a pool, filling top-down (inverted from water's bottom-up).
 * Returns the volume actually deposited.
 */
export function fillGasPool(
  pool: GasPoolInfo, quarters: number,
  gasLayers: GasLayer[], blocks: BlockMaterial[][],
  w: number, h: number,
): number {
  let deposited = 0;
  let remaining = quarters;

  // Fill top-first (pool.layers is top-first order)
  for (const layer of pool.layers) {
    if (remaining <= 0) break;

    const currentVol = layerVolume(layer, gasLayers);
    const space = layer.capacity - currentVol;
    if (space <= 0) continue;

    const toDeposit = Math.min(remaining, space);
    const added = addGas(gasLayers, blocks, layer.left, layer.y, toDeposit, w, h);
    deposited += added;
    remaining -= added;
  }

  return deposited;
}
