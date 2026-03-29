/**
 * Carves a hand-crafted demo structure next to the player spawn
 * for immediate water experimentation.
 *
 * Layout (relative to spawn @, D = dirt wall to breach):
 *
 *   @ # D ~ ~ | ~ ~ ~ | ~ ~ #   ledges + pool, 3 tall, water throughout
 *   # # D ~ ~ | ~ ~ ~ | ~ ~ #   | = drain shaft (air, open below)
 *   # # D ~ ~ | ~ ~ ~ | ~ ~ #   ~ = water on ledge (against wall near hole)
 *   # # D # # | # . # | # # #   floor (not under drains), center shaft
 *   # # D # # | # . # | # # #   3 shafts: left drain, center, right drain
 *   # # D # # | # . # | # # #
 *   # # D # # | # . # | # # #
 *   # # D # # | # . # | # # #
 *   # # D # . . . . . # # # #   cavern: drain-to-drain, 4 tall
 *   # # D # . . . . . # # # #
 *   # # D # S . . . . # # # #   S = stone steps
 *   # # D # S S . . . # # # #
 */

import { BlockMaterial } from '../types';

export function carveDemoStructure(
  blocks: BlockMaterial[][],
  waterMass: number[][],
  spawnX: number,
  surfaceY: number,
  width: number,
  height: number,
): void {
  // Breakable wall column at spawnX + 2
  const wallX = spawnX + 2;

  // Left ledge: 2 cells against dirt wall
  const leftLedgeL = spawnX + 3;
  const leftLedgeR = spawnX + 4;

  // Left drain shaft
  const leftDrainX = spawnX + 5;

  // Pool: 3 cells between drains
  const poolLeft = spawnX + 6;
  const poolRight = spawnX + 8;

  // Right drain shaft
  const rightDrainX = spawnX + 9;

  // Right ledge: 2 cells against right wall
  const rightLedgeL = spawnX + 10;
  const rightLedgeR = spawnX + 11;

  // Right wall
  const rightWallX = spawnX + 12;

  const poolTop = surfaceY;
  const poolBottom = surfaceY + 2; // 3 tall

  // Center shaft
  const shaftX = spawnX + 7;
  const shaftTop = poolBottom + 1;
  const shaftBottom = shaftTop + 4;

  // Cavern: spans drain-to-drain, 4 tall below shafts
  const cavernLeft = leftDrainX;
  const cavernRight = rightDrainX;
  const cavernTop = shaftBottom + 1;
  const cavernBottom = cavernTop + 3;

  // Bounds check
  if (rightWallX >= width) return;
  if (cavernBottom + 1 >= height) return;

  // ── Carve entire water area as air (ledge-to-ledge) ──
  for (let y = poolTop; y <= poolBottom; y++) {
    for (let x = leftLedgeL; x <= rightLedgeR; x++) {
      if (x < width && y < height) {
        blocks[y][x] = BlockMaterial.Air;
      }
    }
  }

  // ── Place water: ledges stacked against walls, pool full ──
  for (let y = poolTop; y <= poolBottom; y++) {
    // Left ledge: high against wall, low near drain
    waterMass[y][leftLedgeL] = 3;
    waterMass[y][leftLedgeR] = 1;
    // Pool: full
    for (let x = poolLeft; x <= poolRight; x++) {
      waterMass[y][x] = 5;
    }
    // Right ledge: low near drain, high against wall
    waterMass[y][rightLedgeL] = 1;
    waterMass[y][rightLedgeR] = 3;
  }

  // ── Right wall ──
  for (let y = poolTop; y <= cavernBottom; y++) {
    if (rightWallX < width && y < height) {
      blocks[y][rightWallX] = BlockMaterial.Stone;
    }
  }

  // ── Carve drain shafts (air from poolTop through shaftBottom) ──
  for (let y = poolTop; y <= shaftBottom; y++) {
    if (y < height) {
      blocks[y][leftDrainX] = BlockMaterial.Air;
      blocks[y][rightDrainX] = BlockMaterial.Air;
    }
  }

  // ── Floor: solid under ledges + pool (not under drains) ──
  const floorY = poolBottom + 1;
  for (let x = leftLedgeL; x <= rightLedgeR; x++) {
    if (x === leftDrainX || x === rightDrainX) continue;
    if (x < width && floorY < height) {
      blocks[floorY][x] = BlockMaterial.Dirt;
    }
  }

  // ── Seal shaft-area walls (shaftTop to shaftBottom) ──
  for (let y = shaftTop; y <= shaftBottom; y++) {
    if (y >= height) continue;
    // Left of left drain (under left ledge)
    blocks[y][leftLedgeR] = BlockMaterial.Stone;
    // Right of left drain / left of center shaft
    blocks[y][poolLeft] = BlockMaterial.Stone;
    // Right of center shaft / left of right drain
    blocks[y][poolRight] = BlockMaterial.Stone;
    // Right of right drain (under right ledge)
    if (rightLedgeL < width) blocks[y][rightLedgeL] = BlockMaterial.Stone;
  }

  // ── Carve all three shafts (after sealing so they stay open) ──
  for (let y = shaftTop; y <= shaftBottom; y++) {
    if (y < height) {
      blocks[y][leftDrainX] = BlockMaterial.Air;
      blocks[y][shaftX] = BlockMaterial.Air;
      blocks[y][rightDrainX] = BlockMaterial.Air;
    }
  }

  // ── Seal cavern walls & floor ──
  for (let x = cavernLeft - 1; x <= cavernRight + 1; x++) {
    const by = cavernBottom + 1;
    if (x >= 0 && x < width && by < height) blocks[by][x] = BlockMaterial.Stone;
  }
  for (let y = cavernTop; y <= cavernBottom + 1; y++) {
    const lx = cavernLeft - 1;
    if (lx >= 0 && y < height) blocks[y][lx] = BlockMaterial.Stone;
    const rx = cavernRight + 1;
    if (rx < width && y < height) blocks[y][rx] = BlockMaterial.Stone;
  }

  // ── Carve cavern (after sealing so interior is Air) ──
  for (let y = cavernTop; y <= cavernBottom; y++) {
    for (let x = cavernLeft; x <= cavernRight; x++) {
      if (x >= 0 && x < width && y < height) {
        blocks[y][x] = BlockMaterial.Air;
      }
    }
  }

  // ── Stone steps in cavern (staircase at bottom-left) ──
  const stepY1 = cavernBottom;
  const stepY2 = cavernBottom - 1;
  if (cavernLeft >= 0 && cavernLeft < width) {
    if (stepY1 < height) blocks[stepY1][cavernLeft] = BlockMaterial.Stone;
    if (stepY1 < height && cavernLeft + 1 < width) blocks[stepY1][cavernLeft + 1] = BlockMaterial.Stone;
    if (stepY2 < height) blocks[stepY2][cavernLeft] = BlockMaterial.Stone;
  }

  // ── Breakable dirt wall (placed last so it isn't overwritten) ──
  for (let y = poolTop; y <= cavernBottom; y++) {
    if (wallX >= 0 && wallX < width && y < height) {
      blocks[y][wallX] = BlockMaterial.Dirt;
    }
  }
}
