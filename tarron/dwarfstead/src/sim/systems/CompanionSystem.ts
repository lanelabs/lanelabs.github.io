import type { System } from '../ecs/System';
import type { World } from '../ecs/World';
import type { GameLog } from '../log/GameLog';
import type { Vec2 } from '../types';
import { BlockMaterial } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { CompanionTaskComponent } from '../components/CompanionTask';
import { findPath } from '../pathfinding/findPath';
import {
  buildPathCtx, findEdgePath, handleSellPathComplete, handleSellCountdown,
} from './companionSell';

export interface CompanionContext {
  surfaceY: number;
  terrainHeight: number;
  terrainWidth: number;
  mainDwarfPos: () => { x: number; y: number } | null;
  getBlock: (pos: Vec2) => BlockMaterial;
  hasClimbable: (pos: Vec2) => boolean;
  hasLadder: (pos: Vec2) => boolean;
  hasPlatform: (pos: Vec2) => boolean;
  hasRope: (pos: Vec2) => boolean;
  isFlooded: (pos: Vec2) => boolean;
  getTrail: () => Vec2[];
  isTethered: (entityId: number) => boolean;
  hasMovableAt: (x: number, y: number, excludeId?: number) => boolean;
  maxSafeFallHeight: number;
  spawnWorld: () => World;
  isSellTickArmed: () => boolean;
  isMainDwarfRappelling: () => boolean;
  addSupplies: (amount: number) => void;
}

export class CompanionSystem implements System {
  readonly name = 'companion';

  constructor(private ctx: CompanionContext) {}

  /**
   * Given a trail position, find a valid Y for placement.
   * If inside solid terrain, scans up to find air.
   * If on a ladder, stays there.
   * If floating in air, settles down to ground.
   * Returns null if no valid position exists at this X.
   */
  private findValidY(world: World, x: number, startY: number): number | null {
    const { terrainHeight, terrainWidth } = this.ctx;
    if (x < 0 || x >= terrainWidth || startY < 0 || startY >= terrainHeight) return null;

    let y = startY;

    // If inside solid terrain, scan up to find air
    while (y >= 0 && this.ctx.getBlock({ x, y }) !== BlockMaterial.Air) {
      y--;
    }
    if (y < 0) return null;

    // If flooded, not valid
    if (this.ctx.isFlooded({ x, y })) return null;

    // If on a ladder or rope, valid — stay here
    if (this.ctx.hasClimbable({ x, y })) return y;
    if (this.ctx.hasRope({ x, y })) return y;

    // Settle down to find ground support
    while (y + 1 < terrainHeight) {
      const below = y + 1;
      if (this.ctx.getBlock({ x, y: below }) !== BlockMaterial.Air) break;
      if (this.ctx.hasClimbable({ x, y: below })) break;
      if (this.ctx.hasRope({ x, y: below })) break;
      if (world.query('position', 'movable').some((e) => {
        if (this.ctx.isTethered(e.id)) return false; // tethered blocks aren't ground
        const p = e.get<PositionComponent>('position')!;
        return p.x === x && p.y === below;
      })) break;
      y++;
    }

    // Final validity check (may have settled into flood zone)
    if (y >= terrainHeight) return null;
    if (this.ctx.getBlock({ x, y }) !== BlockMaterial.Air) return null;
    if (this.ctx.isFlooded({ x, y })) return null;

    return y;
  }

  private static key(x: number, y: number): string {
    return `${x},${y}`;
  }

  update(world: World, log: GameLog): void {
    const companions = world.query('dwarf', 'position', 'companionTask');
    const dwarfPos = this.ctx.mainDwarfPos();

    // --- Handle off-screen tasks (haul) ---
    for (const entity of companions) {
      const dwarf = entity.get<DwarfComponent>('dwarf')!;
      if (dwarf.isMainDwarf) continue;

      const ct = entity.get<CompanionTaskComponent>('companionTask')!;
      const pos = entity.get<PositionComponent>('position')!;

      if (ct.task === 'haul' && ct.ticksRemaining > 0) {
        ct.ticksRemaining--;

        if (ct.ticksRemaining <= 0) {
          if (ct.targetEntityId !== null) {
            const block = world.getEntity(ct.targetEntityId);
            if (block) {
              const bp = block.get<PositionComponent>('position')!;
              bp.y = this.ctx.surfaceY;

              const bt = block.get('blockType') as { material: string } | undefined;
              const material = bt ? bt.material : 'block';
              log.add('action', `${dwarf.name} delivers ${material} to the surface.`);
            }
            ct.targetEntityId = null;
          }

          // Teleport companion to dwarf's position; trail following will spread them out
          if (dwarfPos) {
            pos.x = dwarfPos.x;
            pos.y = dwarfPos.y;
          }

          ct.task = 'idle';
          log.add('narration', `${dwarf.name} returns, dusting off their hands.`);
        }
      }
    }

    // --- Sell errand: pathfinding phases (1, 2, 4) ---
    for (const entity of companions) {
      const dwarf = entity.get<DwarfComponent>('dwarf')!;
      if (dwarf.isMainDwarf) continue;
      const ct = entity.get<CompanionTaskComponent>('companionTask')!;
      if (ct.task !== 'pathfinding' || ct.pendingErrand !== 'sell') continue;
      const pos = entity.get<PositionComponent>('position')!;

      // Phase 4 (returning): recompute path when dwarf moves from the goal
      if (ct.sellPhase === 4 && ct.path && dwarfPos) {
        const goal = ct.path[ct.path.length - 1];
        if (goal && (goal.x !== dwarfPos.x || goal.y !== dwarfPos.y)) {
          ct.path = null;
        }
      }

      // Recompute path if null (e.g. after load, blocked retry, or dwarf moved)
      if (!ct.path) {
        const pathCtx = buildPathCtx(this.ctx, ct.dragEntityId ?? undefined);
        const start = { x: pos.x, y: pos.y };
        if (ct.sellPhase === 1 && ct.targetEntityId !== null) {
          const block = world.getEntity(ct.targetEntityId);
          if (block) {
            const bp = block.get<PositionComponent>('position')!;
            ct.path = findPath(pathCtx, start, { x: bp.x, y: bp.y - 1 });
          }
        } else if (ct.sellPhase === 2) {
          findEdgePath(this.ctx, pathCtx, start, ct.edgeX, ct);
        } else if (ct.sellPhase === 4 && dwarfPos) {
          ct.path = findPath(pathCtx, start, dwarfPos);
        }
        ct.pathIndex = 0;
        if (!ct.path) {
          ct.blocked = true;
          continue; // stay in place, retry next tick
        }
        ct.blocked = false;
      }

      // Only advance along path on sell-tick (not player action ticks)
      if (!this.ctx.isSellTickArmed()) continue;

      // Step along path
      if (ct.pathIndex >= ct.path.length) {
        // Path complete — transition to next phase
        handleSellPathComplete(this.ctx, world, log, entity, dwarfPos);
        continue;
      }

      const next = ct.path[ct.pathIndex];
      // If next step is now blocked, recompute path next tick
      if (this.ctx.getBlock({ x: next.x, y: next.y }) !== BlockMaterial.Air
        || this.ctx.hasMovableAt(next.x, next.y, ct.dragEntityId ?? undefined)) {
        ct.path = null;
        continue;
      }
      ct.dragTrail.unshift({ x: pos.x, y: pos.y });
      if (ct.dragTrail.length > 2) ct.dragTrail.length = 2;
      pos.x = next.x;
      pos.y = next.y;
      ct.pathIndex++;

      // Drag entity follows 2 tiles behind (like main dwarf tether rope)
      if (ct.dragEntityId !== null && ct.dragTrail.length >= 2) {
        const dragged = world.getEntity(ct.dragEntityId);
        if (dragged) {
          const dp = dragged.get<PositionComponent>('position')!;
          const target = ct.dragTrail[1]; // 2 steps behind
          dp.x = target.x;
          dp.y = target.y;
        }
      }
    }

    // --- Return errand: path back to dwarf after finishing a task ---
    for (const entity of companions) {
      const dwarf = entity.get<DwarfComponent>('dwarf')!;
      if (dwarf.isMainDwarf) continue;
      const ct = entity.get<CompanionTaskComponent>('companionTask')!;
      if (ct.task !== 'pathfinding' || ct.pendingErrand !== 'return') continue;
      const pos = entity.get<PositionComponent>('position')!;

      // Recompute path when dwarf moves from goal
      if (ct.path && dwarfPos) {
        const goal = ct.path[ct.path.length - 1];
        if (goal && (goal.x !== dwarfPos.x || goal.y !== dwarfPos.y)) {
          ct.path = null;
        }
      }

      if (!ct.path) {
        if (dwarfPos) {
          const pathCtx = buildPathCtx(this.ctx);
          ct.path = findPath(pathCtx, { x: pos.x, y: pos.y }, dwarfPos);
        }
        ct.pathIndex = 0;
        if (!ct.path) {
          ct.blocked = true;
          continue;
        }
        ct.blocked = false;
      }

      if (!this.ctx.isSellTickArmed()) continue;

      if (ct.pathIndex >= ct.path.length) {
        // Arrived — go idle
        ct.task = 'idle';
        ct.pendingErrand = null;
        ct.path = null;
        ct.pathIndex = 0;
        ct.blocked = false;
        continue;
      }

      const next = ct.path[ct.pathIndex];
      // If next step is now blocked, recompute path next tick
      if (this.ctx.getBlock({ x: next.x, y: next.y }) !== BlockMaterial.Air
        || this.ctx.hasMovableAt(next.x, next.y)) {
        ct.path = null;
        continue;
      }
      pos.x = next.x;
      pos.y = next.y;
      ct.pathIndex++;
    }

    // --- Sell errand: off-screen countdown (phase 3, only on sell ticks) ---
    if (this.ctx.isSellTickArmed()) for (const entity of companions) {
      const dwarf = entity.get<DwarfComponent>('dwarf')!;
      if (dwarf.isMainDwarf) continue;
      const ct = entity.get<CompanionTaskComponent>('companionTask')!;
      if (ct.task !== 'selling' || ct.sellPhase !== 3) continue;
      handleSellCountdown(this.ctx, world, log, entity, dwarfPos);
    }

    if (!dwarfPos) return;
    // When main dwarf is rappelling, switch idle companions to pathfind toward the dwarf
    if (this.ctx.isMainDwarfRappelling()) {
      for (const entity of companions) {
        const dwarf = entity.get<DwarfComponent>('dwarf')!;
        if (dwarf.isMainDwarf) continue;
        const ct = entity.get<CompanionTaskComponent>('companionTask')!;
        if (ct.task !== 'idle') continue;
        const pos = entity.get<PositionComponent>('position')!;
        const dist = Math.abs(pos.x - dwarfPos.x) + Math.abs(pos.y - dwarfPos.y);
        if (dist <= 2) continue;
        ct.task = 'pathfinding';
        ct.pendingErrand = 'return';
        ct.path = null;
        ct.pathIndex = 0;
      }
      return;
    }
    // --- Trail-based following for idle companions ---
    const trail = this.ctx.getTrail();
    const idleCompanions: { pos: PositionComponent; name: string }[] = [];
    for (const entity of companions) {
      const dwarf = entity.get<DwarfComponent>('dwarf')!;
      if (dwarf.isMainDwarf) continue;
      const ct = entity.get<CompanionTaskComponent>('companionTask')!;
      if (ct.task !== 'idle') continue;
      const pos = entity.get<PositionComponent>('position')!;
      idleCompanions.push({ pos, name: dwarf.name });
    }

    if (idleCompanions.length === 0) return;

    // Sort closest-to-dwarf first so nearest companion gets the closest trail slot
    idleCompanions.sort((a, b) => {
      const da = Math.abs(a.pos.x - dwarfPos.x) + Math.abs(a.pos.y - dwarfPos.y);
      const db = Math.abs(b.pos.x - dwarfPos.x) + Math.abs(b.pos.y - dwarfPos.y);
      return da - db;
    });

    // Occupied set: dwarf position + all movable block positions
    const occupied = new Set<string>();
    occupied.add(CompanionSystem.key(dwarfPos.x, dwarfPos.y));
    for (const block of world.query('position', 'movable')) {
      const bp = block.get<PositionComponent>('position')!;
      occupied.add(CompanionSystem.key(bp.x, bp.y));
    }

    // Assign trail positions to companions sequentially.
    // Each companion gets the next valid, unoccupied trail position.
    // trail[0] = most recent position the dwarf left, so companion 0 follows 1 step behind.
    let trailIdx = 0;
    for (const c of idleCompanions) {
      let placed = false;
      while (trailIdx < trail.length) {
        const target = trail[trailIdx];
        trailIdx++;

        const validY = this.findValidY(world, target.x, target.y);
        if (validY === null) continue;

        const key = CompanionSystem.key(target.x, validY);
        if (occupied.has(key)) continue;

        c.pos.x = target.x;
        c.pos.y = validY;
        occupied.add(key);
        placed = true;
        break;
      }

      if (!placed) {
        // No valid trail position available — stay put
        occupied.add(CompanionSystem.key(c.pos.x, c.pos.y));
      }
    }
  }
}
