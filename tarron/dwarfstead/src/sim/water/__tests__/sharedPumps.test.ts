import { describe, it, expect } from 'vitest';
import { BlockMaterial } from '../../types';
import type { PipeCell, PumpCell } from '../types';
import { WaterPathSystem } from '../WaterPathSystem';
import { GasPathSystem } from '../../gas/GasPathSystem';

const S = BlockMaterial.Stone;

function emptyGrid(w: number, h: number) {
  const blocks: BlockMaterial[][] = [];
  const pipes: (PipeCell | null)[][] = [];
  for (let y = 0; y < h; y++) {
    blocks.push(new Array(w).fill(S));
    pipes.push(new Array(w).fill(null));
  }
  return { blocks, pipes };
}

describe('shared pumps array', () => {
  it('both systems see a pump added after construction', () => {
    const { blocks, pipes } = emptyGrid(5, 5);
    const pumps: PumpCell[] = [];

    const water = new WaterPathSystem({
      width: 5, height: 5, blocks, pipes, pumps,
    });
    const gas = new GasPathSystem({
      width: 5, height: 5, blocks, pipes, pumps,
    });

    expect(water.state.pumps).toBe(gas.state.pumps);
    expect(water.state.pumps.length).toBe(0);

    // Simulate placing a pump (like fluidTestHelpers.togglePump does)
    pumps.push({ x: 2, y: 2, direction: 'up' });

    expect(water.state.pumps.length).toBe(1);
    expect(gas.state.pumps.length).toBe(1);
    expect(gas.state.pumps[0]).toEqual({ x: 2, y: 2, direction: 'up' });
  });

  it('removing a pump is visible to both systems', () => {
    const { blocks, pipes } = emptyGrid(5, 5);
    const pumps: PumpCell[] = [{ x: 1, y: 1, direction: 'down' }];

    const water = new WaterPathSystem({
      width: 5, height: 5, blocks, pipes, pumps,
    });
    const gas = new GasPathSystem({
      width: 5, height: 5, blocks, pipes, pumps,
    });

    expect(water.state.pumps.length).toBe(1);
    expect(gas.state.pumps.length).toBe(1);

    pumps.splice(0, 1);

    expect(water.state.pumps.length).toBe(0);
    expect(gas.state.pumps.length).toBe(0);
  });

  it('pipes array is also shared between systems', () => {
    const { blocks, pipes } = emptyGrid(5, 5);
    const pumps: PumpCell[] = [];

    const water = new WaterPathSystem({
      width: 5, height: 5, blocks, pipes, pumps,
    });
    const gas = new GasPathSystem({
      width: 5, height: 5, blocks, pipes, pumps,
    });

    expect(water.state.pipes).toBe(gas.state.pipes);

    // Place a pipe via the shared array
    pipes[2][2] = true;
    expect(water.state.pipes[2][2]).toBe(true);
    expect(gas.state.pipes[2][2]).toBe(true);
  });

  it('restoreState preserves shared reference by mutating in-place', () => {
    const { blocks, pipes } = emptyGrid(5, 5);
    const pumps: PumpCell[] = [];

    const water = new WaterPathSystem({
      width: 5, height: 5, blocks, pipes, pumps,
    });
    const gas = new GasPathSystem({
      width: 5, height: 5, blocks, pipes, pumps,
    });

    const sharedRef = water.state.pumps;
    expect(gas.state.pumps).toBe(sharedRef);

    // Restore water state with saved pumps
    WaterPathSystem.restoreState(water, {
      waterLayers: [],
      pipeFill: Array.from({ length: 5 }, () => new Array(5).fill(0)),
      pipes: pipes.map(row => [...row]),
      pumps: [{ x: 3, y: 3, direction: 'up' }],
    });

    // The array reference should be the same object (mutated in place)
    expect(water.state.pumps).toBe(sharedRef);
    expect(gas.state.pumps).toBe(sharedRef);
    expect(sharedRef.length).toBe(1);
    expect(sharedRef[0]).toEqual({ x: 3, y: 3, direction: 'up' });
  });
});
