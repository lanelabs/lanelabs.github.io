import { describe, it, expect } from 'vitest';
import { Direction } from '../../types';
import { pipeNeighborDirs, buildNetworkGrid, hasPumpAt } from '../../water/pipeNetwork';
import type { PumpCell } from '../types';
import { emptyGrid, setPipe } from './gasPathHelpers';

/**
 * Pump placement validation and pipe-protection tests for gas.
 * Mirror of pumpPlacement.test.ts — these test shared pipe network
 * functions that are used by both water and gas systems.
 * Gas uses down-pumps instead of up-pumps.
 */

describe('hasPumpAt (down-pump)', () => {
  it('returns true when down-pump exists at coordinates', () => {
    const pumps: PumpCell[] = [{ x: 3, y: 4, direction: 'down' }];
    expect(hasPumpAt(pumps, 3, 4)).toBe(true);
  });

  it('returns false when no pump at coordinates', () => {
    const pumps: PumpCell[] = [{ x: 3, y: 4, direction: 'down' }];
    expect(hasPumpAt(pumps, 3, 5)).toBe(false);
    expect(hasPumpAt(pumps, 4, 4)).toBe(false);
  });

  it('returns false for empty pumps array', () => {
    expect(hasPumpAt([], 3, 4)).toBe(false);
  });
});

describe('down-pump placement validation (pipeNeighborDirs)', () => {
  it('vertical pipe with up+down neighbors is valid for down-pump', () => {
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

  it('horizontal pipe returns left/right — invalid for down-pump', () => {
    const { pipes } = emptyGrid(7, 7);
    setPipe(pipes, 2, 3);
    setPipe(pipes, 3, 3);
    setPipe(pipes, 4, 3);

    const dirs = pipeNeighborDirs(pipes, 3, 3, 7, 7);
    expect(dirs).toContain(Direction.Left);
    expect(dirs).toContain(Direction.Right);
  });

  it('intersection pipe returns all 4 dirs — invalid for down-pump', () => {
    const { pipes } = emptyGrid(7, 7);
    setPipe(pipes, 3, 2);
    setPipe(pipes, 3, 4);
    setPipe(pipes, 2, 3);
    setPipe(pipes, 4, 3);
    setPipe(pipes, 3, 3);

    const dirs = pipeNeighborDirs(pipes, 3, 3, 7, 7);
    expect(dirs).toHaveLength(4);
  });

  it('pipe endpoint (only one neighbor) is invalid for down-pump', () => {
    const { pipes } = emptyGrid(7, 7);
    setPipe(pipes, 3, 3);
    setPipe(pipes, 3, 4);

    const dirs = pipeNeighborDirs(pipes, 3, 3, 7, 7);
    expect(dirs).toHaveLength(1);
    expect(dirs).toContain(Direction.Down);
  });
});

describe('down-pump blocks horizontal connections', () => {
  it('pump tile excludes left/right from pipeNeighborDirs', () => {
    const { pipes } = emptyGrid(7, 7);
    setPipe(pipes, 3, 2);
    setPipe(pipes, 3, 4);
    setPipe(pipes, 2, 3);
    setPipe(pipes, 4, 3);
    setPipe(pipes, 3, 3);

    const pumps: PumpCell[] = [{ x: 3, y: 3, direction: 'down' }];

    const dirsNoPump = pipeNeighborDirs(pipes, 3, 3, 7, 7);
    expect(dirsNoPump).toHaveLength(4);

    const dirsWithPump = pipeNeighborDirs(pipes, 3, 3, 7, 7, pumps);
    expect(dirsWithPump).toHaveLength(2);
    expect(dirsWithPump).toContain(Direction.Up);
    expect(dirsWithPump).toContain(Direction.Down);
  });

  it('side neighbor also cannot see pump tile', () => {
    const { pipes } = emptyGrid(7, 7);
    setPipe(pipes, 2, 3);
    setPipe(pipes, 3, 3);
    setPipe(pipes, 3, 2);
    setPipe(pipes, 3, 4);

    const pumps: PumpCell[] = [{ x: 3, y: 3, direction: 'down' }];

    const dirsNoPump = pipeNeighborDirs(pipes, 2, 3, 7, 7);
    expect(dirsNoPump).toContain(Direction.Right);

    const dirsWithPump = pipeNeighborDirs(pipes, 2, 3, 7, 7, pumps);
    expect(dirsWithPump).not.toContain(Direction.Right);
  });

  it('down-pump does not block vertical connections', () => {
    const { pipes } = emptyGrid(7, 7);
    setPipe(pipes, 3, 2);
    setPipe(pipes, 3, 3);
    setPipe(pipes, 3, 4);

    const pumps: PumpCell[] = [{ x: 3, y: 3, direction: 'down' }];

    const aboveDirs = pipeNeighborDirs(pipes, 3, 2, 7, 7, pumps);
    expect(aboveDirs).toContain(Direction.Down);

    const belowDirs = pipeNeighborDirs(pipes, 3, 4, 7, 7, pumps);
    expect(belowDirs).toContain(Direction.Up);
  });
});

describe('buildNetworkGrid with down-pumps', () => {
  it('down-pump splits horizontal network connectivity', () => {
    const { pipes } = emptyGrid(7, 7);
    for (let x = 1; x <= 5; x++) setPipe(pipes, x, 3);

    const pumps: PumpCell[] = [{ x: 3, y: 3, direction: 'down' }];

    const grid = buildNetworkGrid(pipes, 7, 7, pumps);

    expect(grid[3][1]).toBeGreaterThan(0);
    expect(grid[3][2]).toBe(grid[3][1]);

    expect(grid[3][3]).toBeGreaterThan(0);
    expect(grid[3][3]).not.toBe(grid[3][1]);
    expect(grid[3][3]).not.toBe(grid[3][4]);

    expect(grid[3][4]).toBeGreaterThan(0);
    expect(grid[3][5]).toBe(grid[3][4]);
  });

  it('down-pump on vertical pipe keeps vertical connectivity', () => {
    const { pipes } = emptyGrid(7, 7);
    for (let y = 1; y <= 5; y++) setPipe(pipes, 3, y);

    const pumps: PumpCell[] = [{ x: 3, y: 3, direction: 'down' }];

    const grid = buildNetworkGrid(pipes, 7, 7, pumps);

    const netId = grid[1][3];
    expect(netId).toBeGreaterThan(0);
    for (let y = 2; y <= 5; y++) {
      expect(grid[y][3]).toBe(netId);
    }
  });
});
