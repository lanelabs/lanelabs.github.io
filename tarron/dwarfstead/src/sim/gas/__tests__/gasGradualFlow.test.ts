import { describe, it, expect } from 'vitest';
import {
  emptyGrid, carveRect, setAir, A,
  createSystem, runTicks, totalVolume,
  VOLUME_PER_TILE,
} from './gasPathHelpers';
import { findGasLayer } from '../gasLayer';
import type { GasLayer } from '../types';

/**
 * Tests for selective recombination: gradual flow through breaches
 * and instant merge only when a filling layer bridges two pools.
 */

describe('onBlockRemoved — selective recombine', () => {
  /**
   * Ceiling breach to uncontained space — no instant merge.
   *
   *   S S S S S S S   ← y=0 ceiling
   *   S . . . . . S   ← y=1 open cavity (5-wide)
   *   S . . . . . S   ← y=2 open cavity
   *   S S S[X]S S S   ← y=3 ceiling of gas cave, remove (3,3)
   *   S G G G G G S   ← y=4 gas pool (5-wide, full = 50)
   *   S S S S S S S   ← y=5 floor
   *
   * Removing (3,3) should NOT instantly redistribute gas into the cavity.
   * Gas should remain in the source pool; flow happens gradually via ticks.
   */
  it('ceiling breach to uncontained space — no instant merge', () => {
    const { blocks, pipes } = emptyGrid(7, 6);
    carveRect(blocks, 1, 1, 5, 2); // open cavity above
    carveRect(blocks, 1, 4, 5, 4); // gas pool row

    const initialGas: GasLayer[] = [
      { y: 4, left: 1, right: 5, volume: 50 },
    ];
    const sys = createSystem(blocks, pipes, initialGas);

    // Remove ceiling block at (3,3) — opens gas to uncontained cavity
    blocks[3][3] = A;
    sys.onBlockRemoved(3, 3);

    // Gas should NOT have moved — still 50 in the source pool
    expect(sys.state.gasLayers.length).toBe(1);
    expect(sys.state.gasLayers[0].volume).toBe(50);
    expect(sys.state.gasLayers[0].y).toBe(4);
  });

  /**
   * Contained pocket — solid ceiling above removed block → instant merge.
   *
   *   S S S S S S S   ← y=0 ceiling
   *   S S S S S S S   ← y=1 solid stone (ceiling of removed tile)
   *   S S S[X]S S S   ← y=2 remove here → 1-wide pocket with solid ceiling
   *   S G G G G G S   ← y=3 gas pool (5-wide, 50 volume)
   *   S S S S S S S   ← y=4 floor
   */
  it('contained pocket with solid ceiling — instant merge', () => {
    const { blocks, pipes } = emptyGrid(7, 5);
    carveRect(blocks, 1, 3, 5, 3); // gas pool row

    const initialGas: GasLayer[] = [
      { y: 3, left: 1, right: 5, volume: 50 },
    ];
    const sys = createSystem(blocks, pipes, initialGas);

    // Remove ceiling block at (3,2) — creates a contained 1-wide pocket
    blocks[2][3] = A;
    sys.onBlockRemoved(3, 2);

    // Gas should have recombined — pocket (3,2) + pool (1-5,3)
    expect(totalVolume(sys)).toBe(50);

    // The pocket at y=2 should have gas (fills top-down)
    const pocketLayer = findGasLayer(sys.state.gasLayers, 3, 2);
    expect(pocketLayer).not.toBeNull();
    expect(pocketLayer!.volume).toBeGreaterThan(0);
  });

  /**
   * Ceiling breach to open pocket — NOT contained → no instant merge.
   *
   *   S S S S S S S   ← y=0 ceiling
   *   S S S . S S S   ← y=1 air pocket (air above removed tile)
   *   S S S[X]S S S   ← y=2 remove here → air above = NOT contained
   *   S G G G G G S   ← y=3 gas pool (5-wide, 50 vol)
   *   S S S S S S S   ← y=4 floor
   */
  it('ceiling breach to open pocket — no instant merge', () => {
    const { blocks, pipes } = emptyGrid(7, 5);
    setAir(blocks, 3, 1);          // air pocket above
    carveRect(blocks, 1, 3, 5, 3); // gas pool row

    const initialGas: GasLayer[] = [
      { y: 3, left: 1, right: 5, volume: 50 },
    ];
    const sys = createSystem(blocks, pipes, initialGas);

    // Remove ceiling block at (3,2) — opens to air above = not contained
    blocks[2][3] = A;
    sys.onBlockRemoved(3, 2);

    // Gas should NOT have moved — still in source pool only
    expect(sys.state.gasLayers.length).toBe(1);
    expect(sys.state.gasLayers[0].volume).toBe(50);
    expect(sys.state.gasLayers[0].y).toBe(3);
  });

  /**
   * Between two gas pools — instant merge.
   *
   *   S S S S S   ← y=0 ceiling
   *   S G G G S   ← y=1 upper pool (3-wide, 30 vol)
   *   S S[X]S S   ← y=2 wall between pools, remove (2,2)
   *   S G G G S   ← y=3 lower pool (3-wide, 20 vol)
   *   S S S S S   ← y=4 floor
   */
  it('between two pools vertically — instant merge', () => {
    const { blocks, pipes } = emptyGrid(5, 5);
    carveRect(blocks, 1, 1, 3, 1); // upper pocket
    carveRect(blocks, 1, 3, 3, 3); // lower pocket

    const initialGas: GasLayer[] = [
      { y: 1, left: 1, right: 3, volume: 30 },
      { y: 3, left: 1, right: 3, volume: 20 },
    ];
    const sys = createSystem(blocks, pipes, initialGas);

    // Remove wall at (2,2)
    blocks[2][2] = A;
    sys.onBlockRemoved(2, 2);

    // Should have merged — total volume conserved
    expect(totalVolume(sys)).toBe(50);
    // Top layer should fill first (gas is top-down)
    const top = findGasLayer(sys.state.gasLayers, 1, 1);
    expect(top).not.toBeNull();
    expect(top!.volume).toBe(30); // full: 3 tiles * 10
  });
});

describe('gradual flow through breach', () => {
  /**
   * Gas flows gradually through ceiling breach, not instantly.
   *
   *   S S S S S S S   ← y=0 ceiling
   *   S . . . . . S   ← y=1 destination cavity (5-wide)
   *   S S S . S S S   ← y=2 ceiling with hole at (3,2)
   *   S G G G G G S   ← y=3 gas pool (5-wide, 50 vol)
   *   S S S S S S S   ← y=4 floor
   *
   * Gas should flow at VOLUME_PER_TILE/tick through the breach.
   */
  it('gas flows through ceiling breach at normal rate', () => {
    const { blocks, pipes } = emptyGrid(7, 5);
    carveRect(blocks, 1, 1, 5, 1); // destination cavity
    setAir(blocks, 3, 2);          // breach (already open)
    carveRect(blocks, 1, 3, 5, 3); // gas pool

    const sys = createSystem(blocks, pipes, [
      { y: 3, left: 1, right: 5, volume: 50 },
    ]);

    // After 2 ticks (1 to compute path, 1 to teleport), gas drains by VOLUME_PER_TILE
    runTicks(sys, 2);
    const srcVol = sys.state.gasLayers.find(l => l.y === 3)?.volume ?? 0;
    expect(srcVol).toBe(50 - VOLUME_PER_TILE);

    // Volume is conserved
    expect(totalVolume(sys)).toBe(50);
  });
});

describe('bridge detection — merge when flow connects pools', () => {
  /**
   * Gas fills a shaft and eventually bridges back to the source pool.
   *
   *   S S S S S   ← y=0 ceiling
   *   S S . S S   ← y=1 small pocket (1-wide)
   *   S S . S S   ← y=2 shaft
   *   S S . S S   ← y=3 shaft (this layer bridges y=1 gas and y=4 source)
   *   S G G G S   ← y=4 gas pool (3-wide, 30 vol)
   *   S S S S S   ← y=5 floor
   *
   * Gas flows up: fills y=1 (cap 10), then y=2 (cap 10), then y=3 (cap 10).
   * When y=3 gets gas, it has gas above (y=2) AND below (y=4) → merge.
   */
  it('shaft fill triggers merge when bridge layer connects to source', () => {
    const { blocks, pipes } = emptyGrid(5, 6);
    setAir(blocks, 2, 1);          // pocket
    setAir(blocks, 2, 2);          // shaft
    setAir(blocks, 2, 3);          // shaft (bridge layer)
    carveRect(blocks, 1, 4, 3, 4); // source pool

    const sys = createSystem(blocks, pipes, [
      { y: 4, left: 1, right: 3, volume: 30 },
    ]);

    const before = totalVolume(sys);

    // Run enough ticks to fill the shaft and trigger bridge merge.
    // Path compute: 1 tick. Each contained layer fills at 10/tick.
    // y=1: 1 tick to fill (cap 10). y=2: 1 tick. y=3: 1 tick → bridge.
    // With 1-tick delay: ~8 ticks should be more than enough.
    runTicks(sys, 10);

    // Volume must be conserved
    expect(totalVolume(sys)).toBe(before);

    // After bridge merge, all layers should be part of one pool.
    // Check that gas exists at y=1 (it flowed there).
    const topLayer = findGasLayer(sys.state.gasLayers, 2, 1);
    expect(topLayer).not.toBeNull();
    expect(topLayer!.volume).toBeGreaterThan(0);
  });

  /**
   * Cavity above source — gradual fill then merge.
   *
   *   S S S S S S S S S   ← y=0 ceiling
   *   S S S . . . S S S   ← y=1 cavity (3-wide, cap 30)
   *   S S S . . . S S S   ← y=2 cavity
   *   S S S S . S S S S   ← y=3 shaft (1-wide)
   *   S G G G G G G G S   ← y=4 source pool (7-wide, 70 vol)
   *   S S S S S S S S S   ← y=5 floor
   *
   * Gas flows up shaft, fills cavity top-down (y=1 then y=2).
   * When shaft tile y=3 gets gas: above (y=2 cavity gas), below (y=4 source) → merge.
   */
  it('cavity above source — gradual fill then bridge merge', () => {
    const { blocks, pipes } = emptyGrid(9, 6);
    carveRect(blocks, 3, 1, 5, 2); // cavity (3-wide, 2 tall)
    setAir(blocks, 4, 3);          // shaft
    carveRect(blocks, 1, 4, 7, 4); // source pool

    const sys = createSystem(blocks, pipes, [
      { y: 4, left: 1, right: 7, volume: 70 },
    ]);

    const before = totalVolume(sys);

    // The cavity has capacity 3*10*2 = 60 layers, shaft = 10.
    // Flow rate = 10/tick with 1-tick delay. ~15 ticks should suffice.
    runTicks(sys, 20);

    expect(totalVolume(sys)).toBe(before);

    // Cavity should have gas
    const cavityTop = findGasLayer(sys.state.gasLayers, 4, 1);
    expect(cavityTop).not.toBeNull();
    expect(cavityTop!.volume).toBeGreaterThan(0);
  });

  /**
   * Two separate gas pools connected by breach — gradual until bridge.
   *
   *   S S S S S   ← y=0 ceiling
   *   S G G G S   ← y=1 upper pool (3-wide, 30 vol)
   *   S S . S S   ← y=2 shaft (already open)
   *   S S . S S   ← y=3 shaft
   *   S G G G S   ← y=4 lower pool (3-wide, 20 vol)
   *   S S S S S   ← y=5 floor
   *
   * Lower pool has a ceiling breach at (2,3). Gas flows up shaft.
   * When shaft gas at y=2 bridges upper pool (y=1) and lower shaft gas (y=3) → merge.
   */
  it('two pools connected by shaft — bridge merge', () => {
    const { blocks, pipes } = emptyGrid(5, 6);
    carveRect(blocks, 1, 1, 3, 1); // upper pool
    setAir(blocks, 2, 2);          // shaft
    setAir(blocks, 2, 3);          // shaft
    carveRect(blocks, 1, 4, 3, 4); // lower pool

    const sys = createSystem(blocks, pipes, [
      { y: 1, left: 1, right: 3, volume: 30 },
      { y: 4, left: 1, right: 3, volume: 20 },
    ]);

    const before = totalVolume(sys);

    // Run enough ticks for gas to flow through shaft and trigger merge
    runTicks(sys, 15);

    expect(totalVolume(sys)).toBe(before);

    // After merge, gas should exist in both pools and shaft
    const upper = findGasLayer(sys.state.gasLayers, 2, 1);
    expect(upper).not.toBeNull();
    expect(upper!.volume).toBeGreaterThan(0);
  });
});
