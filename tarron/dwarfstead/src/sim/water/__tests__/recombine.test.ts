import { describe, it, expect } from 'vitest';
import {
  emptyGrid, carveRect, A,
  createSystem,
} from './pathHelpers';
import { addWater, findLayer } from '../waterLayer';
import { recombineAtTile, collectOverlappingLayers, scanPoolShape } from '../recombine';
import type { WaterLayer } from '../waterLayer';

describe('recombine', () => {
  /**
   * Layout (8 wide, 5 tall):
   *   S S S S S S S S
   *   S A A S A A S S    ← two 2-wide pools separated by wall at x=3
   *   S S S S S S S S
   *   S S S S S S S S
   *   S S S S S S S S
   *
   * Remove the wall at (3,1) → pools merge into one 4-wide layer.
   */
  it('horizontal merge — wall between two pools removed', () => {
    const { blocks } = emptyGrid(8, 5);
    // Left pool: x=1..2, y=1
    carveRect(blocks, 1, 1, 2, 1);
    // Right pool: x=4..5, y=1
    carveRect(blocks, 4, 1, 5, 1);

    const waterLayers: WaterLayer[] = [];
    const w = 8, h = 5;
    addWater(waterLayers, blocks, 1, 1, 20, w, h); // 2 tiles * 10 = full
    addWater(waterLayers, blocks, 4, 1, 15, w, h); // partially filled

    expect(waterLayers.length).toBe(2);

    // Remove wall at (3,1)
    blocks[1][3] = A;
    const result = recombineAtTile(3, 1, waterLayers, blocks, w, h);

    expect(result).toBe(true);
    // Should now be a single layer at y=1 spanning x=1..5
    expect(waterLayers.length).toBe(1);
    expect(waterLayers[0].y).toBe(1);
    expect(waterLayers[0].left).toBe(1);
    expect(waterLayers[0].right).toBe(5);
    expect(waterLayers[0].volume).toBe(35); // 20 + 15
  });

  it('volume conservation — total unchanged after merge', () => {
    const { blocks } = emptyGrid(8, 5);
    carveRect(blocks, 1, 1, 2, 1);
    carveRect(blocks, 4, 1, 5, 1);

    const waterLayers: WaterLayer[] = [];
    const w = 8, h = 5;
    addWater(waterLayers, blocks, 1, 1, 18, w, h);
    addWater(waterLayers, blocks, 4, 1, 12, w, h);
    const volumeBefore = waterLayers.reduce((s, l) => s + l.volume, 0);

    blocks[1][3] = A;
    recombineAtTile(3, 1, waterLayers, blocks, w, h);

    const volumeAfter = waterLayers.reduce((s, l) => s + l.volume, 0);
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
    // Air run at y=0 from x=0..2 (world edge on left = not contained)
    carveRect(blocks, 0, 0, 2, 0);

    const waterLayers: WaterLayer[] = [];
    const w = 8, h = 3;
    addWater(waterLayers, blocks, 0, 0, 10, w, h);

    // Remove wall at (3,0) to extend the air run
    blocks[0][3] = A;
    const result = recombineAtTile(3, 0, waterLayers, blocks, w, h);

    expect(result).toBe(false);
  });

  it('no adjacent water returns false — dry block removal', () => {
    const { blocks, pipes } = emptyGrid(8, 5);
    carveRect(blocks, 1, 1, 2, 1);
    // No water placed

    const sys = createSystem(blocks, pipes);
    // Remove a wall at (3,1) — no adjacent water
    blocks[1][3] = A;
    sys.onBlockRemoved(3, 1);

    // Nothing should change
    expect(sys.state.waterLayers.length).toBe(0);
  });

  it('integration via onBlockRemoved — layers merged', () => {
    const { blocks, pipes } = emptyGrid(8, 5);
    carveRect(blocks, 1, 1, 2, 1);
    carveRect(blocks, 4, 1, 5, 1);

    const initialWater: WaterLayer[] = [
      { y: 1, left: 1, right: 2, volume: 20 },
      { y: 1, left: 4, right: 5, volume: 10 },
    ];
    const sys = createSystem(blocks, pipes, initialWater);

    expect(sys.state.waterLayers.length).toBe(2);

    // Remove dividing wall
    blocks[1][3] = A;
    sys.onBlockRemoved(3, 1);

    expect(sys.state.waterLayers.length).toBe(1);
    expect(sys.state.waterLayers[0].volume).toBe(30);
    expect(sys.state.waterLayers[0].left).toBe(1);
    expect(sys.state.waterLayers[0].right).toBe(5);
  });

  /**
   * Floor removal merge — vertical merge:
   *   S S S S S
   *   S A A S S   ← y=1, pool with 20 volume (full)
   *   S S S S S   ← y=2, floor (remove at x=1)
   *   S A A S S   ← y=3, pool with 15 volume
   *   S S S S S
   *
   * Remove floor at (1,2) → scanPoolShape finds all 3 rows,
   * water redistributes bottom-up.
   */
  it('floor removal merge — redistributes bottom-up', () => {
    const { blocks } = emptyGrid(5, 5);
    // Upper pool: y=1, x=1..2
    carveRect(blocks, 1, 1, 2, 1);
    // Lower pool: y=3, x=1..2
    carveRect(blocks, 1, 3, 2, 3);

    const waterLayers: WaterLayer[] = [];
    const w = 5, h = 5;
    addWater(waterLayers, blocks, 1, 1, 20, w, h); // full upper
    addWater(waterLayers, blocks, 1, 3, 15, w, h); // partial lower

    expect(waterLayers.length).toBe(2);
    const volumeBefore = waterLayers.reduce((s, l) => s + l.volume, 0);

    // Remove floor at (1,2) — opens vertical connection
    // Only x=1 becomes air; x=2 at y=2 stays stone, so the
    // vertical shaft is 1 tile wide at y=2.
    blocks[2][1] = A;
    const result = recombineAtTile(1, 2, waterLayers, blocks, w, h);

    expect(result).toBe(true);
    const volumeAfter = waterLayers.reduce((s, l) => s + l.volume, 0);
    expect(volumeAfter).toBe(volumeBefore); // 35 total

    // Bottom layer (y=3) should fill first (capacity 20)
    const bottomLayer = findLayer(waterLayers, 1, 3);
    expect(bottomLayer).not.toBeNull();
    expect(bottomLayer!.volume).toBe(20); // 2 tiles * 10 = full
  });

  it('collectOverlappingLayers finds correct indices', () => {
    const { blocks } = emptyGrid(10, 5);
    carveRect(blocks, 1, 1, 8, 1);

    const waterLayers: WaterLayer[] = [
      { y: 1, left: 1, right: 3, volume: 10 },  // overlaps
      { y: 1, left: 5, right: 8, volume: 20 },  // overlaps
      { y: 2, left: 1, right: 3, volume: 5 },   // different y, no overlap
    ];

    const pool = scanPoolShape(1, 1, blocks, 10, 5);
    expect(pool).not.toBeNull();

    const indices = collectOverlappingLayers(pool!, waterLayers);
    expect(indices).toEqual([0, 1]);
  });
});
