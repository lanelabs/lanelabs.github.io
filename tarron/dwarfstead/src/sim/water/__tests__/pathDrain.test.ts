import { describe, it, expect } from 'vitest';
import {
  emptyGrid, carveRect, setAir, createSystem, runTicks,
  totalVolume, volumeInRegion, setPipe, VOLUME_PER_TILE,
} from './pathHelpers';

/**
 * Drain and breach tests for the path system.
 * Verifies pipe terminal detection, breach types, and teleport rates.
 */

describe('pipe terminal exit detection', () => {
  it('detects pipe terminal adjacent to pool as exit', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 4, 5, 4); // pool
    setPipe(pipes, 4, 4);          // entrance terminal in pool (air)
    setPipe(pipes, 4, 5);          // pipe in stone
    setPipe(pipes, 4, 6);          // pipe in stone
    setAir(blocks, 4, 7);          // exit tile (air)
    setPipe(pipes, 4, 7);          // exit terminal in air
    setAir(blocks, 4, 8);          // air below exit for path

    const sys = createSystem(blocks, pipes, [
      { y: 4, left: 3, right: 5, volume: 20 },
    ]);

    runTicks(sys, 1);
    expect(sys.state.paths.length).toBeGreaterThan(0);
    const pipeExits = sys.state.paths.filter(p => p.exitType === 'pipe');
    expect(pipeExits.length).toBeGreaterThan(0);
  });

  it('drains at pipe rate (1/tick) not terrain rate', () => {
    const { blocks, pipes } = emptyGrid(10, 12);
    carveRect(blocks, 3, 4, 5, 4); // pool
    setPipe(pipes, 4, 4);          // entrance terminal in pool (air)
    setPipe(pipes, 4, 5);          // pipe in stone
    setPipe(pipes, 4, 6);          // pipe in stone
    setAir(blocks, 4, 7);          // exit tile (air)
    setPipe(pipes, 4, 7);          // exit terminal in air
    carveRect(blocks, 3, 8, 5, 8); // catch basin

    const sys = createSystem(blocks, pipes, [
      { y: 4, left: 3, right: 5, volume: 30 },
    ]);

    runTicks(sys, 2);
    const srcVol = sys.state.waterLayers.find(l => l.y === 4)?.volume ?? 0;
    expect(srcVol).toBe(29);
  });

  it('volume conserved through pipe drain cycle', () => {
    const { blocks, pipes } = emptyGrid(10, 12);
    carveRect(blocks, 3, 4, 5, 4);
    setPipe(pipes, 4, 4);          // entrance terminal in pool (air)
    setPipe(pipes, 4, 5);
    setPipe(pipes, 4, 6);
    setAir(blocks, 4, 7);
    setPipe(pipes, 4, 7);          // exit terminal in air
    carveRect(blocks, 3, 8, 5, 8);

    const sys = createSystem(blocks, pipes, [
      { y: 4, left: 3, right: 5, volume: 30 },
    ]);
    const before = totalVolume(sys);

    runTicks(sys, 20);
    expect(totalVolume(sys)).toBe(before);
  });

  it('drains from 1-wide pool where pipe is the only tile', () => {
    // Single air tile = pipe terminal. Pool fills just that tile.
    //  y=3: SSS S SSS
    //  y=4: SSS A SSS  ← 1-wide pool at (3,4), pipe terminal
    //  y=5: SSS p SSS  ← pipe in stone
    //  y=6: SSS P SSS  ← exit terminal in air
    //  y=7: SS AAA SS  ← catch basin
    const { blocks, pipes } = emptyGrid(7, 9);
    setAir(blocks, 3, 4); setPipe(pipes, 3, 4); // terminal in 1-wide pool
    setPipe(pipes, 3, 5);                        // pipe in stone
    setAir(blocks, 3, 6); setPipe(pipes, 3, 6); // exit terminal in air
    carveRect(blocks, 2, 7, 4, 7);              // catch basin

    const sys = createSystem(blocks, pipes, [
      { y: 4, left: 3, right: 3, volume: 10 },
    ]);
    const before = totalVolume(sys);

    runTicks(sys, 12);

    const basinVol = volumeInRegion(sys, 2, 7, 4, 7);
    expect(basinVol).toBeGreaterThan(0);
    expect(totalVolume(sys)).toBe(before);
  });
});

describe('pipe exit fills contained layer around exit', () => {
  it('fills the contained area at the pipe exit level', () => {
    //   0123456789AB
    // 2:SAAAAAAAASS  ← source pool x=1..8
    // 3:SSSSSPSSSS   ← pipe at x=5
    // 4:SSSSSPSSSS
    // 5:SAAAAAAAAAS  ← exit terminal at (5,5), contained area x=1..9
    // 6:SSSSSSSSSSS  ← stone floor
    const { blocks, pipes } = emptyGrid(11, 10);
    carveRect(blocks, 1, 2, 8, 2);   // source pool (8 wide)
    setPipe(pipes, 5, 2);            // entrance in pool
    setPipe(pipes, 5, 3);
    setPipe(pipes, 5, 4);
    setAir(blocks, 5, 5);            // exit terminal tile
    setPipe(pipes, 5, 5);
    carveRect(blocks, 1, 5, 9, 5);   // contained area around exit (9 wide)
    // y=6 stays stone — solid floor

    const sys = createSystem(blocks, pipes, [
      { y: 2, left: 1, right: 8, volume: 80 },
    ]);
    const before = totalVolume(sys);

    runTicks(sys, 80);

    // Exit layer should have received water
    const exitLayerVol = volumeInRegion(sys, 1, 5, 9, 5);
    expect(exitLayerVol).toBeGreaterThan(0);

    // Volume conserved
    expect(totalVolume(sys)).toBe(before);
  });
});

describe('pipe exit paths sideways to find pools', () => {
  it('exits both sides when ground is below pipe exit', () => {
    //   01234567890
    // 2:SAAAAAPSSSS  ← source pool x=1..5, pipe entrance at (5,2)
    // 3:SSSSSPSSSS   ← pipe
    // 4:SSSSSPSSSS   ← pipe
    // 5:SSSAAPASSSS  ← exit (5,5), air at (3,5) and (4,5) and (6,5) and (7,5)
    // 6:SSSASSSSASS  ← drops at (3,6) and (7,6)
    // 7:SSAASSSSAAS  ← basins at x=2..3 and x=7..8
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 1, 2, 5, 2);
    setPipe(pipes, 5, 2);
    setPipe(pipes, 5, 3);
    setPipe(pipes, 5, 4);
    setAir(blocks, 5, 5);
    setPipe(pipes, 5, 5);
    // Air on both sides of exit
    setAir(blocks, 3, 5);
    setAir(blocks, 4, 5);
    setAir(blocks, 6, 5);
    setAir(blocks, 7, 5);
    // (5,6) stays stone — can't go down
    // Drops from outer edges
    setAir(blocks, 3, 6);
    setAir(blocks, 7, 6);
    // Catch basins
    carveRect(blocks, 2, 7, 3, 7);
    carveRect(blocks, 7, 7, 8, 7);

    const sys = createSystem(blocks, pipes, [
      { y: 2, left: 1, right: 5, volume: 50 },
    ]);
    const before = totalVolume(sys);

    runTicks(sys, 60);

    // Both basins should have received water
    const leftBasin = volumeInRegion(sys, 2, 7, 3, 7);
    const rightBasin = volumeInRegion(sys, 7, 7, 8, 7);
    expect(leftBasin).toBeGreaterThan(0);
    expect(rightBasin).toBeGreaterThan(0);

    // Volume conserved
    expect(totalVolume(sys)).toBe(before);
  });

  it('exits sides when water fills below pipe exit', () => {
    //   01234567890
    // 2:SAAAAAPSSSS  ← source pool
    // 3:SSSSSPSSSS   ← pipe
    // 4:SSSSSPSSSS   ← pipe
    // 5:SSSAAPASSSS  ← exit (5,5), air at (3..4,5) and (6..7,5)
    // 6:SSSASSSSASS  ← drops at (3,6) and (7,6); air at (5,6) with full water
    // 7:SSAASSSSAAS  ← basins at x=2..3 and x=7..8
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 1, 2, 5, 2);
    setPipe(pipes, 5, 2);
    setPipe(pipes, 5, 3);
    setPipe(pipes, 5, 4);
    setAir(blocks, 5, 5);
    setPipe(pipes, 5, 5);
    setAir(blocks, 3, 5);
    setAir(blocks, 4, 5);
    setAir(blocks, 6, 5);
    setAir(blocks, 7, 5);
    // Air below exit — but will be full water
    setAir(blocks, 5, 6);
    // Drops from outer edges
    setAir(blocks, 3, 6);
    setAir(blocks, 7, 6);
    // Catch basins
    carveRect(blocks, 2, 7, 3, 7);
    carveRect(blocks, 7, 7, 8, 7);

    const sys = createSystem(blocks, pipes, [
      { y: 2, left: 1, right: 5, volume: 50 },
      // Full water below exit (1 wide, cap=10)
      { y: 6, left: 5, right: 5, volume: VOLUME_PER_TILE },
    ]);
    const before = totalVolume(sys);

    runTicks(sys, 60);

    // Side basins should have water (pipe exit went sideways)
    const leftBasin = volumeInRegion(sys, 2, 7, 3, 7);
    const rightBasin = volumeInRegion(sys, 7, 7, 8, 7);
    expect(leftBasin + rightBasin).toBeGreaterThan(0);

    // Volume conserved
    expect(totalVolume(sys)).toBe(before);
  });
});

describe('terrain breach: side', () => {
  it('water drains through missing side wall', () => {
    const { blocks, pipes } = emptyGrid(12, 10);
    carveRect(blocks, 3, 5, 6, 5);
    setAir(blocks, 7, 5);
    setAir(blocks, 7, 6);
    setAir(blocks, 7, 7);

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 3, right: 6, volume: 30 },
    ]);

    runTicks(sys, 5);
    const srcVol = sys.state.waterLayers.find(l => l.y === 5)?.volume ?? 0;
    expect(srcVol).toBeLessThan(30);
  });
});

describe('terrain breach: bottom', () => {
  it('water drains through missing floor', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 4, 7, 4);
    setAir(blocks, 5, 5);
    setAir(blocks, 5, 6);
    carveRect(blocks, 3, 7, 7, 7);

    const sys = createSystem(blocks, pipes, [
      { y: 4, left: 3, right: 7, volume: 40 },
    ]);

    runTicks(sys, 5);
    const srcVol = sys.state.waterLayers.find(l => l.y === 4)?.volume ?? 0;
    expect(srcVol).toBeLessThan(40);
  });

  it('breach drains at VOLUME_PER_TILE rate per tick', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 4, 7, 4);
    setAir(blocks, 5, 5);
    setAir(blocks, 5, 6);
    carveRect(blocks, 3, 7, 7, 7);

    const sys = createSystem(blocks, pipes, [
      { y: 4, left: 3, right: 7, volume: 50 },
    ]);

    runTicks(sys, 2);
    const srcVol = sys.state.waterLayers.find(l => l.y === 4)?.volume ?? 0;
    const drained = 50 - srcVol;
    expect(drained).toBe(VOLUME_PER_TILE);
  });

  it('stops draining when pool empties', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 4, 4, 6, 4);
    setAir(blocks, 5, 5);
    setAir(blocks, 5, 6);
    carveRect(blocks, 3, 7, 7, 7);

    const sys = createSystem(blocks, pipes, [
      { y: 4, left: 4, right: 6, volume: 5 },
    ]);

    runTicks(sys, 20);
    const srcVol = sys.state.waterLayers.find(l => l.y === 4)?.volume ?? 0;
    expect(srcVol).toBe(0);
  });
});

describe('destination fills before source empties', () => {
  it('conserves volume when terrain destination fills up', () => {
    // Large source (5 wide) drains into small dest (1 wide)
    // Source: 50 volume, dest capacity: 10. Dest fills fast.
    const { blocks, pipes } = emptyGrid(12, 10);
    carveRect(blocks, 2, 3, 6, 3);  // source pool (5 wide, cap=50)
    setAir(blocks, 7, 3);           // side breach
    setAir(blocks, 7, 4);           // vertical shaft
    setAir(blocks, 7, 5);           // vertical shaft
    carveRect(blocks, 7, 6, 7, 6);  // dest pool (1 wide, cap=10)

    const sys = createSystem(blocks, pipes, [
      { y: 3, left: 2, right: 6, volume: 50 },
    ]);
    const before = totalVolume(sys);

    // Run many ticks — dest will fill up, water must not vanish
    runTicks(sys, 40);
    expect(totalVolume(sys)).toBe(before);
  });

  it('conserves volume when pipe destination fills up', () => {
    // Source pool with pipe into a small basin
    const { blocks, pipes } = emptyGrid(12, 14);
    carveRect(blocks, 2, 3, 6, 3);  // source pool (5 wide, cap=50)
    setPipe(pipes, 4, 3);           // entrance terminal in pool
    setPipe(pipes, 4, 4);           // pipe in stone
    setPipe(pipes, 4, 5);           // pipe in stone
    setAir(blocks, 4, 6);           // exit tile (air)
    setPipe(pipes, 4, 6);           // exit terminal in air
    carveRect(blocks, 4, 7, 4, 7);  // small dest (1 wide, cap=10)

    const sys = createSystem(blocks, pipes, [
      { y: 3, left: 2, right: 6, volume: 50 },
    ]);
    const before = totalVolume(sys);

    // Run many ticks — dest fills, pipe should stop losing water
    runTicks(sys, 60);
    expect(totalVolume(sys)).toBe(before);
  });
});

describe('multi-layer pool drainage', () => {
  it('drains from topmost layer', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 3, 5, 5);
    setAir(blocks, 6, 5);
    setAir(blocks, 6, 6);
    setAir(blocks, 6, 7);

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 3, right: 5, volume: 30 },
      { y: 4, left: 3, right: 5, volume: 30 },
      { y: 3, left: 3, right: 5, volume: 30 },
    ]);

    runTicks(sys, 2);
    const topVol = sys.state.waterLayers.find(l => l.y === 3)?.volume ?? 0;
    const midVol = sys.state.waterLayers.find(l => l.y === 4)?.volume ?? 0;
    const botVol = sys.state.waterLayers.find(l => l.y === 5)?.volume ?? 0;
    expect(topVol + midVol + botVol).toBeLessThan(90);
  });

  it('conserves volume through multi-layer drain', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 3, 5, 5);
    setAir(blocks, 6, 5);
    setAir(blocks, 6, 6);
    carveRect(blocks, 5, 7, 8, 7);

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 3, right: 5, volume: 30 },
      { y: 4, left: 3, right: 5, volume: 30 },
      { y: 3, left: 3, right: 5, volume: 30 },
    ]);
    const before = totalVolume(sys);

    runTicks(sys, 30);
    expect(totalVolume(sys)).toBe(before);
  });
});
