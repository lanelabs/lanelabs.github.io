/**
 * Builds a flat 80×40 test world with six water scenarios.
 *
 * Layout:
 *   Rows 0–9:  air (sky)
 *   Rows 10–39: stone (ground)
 *   Surface at y=10, player spawns at x=3, y=9
 *
 * Test 1 (~x=5):  Demo structure (reuses carveDemoStructure)
 * Test 2 (~x=22): 5×5 pool with side hole + collection area
 * Test 3 (~x=36): Tall 1-wide water column with shaft below
 * Test 4 (~x=42): Sealed 4×4 pool (mass conservation)
 * Test 5 (~x=50): U-tube / communicating vessels
 * Test 6 (~x=65): Staircase cascade
 */

import { BlockMaterial } from '../types';
import type { TerrainGrid } from './TerrainGenerator';
import { carveDemoStructure } from './demoStructure';

const W = 80;
const H = 40;
const SURFACE = 10;

/** Carve air at (x,y) if in bounds and below surface. */
function air(blocks: BlockMaterial[][], x: number, y: number): void {
  if (x >= 0 && x < W && y >= 0 && y < H) blocks[y][x] = BlockMaterial.Air;
}

/** Place stone at (x,y) if in bounds. */
function stone(blocks: BlockMaterial[][], x: number, y: number): void {
  if (x >= 0 && x < W && y >= 0 && y < H) blocks[y][x] = BlockMaterial.Stone;
}

/** Set water mass at (x,y) if in bounds. */
function water(wm: number[][], x: number, y: number, mass: number): void {
  if (x >= 0 && x < W && y >= 0 && y < H) wm[y][x] = mass;
}

/** Carve a rectangular room of air. */
function carveRect(blocks: BlockMaterial[][], x: number, y: number, w: number, h: number): void {
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) air(blocks, x + dx, y + dy);
}

/** Fill a rectangular region with stone. */
function stoneRect(blocks: BlockMaterial[][], x: number, y: number, w: number, h: number): void {
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) stone(blocks, x + dx, y + dy);
}

/** Fill a rectangular region with water. */
function waterRect(wm: number[][], x: number, y: number, w: number, h: number, mass: number): void {
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) water(wm, x + dx, y + dy, mass);
}

// ── Test 2: 5×5 pool with side hole ──────────────────────────────
function buildPoolWithHole(blocks: BlockMaterial[][], wm: number[][]): void {
  const px = 22; // pool left edge (interior)
  const py = SURFACE + 1; // one row below surface

  // Carve 5×5 interior
  carveRect(blocks, px, py, 5, 5);
  // Stone walls around pool (left, right, bottom)
  stoneRect(blocks, px - 1, py - 1, 7, 1); // top wall
  for (let dy = 0; dy < 5; dy++) {
    stone(blocks, px - 1, py + dy); // left wall
    stone(blocks, px + 5, py + dy); // right wall
  }
  stoneRect(blocks, px - 1, py + 5, 7, 1); // bottom wall

  // Hole at bottom of right wall (y = py+4, x = px+5)
  air(blocks, px + 5, py + 4);

  // Collection area to the right of the hole
  carveRect(blocks, px + 6, py + 2, 4, 4);
  // Floor under collection
  stoneRect(blocks, px + 6, py + 6, 4, 1);

  // Fill pool with water (level 5)
  waterRect(wm, px, py, 5, 5, 5);
}

// ── Test 3: Tall column cascade ──────────────────────────────────
function buildTallColumn(blocks: BlockMaterial[][], wm: number[][]): void {
  const cx = 36;
  const topY = SURFACE + 1;

  // Carve 1-wide shaft, 16 tall (water column + fall space)
  for (let y = topY; y < topY + 16 && y < H - 1; y++) air(blocks, cx, y);

  // Walls on both sides
  for (let y = topY - 1; y < topY + 17 && y < H; y++) {
    stone(blocks, cx - 1, y);
    stone(blocks, cx + 1, y);
  }
  // Cap top and bottom
  stone(blocks, cx, topY - 1);
  if (topY + 16 < H) stone(blocks, cx, topY + 16);

  // Fill top 8 cells with water
  for (let y = topY; y < topY + 8; y++) water(wm, cx, y, 5);
}

// ── Test 4: Sealed pool (mass conservation) ──────────────────────
function buildSealedPool(blocks: BlockMaterial[][], wm: number[][]): void {
  const px = 42;
  const py = SURFACE + 2;

  // Carve 4×4 interior
  carveRect(blocks, px, py, 4, 4);
  // Seal with stone walls on all sides
  stoneRect(blocks, px - 1, py - 1, 6, 1); // top
  stoneRect(blocks, px - 1, py + 4, 6, 1); // bottom
  for (let dy = 0; dy < 4; dy++) {
    stone(blocks, px - 1, py + dy); // left
    stone(blocks, px + 4, py + dy); // right
  }

  // Fill with water (level 5 = full)
  waterRect(wm, px, py, 4, 4, 5);
}

// ── Test 5: U-tube / communicating vessels ───────────────────────
function buildUtube(blocks: BlockMaterial[][], wm: number[][]): void {
  const lx = 50; // left chamber left edge
  const ty = SURFACE + 1;
  const chamberW = 3;
  const chamberH = 5;
  const tunnelY = ty + chamberH - 1; // bottom row of chambers

  // Carve left chamber
  carveRect(blocks, lx, ty, chamberW, chamberH);
  // Carve right chamber (gap of 2 between)
  const rx = lx + chamberW + 2;
  carveRect(blocks, rx, ty, chamberW, chamberH);

  // Carve connecting tunnel at bottom (1 tall, spans between chambers)
  for (let x = lx + chamberW; x < rx; x++) air(blocks, x, tunnelY);

  // Walls around both chambers
  // Left chamber walls
  for (let dy = -1; dy <= chamberH; dy++) {
    stone(blocks, lx - 1, ty + dy);
  }
  // Right chamber walls
  for (let dy = -1; dy <= chamberH; dy++) {
    stone(blocks, rx + chamberW, ty + dy);
  }
  // Top walls
  for (let dx = 0; dx < chamberW; dx++) {
    stone(blocks, lx + dx, ty - 1);
    stone(blocks, rx + dx, ty - 1);
  }
  // Bottom walls (under chambers and tunnel)
  for (let x = lx - 1; x <= rx + chamberW; x++) {
    stone(blocks, x, ty + chamberH);
  }
  // Walls above tunnel (between chambers, except at tunnel row)
  for (let x = lx + chamberW; x < rx; x++) {
    for (let y = ty; y < tunnelY; y++) {
      stone(blocks, x, y);
    }
  }

  // Fill left chamber with water
  waterRect(wm, lx, ty, chamberW, chamberH, 5);
}

// ── Test 6: Staircase cascade ────────────────────────────────────
function buildStaircase(blocks: BlockMaterial[][], wm: number[][]): void {
  const baseX = 65;
  const poolW = 3;
  const poolH = 2;
  const steps = [
    { x: baseX, y: SURFACE + 1 },
    { x: baseX + 4, y: SURFACE + 4 },
    { x: baseX + 8, y: SURFACE + 7 },
  ];

  for (let si = 0; si < steps.length; si++) {
    const { x: sx, y: sy } = steps[si];
    // Carve pool interior
    carveRect(blocks, sx, sy, poolW, poolH);
    // Walls: left, right, bottom
    for (let dy = -1; dy <= poolH; dy++) {
      stone(blocks, sx - 1, sy + dy);
      stone(blocks, sx + poolW, sy + dy);
    }
    stoneRect(blocks, sx - 1, sy + poolH, poolW + 2, 1); // floor
    stoneRect(blocks, sx - 1, sy - 1, poolW + 2, 1); // ceiling

    // Gap in right wall at bottom row to connect to next pool
    if (si < steps.length - 1) {
      air(blocks, sx + poolW, sy + poolH - 1);
      // Carve connecting path down to next pool
      const nx = steps[si + 1].x;
      const ny = steps[si + 1].y;
      for (let x = sx + poolW; x < nx; x++) {
        for (let y = sy + poolH - 1; y <= ny; y++) {
          air(blocks, x, y);
        }
      }
    }
  }

  // Fill only the top pool with water
  waterRect(wm, steps[0].x, steps[0].y, poolW, poolH, 5);
}

export function buildWaterTestTerrain(): TerrainGrid {
  // Base grid: sky above surface, stone below
  const blocks: BlockMaterial[][] = [];
  for (let y = 0; y < H; y++) {
    const row: BlockMaterial[] = [];
    for (let x = 0; x < W; x++) {
      row.push(y < SURFACE ? BlockMaterial.Air : BlockMaterial.Stone);
    }
    blocks.push(row);
  }

  const waterMass: number[][] = [];
  for (let y = 0; y < H; y++) waterMass.push(new Array(W).fill(0));

  const surfaceHeights = new Array(W).fill(SURFACE);

  // Test 1: Demo structure at spawn (x=3)
  carveDemoStructure(blocks, waterMass, 3, SURFACE, W, H);

  // Test 2: 5×5 pool with side hole
  buildPoolWithHole(blocks, waterMass);

  // Test 3: Tall column cascade
  buildTallColumn(blocks, waterMass);

  // Test 4: Sealed pool
  buildSealedPool(blocks, waterMass);

  // Test 5: U-tube
  buildUtube(blocks, waterMass);

  // Test 6: Staircase cascade
  buildStaircase(blocks, waterMass);

  return {
    width: W,
    height: H,
    blocks,
    waterMass,
    surfaceY: SURFACE,
    surfaceHeights,
    rooms: [],
  };
}

// ── Extracted from TerrainGenerator.generate() ──
// Pool-type hidden rooms were filled with water during terrain generation:
//
//   for (const room of rooms) {
//     if (room.type === 'pool') {
//       for (let dy = 0; dy < room.height; dy++) {
//         for (let dx = 0; dx < room.width; dx++) {
//           const px = room.x + dx, py = room.y + dy;
//           if (px >= 0 && px < width && py >= 0 && py < height && blocks[py][px] === BlockMaterial.Air) {
//             waterMass[py][px] = 5;
//           }
//         }
//       }
//     }
//   }
