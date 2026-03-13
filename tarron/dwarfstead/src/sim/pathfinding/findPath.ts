import type { Vec2 } from '../types';
import type { PathContext } from './types';
import { getNeighbors } from './neighbors';

const MAX_ITERATIONS = 5000;

function manhattan(a: Vec2, b: Vec2): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function key(pos: Vec2): string {
  return `${pos.x},${pos.y}`;
}

interface Node {
  pos: Vec2;
  g: number;
  f: number;
  parent: Node | null;
}

/**
 * A* pathfinding with gravity-aware neighbors.
 * Returns path from start to goal (excluding start, including goal), or null.
 */
export function findPath(ctx: PathContext, start: Vec2, goal: Vec2): Vec2[] | null {
  const startKey = key(start);
  const goalKey = key(goal);

  if (startKey === goalKey) return [];

  const startNode: Node = { pos: start, g: 0, f: manhattan(start, goal), parent: null };
  const open: Node[] = [startNode];
  const gScores = new Map<string, number>();
  gScores.set(startKey, 0);

  const closed = new Set<string>();

  for (let iter = 0; iter < MAX_ITERATIONS && open.length > 0; iter++) {
    // Pop lowest f-score node
    const current = open.shift()!;
    const ck = key(current.pos);

    if (ck === goalKey) {
      // Reconstruct path
      const path: Vec2[] = [];
      let node: Node | null = current;
      while (node && key(node.pos) !== startKey) {
        path.push(node.pos);
        node = node.parent;
      }
      path.reverse();
      return path;
    }

    if (closed.has(ck)) continue;
    closed.add(ck);

    for (const neighbor of getNeighbors(ctx, current.pos)) {
      const nk = key(neighbor);
      if (closed.has(nk)) continue;

      const tentativeG = current.g + 1;
      const bestG = gScores.get(nk);
      if (bestG !== undefined && tentativeG >= bestG) continue;

      gScores.set(nk, tentativeG);
      const node: Node = {
        pos: neighbor,
        g: tentativeG,
        f: tentativeG + manhattan(neighbor, goal),
        parent: current,
      };

      // Insert sorted by f-score
      let inserted = false;
      for (let i = 0; i < open.length; i++) {
        if (node.f < open[i].f) {
          open.splice(i, 0, node);
          inserted = true;
          break;
        }
      }
      if (!inserted) open.push(node);
    }
  }

  return null; // No path found
}
