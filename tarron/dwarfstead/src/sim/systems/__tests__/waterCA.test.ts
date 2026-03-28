import { describe, it, expect } from 'vitest';
import {
  simulateWaterCA,
  snapPoolsToFlat,
  type WaterCAContext,
} from '../waterCA';
import { BlockMaterial } from '../../types';

// ── Helpers ────────────────────────────────────────────────────────────

/** Build a minimal WaterCAContext from a block/water grid. */
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

const A = BlockMaterial.Air;
const S = BlockMaterial.Stone;

/** Return the total water mass across all cells. */
function totalMass(ctx: WaterCAContext): number {
  let sum = 0;
  for (let y = 0; y < ctx.height; y++) {
    for (let x = 0; x < ctx.width; x++) {
      sum += ctx.waterMass[y][x];
    }
  }
  return sum;
}

/** Run N ticks of the CA. */
function runTicks(ctx: WaterCAContext, n: number): void {
  for (let i = 0; i < n; i++) {
    simulateWaterCA(ctx);
  }
}

/** Extract a single row of water mass values. */
function rowMass(ctx: WaterCAContext, y: number): number[] {
  return ctx.waterMass[y].slice();
}

/**
 * Run snap+CA ticks with periodic unsettling (like WaterFlowSystem does
 * when isAtEquilibrium returns false after a low-flow streak).
 */
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
      // Unsettle all water cells (matches WaterFlowSystem behavior)
      lowFlowStreak = 0;
      for (let y = 0; y < ctx.height; y++) {
        for (let x = 0; x < ctx.width; x++) {
          if (ctx.waterMass[y][x] > 0) ctx.settled[y][x] = false;
        }
      }
    }
  }
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('simulateWaterCA', () => {
  it('gravity: water falls to bottom of column', () => {
    // 3-tall column, water at top — needs 2 ticks (cascades 1 row/tick)
    const ctx = makeCtx({
      blocks: [[A], [A], [A]],
      waterMass: [[3], [0], [0]],
    });
    runTicks(ctx, 2);
    expect(ctx.waterMass[2][0]).toBe(3);
    expect(ctx.waterMass[0][0]).toBe(0);
  });

  it('gravity stacking: partial column below gets filled first', () => {
    // Water at top, partial fill at bottom — needs 2 ticks to cascade
    const ctx = makeCtx({
      blocks: [[A], [A], [A]],
      waterMass: [[4], [0], [3]],
    });
    runTicks(ctx, 2);
    // Bottom gets filled to MAX first, remainder stays above
    expect(ctx.waterMass[2][0]).toBe(5);
    expect(ctx.waterMass[1][0]).toBe(2);
    expect(ctx.waterMass[0][0]).toBe(0);
  });

  it('side flow: water spreads horizontally with diff >= 1', () => {
    // Single row with walls, water on left side
    // [S, A(3), A(0), A(0), S]
    const ctx = makeCtx({
      blocks: [[S, A, A, A, S]],
      waterMass: [[0, 3, 0, 0, 0]],
    });
    runTicks(ctx, 1);
    // diff = 3 flows right, diff = 2 flows right again
    expect(ctx.waterMass[0][1]).toBeLessThan(3);
    expect(ctx.waterMass[0][2]).toBeGreaterThan(0);
  });

  it('flat pool convergence: [5,5,5,0,0,0] spreads flat within N ticks', () => {
    // Floor of stone, 6 air cells on top — uses snap+CA+unsettling like the real system
    const ctx = makeCtx({
      blocks: [
        [A, A, A, A, A, A],
        [S, S, S, S, S, S],
      ],
      waterMass: [
        [5, 5, 5, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
      ],
    });
    runSystemTicks(ctx, 100);
    const row = rowMass(ctx, 0);
    const minVal = Math.min(...row);
    const maxVal = Math.max(...row);
    expect(maxVal - minVal).toBeLessThanOrEqual(1);
  });

  it('water conservation: total mass preserved during CA flow', () => {
    const ctx = makeCtx({
      blocks: [
        [A, A, A, A],
        [A, A, A, A],
        [S, S, S, S],
      ],
      waterMass: [
        [5, 0, 0, 3],
        [0, 2, 0, 0],
        [0, 0, 0, 0],
      ],
    });
    const before = totalMass(ctx);
    runTicks(ctx, 20);
    expect(totalMass(ctx)).toBe(before);
  });

  it('staircase resolution: [5,4,3,2,1] flows and eventually flattens', () => {
    const ctx = makeCtx({
      blocks: [
        [S, A, A, A, A, A, S],
        [S, S, S, S, S, S, S],
      ],
      waterMass: [
        [0, 5, 4, 3, 2, 1, 0],
        [0, 0, 0, 0, 0, 0, 0],
      ],
    });
    runSystemTicks(ctx, 200);
    const row = rowMass(ctx, 0).slice(1, 6);
    const minVal = Math.min(...row);
    const maxVal = Math.max(...row);
    expect(maxVal - minVal).toBeLessThanOrEqual(1);
  });

  it('no premature settlement: active water has unsettled cells', () => {
    const ctx = makeCtx({
      blocks: [
        [A, A, A],
        [S, S, S],
      ],
      waterMass: [
        [5, 0, 0],
        [0, 0, 0],
      ],
    });
    simulateWaterCA(ctx);
    // After one tick, water moved right — those cells should be unsettled
    const hasUnsettled = ctx.settled[0].some((s) => !s);
    expect(hasUnsettled).toBe(true);
  });
});

describe('snapPoolsToFlat', () => {
  it('snaps sealed basin preserving total mass', () => {
    // Sealed basin: stone walls, stone floor, water [3,3,2]
    const ctx = makeCtx({
      blocks: [
        [S, A, A, A, S],
        [S, S, S, S, S],
      ],
      waterMass: [
        [0, 3, 3, 2, 0],
        [0, 0, 0, 0, 0],
      ],
    });
    const before = totalMass(ctx);
    snapPoolsToFlat(ctx);
    // [3,3,2] total=8, 3 cells — already optimal, mass preserved
    expect(totalMass(ctx)).toBe(before);
  });

  it('preserves mass when lower count is majority', () => {
    // [3,2,2] total=7, 3 cells — already optimal (1 hi, 2 lo)
    const ctx = makeCtx({
      blocks: [
        [S, A, A, A, S],
        [S, S, S, S, S],
      ],
      waterMass: [
        [0, 3, 2, 2, 0],
        [0, 0, 0, 0, 0],
      ],
    });
    const before = totalMass(ctx);
    snapPoolsToFlat(ctx);
    // Mass preserved: [3,2,2] is already the optimal mass-conserving distribution
    expect(totalMass(ctx)).toBe(before);
  });

  it('does not snap when cell can flow down', () => {
    // Air below with room — not sealed
    const ctx = makeCtx({
      blocks: [
        [S, A, A, S],
        [S, A, A, S],
        [S, S, S, S],
      ],
      waterMass: [
        [0, 3, 2, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    });
    const snapped = snapPoolsToFlat(ctx);
    expect(snapped).toBe(0);
  });

  it('does not snap when boundary is open air', () => {
    // Right side is open air (no wall)
    const ctx = makeCtx({
      blocks: [
        [S, A, A, A],
        [S, S, S, S],
      ],
      waterMass: [
        [0, 3, 2, 0],
        [0, 0, 0, 0],
      ],
    });
    const snapped = snapPoolsToFlat(ctx);
    // Run end at x=3 (waterMass=0), boundary x=3 is air with 0 water = open
    expect(snapped).toBe(0);
  });

  it('does not snap when span > 1', () => {
    const ctx = makeCtx({
      blocks: [
        [S, A, A, A, S],
        [S, S, S, S, S],
      ],
      waterMass: [
        [0, 4, 2, 3, 0],
        [0, 0, 0, 0, 0],
      ],
    });
    const snapped = snapPoolsToFlat(ctx);
    expect(snapped).toBe(0);
  });

  it('does not snap already-flat run', () => {
    const ctx = makeCtx({
      blocks: [
        [S, A, A, A, S],
        [S, S, S, S, S],
      ],
      waterMass: [
        [0, 3, 3, 3, 0],
        [0, 0, 0, 0, 0],
      ],
    });
    const snapped = snapPoolsToFlat(ctx);
    expect(snapped).toBe(0);
  });

  it('drains to right hole', () => {
    // [S, water(2), water(1), air+hole]  — hole on right (air below with room)
    const ctx = makeCtx({
      blocks: [
        [S, A, A, A],
        [S, S, S, A],
      ],
      waterMass: [
        [0, 2, 1, 0],
        [0, 0, 0, 0],
      ],
    });
    const before = totalMass(ctx);
    const snapped = snapPoolsToFlat(ctx);
    expect(snapped).toBeGreaterThan(0);
    // 1 unit moved to boundary cell (x=3)
    expect(ctx.waterMass[0][3]).toBe(1);
    expect(totalMass(ctx)).toBe(before);
  });

  it('drains to left hole', () => {
    // [air+hole, water(1), water(2), S]
    const ctx = makeCtx({
      blocks: [
        [A, A, A, S],
        [A, S, S, S],
      ],
      waterMass: [
        [0, 1, 2, 0],
        [0, 0, 0, 0],
      ],
    });
    const before = totalMass(ctx);
    const snapped = snapPoolsToFlat(ctx);
    expect(snapped).toBeGreaterThan(0);
    expect(ctx.waterMass[0][0]).toBe(1);
    expect(totalMass(ctx)).toBe(before);
  });

  it('does not drain when boundary is wall (normal snap)', () => {
    // Sealed basin — should snap with mass conservation
    const ctx = makeCtx({
      blocks: [
        [S, A, A, A, S],
        [S, S, S, S, S],
      ],
      waterMass: [
        [0, 3, 3, 2, 0],
        [0, 0, 0, 0, 0],
      ],
    });
    const before = totalMass(ctx);
    snapPoolsToFlat(ctx);
    // [3,3,2] total=8, 3 cells → already optimal distribution, mass preserved
    expect(totalMass(ctx)).toBe(before);
  });

  it('single drop in sealed pool preserves mass', () => {
    // [1, 0, 0, 0] with walls — mass-conserving snap keeps total = 1
    const ctx = makeCtx({
      blocks: [
        [S, A, A, A, A, S],
        [S, S, S, S, S, S],
      ],
      waterMass: [
        [0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
      ],
    });
    const before = totalMass(ctx);
    snapPoolsToFlat(ctx);
    // Mass must be preserved — water should not disappear
    expect(totalMass(ctx)).toBe(before);
  });

  it('drains to both holes', () => {
    // [hole, water(1), water(1), water(1), hole]
    const ctx = makeCtx({
      blocks: [
        [A, A, A, A, A],
        [A, S, S, S, A],
      ],
      waterMass: [
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0],
      ],
    });
    const before = totalMass(ctx);
    const snapped = snapPoolsToFlat(ctx);
    expect(snapped).toBe(2); // drained 1 to each side
    expect(ctx.waterMass[0][0]).toBe(1); // left hole got 1
    expect(ctx.waterMass[0][4]).toBe(1); // right hole got 1
    expect(totalMass(ctx)).toBe(before);
  });

  it('ledge drain convergence: 1 unit on 2-wide ledge drains off', () => {
    // 1 unit on a 2-wide ledge with a hole on the right — should fully drain
    const ctx = makeCtx({
      blocks: [
        [S, A, A, A],
        [S, S, S, A],
        [S, S, S, A],
      ],
      waterMass: [
        [0, 1, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    });
    runSystemTicks(ctx, 30);
    // Water should have drained off the ledge entirely
    expect(ctx.waterMass[0][1]).toBe(0);
    expect(ctx.waterMass[0][2]).toBe(0);
  });

  it('drains through active drain shaft (water in boundary cell)', () => {
    // Ledge [3, 1] against wall, drain shaft with water flowing through,
    // pool on the other side. Cavern below gives enough capacity.
    //
    //   S  3  1 | 5  5  S     row 0: wall | ledge | drain | pool | wall
    //   S  S  S | S  S  S     row 1: floor (air under drain)
    //   S  S  S | S  S  S     row 2: shaft continues
    //   S  .  .  .  .  .  S   row 3: cavern
    //   S  .  .  .  .  .  S   row 4: cavern
    //   S  S  S  S  S  S  S   row 5: solid floor
    const ctx = makeCtx({
      blocks: [
        [S, A, A, A, A, A, S],
        [S, S, S, A, S, S, S],
        [S, S, S, A, S, S, S],
        [S, A, A, A, A, A, S],
        [S, A, A, A, A, A, S],
        [S, S, S, S, S, S, S],
      ],
      waterMass: [
        [0, 3, 1, 0, 5, 5, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
      ],
    });
    runSystemTicks(ctx, 120);
    // Ledge should be fully drained — water flows down shaft into cavern
    expect(ctx.waterMass[0][1]).toBe(0);
    expect(ctx.waterMass[0][2]).toBe(0);
  });
});
