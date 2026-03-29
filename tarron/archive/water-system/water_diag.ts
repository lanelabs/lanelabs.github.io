import { simulateWaterCA, snapPoolsToFlat, unsettleColumnsAbove, MAX_WATER, type WaterCAContext } from './src/sim/systems/waterCA';
import { BlockMaterial } from './src/sim/types';
const A = BlockMaterial.Air, S = BlockMaterial.Stone;

function makeCtx(opts: { blocks: BlockMaterial[][]; waterMass: number[][] }): WaterCAContext {
  const h = opts.blocks.length, w = opts.blocks[0].length;
  const wn: number[][] = [], se: boolean[][] = [];
  for (let y = 0; y < h; y++) { wn.push(new Array(w).fill(0)); se.push(new Array(w).fill(false)); }
  return { width: w, height: h, blocks: opts.blocks, waterMass: opts.waterMass, waterMassNext: wn, settled: se };
}

function totalMass(ctx: WaterCAContext): number {
  let s = 0;
  for (let y = 0; y < ctx.height; y++) for (let x = 0; x < ctx.width; x++) s += ctx.waterMass[y][x];
  return s;
}

function printGrid(ctx: WaterCAContext, label?: string): void {
  if (label) console.log(label);
  for (let y = 0; y < ctx.height; y++) {
    const cells: string[] = [];
    for (let x = 0; x < ctx.width; x++) {
      if (ctx.blocks[y][x] !== A) cells.push(' ##');
      else if (ctx.waterMass[y][x] > 0) cells.push(`  ${ctx.waterMass[y][x]}`);
      else cells.push('  .');
    }
    console.log(`y=${y.toString().padStart(2)}: ${cells.join('')}`);
  }
}

function isAtEquilibrium(ctx: WaterCAContext): boolean {
  const { width, height, blocks, waterMass } = ctx;
  for (let y = 0; y < height; y++) {
    let runMin = -1, runMax = -1;
    for (let x = 0; x < width; x++) {
      if (blocks[y][x] !== A) {
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
      if (y + 1 < height && blocks[y + 1][x] === A && waterMass[y + 1][x] < MAX_WATER - 1) return false;
      if (x + 1 < width && blocks[y][x + 1] === A && Math.abs(m - waterMass[y][x + 1]) >= 2) return false;
      if (x - 1 >= 0 && blocks[y][x - 1] === A && Math.abs(m - waterMass[y][x - 1]) >= 2) return false;
    }
    if (runMin >= 0 && runMax - runMin > 1) return false;
  }
  return true;
}

function runToEquilibrium(ctx: WaterCAContext, maxTicks: number): number {
  let lowFlowStreak = 0;
  for (let tick = 0; tick < maxTicks; tick++) {
    unsettleColumnsAbove(ctx);
    const snapped = snapPoolsToFlat(ctx);
    const maxFlow = simulateWaterCA(ctx);
    if (maxFlow > 1 || snapped > 0) lowFlowStreak = 0;
    else lowFlowStreak++;
    if (lowFlowStreak >= 3) {
      if (isAtEquilibrium(ctx)) return tick + 1;
      lowFlowStreak = 0;
      for (let y = 0; y < ctx.height; y++)
        for (let x = 0; x < ctx.width; x++)
          if (ctx.waterMass[y][x] > 0) ctx.settled[y][x] = false;
    }
  }
  return -1;
}

// ═══════════════════════════════════════════════════════════════════
// SCENARIO 1: Pool with hole (Test 2 from waterTestTerrain)
// 5×5 pool, hole at bottom-right wall, collection area to the right
// ═══════════════════════════════════════════════════════════════════
console.log('═══ SCENARIO 1: Pool with side hole ═══');
{
  // Simplified: 5-wide, 5-tall pool. Hole at bottom-right. Collection to right.
  const ctx = makeCtx({
    blocks: [
      //   0  1  2  3  4  5  6  7  8  9 10 11 12
      [S, S, S, S, S, S, S, S, S, S, S, S, S],  // y=0: top wall
      [S, A, A, A, A, A, S, S, S, S, S, S, S],  // y=1-5: pool interior (5×5)
      [S, A, A, A, A, A, S, S, S, S, S, S, S],
      [S, A, A, A, A, A, S, A, A, A, A, S, S],  // y=3: collection starts
      [S, A, A, A, A, A, S, A, A, A, A, S, S],
      [S, A, A, A, A, A, A, A, A, A, A, S, S],  // y=5: hole at x=6, collection row
      [S, S, S, S, S, S, S, S, S, S, S, S, S],  // y=6: floor
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
  console.log('Total mass:', totalMass(ctx));
  printGrid(ctx, 'INITIAL:');
  const tick = runToEquilibrium(ctx, 1000);
  console.log(`\nEquilibrium at tick: ${tick}`);
  printGrid(ctx, 'FINAL:');
  console.log('Total mass:', totalMass(ctx));
  // Check per-row flatness in the pool (x=1..5)
  console.log('\nPool row analysis:');
  for (let y = 1; y <= 5; y++) {
    const row = [];
    for (let x = 1; x <= 5; x++) row.push(ctx.waterMass[y][x]);
    const span = Math.max(...row) - Math.min(...row);
    console.log(`  y=${y}: [${row}] span=${span}`);
  }
}

// ═══════════════════════════════════════════════════════════════════
// SCENARIO 2: U-tube with EXACT game dimensions (2-cell tunnel)
// ═══════════════════════════════════════════════════════════════════
console.log('\n═══ SCENARIO 2: U-tube (2-cell tunnel, game dimensions) ═══');
{
  // Left chamber: x=1-3 (3 wide), y=1-5 (5 tall)
  // Right chamber: x=6-8 (3 wide), y=1-5 (5 tall)
  // Wall between: x=4-5, y=1-4 (2 wide stone)
  // Tunnel: x=4-5, y=5 (2 wide, 1 tall)
  const ctx = makeCtx({
    blocks: [
      //   0  1  2  3  4  5  6  7  8  9
      [S, S, S, S, S, S, S, S, S, S],  // y=0: top wall
      [S, A, A, A, S, S, A, A, A, S],  // y=1-4: chambers + wall between
      [S, A, A, A, S, S, A, A, A, S],
      [S, A, A, A, S, S, A, A, A, S],
      [S, A, A, A, S, S, A, A, A, S],
      [S, A, A, A, A, A, A, A, A, S],  // y=5: tunnel + both chamber bottoms
      [S, S, S, S, S, S, S, S, S, S],  // y=6: floor
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
  console.log('Total mass:', totalMass(ctx));
  printGrid(ctx, 'INITIAL:');
  const tick = runToEquilibrium(ctx, 1000);
  console.log(`\nEquilibrium at tick: ${tick}`);
  printGrid(ctx, 'FINAL:');
  console.log('Total mass:', totalMass(ctx));
  console.log('\nRow analysis:');
  for (let y = 1; y <= 5; y++) {
    const left = [ctx.waterMass[y][1], ctx.waterMass[y][2], ctx.waterMass[y][3]];
    const right = [ctx.waterMass[y][6], ctx.waterMass[y][7], ctx.waterMass[y][8]];
    const lSpan = Math.max(...left) - Math.min(...left);
    const rSpan = Math.max(...right) - Math.min(...right);
    const tunnel = y === 5 ? ` TUNNEL=[${ctx.waterMass[y][4]},${ctx.waterMass[y][5]}]` : '';
    console.log(`  y=${y}: LEFT=[${left}](span=${lSpan}) RIGHT=[${right}](span=${rSpan})${tunnel}`);
  }
  // Column totals
  console.log('Column totals:');
  for (let x = 1; x <= 3; x++) {
    let t = 0; for (let y = 1; y <= 5; y++) t += ctx.waterMass[y][x];
    console.log(`  left col x=${x}: ${t}`);
  }
  for (let x = 6; x <= 8; x++) {
    let t = 0; for (let y = 1; y <= 5; y++) t += ctx.waterMass[y][x];
    console.log(`  right col x=${x}: ${t}`);
  }
}
