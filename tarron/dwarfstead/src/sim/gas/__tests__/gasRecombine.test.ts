import { describe, it, expect } from 'vitest';
import {
  emptyGrid, carveRect, A,
  createSystem,
} from './gasPathHelpers';
import { addGas, findGasLayer } from '../gasLayer';
import { recombineGasAtTile, collectOverlappingGasLayers, scanGasPoolShape } from '../gasRecombine';
import type { GasLayer } from '../types';

/**
 * Gas recombine tests — merging gas pools after block removal.
 * Mirror of recombine.test.ts with inverted containment (ceiling check).
 */

describe('gas recombine', () => {
  /**
   * Layout (8 wide, 5 tall):
   *   S S S S S S S S
   *   S A A S A A S S    ← two 2-wide ceiling pockets separated by wall at x=3
   *   S S S S S S S S
   *   S S S S S S S S
   *   S S S S S S S S
   *
   * Remove the wall at (3,1) → pockets merge into one 4-wide layer.
   */
  it('horizontal merge — wall between two ceiling pockets removed', () => {
    const { blocks } = emptyGrid(8, 5);
    carveRect(blocks, 1, 1, 2, 1);
    carveRect(blocks, 4, 1, 5, 1);

    const gasLayers: GasLayer[] = [];
    const w = 8, h = 5;
    addGas(gasLayers, blocks, 1, 1, 20, w, h);
    addGas(gasLayers, blocks, 4, 1, 15, w, h);

    expect(gasLayers.length).toBe(2);

    blocks[1][3] = A;
    const result = recombineGasAtTile(3, 1, gasLayers, blocks, w, h);

    expect(result).toBe(true);
    expect(gasLayers.length).toBe(1);
    expect(gasLayers[0].y).toBe(1);
    expect(gasLayers[0].left).toBe(1);
    expect(gasLayers[0].right).toBe(5);
    expect(gasLayers[0].volume).toBe(35);
  });

  it('volume conservation — total unchanged after merge', () => {
    const { blocks } = emptyGrid(8, 5);
    carveRect(blocks, 1, 1, 2, 1);
    carveRect(blocks, 4, 1, 5, 1);

    const gasLayers: GasLayer[] = [];
    const w = 8, h = 5;
    addGas(gasLayers, blocks, 1, 1, 18, w, h);
    addGas(gasLayers, blocks, 4, 1, 12, w, h);
    const volumeBefore = gasLayers.reduce((s, l) => s + l.volume, 0);

    blocks[1][3] = A;
    recombineGasAtTile(3, 1, gasLayers, blocks, w, h);

    const volumeAfter = gasLayers.reduce((s, l) => s + l.volume, 0);
    expect(volumeAfter).toBe(volumeBefore);
  });

  /**
   * Open air run (no wall on left side — world edge at x=0):
   *   A A A S A A S S
   *   S S S S S S S S
   *
   * Not contained → returns false.
   */
  it('not contained returns false — open air run', () => {
    const { blocks } = emptyGrid(8, 3);
    carveRect(blocks, 0, 0, 2, 0);

    const gasLayers: GasLayer[] = [];
    const w = 8, h = 3;
    addGas(gasLayers, blocks, 0, 0, 10, w, h);

    blocks[0][3] = A;
    const result = recombineGasAtTile(3, 0, gasLayers, blocks, w, h);

    expect(result).toBe(false);
  });

  it('no adjacent gas returns false — dry block removal', () => {
    const { blocks, pipes } = emptyGrid(8, 5);
    carveRect(blocks, 1, 1, 2, 1);

    const sys = createSystem(blocks, pipes);
    blocks[1][3] = A;
    sys.onBlockRemoved(3, 1);

    expect(sys.state.gasLayers.length).toBe(0);
  });

  it('integration via onBlockRemoved — layers merged', () => {
    const { blocks, pipes } = emptyGrid(8, 5);
    carveRect(blocks, 1, 1, 2, 1);
    carveRect(blocks, 4, 1, 5, 1);

    const initialGas: GasLayer[] = [
      { y: 1, left: 1, right: 2, volume: 20 },
      { y: 1, left: 4, right: 5, volume: 10 },
    ];
    const sys = createSystem(blocks, pipes, initialGas);

    expect(sys.state.gasLayers.length).toBe(2);

    blocks[1][3] = A;
    sys.onBlockRemoved(3, 1);

    expect(sys.state.gasLayers.length).toBe(1);
    expect(sys.state.gasLayers[0].volume).toBe(30);
    expect(sys.state.gasLayers[0].left).toBe(1);
    expect(sys.state.gasLayers[0].right).toBe(5);
  });

  /**
   * Ceiling removal merge — vertical merge (gas-specific):
   *   S S S S S   ← ceiling
   *   S A A S S   ← y=1, upper ceiling pocket with 20 volume (full)
   *   S S S S S   ← y=2, ceiling stone (remove at x=1)
   *   S A A S S   ← y=3, lower pocket with 15 volume
   *   S S S S S
   *
   * Remove ceiling stone at (1,2) → scanGasPoolShape finds all 3 rows,
   * gas redistributes top-down (fills ceiling first).
   */
  it('ceiling removal merge — redistributes top-down', () => {
    const { blocks } = emptyGrid(5, 5);
    carveRect(blocks, 1, 1, 2, 1);
    carveRect(blocks, 1, 3, 2, 3);

    const gasLayers: GasLayer[] = [];
    const w = 5, h = 5;
    addGas(gasLayers, blocks, 1, 1, 20, w, h);
    addGas(gasLayers, blocks, 1, 3, 15, w, h);

    expect(gasLayers.length).toBe(2);
    const volumeBefore = gasLayers.reduce((s, l) => s + l.volume, 0);

    blocks[2][1] = A;
    const result = recombineGasAtTile(1, 2, gasLayers, blocks, w, h);

    expect(result).toBe(true);
    const volumeAfter = gasLayers.reduce((s, l) => s + l.volume, 0);
    expect(volumeAfter).toBe(volumeBefore);

    // Top layer (y=1) should fill first (capacity 20)
    const topLayer = findGasLayer(gasLayers, 1, 1);
    expect(topLayer).not.toBeNull();
    expect(topLayer!.volume).toBe(20);
  });

  /**
   * L-shape merge — ceiling wall connects narrow lower to wider upper:
   *   S S S S S S   ← world top / ceiling
   *   S A A A S S   ← y=1, wider ceiling pocket
   *   S S S S S S   ← y=2, wall at (2,2) to remove
   *   S A S S S S   ← y=3, narrow lower pocket (x=1)
   *   S A S S S S   ← y=4, narrow lower pocket
   *   S S S S S S   ← floor
   */
  it('L-shape merge — wall connects narrow lower to wider upper', () => {
    const { blocks } = emptyGrid(6, 6);
    carveRect(blocks, 1, 1, 3, 1);
    carveRect(blocks, 1, 3, 1, 4);

    const gasLayers: GasLayer[] = [];
    const w = 6, h = 6;
    addGas(gasLayers, blocks, 1, 1, 10, w, h);
    addGas(gasLayers, blocks, 1, 3, 10, w, h);
    addGas(gasLayers, blocks, 1, 4, 10, w, h);

    const volumeBefore = gasLayers.reduce((s, l) => s + l.volume, 0);
    expect(volumeBefore).toBe(30);

    blocks[2][1] = A;

    const pool = scanGasPoolShape(1, 2, blocks, w, h);
    expect(pool).not.toBeNull();
    expect(pool!.layers.length).toBe(4); // y=1, y=2, y=3, y=4

    const result = recombineGasAtTile(1, 2, gasLayers, blocks, w, h);
    expect(result).toBe(true);

    const volumeAfter = gasLayers.reduce((s, l) => s + l.volume, 0);
    expect(volumeAfter).toBe(volumeBefore);
  });

  /**
   * Two 1-wide, 2-tall chambers separated by a wall, remove top wall:
   *   S S S S S   ← ceiling
   *   S A[X]A S   ← y=1, top row, wall at (2,1) to remove
   *   S A S A S   ← y=2, bottom row of both chambers
   *   S S S S S   ← floor
   *
   * Left chamber: both layers full (10 + 10 = 20).
   * Right chamber: only top full (10 + 0 = 10).
   * Total gas = 30.
   *
   * After removing [X], top row becomes 3-wide (capacity 30).
   * Gas fills top-down: y=1 first (3-wide, cap=30), should get all 30.
   */
  it('twin chambers — wall removed, gas fills to 3-wide top', () => {
    const { blocks } = emptyGrid(5, 4);
    carveRect(blocks, 1, 1, 1, 2);
    carveRect(blocks, 3, 1, 3, 2);

    const gasLayers: GasLayer[] = [];
    const w = 5, h = 4;
    addGas(gasLayers, blocks, 1, 1, 10, w, h);
    addGas(gasLayers, blocks, 1, 2, 10, w, h);
    addGas(gasLayers, blocks, 3, 1, 10, w, h);

    expect(gasLayers.reduce((s, l) => s + l.volume, 0)).toBe(30);

    // Remove top wall at (2,1) — connects top row into 3-wide
    blocks[1][2] = A;
    const result = recombineGasAtTile(2, 1, gasLayers, blocks, w, h);

    expect(result).toBe(true);

    const volumeAfter = gasLayers.reduce((s, l) => s + l.volume, 0);
    expect(volumeAfter).toBe(30);

    // Top row y=1 is now 3-wide (x=1..3), capacity 30 — should be full
    const top = findGasLayer(gasLayers, 1, 1);
    expect(top).not.toBeNull();
    expect(top!.left).toBe(1);
    expect(top!.right).toBe(3);
    expect(top!.volume).toBe(30);

    // Lower layers should be empty
    expect(findGasLayer(gasLayers, 1, 2)).toBeNull();
    expect(findGasLayer(gasLayers, 3, 2)).toBeNull();
  });

  it('collectOverlappingGasLayers finds correct indices', () => {
    const { blocks } = emptyGrid(10, 5);
    carveRect(blocks, 1, 1, 8, 1);

    const gasLayers: GasLayer[] = [
      { y: 1, left: 1, right: 3, volume: 10 },
      { y: 1, left: 5, right: 8, volume: 20 },
      { y: 2, left: 1, right: 3, volume: 5 },
    ];

    const pool = scanGasPoolShape(1, 1, blocks, 10, 5);
    expect(pool).not.toBeNull();

    const indices = collectOverlappingGasLayers(pool!, gasLayers);
    expect(indices).toEqual([0, 1]);
  });
});
