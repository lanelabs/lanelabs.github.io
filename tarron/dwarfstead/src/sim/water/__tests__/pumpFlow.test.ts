import { describe, it, expect } from 'vitest';
import {
  emptyGrid, carveRect, setAir, createSystem, runTicks,
  volumeInRegion, setPipe,
} from './pathHelpers';
import type { PumpCell } from '../types';

/**
 * Pump flow tests — up-pump forces terminals above to be exit-only.
 */

describe('up-pump behavior', () => {
  it('pump tags terminals above as exit-only, enabling upward flow', () => {
    // Bottom pool at y=7, pipe terminal at y=7 goes up to terminal at y=2.
    // Terminal at y=2 exits downward to basin at y=3 (below terminal, walled).
    // Pump at y=4 makes y=2 exit-only → y=7 is entrance.
    //
    //  y=1: SSSSSSSS
    //  y=2: SSS P SS  (pipe terminal)
    //  y=3: SSS[ba]S  (basin x=4..5, pipe at x=3 doesn't extend here)
    //  y=4: SSS PUMP  (pump)
    //  ...
    //  y=7: S[pool]S  (pool, pipe terminal at x=3)
    //
    // But the pipe terminal at y=2 has airDirs = Down (to y=3). The pipe
    // trace exits at the adjacent air tile: (3,3)? No, (3,3) doesn't exist
    // in this layout since pipe stops at y=2.
    //
    // Simpler: use a horizontal pipe branch for exit.
    //  y=2: SS PP[ba]  (pipe at x=3,4; terminal at x=4; basin at x=5..6)
    //  y=3: SSS P SS   (pipe x=3)
    //  y=4: SSS PUMP
    //  y=5: SSS P SS
    //  y=6: SSS P SS
    //  y=7: S[pool]S   (pool x=1..3, pipe terminal at x=3)
    const { blocks, pipes } = emptyGrid(9, 9);

    // Bottom pool (source)
    carveRect(blocks, 1, 7, 3, 7);

    // Vertical pipe y=2..7
    for (let y = 2; y <= 7; y++) { setAir(blocks, 3, y); setPipe(pipes, 3, y); }

    // Horizontal pipe branch at y=2
    setAir(blocks, 4, 2); setPipe(pipes, 4, 2);

    // Basin for top exit (x=5..6, y=2 — contained)
    setAir(blocks, 5, 2);
    setAir(blocks, 6, 2);

    // Pump at y=4
    const pumps: PumpCell[] = [{ x: 3, y: 4, direction: 'up' }];

    const sys = createSystem(blocks, pipes, [
      { y: 7, left: 1, right: 3, volume: 20 },
    ], pumps);

    runTicks(sys, 10);

    const topVol = volumeInRegion(sys, 5, 2, 6, 2);
    const bottomVol = volumeInRegion(sys, 1, 7, 3, 7);

    expect(topVol).toBeGreaterThan(0);
    expect(bottomVol).toBeLessThan(20);
  });

  it('all exit-only terminals means no pipe flow', () => {
    // Pool at y=2, pipe enters from side. Pool has solid floor.
    // Pump makes the only terminal exit-only → no entrance → no pipe flow.
    //
    //  y=2: S[pool]P S  (pool x=1..2, pipe terminal at x=3)
    //  y=3: SSSS P SS   (pipe)
    //  y=4: SSSS PUMP   (pump at bottom)
    const { blocks, pipes } = emptyGrid(7, 6);
    carveRect(blocks, 1, 2, 2, 2);

    // Pipe terminal at x=3,y=2 (air, submerged in pool)
    setAir(blocks, 3, 2); setPipe(pipes, 3, 2);
    // Pipe through stone below (no setAir — prevents floor breach)
    setPipe(pipes, 3, 3);
    setPipe(pipes, 3, 4);

    // Pump at y=4 — terminal at x=3,y=2 is above pump → exit-only
    const pumps: PumpCell[] = [{ x: 3, y: 4, direction: 'up' }];
    const initialVol = 20;
    const sys = createSystem(blocks, pipes, [
      { y: 2, left: 1, right: 2, volume: initialVol },
    ], pumps);

    runTicks(sys, 5);

    // Pool should retain volume (no pipe flow possible)
    const topVol = volumeInRegion(sys, 1, 2, 2, 2);
    expect(topVol).toBe(initialVol);
  });

  it('pump enables both upward and downward delivery via round-robin', () => {
    // Pool at y=5 with pipe terminal submerged.
    // Vertical pipe through stone, terminals at top and bottom in air.
    // Pump tags top terminal as exit-only. Pool entrance → both exits.
    //
    //  y=2: SSS pP[ba]S  (pipe in stone at x=3, terminal x=4 air, basin x=5..6)
    //  y=3: SSS p SSSS   (pipe in stone x=3)
    //  y=4: SSS PUMP SS  (pump in stone x=3)
    //  y=5: S[pool]P SS  (pool x=1..3, terminal x=4 air+pipe)
    //  y=6: SSS p SSSS   (pipe in stone x=3)
    //  y=7: SSS p SSSS   (pipe in stone x=3)
    //  y=8: SSS pP[ba]S  (pipe in stone x=3, terminal x=4 air, basin x=5..6)
    const { blocks, pipes } = emptyGrid(9, 10);

    // Middle pool (x=1..3 at y=5)
    carveRect(blocks, 1, 5, 3, 5);

    // Vertical pipe through stone y=2..8 at x=3
    for (let y = 2; y <= 8; y++) { setPipe(pipes, 3, y); }
    // x=3,y=5 is already air from carveRect — that's fine, it has 2 pipe neighbors (up+down)

    // Pipe terminal in pool at x=4,y=5 (air + pipe, 1 pipe neighbor: x=3)
    setAir(blocks, 4, 5); setPipe(pipes, 4, 5);

    // Top horizontal branch: terminal at x=4,y=2
    setAir(blocks, 4, 2); setPipe(pipes, 4, 2);
    setAir(blocks, 5, 2); setAir(blocks, 6, 2); // basin

    // Bottom horizontal branch: terminal at x=4,y=8
    setAir(blocks, 4, 8); setPipe(pipes, 4, 8);
    setAir(blocks, 5, 8); setAir(blocks, 6, 8); // basin

    // Pump at y=4 — terminals above (x=4,y=2) become exit-only
    const pumps: PumpCell[] = [{ x: 3, y: 4, direction: 'up' }];

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 1, right: 4, volume: 40 },
    ], pumps);

    runTicks(sys, 14);

    const topVol = volumeInRegion(sys, 5, 2, 6, 2);
    const bottomVol = volumeInRegion(sys, 5, 8, 6, 8);

    expect(topVol).toBeGreaterThan(0);
    expect(bottomVol).toBeGreaterThan(0);
  });
});
