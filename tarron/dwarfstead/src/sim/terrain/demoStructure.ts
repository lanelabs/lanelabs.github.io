/**
 * Carves a hand-crafted demo structure next to the player spawn
 * for immediate water experimentation.
 *
 * Layout (relative to spawn @, D = dirt wall to breach):
 *
 *   @ # D ~ ~ ~ ~ #      pool: 4 wide, 3 tall, full of water
 *   # # D ~ ~ ~ ~ #
 *   # # D ~ ~ ~ ~ #
 *   # # D # # . # #      shaft: 1 wide, 5 deep
 *   # # D # # . # #
 *   # # D # # . # #
 *   # # D # # . # #
 *   # # D # # . # #
 *   # # D # . . . . . #  cavern: 6 wide, 4 tall
 *   # # D # . . . . . #
 *   # # D # S . . . . #  S = stone steps (staircase)
 *   # # D # S S . . . #
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
  // Pool starts 3 tiles right of spawn
  const poolLeft = spawnX + 3;
  const poolRight = poolLeft + 3; // 4 wide
  const poolTop = surfaceY;       // starts at surface
  const poolBottom = surfaceY + 2; // 3 tall

  // Breakable wall column is at spawnX + 2
  const wallX = spawnX + 2;

  // Shaft: 1 wide at poolLeft + 2, from poolBottom+1 to poolBottom+5
  const shaftX = poolLeft + 2;
  const shaftTop = poolBottom + 1;
  const shaftBottom = shaftTop + 4;

  // Cavern: 6 wide starting at shaftX - 1, 4 tall below shaft
  const cavernLeft = shaftX - 1;
  const cavernRight = cavernLeft + 5; // 6 wide
  const cavernTop = shaftBottom + 1;
  const cavernBottom = cavernTop + 3; // 4 tall

  // Bounds check
  if (poolRight + 1 >= width || cavernRight + 1 >= width) return;
  if (cavernBottom + 1 >= height) return;

  // Carve pool (air + water)
  for (let y = poolTop; y <= poolBottom; y++) {
    for (let x = poolLeft; x <= poolRight; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        blocks[y][x] = BlockMaterial.Air;
        waterMass[y][x] = 5;
      }
    }
  }

  // Place dirt walls around pool (right side + bottom)
  for (let y = poolTop; y <= poolBottom; y++) {
    const rx = poolRight + 1;
    if (rx < width && y < height && blocks[y][rx] !== BlockMaterial.Air) {
      blocks[y][rx] = BlockMaterial.Dirt;
    }
  }
  for (let x = poolLeft; x <= poolRight + 1; x++) {
    const by = poolBottom + 1;
    if (x < width && by < height) {
      blocks[by][x] = BlockMaterial.Dirt;
    }
  }

  // Place breakable dirt wall (column at wallX, from poolTop to cavernBottom)
  for (let y = poolTop; y <= cavernBottom; y++) {
    if (wallX >= 0 && wallX < width && y >= 0 && y < height) {
      blocks[y][wallX] = BlockMaterial.Dirt;
    }
  }

  // Carve shaft
  for (let y = shaftTop; y <= shaftBottom; y++) {
    if (shaftX >= 0 && shaftX < width && y >= 0 && y < height) {
      blocks[y][shaftX] = BlockMaterial.Air;
    }
  }

  // Seal cavern walls & floor so caves/tunnels can't drain water out
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

  // Seal shaft walls so water can't escape sideways
  for (let y = shaftTop; y <= shaftBottom; y++) {
    if (shaftX - 1 >= 0 && y < height) blocks[y][shaftX - 1] = BlockMaterial.Stone;
    if (shaftX + 1 < width && y < height) blocks[y][shaftX + 1] = BlockMaterial.Stone;
  }

  // Carve cavern (after sealing so interior is Air)
  for (let y = cavernTop; y <= cavernBottom; y++) {
    for (let x = cavernLeft; x <= cavernRight; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        blocks[y][x] = BlockMaterial.Air;
      }
    }
  }

  // Stone steps in cavern (staircase at bottom-left)
  // Bottom-left 2 tiles of cavern are stone (step 1)
  const stepY1 = cavernBottom;
  const stepY2 = cavernBottom - 1;
  if (cavernLeft >= 0 && cavernLeft < width) {
    if (stepY1 < height) blocks[stepY1][cavernLeft] = BlockMaterial.Stone;
    if (stepY1 < height && cavernLeft + 1 < width) blocks[stepY1][cavernLeft + 1] = BlockMaterial.Stone;
    if (stepY2 < height) blocks[stepY2][cavernLeft] = BlockMaterial.Stone;
  }
}
