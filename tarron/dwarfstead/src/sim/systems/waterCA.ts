/**
 * Cellular automata water simulation — integer levels (0–5).
 *
 * Each air tile stores an integer 0–5:
 *   0 = dry, 1–4 = partial fill (20% increments), 5 = full.
 *
 * Flow rules per tick (bottom-to-top scan):
 *   1. DOWN (priority): dump all available water downward (bulk transfer).
 *   2. SIDE (left/right): if diff > 1, move 1 unit toward lower neighbor.
 *      Only fires if cell still has water after DOWN.
 *   3. EQUALIZE: when main flow settles, randomly resolve diff==1 pairs.
 *   No UP flow. No compression. No pressure math.
 */

import { BlockMaterial } from '../types';

// ── Constants ──────────────────────────────────────────────────────────
export const MAX_WATER = 5;
export const WATER_FLOOD_THRESHOLD = 2;
export const WATER_SWIM_THRESHOLD = 2;

let eqScanLeftToRight = true;

export interface WaterCAContext {
  width: number;
  height: number;
  blocks: BlockMaterial[][];
  waterMass: number[][];
  waterMassNext: number[][];
  settled: boolean[][];
}

/** Run one CA tick. Mutates waterMassNext, then swaps into waterMass. Returns max single-cell delta. */
export function simulateWaterCA(ctx: WaterCAContext): number {
  const { width, height, blocks, waterMass, waterMassNext, settled } = ctx;

  // Copy current into next buffer
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      waterMassNext[y][x] = waterMass[y][x];
    }
  }

  let mainFlowOccurred = false;

  // Process bottom-to-top so gravity cascades in one tick
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      if (settled[y][x]) continue;
      const mass = waterMass[y][x];
      if (mass <= 0) continue;
      if (blocks[y][x] !== BlockMaterial.Air) continue;

      // ── Flow DOWN (bulk transfer) ──
      if (y + 1 < height && blocks[y + 1][x] === BlockMaterial.Air) {
        const space = MAX_WATER - waterMassNext[y + 1][x];
        const flow = Math.min(waterMassNext[y][x], space);
        if (flow > 0) {
          waterMassNext[y][x] -= flow;
          waterMassNext[y + 1][x] += flow;
          settled[y + 1][x] = false;
          mainFlowOccurred = true;
        }
      }

      // ── Flow SIDE (left/right) — only if we still have water ──
      if (waterMassNext[y][x] <= 0) continue;

      const cur = waterMassNext[y][x];

      // LEFT
      if (x - 1 >= 0 && blocks[y][x - 1] === BlockMaterial.Air) {
        const diff = cur - waterMassNext[y][x - 1];
        if (diff > 1) {
          waterMassNext[y][x]--;
          waterMassNext[y][x - 1]++;
          settled[y][x - 1] = false;
          mainFlowOccurred = true;
        }
      }

      // RIGHT (re-read cur since LEFT may have changed it)
      if (x + 1 < width && blocks[y][x + 1] === BlockMaterial.Air) {
        const diff = waterMassNext[y][x] - waterMassNext[y][x + 1];
        if (diff > 1) {
          waterMassNext[y][x]--;
          waterMassNext[y][x + 1]++;
          settled[y][x + 1] = false;
          mainFlowOccurred = true;
        }
      }
    }
  }

  // ── Equalization pass: resolve diff==1 pairs randomly ──
  // Alternate scan direction each tick so neither side is favored
  if (!mainFlowOccurred) {
    eqScanLeftToRight = !eqScanLeftToRight;
    for (let y = 0; y < height; y++) {
      const xStart = eqScanLeftToRight ? 0 : width - 2;
      const xEnd = eqScanLeftToRight ? width - 1 : -1;
      const xStep = eqScanLeftToRight ? 1 : -1;
      for (let x = xStart; x !== xEnd; x += xStep) {
        if (blocks[y][x] !== BlockMaterial.Air) continue;
        if (blocks[y][x + 1] !== BlockMaterial.Air) continue;
        const diff = waterMass[y][x] - waterMass[y][x + 1];
        if (diff === 1 && Math.random() < 0.5) {
          waterMassNext[y][x]--;
          waterMassNext[y][x + 1]++;
        } else if (diff === -1 && Math.random() < 0.5) {
          waterMassNext[y][x]++;
          waterMassNext[y][x + 1]--;
        }
      }
    }
  }

  // Swap buffers: copy next into current, compute maxDelta
  let maxDelta = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const delta = Math.abs(waterMassNext[y][x] - waterMass[y][x]);
      if (delta > maxDelta) maxDelta = delta;
      if (delta === 0) {
        settled[y][x] = true;
      } else {
        // Unsettle cardinal neighbors so they re-evaluate
        if (x > 0) settled[y][x - 1] = false;
        if (x + 1 < width) settled[y][x + 1] = false;
        if (y > 0) settled[y - 1][x] = false;
        if (y + 1 < height) settled[y + 1][x] = false;
      }
      waterMass[y][x] = waterMassNext[y][x];
    }
  }

  return maxDelta;
}
