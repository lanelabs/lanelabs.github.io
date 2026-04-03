import { describe, it, expect } from 'vitest';
import {
  emptyGrid, carveRect, setAir, createSystem, runTicks,
  volumeInRegion, setPipe, VOLUME_PER_TILE,
} from './gasPathHelpers';

/**
 * Gas pipe flow priority tests — gravity entrance + round-robin exits.
 *
 * For gas (inverted from water):
 * Entrance = bottommost submerged terminal (highest y).
 * Exits = all terminals above entrance, filled in round-robin order.
 */

describe('gas pipe flow — gravity entrance selection', () => {
  it('bottommost submerged terminal becomes entrance', () => {
    // Gas pool at y=7, pipe runs upward from y=7 to y=3.
    // Bottommost terminal (y=7) in gas pool = entrance.
    const { blocks, pipes } = emptyGrid(10, 9);
    carveRect(blocks, 1, 7, 3, 7); // gas pool
    for (let y = 3; y <= 7; y++) { setAir(blocks, 3, y); setPipe(pipes, 3, y); }
    setAir(blocks, 4, 3);
    setAir(blocks, 5, 3);

    const sys = createSystem(blocks, pipes, [
      { y: 7, left: 1, right: 3, volume: 20 },
    ]);

    runTicks(sys, 5);
    const poolVol = volumeInRegion(sys, 1, 7, 3, 7);
    expect(poolVol).toBeLessThan(20);
  });

  it('entrance cascades when bottom empties', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 1, 7, 2, 7);  // bottom pool (small)
    carveRect(blocks, 5, 4, 7, 4);  // middle pool

    // Bottom pipe: y=3..7 at x=2
    for (let y = 3; y <= 7; y++) { setAir(blocks, 2, y); setPipe(pipes, 2, y); }
    setAir(blocks, 3, 3); // ceiling pocket for bottom pipe

    // Middle pipe: y=1..4 at x=7
    for (let y = 1; y <= 4; y++) { setAir(blocks, 7, y); setPipe(pipes, 7, y); }
    setAir(blocks, 8, 1); // ceiling pocket for middle pipe

    const sys = createSystem(blocks, pipes, [
      { y: 7, left: 1, right: 2, volume: 3 },
      { y: 4, left: 5, right: 7, volume: 20 },
    ]);
    runTicks(sys, 20);

    const middleVol = volumeInRegion(sys, 5, 4, 7, 4);
    expect(middleVol).toBeLessThan(20);
  });
});

describe('gas pipe flow — round-robin exit distribution', () => {
  it('alternates gas between two forked exits', () => {
    // Fork layout: pipe from y=7 up to y=4, then forks left (x=2) and right (x=4)
    // each with a terminal at y=3. Ceiling pockets above.
    const { blocks, pipes } = emptyGrid(8, 9);
    carveRect(blocks, 1, 7, 3, 7); // gas pool
    for (let y = 4; y <= 7; y++) { setAir(blocks, 3, y); setPipe(pipes, 3, y); }
    setAir(blocks, 2, 4); setPipe(pipes, 2, 4);
    setAir(blocks, 4, 4); setPipe(pipes, 4, 4);
    setAir(blocks, 2, 3); setPipe(pipes, 2, 3);
    setAir(blocks, 1, 3);
    setAir(blocks, 4, 3); setPipe(pipes, 4, 3);
    setAir(blocks, 5, 3);

    const sys = createSystem(blocks, pipes, [
      { y: 7, left: 1, right: 3, volume: 30 },
    ]);
    runTicks(sys, 12);

    const leftVol = volumeInRegion(sys, 1, 3, 2, 3);
    const rightVol = volumeInRegion(sys, 4, 3, 5, 3);
    expect(leftVol).toBeGreaterThan(0);
    expect(rightVol).toBeGreaterThan(0);
  });

  it('skips full exit and advances to next', () => {
    const { blocks, pipes } = emptyGrid(8, 9);
    carveRect(blocks, 1, 7, 3, 7);
    for (let y = 4; y <= 7; y++) { setAir(blocks, 3, y); setPipe(pipes, 3, y); }
    setAir(blocks, 2, 4); setPipe(pipes, 2, 4);
    setAir(blocks, 4, 4); setPipe(pipes, 4, 4);
    setAir(blocks, 2, 3); setPipe(pipes, 2, 3);
    setAir(blocks, 1, 3);
    setAir(blocks, 4, 3); setPipe(pipes, 4, 3);
    setAir(blocks, 5, 3);

    const sys = createSystem(blocks, pipes, [
      { y: 7, left: 1, right: 3, volume: 20 },
      // Left pocket full (layer spans x=1..2 since air run is 1..2)
      { y: 3, left: 1, right: 2, volume: 2 * VOLUME_PER_TILE },
    ]);
    runTicks(sys, 6);

    const rightVol = volumeInRegion(sys, 4, 3, 5, 3);
    expect(rightVol).toBeGreaterThan(0);
  });

  it('all exits full means no flow via pipe', () => {
    const { blocks, pipes } = emptyGrid(8, 9);

    // Source pool (solid walls, x=1..2 at y=7)
    carveRect(blocks, 1, 7, 2, 7);

    // Pipe terminal at x=3,y=7 (air + pipe, adjacent to pool)
    setAir(blocks, 3, 7); setPipe(pipes, 3, 7);

    // Pipe through STONE y=4..6
    for (let y = 4; y <= 6; y++) { setPipe(pipes, 3, y); }

    // Fork at y=3: left terminal at x=2, right terminal at x=4
    setPipe(pipes, 3, 3); // junction in stone
    setAir(blocks, 2, 3); setPipe(pipes, 2, 3); // left terminal (air)
    setAir(blocks, 4, 3); setPipe(pipes, 4, 3); // right terminal (air)

    // Ceiling pockets beside terminals
    setAir(blocks, 1, 3); // left pocket
    setAir(blocks, 5, 3); // right pocket

    const initialSourceVol = 20;
    const sys = createSystem(blocks, pipes, [
      { y: 7, left: 1, right: 2, volume: initialSourceVol },
      { y: 3, left: 1, right: 2, volume: 2 * VOLUME_PER_TILE }, // left full
      { y: 3, left: 4, right: 5, volume: 2 * VOLUME_PER_TILE }, // right full
    ]);
    runTicks(sys, 5);

    const sourceVol = volumeInRegion(sys, 1, 7, 2, 7);
    expect(sourceVol).toBe(initialSourceVol);
  });

  it('all paths visible after tracing (branches for all exits)', () => {
    const { blocks, pipes } = emptyGrid(8, 9);
    carveRect(blocks, 1, 7, 3, 7);
    for (let y = 4; y <= 7; y++) { setAir(blocks, 3, y); setPipe(pipes, 3, y); }
    setAir(blocks, 2, 4); setPipe(pipes, 2, 4);
    setAir(blocks, 4, 4); setPipe(pipes, 4, 4);
    setAir(blocks, 2, 3); setPipe(pipes, 2, 3);
    setAir(blocks, 1, 3);
    setAir(blocks, 4, 3); setPipe(pipes, 4, 3);
    setAir(blocks, 5, 3);

    const sys = createSystem(blocks, pipes, [
      { y: 7, left: 1, right: 3, volume: 20 },
    ]);
    runTicks(sys, 1);

    const pipePaths = sys.state.paths.filter(p => p.networkId !== undefined);
    expect(pipePaths.length).toBeGreaterThan(0);
    const totalBranches = pipePaths.reduce((sum, p) => sum + p.branches.length, 0);
    expect(totalBranches).toBeGreaterThanOrEqual(2);
  });
});
