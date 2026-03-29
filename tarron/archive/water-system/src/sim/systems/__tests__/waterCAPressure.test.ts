import { describe, it, expect } from 'vitest';
import { simulateWaterCA } from '../waterCA';
import {
  makeCtx, totalMass, runTicks, runSystemTicks, runUntilEquilibrium, A, S,
} from './waterCAHelpers';

describe('simulateWaterCA — pressure-aware side flow', () => {
  it('pressured side flow dumps aggressively', () => {
    // Water column: 5 above, 5 at source, 0 neighbor — should dump much more than 1
    const ctx = makeCtx({
      blocks: [
        [S, A, S],
        [S, A, S],
        [S, A, A],
        [S, S, S],
      ],
      waterMass: [
        [0, 5, 0],
        [0, 5, 0],
        [0, 5, 0],
        [0, 0, 0],
      ],
    });
    // Run 1 tick — bottom row processes first, sees above water
    simulateWaterCA(ctx);
    // Cell (2,2) should have received significantly more than 1 unit
    expect(ctx.waterMass[2][2]).toBeGreaterThanOrEqual(3);
  });

  it('unpressured side flow equalizes faster than 1-per-tick', () => {
    // Single row, no water above — equalize: floor(diff/2)
    const ctx = makeCtx({
      blocks: [
        [S, A, A, S],
        [S, S, S, S],
      ],
      waterMass: [
        [0, 5, 0, 0],
        [0, 0, 0, 0],
      ],
    });
    simulateWaterCA(ctx);
    // diff=5, aboveWater=0 → flow = floor(5/2) = 2
    expect(ctx.waterMass[0][2]).toBeGreaterThanOrEqual(2);
  });

  it('deep pool levels out (no oscillation)', () => {
    // Deep pool with uneven surface — both sides have equal above water.
    // Should converge to flat, not oscillate.
    const ctx = makeCtx({
      blocks: [
        [S, A, A, A, A, S],
        [S, A, A, A, A, S],
        [S, A, A, A, A, S],
        [S, S, S, S, S, S],
      ],
      waterMass: [
        [0, 0, 0, 5, 5, 0],
        [0, 3, 3, 5, 5, 0],
        [0, 5, 5, 5, 5, 0],
        [0, 0, 0, 0, 0, 0],
      ],
    });
    runSystemTicks(ctx, 100);
    // Each row should be flat (span <= 1)
    for (let y = 0; y < 3; y++) {
      const row = ctx.waterMass[y].slice(1, 5);
      const span = Math.max(...row) - Math.min(...row);
      expect(span).toBeLessThanOrEqual(1);
    }
  });

  it('staircase cavern levels surface despite varying floor depths', () => {
    // Matches demo structure cavern: 3 shafts feed 5-wide cavern with staircase
    // Water drains through shafts, should level in the cavern
    const ctx = makeCtx({
      blocks: [
        [S, A, S, A, S, A, S],  // shaft area
        [S, A, S, A, S, A, S],
        [S, A, S, A, S, A, S],
        [S, A, S, A, S, A, S],
        [S, A, S, A, S, A, S],
        [S, A, A, A, A, A, S],  // cavern top
        [S, A, A, A, A, A, S],
        [S, S, A, A, A, A, S],  // step at x=1
        [S, S, S, A, A, A, S],  // steps at x=1,2
        [S, S, S, S, S, S, S],  // floor
      ],
      waterMass: [
        [0, 5, 0, 5, 0, 5, 0],
        [0, 5, 0, 5, 0, 5, 0],
        [0, 5, 0, 5, 0, 5, 0],
        [0, 5, 0, 5, 0, 5, 0],
        [0, 5, 0, 5, 0, 5, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
      ],
    });
    const before = totalMass(ctx);
    runSystemTicks(ctx, 200);
    // Surface row (y=5) should be flat
    const surface = ctx.waterMass[5].slice(1, 6);
    const span = Math.max(...surface) - Math.min(...surface);
    expect(span).toBeLessThanOrEqual(1);
    expect(totalMass(ctx)).toBe(before);
  });

  it('staircase basin reaches equilibrium (not stuck at span=1)', () => {
    // Regression: basin with staircase floor would never declare equilibrium
    // because isAtEquilibrium treated span=1 as non-equilibrium, causing
    // an infinite unsettle loop.
    const ctx = makeCtx({
      blocks: [
        [S, A, A, A, A, A, A, A, S],
        [S, A, A, A, A, A, A, A, S],
        [S, S, A, A, A, A, A, A, S],
        [S, S, S, A, A, A, A, A, S],
        [S, S, S, S, S, S, S, S, S],
      ],
      waterMass: [
        [0, 1, 3, 4, 5, 5, 5, 5, 0],
        [0, 4, 5, 5, 5, 5, 5, 5, 0],
        [0, 0, 5, 5, 5, 5, 5, 5, 0],
        [0, 0, 0, 5, 5, 5, 5, 5, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
    });
    const before = totalMass(ctx);
    const tick = runUntilEquilibrium(ctx, 500);
    expect(tick).toBeGreaterThan(0); // should converge, not return -1
    expect(totalMass(ctx)).toBe(before);
  });

  it('U-tube reaches equilibrium with flat chamber surfaces', () => {
    // Two 3×5 chambers connected by a tunnel at the bottom.
    // Left chamber filled with water — should flow through tunnel and settle
    // with each chamber's rows flat (span ≤ 1).
    const ctx = makeCtx({
      blocks: [
        [S, S, S, S, S, S, S, S, S, S, S],
        [S, A, A, A, S, S, S, A, A, A, S],
        [S, A, A, A, S, S, S, A, A, A, S],
        [S, A, A, A, S, S, S, A, A, A, S],
        [S, A, A, A, S, S, S, A, A, A, S],
        [S, A, A, A, A, A, A, A, A, A, S],
        [S, S, S, S, S, S, S, S, S, S, S],
      ],
      waterMass: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0],
        [0, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0],
        [0, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0],
        [0, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0],
        [0, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
    });
    const before = totalMass(ctx);
    const tick = runUntilEquilibrium(ctx, 500);
    expect(tick).toBeGreaterThan(0);
    expect(totalMass(ctx)).toBe(before);
    // Each chamber row should be flat (span ≤ 1)
    for (let y = 1; y <= 5; y++) {
      const left = [ctx.waterMass[y][1], ctx.waterMass[y][2], ctx.waterMass[y][3]];
      const right = [ctx.waterMass[y][7], ctx.waterMass[y][8], ctx.waterMass[y][9]];
      const lSpan = Math.max(...left) - Math.min(...left);
      const rSpan = Math.max(...right) - Math.min(...right);
      expect(lSpan).toBeLessThanOrEqual(1);
      expect(rSpan).toBeLessThanOrEqual(1);
    }
  });

  it('pool with side hole equalizes columns fully', () => {
    // 5×5 pool with a hole at bottom-right wall, collection area to the right.
    // All columns in the pool must equalize so each row is flat.
    // Regression: columns nearest the drain ended up with less water,
    // causing the top row to have a staircase surface instead of flat.
    const ctx = makeCtx({
      blocks: [
        //   0  1  2  3  4  5  6  7  8  9 10 11 12
        [S, S, S, S, S, S, S, S, S, S, S, S, S],
        [S, A, A, A, A, A, S, S, S, S, S, S, S],
        [S, A, A, A, A, A, S, S, S, S, S, S, S],
        [S, A, A, A, A, A, S, A, A, A, A, S, S],
        [S, A, A, A, A, A, S, A, A, A, A, S, S],
        [S, A, A, A, A, A, A, A, A, A, A, S, S],
        [S, S, S, S, S, S, S, S, S, S, S, S, S],
      ],
      waterMass: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0],
        [0, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0],
        [0, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0],
        [0, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0],
        [0, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
    });
    const before = totalMass(ctx);
    const tick = runUntilEquilibrium(ctx, 1000);
    expect(tick).toBeGreaterThan(0);
    expect(totalMass(ctx)).toBe(before);
    // Every row in the pool (y=1..5, x=1..5) must be flat
    for (let y = 1; y <= 5; y++) {
      const row = [];
      for (let x = 1; x <= 5; x++) row.push(ctx.waterMass[y][x]);
      const nonZero = row.filter(v => v > 0);
      if (nonZero.length > 0) {
        const span = Math.max(...nonZero) - Math.min(...nonZero);
        expect(span).toBeLessThanOrEqual(1);
      }
    }
    // All full rows (y=2..5) should have equal column totals (no staircase)
    const colTotals = [];
    for (let x = 1; x <= 5; x++) {
      let t = 0;
      for (let y = 2; y <= 5; y++) t += ctx.waterMass[y][x];
      colTotals.push(t);
    }
    const colSpan = Math.max(...colTotals) - Math.min(...colTotals);
    expect(colSpan).toBeLessThanOrEqual(1);
  });

  it('U-tube equalizes columns within each chamber', () => {
    // Two 3×5 chambers connected by a 2-wide tunnel at the bottom.
    // Left chamber starts full. After equilibrium, each chamber's columns
    // should have equal totals (no staircase surface).
    const ctx = makeCtx({
      blocks: [
        [S, S, S, S, S, S, S, S, S, S],
        [S, A, A, A, S, S, A, A, A, S],
        [S, A, A, A, S, S, A, A, A, S],
        [S, A, A, A, S, S, A, A, A, S],
        [S, A, A, A, S, S, A, A, A, S],
        [S, A, A, A, A, A, A, A, A, S],
        [S, S, S, S, S, S, S, S, S, S],
      ],
      waterMass: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 5, 5, 5, 0, 0, 0, 0, 0, 0],
        [0, 5, 5, 5, 0, 0, 0, 0, 0, 0],
        [0, 5, 5, 5, 0, 0, 0, 0, 0, 0],
        [0, 5, 5, 5, 0, 0, 0, 0, 0, 0],
        [0, 5, 5, 5, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
    });
    const before = totalMass(ctx);
    const tick = runUntilEquilibrium(ctx, 1000);
    expect(tick).toBeGreaterThan(0);
    expect(totalMass(ctx)).toBe(before);
    // Each chamber's rows must be flat
    for (let y = 1; y <= 5; y++) {
      const left = [ctx.waterMass[y][1], ctx.waterMass[y][2], ctx.waterMass[y][3]];
      const right = [ctx.waterMass[y][6], ctx.waterMass[y][7], ctx.waterMass[y][8]];
      const lNonZero = left.filter(v => v > 0);
      const rNonZero = right.filter(v => v > 0);
      if (lNonZero.length > 0) {
        expect(Math.max(...lNonZero) - Math.min(...lNonZero)).toBeLessThanOrEqual(1);
      }
      if (rNonZero.length > 0) {
        expect(Math.max(...rNonZero) - Math.min(...rNonZero)).toBeLessThanOrEqual(1);
      }
    }
    // Column totals within each chamber should be equal (no staircase)
    const leftCols = [];
    for (let x = 1; x <= 3; x++) {
      let t = 0;
      for (let y = 1; y <= 5; y++) t += ctx.waterMass[y][x];
      leftCols.push(t);
    }
    const rightCols = [];
    for (let x = 6; x <= 8; x++) {
      let t = 0;
      for (let y = 1; y <= 5; y++) t += ctx.waterMass[y][x];
      rightCols.push(t);
    }
    expect(Math.max(...leftCols) - Math.min(...leftCols)).toBeLessThanOrEqual(1);
    expect(Math.max(...rightCols) - Math.min(...rightCols)).toBeLessThanOrEqual(1);
  });

  it('fast side flow conserves mass', () => {
    // Multi-row grid with pressure — verify total mass unchanged after many ticks
    const ctx = makeCtx({
      blocks: [
        [S, A, A, A, A, S],
        [S, A, A, A, A, S],
        [S, A, A, A, A, S],
        [S, S, S, S, S, S],
      ],
      waterMass: [
        [0, 5, 5, 0, 0, 0],
        [0, 5, 5, 0, 0, 0],
        [0, 5, 5, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
      ],
    });
    const before = totalMass(ctx);
    runTicks(ctx, 50);
    expect(totalMass(ctx)).toBe(before);
  });
});
