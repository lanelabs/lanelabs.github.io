import { describe, it, expect } from 'vitest';
import {
  emptyGrid, carveRect, setAir, createSystem, runTicks,
  spawnSnake, totalVolume, SnakeState, Direction,
} from './snakeHelpers';

/**
 * State machine tests — verifies each SnakeState transition
 * per the spec algorithm section.
 */

describe('FALLING state', () => {
  it('moves down through open air', () => {
    // 10-wide, 10-tall grid with a vertical shaft at x=5
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 5, 1, 5, 7); // shaft from y=1 to y=7, floor at y=8

    const sys = createSystem(blocks, pipes);
    spawnSnake(sys, 5, 1, 4);

    runTicks(sys, 1);
    const snake = sys.state.snakes[0];
    expect(snake.y).toBe(2);
    expect(snake.state).toBe(SnakeState.FALLING);
  });

  it('transitions to SCANNING when hitting solid below', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 1, 7, 5); // room with floor at y=6

    const sys = createSystem(blocks, pipes);
    spawnSnake(sys, 5, 5, 4); // one tile above floor

    runTicks(sys, 1);
    const snake = sys.state.snakes[0];
    // Should have transitioned to SCANNING (and then possibly advanced further)
    expect(snake.state).not.toBe(SnakeState.FALLING);
  });

  it('enters pipe when pipe entrance is below', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    setAir(blocks, 5, 2); // air tile where snake starts
    // Pipe in stone at y=3 (entry from above)
    pipes[3][5] = { entry: Direction.Up, exit: Direction.Down, isDrain: false };

    const sys = createSystem(blocks, pipes);
    spawnSnake(sys, 5, 2, 4);

    runTicks(sys, 1);
    const snake = sys.state.snakes[0];
    expect(snake.state).toBe(SnakeState.PIPE_FOLLOWING);
    expect(snake.y).toBe(3);
  });

  it('does not enter drain pipe directly (pools above instead)', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 4, 2, 6, 4); // small room
    // Drain pipe at y=5 (below floor)
    pipes[5][5] = { entry: Direction.Up, exit: Direction.Down, isDrain: true };

    const sys = createSystem(blocks, pipes);
    spawnSnake(sys, 5, 2, 4);

    // Run enough ticks for snake to fall and land
    runTicks(sys, 10);
    // Snake should not be PIPE_FOLLOWING — drain is passive
    for (const s of sys.state.snakes) {
      expect(s.state).not.toBe(SnakeState.PIPE_FOLLOWING);
    }
  });

  it('conserves volume while falling', () => {
    const { blocks, pipes } = emptyGrid(10, 20);
    carveRect(blocks, 5, 1, 5, 17); // tall shaft

    const sys = createSystem(blocks, pipes);
    spawnSnake(sys, 5, 1, 8);
    const before = totalVolume(sys);

    runTicks(sys, 5);
    expect(totalVolume(sys)).toBe(before);
  });
});

describe('SCANNING state', () => {
  it('transitions to FILLING when both sides are walls', () => {
    // 3-wide room: walls at x=2 and x=6, air from x=3 to x=5 at y=5
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 5, 5, 5); // 3-wide room, floor at y=6

    const sys = createSystem(blocks, pipes);
    // Place snake directly in scanning position
    sys.state.snakes.push({
      id: sys.state.nextSnakeId++,
      x: 4, y: 5, volume: 8,
      state: SnakeState.SCANNING,
      flowDir: null, pipeProgress: 0,
    });

    runTicks(sys, 1);
    const snake = sys.state.snakes[0];
    expect(snake.state).toBe(SnakeState.FILLING);
  });

  it('transitions to FLOWING toward a drop (one wall, one drop)', () => {
    // Room with wall on left, drop on right
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 5, 7, 5); // wide room at y=5
    // Drop at x=7: air below
    setAir(blocks, 7, 6);

    const sys = createSystem(blocks, pipes);
    sys.state.snakes.push({
      id: sys.state.nextSnakeId++,
      x: 4, y: 5, volume: 4,
      state: SnakeState.SCANNING,
      flowDir: null, pipeProgress: 0,
    });

    runTicks(sys, 1);
    const snake = sys.state.snakes[0];
    expect(snake.state).toBe(SnakeState.FLOWING);
    expect(snake.flowDir).toBe(Direction.Right);
  });

  it('splits when two drops are found', () => {
    // Room with drops on both sides
    const { blocks, pipes } = emptyGrid(12, 10);
    carveRect(blocks, 3, 5, 8, 5); // wide room at y=5
    setAir(blocks, 3, 6); // left drop
    setAir(blocks, 8, 6); // right drop

    const sys = createSystem(blocks, pipes);
    sys.state.snakes.push({
      id: sys.state.nextSnakeId++,
      x: 5, y: 5, volume: 8,
      state: SnakeState.SCANNING,
      flowDir: null, pipeProgress: 0,
    });

    runTicks(sys, 1);
    // Should now have 2 snakes (original + split)
    expect(sys.state.snakes.length).toBe(2);
    const dirs = sys.state.snakes.map(s => s.flowDir).sort();
    expect(dirs).toContain(Direction.Left);
    expect(dirs).toContain(Direction.Right);
  });

  it('conserves volume during split', () => {
    const { blocks, pipes } = emptyGrid(12, 10);
    carveRect(blocks, 3, 5, 8, 5);
    setAir(blocks, 3, 6);
    setAir(blocks, 8, 6);

    const sys = createSystem(blocks, pipes);
    sys.state.snakes.push({
      id: sys.state.nextSnakeId++,
      x: 5, y: 5, volume: 8,
      state: SnakeState.SCANNING,
      flowDir: null, pipeProgress: 0,
    });
    const before = totalVolume(sys);

    runTicks(sys, 1);
    expect(totalVolume(sys)).toBe(before);
  });
});

describe('FLOWING state', () => {
  it('moves one tile per tick in flow direction', () => {
    const { blocks, pipes } = emptyGrid(12, 10);
    carveRect(blocks, 3, 5, 9, 5); // long corridor at y=5

    const sys = createSystem(blocks, pipes);
    sys.state.snakes.push({
      id: sys.state.nextSnakeId++,
      x: 5, y: 5, volume: 4,
      state: SnakeState.FLOWING,
      flowDir: Direction.Right,
      pipeProgress: 0,
    });

    runTicks(sys, 1);
    expect(sys.state.snakes[0].x).toBe(6);
  });

  it('transitions to FALLING when drop below', () => {
    const { blocks, pipes } = emptyGrid(12, 10);
    carveRect(blocks, 3, 5, 8, 5); // corridor
    setAir(blocks, 7, 6); // drop at x=7
    setAir(blocks, 7, 7);

    const sys = createSystem(blocks, pipes);
    sys.state.snakes.push({
      id: sys.state.nextSnakeId++,
      x: 6, y: 5, volume: 4,
      state: SnakeState.FLOWING,
      flowDir: Direction.Right,
      pipeProgress: 0,
    });

    runTicks(sys, 1);
    const snake = sys.state.snakes[0];
    expect(snake.x).toBe(7);
    expect(snake.state).toBe(SnakeState.FALLING);
  });

  it('transitions to FILLING when hitting wall', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 5, 5, 5); // short corridor, wall at x=6

    const sys = createSystem(blocks, pipes);
    sys.state.snakes.push({
      id: sys.state.nextSnakeId++,
      x: 5, y: 5, volume: 4,
      state: SnakeState.FLOWING,
      flowDir: Direction.Right,
      pipeProgress: 0,
    });

    runTicks(sys, 1);
    const snake = sys.state.snakes[0];
    expect(snake.state).toBe(SnakeState.FILLING);
  });
});

describe('FILLING state', () => {
  it('deposits water into pool layer', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 5, 5, 5); // 3-wide room

    const sys = createSystem(blocks, pipes);
    sys.state.snakes.push({
      id: sys.state.nextSnakeId++,
      x: 4, y: 5, volume: 8,
      state: SnakeState.FILLING,
      flowDir: null, pipeProgress: 0,
    });

    runTicks(sys, 1);
    // Should have deposited some water into the layer
    const layer = sys.state.waterLayers.find(l => l.y === 5);
    expect(layer).toBeDefined();
    expect(layer!.volume).toBeGreaterThan(0);
  });

  it('transitions to RISING when layer is full', () => {
    // 1-wide pool (capacity = 4 quarters)
    const { blocks, pipes } = emptyGrid(10, 10);
    setAir(blocks, 5, 5); // 1 tile room

    const sys = createSystem(blocks, pipes);
    sys.state.snakes.push({
      id: sys.state.nextSnakeId++,
      x: 5, y: 5, volume: 12,
      state: SnakeState.FILLING,
      flowDir: null, pipeProgress: 0,
    });

    // 1 tick deposits up to 4 quarters → fills 1-wide layer (cap=4)
    runTicks(sys, 1);
    const snake = sys.state.snakes[0];
    expect(snake.state).toBe(SnakeState.RISING);
  });

  it('snake becomes DONE when volume depleted', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 5, 7, 5); // 5-wide room (cap=20)

    const sys = createSystem(blocks, pipes);
    sys.state.snakes.push({
      id: sys.state.nextSnakeId++,
      x: 5, y: 5, volume: 4,
      state: SnakeState.FILLING,
      flowDir: null, pipeProgress: 0,
    });

    runTicks(sys, 2);
    // Snake should be done (4 quarters deposited, room has space)
    expect(sys.state.snakes.length).toBe(0); // cleaned up
  });

  it('conserves volume during fill', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 5, 5, 5);

    const sys = createSystem(blocks, pipes);
    sys.state.snakes.push({
      id: sys.state.nextSnakeId++,
      x: 4, y: 5, volume: 8,
      state: SnakeState.FILLING,
      flowDir: null, pipeProgress: 0,
    });
    const before = totalVolume(sys);

    runTicks(sys, 3);
    expect(totalVolume(sys)).toBe(before);
  });
});

describe('RISING state', () => {
  it('finds overflow and transitions out of RISING', () => {
    // Pool (x=3..5, y=5..6) with air above (y=4) and overflow shaft at x=6
    //   SSSSSSSSSS
    //   SSS....SSS  y=4 (air x=3..6; overflow path right)
    //   SSS...SSSS  y=5 (pool top x=3..5; wall at x=6)
    //   SSS...SSSS  y=6 (pool bottom x=3..5)
    //   SSSSSSSSSS  y=7 (floor)
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 5, 5, 6); // pool: 3-wide, 2-tall
    carveRect(blocks, 3, 4, 6, 4); // air above pool + overflow tile at x=6
    setAir(blocks, 6, 5); // shaft below overflow (drop point)
    setAir(blocks, 6, 6);

    const sys = createSystem(blocks, pipes);
    // Fill both pool layers fully
    sys.state.waterLayers.push({ y: 6, left: 3, right: 5, volume: 12 });
    sys.state.waterLayers.push({ y: 5, left: 3, right: 5, volume: 12 });

    sys.state.snakes.push({
      id: sys.state.nextSnakeId++,
      x: 4, y: 5, volume: 8,
      state: SnakeState.RISING,
      flowDir: null, pipeProgress: 0,
    });

    runTicks(sys, 5);
    // Snake should have found overflow and left RISING state
    const active = sys.state.snakes.filter(s => s.state !== SnakeState.DONE);
    for (const snake of active) {
      expect(snake.state).not.toBe(SnakeState.RISING);
    }
  });

  it('conserves volume while rising', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    carveRect(blocks, 3, 3, 5, 5); // 3-wide, 3-tall room
    setAir(blocks, 6, 3); // overflow at top

    const sys = createSystem(blocks, pipes);
    sys.state.snakes.push({
      id: sys.state.nextSnakeId++,
      x: 4, y: 5, volume: 40,
      state: SnakeState.FILLING,
      flowDir: null, pipeProgress: 0,
    });
    const before = totalVolume(sys);

    runTicks(sys, 20);
    expect(totalVolume(sys)).toBe(before);
  });
});

describe('PIPE_FOLLOWING state', () => {
  it('adds 1 quarter per tick to pipe fill', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    setAir(blocks, 5, 2); // entrance air
    pipes[3][5] = { entry: Direction.Up, exit: Direction.Down, isDrain: false };

    const sys = createSystem(blocks, pipes);
    sys.state.snakes.push({
      id: sys.state.nextSnakeId++,
      x: 5, y: 3, volume: 8,
      state: SnakeState.PIPE_FOLLOWING,
      flowDir: null, pipeProgress: 0,
    });

    runTicks(sys, 1);
    expect(sys.state.pipeFill[3][5]).toBe(1);
  });

  it('exits pipe into FALLING state', () => {
    const { blocks, pipes } = emptyGrid(10, 10);
    // Pipe at y=3, exits down into air at y=4
    pipes[3][5] = { entry: Direction.Up, exit: Direction.Down, isDrain: false };
    setAir(blocks, 5, 4);
    setAir(blocks, 5, 5);

    const sys = createSystem(blocks, pipes);
    sys.state.snakes.push({
      id: sys.state.nextSnakeId++,
      x: 5, y: 3, volume: 8,
      state: SnakeState.PIPE_FOLLOWING,
      flowDir: null, pipeProgress: 0,
    });

    // Run enough ticks to fill pipe segment (4 quarters) and exit
    runTicks(sys, 5);
    const active = sys.state.snakes.filter(s => s.state !== SnakeState.DONE);
    // Should have exited pipe and be falling or further
    if (active.length > 0) {
      expect(active[0].state).not.toBe(SnakeState.PIPE_FOLLOWING);
    }
  });
});

describe('volume conservation (end-to-end)', () => {
  it('total volume unchanged after full flow cycle', () => {
    // Complex scenario: fall, scan, flow, fill
    const { blocks, pipes } = emptyGrid(15, 15);
    // Upper shaft
    carveRect(blocks, 7, 1, 7, 5);
    // Lower room
    carveRect(blocks, 4, 6, 10, 8);

    const sys = createSystem(blocks, pipes);
    spawnSnake(sys, 7, 1, 20);
    const before = totalVolume(sys);

    runTicks(sys, 30);
    expect(totalVolume(sys)).toBe(before);
  });

  it('total volume unchanged through overflow scenario', () => {
    const { blocks, pipes } = emptyGrid(15, 15);
    // Small room that overflows into larger room
    carveRect(blocks, 5, 3, 7, 5); // 3x3 room (cap per layer = 12)
    setAir(blocks, 8, 3); // overflow right
    carveRect(blocks, 8, 4, 12, 8); // larger destination

    const sys = createSystem(blocks, pipes);
    spawnSnake(sys, 6, 3, 60); // enough to overflow
    const before = totalVolume(sys);

    runTicks(sys, 50);
    expect(totalVolume(sys)).toBe(before);
  });
});
