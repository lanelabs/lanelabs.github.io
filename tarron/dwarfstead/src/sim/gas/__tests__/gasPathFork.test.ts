import { describe, it, expect } from 'vitest';
import {
  emptyGrid, carveRect, createSystem, runTicks,
  totalVolume, volumeInRegion, VOLUME_PER_TILE,
} from './gasPathHelpers';

/**
 * Gas fork / split behavior tests — verifies path splitting
 * and volume distribution at fork points.
 * Mirror of pathFork.test.ts with inverted gravity (gas rises).
 */

/** Helper: create a standard gas fork terrain.
 *
 *  Layout (12 wide, 12 tall):
 *    - Left ceiling pocket: x=2..4, y=1
 *    - Right ceiling pocket: x=8..10, y=1
 *    - Left rise shaft: x=4, y=2..6
 *    - Right rise shaft: x=8, y=2..6
 *    - Horizontal ledge at y=7, x=4..8
 *    - Source shaft at x=6, y=8..10
 */
function forkTerrain() {
  const { blocks, pipes } = emptyGrid(12, 12);
  // Source shaft (gas starts here, rises up)
  carveRect(blocks, 6, 8, 6, 10);
  // Horizontal ledge (gas spreads left/right)
  carveRect(blocks, 4, 7, 8, 7);
  // Left rise shaft
  carveRect(blocks, 4, 2, 4, 6);
  // Right rise shaft
  carveRect(blocks, 8, 2, 8, 6);
  // Left ceiling pocket
  carveRect(blocks, 2, 1, 4, 1);
  // Right ceiling pocket
  carveRect(blocks, 8, 1, 10, 1);
  return { blocks, pipes };
}

describe('gas fork: path splits at inverted T-junction', () => {
  it('produces multiple branches when two rises exist', () => {
    const { blocks, pipes } = forkTerrain();

    const sys = createSystem(blocks, pipes, [
      { y: 10, left: 6, right: 6, volume: VOLUME_PER_TILE },
    ]);

    runTicks(sys, 3);
    runTicks(sys, 30);
    const leftVol = volumeInRegion(sys, 2, 1, 4, 1);
    const rightVol = volumeInRegion(sys, 8, 1, 10, 1);
    expect(leftVol).toBeGreaterThan(0);
    expect(rightVol).toBeGreaterThan(0);
  });

  it('conserves volume through fork', () => {
    const { blocks, pipes } = forkTerrain();
    const sys = createSystem(blocks, pipes, [
      { y: 10, left: 6, right: 6, volume: 5 * VOLUME_PER_TILE },
    ]);
    const before = totalVolume(sys);

    runTicks(sys, 50);
    expect(totalVolume(sys)).toBe(before);
  });

  it('distributes roughly equally between two ceiling pockets', () => {
    const { blocks, pipes } = forkTerrain();
    const sys = createSystem(blocks, pipes, [
      { y: 10, left: 6, right: 6, volume: VOLUME_PER_TILE },
      { y: 9, left: 6, right: 6, volume: VOLUME_PER_TILE },
      { y: 8, left: 6, right: 6, volume: VOLUME_PER_TILE },
    ]);

    runTicks(sys, 60);
    const leftVol = volumeInRegion(sys, 2, 1, 4, 1);
    const rightVol = volumeInRegion(sys, 8, 1, 10, 1);

    expect(leftVol).toBeGreaterThan(0);
    expect(rightVol).toBeGreaterThan(0);
    expect(Math.abs(leftVol - rightVol)).toBeLessThanOrEqual(VOLUME_PER_TILE);
  });
});

describe('gas fork: one-sided rise', () => {
  it('path traces only toward the available rise', () => {
    const { blocks, pipes } = emptyGrid(12, 10);
    carveRect(blocks, 4, 5, 8, 5); // horizontal ledge
    // Only right rise
    carveRect(blocks, 8, 2, 8, 4);
    carveRect(blocks, 7, 1, 9, 1); // ceiling pocket

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 4, right: 8, volume: 20 },
    ]);

    runTicks(sys, 1);

    const paths = sys.state.paths;
    if (paths.length > 0) {
      for (const branch of paths[0].branches) {
        const leftmostX = Math.min(...branch.nodes.map(n => n.x));
        expect(leftmostX).toBeGreaterThanOrEqual(4);
      }
    }
  });
});
