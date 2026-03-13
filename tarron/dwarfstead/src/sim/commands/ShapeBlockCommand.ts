import type { Command } from './Command';
import type { Game } from '../Game';
import type { CommandResult } from '../types';
import { BlockMaterial } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { CompanionTaskComponent } from '../components/CompanionTask';
import { ShapeBlockComponent, CARVING_MAX_TICKS } from '../components/ShapeBlock';
import { findMovableAt, isRappelling } from '../helpers';

export class ShapeBlockCommand implements Command {
  readonly name = 'shapeBlock';

  constructor(private tx: number, private ty: number) {}

  execute(game: Game): CommandResult {
    if (isRappelling(game)) return { success: false, message: 'Cannot shape while on a rope.' };
    const { tx, ty } = this;

    // Must be a loose block at target
    const block = findMovableAt(game, tx, ty);
    if (!block) {
      return { success: false, message: 'No loose block to shape there.' };
    }

    if (block.has('rubble')) {
      return { success: false, message: 'Rubble cannot be shaped.' };
    }

    // Already shaped or in progress
    if (block.has('shapeBlock')) {
      const shape = block.get<ShapeBlockComponent>('shapeBlock')!;
      if (shape.progress >= CARVING_MAX_TICKS) {
        return { success: false, message: 'That block is already shaped.' };
      }
      return { success: false, message: 'That block is being shaped.' };
    }

    // Space check: 1 air above, 1 standable space each side
    const top = { x: tx, y: ty - 1 };
    if (top.y < 0 || top.y >= game.terrain.height || top.x < 0 || top.x >= game.terrain.width) {
      return { success: false, message: 'Not enough space above the block.' };
    }
    if (game.getBlock(top) !== BlockMaterial.Air || findMovableAt(game, top.x, top.y)) {
      return { success: false, message: 'Not enough space above the block.' };
    }

    for (const sx of [tx - 1, tx + 1]) {
      if (sx < 0 || sx >= game.terrain.width) {
        return { success: false, message: 'Not enough standable space beside the block.' };
      }
      if (game.getBlock({ x: sx, y: ty }) !== BlockMaterial.Air) {
        return { success: false, message: 'Not enough standable space beside the block.' };
      }
      if (findMovableAt(game, sx, ty)) {
        return { success: false, message: 'Not enough standable space beside the block.' };
      }
      // Must be standable at the same level — solid ground, ladder, or movable below
      const belowY = ty + 1;
      const hasSupport =
        (belowY < game.terrain.height && game.getBlock({ x: sx, y: belowY }) !== BlockMaterial.Air) ||
        game.hasClimbable({ x: sx, y: belowY }) ||
        game.hasClimbable({ x: sx, y: ty }) ||
        !!findMovableAt(game, sx, belowY);
      if (!hasSupport) {
        return { success: false, message: 'Not enough standable space beside the block.' };
      }
    }

    // Find nearest idle companion
    const companions = game.world.query('dwarf', 'position', 'companionTask');
    let bestComp: { entity: typeof companions[0]; dist: number } | null = null;

    for (const entity of companions) {
      const d = entity.get<DwarfComponent>('dwarf')!;
      if (d.isMainDwarf) continue;
      const ct = entity.get<CompanionTaskComponent>('companionTask')!;
      if (ct.task !== 'idle') continue;
      const p = entity.get<PositionComponent>('position')!;
      const dist = Math.abs(p.x - tx) + Math.abs(p.y - ty);
      if (!bestComp || dist < bestComp.dist) {
        bestComp = { entity, dist };
      }
    }

    if (!bestComp) {
      return { success: false, message: 'No idle companion available.' };
    }

    // Assign companion
    const compEntity = bestComp.entity;
    const compDwarf = compEntity.get<DwarfComponent>('dwarf')!;
    const compPos = compEntity.get<PositionComponent>('position')!;
    const compTask = compEntity.get<CompanionTaskComponent>('companionTask')!;

    // Teleport companion above the block
    compPos.x = tx;
    compPos.y = ty - 1;
    compTask.task = 'shape';
    compTask.shapeTargetId = block.id;

    // Attach ShapeBlockComponent to the block
    block.add(new ShapeBlockComponent(compEntity.id));

    game.log.add('action', `${compDwarf.name} begins shaping a block.`);

    return { success: true, message: `${compDwarf.name} starts carving.` };
  }
}
