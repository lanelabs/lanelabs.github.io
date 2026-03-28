import type { Game } from './Game';
import type { Entity } from './ecs/Entity';
import { BlockMaterial, Direction } from './types';
import { PositionComponent } from './components/Position';
import { DwarfComponent } from './components/Dwarf';

/** Find a movable entity at a specific tile, optionally excluding one entity by id.
 *  Also excludes entities being dragged by companions (game.companionDragIds). */
export function findMovableAt(game: Game, x: number, y: number, excludeId?: number): Entity | undefined {
  return game.world.query('position', 'movable').find((e) => {
    if (excludeId !== undefined && e.id === excludeId) return false;
    if (game.companionDragIds.has(e.id)) return false;
    const p = e.get<PositionComponent>('position')!;
    return p.x === x && p.y === y;
  });
}

/** Check if there's a loose (movable) block directly on top of position (x, y-1). */
export function hasLooseBlockOnTop(game: Game, x: number, y: number): boolean {
  return findMovableAt(game, x, y - 1) !== undefined;
}

/** Check if a tile is valid for displacing a block into: in-bounds, air, not flooded, no movable. */
export function canDisplaceTo(game: Game, x: number, y: number): boolean {
  if (x < 0 || x >= game.terrain.width || y < 0 || y >= game.terrain.height) return false;
  if (game.getBlock({ x, y }) !== BlockMaterial.Air) return false;
  if (game.isFlooded({ x, y })) return false;
  if (findMovableAt(game, x, y)) return false;
  return true;
}

/** Result of searching for a hoistable block. */
export interface HoistCandidate { block: Entity; side: Direction.Left | Direction.Right }

/**
 * Find a hoistable block adjacent to the dwarf. Returns the best single candidate,
 * or `'both'` if blocks exist on both sides (caller should prompt for direction).
 */
export function findHoistableBlock(
  game: Game, dwarfX: number, dwarfY: number, facingDir: Direction,
): HoistCandidate | 'both' | null {
  const checkSide = (side: Direction.Left | Direction.Right): Entity | undefined => {
    const sx = side === Direction.Left ? dwarfX - 1 : dwarfX + 1;
    const b = findMovableAt(game, sx, dwarfY);
    if (b?.has('rubble')) return undefined;
    if (b && !hasLooseBlockOnTop(game, sx, dwarfY)) return b;
    return undefined;
  };

  // Check facing side first
  const facingSide: Direction.Left | Direction.Right | null =
    facingDir === Direction.Left ? Direction.Left
    : facingDir === Direction.Right ? Direction.Right
    : null;

  const leftBlock = checkSide(Direction.Left);
  const rightBlock = checkSide(Direction.Right);

  if (leftBlock && rightBlock) return 'both';
  if (facingSide && (facingSide === Direction.Left ? leftBlock : rightBlock)) {
    const b = facingSide === Direction.Left ? leftBlock! : rightBlock!;
    return { block: b, side: facingSide };
  }
  if (leftBlock) return { block: leftBlock, side: Direction.Left };
  if (rightBlock) return { block: rightBlock, side: Direction.Right };

  // Also check same tile (block standing on dwarf's feet)
  const sameBlock = findMovableAt(game, dwarfX, dwarfY);
  if (sameBlock && !hasLooseBlockOnTop(game, dwarfX, dwarfY)) {
    // Default to facing side, or right if facing up/down
    const side = facingSide ?? Direction.Right;
    return { block: sameBlock, side };
  }

  return null;
}

/** Check if the main dwarf is currently rappelling on a rope. */
export function isRappelling(game: Game): boolean {
  const md = game.getMainDwarf();
  if (!md) return false;
  const d = md.get<DwarfComponent>('dwarf')!;
  return d.rappelRopeId !== null;
}

/** Check if any cardinal neighbor of (x, y) is solid (non-Air) terrain. */
export function touchesSolidTerrain(game: Game, x: number, y: number): boolean {
  const neighbors = [{ x: x - 1, y }, { x: x + 1, y }, { x, y: y - 1 }, { x, y: y + 1 }];
  for (const n of neighbors) {
    if (n.x < 0 || n.x >= game.terrain.width || n.y < 0 || n.y >= game.terrain.height) continue;
    const mat = game.getBlock(n);
    if (mat !== BlockMaterial.Air) return true;
  }
  return false;
}
