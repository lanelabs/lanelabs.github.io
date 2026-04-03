import { describe, it, expect } from 'vitest';
import { Direction } from '../../../sim/types';
import { buildStreamContext } from '../streamContext';
import { buildGasStreamContext } from '../gasStreamContext';
import {
  emptyGrid as waterEmptyGrid,
  carveRect as waterCarveRect,
  setAir as waterSetAir,
  setPipe as waterSetPipe,
  createSystem as waterCreateSystem,
  runTicks as waterRunTicks,
} from '../../../sim/water/__tests__/pathHelpers';
import {
  emptyGrid as gasEmptyGrid,
  carveRect as gasCarveRect,
  setAir as gasSetAir,
  setPipe as gasSetPipe,
  createSystem as gasCreateSystem,
  runTicks as gasRunTicks,
} from '../../../sim/gas/__tests__/gasPathHelpers';
import { findLayer } from '../../../sim/water/waterLayer';
import { findGasLayer } from '../../../sim/gas/gasLayer';
import type { PumpCell } from '../../../sim/water/types';

/**
 * Submerged pipe terminal classification tests.
 *
 * Verifies that pipe terminals submerged in fluid pools produce
 * pool-entry nodes with pipeExit=true in the stream context.
 */

describe('water submerged terminal', () => {
  // Scenario:
  //   01234
  // 0 xxxxx  ← stone
  // 1 x...x  ← water pool (y=1, left=1 right=3)
  // 2 x.P.x  ← pool continues + pipe terminal at (2,2)
  // 3 xxPxx  ← pipe through stone
  // 4 xxPxx  ← pipe through stone
  // 5 xx.xx  ← air — pipe exit at (2,5)
  // 6 x...x  ← air cavern
  // 7 xxxxx  ← floor
  it('classifies submerged pipe terminal as pool-entry with pipeExit', () => {
    const { blocks, pipes } = waterEmptyGrid(5, 8);

    // Pool at y=1-2
    waterCarveRect(blocks, 1, 1, 3, 2);
    // Pipe at x=2, y=2-5
    waterSetPipe(pipes, 2, 2);
    waterSetPipe(pipes, 2, 3);
    waterSetPipe(pipes, 2, 4);
    waterSetPipe(pipes, 2, 5);
    // Air exit at (2,5) and cavern below
    waterSetAir(blocks, 2, 5);
    waterCarveRect(blocks, 1, 6, 3, 6);

    const sys = waterCreateSystem(blocks, pipes, [
      { y: 1, left: 1, right: 3, volume: 30 },
      { y: 2, left: 1, right: 3, volume: 30 },
    ]);

    waterRunTicks(sys, 10);

    // A) Pool layer at (2,2) has volume
    const layer = findLayer(sys.state.waterLayers, 2, 2);
    expect(layer).not.toBeNull();
    expect(layer!.volume).toBeGreaterThan(0);

    // B) Build stream context and find pool-entry at (2,2)
    const ctx = buildStreamContext(sys.state);
    const allNodes = ctx.classifiedBranches.flat();
    const terminal = allNodes.find(n => n.x === 2 && n.y === 2 && n.cls === 'pool-entry');
    expect(terminal).toBeDefined();

    // C) Classification
    expect(terminal!.pipeExit).toBe(true);
    expect(terminal!.prevDir).toBe(Direction.Down);
  });
});

describe('gas submerged terminal', () => {
  // Scenario:
  //   01234
  // 0 xxxxx  ← ceiling
  // 1 x...x  ← gas pool (clings to ceiling, y=1 left=1 right=3)
  // 2 x.P.x  ← pool continues + pipe terminal at (2,2)
  // 3 xxPxx  ← pipe through stone
  // 4 xxPxx  ← down-pump at (2,4)
  // 5 xxPxx  ← pipe through stone
  // 6 xx.xx  ← air — pipe exit at (2,6)
  // 7 x...x  ← air cavern
  // 8 xxxxx  ← floor
  it('classifies submerged pipe terminal as pool-entry with pipeExit', () => {
    const { blocks, pipes } = gasEmptyGrid(5, 9);

    // Gas pool at y=1-2
    gasCarveRect(blocks, 1, 1, 3, 2);
    // Pipe at x=2, y=2-6
    gasSetPipe(pipes, 2, 2);
    gasSetPipe(pipes, 2, 3);
    gasSetPipe(pipes, 2, 4);
    gasSetPipe(pipes, 2, 5);
    gasSetPipe(pipes, 2, 6);
    // Air exit at (2,6) and cavern below
    gasSetAir(blocks, 2, 6);
    gasCarveRect(blocks, 1, 7, 3, 7);

    // Down-pump at (2,4)
    const pumps: PumpCell[] = [{ x: 2, y: 4, direction: 'down' }];

    const sys = gasCreateSystem(blocks, pipes, [
      { y: 1, left: 1, right: 3, volume: 30 },
      { y: 2, left: 1, right: 3, volume: 30 },
    ], pumps);

    gasRunTicks(sys, 10);

    // A) Gas layer at (2,2) has volume
    const layer = findGasLayer(sys.state.gasLayers, 2, 2);
    expect(layer).not.toBeNull();
    expect(layer!.volume).toBeGreaterThan(0);

    // B) Build gas stream context and find pool-entry at (2,2)
    const ctx = buildGasStreamContext(sys.state);
    const allNodes = ctx.classifiedBranches.flat();
    const terminal = allNodes.find(n => n.x === 2 && n.y === 2 && n.cls === 'pool-entry');
    expect(terminal).toBeDefined();

    // C) Classification
    expect(terminal!.pipeExit).toBe(true);
    expect(terminal!.prevDir).toBe(Direction.Up);
  });
});
