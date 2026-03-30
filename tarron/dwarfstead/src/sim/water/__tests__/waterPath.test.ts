import { describe, it, expect } from 'vitest';
import {
  emptyGrid, carveRect, setAir, createSystem, runTicks,
  totalVolume, setPipe, VOLUME_PER_TILE,
} from './pathHelpers';

/**
 * Path system tests — verifies exit detection, path computation,
 * teleport, and volume conservation.
 */

describe('exit detection + path tracing', () => {
  it('detects side breach and traces path to destination', () => {
    const { blocks, pipes } = emptyGrid(12, 10);
    carveRect(blocks, 3, 5, 6, 5);
    setAir(blocks, 7, 5);
    setAir(blocks, 7, 6);
    carveRect(blocks, 6, 7, 8, 7);

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 3, right: 6, volume: 20 },
    ]);

    runTicks(sys, 1);
    expect(sys.state.paths.length).toBeGreaterThan(0);
  });

  it('detects floor breach', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 4, 7, 4);
    setAir(blocks, 5, 5);
    setAir(blocks, 5, 6);
    carveRect(blocks, 3, 7, 7, 7);

    const sys = createSystem(blocks, pipes, [
      { y: 4, left: 3, right: 7, volume: 20 },
    ]);

    runTicks(sys, 1);
    expect(sys.state.paths.length).toBeGreaterThan(0);
  });

  it('no exits when pool is fully contained', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 5, 5, 5);

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 3, right: 5, volume: 10 },
    ]);

    runTicks(sys, 1);
    expect(sys.state.paths.length).toBe(0);
  });
});

describe('teleport: basic flow', () => {
  it('water teleports from source to destination after two ticks', () => {
    const { blocks, pipes } = emptyGrid(12, 10);
    carveRect(blocks, 3, 5, 5, 5);
    setAir(blocks, 6, 5);
    setAir(blocks, 6, 6);
    carveRect(blocks, 5, 7, 8, 7);

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 3, right: 5, volume: 30 },
    ]);

    runTicks(sys, 1);
    const srcAfter1 = sys.state.waterLayers.find(l => l.y === 5)!;
    expect(srcAfter1.volume).toBe(30);

    runTicks(sys, 1);
    const srcAfter2 = sys.state.waterLayers.find(l => l.y === 5);
    const srcVol = srcAfter2 ? srcAfter2.volume : 0;
    expect(srcVol).toBeLessThan(30);
  });

  it('teleports at VOLUME_PER_TILE rate for terrain exits', () => {
    const { blocks, pipes } = emptyGrid(12, 10);
    carveRect(blocks, 3, 5, 5, 5);
    setAir(blocks, 6, 5);
    setAir(blocks, 6, 6);
    carveRect(blocks, 5, 7, 8, 7);

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 3, right: 5, volume: 30 },
    ]);

    runTicks(sys, 2);
    const srcVol = sys.state.waterLayers.find(l => l.y === 5)?.volume ?? 0;
    expect(srcVol).toBe(30 - VOLUME_PER_TILE);
  });
});

describe('teleport: pipe exit', () => {
  it('pipe terminal adjacent to pool creates pipe path', () => {
    // Pool at y=4, pipe from inside pool down to air exit at y=7
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
    // Pipe exit rate is 1/tick
    const srcVol = sys.state.waterLayers.find(l => l.y === 4)?.volume ?? 0;
    expect(srcVol).toBe(29);
  });
});

describe('volume conservation', () => {
  it('total volume unchanged through side breach flow', () => {
    const { blocks, pipes } = emptyGrid(12, 10);
    carveRect(blocks, 3, 5, 5, 5);
    setAir(blocks, 6, 5);
    setAir(blocks, 6, 6);
    carveRect(blocks, 5, 7, 8, 7);

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 3, right: 5, volume: 30 },
    ]);
    const before = totalVolume(sys);

    runTicks(sys, 10);
    expect(totalVolume(sys)).toBe(before);
  });

  it('total volume unchanged through floor breach flow', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 4, 7, 4);
    setAir(blocks, 5, 5);
    setAir(blocks, 5, 6);
    carveRect(blocks, 3, 7, 7, 7);

    const sys = createSystem(blocks, pipes, [
      { y: 4, left: 3, right: 7, volume: 40 },
    ]);
    const before = totalVolume(sys);

    runTicks(sys, 20);
    expect(totalVolume(sys)).toBe(before);
  });

  it('total volume unchanged with overflow cascade', () => {
    const { blocks, pipes } = emptyGrid(15, 15);
    carveRect(blocks, 5, 3, 7, 5);
    setAir(blocks, 8, 3);
    carveRect(blocks, 8, 4, 12, 8);

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 5, right: 7, volume: 30 },
      { y: 4, left: 5, right: 7, volume: 30 },
      { y: 3, left: 5, right: 7, volume: 30 },
    ]);
    const before = totalVolume(sys);

    runTicks(sys, 50);
    expect(totalVolume(sys)).toBe(before);
  });
});

describe('pool filling via fillAt', () => {
  it('fills contained layer to capacity', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 5, 5, 5);

    const sys = createSystem(blocks, pipes);
    sys.fillAt(4, 5);

    const layer = sys.state.waterLayers.find(l => l.y === 5);
    expect(layer).toBeDefined();
    expect(layer!.volume).toBe(3 * VOLUME_PER_TILE);
  });

  it('does nothing for uncontained space', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 5, 9, 5);

    const sys = createSystem(blocks, pipes);
    sys.fillAt(5, 5);

    expect(sys.state.waterLayers.length).toBe(0);
  });
});
