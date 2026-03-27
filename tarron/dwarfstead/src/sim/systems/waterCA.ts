/**
 * Cellular automata water simulation — integer levels (0–5).
 *
 * Each air tile stores an integer 0–5:
 *   0 = dry, 1–4 = partial fill (20% increments), 5 = full.
 *
 * Flow rules per tick (bottom-to-top scan):
 *   1. DOWN (priority): dump all available water downward (bulk transfer).
 *   2. SIDE (left/right): if diff >= 1, move 1 unit toward lower neighbor.
 *      Only fires if cell still has water after DOWN.
 *   No UP flow. No compression. No pressure math.
 *
 * A separate `snapPoolsToFlat` pass runs before CA each tick to resolve
 * nearly-flat sealed pools to exact equilibrium via majority vote.
 */

import { BlockMaterial } from '../types';

// ── Constants ──────────────────────────────────────────────────────────
export const MAX_WATER = 5;
export const WATER_FLOOD_THRESHOLD = 2;
export const WATER_SWIM_THRESHOLD = 2;

// Alternate x-scan direction each tick to prevent push-pull fixed points
let scanLeftToRight = true;

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

  // Alternate x-scan direction to break push-pull symmetry
  scanLeftToRight = !scanLeftToRight;
  const xStart = scanLeftToRight ? 0 : width - 1;
  const xEnd = scanLeftToRight ? width : -1;
  const xStep = scanLeftToRight ? 1 : -1;

  // Process bottom-to-top so gravity cascades in one tick
  for (let y = height - 1; y >= 0; y--) {
    for (let x = xStart; x !== xEnd; x += xStep) {
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
        }
      }

      // ── Flow SIDE (left/right) — only if we still have water ──
      if (waterMassNext[y][x] <= 0) continue;

      const cur = waterMassNext[y][x];

      // LEFT
      if (x - 1 >= 0 && blocks[y][x - 1] === BlockMaterial.Air) {
        const diff = cur - waterMassNext[y][x - 1];
        if (diff >= 1) {
          waterMassNext[y][x]--;
          waterMassNext[y][x - 1]++;
          settled[y][x - 1] = false;
        }
      }

      // RIGHT (re-read cur since LEFT may have changed it)
      if (x + 1 < width && blocks[y][x + 1] === BlockMaterial.Air) {
        const diff = waterMassNext[y][x] - waterMassNext[y][x + 1];
        if (diff >= 1) {
          waterMassNext[y][x]--;
          waterMassNext[y][x + 1]++;
          settled[y][x + 1] = false;
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

/**
 * Pre-tick pass: snap nearly-flat sealed pools to exact equilibrium.
 *
 * For each row, finds contiguous runs of water-containing air cells.
 * If the run is sealed (solid/full-water below, solid/OOB on sides)
 * and max-min <= 1, majority-vote snaps all cells to one value.
 *
 * Returns total cells snapped (0 means nothing changed).
 */
export function snapPoolsToFlat(ctx: WaterCAContext): number {
  const { width, height, blocks, waterMass } = ctx;
  let totalSnapped = 0;

  for (let y = 0; y < height; y++) {
    let runStart = -1;

    for (let x = 0; x <= width; x++) {
      // Pool surface = air cell with sealed floor (solid, full water, or world bottom)
      const isPoolSurface =
        x < width &&
        blocks[y][x] === BlockMaterial.Air &&
        (y + 1 >= height ||
         blocks[y + 1][x] !== BlockMaterial.Air ||
         waterMass[y + 1][x] >= MAX_WATER);

      if (isPoolSurface && runStart === -1) {
        runStart = x;
      } else if (!isPoolSurface && runStart !== -1) {
        // End of a run [runStart, x)
        totalSnapped += trySnapRun(ctx, y, runStart, x);
        runStart = -1;
      }
    }
  }

  return totalSnapped;
}

/** Classify a boundary cell: sealed (wall/OOB/full-water) or hole (air without sealed floor). */
function isHoleBoundary(
  ctx: WaterCAContext, y: number, bx: number,
): boolean {
  const { width, height, blocks, waterMass } = ctx;
  // OOB = sealed
  if (bx < 0 || bx >= width) return false;
  // Solid block = sealed
  if (blocks[y][bx] !== BlockMaterial.Air) return false;
  // Full water = sealed (can't accept more)
  if (waterMass[y][bx] >= MAX_WATER) return false;
  // Air cell — check if it has a hole below (air below with room)
  if (y + 1 >= height) return false; // world bottom = sealed
  if (blocks[y + 1][bx] !== BlockMaterial.Air) return false; // solid below = sealed
  if (waterMass[y + 1][bx] >= MAX_WATER) return false; // full water below = sealed
  return true; // air below with room = hole
}

function trySnapRun(
  ctx: WaterCAContext,
  y: number,
  x0: number,
  x1: number,
): number {
  const { width, blocks, waterMass, settled } = ctx;

  // 1. Scan run: compute min/max, verify sealed below (already guaranteed by run detection)
  let minVal = MAX_WATER;
  let maxVal = 0;
  let totalWater = 0;

  for (let x = x0; x < x1; x++) {
    const v = waterMass[y][x];
    if (v < minVal) minVal = v;
    if (v > maxVal) maxVal = v;
    totalWater += v;
  }

  // 2. Bail if span > 1
  const span = maxVal - minVal;
  if (span > 1) return 0;

  // 3. Bail if no water at all (pure dry floor)
  if (totalWater === 0) return 0;

  // 4-5. Classify boundaries
  const leftHole = isHoleBoundary(ctx, y, x0 - 1);
  const rightHole = isHoleBoundary(ctx, y, x1);

  // Check for non-hole open boundaries (air + 0 water + sealed floor = now part of run, shouldn't happen)
  // But air + 0 water + NOT sealed floor and NOT hole shouldn't exist. If boundary is air with no water
  // and not a hole, it's a sealed-floor cell that should have been in the run. So only wall/OOB/water/hole.
  // Reject if boundary is dry air on sealed floor (shouldn't be outside run, but safety check):
  const leftBx = x0 - 1;
  const rightBx = x1;
  const leftSealed = leftHole ? false :
    (leftBx < 0 || blocks[y][leftBx] !== BlockMaterial.Air || waterMass[y][leftBx] > 0);
  const rightSealed = rightHole ? false :
    (rightBx >= width || blocks[y][rightBx] !== BlockMaterial.Air || waterMass[y][rightBx] > 0);

  // If a boundary is neither hole nor sealed, bail (shouldn't happen with new run detection)
  if (!leftHole && !leftSealed) return 0;
  if (!rightHole && !rightSealed) return 0;

  // 6. If any hole boundary: drain toward each hole
  if (leftHole || rightHole) {
    let drained = 0;

    if (leftHole) {
      // Find nearest run cell with water > 0, searching from left
      for (let x = x0; x < x1; x++) {
        if (waterMass[y][x] > 0) {
          waterMass[y][x]--;
          waterMass[y][leftBx]++;
          settled[y][leftBx] = false;
          drained++;
          break;
        }
      }
    }

    if (rightHole) {
      // Find nearest run cell with water > 0, searching from right
      for (let x = x1 - 1; x >= x0; x--) {
        if (waterMass[y][x] > 0) {
          waterMass[y][x]--;
          waterMass[y][rightBx]++;
          settled[y][rightBx] = false;
          drained++;
          break;
        }
      }
    }

    // Unsettle entire run so CA redistributes water toward holes
    if (drained > 0) {
      for (let x = x0; x < x1; x++) {
        settled[y][x] = false;
      }
    }

    return drained;
  }

  // 7. Both sealed: snap — existing majority-vote logic
  // Already flat (span 0): nothing to snap
  if (span === 0) {
    return 0;
  }

  // span === 1: majority vote
  let countHi = 0;
  let countLo = 0;
  for (let x = x0; x < x1; x++) {
    if (waterMass[y][x] === maxVal) countHi++;
    else countLo++;
  }

  const snapTo = countHi >= countLo ? maxVal : minVal;
  let snapped = 0;
  for (let x = x0; x < x1; x++) {
    if (waterMass[y][x] !== snapTo) {
      waterMass[y][x] = snapTo;
      settled[y][x] = false;
      snapped++;
    }
  }

  return snapped;
}
