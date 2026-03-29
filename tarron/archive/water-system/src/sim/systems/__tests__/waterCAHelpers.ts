import { type WaterCAContext, simulateWaterCA, snapPoolsToFlat, unsettleColumnsAbove, MAX_WATER } from '../waterCA';
import { BlockMaterial } from '../../types';

export const A = BlockMaterial.Air;
export const S = BlockMaterial.Stone;

/** Build a minimal WaterCAContext from a block/water grid. */
export function makeCtx(opts: {
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

/** Return the total water mass across all cells. */
export function totalMass(ctx: WaterCAContext): number {
  let sum = 0;
  for (let y = 0; y < ctx.height; y++) {
    for (let x = 0; x < ctx.width; x++) {
      sum += ctx.waterMass[y][x];
    }
  }
  return sum;
}

/** Run N ticks of the CA. */
export function runTicks(ctx: WaterCAContext, n: number): void {
  for (let i = 0; i < n; i++) {
    simulateWaterCA(ctx);
  }
}

/** Extract a single row of water mass values. */
export function rowMass(ctx: WaterCAContext, y: number): number[] {
  return ctx.waterMass[y].slice();
}

/**
 * Run snap+CA ticks with periodic unsettling (like WaterFlowSystem does
 * when isAtEquilibrium returns false after a low-flow streak).
 */
export function runSystemTicks(ctx: WaterCAContext, n: number): void {
  let lowFlowStreak = 0;
  for (let i = 0; i < n; i++) {
    unsettleColumnsAbove(ctx);
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

/**
 * Run system ticks with the full WaterFlowSystem equilibrium check.
 * Returns the tick at which equilibrium was declared, or -1 if not reached.
 */
export function runUntilEquilibrium(ctx: WaterCAContext, maxTicks: number): number {
  let lowFlowStreak = 0;
  for (let i = 0; i < maxTicks; i++) {
    unsettleColumnsAbove(ctx);
    const snapped = snapPoolsToFlat(ctx);
    const maxFlow = simulateWaterCA(ctx);

    if (maxFlow > 1 || snapped > 0) {
      lowFlowStreak = 0;
    } else {
      lowFlowStreak++;
    }

    if (lowFlowStreak >= 3) {
      if (isAtEquilibrium(ctx)) return i;
      lowFlowStreak = 0;
      for (let y = 0; y < ctx.height; y++)
        for (let x = 0; x < ctx.width; x++)
          if (ctx.waterMass[y][x] > 0) ctx.settled[y][x] = false;
    }
  }
  return -1;
}

/** Mirrors WaterFlowSystem.isAtEquilibrium() */
function isAtEquilibrium(ctx: WaterCAContext): boolean {
  const { width, height, blocks, waterMass } = ctx;
  for (let y = 0; y < height; y++) {
    let runMin = -1;
    let runMax = -1;
    for (let x = 0; x < width; x++) {
      if (blocks[y][x] !== BlockMaterial.Air) {
        if (runMin >= 0 && runMax - runMin > 1) return false;
        runMin = -1; runMax = -1;
        continue;
      }
      const m = waterMass[y][x];
      if (m > 0) {
        if (runMin < 0) { runMin = m; runMax = m; }
        else { if (m < runMin) runMin = m; if (m > runMax) runMax = m; }
      } else {
        if (runMin >= 0 && runMax - runMin > 1) return false;
        runMin = -1; runMax = -1;
      }
      if (m <= 0) continue;
      if (y + 1 < height && blocks[y + 1][x] === BlockMaterial.Air) {
        if (waterMass[y + 1][x] < MAX_WATER) return false;
      }
      if (x + 1 < width && blocks[y][x + 1] === BlockMaterial.Air) {
        if (Math.abs(m - waterMass[y][x + 1]) >= 2) return false;
      }
      if (x - 1 >= 0 && blocks[y][x - 1] === BlockMaterial.Air) {
        if (Math.abs(m - waterMass[y][x - 1]) >= 2) return false;
      }
    }
    if (runMin >= 0 && runMax - runMin > 1) return false;
  }
  return true;
}
