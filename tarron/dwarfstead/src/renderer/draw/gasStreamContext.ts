/**
 * Gas stream context — pre-computes per-node classification and active pipe arms
 * for context-aware gas stream rendering.
 *
 * Mirror of streamContext.ts with inverted direction logic:
 * - "down" and "up" swap roles for classifications
 * - Gas rises, so cliff-edge = horizontal → up, landing = vertical → horizontal (from above)
 */

import { Direction } from '../../sim/types';
import type { GasSimState, GasPath, PathBranch, PathNode } from '../../sim/gas/types';
import { findGasLayer, VOLUME_PER_TILE } from '../../sim/gas/gasLayer';
import type { GasLayer } from '../../sim/gas/types';
import { pipeNeighborDirs } from '../../sim/water/pipeNetwork';

export type GasNodeClass =
  | 'horizontal'
  | 'vertical'
  | 'corner'
  | 'cliff-edge'  // gas lifts off from floor → rises
  | 'landing'     // gas hits ceiling from below
  | 'pool-entry'
  | 'source';

export interface GasClassifiedNode {
  x: number;
  y: number;
  cls: GasNodeClass;
  prevDir: Direction | null;
  nextDir: Direction | null;
  pipeExit?: boolean;
  chipDir?: 'left' | 'right' | 'both';
  dual?: boolean;
  innerCurve?: 'left' | 'right' | 'both';
}

export interface GasStreamContext {
  classifiedBranches: GasClassifiedNode[][];
  activePipeArms: Map<string, Set<Direction>>;
}

function dirBetween(ax: number, ay: number, bx: number, by: number): Direction | null {
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === -1) return Direction.Up;
  if (dx === 0 && dy === 1) return Direction.Down;
  if (dx === -1 && dy === 0) return Direction.Left;
  if (dx === 1 && dy === 0) return Direction.Right;
  return null;
}

function oppositeDir(dir: Direction): Direction {
  switch (dir) {
    case Direction.Up: return Direction.Down;
    case Direction.Down: return Direction.Up;
    case Direction.Left: return Direction.Right;
    case Direction.Right: return Direction.Left;
  }
}

function isHorizontal(dir: Direction | null): boolean {
  return dir === Direction.Left || dir === Direction.Right;
}

function isVertical(dir: Direction | null): boolean {
  return dir === Direction.Up || dir === Direction.Down;
}

/**
 * Classify air nodes in a gas branch for stream shape rendering.
 * Inverted from water: cliff-edge = horizontal→Up, landing = vertical→horizontal (from below ceiling).
 */
function classifyGasBranch(branch: PathBranch): GasClassifiedNode[] {
  const result: GasClassifiedNode[] = [];

  let airStart = 0;
  while (airStart < branch.nodes.length && branch.nodes[airStart].inPipe) airStart++;

  let pipeExitIndex = -1;
  if (airStart > 0 && airStart < branch.nodes.length) {
    const lastPipe = branch.nodes[airStart - 1];
    const firstAir = branch.nodes[airStart];
    if (lastPipe.x === firstAir.x && lastPipe.y === firstAir.y) {
      pipeExitIndex = 0;
    }
  }

  const airNodes: PathNode[] = [];
  for (let i = airStart; i < branch.nodes.length; i++) {
    if (!branch.nodes[i].inPipe) airNodes.push(branch.nodes[i]);
  }

  if (airNodes.length === 0) return result;

  for (let i = 0; i < airNodes.length; i++) {
    const node = airNodes[i];
    const prev = i > 0 ? airNodes[i - 1] : null;
    const next = i < airNodes.length - 1 ? airNodes[i + 1] : null;

    const prevDir = prev ? dirBetween(prev.x, prev.y, node.x, node.y) : null;
    const nextDir = next ? dirBetween(node.x, node.y, next.x, next.y) : null;

    let cls: GasNodeClass;

    if (i === airNodes.length - 1 && branch.destination &&
        node.x === branch.destination.x && node.y === branch.destination.y) {
      cls = 'pool-entry';
    } else if (i === 0) {
      // Pipe exit going horizontal → landing (column from pipe meets ribbon)
      cls = (pipeExitIndex === 0 && isHorizontal(nextDir)) ? 'landing' : 'source';
    } else if (isHorizontal(prevDir) && nextDir === Direction.Up) {
      // Gas version: cliff-edge when going UP (instead of down)
      cls = 'cliff-edge';
    } else if (isVertical(prevDir) && (isHorizontal(nextDir) || nextDir === null)) {
      cls = 'landing';
    } else if (isHorizontal(prevDir) && isHorizontal(nextDir)) {
      cls = 'horizontal';
    } else if (isHorizontal(prevDir) && !isHorizontal(nextDir)) {
      cls = 'corner';
    } else if (isVertical(prevDir) && isVertical(nextDir)) {
      cls = 'vertical';
    } else if (!isHorizontal(prevDir) && isHorizontal(nextDir)) {
      cls = 'corner';
    } else if (prevDir === null && isHorizontal(nextDir)) {
      cls = 'horizontal';
    } else if (prevDir === null && isVertical(nextDir)) {
      cls = 'vertical';
    } else {
      cls = 'vertical';
    }

    const classified: GasClassifiedNode = { x: node.x, y: node.y, cls, prevDir, nextDir };
    if (i === pipeExitIndex) {
      classified.pipeExit = true;
      // Set vertical prevDir for pipe-exit landings so merge logic works
      if (cls === 'landing') classified.prevDir = Direction.Up;
    }

    if (cls === 'vertical' && i > 0) {
      const prevNode = result[result.length - 1];
      if (prevNode.cls === 'corner' || prevNode.cls === 'cliff-edge') {
        if (prevNode.prevDir === Direction.Right) classified.chipDir = 'left';
        else if (prevNode.prevDir === Direction.Left) classified.chipDir = 'right';
      }
    }

    if ((cls === 'landing' || cls === 'pool-entry') && i > 0) {
      const prevNode = result[result.length - 1];
      if (prevNode.cls === 'cliff-edge') {
        if (prevNode.dual) {
          classified.innerCurve = 'both';
        } else if (prevNode.prevDir === Direction.Right) {
          classified.innerCurve = 'left';
        } else if (prevNode.prevDir === Direction.Left) {
          classified.innerCurve = 'right';
        } else {
          classified.innerCurve = 'both';
        }
      }
    }

    result.push(classified);
  }

  return result;
}

function buildGasActivePipeArms(state: GasSimState, paths: GasPath[]): Map<string, Set<Direction>> {
  const arms = new Map<string, Set<Direction>>();

  function addArm(x: number, y: number, dir: Direction): void {
    const key = `${x},${y}`;
    let set = arms.get(key);
    if (!set) { set = new Set(); arms.set(key, set); }
    set.add(dir);
  }

  for (const path of paths) {
    for (const branch of path.branches) {
      const pipeNodes: PathNode[] = [];
      for (const node of branch.nodes) {
        if (node.inPipe) pipeNodes.push(node);
      }

      for (let i = 0; i < pipeNodes.length - 1; i++) {
        const a = pipeNodes[i];
        const b = pipeNodes[i + 1];
        const dirAB = dirBetween(a.x, a.y, b.x, b.y);
        if (dirAB) {
          addArm(a.x, a.y, dirAB);
          addArm(b.x, b.y, oppositeDir(dirAB));
        }
      }

      if (pipeNodes.length > 0) {
        const first = pipeNodes[0];
        if (first.x === path.exitX && first.y === path.exitY) {
          const dy = path.exitY - path.sourceLayerY;
          const dx = path.exitX - path.sourceX;
          const entryDir: Direction = Math.abs(dy) >= Math.abs(dx)
            ? (dy > 0 ? Direction.Up : Direction.Down)
            : (dx > 0 ? Direction.Left : Direction.Right);
          addArm(first.x, first.y, entryDir);
        }
      }

      if (pipeNodes.length > 0) {
        const last = pipeNodes[pipeNodes.length - 1];
        let firstAirAfterPipe: PathNode | null = null;
        let inPipeSection = false;
        for (const node of branch.nodes) {
          if (node.inPipe) { inPipeSection = true; continue; }
          if (inPipeSection) { firstAirAfterPipe = node; break; }
        }
        if (firstAirAfterPipe) {
          const exitDir = dirBetween(last.x, last.y, firstAirAfterPipe.x, firstAirAfterPipe.y);
          if (exitDir) addArm(last.x, last.y, exitDir);
        }
      }
    }
  }

  return arms;
}

function isGasPathActive(path: GasPath, gasLayers: GasLayer[]): boolean {
  const sourceLayer = findGasLayer(gasLayers, path.sourceX, path.sourceLayerY);
  if (!sourceLayer || sourceLayer.volume <= 0) return false;
  for (const branch of path.branches) {
    if (!branch.destination) continue;
    const destLayer = findGasLayer(gasLayers, branch.destination.x, branch.destination.y);
    if (!destLayer) return true;
    const width = destLayer.right - destLayer.left + 1;
    if (destLayer.volume < width * VOLUME_PER_TILE) return true;
  }
  return false;
}

/** Collect pipe tiles that actively carry gas (appear as pipe nodes in branches). */
function buildGasActivePipeTiles(state: GasSimState, paths: GasPath[]): Set<string> {
  const tiles = new Set<string>();
  for (const path of paths) {
    for (const branch of path.branches) {
      for (const node of branch.nodes) {
        if (node.inPipe) tiles.add(`${node.x},${node.y}`);
      }
    }
  }
  return tiles;
}

/** Add pool-entry nodes for pipe terminals submerged in gas pools with active flow. */
function addSubmergedGasTerminals(
  state: GasSimState, activePipeTiles: Set<string>,
  branches: GasClassifiedNode[][],
): void {
  const ph = state.pipes.length;
  const pw = ph > 0 ? state.pipes[0].length : 0;
  for (let wy = 0; wy < ph; wy++) {
    for (let wx = 0; wx < pw; wx++) {
      if (!state.pipes[wy][wx]) continue;
      if (!activePipeTiles.has(`${wx},${wy}`)) continue;
      const neighbors = pipeNeighborDirs(state.pipes, wx, wy, pw, ph, state.pumps);
      if (neighbors.length >= 2) continue;
      const layer = findGasLayer(state.gasLayers, wx, wy);
      if (!layer || layer.volume <= 0) continue;
      branches.push([{
        x: wx, y: wy, cls: 'pool-entry',
        prevDir: Direction.Up, nextDir: null, pipeExit: true,
      }]);
    }
  }
}

export function buildGasStreamContext(state: GasSimState): GasStreamContext {
  const classifiedBranches: GasClassifiedNode[][] = [];
  const activePaths = state.paths.filter(p => isGasPathActive(p, state.gasLayers));

  for (const path of activePaths) {
    for (const branch of path.branches) {
      const classified = classifyGasBranch(branch);
      if (classified.length > 0) classifiedBranches.push(classified);
    }
  }

  const activePipeArms = buildGasActivePipeArms(state, activePaths);
  const activePipeTiles = buildGasActivePipeTiles(state, activePaths);
  addSubmergedGasTerminals(state, activePipeTiles, classifiedBranches);

  return { classifiedBranches, activePipeArms };
}
