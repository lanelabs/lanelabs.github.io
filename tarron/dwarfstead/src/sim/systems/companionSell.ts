import type { World } from '../ecs/World';
import type { GameLog } from '../log/GameLog';
import type { PathContext } from '../pathfinding/types';
import { BlockMaterial } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { CompanionTaskComponent } from '../components/CompanionTask';
import { MovableComponent } from '../components/Movable';
import { SupplyCrateComponent } from '../components/SupplyCrate';
import { findPath } from '../pathfinding/findPath';
import type { CompanionContext } from './CompanionSystem';

export function buildPathCtx(ctx: CompanionContext, excludeEntityId?: number): PathContext {
  return {
    terrainWidth: ctx.terrainWidth,
    terrainHeight: ctx.terrainHeight,
    maxSafeFallHeight: ctx.maxSafeFallHeight,
    getBlock: ctx.getBlock,
    isFlooded: ctx.isFlooded,
    hasLadder: ctx.hasLadder,
    hasPlatform: ctx.hasPlatform,
    hasClimbable: ctx.hasClimbable,
    hasRope: ctx.hasRope,
    hasMovableAt: (x, y) => ctx.hasMovableAt(x, y, excludeEntityId),
  };
}

export function cancelSell(ct: CompanionTaskComponent): void {
  ct.task = 'idle'; ct.sellPhase = 0; ct.pendingErrand = null;
  ct.dragEntityId = null; ct.path = null; ct.pathIndex = 0;
  ct.dragTrail = []; ct.blocked = false;
}

/** Find the first walkable Y (air with ground below) at a given X, near surfaceY. */
export function findWalkableY(ctx: CompanionContext, x: number): number | null {
  const baseY = ctx.surfaceY;
  for (let y = baseY - 1; y >= Math.max(0, baseY - 8); y--) {
    if (ctx.getBlock({ x, y }) === BlockMaterial.Air
      && !ctx.isFlooded({ x, y })
      && ctx.getBlock({ x, y: y + 1 }) !== BlockMaterial.Air) {
      return y;
    }
  }
  for (let y = baseY; y < Math.min(ctx.terrainHeight, baseY + 4); y++) {
    if (ctx.getBlock({ x, y }) === BlockMaterial.Air
      && !ctx.isFlooded({ x, y })
      && y + 1 < ctx.terrainHeight
      && ctx.getBlock({ x, y: y + 1 }) !== BlockMaterial.Air) {
      return y;
    }
  }
  return null;
}

/** Try to find a path to either edge, preferring edgeX, falling back to opposite. */
export function findEdgePath(
  ctx: CompanionContext, pathCtx: PathContext,
  start: { x: number; y: number }, edgeX: number,
  ct: CompanionTaskComponent,
): void {
  const otherEdge = edgeX === 0 ? ctx.terrainWidth - 1 : 0;
  const goalY1 = findWalkableY(ctx, edgeX);
  let path = goalY1 !== null ? findPath(pathCtx, start, { x: edgeX, y: goalY1 }) : null;
  let finalEdge = edgeX;
  if (!path) {
    const goalY2 = findWalkableY(ctx, otherEdge);
    path = goalY2 !== null ? findPath(pathCtx, start, { x: otherEdge, y: goalY2 }) : null;
    finalEdge = otherEdge;
  }
  ct.path = path;
  ct.pathIndex = 0;
  ct.edgeX = finalEdge;
  ct.blocked = !path;
}

export function handleSellPathComplete(
  ctx: CompanionContext, world: World, log: GameLog,
  entity: ReturnType<typeof world.query>[0],
  _dwarfPos: { x: number; y: number } | null,
): void {
  const dwarf = entity.get<DwarfComponent>('dwarf')!;
  const ct = entity.get<CompanionTaskComponent>('companionTask')!;
  const pos = entity.get<PositionComponent>('position')!;

  if (ct.sellPhase === 1) {
    if (ct.targetEntityId !== null) {
      const block = world.getEntity(ct.targetEntityId);
      if (block) {
        const bp = block.get<PositionComponent>('position')!;
        pos.x = bp.x;
        pos.y = bp.y - 1;
        ct.dragEntityId = ct.targetEntityId;
        ct.dragTrail = [{ x: bp.x, y: bp.y - 1 }, { x: bp.x, y: bp.y }];
        const pathCtx = buildPathCtx(ctx, ct.dragEntityId!);
        findEdgePath(ctx, pathCtx, { x: pos.x, y: pos.y }, ct.edgeX, ct);
        ct.sellPhase = 2;
        if (ct.blocked) {
          log.add('action', `${dwarf.name} ropes the shaped block but can't find a way out.`);
        } else {
          log.add('action', `${dwarf.name} ropes the shaped block and drags it toward the surface.`);
        }
        return;
      }
    }
    cancelSell(ct);
  } else if (ct.sellPhase === 2) {
    if (ct.dragEntityId !== null) {
      world.despawn(ct.dragEntityId);
    }
    ct.dragEntityId = null;
    pos.x = -1;
    pos.y = -1;
    ct.task = 'selling';
    ct.sellPhase = 3;
    ct.ticksRemaining = 5;
    ct.path = null;
    log.add('narration', `${dwarf.name} disappears over the ridge to trade.`);
  } else if (ct.sellPhase === 4) {
    if (ct.dragEntityId !== null) {
      const crate = world.getEntity(ct.dragEntityId);
      if (crate) {
        const sc = crate.get<SupplyCrateComponent>('supplyCrate');
        if (sc) {
          ctx.addSupplies(sc.suppliesInside);
          log.add('action', `Collected ${sc.suppliesInside} supply from ${dwarf.name}'s crate.`);
        }
        world.despawn(ct.dragEntityId);
      }
    }
    log.add('narration', `${dwarf.name} delivers the goods and rejoins the band.`);
    cancelSell(ct);
  }
}

/** Handle sell phase 3 countdown: off-screen trading, then return with crate. */
export function handleSellCountdown(
  ctx: CompanionContext, world: World, log: GameLog,
  entity: ReturnType<typeof world.query>[0],
  dwarfPos: { x: number; y: number } | null,
): void {
  const dwarf = entity.get<DwarfComponent>('dwarf')!;
  const ct = entity.get<CompanionTaskComponent>('companionTask')!;
  const pos = entity.get<PositionComponent>('position')!;

  ct.ticksRemaining--;
  if (ct.ticksRemaining <= 0) {
    const walkY = findWalkableY(ctx, ct.edgeX) ?? (ctx.surfaceY - 1);
    pos.x = ct.edgeX;
    pos.y = walkY;
    const crate = world.spawn();
    crate
      .add(new PositionComponent(ct.edgeX, walkY))
      .add(new MovableComponent(1))
      .add(new SupplyCrateComponent(1));
    ct.dragEntityId = crate.id;
    ct.dragTrail = [{ x: ct.edgeX, y: walkY }, { x: ct.edgeX, y: walkY }];
    const pathCtx = buildPathCtx(ctx, crate.id);
    const goal = dwarfPos ?? { x: Math.floor(ctx.terrainWidth / 2), y: walkY };
    ct.path = findPath(pathCtx, { x: pos.x, y: pos.y }, goal);
    ct.pathIndex = 0;
    ct.task = 'pathfinding';
    ct.sellPhase = 4;
    ct.blocked = !ct.path;
    log.add('narration', `${dwarf.name} returns from trade, dragging a crate of supplies.`);
  }
}
