import type { Command } from './Command';
import type { Game } from '../Game';
import { Direction, DirectionVec, BlockMaterial, type CommandResult } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { findMovableAt, hasLooseBlockOnTop, isRappelling } from '../helpers';

export class PushCommand implements Command {
  readonly name = 'push';

  constructor(private direction: Direction) {}

  execute(game: Game): CommandResult {
    if (isRappelling(game)) return { success: false, message: 'Cannot push while on a rope.' };
    const dwarf = game.getMainDwarf();
    if (!dwarf) return { success: false, message: 'No main dwarf found.' };

    const pos = dwarf.get<PositionComponent>('position')!;
    const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;
    const delta = DirectionVec[this.direction];

    // Position of the block to push
    const blockX = pos.x + delta.x;
    const blockY = pos.y + delta.y;

    const target = findMovableAt(game, blockX, blockY);
    if (!target) {
      return { success: false, message: 'Nothing to push there.' };
    }

    // Reject if block has a loose block on top
    if (hasLooseBlockOnTop(game, blockX, blockY)) {
      return { success: false, message: 'Too heavy — another block is stacked on top.' };
    }

    // Destination for the pushed block (one further in push direction)
    const destX = blockX + delta.x;
    const destY = blockY + delta.y;

    // Check destination is air and in bounds
    const destBlock = game.getBlock({ x: destX, y: destY });
    if (destBlock !== BlockMaterial.Air) {
      return { success: false, message: 'No room to push — blocked.' };
    }

    // Check destination isn't flooded
    if (game.isFlooded({ x: destX, y: destY })) {
      return { success: false, message: 'Cannot push into water.' };
    }

    const targetPos = target.get<PositionComponent>('position')!;
    targetPos.x = destX;
    targetPos.y = destY;

    game.log.add('action', `${dwarfComp.name} pushes a block ${this.direction}.`);
    return { success: true, message: `Pushed block ${this.direction}.` };
  }
}
