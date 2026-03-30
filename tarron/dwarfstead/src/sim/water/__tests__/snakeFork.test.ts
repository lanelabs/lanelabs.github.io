import { describe, it, expect } from 'vitest';
import {
  emptyGrid, carveRect, createSystem, runTicks,
  totalVolume, volumeInRegion, SnakeState, Direction,
} from './snakeHelpers';

/**
 * Fork / split behavior tests — verifies volume distribution
 * at fork points per the spec split rules.
 */

/** Helper: create a standard fork terrain.
 *
 *  Layout (12 wide, 12 tall):
 *    - Shaft at x=6, y=1..3
 *    - Ledge at y=4, x=4..8 (5 wide)
 *    - Left drop at x=4, y=5..9 into left pool at y=10
 *    - Right drop at x=8, y=5..9 into right pool at y=10
 *    - Left pool: x=2..4, y=10
 *    - Right pool: x=8..10, y=10
 */
function forkTerrain() {
  const { blocks, pipes } = emptyGrid(12, 12);
  // Shaft
  carveRect(blocks, 6, 1, 6, 3);
  // Ledge
  carveRect(blocks, 4, 4, 8, 4);
  // Left drop shaft
  carveRect(blocks, 4, 5, 4, 9);
  // Right drop shaft
  carveRect(blocks, 8, 5, 8, 9);
  // Left pool
  carveRect(blocks, 2, 10, 4, 10);
  // Right pool
  carveRect(blocks, 8, 10, 10, 10);
  return { blocks, pipes };
}

describe('fork: volume >= 2 splits evenly', () => {
  it('splits 8 quarters into 4/4', () => {
    const { blocks, pipes } = forkTerrain();
    const sys = createSystem(blocks, pipes);
    sys.state.snakes.push({
      id: sys.state.nextSnakeId++,
      x: 6, y: 4, volume: 8,
      state: SnakeState.SCANNING,
      flowDir: null, pipeProgress: 0,
    });

    runTicks(sys, 1);
    expect(sys.state.snakes.length).toBe(2);
    const vols = sys.state.snakes.map(s => s.volume).sort((a, b) => a - b);
    expect(vols).toEqual([4, 4]);
  });

  it('splits 6 quarters into 3/3', () => {
    const { blocks, pipes } = forkTerrain();
    const sys = createSystem(blocks, pipes);
    sys.state.snakes.push({
      id: sys.state.nextSnakeId++,
      x: 6, y: 4, volume: 6,
      state: SnakeState.SCANNING,
      flowDir: null, pipeProgress: 0,
    });

    runTicks(sys, 1);
    const vols = sys.state.snakes.map(s => s.volume).sort((a, b) => a - b);
    expect(vols).toEqual([3, 3]);
  });

  it('both pools receive water after full flow', () => {
    const { blocks, pipes } = forkTerrain();
    const sys = createSystem(blocks, pipes);
    sys.state.snakes.push({
      id: sys.state.nextSnakeId++,
      x: 6, y: 4, volume: 20,
      state: SnakeState.SCANNING,
      flowDir: null, pipeProgress: 0,
    });

    runTicks(sys, 30);
    const leftVol = volumeInRegion(sys, 2, 10, 4, 10);
    const rightVol = volumeInRegion(sys, 8, 10, 10, 10);
    expect(leftVol).toBeGreaterThan(0);
    expect(rightVol).toBeGreaterThan(0);
  });

  it('conserves volume through split', () => {
    const { blocks, pipes } = forkTerrain();
    const sys = createSystem(blocks, pipes);
    sys.state.snakes.push({
      id: sys.state.nextSnakeId++,
      x: 6, y: 4, volume: 20,
      state: SnakeState.SCANNING,
      flowDir: null, pipeProgress: 0,
    });
    const before = totalVolume(sys);

    runTicks(sys, 30);
    expect(totalVolume(sys)).toBe(before);
  });
});

describe('fork: volume = 1 alternates direction', () => {
  it('does not create a zero-volume child', () => {
    const { blocks, pipes } = forkTerrain();
    const sys = createSystem(blocks, pipes);
    sys.state.snakes.push({
      id: sys.state.nextSnakeId++,
      x: 6, y: 4, volume: 1,
      state: SnakeState.SCANNING,
      flowDir: null, pipeProgress: 0,
    });

    runTicks(sys, 1);
    // Should NOT have split — only one snake with volume 1
    const active = sys.state.snakes.filter(s => s.state !== SnakeState.DONE);
    expect(active.length).toBe(1);
    expect(active[0].volume).toBe(1);
  });

  it('consecutive volume-1 snakes alternate left/right', () => {
    const { blocks, pipes } = forkTerrain();
    const sys = createSystem(blocks, pipes);

    const directions: (Direction | null)[] = [];
    for (let i = 0; i < 4; i++) {
      sys.state.snakes.push({
        id: sys.state.nextSnakeId++,
        x: 6, y: 4, volume: 1,
        state: SnakeState.SCANNING,
        flowDir: null, pipeProgress: 0,
      });
    }

    runTicks(sys, 1);
    for (const s of sys.state.snakes) {
      directions.push(s.flowDir);
    }

    const lefts = directions.filter(d => d === Direction.Left).length;
    const rights = directions.filter(d => d === Direction.Right).length;
    expect(lefts).toBeGreaterThan(0);
    expect(rights).toBeGreaterThan(0);
  });

  it('20 volume-1 snakes fill both pools roughly equally', () => {
    const { blocks, pipes } = forkTerrain();
    const sys = createSystem(blocks, pipes);

    // Spawn 20 individual volume-1 snakes at the fork point
    for (let i = 0; i < 20; i++) {
      sys.state.snakes.push({
        id: sys.state.nextSnakeId++,
        x: 6, y: 4, volume: 1,
        state: SnakeState.SCANNING,
        flowDir: null, pipeProgress: 0,
      });
    }

    runTicks(sys, 40);
    const leftVol = volumeInRegion(sys, 2, 10, 4, 10);
    const rightVol = volumeInRegion(sys, 8, 10, 10, 10);

    // Both pools should have water, within 2 quarters of each other
    expect(leftVol).toBeGreaterThan(0);
    expect(rightVol).toBeGreaterThan(0);
    expect(Math.abs(leftVol - rightVol)).toBeLessThanOrEqual(2);
  });
});

describe('fork: one-sided drop', () => {
  it('flows toward the only drop (no split)', () => {
    const { blocks, pipes } = emptyGrid(12, 10);
    carveRect(blocks, 4, 4, 8, 4); // ledge
    // Only right drop
    carveRect(blocks, 8, 5, 8, 7);

    const sys = createSystem(blocks, pipes);
    sys.state.snakes.push({
      id: sys.state.nextSnakeId++,
      x: 6, y: 4, volume: 4,
      state: SnakeState.SCANNING,
      flowDir: null, pipeProgress: 0,
    });

    runTicks(sys, 1);
    expect(sys.state.snakes.length).toBe(1);
    expect(sys.state.snakes[0].flowDir).toBe(Direction.Right);
  });
});
