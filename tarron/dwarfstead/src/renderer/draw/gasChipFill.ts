/**
 * Gas chip corner fill logic — determines what color fills the triangular
 * gaps for gas pools (top-aligned instead of bottom-aligned).
 */

import type { GasLayer } from '../../sim/gas/types';
import { findGasLayer, isGasFull } from '../../sim/gas/gasLayer';
import { GAS_COLOR } from './gasStreamConstants';

/** Per-corner fill color for gas (null = leave empty). */
export interface GasChipFill {
  tl: number | null;
  tr: number | null;
  bl: number | null;
  br: number | null;
}

/**
 * Determine fill colors for the top and bottom gas chips on one side.
 * Gas is top-aligned: if full, fill both; if partial, fill only the top chip.
 */
function gasChipSideFills(
  sideX: number, wy: number,
  layers: GasLayer[],
): { top: number | null; bottom: number | null } {
  const layer = findGasLayer(layers, sideX, wy);
  if (!layer || layer.volume <= 0) return { top: null, bottom: null };

  const full = isGasFull(layers, sideX, wy);
  return {
    top: GAS_COLOR,
    bottom: full ? GAS_COLOR : null,
  };
}

/** Compute gas chip fill colors for a solid terrain block (outside corners only). */
export function computeGasChipFills(
  wx: number, wy: number,
  chipTL: boolean, chipTR: boolean, chipBL: boolean, chipBR: boolean,
  gasLayers: GasLayer[],
): GasChipFill {
  const result: GasChipFill = { tl: null, tr: null, bl: null, br: null };

  if (chipTL || chipBL) {
    const left = gasChipSideFills(wx - 1, wy, gasLayers);
    if (chipTL) result.tl = left.top;
    if (chipBL) result.bl = left.bottom;
  }

  if (chipTR || chipBR) {
    const right = gasChipSideFills(wx + 1, wy, gasLayers);
    if (chipTR) result.tr = right.top;
    if (chipBR) result.br = right.bottom;
  }

  return result;
}
