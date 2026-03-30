/**
 * Chip corner fill logic — determines what color (if any) fills the
 * triangular gaps left by terrain chip cutouts on solid blocks (outside
 * corners), based on adjacent water or structures.
 *
 * Inside-corner debris chips (terrain color bleeding into air tiles) are
 * NOT handled here — those stay as terrain color from the terrain renderer.
 */

import Phaser from 'phaser';
import type { WaterLayer } from '../../sim/water/waterLayer';
import { findLayer, isWaterFull } from '../../sim/water/waterLayer';

const WATER_COLOR = 0x2266cc;
const WATER_ALPHA = 1;
const WOOD_COLOR = 0x3d3530;
const ROPE_COLOR = 0x5C3A1E;

/** Per-corner fill color (null = leave empty). */
export interface ChipFill {
  tl: number | null;
  tr: number | null;
  bl: number | null;
  br: number | null;
}

/** Optional structure queries — omit in water-only scenes. */
export interface EntityQuery {
  hasPlatform(x: number, y: number): boolean;
  hasLadder(x: number, y: number): boolean;
  hasRope(x: number, y: number): boolean;
}

/**
 * Determine fill colors for the top and bottom chips on one side
 * of a solid block. Priority: platform > ladder > rope > water.
 *
 * Water logic: if the side tile's water layer is full, fill both chips.
 * If it has some water (but not full), fill only the bottom chip.
 */
function sideFills(
  sideX: number, wy: number,
  layers: WaterLayer[],
  eq?: EntityQuery,
): { top: number | null; bottom: number | null } {
  if (eq) {
    if (eq.hasPlatform(sideX, wy)) return { top: WOOD_COLOR, bottom: null };
    if (eq.hasLadder(sideX, wy)) return { top: WOOD_COLOR, bottom: WOOD_COLOR };
    if (eq.hasRope(sideX, wy)) return { top: ROPE_COLOR, bottom: ROPE_COLOR };
  }

  const layer = findLayer(layers, sideX, wy);
  if (!layer || layer.volume <= 0) return { top: null, bottom: null };

  const full = isWaterFull(layers, sideX, wy);
  return {
    top: full ? WATER_COLOR : null,
    bottom: WATER_COLOR,
  };
}

/** Compute chip fill colors for a solid terrain block (outside corners only). */
export function computeChipFills(
  wx: number, wy: number,
  chipTL: boolean, chipTR: boolean, chipBL: boolean, chipBR: boolean,
  waterLayers: WaterLayer[],
  entityQuery?: EntityQuery,
): ChipFill {
  const result: ChipFill = { tl: null, tr: null, bl: null, br: null };

  if (chipTL || chipBL) {
    const left = sideFills(wx - 1, wy, waterLayers, entityQuery);
    if (chipTL) result.tl = left.top;
    if (chipBL) result.bl = left.bottom;
  }

  if (chipTR || chipBR) {
    const right = sideFills(wx + 1, wy, waterLayers, entityQuery);
    if (chipTR) result.tr = right.top;
    if (chipBR) result.br = right.bottom;
  }

  return result;
}

/** Return the appropriate alpha for a chip fill color. */
export function chipAlpha(color: number): number {
  return color === WATER_COLOR ? WATER_ALPHA : 0.9;
}

/** Draw a single filled triangle in a chip corner. */
export function drawChipTriangle(
  g: Phaser.GameObjects.Graphics,
  px: number, py: number, ts: number, chip: number,
  corner: 'tl' | 'tr' | 'bl' | 'br',
  color: number, alpha: number,
): void {
  g.fillStyle(color, alpha);
  g.beginPath();
  switch (corner) {
    case 'tl':
      g.moveTo(px, py);
      g.lineTo(px + chip, py);
      g.lineTo(px, py + chip);
      break;
    case 'tr':
      g.moveTo(px + ts, py);
      g.lineTo(px + ts - chip, py);
      g.lineTo(px + ts, py + chip);
      break;
    case 'bl':
      g.moveTo(px, py + ts);
      g.lineTo(px + chip, py + ts);
      g.lineTo(px, py + ts - chip);
      break;
    case 'br':
      g.moveTo(px + ts, py + ts);
      g.lineTo(px + ts - chip, py + ts);
      g.lineTo(px + ts, py + ts - chip);
      break;
  }
  g.closePath();
  g.fillPath();
}
