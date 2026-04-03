import { describe, it, expect } from 'vitest';
import {
  emptyGrid, carveRect, setAir, createSystem, runTicks,
  volumeInRegion, setPipe,
} from './gasPathHelpers';
import type { PumpCell } from '../types';

/**
 * Gas pump flow tests — down-pump forces terminals below to be exit-only.
 * Mirror of pumpFlow.test.ts with inverted direction.
 *
 * Gas naturally rises through pipes. A down-pump is needed to push
 * gas downward through pipes.
 */

describe('down-pump behavior', () => {
  it('pump tags terminals below as exit-only, enabling downward flow', () => {
    // Top pool at y=2, pipe terminal at (3,2) goes down to terminal at (4,7).
    // Terminal at (4,7) exits into ceiling pocket at y=7 (x=4..6).
    // Pump at y=5 makes (4,7) exit-only → (3,2) is entrance.
    // Pipe tiles y=3..6 are stone (no air shortcut back to source).
    const { blocks, pipes } = emptyGrid(9, 9);

    // Top pool (source) — (3,2) is air from this carve
    carveRect(blocks, 1, 2, 3, 2);

    // Vertical pipe y=2..7 through stone (only y=2 is air from carveRect)
    for (let y = 2; y <= 7; y++) { setPipe(pipes, 3, y); }

    // Horizontal pipe branch at y=7 (terminal in air)
    setAir(blocks, 4, 7); setPipe(pipes, 4, 7);

    // Ceiling pocket for bottom exit (x=5..6, y=7 — contained)
    setAir(blocks, 5, 7);
    setAir(blocks, 6, 7);

    // Down-pump at y=5
    const pumps: PumpCell[] = [{ x: 3, y: 5, direction: 'down' }];

    const sys = createSystem(blocks, pipes, [
      { y: 2, left: 1, right: 3, volume: 20 },
    ], pumps);

    runTicks(sys, 10);

    const bottomVol = volumeInRegion(sys, 5, 7, 6, 7);
    const topVol = volumeInRegion(sys, 1, 2, 3, 2);

    expect(bottomVol).toBeGreaterThan(0);
    expect(topVol).toBeLessThan(20);
  });

  it('all exit-only terminals means no pipe flow', () => {
    // Pool at y=7, pipe enters from side. Pool has solid ceiling.
    // Pump makes the only terminal exit-only → no entrance → no pipe flow.
    const { blocks, pipes } = emptyGrid(7, 9);
    carveRect(blocks, 1, 7, 2, 7);

    // Pipe terminal at x=3,y=7 (air, in pool)
    setAir(blocks, 3, 7); setPipe(pipes, 3, 7);
    // Pipe through stone above (no setAir — prevents ceiling breach)
    setPipe(pipes, 3, 6);
    setPipe(pipes, 3, 5);

    // Down-pump at y=5 — terminal at x=3,y=7 is below pump → exit-only
    const pumps: PumpCell[] = [{ x: 3, y: 5, direction: 'down' }];
    const initialVol = 20;
    const sys = createSystem(blocks, pipes, [
      { y: 7, left: 1, right: 2, volume: initialVol },
    ], pumps);

    runTicks(sys, 5);

    // Pool should retain volume (no pipe flow possible)
    const poolVol = volumeInRegion(sys, 1, 7, 2, 7);
    expect(poolVol).toBe(initialVol);
  });

  it('gas below a down-pump cannot enter the pipe network (exit-only)', () => {
    // Vertical pipe enters bottom cavern from ceiling. Terminal is at the
    // bottom of the pipe run, submerged in gas. Pipe goes up through stone,
    // through a down-pump, then horizontally to a top cavern.
    // The bottom terminal is exitOnly — gas must not enter and flow up.
    //
    // Layout (10 wide × 14 tall):
    //   y=2:  top cavern (x=1..4)
    //   y=3:  horizontal pipe (x=5,6) connecting to vertical at x=6
    //   y=3..7: vertical pipe at x=6 (in stone)
    //   y=5:  down-pump at (6,5)
    //   y=8:  vertical pipe enters cavern ceiling at x=6
    //   y=8..11: bottom cavern (x=2..7) — pipe at (6,8) is terminal
    //            gas fills y=10..11
    const { blocks, pipes } = emptyGrid(10, 14);

    // Top cavern
    carveRect(blocks, 1, 2, 4, 2);

    // Horizontal pipe from cavern to vertical run
    setAir(blocks, 5, 3); setPipe(pipes, 5, 3);
    setPipe(pipes, 6, 3);

    // Vertical pipe y=3..8 at x=6 (in stone except where it enters caverns)
    for (let y = 3; y <= 8; y++) { setPipe(pipes, 6, y); }

    // Down-pump at (6,5)
    const pumps: PumpCell[] = [{ x: 6, y: 5, direction: 'down' }];

    // Bottom cavern (pipe enters from ceiling)
    carveRect(blocks, 2, 8, 7, 9);

    // Gas pooled at ceiling of cavern, covering the terminal at (6,8)
    const initialVol = 40;

    const sys = createSystem(blocks, pipes, [
      { y: 8, left: 2, right: 7, volume: initialVol },
    ], pumps);

    runTicks(sys, 15);

    // Gas should stay in bottom cavern — can't enter through exitOnly terminal
    const bottomVol = volumeInRegion(sys, 2, 8, 7, 9);
    const topVol = volumeInRegion(sys, 1, 2, 4, 2);

    expect(bottomVol).toBe(initialVol);
    expect(topVol).toBe(0);
  });

  it('pump enables both downward and upward delivery via round-robin', () => {
    // Pool at y=4 with pipe terminal submerged.
    // Vertical pipe through stone, terminals at top and bottom in air.
    // Down-pump tags bottom terminal as exit-only. Pool entrance → both exits.
    const { blocks, pipes } = emptyGrid(9, 10);

    // Middle pool (x=1..3 at y=4)
    carveRect(blocks, 1, 4, 3, 4);

    // Vertical pipe through stone y=1..7 at x=3
    for (let y = 1; y <= 7; y++) { setPipe(pipes, 3, y); }

    // Pipe terminal in pool at x=4,y=4 (air + pipe)
    setAir(blocks, 4, 4); setPipe(pipes, 4, 4);

    // Top horizontal branch: terminal at x=4,y=1
    setAir(blocks, 4, 1); setPipe(pipes, 4, 1);
    setAir(blocks, 5, 1); setAir(blocks, 6, 1); // ceiling pocket

    // Bottom horizontal branch: terminal at x=4,y=7
    setAir(blocks, 4, 7); setPipe(pipes, 4, 7);
    setAir(blocks, 5, 7); setAir(blocks, 6, 7); // pocket

    // Down-pump at y=5 — terminals below (x=4,y=7) become exit-only
    const pumps: PumpCell[] = [{ x: 3, y: 5, direction: 'down' }];

    const sys = createSystem(blocks, pipes, [
      { y: 4, left: 1, right: 4, volume: 40 },
    ], pumps);

    runTicks(sys, 14);

    const topVol = volumeInRegion(sys, 5, 1, 6, 1);
    const bottomVol = volumeInRegion(sys, 5, 7, 6, 7);

    expect(topVol).toBeGreaterThan(0);
    expect(bottomVol).toBeGreaterThan(0);
  });
});
