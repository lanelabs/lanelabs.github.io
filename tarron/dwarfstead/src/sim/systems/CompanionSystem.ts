import type { System } from '../ecs/System';
import type { World } from '../ecs/World';
import type { GameLog } from '../log/GameLog';
import type { Vec2 } from '../types';
import { BlockMaterial } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { CompanionTaskComponent } from '../components/CompanionTask';
import { MovableComponent } from '../components/Movable';
import { SupplyCrateComponent } from '../components/SupplyCrate';
import { findPath } from '../pathfinding/findPath';
import type { PathContext } from '../pathfinding/types';

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

  private buildPathCtx(excludeEntityId?: number): PathContext {
    return {
      terrainWidth: this.ctx.terrainWidth,
      terrainHeight: this.ctx.terrainHeight,
      maxSafeFallHeight: this.ctx.maxSafeFallHeight,
      getBlock: this.ctx.getBlock,
      isFlooded: this.ctx.isFlooded,
      hasLadder: this.ctx.hasLadder,
      hasPlatform: this.ctx.hasPlatform,
      hasClimbable: this.ctx.hasClimbable,
      hasRope: this.ctx.hasRope,
      hasMovableAt: (x, y) => this.ctx.hasMovableAt(x, y, excludeEntityId),
    };
  }

  /** If pos overlaps a dwarf or movable, shift it left/right to a free air tile. */
  private nudgeToFree(world: World, pos: PositionComponent): void {
    const isOccupied = (x: number, y: number) =>
      world.query('position').some((e) => {
        const p = e.get<PositionComponent>('position')!;
        return p.x === x && p.y === y && p !== pos;
      });
    if (!isOccupied(pos.x, pos.y)) return;
    for (let d = 1; d <= 5; d++) {
      for (const dx of [-d, d]) {
        const nx = pos.x + dx;
        if (nx < 0 || nx >= this.ctx.terrainWidth) continue;
        if (this.ctx.getBlock({ x: nx, y: pos.y }) !== BlockMaterial.Air) continue;
        if (!isOccupied(nx, pos.y)) {
          pos.x = nx;
          return;
        }
      }
    }
    // Fallback: place one tile above
    pos.y -= 1;
  }

  private cancelSell(ct: CompanionTaskComponent): void {
    ct.task = 'idle'; ct.sellPhase = 0; ct.pendingErrand = null;
    ct.dragEntityId = null; ct.path = null; ct.pathIndex = 0;
    ct.dragTrail = []; ct.blocked = false;
  }

  /** Find the first walkable Y (air with ground below) at a given X, near surfaceY. */
  private findWalkableY(x: number): number | null {
    const baseY = this.ctx.surfaceY;
    // Scan upward from surfaceY to find air above ground
    for (let y = baseY - 1; y >= Math.max(0, baseY - 8); y--) {
      if (this.ctx.getBlock({ x, y }) === BlockMaterial.Air
        && !this.ctx.isFlooded({ x, y })
        && this.ctx.getBlock({ x, y: y + 1 }) !== BlockMaterial.Air) {
        return y;
      }
    }
    // Scan downward as fallback
    for (let y = baseY; y < Math.min(this.ctx.terrainHeight, baseY + 4); y++) {
      if (this.ctx.getBlock({ x, y }) === BlockMaterial.Air
        && !this.ctx.isFlooded({ x, y })
        && y + 1 < this.ctx.terrainHeight
        && this.ctx.getBlock({ x, y: y + 1 }) !== BlockMaterial.Air) {
        return y;
      }
    }
    return null;
  }

  /** Try to find a path to either edge, preferring edgeX, falling back to opposite. */
  private findEdgePath(
    pathCtx: PathContext, start: { x: number; y: number }, edgeX: number,
    ct: CompanionTaskComponent,
  ): void {
    const otherEdge = edgeX === 0 ? this.ctx.terrainWidth - 1 : 0;

    // Try preferred edge with valid walkable Y
    const goalY1 = this.findWalkableY(edgeX);
    let path = goalY1 !== null ? findPath(pathCtx, start, { x: edgeX, y: goalY1 }) : null;
    let finalEdge = edgeX;

    if (!path) {
      const goalY2 = this.findWalkableY(otherEdge);
      path = goalY2 !== null ? findPath(pathCtx, start, { x: otherEdge, y: goalY2 }) : null;
      finalEdge = otherEdge;
    }

    ct.path = path;
    ct.pathIndex = 0;
    ct.edgeX = finalEdge;
    ct.blocked = !path;
  }

  private onSellPathComplete(
    world: World, log: GameLog,
    entity: ReturnType<typeof world.query>[0],
    _dwarfPos: { x: number; y: number } | null,
  ): void {
    const dwarf = entity.get<DwarfComponent>('dwarf')!;
    const ct = entity.get<CompanionTaskComponent>('companionTask')!;
    const pos = entity.get<PositionComponent>('position')!;

    if (ct.sellPhase === 1) {
      // Phase 1 complete: begin phase 2 (drag block to edge)
      if (ct.targetEntityId !== null) {
        const block = world.getEntity(ct.targetEntityId);
        if (block) {
          const bp = block.get<PositionComponent>('position')!;
          pos.x = bp.x;
          pos.y = bp.y - 1;
          ct.dragEntityId = ct.targetEntityId;
          ct.dragTrail = [{ x: bp.x, y: bp.y - 1 }, { x: bp.x, y: bp.y }];
          const pathCtx = this.buildPathCtx(ct.dragEntityId!);
          this.findEdgePath(pathCtx, { x: pos.x, y: pos.y }, ct.edgeX, ct);
          ct.sellPhase = 2;
          if (ct.blocked) {
            log.add('action', `${dwarf.name} ropes the shaped block but can't find a way out.`);
          } else {
            log.add('action', `${dwarf.name} ropes the shaped block and drags it toward the surface.`);
          }
          return;
        }
      }
      this.cancelSell(ct);
    } else if (ct.sellPhase === 2) {
      // Phase 2 complete: go off-screen (phase 3)
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
      // Phase 4 complete: auto-collect crate supplies and despawn it
      if (ct.dragEntityId !== null) {
        const crate = world.getEntity(ct.dragEntityId);
        if (crate) {
          const sc = crate.get<SupplyCrateComponent>('supplyCrate');
          if (sc) {
            this.ctx.addSupplies(sc.suppliesInside);
            log.add('action', `Collected ${sc.suppliesInside} supply from ${dwarf.name}'s crate.`);
          }
          world.despawn(ct.dragEntityId);
        }
      }
      log.add('narration', `${dwarf.name} delivers the goods and rejoins the band.`);
      this.cancelSell(ct);
    }
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
        const pathCtx = this.buildPathCtx(ct.dragEntityId ?? undefined);
        const start = { x: pos.x, y: pos.y };
        if (ct.sellPhase === 1 && ct.targetEntityId !== null) {
          const block = world.getEntity(ct.targetEntityId);
          if (block) {
            const bp = block.get<PositionComponent>('position')!;
            ct.path = findPath(pathCtx, start, { x: bp.x, y: bp.y - 1 });
          }
        } else if (ct.sellPhase === 2) {
          this.findEdgePath(pathCtx, start, ct.edgeX, ct);
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
        this.onSellPathComplete(world, log, entity, dwarfPos);
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
          const pathCtx = this.buildPathCtx();
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
      const pos = entity.get<PositionComponent>('position')!;

      ct.ticksRemaining--;
      if (ct.ticksRemaining <= 0) {
        // Phase 4: return with crate
        const walkY = this.findWalkableY(ct.edgeX) ?? (this.ctx.surfaceY - 1);
        pos.x = ct.edgeX;
        pos.y = walkY;

        // Spawn supply crate at edge
        const crate = world.spawn();
        crate
          .add(new PositionComponent(ct.edgeX, walkY))
          .add(new MovableComponent(1))
          .add(new SupplyCrateComponent(1));
        ct.dragEntityId = crate.id;
        ct.dragTrail = [{ x: ct.edgeX, y: walkY }, { x: ct.edgeX, y: walkY }];

        // Path from edge to main dwarf
        const pathCtx = this.buildPathCtx(crate.id);
        const goal = dwarfPos ?? { x: Math.floor(this.ctx.terrainWidth / 2), y: walkY };
        ct.path = findPath(pathCtx, { x: pos.x, y: pos.y }, goal);
        ct.pathIndex = 0;
        ct.task = 'pathfinding';
        ct.sellPhase = 4;
        ct.blocked = !ct.path;

        log.add('narration', `${dwarf.name} returns from trade, dragging a crate of supplies.`);
      }
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
