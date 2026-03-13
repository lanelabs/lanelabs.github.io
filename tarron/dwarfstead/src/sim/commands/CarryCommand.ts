import type { Command } from './Command';
import type { Game } from '../Game';
import type { CommandResult } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { MovableComponent } from '../components/Movable';
import { BlockTypeComponent } from '../components/BlockType';
import { isRappelling } from '../helpers';

export class CarryCommand implements Command {
  readonly name = 'carry';

  execute(game: Game): CommandResult {
    if (isRappelling(game)) return { success: false, message: 'Cannot carry while on a rope.' };
    const dwarf = game.getMainDwarf();
    if (!dwarf) return { success: false, message: 'No main dwarf found.' };

    const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;
    const pos = dwarf.get<PositionComponent>('position')!;

    // Untether if tethered — can't carry while holding a rope
    if (dwarfComp.tetheredEntityId !== null) {
      dwarfComp.tetheredEntityId = null;
      game.log.add('action', `${dwarfComp.name} drops the rope.`);
    }

    if (dwarfComp.carryingEntityId !== null) {
      return { success: false, message: 'Already carrying something. Drop it first.' };
    }

    // Find a lightweight movable at this position
    const items = game.world.query('position', 'movable').filter((e) => {
      const p = e.get<PositionComponent>('position')!;
      const m = e.get<MovableComponent>('movable')!;
      return p.x === pos.x && p.y === pos.y && m.weight <= 1;
    });

    if (items.length === 0) {
      return { success: false, message: 'Nothing here light enough to carry.' };
    }

    const item = items[0];
    dwarfComp.carryingEntityId = item.id;

    const bt = item.get<BlockTypeComponent>('blockType');
    const desc = bt ? bt.material : 'item';

    game.log.add('action', `${dwarfComp.name} picks up ${desc}.`);
    return { success: true, message: `Picked up ${desc}.` };
  }
}
