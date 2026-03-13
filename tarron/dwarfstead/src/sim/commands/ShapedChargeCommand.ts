import type { Command } from './Command';
import type { Game } from '../Game';
import { BlockMaterial, DirectionVec, type CommandResult, type Direction } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { BlockTypeComponent } from '../components/BlockType';
import { MovableComponent } from '../components/Movable';
import { RubbleComponent } from '../components/Rubble';
import { findMovableAt, hasLooseBlockOnTop } from '../helpers';

export class ShapedChargeCommand implements Command {
  readonly name = 'shaped-charge';

  constructor(private direction: Direction) {}

  execute(game: Game): CommandResult {
    const dwarf = game.getMainDwarf();
    if (!dwarf) return { success: false, message: 'No main dwarf found.' };

    const pos = dwarf.get<PositionComponent>('position')!;
    const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;
    const delta = DirectionVec[this.direction];
    const tx = pos.x + delta.x;
    const ty = pos.y + delta.y;

    const block = findMovableAt(game, tx, ty);
    if (!block) {
      return { success: false, message: 'No loose block there to demolish.' };
    }

    if (block.has('rubble')) {
      return { success: false, message: 'Rubble is too loose for a shaped charge.' };
    }

    if (hasLooseBlockOnTop(game, tx, ty)) {
      return { success: false, message: 'Another block is stacked on top.' };
    }

    if (game.supplies < 1) {
      return { success: false, message: 'No supplies for a shaped charge.' };
    }

    // Deduct supply
    game.supplies--;

    // Clear any dwarf references to the block
    for (const e of game.world.query('dwarf')) {
      const d = e.get<DwarfComponent>('dwarf')!;
      if (d.overheadEntityId === block.id) d.overheadEntityId = null;
      if (d.tetheredEntityId === block.id) d.tetheredEntityId = null;
      if (d.carryingEntityId === block.id) d.carryingEntityId = null;
    }

    // Despawn the block
    game.world.despawn(block.id);

    // Remember dwarf's old position for rubble spawn
    const oldX = pos.x;
    const oldY = pos.y;

    // Move dwarf to block's old position
    pos.x = tx;
    pos.y = ty;

    // Spawn rubble at dwarf's old position
    const rubble = game.world.spawn();
    rubble
      .add(new PositionComponent(oldX, oldY))
      .add(new MovableComponent(0))
      .add(new BlockTypeComponent(BlockMaterial.Rubble))
      .add(new RubbleComponent());

    game.log.add('action', `${dwarfComp.name} detonates a shaped charge ${this.direction}.`);
    return { success: true, message: 'Shaped charge detonated.' };
  }
}
