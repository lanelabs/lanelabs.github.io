import { describe, it, expect } from 'vitest';
import { Direction } from '../../types';
import { pipeNeighborDirs, buildNetworkGrid, hasPumpAt } from '../pipeNetwork';
import type { PumpCell } from '../types';
import { emptyGrid, setPipe } from './pathHelpers';

/**
 * Pump placement validation and pipe-protection tests.
 *
 * These test the sim-layer functions that the renderer uses
 * for placement rules and connectivity.
 */

describe('hasPumpAt', () => {
  it('returns true when pump exists at coordinates', () => {
    const pumps: PumpCell[] = [{ x: 3, y: 4, direction: 'up' }];
    expect(hasPumpAt(pumps, 3, 4)).toBe(true);
  });

  it('returns false when no pump at coordinates', () => {
    const pumps: PumpCell[] = [{ x: 3, y: 4, direction: 'up' }];
    expect(hasPumpAt(pumps, 3, 5)).toBe(false);
    expect(hasPumpAt(pumps, 4, 4)).toBe(false);
  });

  it('returns false for empty pumps array', () => {
    expect(hasPumpAt([], 3, 4)).toBe(false);
  });
});

describe('pump placement validation (pipeNeighborDirs)', () => {
  it('vertical pipe with up+down neighbors is valid for pump', () => {
    // Three vertical pipes: (3,2), (3,3), (3,4)
    const { pipes } = emptyGrid(7, 7);
    setPipe(pipes, 3, 2);
    setPipe(pipes, 3, 3);
    setPipe(pipes, 3, 4);

    const dirs = pipeNeighborDirs(pipes, 3, 3, 7, 7);
    expect(dirs).toContain(Direction.Up);
    expect(dirs).toContain(Direction.Down);
    expect(dirs).not.toContain(Direction.Left);
    expect(dirs).not.toContain(Direction.Right);
  });

  it('horizontal pipe returns left/right — invalid for pump', () => {
    const { pipes } = emptyGrid(7, 7);
    setPipe(pipes, 2, 3);
    setPipe(pipes, 3, 3);
    setPipe(pipes, 4, 3);

    const dirs = pipeNeighborDirs(pipes, 3, 3, 7, 7);
    expect(dirs).toContain(Direction.Left);
    expect(dirs).toContain(Direction.Right);
  });

  it('intersection pipe returns all 4 dirs — invalid for pump', () => {
    const { pipes } = emptyGrid(7, 7);
    setPipe(pipes, 3, 2); // up
    setPipe(pipes, 3, 4); // down
    setPipe(pipes, 2, 3); // left
    setPipe(pipes, 4, 3); // right
    setPipe(pipes, 3, 3); // center

    const dirs = pipeNeighborDirs(pipes, 3, 3, 7, 7);
    expect(dirs).toHaveLength(4);
  });

  it('pipe endpoint (only one neighbor) is invalid for pump', () => {
    const { pipes } = emptyGrid(7, 7);
    setPipe(pipes, 3, 3);
    setPipe(pipes, 3, 4);

    // (3,3) only has Down neighbor
    const dirs = pipeNeighborDirs(pipes, 3, 3, 7, 7);
    expect(dirs).toHaveLength(1);
    expect(dirs).toContain(Direction.Down);
  });
});

describe('pump blocks horizontal connections', () => {
  it('pump tile excludes left/right from pipeNeighborDirs', () => {
    // Cross-shaped pipe: center at (3,3) with all 4 neighbors
    const { pipes } = emptyGrid(7, 7);
    setPipe(pipes, 3, 2);
    setPipe(pipes, 3, 4);
    setPipe(pipes, 2, 3);
    setPipe(pipes, 4, 3);
    setPipe(pipes, 3, 3);

    const pumps: PumpCell[] = [{ x: 3, y: 3, direction: 'up' }];

    // Without pumps: all 4 directions
    const dirsNoPump = pipeNeighborDirs(pipes, 3, 3, 7, 7);
    expect(dirsNoPump).toHaveLength(4);

    // With pumps: only up and down
    const dirsWithPump = pipeNeighborDirs(pipes, 3, 3, 7, 7, pumps);
    expect(dirsWithPump).toHaveLength(2);
    expect(dirsWithPump).toContain(Direction.Up);
    expect(dirsWithPump).toContain(Direction.Down);
  });

  it('side neighbor also cannot see pump tile', () => {
    // Pipe at (2,3) looking right toward pump at (3,3)
    const { pipes } = emptyGrid(7, 7);
    setPipe(pipes, 2, 3);
    setPipe(pipes, 3, 3);
    setPipe(pipes, 3, 2);
    setPipe(pipes, 3, 4);

    const pumps: PumpCell[] = [{ x: 3, y: 3, direction: 'up' }];

    // (2,3) without pumps: sees (3,3) to the right
    const dirsNoPump = pipeNeighborDirs(pipes, 2, 3, 7, 7);
    expect(dirsNoPump).toContain(Direction.Right);

    // (2,3) with pumps: cannot see (3,3) to the right because (3,3) has a pump
    const dirsWithPump = pipeNeighborDirs(pipes, 2, 3, 7, 7, pumps);
    expect(dirsWithPump).not.toContain(Direction.Right);
  });

  it('pump does not block vertical connections', () => {
    const { pipes } = emptyGrid(7, 7);
    setPipe(pipes, 3, 2);
    setPipe(pipes, 3, 3);
    setPipe(pipes, 3, 4);

    const pumps: PumpCell[] = [{ x: 3, y: 3, direction: 'up' }];

    // Tile above pump still sees Down neighbor
    const aboveDirs = pipeNeighborDirs(pipes, 3, 2, 7, 7, pumps);
    expect(aboveDirs).toContain(Direction.Down);

    // Tile below pump still sees Up neighbor
    const belowDirs = pipeNeighborDirs(pipes, 3, 4, 7, 7, pumps);
    expect(belowDirs).toContain(Direction.Up);
  });
});

describe('buildNetworkGrid with pumps', () => {
  it('pump splits horizontal network connectivity', () => {
    // Horizontal pipe: (1,3)-(2,3)-(3,3)-(4,3)-(5,3)
    // Pump at (3,3) blocks horizontal → splits into 3 networks
    const { pipes } = emptyGrid(7, 7);
    for (let x = 1; x <= 5; x++) setPipe(pipes, x, 3);

    const pumps: PumpCell[] = [{ x: 3, y: 3, direction: 'up' }];

    const grid = buildNetworkGrid(pipes, 7, 7, pumps);

    // Left side (1,3)-(2,3) should be one network
    expect(grid[3][1]).toBeGreaterThan(0);
    expect(grid[3][2]).toBe(grid[3][1]);

    // Pump tile (3,3) should be isolated (no horizontal connections)
    expect(grid[3][3]).toBeGreaterThan(0);
    expect(grid[3][3]).not.toBe(grid[3][1]);
    expect(grid[3][3]).not.toBe(grid[3][4]);

    // Right side (4,3)-(5,3) should be one network
    expect(grid[3][4]).toBeGreaterThan(0);
    expect(grid[3][5]).toBe(grid[3][4]);
  });

  it('pump on vertical pipe keeps vertical connectivity', () => {
    // Vertical pipe: (3,1)-(3,2)-(3,3)-(3,4)-(3,5)
    // Pump at (3,3) — all should be same network (vertical not blocked)
    const { pipes } = emptyGrid(7, 7);
    for (let y = 1; y <= 5; y++) setPipe(pipes, 3, y);

    const pumps: PumpCell[] = [{ x: 3, y: 3, direction: 'up' }];

    const grid = buildNetworkGrid(pipes, 7, 7, pumps);

    const netId = grid[1][3];
    expect(netId).toBeGreaterThan(0);
    for (let y = 2; y <= 5; y++) {
      expect(grid[y][3]).toBe(netId);
    }
  });
});
