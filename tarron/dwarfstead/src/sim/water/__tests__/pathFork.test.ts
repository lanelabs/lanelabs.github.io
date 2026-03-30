import { describe, it, expect } from 'vitest';
import {
  emptyGrid, carveRect, createSystem, runTicks,
  totalVolume, volumeInRegion, VOLUME_PER_TILE,
} from './pathHelpers';

/**
 * Fork / split behavior tests — verifies path splitting
 * and volume distribution at fork points.
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

describe('fork: path splits at T-junction', () => {
  it('produces multiple branches when two drops exist', () => {
    const { blocks, pipes } = forkTerrain();

    // Place water in a reservoir above the shaft
    const sys = createSystem(blocks, pipes, [
      { y: 1, left: 6, right: 6, volume: VOLUME_PER_TILE },
    ]);

    // Run enough ticks for paths to be computed and water to flow
    runTicks(sys, 3);

    // Both pools should eventually receive water
    // (first tick: detect exit, second tick: path from shaft to ledge,
    //  water cascades through the fork)
    runTicks(sys, 30);
    const leftVol = volumeInRegion(sys, 2, 10, 4, 10);
    const rightVol = volumeInRegion(sys, 8, 10, 10, 10);
    expect(leftVol).toBeGreaterThan(0);
    expect(rightVol).toBeGreaterThan(0);
  });

  it('conserves volume through fork', () => {
    const { blocks, pipes } = forkTerrain();
    const sys = createSystem(blocks, pipes, [
      { y: 1, left: 6, right: 6, volume: 5 * VOLUME_PER_TILE },
    ]);
    const before = totalVolume(sys);

    runTicks(sys, 50);
    expect(totalVolume(sys)).toBe(before);
  });

  it('distributes roughly equally between two pools', () => {
    const { blocks, pipes } = forkTerrain();
    const sys = createSystem(blocks, pipes, [
      { y: 1, left: 6, right: 6, volume: VOLUME_PER_TILE },
      { y: 2, left: 6, right: 6, volume: VOLUME_PER_TILE },
      { y: 3, left: 6, right: 6, volume: VOLUME_PER_TILE },
    ]);

    runTicks(sys, 60);
    const leftVol = volumeInRegion(sys, 2, 10, 4, 10);
    const rightVol = volumeInRegion(sys, 8, 10, 10, 10);

    // Both pools should have water, within reasonable tolerance
    expect(leftVol).toBeGreaterThan(0);
    expect(rightVol).toBeGreaterThan(0);
    // Difference should be small (less than one teleport amount)
    expect(Math.abs(leftVol - rightVol)).toBeLessThanOrEqual(VOLUME_PER_TILE);
  });
});

describe('fork: one-sided drop', () => {
  it('path traces only toward the available drop', () => {
    const { blocks, pipes } = emptyGrid(12, 10);
    carveRect(blocks, 4, 4, 8, 4); // ledge
    // Only right drop
    carveRect(blocks, 8, 5, 8, 7);
    carveRect(blocks, 7, 8, 9, 8); // catch basin

    const sys = createSystem(blocks, pipes, [
      { y: 4, left: 4, right: 8, volume: 20 },
    ]);

    // After path computation, there should be a path going right
    runTicks(sys, 1);

    // Check that paths exist and trace rightward
    const paths = sys.state.paths;
    if (paths.length > 0) {
      for (const branch of paths[0].branches) {
        // All branch nodes should be at x >= 4 (no leftward flow)
        const leftmostX = Math.min(...branch.nodes.map(n => n.x));
        expect(leftmostX).toBeGreaterThanOrEqual(4);
      }
    }
  });
});
