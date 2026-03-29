/**
 * Water scenario tests — exercises each waterTestTerrain scenario
 * using miniature grids and the CA engine directly.
 */
import { describe, it, expect } from 'vitest';
import {
  simulateWaterCA,
  snapPoolsToFlat,
  type WaterCAContext,
} from '../waterCA';
import { BlockMaterial } from '../../types';

// ── Helpers (same pattern as waterCA.test.ts) ─────────────────────────

const A = BlockMaterial.Air;
const S = BlockMaterial.Stone;

function makeCtx(opts: {
  blocks: BlockMaterial[][];
  waterMass: number[][];
}): WaterCAContext {
  const height = opts.blocks.length;
  const width = opts.blocks[0].length;
  const waterMassNext: number[][] = [];
  const settled: boolean[][] = [];
  for (let y = 0; y < height; y++) {
    waterMassNext.push(new Array(width).fill(0));
    settled.push(new Array(width).fill(false));
  }
  return {
    width,
    height,
    blocks: opts.blocks,
    waterMass: opts.waterMass,
    waterMassNext,
    settled,
  };
}

function totalMass(ctx: WaterCAContext): number {
  let sum = 0;
  for (let y = 0; y < ctx.height; y++) {
    for (let x = 0; x < ctx.width; x++) {
      sum += ctx.waterMass[y][x];
    }
  }
  return sum;
}

function runSystemTicks(ctx: WaterCAContext, n: number): void {
  let lowFlowStreak = 0;
  for (let i = 0; i < n; i++) {
    const snapped = snapPoolsToFlat(ctx);
    const maxFlow = simulateWaterCA(ctx);
    if (maxFlow <= 1 && snapped === 0) {
      lowFlowStreak++;
    } else {
      lowFlowStreak = 0;
    }
    if (lowFlowStreak >= 3) {
      lowFlowStreak = 0;
      for (let y = 0; y < ctx.height; y++) {
        for (let x = 0; x < ctx.width; x++) {
          if (ctx.waterMass[y][x] > 0) ctx.settled[y][x] = false;
        }
      }
    }
  }
}

// ── Scenario helpers ──────────────────────────────────────────────────

function carveRect(blocks: BlockMaterial[][], x: number, y: number, w: number, h: number): void {
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) blocks[y + dy][x + dx] = A;
}

function stoneRect(blocks: BlockMaterial[][], x: number, y: number, w: number, h: number): void {
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) blocks[y + dy][x + dx] = S;
}

function waterRect(wm: number[][], x: number, y: number, w: number, h: number, mass: number): void {
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) wm[y + dy][x + dx] = mass;
}

function emptyGrid(w: number, h: number): { blocks: BlockMaterial[][]; waterMass: number[][] } {
  const blocks: BlockMaterial[][] = [];
  const waterMass: number[][] = [];
  for (let y = 0; y < h; y++) {
    blocks.push(new Array(w).fill(S));
    waterMass.push(new Array(w).fill(0));
  }
  return { blocks, waterMass };
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('water scenario: pool with side hole', () => {
  function buildPoolWithHole() {
    // 12 wide, 10 tall — pool at (2,1) with hole on right, collection area
    const { blocks, waterMass } = emptyGrid(14, 10);
    const px = 2, py = 1;
    // Carve 5×5 interior
    carveRect(blocks, px, py, 5, 5);
    // Hole at bottom of right wall
    blocks[py + 4][px + 5] = A;
    // Collection area to the right
    carveRect(blocks, px + 6, py + 2, 4, 4);
    // Fill pool with water
    waterRect(waterMass, px, py, 5, 5, 5);
    return makeCtx({ blocks, waterMass });
  }

  it('water drains into collection area', () => {
    const ctx = buildPoolWithHole();
    runSystemTicks(ctx, 200);
    // Some water should have reached the collection area (x=8..11, y=3..6)
    let collectionMass = 0;
    for (let y = 3; y <= 6; y++) {
      for (let x = 8; x <= 11; x++) {
        collectionMass += ctx.waterMass[y][x];
      }
    }
    expect(collectionMass).toBeGreaterThan(0);
  });

  it('conserves total mass', () => {
    const ctx = buildPoolWithHole();
    const before = totalMass(ctx);
    runSystemTicks(ctx, 200);
    expect(totalMass(ctx)).toBe(before);
  });
});

describe('water scenario: tall column cascade', () => {
  function buildTallColumn() {
    // 3 wide (walls + 1-wide shaft), 20 tall
    const { blocks, waterMass } = emptyGrid(3, 20);
    // Carve 1-wide shaft in center column, rows 1..16
    for (let y = 1; y <= 16; y++) blocks[y][1] = A;
    // Fill top 8 cells with water
    for (let y = 1; y <= 8; y++) waterMass[y][1] = 5;
    return makeCtx({ blocks, waterMass });
  }

  it('water falls from top to bottom', () => {
    const ctx = buildTallColumn();
    runSystemTicks(ctx, 100);
    // Top cells should be empty
    let topMass = 0;
    for (let y = 1; y <= 4; y++) topMass += ctx.waterMass[y][1];
    // Bottom cells should have water
    let bottomMass = 0;
    for (let y = 12; y <= 16; y++) bottomMass += ctx.waterMass[y][1];
    expect(topMass).toBe(0);
    expect(bottomMass).toBeGreaterThan(0);
  });

  it('conserves total mass', () => {
    const ctx = buildTallColumn();
    const before = totalMass(ctx);
    runSystemTicks(ctx, 100);
    expect(totalMass(ctx)).toBe(before);
  });
});

describe('water scenario: sealed pool', () => {
  function buildSealedPool() {
    // 6×6 grid, 4×4 interior pool sealed with stone
    const { blocks, waterMass } = emptyGrid(6, 6);
    carveRect(blocks, 1, 1, 4, 4);
    waterRect(waterMass, 1, 1, 4, 4, 5);
    return makeCtx({ blocks, waterMass });
  }

  it('mass is exactly preserved (4×4×5 = 80)', () => {
    const ctx = buildSealedPool();
    expect(totalMass(ctx)).toBe(80);
    runSystemTicks(ctx, 200);
    expect(totalMass(ctx)).toBe(80);
  });

  it('water stays inside the pool', () => {
    const ctx = buildSealedPool();
    runSystemTicks(ctx, 200);
    // All water should be within the 4×4 interior
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 6; x++) {
        if (y === 0 || y === 5 || x === 0 || x === 5) {
          expect(ctx.waterMass[y][x]).toBe(0);
        }
      }
    }
  });
});

describe('water scenario: U-tube', () => {
  function buildUtube() {
    // Left chamber (3 wide, 5 tall) connected to right chamber via bottom tunnel
    const { blocks, waterMass } = emptyGrid(12, 8);
    const lx = 1, ty = 1, cw = 3, ch = 5;
    const rx = lx + cw + 2; // = 6
    const tunnelY = ty + ch - 1; // = 5

    // Carve left chamber
    carveRect(blocks, lx, ty, cw, ch);
    // Carve right chamber
    carveRect(blocks, rx, ty, cw, ch);
    // Carve connecting tunnel
    for (let x = lx + cw; x < rx; x++) blocks[tunnelY][x] = A;

    // Fill left chamber
    waterRect(waterMass, lx, ty, cw, ch, 5);

    return { ctx: makeCtx({ blocks, waterMass }), lx, rx, ty, cw, ch };
  }

  it('water moves to right chamber', () => {
    const { ctx, rx, ty, cw, ch } = buildUtube();
    runSystemTicks(ctx, 300);
    // Right chamber should have some water
    let rightMass = 0;
    for (let y = ty; y < ty + ch; y++) {
      for (let x = rx; x < rx + cw; x++) {
        rightMass += ctx.waterMass[y][x];
      }
    }
    expect(rightMass).toBeGreaterThan(0);
  });

  it('conserves total mass', () => {
    const { ctx } = buildUtube();
    const before = totalMass(ctx);
    runSystemTicks(ctx, 300);
    expect(totalMass(ctx)).toBe(before);
  });
});

describe('water scenario: staircase cascade', () => {
  function buildStaircase() {
    // 3 pools stacked diagonally, connected by gaps.
    // Two passes: build walls first, then carve gaps (so paths aren't overwritten).
    const { blocks, waterMass } = emptyGrid(16, 14);
    const poolW = 3, poolH = 2;
    const steps = [
      { x: 1, y: 1 },
      { x: 5, y: 4 },
      { x: 9, y: 7 },
    ];

    // Pass 1: build all pools with walls
    for (const { x: sx, y: sy } of steps) {
      carveRect(blocks, sx, sy, poolW, poolH);
      for (let dy = -1; dy <= poolH; dy++) {
        blocks[sy + dy][sx - 1] = S;
        blocks[sy + dy][sx + poolW] = S;
      }
      stoneRect(blocks, sx - 1, sy + poolH, poolW + 2, 1);
      stoneRect(blocks, sx - 1, sy - 1, poolW + 2, 1);
    }

    // Pass 2: carve connecting paths (overwrites walls from pass 1)
    for (let si = 0; si < steps.length - 1; si++) {
      const { x: sx, y: sy } = steps[si];
      blocks[sy + poolH - 1][sx + poolW] = A;
      const nx = steps[si + 1].x;
      const ny = steps[si + 1].y;
      for (let x = sx + poolW; x < nx; x++) {
        for (let y = sy + poolH - 1; y <= ny; y++) {
          blocks[y][x] = A;
        }
      }
    }

    // Fill only top pool
    waterRect(waterMass, steps[0].x, steps[0].y, poolW, poolH, 5);

    return { ctx: makeCtx({ blocks, waterMass }), steps, poolW, poolH };
  }

  it('water reaches lower pools', () => {
    const { ctx, steps, poolW, poolH } = buildStaircase();
    runSystemTicks(ctx, 300);
    // Bottom pool should have some water
    const bottom = steps[2];
    let bottomMass = 0;
    for (let y = bottom.y; y < bottom.y + poolH; y++) {
      for (let x = bottom.x; x < bottom.x + poolW; x++) {
        bottomMass += ctx.waterMass[y][x];
      }
    }
    expect(bottomMass).toBeGreaterThan(0);
  });

  it('conserves total mass', () => {
    const { ctx } = buildStaircase();
    const before = totalMass(ctx);
    runSystemTicks(ctx, 300);
    expect(totalMass(ctx)).toBe(before);
  });
});
