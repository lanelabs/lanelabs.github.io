/**
 * Path tracing — computes instant water paths from exits to destinations.
 *
 * Two modes:
 * - Air paths (terrain exits): fall → scan → flow through air. Never enter pipes.
 * - Pipe paths: trace through pipe network by adjacency, then continue in air.
 */

import { BlockMaterial, Direction } from '../types';
import type { PathNode, PathBranch, PipeCell, PumpCell } from './types';
import type { WaterLayer } from './waterLayer';
import { findLayer, isWaterFull, getWaterAt, findContainedLayer } from './waterLayer';
import { tracePipeNetwork } from './pipeNetwork';

const MAX_ITERATIONS = 500;

function isSolid(blocks: BlockMaterial[][], x: number, y: number, w: number, h: number): boolean {
  if (x < 0 || x >= w || y < 0 || y >= h) return true;
  return blocks[y][x] !== BlockMaterial.Air;
}

function isBlocked(
  blocks: BlockMaterial[][], waterLayers: WaterLayer[],
  x: number, y: number, w: number, h: number,
): boolean {
  if (isSolid(blocks, x, y, w, h)) return true;
  return isWaterFull(waterLayers, x, y);
}

interface ScanResult {
  drop: boolean;
  dropX: number;
}

/** Scan in a direction for a drop or wall. Air paths never enter pipes. */
function scanDirection(
  startX: number, startY: number, dx: number,
  blocks: BlockMaterial[][], waterLayers: WaterLayer[],
  w: number, h: number,
): ScanResult {
  for (let x = startX + dx; x >= 0 && x < w; x += dx) {
    if (isSolid(blocks, x, startY, w, h)) return { drop: false, dropX: x };
    if (getWaterAt(waterLayers, x, startY) > 0) return { drop: false, dropX: x };
    if (!isBlocked(blocks, waterLayers, x, startY + 1, w, h)) {
      return { drop: true, dropX: x };
    }
  }
  return { drop: false, dropX: startX };
}

/**
 * Trace a single air path branch. Never enters pipes.
 * Returns one or more branches (forks produce additional branches).
 */
function traceAir(
  startX: number, startY: number,
  blocks: BlockMaterial[][], waterLayers: WaterLayer[],
  w: number, h: number,
  volumeFraction: number, visited: Set<string>,
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

    // Full water = impassable wall
    if (isWaterFull(waterLayers, x, y)) {
      return [{ nodes, destination: null, volumeFraction }];
    }

    // Existing pool = destination (stop at pool surface, include entry tile)
    const existingLayer = findLayer(waterLayers, x, y);
    if (existingLayer && existingLayer.volume > 0) {
      nodes.push({ x, y, inPipe: false });
      return [{ nodes, destination: { x, y }, volumeFraction }];
    }

    nodes.push({ x, y, inPipe: false });

    // FALL: if air below, move down
    if (!isBlocked(blocks, waterLayers, x, y + 1, w, h)) {
      y += 1;
      continue;
    }

    // SCAN left/right
    const leftScan = scanDirection(x, y, -1, blocks, waterLayers, w, h);
    const rightScan = scanDirection(x, y, 1, blocks, waterLayers, w, h);

    if (!leftScan.drop && !rightScan.drop) {
      // Both walls — contained space, this is a destination
      const contained = findContainedLayer(x, y, blocks, waterLayers, w, h);
      if (contained) {
        return [{ nodes, destination: { x, y }, volumeFraction }];
      }
      return [{ nodes, destination: null, volumeFraction }];
    }

    if (leftScan.drop && rightScan.drop) {
      // FORK
      const halfFrac = volumeFraction / 2;
      const leftVisited = new Set(visited);
      const rightVisited = new Set(visited);

      const leftNodes = [...nodes];
      const rightNodes = [...nodes];

      for (let fx = x - 1; fx >= leftScan.dropX; fx--) {
        leftNodes.push({ x: fx, y, inPipe: false });
      }
      for (let fx = x + 1; fx <= rightScan.dropX; fx++) {
        rightNodes.push({ x: fx, y, inPipe: false });
      }

      const leftBranches = traceAir(
        leftScan.dropX, y + 1,
        blocks, waterLayers, w, h,
        halfFrac, leftVisited,
      );
      const rightBranches = traceAir(
        rightScan.dropX, y + 1,
        blocks, waterLayers, w, h,
        halfFrac, rightVisited,
      );

      if (leftBranches.length > 0) {
        leftBranches[0].nodes = [...leftNodes, ...leftBranches[0].nodes];
      }
      if (rightBranches.length > 0) {
        rightBranches[0].nodes = [...rightNodes, ...rightBranches[0].nodes];
      }

      return [...leftBranches, ...rightBranches];
    }

    // One drop — flow toward it
    if (leftScan.drop) {
      for (let fx = x - 1; fx >= leftScan.dropX; fx--) {
        nodes.push({ x: fx, y, inPipe: false });
      }
      x = leftScan.dropX;
      y = y + 1;
    } else {
      for (let fx = x + 1; fx <= rightScan.dropX; fx++) {
        nodes.push({ x: fx, y, inPipe: false });
      }
      x = rightScan.dropX;
      y = y + 1;
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
 * Trace a complete path from an exit point.
 * For terrain exits: pure air trace.
 * For pipe exits: pipe network trace → air continuation from each pipe exit.
 */
export function tracePath(
  exitX: number, exitY: number, inPipe: boolean,
  blocks: BlockMaterial[][], pipes: (PipeCell | null)[][],
  waterLayers: WaterLayer[], w: number, h: number,
  sourceX?: number, sourceLayerY?: number,
  validExitTerminals?: { x: number; y: number }[],
  pumps?: PumpCell[],
): PathBranch[] {
  if (!inPipe) {
    // Pure air trace
    const visited = new Set<string>();
    return traceAir(exitX, exitY, blocks, waterLayers, w, h, 1.0, visited);
  }

  // Pipe trace: compute entry direction, trace through pipe, then air continuation
  const entryDir = computeEntryDir(
    sourceX ?? exitX, sourceLayerY ?? exitY,
    exitX, exitY,
  );

  let pipeExits = tracePipeNetwork(
    exitX, exitY, entryDir, pipes, blocks, w, h, waterLayers, pumps,
  );

  // Filter to only valid exit terminals (prevents water flowing to terminals above entrance)
  if (validExitTerminals && validExitTerminals.length > 0) {
    const validSet = new Set(validExitTerminals.map(t => `${t.x},${t.y}`));
    pipeExits = pipeExits.filter(pe => {
      // The last pipe node is the terminal — check if it's in the valid set
      const lastPipe = pe.nodes[pe.nodes.length - 1];
      return lastPipe && validSet.has(`${lastPipe.x},${lastPipe.y}`);
    });
  }

  if (pipeExits.length === 0) {
    // Dead-end pipe — no valid exits
    return [{ nodes: [{ x: exitX, y: exitY, inPipe: true }], destination: null, volumeFraction: 1 }];
  }

  // Trace ALL pipe exits — each becomes a branch. Round-robin selects
  // which one actually receives water; all render simultaneously.
  const allBranches: PathBranch[] = [];
  const fracPerExit = pipeExits.length > 0 ? 1 / pipeExits.length : 1;

  for (const pe of pipeExits) {
    const visited = new Set<string>();
    for (const node of pe.nodes) visited.add(`${node.x},${node.y}`);
    visited.delete(`${pe.exitX},${pe.exitY}`);

    const airBranches = traceAir(
      pe.exitX, pe.exitY,
      blocks, waterLayers, w, h,
      fracPerExit, visited,
    );

    // If air trace found no destination, the exit tile itself is the destination.
    // This handles pipe exits into small basins where containment check fails
    // because the air scan extends through pipe tiles.
    for (const ab of airBranches) {
      if (ab.destination === null && ab.nodes.length > 0) {
        if (blocks[pe.exitY]?.[pe.exitX] === BlockMaterial.Air) {
          ab.destination = { x: pe.exitX, y: pe.exitY };
        }
      }
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
