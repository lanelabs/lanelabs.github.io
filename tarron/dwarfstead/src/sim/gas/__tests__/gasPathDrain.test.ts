import { describe, it, expect } from 'vitest';
import {
  emptyGrid, carveRect, setAir, createSystem, runTicks,
  totalVolume, volumeInRegion, setPipe, VOLUME_PER_TILE,
} from './gasPathHelpers';

/**
 * Gas drain and breach tests for the path system.
 * Mirror of pathDrain.test.ts with inverted gravity.
 * Gas rises through ceiling breaches and pipes going upward.
 */

describe('gas pipe terminal exit detection', () => {
  it('detects pipe terminal adjacent to pool as exit', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 5, 5, 5); // gas pool
    setPipe(pipes, 4, 5);          // entrance terminal in pool (air)
    setPipe(pipes, 4, 4);          // pipe in stone
    setPipe(pipes, 4, 3);          // pipe in stone
    setAir(blocks, 4, 2);          // exit tile (air)
    setPipe(pipes, 4, 2);          // exit terminal in air
    setAir(blocks, 4, 1);          // air above exit for path

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 3, right: 5, volume: 20 },
    ]);

    runTicks(sys, 1);
    expect(sys.state.paths.length).toBeGreaterThan(0);
    const pipeExits = sys.state.paths.filter(p => p.exitType === 'pipe');
    expect(pipeExits.length).toBeGreaterThan(0);
  });

  it('drains at pipe rate (1/tick) not terrain rate', () => {
    const { blocks, pipes } = emptyGrid(10, 12);
    carveRect(blocks, 3, 7, 5, 7); // gas pool
    setPipe(pipes, 4, 7);          // entrance terminal in pool
    setPipe(pipes, 4, 6);          // pipe in stone
    setPipe(pipes, 4, 5);          // pipe in stone
    setAir(blocks, 4, 4);          // exit tile (air)
    setPipe(pipes, 4, 4);          // exit terminal in air
    carveRect(blocks, 3, 1, 5, 1); // ceiling pocket destination

    const sys = createSystem(blocks, pipes, [
      { y: 7, left: 3, right: 5, volume: 30 },
    ]);

    runTicks(sys, 2);
    const srcVol = sys.state.gasLayers.find(l => l.y === 7)?.volume ?? 0;
    expect(srcVol).toBe(29);
  });

  it('volume conserved through pipe drain cycle', () => {
    const { blocks, pipes } = emptyGrid(10, 12);
    carveRect(blocks, 3, 7, 5, 7);
    setPipe(pipes, 4, 7);
    setPipe(pipes, 4, 6);
    setPipe(pipes, 4, 5);
    setAir(blocks, 4, 4);
    setPipe(pipes, 4, 4);
    carveRect(blocks, 3, 1, 5, 1);

    const sys = createSystem(blocks, pipes, [
      { y: 7, left: 3, right: 5, volume: 30 },
    ]);
    const before = totalVolume(sys);

    runTicks(sys, 20);
    expect(totalVolume(sys)).toBe(before);
  });

  it('drains from 1-wide pool where pipe is the only tile', () => {
    const { blocks, pipes } = emptyGrid(7, 9);
    setAir(blocks, 3, 5); setPipe(pipes, 3, 5); // terminal in 1-wide pool
    setPipe(pipes, 3, 4);                        // pipe in stone
    setAir(blocks, 3, 3); setPipe(pipes, 3, 3); // exit terminal in air
    carveRect(blocks, 2, 2, 4, 2);              // ceiling pocket adjacent to exit

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 3, right: 3, volume: 10 },
    ]);
    const before = totalVolume(sys);

    runTicks(sys, 12);

    const pocketVol = volumeInRegion(sys, 2, 2, 4, 2);
    expect(pocketVol).toBeGreaterThan(0);
    expect(totalVolume(sys)).toBe(before);
  });
});

describe('gas pipe exit fills contained layer around exit', () => {
  it('fills the contained area at the pipe exit level', () => {
    const { blocks, pipes } = emptyGrid(11, 10);
    carveRect(blocks, 1, 7, 8, 7);   // source pool (8 wide)
    setPipe(pipes, 5, 7);            // entrance in pool
    setPipe(pipes, 5, 6);
    setPipe(pipes, 5, 5);
    setAir(blocks, 5, 4);            // exit terminal tile
    setPipe(pipes, 5, 4);
    carveRect(blocks, 1, 4, 9, 4);   // contained area around exit (9 wide)
    // y=3 stays stone — solid ceiling

    const sys = createSystem(blocks, pipes, [
      { y: 7, left: 1, right: 8, volume: 80 },
    ]);
    const before = totalVolume(sys);

    runTicks(sys, 80);

    const exitLayerVol = volumeInRegion(sys, 1, 4, 9, 4);
    expect(exitLayerVol).toBeGreaterThan(0);
    expect(totalVolume(sys)).toBe(before);
  });
});

describe('gas pipe exit paths sideways to find ceiling pockets', () => {
  it('exits both sides when ceiling is above pipe exit', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 1, 7, 5, 7); // source pool
    setPipe(pipes, 5, 7);
    setPipe(pipes, 5, 6);
    setPipe(pipes, 5, 5);
    setAir(blocks, 5, 4);
    setPipe(pipes, 5, 4);
    // Air on both sides of exit
    setAir(blocks, 3, 4);
    setAir(blocks, 4, 4);
    setAir(blocks, 6, 4);
    setAir(blocks, 7, 4);
    // Rises from outer edges
    setAir(blocks, 3, 3);
    setAir(blocks, 7, 3);
    // Ceiling pockets
    carveRect(blocks, 2, 2, 3, 2);
    carveRect(blocks, 7, 2, 8, 2);

    const sys = createSystem(blocks, pipes, [
      { y: 7, left: 1, right: 5, volume: 50 },
    ]);
    const before = totalVolume(sys);

    runTicks(sys, 60);

    const leftPocket = volumeInRegion(sys, 2, 2, 3, 2);
    const rightPocket = volumeInRegion(sys, 7, 2, 8, 2);
    expect(leftPocket).toBeGreaterThan(0);
    expect(rightPocket).toBeGreaterThan(0);
    expect(totalVolume(sys)).toBe(before);
  });

  it('exits sides when gas fills above pipe exit', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 1, 7, 5, 7);
    setPipe(pipes, 5, 7);
    setPipe(pipes, 5, 6);
    setPipe(pipes, 5, 5);
    setAir(blocks, 5, 4);
    setPipe(pipes, 5, 4);
    setAir(blocks, 3, 4);
    setAir(blocks, 4, 4);
    setAir(blocks, 6, 4);
    setAir(blocks, 7, 4);
    // Air above exit — but will be full gas
    setAir(blocks, 5, 3);
    // Rises from outer edges
    setAir(blocks, 3, 3);
    setAir(blocks, 7, 3);
    // Ceiling pockets
    carveRect(blocks, 2, 2, 3, 2);
    carveRect(blocks, 7, 2, 8, 2);

    const sys = createSystem(blocks, pipes, [
      { y: 7, left: 1, right: 5, volume: 50 },
      // Full gas above exit (1 wide, cap=10)
      { y: 3, left: 5, right: 5, volume: VOLUME_PER_TILE },
    ]);
    const before = totalVolume(sys);

    runTicks(sys, 60);

    const leftPocket = volumeInRegion(sys, 2, 2, 3, 2);
    const rightPocket = volumeInRegion(sys, 7, 2, 8, 2);
    expect(leftPocket + rightPocket).toBeGreaterThan(0);
    expect(totalVolume(sys)).toBe(before);
  });
});

describe('gas terrain breach: side', () => {
  it('gas drains through missing side wall', () => {
    const { blocks, pipes } = emptyGrid(12, 10);
    carveRect(blocks, 3, 5, 6, 5);
    setAir(blocks, 7, 5);
    setAir(blocks, 7, 4);
    setAir(blocks, 7, 3);

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 3, right: 6, volume: 30 },
    ]);

    runTicks(sys, 5);
    const srcVol = sys.state.gasLayers.find(l => l.y === 5)?.volume ?? 0;
    expect(srcVol).toBeLessThan(30);
  });
});

describe('gas terrain breach: ceiling', () => {
  it('gas drains through missing ceiling', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 5, 7, 5);
    setAir(blocks, 5, 4);          // ceiling breach
    setAir(blocks, 5, 3);          // rising shaft
    carveRect(blocks, 3, 2, 7, 2); // destination

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 3, right: 7, volume: 40 },
    ]);

    runTicks(sys, 5);
    const srcVol = sys.state.gasLayers.find(l => l.y === 5)?.volume ?? 0;
    expect(srcVol).toBeLessThan(40);
  });

  it('breach drains at VOLUME_PER_TILE rate per tick', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 5, 7, 5);
    setAir(blocks, 5, 4);
    setAir(blocks, 5, 3);
    carveRect(blocks, 3, 2, 7, 2);

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 3, right: 7, volume: 50 },
    ]);

    runTicks(sys, 2);
    const srcVol = sys.state.gasLayers.find(l => l.y === 5)?.volume ?? 0;
    const drained = 50 - srcVol;
    expect(drained).toBe(VOLUME_PER_TILE);
  });

  it('stops draining when pool empties', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 4, 5, 6, 5);
    setAir(blocks, 5, 4);
    setAir(blocks, 5, 3);
    carveRect(blocks, 3, 2, 7, 2);

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 4, right: 6, volume: 5 },
    ]);

    runTicks(sys, 20);
    const srcVol = sys.state.gasLayers.find(l => l.y === 5)?.volume ?? 0;
    expect(srcVol).toBe(0);
  });
});

describe('gas destination fills before source empties', () => {
  it('conserves volume when terrain destination fills up', () => {
    const { blocks, pipes } = emptyGrid(12, 10);
    carveRect(blocks, 2, 6, 6, 6);  // source pool (5 wide, cap=50)
    setAir(blocks, 7, 6);           // side breach
    setAir(blocks, 7, 5);           // rising shaft
    setAir(blocks, 7, 4);           // rising shaft
    carveRect(blocks, 7, 3, 7, 3);  // dest pocket (1 wide, cap=10)

    const sys = createSystem(blocks, pipes, [
      { y: 6, left: 2, right: 6, volume: 50 },
    ]);
    const before = totalVolume(sys);

    runTicks(sys, 40);
    expect(totalVolume(sys)).toBe(before);
  });

  it('conserves volume when pipe destination fills up', () => {
    const { blocks, pipes } = emptyGrid(12, 14);
    carveRect(blocks, 2, 10, 6, 10); // source pool (5 wide)
    setPipe(pipes, 4, 10);           // entrance terminal in pool
    setPipe(pipes, 4, 9);            // pipe in stone
    setPipe(pipes, 4, 8);            // pipe in stone
    setAir(blocks, 4, 7);            // exit tile (air)
    setPipe(pipes, 4, 7);            // exit terminal in air
    carveRect(blocks, 4, 6, 4, 6);   // small dest (1 wide, cap=10)

    const sys = createSystem(blocks, pipes, [
      { y: 10, left: 2, right: 6, volume: 50 },
    ]);
    const before = totalVolume(sys);

    runTicks(sys, 60);
    expect(totalVolume(sys)).toBe(before);
  });
});

describe('gas multi-layer pool drainage', () => {
  it('drains from bottommost layer (gas surface is at bottom)', () => {
    // Gas fills top-down: y=5 is top, y=7 is bottom (surface).
    // Breach should drain from the bottom (surface).
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 5, 5, 7); // tall cavity
    setAir(blocks, 6, 5);          // side breach at top
    setAir(blocks, 6, 4);          // rising shaft
    setAir(blocks, 6, 3);          // rising shaft

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 3, right: 5, volume: 30 },
      { y: 6, left: 3, right: 5, volume: 30 },
      { y: 7, left: 3, right: 5, volume: 30 },
    ]);

    runTicks(sys, 2);
    const topVol = sys.state.gasLayers.find(l => l.y === 5)?.volume ?? 0;
    const midVol = sys.state.gasLayers.find(l => l.y === 6)?.volume ?? 0;
    const botVol = sys.state.gasLayers.find(l => l.y === 7)?.volume ?? 0;
    expect(topVol + midVol + botVol).toBeLessThan(90);
  });

  it('conserves volume through multi-layer drain', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 5, 5, 7);
    setAir(blocks, 6, 5);
    setAir(blocks, 6, 4);
    carveRect(blocks, 5, 2, 8, 2);

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 3, right: 5, volume: 30 },
      { y: 6, left: 3, right: 5, volume: 30 },
      { y: 7, left: 3, right: 5, volume: 30 },
    ]);
    const before = totalVolume(sys);

    runTicks(sys, 30);
    expect(totalVolume(sys)).toBe(before);
  });
});
