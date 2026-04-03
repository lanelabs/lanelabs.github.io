/**
 * Unified liquid path trace — works for both water (dy=+1) and gas (dy=-1).
 *
 * Two modes:
 * - Air paths (terrain exits): fall/rise → scan → flow through air. Never enter pipes.
 * - Pipe paths: trace through pipe network by adjacency, then continue in air.
 *
 * Replaces the former water/pathTrace.ts and gas/gasPathTrace.ts.
 */

import { BlockMaterial, Direction } from './types';
import type { PathNode, PathBranch, PipeCell, PumpCell, LiquidContext } from './water/types';
import { tracePipeNetwork } from './water/pipeNetwork';

const MAX_ITERATIONS = 500;

function isSolid(blocks: BlockMaterial[][], x: number, y: number, w: number, h: number): boolean {
  if (x < 0 || x >= w || y < 0 || y >= h) return true;
  return blocks[y][x] !== BlockMaterial.Air;
}

function isBlocked(
  blocks: BlockMaterial[][], x: number, y: number, w: number, h: number,
  ctx: LiquidContext,
): boolean {
  if (isSolid(blocks, x, y, w, h)) return true;
  return ctx.isFull(x, y);
}

interface ScanResult {
  found: boolean;
  targetX: number;
}

/** Scan in a direction for a drop/rise (air in dy direction) or wall. */
function scanDirection(
  startX: number, startY: number, dx: number,
  blocks: BlockMaterial[][], w: number, h: number,
  ctx: LiquidContext,
): ScanResult {
  for (let x = startX + dx; x >= 0 && x < w; x += dx) {
    if (isSolid(blocks, x, startY, w, h)) return { found: false, targetX: x };
    if (ctx.getVolume(x, startY) > 0) return { found: false, targetX: x };
    // Check air in the gravity direction (down for water, up for gas)
    if (!isBlocked(blocks, x, startY + ctx.dy, w, h, ctx)) {
      return { found: true, targetX: x };
    }
  }
  return { found: false, targetX: startX };
}

/**
 * Trace a single air path branch. Never enters pipes.
 * Returns one or more branches (forks produce additional branches).
 */
function traceLiquidAir(
  startX: number, startY: number,
  blocks: BlockMaterial[][], w: number, h: number,
  volumeFraction: number, visited: Set<string>,
  ctx: LiquidContext,
): PathBranch[] {
  const nodes: PathNode[] = [];
  let x = startX;
  let y = startY;
  let iterations = 0;

  while (iterations++ < MAX_ITERATIONS) {
    const key = `${x},${y}`;
    if (visited.has(key)) {
      return [{ nodes, destination: null, volumeFraction }];
    }
    visited.add(key);

    if (x < 0 || x >= w || y < 0 || y >= h) {
      return [{ nodes, destination: null, volumeFraction }];
    }

    if (isSolid(blocks, x, y, w, h)) {
      return [{ nodes, destination: null, volumeFraction }];
    }

    if (ctx.isFull(x, y)) {
      return [{ nodes, destination: null, volumeFraction }];
    }

    // Existing pool = destination (stop at pool surface, include entry tile)
    const existingLayer = ctx.findLayer(x, y);
    if (existingLayer && existingLayer.volume > 0) {
      nodes.push({ x, y, inPipe: false });
      return [{ nodes, destination: { x, y }, volumeFraction }];
    }

    nodes.push({ x, y, inPipe: false });

    // VERTICAL: if air in gravity direction, move there
    if (!isBlocked(blocks, x, y + ctx.dy, w, h, ctx)) {
      y += ctx.dy;
      continue;
    }

    // SCAN left/right
    const leftScan = scanDirection(x, y, -1, blocks, w, h, ctx);
    const rightScan = scanDirection(x, y, 1, blocks, w, h, ctx);

    if (!leftScan.found && !rightScan.found) {
      // Both walls — contained space, this is a destination
      const contained = ctx.findContained(x, y);
      if (contained) {
        return [{ nodes, destination: { x, y }, volumeFraction }];
      }
      return [{ nodes, destination: null, volumeFraction }];
    }

    if (leftScan.found && rightScan.found) {
      // FORK
      const halfFrac = volumeFraction / 2;
      const leftVisited = new Set(visited);
      const rightVisited = new Set(visited);

      const leftNodes = [...nodes];
      const rightNodes = [...nodes];

      for (let fx = x - 1; fx >= leftScan.targetX; fx--) {
        leftNodes.push({ x: fx, y, inPipe: false });
      }
      for (let fx = x + 1; fx <= rightScan.targetX; fx++) {
        rightNodes.push({ x: fx, y, inPipe: false });
      }

      const leftBranches = traceLiquidAir(
        leftScan.targetX, y + ctx.dy,
        blocks, w, h,
        halfFrac, leftVisited, ctx,
      );
      const rightBranches = traceLiquidAir(
        rightScan.targetX, y + ctx.dy,
        blocks, w, h,
        halfFrac, rightVisited, ctx,
      );

      if (leftBranches.length > 0) {
        leftBranches[0].nodes = [...leftNodes, ...leftBranches[0].nodes];
      }
      if (rightBranches.length > 0) {
        rightBranches[0].nodes = [...rightNodes, ...rightBranches[0].nodes];
      }

      return [...leftBranches, ...rightBranches];
    }

    // One drop/rise — flow toward it
    if (leftScan.found) {
      for (let fx = x - 1; fx >= leftScan.targetX; fx--) {
        nodes.push({ x: fx, y, inPipe: false });
      }
      x = leftScan.targetX;
      y = y + ctx.dy;
    } else {
      for (let fx = x + 1; fx <= rightScan.targetX; fx++) {
        nodes.push({ x: fx, y, inPipe: false });
      }
      x = rightScan.targetX;
      y = y + ctx.dy;
    }
  }

  return [{ nodes, destination: null, volumeFraction }];
}

/**
 * Compute entry-from direction based on source pool position relative
 * to the pipe entrance terminal.
 */
function computeEntryDir(
  sourceX: number, sourceLayerY: number,
  exitX: number, exitY: number,
): Direction {
  if (sourceLayerY < exitY) return Direction.Up;
  if (sourceLayerY > exitY) return Direction.Down;
  if (sourceX < exitX) return Direction.Left;
  return Direction.Right;
}

/**
 * Trace a complete liquid path from an exit point.
 * For terrain exits: pure air trace.
 * For pipe exits: pipe network trace → air continuation from each pipe exit.
 *
 * No pipe-exit fallback — if the air trace finds no destination, the branch
 * gets destination=null and no fluid is teleported there.
 */
export function traceLiquidPath(
  exitX: number, exitY: number, inPipe: boolean,
  blocks: BlockMaterial[][], pipes: (PipeCell | null)[][],
  w: number, h: number,
  ctx: LiquidContext,
  sourceX?: number, sourceLayerY?: number,
  validExitTerminals?: { x: number; y: number }[],
  pumps?: PumpCell[],
): PathBranch[] {
  if (!inPipe) {
    const visited = new Set<string>();
    return traceLiquidAir(exitX, exitY, blocks, w, h, 1.0, visited, ctx);
  }

  // Pipe trace: compute entry direction, trace through pipe, then air continuation
  const entryDir = computeEntryDir(
    sourceX ?? exitX, sourceLayerY ?? exitY,
    exitX, exitY,
  );

  let pipeExits = tracePipeNetwork(
    exitX, exitY, entryDir, pipes, blocks, w, h, undefined, pumps,
  );

  // Filter to only valid exit terminals (prevents fluid flowing to terminals above/below entrance)
  if (validExitTerminals && validExitTerminals.length > 0) {
    const validSet = new Set(validExitTerminals.map(t => `${t.x},${t.y}`));
    pipeExits = pipeExits.filter(pe => {
      const lastPipe = pe.nodes[pe.nodes.length - 1];
      return lastPipe && validSet.has(`${lastPipe.x},${lastPipe.y}`);
    });
  }

  if (pipeExits.length === 0) {
    return [{ nodes: [{ x: exitX, y: exitY, inPipe: true }], destination: null, volumeFraction: 1 }];
  }

  const allBranches: PathBranch[] = [];
  const fracPerExit = 1 / pipeExits.length;

  for (const pe of pipeExits) {
    const visited = new Set<string>();

    const airBranches = traceLiquidAir(
      pe.exitX, pe.exitY,
      blocks, w, h,
      fracPerExit, visited, ctx,
    );

    for (const ab of airBranches) {
      ab.nodes = [...pe.nodes, ...ab.nodes];
      ab.volumeFraction = fracPerExit;
      allBranches.push(ab);
    }
  }

  if (allBranches.length === 0) {
    return [{ nodes: [{ x: exitX, y: exitY, inPipe: true }], destination: null, volumeFraction: 1 }];
  }

  return allBranches;
}
