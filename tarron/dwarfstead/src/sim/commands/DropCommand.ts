import type { Command } from './Command';
import type { Game } from '../Game';
import type { CommandResult } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { BlockTypeComponent } from '../components/BlockType';
import { isRappelling } from '../helpers';

export class DropCommand implements Command {
  readonly name = 'drop';

  execute(game: Game): CommandResult {
    if (isRappelling(game)) return { success: false, message: 'Cannot drop while on a rope.' };
    const dwarf = game.getMainDwarf();
    if (!dwarf) return { success: false, message: 'No main dwarf found.' };

    const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;
    const pos = dwarf.get<PositionComponent>('position')!;

    if (dwarfComp.carryingEntityId === null) {
      return { success: false, message: 'Not carrying anything.' };
    }

    const item = game.world.getEntity(dwarfComp.carryingEntityId);
    if (!item) {
      dwarfComp.carryingEntityId = null;
      return { success: false, message: 'Carried item no longer exists.' };
    }

    // Place item at dwarf's position
    const itemPos = item.get<PositionComponent>('position')!;
    itemPos.x = pos.x;
    itemPos.y = pos.y;

    const bt = item.get<BlockTypeComponent>('blockType');
    const desc = bt ? bt.material : 'item';

    dwarfComp.carryingEntityId = null;

    game.log.add('action', `${dwarfComp.name} drops ${desc}.`);
    return { success: true, message: `Dropped ${desc}.` };
  }
}
