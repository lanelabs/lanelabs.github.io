import type { Command } from './Command';
import type { Game } from '../Game';
import { BlockMaterial, DirectionVec, type CommandResult } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { CompanionTaskComponent } from '../components/CompanionTask';
import { ShapeBlockComponent, CARVING_MAX_TICKS } from '../components/ShapeBlock';
import { findMovableAt, isRappelling } from '../helpers';
import { findPath } from '../pathfinding/findPath';
import { buildPathContext } from '../pathfinding/context';
import type { Entity } from '../ecs/Entity';

function findWalkableY(game: Game, x: number): number | null {
  const baseY = game.surfaceY;
  const h = game.terrain.height;
  for (let y = baseY - 1; y >= Math.max(0, baseY - 8); y--) {
    if (game.getBlock({ x, y }) === BlockMaterial.Air
      && !game.isFlooded({ x, y })
      && game.getBlock({ x, y: y + 1 }) !== BlockMaterial.Air) {
      return y;
    }
  }
  for (let y = baseY; y < Math.min(h, baseY + 4); y++) {
    if (game.getBlock({ x, y }) === BlockMaterial.Air
      && !game.isFlooded({ x, y })
      && y + 1 < h
      && game.getBlock({ x, y: y + 1 }) !== BlockMaterial.Air) {
      return y;
    }
  }
  return null;
}

function isCompletedShaped(entity: Entity | undefined): boolean {
  if (!entity) return false;
  const shape = entity.get<ShapeBlockComponent>('shapeBlock');
  return !!shape && shape.progress >= CARVING_MAX_TICKS;
}

export class SellBlockCommand implements Command {
  readonly name = 'sellBlock';

  constructor(private targetX?: number, private targetY?: number) {}

  execute(game: Game): CommandResult {
    if (isRappelling(game)) return { success: false, message: 'Cannot sell while on a rope.' };
    const dwarf = game.getMainDwarf();
    if (!dwarf) return { success: false, message: 'No main dwarf found.' };

    const dPos = dwarf.get<PositionComponent>('position')!;
    const dComp = dwarf.get<DwarfComponent>('dwarf')!;

    let tx = this.targetX;
    let ty = this.targetY;
    if (tx === undefined || ty === undefined) {
      const delta = DirectionVec[dComp.facingDirection];
      tx = dPos.x + delta.x;
      ty = dPos.y + delta.y;
    }

    // Must be a completed shaped block (also check one tile above for stacked blocks)
    let target = findMovableAt(game, tx, ty);
    if (!isCompletedShaped(target)) {
      const above = findMovableAt(game, tx, ty - 1);
      if (isCompletedShaped(above)) {
        target = above;
        ty = ty - 1;
      } else if (!target) {
        return { success: false, message: 'No loose block there.' };
      } else {
        return { success: false, message: 'Block must be fully shaped before selling.' };
      }
    }
    const block = target!;

    // Find companion: prefer 'waiting' above the block, fallback to nearest idle
    const companions = game.world.query('dwarf', 'position', 'companionTask');

    // Guard against double-assignment: skip if any companion already handles this block
    const alreadyAssigned = companions.some((entity) => {
      const d = entity.get<DwarfComponent>('dwarf')!;
      if (d.isMainDwarf) return false;
      const ct = entity.get<CompanionTaskComponent>('companionTask')!;
      return ct.pendingErrand === 'sell' &&
        (ct.targetEntityId === block.id || ct.dragEntityId === block.id);
    });
    if (alreadyAssigned) {
      return { success: false, message: 'A companion is already on it.' };
    }
    let chosen: typeof companions[0] | null = null;

    for (const entity of companions) {
      const d = entity.get<DwarfComponent>('dwarf')!;
      if (d.isMainDwarf) continue;
      const ct = entity.get<CompanionTaskComponent>('companionTask')!;
      if (ct.task !== 'waiting') continue;
      const p = entity.get<PositionComponent>('position')!;
      if (p.x === tx && p.y === ty - 1) {
        chosen = entity;
        break;
      }
    }

    if (!chosen) {
      let bestDist = Infinity;
      for (const entity of companions) {
        const d = entity.get<DwarfComponent>('dwarf')!;
        if (d.isMainDwarf) continue;
        const ct = entity.get<CompanionTaskComponent>('companionTask')!;
        if (ct.task !== 'idle' && ct.task !== 'waiting') continue;
        const p = entity.get<PositionComponent>('position')!;
        const dist = Math.abs(p.x - tx) + Math.abs(p.y - ty);
        if (dist < bestDist) {
          bestDist = dist;
          chosen = entity;
        }
      }
    }

    if (!chosen) {
      return { success: false, message: 'No available companion.' };
    }

    const compDwarf = chosen.get<DwarfComponent>('dwarf')!;
    const compPos = chosen.get<PositionComponent>('position')!;
    const compTask = chosen.get<CompanionTaskComponent>('companionTask')!;

    // Compute edge X: prefer nearest (beginDragPhase tries opposite on failure)
    const edgeX = tx <= game.terrain.width / 2 ? 0 : game.terrain.width - 1;

    compTask.pendingErrand = 'sell';
    compTask.targetEntityId = block.id;
    compTask.edgeX = edgeX;
    compTask.shapeTargetId = null;

    // Check if companion is adjacent (dist <= 1)
    const dist = Math.abs(compPos.x - tx) + Math.abs(compPos.y - ty);
    if (dist <= 1) {
      // Skip phase 1, go directly to phase 2 (drag to edge)
      this.beginDragPhase(game, chosen, block.id, tx, ty, edgeX);
    } else {
      // Phase 1: pathfind to block
      const ctx = buildPathContext(game);
      const path = findPath(ctx, { x: compPos.x, y: compPos.y }, { x: tx, y: ty - 1 });
      if (!path) {
        compTask.pendingErrand = null;
        compTask.sellPhase = 0;
        return { success: false, message: `${compDwarf.name} can't reach the block.` };
      }
      compTask.task = 'pathfinding';
      compTask.sellPhase = 1;
      compTask.path = path;
      compTask.pathIndex = 0;
      game.log.add('action', `${compDwarf.name} heads toward the shaped block.`);
    }

    return { success: true, message: `${compDwarf.name} begins the sell errand.` };
  }

  private beginDragPhase(
    game: Game,
    companion: ReturnType<typeof game.world.query>[0],
    blockId: number,
    blockX: number,
    blockY: number,
    edgeX: number,
  ): void {
    const compDwarf = companion.get<DwarfComponent>('dwarf')!;
    const compPos = companion.get<PositionComponent>('position')!;
    const compTask = companion.get<CompanionTaskComponent>('companionTask')!;

    // Position companion above block
    compPos.x = blockX;
    compPos.y = blockY - 1;

    // Path from block to surface edge (exclude dragged block from obstacles)
    // Try preferred edge first, then the opposite edge
    const ctx = buildPathContext(game, blockId);
    const start = { x: compPos.x, y: compPos.y };
    const otherEdge = edgeX === 0 ? game.terrain.width - 1 : 0;
    const wy1 = findWalkableY(game, edgeX);
    const wy2 = findWalkableY(game, otherEdge);
    let path = wy1 !== null ? findPath(ctx, start, { x: edgeX, y: wy1 }) : null;
    let finalEdge = edgeX;
    if (!path) {
      path = wy2 !== null ? findPath(ctx, start, { x: otherEdge, y: wy2 }) : null;
      finalEdge = otherEdge;
    }

    compTask.task = 'pathfinding';
    compTask.sellPhase = 2;
    compTask.dragEntityId = blockId;
    compTask.edgeX = finalEdge;
    compTask.dragTrail = [{ x: blockX, y: blockY - 1 }, { x: blockX, y: blockY }];
    compTask.path = path;
    compTask.pathIndex = 0;
    compTask.blocked = !path;

    if (path) {
      game.log.add('action', `${compDwarf.name} ropes the shaped block and drags it toward the surface.`);
    } else {
      game.log.add('action', `${compDwarf.name} ropes the shaped block but can't find a way out.`);
    }
  }
}
