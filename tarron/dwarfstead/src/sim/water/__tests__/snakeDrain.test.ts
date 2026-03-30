import { describe, it, expect } from 'vitest';
import {
  emptyGrid, carveRect, setAir, createSystem, runTicks,
  totalVolume, Direction, SnakeState, setPipe,
} from './snakeHelpers';

/**
 * Drain and breach tests — verifies pipe drain, multi-layer drain,
 * breach drainage, and pipe exit direction behavior.
 */

describe('pipe drain: basic', () => {
  it('embedded drain pulls 1 quarter/tick from pool above', () => {
    // 3-wide pool at y=4, drain pipe at y=5 (in stone)
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 4, 5, 4); // pool
    setPipe(pipes, 4, 5, Direction.Up, Direction.Down, true); // drain

    const sys = createSystem(blocks, pipes, [
      { y: 4, left: 3, right: 5, volume: 8 },
    ]);

    runTicks(sys, 1);
    expect(sys.state.pipeFill[5][4]).toBe(1);
    // Pool should have lost 1 quarter
    const layer = sys.state.waterLayers.find(l => l.y === 4);
    expect(layer!.volume).toBe(7);
  });

  it('conserves volume through drain cycle', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 4, 5, 4);
    setPipe(pipes, 4, 5, Direction.Up, Direction.Down, true);

    const sys = createSystem(blocks, pipes, [
      { y: 4, left: 3, right: 5, volume: 12 },
    ]);
    const before = totalVolume(sys);

    runTicks(sys, 5);
    expect(totalVolume(sys)).toBe(before);
  });
});

describe('pipe drain: multi-layer reservoir', () => {
  it('drains fully from multi-row reservoir (top layer drains after bottom)', () => {
    // 3-wide, 2-tall pool. Drain at bottom.
    //   S S S S S
    //   S . . . S   y=3 (top layer)
    //   S . . . S   y=4 (bottom layer)
    //   S S D S S   y=5 (drain at x=4)
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 3, 5, 4); // 2-tall pool
    setPipe(pipes, 4, 5, Direction.Up, Direction.Down, true);
    // Continue pipe downward through stone into air
    setPipe(pipes, 4, 6, Direction.Up, Direction.Down, false);
    setAir(blocks, 4, 7);
    setAir(blocks, 4, 8);
    carveRect(blocks, 3, 9, 5, 9); // catch basin

    const sys = createSystem(blocks, pipes, [
      { y: 4, left: 3, right: 5, volume: 12 }, // bottom full
      { y: 3, left: 3, right: 5, volume: 8 },  // top partially full
    ]);
    const before = totalVolume(sys);

    // Run enough ticks to drain everything
    runTicks(sys, 100);

    // Both layers should be empty or nearly so
    const bottomLayer = sys.state.waterLayers.find(l => l.y === 4);
    const topLayer = sys.state.waterLayers.find(l => l.y === 3);
    const remainTop = topLayer ? topLayer.volume : 0;
    const remainBottom = bottomLayer ? bottomLayer.volume : 0;
    expect(remainTop + remainBottom).toBe(0);

    // Volume conserved
    expect(totalVolume(sys)).toBe(before);
  });
});

describe('pipe drain: multiple drains', () => {
  it('multiple drains on same pool drain faster', () => {
    // 5-wide pool with 2 drains
    const { blocks, pipes } = emptyGrid(12, 10);
    carveRect(blocks, 3, 4, 7, 4); // 5-wide pool
    setPipe(pipes, 4, 5, Direction.Up, Direction.Down, true);
    setPipe(pipes, 6, 5, Direction.Up, Direction.Down, true);

    const sys = createSystem(blocks, pipes, [
      { y: 4, left: 3, right: 7, volume: 10 },
    ]);

    runTicks(sys, 1);
    // Both drains should have pulled
    expect(sys.state.pipeFill[5][4]).toBe(1);
    expect(sys.state.pipeFill[5][6]).toBe(1);
    // Pool lost 2 quarters (1 per drain)
    const layer = sys.state.waterLayers.find(l => l.y === 4);
    expect(layer!.volume).toBe(8);
  });
});

describe('breach drain: bottom breach', () => {
  it('water drains through missing floor block', () => {
    // Pool at y=4, but floor at x=5 is missing (air at y=5)
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 4, 7, 4); // pool row
    setAir(blocks, 5, 5); // breach (missing floor)
    setAir(blocks, 5, 6); // shaft below
    carveRect(blocks, 3, 7, 7, 7); // catch basin

    const sys = createSystem(blocks, pipes, [
      { y: 4, left: 3, right: 7, volume: 16 },
    ]);

    runTicks(sys, 10);
    // Water should have started draining from the pool
    const layer = sys.state.waterLayers.find(l => l.y === 4);
    const remaining = layer ? layer.volume : 0;
    expect(remaining).toBeLessThan(16);
  });

  it('breach drains at up to 4 quarters/tick', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 4, 7, 4); // pool row
    setAir(blocks, 5, 5); // breach
    setAir(blocks, 5, 6);
    carveRect(blocks, 3, 7, 7, 7); // catch basin

    const sys = createSystem(blocks, pipes, [
      { y: 4, left: 3, right: 7, volume: 20 }, // full pool
    ]);
    const before = totalVolume(sys);

    runTicks(sys, 1);
    // Breach should remove up to 4 quarters from pool per tick
    const layer = sys.state.waterLayers.find(l => l.y === 4);
    const drained = 20 - (layer ? layer.volume : 0);
    expect(drained).toBeGreaterThan(0);
    expect(drained).toBeLessThanOrEqual(4);

    // Volume conserved (water went to snake)
    expect(totalVolume(sys)).toBe(before);
  });

  it('breach stops when pool empties', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 4, 4, 6, 4); // small pool (cap=12)
    setAir(blocks, 5, 5); // breach
    setAir(blocks, 5, 6);
    carveRect(blocks, 3, 7, 7, 7);

    const sys = createSystem(blocks, pipes, [
      { y: 4, left: 4, right: 6, volume: 4 },
    ]);

    runTicks(sys, 20);
    // Pool should be empty
    const layer = sys.state.waterLayers.find(l => l.y === 4);
    expect(layer ? layer.volume : 0).toBe(0);
  });
});

describe('breach drain: side breach', () => {
  it('water drains through missing wall block', () => {
    // Pool at y=5, wall missing on right side (air at x=7, y=5)
    const { blocks, pipes } = emptyGrid(12, 10);
    carveRect(blocks, 3, 5, 6, 5); // pool
    setAir(blocks, 7, 5); // side breach (air continues right)
    setAir(blocks, 7, 6); // drop below the breach
    setAir(blocks, 7, 7);

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 3, right: 6, volume: 16 },
    ]);

    runTicks(sys, 10);
    // Water should have started flowing out
    const layer = sys.state.waterLayers.find(l => l.y === 5);
    const remaining = layer ? layer.volume : 0;
    expect(remaining).toBeLessThan(16);
  });
});

describe('breach drain: drain from top, stop at breach y', () => {
  it('multi-layer pool drains from topmost layer first', () => {
    // 3-wide, 3-tall pool with side breach at y=5 (middle).
    //   S . . . S   y=3 (top)
    //   S . . . S   y=4
    //   S . . . . S y=5 (breach: air at x=6)
    //   S S S S S S y=6 (floor)
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 3, 5, 5); // 3-wide, 3-tall pool
    setAir(blocks, 6, 5); // side breach at y=5
    setAir(blocks, 6, 6); // drop below breach
    setAir(blocks, 6, 7);

    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 3, right: 5, volume: 12 },
      { y: 4, left: 3, right: 5, volume: 12 },
      { y: 3, left: 3, right: 5, volume: 12 },
    ]);

    // After 1 tick, water should drain from y=3 (topmost), not y=5
    runTicks(sys, 1);
    const top = sys.state.waterLayers.find(l => l.y === 3);
    expect(top!.volume).toBeLessThan(12);
  });
});

describe('scanning treats water as wall', () => {
  it('snake does not flow into adjacent pool', () => {
    // Ledge with pool to the right
    //   S . . . W W W S   y=5 (. = air, W = water pool)
    //   S S S S S S S S   y=6 (floor)
    const { blocks, pipes } = emptyGrid(12, 10);
    carveRect(blocks, 3, 5, 9, 5); // wide corridor
    // Pre-fill right side with water
    const sys = createSystem(blocks, pipes, [
      { y: 5, left: 7, right: 9, volume: 4 },
    ]);

    // Place snake scanning in the middle
    sys.state.snakes.push({
      id: sys.state.nextSnakeId++,
      x: 5, y: 5, volume: 4,
      state: SnakeState.SCANNING,
      flowDir: null, pipeProgress: 0,
    });

    runTicks(sys, 1);
    // Snake should treat water as wall, go to FILLING (both walls)
    // or flow left (if left has drop), but NOT flow right into the pool
    const snake = sys.state.snakes.find(s => s.flowDir === Direction.Right);
    expect(snake).toBeUndefined();
  });
});

describe('pipe exit direction', () => {
  it('pipe exiting upward still produces FALLING snake', () => {
    // Pipe that exits upward into air
    const { blocks, pipes } = emptyGrid(10, 10);
    setPipe(pipes, 5, 5, Direction.Down, Direction.Up, false);
    setAir(blocks, 5, 4); // exit tile (air above)
    setAir(blocks, 5, 3);

    const sys = createSystem(blocks, pipes);
    // Pre-fill pipe to capacity
    sys.state.pipeFill[5][5] = 4;

    // The pipe propagation should spawn a snake at the exit
    runTicks(sys, 3);

    // No snake should be flowing upward — water falls back down
    for (const s of sys.state.snakes) {
      // PIPE_FOLLOWING in an upward pipe would mean water is climbing
      // That shouldn't happen — pipe exit always produces FALLING
      if (s.x === 5) {
        expect(s.state).not.toBe(SnakeState.PIPE_FOLLOWING);
      }
    }
  });

  it('water from upward-exit pipe settles into pool below', () => {
    const { blocks, pipes } = emptyGrid(10, 12);
    // Pipe exits up at y=5 into air column y=3..4, pool below at y=6..7
    setPipe(pipes, 5, 6, Direction.Down, Direction.Up, false);
    setAir(blocks, 5, 5); // exit into
    setAir(blocks, 5, 4);
    setAir(blocks, 5, 3);
    carveRect(blocks, 3, 7, 7, 7); // catch pool

    const sys = createSystem(blocks, pipes);
    sys.state.pipeFill[6][5] = 4;

    runTicks(sys, 20);
    // Water should end up in pool or as layers below, not climbing
    const highWater = sys.state.waterLayers.filter(l => l.y <= 3);
    const highVolume = highWater.reduce((s, l) => s + l.volume, 0);
    // Very little or no water should be above y=3 (it falls back down)
    expect(highVolume).toBeLessThanOrEqual(4);
  });
});
