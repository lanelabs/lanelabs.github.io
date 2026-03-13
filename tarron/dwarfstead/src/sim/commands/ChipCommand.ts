import type { Command } from './Command';
import type { Game } from '../Game';
import { DirectionVec, type CommandResult, type Direction } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { ChippingComponent } from '../components/Chipping';
import { findMovableAt, hasLooseBlockOnTop } from '../helpers';

export class ChipCommand implements Command {
  readonly name = 'chip';

  constructor(private direction: Direction) {}

  execute(game: Game): CommandResult {
    const dwarf = game.getMainDwarf();
    if (!dwarf) return { success: false, message: 'No main dwarf found.' };

    const pos = dwarf.get<PositionComponent>('position')!;
    const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;

    if (dwarf.has('chipping')) {
      return { success: false, message: 'Already chipping a block.' };
    }

    const delta = DirectionVec[this.direction];
    const tx = pos.x + delta.x;
    const ty = pos.y + delta.y;

    const block = findMovableAt(game, tx, ty);
    if (!block) {
      return { success: false, message: 'No loose block there to chip.' };
    }

    if (block.has('rubble')) {
      return { success: false, message: 'Rubble cannot be chipped.' };
    }

    if (hasLooseBlockOnTop(game, tx, ty)) {
      return { success: false, message: 'Another block is stacked on top.' };
    }

    dwarf.add(new ChippingComponent(block.id, this.direction));

    game.log.add('action', `${dwarfComp.name} begins chipping away at a block ${this.direction}.`);
    return { success: true, message: 'Started chipping.' };
  }
}
