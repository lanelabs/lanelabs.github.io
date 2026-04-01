/**
 * Stream context — pre-computes per-node classification and active pipe arms
 * for context-aware water stream rendering.
 *
 * Pure data layer: no Phaser imports, no drawing.
 */

import { Direction } from '../../sim/types';
import type { WaterSimState, WaterPath, PathBranch, PathNode } from '../../sim/water/types';
import { findLayer, VOLUME_PER_TILE } from '../../sim/water/waterLayer';
import type { WaterLayer } from '../../sim/water/waterLayer';
import { pipeNeighborDirs } from '../../sim/water/pipeNetwork';

export type NodeClass =
  | 'horizontal'
  | 'vertical'
  | 'corner'
  | 'cliff-edge'
  | 'landing'
  | 'pool-entry'
  | 'source';

export interface ClassifiedNode {
  x: number;
  y: number;
  cls: NodeClass;
  prevDir: Direction | null;
  nextDir: Direction | null;
  /** True when this node is at the pipe-exit tile (draw from mid-tile down). */
  pipeExit?: boolean;
  /** Side(s) to draw a rounded chip on (tile below a corner/cliff-edge). */
  chipDir?: 'left' | 'right' | 'both';
  /** True when two branches merge at this tile (e.g. T-junction cliff-edge). */
  dual?: boolean;
  /** Which side(s) the cliff arc is on when this tile follows a cliff-edge. */
  innerCurve?: 'left' | 'right' | 'both';
}

export interface StreamContext {
  classifiedBranches: ClassifiedNode[][];
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

/** Classify air nodes in a branch for stream shape rendering. */
function classifyBranch(branch: PathBranch): ClassifiedNode[] {
  const result: ClassifiedNode[] = [];

  // Find where air nodes start — skip pipe-exit duplicate
  let airStart = 0;
  while (airStart < branch.nodes.length && branch.nodes[airStart].inPipe) {
    airStart++;
  }

  // If the first air node shares position with the last pipe node, flag it
  // so the renderer draws only the bottom half (avoids extending above pipe).
  let pipeExitIndex = -1;
  if (airStart > 0 && airStart < branch.nodes.length) {
    const lastPipe = branch.nodes[airStart - 1];
    const firstAir = branch.nodes[airStart];
    if (lastPipe.x === firstAir.x && lastPipe.y === firstAir.y) {
      pipeExitIndex = 0; // index in airNodes array
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

    let cls: NodeClass;

    // Last node matching destination = pool-entry
    if (i === airNodes.length - 1 && branch.destination &&
        node.x === branch.destination.x && node.y === branch.destination.y) {
      cls = 'pool-entry';
    } else if (i === 0) {
      cls = 'source';
    } else if (isHorizontal(prevDir) && nextDir === Direction.Down) {
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
      cls = 'vertical'; // fallback for ambiguous cases
    }

    const classified: ClassifiedNode = { x: node.x, y: node.y, cls, prevDir, nextDir };
    if (i === pipeExitIndex) classified.pipeExit = true;

    // If this vertical node follows a corner/cliff-edge, mark which side gets a chip
    if (cls === 'vertical' && i > 0) {
      const prevNode = result[result.length - 1];
      if (prevNode.cls === 'corner' || prevNode.cls === 'cliff-edge') {
        if (prevNode.prevDir === Direction.Right) classified.chipDir = 'left';
        else if (prevNode.prevDir === Direction.Left) classified.chipDir = 'right';
      }
    }

    // If this landing/pool-entry follows a cliff-edge, record which side the arc is on
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

/** Build a map of active (water-flowing) pipe arms per tile. */
function buildActivePipeArms(state: WaterSimState, paths: WaterPath[]): Map<string, Set<Direction>> {
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

      // Consecutive pipe pairs — add direction between them
      for (let i = 0; i < pipeNodes.length - 1; i++) {
        const a = pipeNodes[i];
        const b = pipeNodes[i + 1];
        const dirAB = dirBetween(a.x, a.y, b.x, b.y);
        if (dirAB) {
          addArm(a.x, a.y, dirAB);
          addArm(b.x, b.y, oppositeDir(dirAB));
        }
      }

      // Entry transition: first pipe node ← direction from source
      if (pipeNodes.length > 0) {
        const first = pipeNodes[0];
        // The path's exitX/exitY is the pipe entrance tile
        // Entry comes from source side — compute direction from source toward pipe
        const srcDir = dirBetween(
          path.exitX, path.exitY,
          first.x, first.y,
        );
        // If first pipe node IS the exit tile, use source pool direction
        if (first.x === path.exitX && first.y === path.exitY) {
          // Direction from source toward pipe entrance
          const dy = path.exitY - path.sourceLayerY;
          const dx = path.exitX - path.sourceX;
          const entryDir: Direction = Math.abs(dy) >= Math.abs(dx)
            ? (dy > 0 ? Direction.Up : Direction.Down)
            : (dx > 0 ? Direction.Left : Direction.Right);
          addArm(first.x, first.y, entryDir);
        } else if (srcDir) {
          // first pipe node is NOT the exit tile — unusual but handle
          addArm(first.x, first.y, oppositeDir(srcDir));
        }
      }

      // Exit transition: last pipe node → direction toward air continuation
      if (pipeNodes.length > 0) {
        const last = pipeNodes[pipeNodes.length - 1];
        // Find first air node after pipe nodes
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

/** Collect pipe tiles that actively carry water (appear as pipe nodes in branches). */
function buildActivePipeTiles(state: WaterSimState, paths: WaterPath[]): Set<string> {
  const tiles = new Set<string>();
  for (const path of paths) {
    for (const branch of path.branches) {
      if (branch.nodes.length === 0) continue;
      for (const node of branch.nodes) {
        if (node.inPipe) tiles.add(`${node.x},${node.y}`);
      }
    }
  }
  return tiles;
}

/** Add pool-entry nodes for pipe terminals submerged in pool water with active flow. */
function addSubmergedTerminals(
  state: WaterSimState, activePipeTiles: Set<string>,
  branches: ClassifiedNode[][],
): void {
  const ph = state.pipes.length;
  const pw = ph > 0 ? state.pipes[0].length : 0;
  for (let wy = 0; wy < ph; wy++) {
    for (let wx = 0; wx < pw; wx++) {
      if (!state.pipes[wy][wx]) continue;
      if (!activePipeTiles.has(`${wx},${wy}`)) continue;
      const neighbors = pipeNeighborDirs(state.pipes, wx, wy, pw, ph, state.pumps);
      if (neighbors.length >= 2) continue;
      const layer = findLayer(state.waterLayers, wx, wy);
      if (!layer || layer.volume <= 0) continue;
      branches.push([{
        x: wx, y: wy, cls: 'pool-entry',
        prevDir: Direction.Down, nextDir: null, pipeExit: true,
      }]);
    }
  }
}

/** Check if a path can actually transfer water (source has water + destination can accept). */
function isPathActive(path: WaterPath, waterLayers: WaterLayer[]): boolean {
  const sourceLayer = findLayer(waterLayers, path.sourceX, path.sourceLayerY);
  if (!sourceLayer || sourceLayer.volume <= 0) return false;
  for (const branch of path.branches) {
    if (!branch.destination) continue;
    const destLayer = findLayer(waterLayers, branch.destination.x, branch.destination.y);
    if (!destLayer) return true;
    const width = destLayer.right - destLayer.left + 1;
    if (destLayer.volume < width * VOLUME_PER_TILE) return true;
  }
  return false;
}

/** Build the full stream context for one frame. */
export function buildStreamContext(state: WaterSimState): StreamContext {
  const classifiedBranches: ClassifiedNode[][] = [];
  const activePaths = state.paths.filter(p => isPathActive(p, state.waterLayers));

  for (const path of activePaths) {
    for (const branch of path.branches) {
      const classified = classifyBranch(branch);
      if (classified.length > 0) classifiedBranches.push(classified);
    }
  }

  const activePipeArms = buildActivePipeArms(state, activePaths);
  const activePipeTiles = buildActivePipeTiles(state, activePaths);
  addSubmergedTerminals(state, activePipeTiles, classifiedBranches);

  return { classifiedBranches, activePipeArms };
}
