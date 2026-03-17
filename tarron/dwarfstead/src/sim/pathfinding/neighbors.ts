import type { Vec2 } from '../types';
import { BlockMaterial } from '../types';
import type { PathContext } from './types';

/** Check if a tile is passable: in-bounds, air, no movable block. Water is passable (swimming). */
export function isPassable(ctx: PathContext, x: number, y: number): boolean {
  if (x < 0 || x >= ctx.terrainWidth || y < 0 || y >= ctx.terrainHeight) return false;
  if (ctx.getBlock({ x, y }) !== BlockMaterial.Air) return false;
  if (ctx.hasMovableAt(x, y)) return false;
  return true;
}

/** Has ground support: solid block, climbable, movable below, rope, or in water. */
function hasGround(ctx: PathContext, x: number, y: number): boolean {
  const below = y + 1;
  if (below >= ctx.terrainHeight) return true; // bottom of map = ground
  if (ctx.getBlock({ x, y: below }) !== BlockMaterial.Air) return true;
  if (ctx.hasClimbable({ x, y: below })) return true;
  if (ctx.hasMovableAt(x, below)) return true;
  if (ctx.hasRope({ x, y })) return true;
  if (ctx.hasRope({ x, y: below })) return true;
  // Water acts as buoyant ground
  if (ctx.getWaterMass({ x, y }) >= 2) return true;
  return false;
}

/** Simulate gravity: scan down to first solid/climbable/movable/rope ground. Returns landed Y. */
function settleY(ctx: PathContext, x: number, y: number): number {
  let cy = y;
  while (cy + 1 < ctx.terrainHeight) {
    if (ctx.hasRope({ x, y: cy })) break;
    const below = cy + 1;
    if (ctx.getBlock({ x, y: below }) !== BlockMaterial.Air) break;
    if (ctx.hasClimbable({ x, y: below })) break;
    if (ctx.hasMovableAt(x, below)) break;
    cy++;
  }
  return cy;
}

/** Measure drop distance from y (exclusive) down to first support. */
function dropDistance(ctx: PathContext, x: number, y: number): number {
  let dist = 0;
  let cy = y + 1;
  while (cy < ctx.terrainHeight) {
    if (ctx.getBlock({ x, y: cy }) !== BlockMaterial.Air) break;
    if (ctx.hasClimbable({ x, y: cy })) break;
    if (ctx.hasRope({ x, y: cy })) break;
    if (ctx.hasMovableAt(x, cy)) break;
    dist++;
    cy++;
  }
  return dist;
}

function key(x: number, y: number): string {
  return `${x},${y}`;
}

/** Get gravity-aware neighbors for A* pathfinding. */
export function getNeighbors(ctx: PathContext, pos: Vec2): Vec2[] {
  const results: Vec2[] = [];
  const seen = new Set<string>();

  const add = (x: number, y: number) => {
    const k = key(x, y);
    if (!seen.has(k)) {
      seen.add(k);
      results.push({ x, y });
    }
  };

  // Swimming: if in water, allow all 4 cardinal directions freely
  const inWater = ctx.getWaterMass(pos) >= 2;
  if (inWater) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nx = pos.x + dx;
      const ny = pos.y + dy;
      if (isPassable(ctx, nx, ny)) {
        add(nx, ny);
      }
    }
    return results;
  }

  // --- Horizontal neighbors (left/right) ---
  for (const dx of [-1, 1]) {
    const nx = pos.x + dx;

    // Walk: passable and has ground
    if (isPassable(ctx, nx, pos.y)) {
      if (hasGround(ctx, nx, pos.y)) {
        add(nx, pos.y);
      } else {
        // Walk-and-drop: check fall safety (ropes act as grab points)
        const drop = dropDistance(ctx, nx, pos.y);
        if (drop <= ctx.maxSafeFallHeight
          || ctx.hasLadder({ x: nx, y: pos.y })
          || ctx.hasRope({ x: nx, y: pos.y })) {
          const landed = settleY(ctx, nx, pos.y);
          if (isPassable(ctx, nx, landed)) {
            add(nx, landed);
          }
        }
      }
    } else {
      // Hurdle: step up over 1-high obstacle
      const stepUpY = pos.y - 1;
      if (isPassable(ctx, nx, stepUpY) && isPassable(ctx, pos.x, stepUpY)) {
        if (hasGround(ctx, nx, stepUpY)) {
          add(nx, stepUpY);
        } else {
          const drop = dropDistance(ctx, nx, stepUpY);
          if (drop <= ctx.maxSafeFallHeight) {
            const landed = settleY(ctx, nx, stepUpY);
            if (isPassable(ctx, nx, landed)) {
              add(nx, landed);
            }
          }
        }
      }
    }
  }

  // --- Up neighbor ---
  const upY = pos.y - 1;
  if (upY >= 0 && isPassable(ctx, pos.x, upY)) {
    const hasLadderHere = ctx.hasLadder({ x: pos.x, y: pos.y });
    const hasLadderDest = ctx.hasLadder({ x: pos.x, y: upY });
    const hasPlatformHere = ctx.hasPlatform({ x: pos.x, y: pos.y });
    const hasRopeHere = ctx.hasRope({ x: pos.x, y: pos.y });
    const hasRopeDest = ctx.hasRope({ x: pos.x, y: upY });
    if (hasLadderHere || hasLadderDest || hasPlatformHere || hasRopeHere || hasRopeDest) {
      add(pos.x, upY);
    }
  }

  // --- Down neighbor ---
  const downY = pos.y + 1;
  if (downY < ctx.terrainHeight && isPassable(ctx, pos.x, downY)) {
    const landed = settleY(ctx, pos.x, downY);
    const totalDrop = landed - pos.y;
    if (totalDrop <= ctx.maxSafeFallHeight
      || ctx.hasLadder({ x: pos.x, y: downY })
      || ctx.hasRope({ x: pos.x, y: downY })) {
      if (isPassable(ctx, pos.x, landed)) {
        add(pos.x, landed);
      }
    }
  }

  return results;
}
