import { describe, it, expect } from 'vitest';
import {
  emptyGrid, carveRect, setAir, createSystem, runTicks,
  totalVolume, setPipe, VOLUME_PER_TILE,
} from './gasPathHelpers';

/**
 * Gas path system tests — verifies exit detection, path computation,
 * teleport, and volume conservation.
 * Mirror of waterPath.test.ts with inverted gravity (gas rises).
 */

describe('exit detection + path tracing (gas)', () => {
  it('detects side breach and traces path to destination', () => {
    // Gas pool on ceiling at y=4, side breach to the right,
    // gas rises up shaft to ceiling pocket at y=2.
    const { blocks, pipes } = emptyGrid(12, 10);
    carveRect(blocks, 3, 4, 6, 4); // gas pool row
    setAir(blocks, 7, 4);          // side breach
    setAir(blocks, 7, 3);          // rising shaft
    carveRect(blocks, 6, 2, 8, 2); // destination ceiling pocket

    const sys = createSystem(blocks, pipes, [
      { y: 4, left: 3, right: 6, volume: 20 },
    ]);

    runTicks(sys, 1);
    expect(sys.state.paths.length).toBeGreaterThan(0);
  });

  it('detects ceiling breach', () => {
    // Gas pool at y=5, air above at y=4 (ceiling breach), rises to y=2.
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 5, 7, 5); // gas pool row
    setAir(blocks, 5, 4);          // ceiling breach
    setAir(blocks, 5, 3);          // rising shaft
    carveRect(blocks, 3, 2, 7, 2); // destination ceiling pocket

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 3, right: 7, volume: 20 },
    ]);

    runTicks(sys, 1);
    expect(sys.state.paths.length).toBeGreaterThan(0);
  });

  it('no exits when pool is fully contained', () => {
    // Gas pool with solid ceiling, solid walls — no breaches.
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 5, 5, 5); // ceiling pocket (y=4 solid above)

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 3, right: 5, volume: 10 },
    ]);

    runTicks(sys, 1);
    expect(sys.state.paths.length).toBe(0);
  });
});

describe('teleport: basic flow (gas)', () => {
  it('gas teleports from source to destination after two ticks', () => {
    const { blocks, pipes } = emptyGrid(12, 10);
    carveRect(blocks, 3, 5, 5, 5); // source pool
    setAir(blocks, 6, 5);          // side breach
    setAir(blocks, 6, 4);          // rising shaft
    carveRect(blocks, 5, 2, 8, 2); // destination ceiling pocket

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 3, right: 5, volume: 30 },
    ]);

    runTicks(sys, 1);
    const srcAfter1 = sys.state.gasLayers.find(l => l.y === 5)!;
    expect(srcAfter1.volume).toBe(30);

    runTicks(sys, 1);
    const srcAfter2 = sys.state.gasLayers.find(l => l.y === 5);
    const srcVol = srcAfter2 ? srcAfter2.volume : 0;
    expect(srcVol).toBeLessThan(30);
  });

  it('teleports at VOLUME_PER_TILE rate for terrain exits', () => {
    const { blocks, pipes } = emptyGrid(12, 10);
    carveRect(blocks, 3, 5, 5, 5);
    setAir(blocks, 6, 5);
    setAir(blocks, 6, 4);
    carveRect(blocks, 5, 2, 8, 2);

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 3, right: 5, volume: 30 },
    ]);

    runTicks(sys, 2);
    const srcVol = sys.state.gasLayers.find(l => l.y === 5)?.volume ?? 0;
    expect(srcVol).toBe(30 - VOLUME_PER_TILE);
  });
});

describe('teleport: pipe exit (gas)', () => {
  it('pipe terminal adjacent to pool creates pipe path', () => {
    // Gas pool at y=5, pipe from inside pool up to air exit at y=2.
    // Gas rises naturally through pipes (no pump needed for upward).
    const { blocks, pipes } = emptyGrid(10, 12);
    carveRect(blocks, 3, 5, 5, 5); // pool
    setPipe(pipes, 4, 5);          // entrance terminal in pool (air)
    setPipe(pipes, 4, 4);          // pipe in stone
    setPipe(pipes, 4, 3);          // pipe in stone
    setAir(blocks, 4, 2);          // exit tile (air)
    setPipe(pipes, 4, 2);          // exit terminal in air
    carveRect(blocks, 3, 1, 5, 1); // ceiling pocket destination

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 3, right: 5, volume: 30 },
    ]);

    runTicks(sys, 2);
    // Pipe exit rate is 1/tick
    const srcVol = sys.state.gasLayers.find(l => l.y === 5)?.volume ?? 0;
    expect(srcVol).toBe(29);
  });
});

describe('volume conservation (gas)', () => {
  it('total volume unchanged through side breach flow', () => {
    const { blocks, pipes } = emptyGrid(12, 10);
    carveRect(blocks, 3, 5, 5, 5);
    setAir(blocks, 6, 5);
    setAir(blocks, 6, 4);
    carveRect(blocks, 5, 2, 8, 2);

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 3, right: 5, volume: 30 },
    ]);
    const before = totalVolume(sys);

    runTicks(sys, 10);
    expect(totalVolume(sys)).toBe(before);
  });

  it('total volume unchanged through ceiling breach flow', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 5, 7, 5);
    setAir(blocks, 5, 4);
    setAir(blocks, 5, 3);
    carveRect(blocks, 3, 2, 7, 2);

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 3, right: 7, volume: 40 },
    ]);
    const before = totalVolume(sys);

    runTicks(sys, 20);
    expect(totalVolume(sys)).toBe(before);
  });

  it('total volume unchanged with overflow cascade', () => {
    // Gas fills ceiling pockets top-down. Multiple layers stacked.
    const { blocks, pipes } = emptyGrid(15, 15);
    carveRect(blocks, 5, 9, 7, 11); // tall cavity
    setAir(blocks, 8, 11);          // side breach at bottom
    carveRect(blocks, 8, 5, 12, 10); // large destination

    const sys = createSystem(blocks, pipes, [
      { y: 9, left: 5, right: 7, volume: 30 },
      { y: 10, left: 5, right: 7, volume: 30 },
      { y: 11, left: 5, right: 7, volume: 30 },
    ]);
    const before = totalVolume(sys);

    runTicks(sys, 50);
    expect(totalVolume(sys)).toBe(before);
  });
});

describe('pool filling via fillAt (gas)', () => {
  it('fills contained layer to capacity', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 5, 5, 5); // 3-wide ceiling pocket

    const sys = createSystem(blocks, pipes);
    sys.fillAt(4, 5);

    const layer = sys.state.gasLayers.find(l => l.y === 5);
    expect(layer).toBeDefined();
    expect(layer!.volume).toBe(3 * VOLUME_PER_TILE);
  });

  it('does nothing for uncontained space', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 5, 9, 5); // touches right world edge

    const sys = createSystem(blocks, pipes);
    sys.fillAt(5, 5);

    expect(sys.state.gasLayers.length).toBe(0);
  });
});
