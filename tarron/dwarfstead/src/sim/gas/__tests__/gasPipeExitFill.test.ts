import { describe, it, expect } from 'vitest';
import {
  emptyGrid, carveRect, setPipe, createSystem, runTicks,
  totalVolume, volumeInRegion, VOLUME_PER_TILE, A,
} from './gasPathHelpers';
import type { PumpCell } from '../types';
import type { GasLayer } from '../types';

/**
 * Gas pipe exit fill order — gas exiting a pipe into a cavern with a
 * narrow ceiling pocket should fill the pocket FIRST before the wider area.
 *
 * Layout (5 wide, 10 tall):
 *
 *   01234
 * 0 xxxxx   ← ceiling
 * 1 xGPGx   ← source gas pool (x=1-3, y=1, 50 vol) with pipe terminal
 * 2 xxPxx   ← pipe (x=2, y=2) in stone
 * 3 xxPxx   ← down-pump (x=2, y=3) in stone
 * 4 xxPxx   ← pipe (x=2, y=4) in stone
 * 5 xx.xx   ← 1-wide air pocket (x=2, y=5)
 * 6 x.P.x   ← 3-wide area (x=1-3, y=6) with pipe terminal at x=2
 * 7 x...x   ← 3-wide area (x=1-3, y=7)
 * 8 x...x   ← 3-wide area (x=1-3, y=8)
 * 9 xxxxx   ← floor
 *
 * Pipe runs x=2 from y=1 to y=6. Terminal at (2,1) is in gas pool (entrance).
 * Terminal at (2,6) is in 3-wide air (exit, tagged exit-only by pump).
 * Gas exits pipe at (2,6), rises to (2,5), finds contained pocket, fills it first.
 *
 * Expected:
 * - First ~10 ticks: gas fills 1-wide pocket at (2,5), wide area empty
 * - After pocket fills: gas starts filling the 3-wide area at y=6-8
 */
describe('gas pipe exit fill order', () => {
  function buildLayout() {
    const { blocks, pipes } = emptyGrid(5, 10);

    // Source gas pool at y=1
    carveRect(blocks, 1, 1, 3, 1);

    // 1-wide air shaft at y=5 (just x=2)
    blocks[5][2] = A;

    // 3-wide area at y=6-8
    carveRect(blocks, 1, 6, 3, 6);
    carveRect(blocks, 1, 7, 3, 7);
    carveRect(blocks, 1, 8, 3, 8);

    // Pipe at x=2 from y=1 to y=6
    // y=1: pipe terminal in gas pool (entrance)
    // y=2-4: pipe in stone
    // y=5: pipe passes through 1-wide air shaft (not a terminal — 2 neighbors)
    // y=6: pipe terminal in 3-wide air (exit)
    for (let y = 1; y <= 6; y++) {
      setPipe(pipes, 2, y);
    }

    // Down-pump at y=3
    const pumps: PumpCell[] = [{ x: 2, y: 3, direction: 'down' }];

    // Source gas: 50 units at y=1 (enough gas to fill everything)
    const initialGas: GasLayer[] = [
      { y: 1, left: 1, right: 3, volume: 50 },
    ];

    return { blocks, pipes, pumps, initialGas };
  }

  it('fills narrow ceiling pocket before wider area', () => {
    const { blocks, pipes, pumps, initialGas } = buildLayout();
    const sys = createSystem(blocks, pipes, initialGas, pumps);

    expect(totalVolume(sys)).toBe(50);

    // After 5 ticks: narrow pocket should be filling, wide area empty
    runTicks(sys, 5);
    const narrowAfter5 = volumeInRegion(sys, 2, 5, 2, 5);
    const wideAfter5 = volumeInRegion(sys, 1, 6, 3, 8);

    expect(narrowAfter5).toBeGreaterThan(0);
    expect(wideAfter5).toBe(0); // NO gas in wide area yet!

    // Total volume conserved
    expect(totalVolume(sys)).toBe(50);
  });

  it('wide area only receives gas after pocket is full', () => {
    const { blocks, pipes, pumps, initialGas } = buildLayout();
    const sys = createSystem(blocks, pipes, initialGas, pumps);

    // Run enough ticks to fill the narrow pocket (cap=10, rate=1/tick)
    // First tick traces paths, teleport starts on tick 2. ~12 ticks to fill + 1 buffer.
    runTicks(sys, 13);

    const narrowAfter13 = volumeInRegion(sys, 2, 5, 2, 5);
    expect(narrowAfter13).toBe(VOLUME_PER_TILE); // pocket full (1 tile × 10)

    // Now run a few more ticks — wide area should start receiving gas
    runTicks(sys, 5);
    const wideAfter18 = volumeInRegion(sys, 1, 6, 3, 8);
    expect(wideAfter18).toBeGreaterThan(0);

    // Narrow pocket should STILL be full (gas doesn't drain from it)
    const narrowAfter18 = volumeInRegion(sys, 2, 5, 2, 5);
    expect(narrowAfter18).toBe(VOLUME_PER_TILE);

    // Total volume conserved
    expect(totalVolume(sys)).toBe(50);
  });

  it('gas rate through pipe is 1 unit per tick', () => {
    const { blocks, pipes, pumps, initialGas } = buildLayout();
    const sys = createSystem(blocks, pipes, initialGas, pumps);

    const sourceBefore = volumeInRegion(sys, 1, 1, 3, 1);
    expect(sourceBefore).toBe(50);

    runTicks(sys, 6);

    // ~5 units should have been teleported (first tick has no teleport)
    const sourceAfter = volumeInRegion(sys, 1, 1, 3, 1);
    const delivered = sourceBefore - sourceAfter;
    expect(delivered).toBeGreaterThanOrEqual(4);
    expect(delivered).toBeLessThanOrEqual(6);
  });
});
