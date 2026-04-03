/**
 * Pipe network utilities — connected components and terminal detection.
 *
 * Pipes are simple presence markers. Connectivity is by 4-way adjacency.
 * A "terminal" is a pipe tile with fewer than 2 pipe neighbors.
 * Terminals can be "open" (adjacent air) or "capped" (all non-pipe sides solid).
 */

import { BlockMaterial, Direction, DirectionVec } from '../types';
import type { PipeCell, PathNode, PumpCell } from './types';
import type { WaterLayer } from './waterLayer';

const ALL_DIRS: Direction[] = [Direction.Up, Direction.Down, Direction.Left, Direction.Right];
const HORIZONTAL: Direction[] = [Direction.Left, Direction.Right];

/** Whether a pipe exists at (x, y). */
export function isPipe(
  pipes: (PipeCell | null)[][], x: number, y: number, w: number, h: number,
): boolean {
  if (x < 0 || x >= w || y < 0 || y >= h) return false;
  return pipes[y][x] !== null;
}

/** Whether a pump exists at (x, y). */
export function hasPumpAt(pumps: PumpCell[], x: number, y: number): boolean {
  return pumps.some(p => p.x === x && p.y === y);
}

/**
 * Return directions toward adjacent pipe tiles.
 * When pumps are provided, horizontal connections are blocked if either
 * the current tile or the neighbor tile has a pump.
 */
export function pipeNeighborDirs(
  pipes: (PipeCell | null)[][], x: number, y: number, w: number, h: number,
  pumps?: PumpCell[],
): Direction[] {
  const result: Direction[] = [];
  const selfHasPump = pumps && hasPumpAt(pumps, x, y);
  for (const dir of ALL_DIRS) {
    const nx = x + DirectionVec[dir].x;
    const ny = y + DirectionVec[dir].y;
    if (!isPipe(pipes, nx, ny, w, h)) continue;
    // Pump tiles block horizontal connections on both sides
    if (pumps && HORIZONTAL.includes(dir)) {
      if (selfHasPump || hasPumpAt(pumps, nx, ny)) continue;
    }
    result.push(dir);
  }
  return result;
}

/** Opposite direction. */
export function oppositeDir(dir: Direction): Direction {
  switch (dir) {
    case Direction.Up: return Direction.Down;
    case Direction.Down: return Direction.Up;
    case Direction.Left: return Direction.Right;
    case Direction.Right: return Direction.Left;
  }
}

/**
 * Flood-fill pipe grid to assign network IDs.
 * Returns a 2D grid: 0 = no pipe, 1+ = network ID.
 */
export function buildNetworkGrid(
  pipes: (PipeCell | null)[][], w: number, h: number,
  pumps?: PumpCell[],
): number[][] {
  const grid: number[][] = [];
  for (let y = 0; y < h; y++) grid.push(new Array(w).fill(0));

  let nextId = 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!pipes[y][x] || grid[y][x] !== 0) continue;
      const queue: [number, number][] = [[x, y]];
      const id = nextId++;
      grid[y][x] = id;
      while (queue.length > 0) {
        const [cx, cy] = queue.shift()!;
        const selfHasPump = pumps && hasPumpAt(pumps, cx, cy);
        for (const dir of ALL_DIRS) {
          const nx = cx + DirectionVec[dir].x;
          const ny = cy + DirectionVec[dir].y;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
          if (!pipes[ny][nx] || grid[ny][nx] !== 0) continue;
          // Pump tiles block horizontal connections
          if (pumps && HORIZONTAL.includes(dir)) {
            if (selfHasPump || hasPumpAt(pumps, nx, ny)) continue;
          }
          grid[ny][nx] = id;
          queue.push([nx, ny]);
        }
      }
    }
  }
  return grid;
}

/** A terminal of a pipe network. */
export interface PipeTerminal {
  x: number;
  y: number;
  networkId: number;
  /** Directions toward non-pipe air cells (valid for water flow). */
  airDirs: Direction[];
  /** Number of adjacent pipe neighbors. */
  pipeNeighborCount: number;
  /** If true, this terminal can only be an exit (never an entrance). Set by pump logic. */
  exitOnly?: boolean;
}

/**
 * Find all pipe terminals — pipes with fewer than 2 pipe neighbors.
 * Classifies each terminal's non-pipe sides as air or solid.
 */
export function findTerminals(
  pipes: (PipeCell | null)[][],
  blocks: BlockMaterial[][],
  w: number, h: number,
  networkGrid: number[][],
  pumps?: PumpCell[],
): PipeTerminal[] {
  const terminals: PipeTerminal[] = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!pipes[y][x]) continue;

      const neighbors = pipeNeighborDirs(pipes, x, y, w, h, pumps);
      if (neighbors.length >= 2) continue;

      // Terminal must be in air to interact with the world
      if (blocks[y][x] !== BlockMaterial.Air) continue;

      const airDirs: Direction[] = [];
      for (const dir of ALL_DIRS) {
        if (neighbors.includes(dir)) continue;
        const nx = x + DirectionVec[dir].x;
        const ny = y + DirectionVec[dir].y;
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        if (blocks[ny][nx] === BlockMaterial.Air) {
          airDirs.push(dir);
        }
      }

      terminals.push({
        x, y,
        networkId: networkGrid[y][x],
        airDirs,
        pipeNeighborCount: neighbors.length,
      });
    }
  }

  return terminals;
}

/**
 * Tag terminals reachable from the upward side of any pump as exit-only.
 * Walk upward through pipe adjacency from the pump tile; any terminal
 * reached is tagged exitOnly = true.
 */
export function tagPumpExitOnly(
  terminals: PipeTerminal[],
  pumps: PumpCell[],
  pipes: (PipeCell | null)[][],
  networkGrid: number[][],
  w: number, h: number,
): void {
  if (pumps.length === 0) return;

  // Build set of terminal positions for quick lookup
  const termByPos = new Map<string, PipeTerminal>();
  for (const t of terminals) termByPos.set(`${t.x},${t.y}`, t);

  for (const pump of pumps) {
    if (!isPipe(pipes, pump.x, pump.y, w, h)) continue;
    const pumpNetId = networkGrid[pump.y][pump.x];
    if (pumpNetId === 0) continue;

    // BFS from the directed side of the pump through pipe adjacency
    const visited = new Set<string>();
    const queue: [number, number][] = [];

    // Start from the tile on the pump's direction side
    const startY = pump.direction === 'up' ? pump.y - 1 : pump.y + 1;
    if (startY >= 0 && startY < h && isPipe(pipes, pump.x, startY, w, h)) {
      queue.push([pump.x, startY]);
      visited.add(`${pump.x},${startY}`);
    }

    while (queue.length > 0) {
      const [cx, cy] = queue.shift()!;
      const term = termByPos.get(`${cx},${cy}`);
      if (term && term.networkId === pumpNetId) {
        term.exitOnly = true;
      }
      const selfHasPump = hasPumpAt(pumps, cx, cy);
      for (const dir of ALL_DIRS) {
        const nx = cx + DirectionVec[dir].x;
        const ny = cy + DirectionVec[dir].y;
        // Don't walk back through/past the pump tile
        if (nx === pump.x && ny === pump.y) continue;
        // Pump tiles block horizontal connections
        if (HORIZONTAL.includes(dir)) {
          if (selfHasPump || hasPumpAt(pumps, nx, ny)) continue;
        }
        const key = `${nx},${ny}`;
        if (visited.has(key)) continue;
        if (!isPipe(pipes, nx, ny, w, h)) continue;
        if (networkGrid[ny][nx] !== pumpNetId) continue;
        visited.add(key);
        queue.push([nx, ny]);
      }
    }
  }
}

/** Result of tracing through a pipe network to an exit point. */
export interface PipeTraceResult {
  /** Pipe nodes along the route (for rendering). */
  nodes: PathNode[];
  /** Air tile adjacent to the exit terminal where water emerges. */
  exitX: number;
  exitY: number;
}

/**
 * Trace through a pipe network from an entrance terminal, finding all
 * exit points. Uses DFS through pipe adjacency.
 *
 * @param entryFromDir Direction we entered the pipe from (to avoid going back).
 *   For a terminal below a pool, this is Direction.Up (entered from above).
 */
export function tracePipeNetwork(
  startX: number, startY: number,
  entryFromDir: Direction,
  pipes: (PipeCell | null)[][],
  blocks: BlockMaterial[][],
  w: number, h: number,
  _waterLayers?: WaterLayer[],
  pumps?: PumpCell[],
): PipeTraceResult[] {
  const results: PipeTraceResult[] = [];
  const visited = new Set<string>();

  function dfs(
    x: number, y: number,
    fromDir: Direction | null,
    pathNodes: PathNode[],
  ): void {
    const key = `${x},${y}`;
    if (visited.has(key)) return;
    visited.add(key);

    pathNodes.push({ x, y, inPipe: true });

    // Find pipe neighbors excluding came-from direction
    const forward: Direction[] = [];
    const selfHasPump = pumps && hasPumpAt(pumps, x, y);
    for (const dir of ALL_DIRS) {
      if (dir === fromDir) continue;
      const nx = x + DirectionVec[dir].x;
      const ny = y + DirectionVec[dir].y;
      if (!isPipe(pipes, nx, ny, w, h)) continue;
      // Pump tiles block horizontal connections
      if (pumps && HORIZONTAL.includes(dir)) {
        if (selfHasPump || hasPumpAt(pumps, nx, ny)) continue;
      }
      forward.push(dir);
    }

    if (forward.length === 0) {
      // Terminal must be in air to create exits
      if (blocks[y][x] !== BlockMaterial.Air) return;

      // Check if terminal has any valid exit direction (sides or below, not up),
      // OR if the terminal tile itself is a contained basin (e.g. 1-wide cell).
      let hasExit = false;
      for (const dir of ALL_DIRS) {
        if (dir === fromDir) continue;
        if (dir === Direction.Up) continue;
        const nx = x + DirectionVec[dir].x;
        const ny = y + DirectionVec[dir].y;
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        if (blocks[ny][nx] !== BlockMaterial.Air) continue;
        if (isPipe(pipes, nx, ny, w, h)) continue;
        hasExit = true;
        break;
      }
      // Terminal tile itself is a contained basin (walled on all sides with solid floor)
      if (!hasExit) {
        const floorSolid = y + 1 >= h || blocks[y + 1][x] !== BlockMaterial.Air;
        const leftSolid = x - 1 < 0 || blocks[y][x - 1] !== BlockMaterial.Air || isPipe(pipes, x - 1, y, w, h);
        const rightSolid = x + 1 >= w || blocks[y][x + 1] !== BlockMaterial.Air || isPipe(pipes, x + 1, y, w, h);
        if (floorSolid && leftSolid && rightSolid) hasExit = true;
      }
      if (hasExit) {
        results.push({ nodes: [...pathNodes], exitX: x, exitY: y });
      }
      return;
    }

    if (forward.length === 1) {
      const dir = forward[0];
      const nx = x + DirectionVec[dir].x;
      const ny = y + DirectionVec[dir].y;
      dfs(nx, ny, oppositeDir(dir), pathNodes);
      return;
    }

    // Pipe junction — fork into each branch
    for (const dir of forward) {
      const nx = x + DirectionVec[dir].x;
      const ny = y + DirectionVec[dir].y;
      dfs(nx, ny, oppositeDir(dir), [...pathNodes]);
    }
  }

  dfs(startX, startY, entryFromDir, []);
  return results;
}
