import type { System } from '../ecs/System';
import type { World } from '../ecs/World';
import type { GameLog } from '../log/GameLog';
import type { Vec2 } from '../types';
import { BlockMaterial } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { CompanionTaskComponent } from '../components/CompanionTask';
import { ShapeBlockComponent, CARVING_MAX_TICKS, TICKS_PER_STAGE } from '../components/ShapeBlock';

export interface ShapingContext {
  terrainWidth: number;
  terrainHeight: number;
  getBlock: (pos: Vec2) => BlockMaterial;
  /** Only advance shaping when the renderer arms the tick. */
  isArmed: () => boolean;
}

const SIDE_CYCLE: ('top' | 'left' | 'right')[] = ['top', 'left', 'right'];

export class ShapingSystem implements System {
  readonly name = 'shaping';

  constructor(private ctx: ShapingContext) {}

  update(world: World, log: GameLog): void {
    if (!this.ctx.isArmed()) return;

    for (const entity of world.query('position', 'shapeBlock', 'movable')) {
      const shape = entity.get<ShapeBlockComponent>('shapeBlock')!;

      // Already complete — leave the component for rendering, skip processing
      if (shape.progress >= CARVING_MAX_TICKS) continue;

      const blockPos = entity.get<PositionComponent>('position')!;

      // Verify companion still exists and is actively shaping
      const companion = world.getEntity(shape.companionId);
      if (!companion) {
        entity.remove('shapeBlock');
        continue;
      }
      const ct = companion.get<CompanionTaskComponent>('companionTask');
      if (!ct || (ct.task !== 'shape' && ct.task !== 'waiting')) {
        entity.remove('shapeBlock');
        continue;
      }
      // Only progress while companion is on 'shape' task
      if (ct.task !== 'shape') continue;

      // Validate companion work position is still valid (air, in-bounds)
      const compPos = companion.get<PositionComponent>('position')!;
      if (compPos.x < 0 || compPos.x >= this.ctx.terrainWidth ||
          compPos.y < 0 || compPos.y >= this.ctx.terrainHeight) {
        this.cancelShaping(entity, companion, log);
        continue;
      }
      if (this.ctx.getBlock({ x: compPos.x, y: compPos.y }) !== BlockMaterial.Air) {
        this.cancelShaping(entity, companion, log);
        continue;
      }

      // Advance work tick; only bump visual progress every TICKS_PER_STAGE
      shape.workTicks++;
      if (shape.workTicks >= TICKS_PER_STAGE) {
        shape.workTicks = 0;
        shape.progress++;
      }

      // Cycle companion position: top → left → right → top
      const nextIdx = (SIDE_CYCLE.indexOf(shape.carvingSide) + 1) % SIDE_CYCLE.length;
      shape.carvingSide = SIDE_CYCLE[nextIdx];

      // Move companion to new side
      switch (shape.carvingSide) {
        case 'top':   compPos.x = blockPos.x; compPos.y = blockPos.y - 1; break;
        case 'left':  compPos.x = blockPos.x - 1; compPos.y = blockPos.y; break;
        case 'right': compPos.x = blockPos.x + 1; compPos.y = blockPos.y; break;
      }

      // Check completion
      if (shape.progress >= CARVING_MAX_TICKS) {
        const compDwarf = companion.get<DwarfComponent>('dwarf');
        const name = compDwarf?.name ?? 'Companion';
        ct.shapeTargetId = null;
        // Place companion above the finished block, then path back to dwarf
        compPos.x = blockPos.x;
        compPos.y = blockPos.y - 1;
        ct.task = 'pathfinding';
        ct.pendingErrand = 'return';
        ct.path = null; // CompanionSystem will compute on next tick
        ct.pathIndex = 0;
        ct.blocked = false;
        log.add('action', `${name} finishes shaping the block and heads back.`);
      }
    }
  }

  private cancelShaping(
    blockEntity: ReturnType<World['getEntity']> & object,
    companion: ReturnType<World['getEntity']> & object,
    log: GameLog,
  ): void {
    blockEntity.remove('shapeBlock');
    const ct = companion.get<CompanionTaskComponent>('companionTask');
    if (ct) {
      ct.task = 'idle';
      ct.shapeTargetId = null;
    }
    const d = companion.get<DwarfComponent>('dwarf');
    const name = d?.name ?? 'Companion';
    log.add('action', `${name}'s shaping work is interrupted.`);
  }
}
