import { describe, it, expect } from 'vitest';
import {
  emptyGrid, carveRect, setAir, createSystem, runTicks,
  volumeInRegion, setPipe, VOLUME_PER_TILE,
} from './pathHelpers';

/**
 * Pipe flow priority tests — gravity entrance + round-robin exits.
 *
 * Entrance = topmost submerged terminal (lowest y).
 * Exits = all terminals below entrance, filled in round-robin order.
 */

describe('pipe flow — gravity entrance selection', () => {
  it('topmost submerged terminal becomes entrance', () => {
    const { blocks, pipes } = emptyGrid(10, 9);
    carveRect(blocks, 1, 2, 3, 2);
    for (let y = 2; y <= 6; y++) { setAir(blocks, 3, y); setPipe(pipes, 3, y); }
    setAir(blocks, 4, 6);
    setAir(blocks, 5, 6);

    const sys = createSystem(blocks, pipes, [
      { y: 2, left: 1, right: 3, volume: 20 },
    ]);

    runTicks(sys, 5);
    const topVol = volumeInRegion(sys, 1, 2, 3, 2);
    expect(topVol).toBeLessThan(20);
  });

  it('entrance cascades when top empties', () => {
    // Two separate pipe networks: top pool→bottom, middle pool→bottom.
    // Top pool empties first, then middle pool still drains.
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 1, 2, 2, 2);  // top pool (small)
    carveRect(blocks, 5, 5, 7, 5);  // middle pool

    // Top pipe: y=2..4 at x=2
    for (let y = 2; y <= 4; y++) { setAir(blocks, 2, y); setPipe(pipes, 2, y); }
    setAir(blocks, 3, 4); // basin for top pipe

    // Middle pipe: y=5..8 at x=7
    for (let y = 5; y <= 8; y++) { setAir(blocks, 7, y); setPipe(pipes, 7, y); }
    setAir(blocks, 8, 8); // basin for middle pipe

    const sys = createSystem(blocks, pipes, [
      { y: 2, left: 1, right: 2, volume: 3 },
      { y: 5, left: 5, right: 7, volume: 20 },
    ]);
    runTicks(sys, 20);

    const middleVol = volumeInRegion(sys, 5, 5, 7, 5);
    expect(middleVol).toBeLessThan(20);
  });
});

describe('pipe flow — round-robin exit distribution', () => {
  it('alternates water between two forked exits', () => {
    // Fork layout: pipe from y=2 down to y=5, then forks left (x=2) and right (x=4)
    // each with a terminal at y=6. Basins at x=1,y=6 and x=5,y=6.
    const { blocks, pipes } = emptyGrid(8, 8);
    carveRect(blocks, 1, 2, 3, 2);
    for (let y = 2; y <= 5; y++) { setAir(blocks, 3, y); setPipe(pipes, 3, y); }
    setAir(blocks, 2, 5); setPipe(pipes, 2, 5);
    setAir(blocks, 4, 5); setPipe(pipes, 4, 5);
    setAir(blocks, 2, 6); setPipe(pipes, 2, 6);
    setAir(blocks, 1, 6);
    setAir(blocks, 4, 6); setPipe(pipes, 4, 6);
    setAir(blocks, 5, 6);

    const sys = createSystem(blocks, pipes, [
      { y: 2, left: 1, right: 3, volume: 30 },
    ]);
    runTicks(sys, 12);

    // addWater scans full air run: left basin = x=1..2, right = x=4..5
    const leftVol = volumeInRegion(sys, 1, 6, 2, 6);
    const rightVol = volumeInRegion(sys, 4, 6, 5, 6);
    expect(leftVol).toBeGreaterThan(0);
    expect(rightVol).toBeGreaterThan(0);
  });

  it('skips full exit and advances to next', () => {
    const { blocks, pipes } = emptyGrid(8, 8);
    carveRect(blocks, 1, 2, 3, 2);
    for (let y = 2; y <= 5; y++) { setAir(blocks, 3, y); setPipe(pipes, 3, y); }
    setAir(blocks, 2, 5); setPipe(pipes, 2, 5);
    setAir(blocks, 4, 5); setPipe(pipes, 4, 5);
    setAir(blocks, 2, 6); setPipe(pipes, 2, 6);
    setAir(blocks, 1, 6);
    setAir(blocks, 4, 6); setPipe(pipes, 4, 6);
    setAir(blocks, 5, 6);

    const sys = createSystem(blocks, pipes, [
      { y: 2, left: 1, right: 3, volume: 20 },
      // Left basin full (layer spans x=1..2 since air run is 1..2)
      { y: 6, left: 1, right: 2, volume: 2 * VOLUME_PER_TILE },
    ]);
    runTicks(sys, 6);

    const rightVol = volumeInRegion(sys, 4, 6, 5, 6);
    expect(rightVol).toBeGreaterThan(0);
  });

  it('all exits full means no flow via pipe', () => {
    // Source pool enclosed. Pipe runs through stone walls into pool.
    // Both pipe exits are full → pipe flow should not transfer water.
    //
    //  y=2: S[pool]P SS  (pool x=1..2, pipe terminal at x=3 in air)
    //  y=3: SSSS p SSS  (pipe x=3 in STONE — no air)
    //  y=4: SSSS p SSS  (pipe x=3 in STONE)
    //  y=5: SSS ppp SS  (fork in STONE: x=3,4,5)
    //  y=6: SS P S P SS (terminals in air: x=2 and x=5 — but wait, need fork)
    //
    // Simpler: pipe terminal in pool, pipe goes through stone, forks at
    // bottom into two terminals with full basins beside them.
    const { blocks, pipes } = emptyGrid(8, 9);

    // Source pool (solid walls, x=1..2 at y=2)
    carveRect(blocks, 1, 2, 2, 2);

    // Pipe terminal at x=3,y=2 (air + pipe, adjacent to pool)
    setAir(blocks, 3, 2); setPipe(pipes, 3, 2);

    // Pipe through STONE y=3..5 (no setAir — stays stone)
    for (let y = 3; y <= 5; y++) { setPipe(pipes, 3, y); }

    // Fork at y=6: left terminal at x=2, right terminal at x=4
    setPipe(pipes, 3, 6); // junction in stone
    setAir(blocks, 2, 6); setPipe(pipes, 2, 6); // left terminal (air)
    setAir(blocks, 4, 6); setPipe(pipes, 4, 6); // right terminal (air)

    // Basins beside terminals
    setAir(blocks, 1, 6); // left basin
    setAir(blocks, 5, 6); // right basin

    const initialSourceVol = 20;
    const sys = createSystem(blocks, pipes, [
      { y: 2, left: 1, right: 2, volume: initialSourceVol },
      { y: 6, left: 1, right: 2, volume: 2 * VOLUME_PER_TILE }, // left full
      { y: 6, left: 4, right: 5, volume: 2 * VOLUME_PER_TILE }, // right full
    ]);
    runTicks(sys, 5);

    const sourceVol = volumeInRegion(sys, 1, 2, 2, 2);
    expect(sourceVol).toBe(initialSourceVol);
  });

  it('all paths visible after tracing (branches for all exits)', () => {
    const { blocks, pipes } = emptyGrid(8, 8);
    carveRect(blocks, 1, 2, 3, 2);
    for (let y = 2; y <= 5; y++) { setAir(blocks, 3, y); setPipe(pipes, 3, y); }
    setAir(blocks, 2, 5); setPipe(pipes, 2, 5);
    setAir(blocks, 4, 5); setPipe(pipes, 4, 5);
    setAir(blocks, 2, 6); setPipe(pipes, 2, 6);
    setAir(blocks, 1, 6);
    setAir(blocks, 4, 6); setPipe(pipes, 4, 6);
    setAir(blocks, 5, 6);

    const sys = createSystem(blocks, pipes, [
      { y: 2, left: 1, right: 3, volume: 20 },
    ]);
    runTicks(sys, 1);

    const pipePaths = sys.state.paths.filter(p => p.networkId !== undefined);
    expect(pipePaths.length).toBeGreaterThan(0);
    const totalBranches = pipePaths.reduce((sum, p) => sum + p.branches.length, 0);
    expect(totalBranches).toBeGreaterThanOrEqual(2);
  });
});
